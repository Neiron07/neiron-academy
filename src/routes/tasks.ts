import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError, forbidden, notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { POOL_TASK_LIMIT } from '../lib/tasks.js';

const TASK_FIELDS = `
  t.id, t.title, t.description, t.status, t.type, t.priority, t.position,
  t.assignee_id, au.full_name as assignee_name,
  t.created_by, cu.full_name as creator_name,
  t.due_at, t.template_id, t.source_key, t.completed_at, t.created_at, t.updated_at
`;

const TASK_JOIN = `
  from tasks t
  left join users au on au.id = t.assignee_id
  left join users cu on cu.id = t.created_by
`;

/** Раздел «Задачи» — общий для admin/teacher/marketer, с разными правами внутри. */
export default async function taskRoutes(app: FastifyInstance) {
  const employee = app.auth(['admin', 'teacher', 'marketer']);
  const manager = app.auth(['admin']);

  /**
   * Админ видит все задачи. Остальные — свои (назначенные/личные/взятые из пула)
   * плюс открытый пул, из которого ещё можно что-то взять.
   */
  app.get('/', { preHandler: employee }, async (req) => {
    const isAdmin = req.user!.role === 'admin';
    return query(
      `select ${TASK_FIELDS} ${TASK_JOIN}
        where $1::boolean
           or t.assignee_id = $2
           or (t.assignee_id is null and t.status not in ('done','canceled'))
        order by t.position asc`,
      [isAdmin, req.user!.id]);
  });

  app.post('/', { preHandler: employee }, async (req) => {
    const body = z.object({
      title: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      type: z.enum(['assigned', 'pool', 'personal']).default('personal'),
      assignee_id: z.string().uuid().optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      due_at: z.string().datetime().optional(),
    }).parse(req.body);

    const isAdmin = req.user!.role === 'admin';
    let assigneeId: string | null;

    if (body.type === 'personal') {
      assigneeId = req.user!.id;
    } else if (body.type === 'assigned') {
      if (!isAdmin) throw forbidden();
      if (!body.assignee_id) throw new AppError(400, 'ASSIGNEE_REQUIRED', 'Выберите, кому назначить задачу');
      assigneeId = body.assignee_id;
    } else {
      // pool
      if (!isAdmin) throw forbidden();
      assigneeId = null;
    }

    const created = await one(
      `insert into tasks (title, description, type, priority, assignee_id, created_by, due_at)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id`,
      [body.title, body.description ?? null, body.type, body.priority, assigneeId, req.user!.id, body.due_at ?? null]);

    await audit({ actorId: req.user!.id, action: 'task.create', entity: 'tasks', entityId: created!.id });
    return one(`select ${TASK_FIELDS} ${TASK_JOIN} where t.id = $1`, [created!.id]);
  });

  app.patch('/:id', { preHandler: employee }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      title: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: z.enum(['new', 'in_progress', 'review', 'done', 'canceled']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assignee_id: z.string().uuid().optional(),
      due_at: z.string().datetime().nullable().optional(),
      position: z.number().optional(),
    }).parse(req.body);

    const existing = await one<{ id: string; type: string; assignee_id: string | null; created_by: string | null }>(
      `select id, type, assignee_id, created_by from tasks where id = $1`, [id]);
    if (!existing) throw notFound('Задача');

    const isAdmin = req.user!.role === 'admin';
    const isAssignee = existing.assignee_id === req.user!.id;
    const isOwnPersonal = existing.type === 'personal' && existing.created_by === req.user!.id;

    // Свой статус и порядок карточки (двигать/переставлять у себя) может менять
    // исполнитель или админ — это не редактирование содержания задачи.
    const changesStatusOrPositionOnly = Object.keys(body).every((k) => k === 'status' || k === 'position');
    if (!isAdmin && !(changesStatusOrPositionOnly && isAssignee) && !isOwnPersonal) throw forbidden();

    // Переназначение исполнителя — только админ.
    if (body.assignee_id !== undefined && !isAdmin) throw forbidden();

    const updated = await one(
      `update tasks set
         title = coalesce($2, title),
         description = coalesce($3, description),
         status = coalesce($4, status)::task_status,
         priority = coalesce($5, priority)::task_priority,
         assignee_id = coalesce($6, assignee_id),
         due_at = coalesce($7, due_at),
         position = coalesce($8, position),
         completed_at = case when $4::text = 'done' then now()
                              when $4::text is not null then null
                              else completed_at end,
         updated_at = now()
       where id = $1
       returning id`,
      [id, body.title ?? null, body.description ?? null, body.status ?? null, body.priority ?? null,
       body.assignee_id ?? null, body.due_at ?? null, body.position ?? null]);

    // Чистая перестановка (только position, без смены статуса) — это просто личный
    // порядок карточек в колонке, не бизнес-действие. Логировать её в журнал незачем:
    // при активном перетаскивании она забила бы журнал десятками записей «task.update».
    const isPositionOnlyChange = Object.keys(body).length === 1 && body.position !== undefined;
    if (!isPositionOnlyChange) {
      await audit({ actorId: req.user!.id, action: 'task.update', entity: 'tasks', entityId: id, diff: body });
    }
    return one(`select ${TASK_FIELDS} ${TASK_JOIN} where t.id = $1`, [updated!.id]);
  });

  /** Взять задачу из пула — с лимитом на открытые взятые задачи на человека. */
  app.post('/:id/take', { preHandler: employee }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const task = await one<{ id: string; assignee_id: string | null; status: string }>(
      `select id, assignee_id, status from tasks where id = $1`, [id]);
    if (!task) throw notFound('Задача');
    if (task.assignee_id !== null) throw new AppError(409, 'ALREADY_TAKEN', 'Задачу уже кто-то взял');
    if (task.status === 'done' || task.status === 'canceled') {
      throw new AppError(400, 'TASK_CLOSED', 'Задача уже закрыта');
    }

    const openCount = await one<{ cnt: number }>(
      `select count(*)::int as cnt from tasks
        where assignee_id = $1 and status not in ('done','canceled')
          and type in ('pool','automatic','recurring')`, [req.user!.id]);
    if ((openCount?.cnt ?? 0) >= POOL_TASK_LIMIT) {
      throw new AppError(400, 'POOL_LIMIT', `Нельзя взять больше ${POOL_TASK_LIMIT} задач из пула одновременно — сначала закройте текущие`);
    }

    const updated = await one<{ id: string }>(
      `update tasks set
         assignee_id = $2,
         status = case when status = 'new' then 'in_progress' else status end,
         updated_at = now()
       where id = $1 and assignee_id is null
       returning id`,
      [id, req.user!.id]);
    if (!updated) throw new AppError(409, 'ALREADY_TAKEN', 'Задачу уже кто-то взял');

    await audit({ actorId: req.user!.id, action: 'task.take', entity: 'tasks', entityId: id });
    return one(`select ${TASK_FIELDS} ${TASK_JOIN} where t.id = $1`, [id]);
  });

  /** Вернуть взятую из пула задачу обратно — снова без исполнителя. */
  app.post('/:id/release', { preHandler: employee }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const task = await one<{ id: string; type: string; assignee_id: string | null }>(
      `select id, type, assignee_id from tasks where id = $1`, [id]);
    if (!task) throw notFound('Задача');
    if (task.type === 'assigned') throw new AppError(400, 'NOT_RELEASABLE', 'Назначенную задачу может снять только руководитель');
    if (task.assignee_id !== req.user!.id && req.user!.role !== 'admin') throw forbidden();

    await query(
      `update tasks set assignee_id = null, status = 'new', updated_at = now() where id = $1`, [id]);

    await audit({ actorId: req.user!.id, action: 'task.release', entity: 'tasks', entityId: id });
    return one(`select ${TASK_FIELDS} ${TASK_JOIN} where t.id = $1`, [id]);
  });

  app.delete('/:id', { preHandler: employee }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const task = await one<{ id: string; type: string; created_by: string | null }>(
      `select id, type, created_by from tasks where id = $1`, [id]);
    if (!task) throw notFound('Задача');

    const isAdmin = req.user!.role === 'admin';
    const isOwnPersonal = task.type === 'personal' && task.created_by === req.user!.id;
    if (!isAdmin && !isOwnPersonal) throw forbidden();

    await query(`delete from tasks where id = $1`, [id]);
    await audit({ actorId: req.user!.id, action: 'task.delete', entity: 'tasks', entityId: id });
    return { ok: true };
  });

  // ============================================== ШАБЛОНЫ (повторяющиеся)
  app.get('/templates', { preHandler: manager }, async () => {
    return query(
      `select tt.id, tt.title, tt.description, tt.priority, tt.weekday, tt.is_active,
              tt.assignee_id, u.full_name as assignee_name, tt.created_at
         from task_templates tt
    left join users u on u.id = tt.assignee_id
        order by tt.weekday, tt.title`);
  });

  app.post('/templates', { preHandler: manager }, async (req) => {
    const body = z.object({
      title: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      assignee_id: z.string().uuid().optional(),
      weekday: z.number().int().min(1).max(7),
    }).parse(req.body);

    const created = await one(
      `insert into task_templates (title, description, priority, assignee_id, weekday, created_by)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [body.title, body.description ?? null, body.priority, body.assignee_id ?? null, body.weekday, req.user!.id]);

    await audit({ actorId: req.user!.id, action: 'task_template.create', entity: 'task_templates', entityId: created!.id });
    return created;
  });

  app.patch('/templates/:id', { preHandler: manager }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      title: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assignee_id: z.string().uuid().nullable().optional(),
      weekday: z.number().int().min(1).max(7).optional(),
      is_active: z.boolean().optional(),
    }).parse(req.body);

    const existing = await one<{ id: string }>(`select id from task_templates where id = $1`, [id]);
    if (!existing) throw notFound('Шаблон');

    const updated = await one(
      `update task_templates set
         title = coalesce($2, title),
         description = coalesce($3, description),
         priority = coalesce($4, priority)::task_priority,
         assignee_id = coalesce($5, assignee_id),
         weekday = coalesce($6, weekday),
         is_active = coalesce($7, is_active)
       where id = $1 returning *`,
      [id, body.title ?? null, body.description ?? null, body.priority ?? null,
       body.assignee_id ?? null, body.weekday ?? null, body.is_active ?? null]);

    await audit({ actorId: req.user!.id, action: 'task_template.update', entity: 'task_templates', entityId: id, diff: body });
    return updated;
  });

  app.delete('/templates/:id', { preHandler: manager }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const deleted = await one(`delete from task_templates where id = $1 returning id`, [id]);
    if (!deleted) throw notFound('Шаблон');
    await audit({ actorId: req.user!.id, action: 'task_template.delete', entity: 'task_templates', entityId: id });
    return { ok: true };
  });
}

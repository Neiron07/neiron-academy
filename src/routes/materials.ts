import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError } from '../lib/errors.js';

/** Материалы к уроку/группе: ссылка или заметка, которую препод оставляет ученикам. */
export default async function materialsRoutes(app: FastifyInstance) {
  const staff = app.auth(['teacher', 'admin']);

  app.post('/', { preHandler: staff }, async (req) => {
    const body = z.object({
      group_id: z.string().uuid(),
      lesson_id: z.string().uuid().optional(),
      title: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      url: z.string().url().optional(),
    }).parse(req.body);

    if (req.user!.role === 'teacher') {
      const own = await one(`select 1 from groups where id=$1 and teacher_id=$2`, [body.group_id, req.user!.id]);
      if (!own) throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }

    return one(
      `insert into materials (group_id, lesson_id, title, description, url, created_by)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [body.group_id, body.lesson_id ?? null, body.title, body.description ?? null, body.url ?? null, req.user!.id]);
  });

  app.get('/', { preHandler: staff }, async (req) => {
    const q = z.object({ group_id: z.string().uuid() }).parse(req.query);
    if (req.user!.role === 'teacher') {
      const own = await one(`select 1 from groups where id=$1 and teacher_id=$2`, [q.group_id, req.user!.id]);
      if (!own) throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }
    return query(
      `select id, group_id, lesson_id, title, description, url, created_at
         from materials where group_id=$1 order by created_at desc`, [q.group_id]);
  });

  app.delete('/:id', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const mat = await one<{ group_id: string; teacher_id: string | null }>(
      `select m.group_id, g.teacher_id from materials m join groups g on g.id=m.group_id where m.id=$1`, [id]);
    if (!mat) throw new AppError(404, 'NOT_FOUND', 'Материал не найден');
    if (req.user!.role === 'teacher' && mat.teacher_id !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }
    await query(`delete from materials where id=$1`, [id]);
    return { ok: true };
  });

  /** Материалы своей группы — для ученика. */
  app.get('/my', { preHandler: app.auth(['student']) }, async (req) => {
    return query(
      `select m.id, m.title, m.description, m.url, m.created_at
         from materials m
         join enrollments e on e.group_id = m.group_id and e.status='active'
        where e.student_id = $1
        order by m.created_at desc`, [req.user!.id]);
  });
}

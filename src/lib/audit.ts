import { query } from '../db.js';

export async function audit(params: {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  diff?: unknown;
  ip?: string;
}) {
  try {
    await query(
      `insert into audit_log (actor_id, action, entity, entity_id, diff, ip)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        params.actorId ?? null,
        params.action,
        params.entity ?? null,
        params.entityId ?? null,
        params.diff ? JSON.stringify(params.diff) : null,
        params.ip ?? null,
      ],
    );
  } catch {
    // Аудит никогда не должен ронять основной запрос.
  }
}

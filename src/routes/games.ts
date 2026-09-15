import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';

/** Верхняя граница на всякий случай — не подсчёт честности, просто защита от мусорных значений. */
const MAX_SCORE = 1_000_000;

/** Раздел «Игры» в кабинете ученика — очки за игровую сессию + топ-10 школы. */
export default async function gamesRoutes(app: FastifyInstance) {
  const student = app.auth(['student']);

  app.post('/:game/score', { preHandler: student }, async (req) => {
    const { game } = z.object({ game: z.string().min(1).max(30) }).parse(req.params);
    const body = z.object({ score: z.number().int().min(0).max(MAX_SCORE) }).parse(req.body);

    await query(`insert into game_scores (student_id, game, score) values ($1,$2,$3)`,
      [req.user!.id, game, body.score]);

    const best = await one<{ best: number }>(
      `select coalesce(max(score),0)::int as best from game_scores where student_id=$1 and game=$2`,
      [req.user!.id, game]);

    return { ok: true, best: best?.best ?? body.score, isNewBest: (best?.best ?? 0) <= body.score };
  });

  /**
   * Топ-10 школы по лучшему результату + отдельная строка самого ученика,
   * если он не попал в десятку (та же логика, что и в /me/rating).
   */
  app.get('/:game/leaderboard', { preHandler: student }, async (req) => {
    const { game } = z.object({ game: z.string().min(1).max(30) }).parse(req.params);
    const id = req.user!.id;

    const rows = await query(
      `with best as (
         select gs.student_id, max(gs.score) as score
           from game_scores gs
           join users u on u.id = gs.student_id
          where gs.game = $1 and u.is_active
          group by gs.student_id
       ),
       ranked as (
         select u.full_name, b.score, (b.student_id = $2) as is_me,
                rank() over (order by b.score desc) as position
           from best b join users u on u.id = b.student_id
       )
       select * from ranked where position <= 10 or is_me order by position`,
      [game, id]);

    const myBest = await one<{ best: number }>(
      `select coalesce(max(score),0)::int as best from game_scores where student_id=$1 and game=$2`,
      [id, game]);

    return {
      myBest: myBest?.best ?? 0,
      rows: rows.map((r: any) => ({
        position: Number(r.position),
        full_name: r.full_name,
        score: Number(r.score),
        is_me: r.is_me,
      })),
    };
  });
}

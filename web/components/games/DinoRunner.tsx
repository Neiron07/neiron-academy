'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { GameLeaderboardResponse, GameScoreResponse } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const GAME = 'dino';

// -------------------------------------------------------------- палитра
const BG = '#150930';
const GROUND = '#5A36A2';
const BODY = '#7444D4';
const WHITE = '#F8F7F9';
const VIRUS = '#F87171';

// ------------------------------------------------------------- геометрия
const CHAR_W = 34;
const CHAR_H = 38;
const GROUND_OFFSET = 28; // от низа канваса
const GRAVITY = 2200; // px/s^2
const JUMP_VELOCITY = -760; // px/s
const BASE_SPEED = 260; // px/s
const MAX_SPEED = 620;
const FLY_SCORE_THRESHOLD = 150; // с этого счёта появляются летающие вирусы

interface Obstacle {
  x: number;
  y: number;
  r: number;
  flying: boolean;
  passed: boolean;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawNeiron(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = BODY;
  roundRect(ctx, x, y, CHAR_W, CHAR_H, 9);
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, CHAR_W, CHAR_H, 9);
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(x + CHAR_W * 0.32, y + CHAR_H * 0.4, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + CHAR_W * 0.68, y + CHAR_H * 0.4, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + CHAR_W / 2, y);
  ctx.lineTo(x + CHAR_W / 2, y - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + CHAR_W / 2, y - 12, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawVirus(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.strokeStyle = VIRUS;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    ctx.lineTo(x + Math.cos(ang) * (r * 1.55), y + Math.sin(ang) * (r * 1.55));
    ctx.stroke();
  }
  ctx.fillStyle = VIRUS;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.28, y + r * 0.12, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

export function DinoRunner() {
  const qc = useQueryClient();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const { data: board } = useQuery({
    queryKey: ['game-leaderboard', GAME],
    queryFn: () => api.get<GameLeaderboardResponse>(`/games/${GAME}/leaderboard`),
  });

  const submitScore = useMutation({
    mutationFn: (s: number) => api.post<GameScoreResponse>(`/games/${GAME}/score`, { score: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['game-leaderboard', GAME] }),
    onError: () => toast('Не удалось сохранить результат — счёт всё равно засчитан за эту игру', 'error'),
  });

  // Игровое состояние живёт в ref, чтобы не перерисовывать React на каждый кадр.
  const state = useRef({
    charY: 0,
    velocityY: 0,
    isJumping: false,
    speed: BASE_SPEED,
    obstacles: [] as Obstacle[],
    lastSpawn: 0,
    elapsed: 0,
    groundScroll: 0,
    lastTs: 0,
    scoreAcc: 0,
  });

  const submittedRef = useRef(false);

  const jump = useCallback(() => {
    if (!running || gameOver) return;
    const st = state.current;
    if (!st.isJumping) {
      st.velocityY = JUMP_VELOCITY;
      st.isJumping = true;
    }
  }, [running, gameOver]);

  function startGame() {
    const canvas = canvasRef.current;
    const groundY = (canvas?.height ?? 220) - GROUND_OFFSET;
    state.current = {
      charY: groundY - CHAR_H,
      velocityY: 0,
      isJumping: false,
      speed: BASE_SPEED,
      obstacles: [],
      lastSpawn: 0,
      elapsed: 0,
      groundScroll: 0,
      lastTs: 0,
      scoreAcc: 0,
    };
    submittedRef.current = false;
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !running) return;
    const context2d = canvas.getContext('2d');
    if (!context2d) return;
    const ctx = context2d;

    const width = canvas.width;
    const height = canvas.height;
    const groundY = height - GROUND_OFFSET;
    let raf = 0;

    function frame(ts: number) {
      const st = state.current;
      if (!st.lastTs) st.lastTs = ts;
      const dt = Math.min(0.05, (ts - st.lastTs) / 1000);
      st.lastTs = ts;
      st.elapsed += dt;

      // ------------------------------------------------------- физика
      st.velocityY += GRAVITY * dt;
      st.charY += st.velocityY * dt;
      if (st.charY > groundY - CHAR_H) {
        st.charY = groundY - CHAR_H;
        st.velocityY = 0;
        st.isJumping = false;
      }

      st.speed = Math.min(MAX_SPEED, BASE_SPEED + st.scoreAcc * 0.35);
      st.groundScroll = (st.groundScroll + st.speed * dt) % 24;

      // ------------------------------------------------------- очки
      st.scoreAcc += dt * 12;
      const newScore = Math.floor(st.scoreAcc);

      // -------------------------------------------------- спавн врагов
      st.lastSpawn += dt;
      const minGap = Math.max(0.75, 1.5 - st.speed / 900);
      if (st.lastSpawn > minGap + Math.random() * 0.6) {
        st.lastSpawn = 0;
        const canFly = newScore > FLY_SCORE_THRESHOLD && Math.random() < 0.4;
        const r = 14 + Math.random() * 6;
        st.obstacles.push({
          x: width + r,
          y: canFly ? groundY - CHAR_H - 26 : groundY - r,
          r,
          flying: canFly,
          passed: false,
        });
      }

      // ------------------------------------------------- движение врагов
      const charX = 40;
      let collided = false;
      st.obstacles = st.obstacles.filter((o) => {
        o.x -= st.speed * dt;
        // AABB против описанного вокруг вируса квадрата
        const ox1 = o.x - o.r, ox2 = o.x + o.r, oy1 = o.y - o.r, oy2 = o.y + o.r;
        const cx1 = charX, cx2 = charX + CHAR_W, cy1 = st.charY, cy2 = st.charY + CHAR_H;
        if (ox2 > cx1 && ox1 < cx2 && oy2 > cy1 && oy1 < cy2) collided = true;
        return o.x > -o.r * 2;
      });

      // ------------------------------------------------------- отрисовка
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = GROUND;
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -st.groundScroll;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(width, groundY + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const o of st.obstacles) drawVirus(ctx, o.x, o.y, o.r);
      drawNeiron(ctx, charX, st.charY);

      ctx.fillStyle = WHITE;
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(newScore), width - 12, 24);

      if (newScore !== score) setScore(newScore);

      if (collided) {
        setFinalScore(newScore);
        setGameOver(true);
        setRunning(false);
        if (!submittedRef.current) {
          submittedRef.current = true;
          submitScore.mutate(newScore);
        }
        return;
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!running && !gameOver) startGame();
        else if (gameOver) startGame();
        else jump();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, gameOver, jump]);

  function handlePointer() {
    if (!running && !gameOver) startGame();
    else if (gameOver) startGame();
    else jump();
  }

  const top10 = board?.rows.filter((r) => r.position <= 10) ?? [];
  const myRow = board?.rows.find((r) => r.is_me && r.position > 10);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-purple-mid" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={220}
          onPointerDown={handlePointer}
          className="block w-full cursor-pointer"
          style={{ aspectRatio: '360 / 220' }}
        />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 p-4 text-center">
            {gameOver ? (
              <>
                <p className="font-display text-2xl font-bold text-white">Игра окончена</p>
                <p className="text-lavender">
                  Счёт: <span className="font-semibold text-white">{finalScore}</span>
                  {board && finalScore >= board.myBest && <span className="ml-1 text-sm text-purple">новый рекорд!</span>}
                </p>
                <Button onClick={startGame}>
                  <RotateCcw className="size-4" aria-hidden /> Играть снова
                </Button>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-semibold text-white">Убеги от вирусов</p>
                <p className="max-w-xs text-sm text-lavender">
                  Жми пробел, стрелку вверх или тапни по экрану, чтобы Нейрон перепрыгнул вирус
                </p>
                <Button onClick={startGame}>Начать игру</Button>
              </>
            )}
          </div>
        )}
      </div>

      {board && board.myBest > 0 && (
        <p className="mt-3 text-center text-sm text-lavender">
          Твой рекорд: <span className="font-semibold text-white">{board.myBest}</span>
        </p>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-lavender">
          <Trophy className="size-4" aria-hidden /> Топ-10 школы
        </div>
        <div className="space-y-1.5">
          {top10.map((r) => (
            <div
              key={r.position}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${r.is_me ? 'border-purple bg-purple/10' : 'border-purple-mid'}`}
            >
              <span className="flex items-center gap-2 text-white">
                <span className="text-muted">{r.position}.</span> {r.full_name}
                {r.is_me && <span className="text-lavender">это ты</span>}
              </span>
              <span className="font-display font-semibold text-white">{r.score}</span>
            </div>
          ))}
          {myRow && (
            <div className="flex items-center justify-between rounded-xl border border-purple bg-purple/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-white">
                <span className="text-muted">{myRow.position}.</span> {myRow.full_name} <span className="text-lavender">это ты</span>
              </span>
              <span className="font-display font-semibold text-white">{myRow.score}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

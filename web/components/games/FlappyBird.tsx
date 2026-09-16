'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { GameLeaderboardResponse, GameScoreResponse } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const GAME = 'flappy';

// -------------------------------------------------------------- палитра
const BG = '#150930';
const PIPE = '#5A36A2';
const PIPE_EDGE = '#B4A4D7';
const BODY = '#7444D4';
const WHITE = '#F8F7F9';

// ------------------------------------------------------------- геометрия
const BIRD_X = 70;
const BIRD_W = 30;
const BIRD_H = 26;
const GRAVITY = 1500; // px/s^2
const FLAP_VELOCITY = -390; // px/s
const SPEED = 165; // px/s, постоянная — как в оригинале
const PIPE_W = 46;
const GAP_H = 118;
const PIPE_INTERVAL = 1.55; // сек между трубами при постоянной скорости

interface Pipe {
  x: number;
  gapY: number;
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

function drawNeiron(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x + BIRD_W / 2, y + BIRD_H / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = BODY;
  roundRect(ctx, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H, 8);
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  roundRect(ctx, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H, 8);
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(BIRD_W * 0.12, -BIRD_H * 0.08, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -BIRD_H / 2);
  ctx.lineTo(0, -BIRD_H / 2 - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -BIRD_H / 2 - 10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, gapY: number, groundY: number) {
  ctx.fillStyle = PIPE;
  ctx.strokeStyle = PIPE_EDGE;
  ctx.lineWidth = 2;
  // верхняя труба
  ctx.fillRect(x, 0, PIPE_W, gapY - GAP_H / 2);
  ctx.strokeRect(x, 0, PIPE_W, gapY - GAP_H / 2);
  // нижняя труба
  const bottomY = gapY + GAP_H / 2;
  ctx.fillRect(x, bottomY, PIPE_W, groundY - bottomY);
  ctx.strokeRect(x, bottomY, PIPE_W, groundY - bottomY);
}

export function FlappyBird() {
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

  const state = useRef({
    birdY: 0,
    velocityY: 0,
    pipes: [] as Pipe[],
    lastSpawn: 0,
    lastTs: 0,
    scoreAcc: 0,
  });

  const submittedRef = useRef(false);

  const flap = useCallback(() => {
    if (!running || gameOver) return;
    state.current.velocityY = FLAP_VELOCITY;
  }, [running, gameOver]);

  function startGame() {
    const canvas = canvasRef.current;
    const height = canvas?.height ?? 220;
    state.current = {
      birdY: height / 2 - BIRD_H / 2,
      velocityY: 0,
      pipes: [],
      lastSpawn: 0,
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
    const groundOffset = 14;
    const groundY = height - groundOffset;
    let raf = 0;

    function frame(ts: number) {
      const st = state.current;
      if (!st.lastTs) st.lastTs = ts;
      const dt = Math.min(0.05, (ts - st.lastTs) / 1000);
      st.lastTs = ts;

      // ------------------------------------------------------- физика
      st.velocityY += GRAVITY * dt;
      st.birdY += st.velocityY * dt;

      // -------------------------------------------------- спавн труб
      st.lastSpawn += dt;
      if (st.lastSpawn > PIPE_INTERVAL) {
        st.lastSpawn = 0;
        const margin = 36;
        const gapY = margin + GAP_H / 2 + Math.random() * (groundY - margin * 2 - GAP_H);
        st.pipes.push({ x: width + PIPE_W, gapY, passed: false });
      }

      // ------------------------------------------------- движение труб
      let collided = st.birdY < 0 || st.birdY + BIRD_H > groundY;
      let scoredThisFrame = false;
      st.pipes = st.pipes.filter((p) => {
        p.x -= SPEED * dt;
        const bx1 = BIRD_X, bx2 = BIRD_X + BIRD_W, by1 = st.birdY, by2 = st.birdY + BIRD_H;
        const topH = p.gapY - GAP_H / 2;
        const bottomY = p.gapY + GAP_H / 2;
        const inX = bx2 > p.x && bx1 < p.x + PIPE_W;
        if (inX && (by1 < topH || by2 > bottomY)) collided = true;
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          p.passed = true;
          scoredThisFrame = true;
        }
        return p.x > -PIPE_W;
      });
      if (scoredThisFrame) st.scoreAcc += 1;
      const newScore = st.scoreAcc;

      // ------------------------------------------------------- отрисовка
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      for (const p of st.pipes) drawPipe(ctx, p.x, p.gapY, groundY);

      ctx.strokeStyle = PIPE_EDGE;
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(width, groundY + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const tilt = Math.max(-0.5, Math.min(0.9, st.velocityY / 700));
      drawNeiron(ctx, BIRD_X, st.birdY, tilt);

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
        else flap();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, gameOver, flap]);

  function handlePointer() {
    if (!running && !gameOver) startGame();
    else if (gameOver) startGame();
    else flap();
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
                <p className="font-display text-xl font-semibold text-white">Нейрон-полёт</p>
                <p className="max-w-xs text-sm text-lavender">
                  Жми пробел, стрелку вверх или тапни по экрану, чтобы Нейрон пролетел между труб
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

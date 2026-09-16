'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { GameLeaderboardResponse, GameScoreResponse } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const GAME = '2048';
const SIZE = 4;

// Фирменная палитра вместо классической жёлто-оранжевой 2048 — плитки темнее
// к светлее по мере роста значения, после 2048 переходим на янтарный акцент
// (тот же, что и у индикаторов «скоро оплата» — единственное сознательное
// исключение из 7-цветной палитры, здесь как награда за рекордную плитку).
const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: '#241542', text: '#F8F7F9' },
  4: { bg: '#301B58', text: '#F8F7F9' },
  8: { bg: '#3D2270', text: '#F8F7F9' },
  16: { bg: '#4A2989', text: '#F8F7F9' },
  32: { bg: '#5A36A2', text: '#F8F7F9' },
  64: { bg: '#7444D4', text: '#F8F7F9' },
  128: { bg: '#8B5CE0', text: '#F8F7F9' },
  256: { bg: '#A374E8', text: '#150930' },
  512: { bg: '#B98BF0', text: '#150930' },
  1024: { bg: '#CBA4F5', text: '#150930' },
  2048: { bg: '#F8F7F9', text: '#150930' },
};
const BEYOND_COLOR = { bg: '#FBBF24', text: '#150930' };

function tileColor(v: number) {
  return TILE_COLORS[v] ?? BEYOND_COLOR;
}

type Board = number[][];

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function emptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r]![c] === 0) cells.push([r, c]);
  return cells;
}

function spawnTile(board: Board): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]!;
  const next = board.map((row) => [...row]);
  next[r]![c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

/** Сдвиг+слияние одной строки влево. Каждая плитка сливается не больше раза за ход. */
function slideRowLeft(row: number[]): { row: number[]; gained: number; moved: boolean } {
  const nums = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums[i]! *= 2;
      gained += nums[i]!;
      nums.splice(i + 1, 1);
    }
  }
  while (nums.length < SIZE) nums.push(0);
  const moved = nums.some((v, i) => v !== row[i]);
  return { row: nums, gained, moved };
}

function transpose(board: Board): Board {
  return board[0]!.map((_, c) => board.map((row) => row[c]!));
}

function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

function slideBoardLeft(board: Board): { board: Board; gained: number; moved: boolean } {
  let gained = 0;
  let moved = false;
  const next = board.map((row) => {
    const res = slideRowLeft(row);
    gained += res.gained;
    if (res.moved) moved = true;
    return res.row;
  });
  return { board: next, gained, moved };
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; gained: number; moved: boolean } {
  if (dir === 'left') return slideBoardLeft(board);
  if (dir === 'right') {
    const r = slideBoardLeft(reverseRows(board));
    return { board: reverseRows(r.board), gained: r.gained, moved: r.moved };
  }
  if (dir === 'up') {
    const r = slideBoardLeft(transpose(board));
    return { board: transpose(r.board), gained: r.gained, moved: r.moved };
  }
  const r = slideBoardLeft(reverseRows(transpose(board)));
  return { board: transpose(reverseRows(r.board)), gained: r.gained, moved: r.moved };
}

function canMove(board: Board): boolean {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r]![c];
      if (c < SIZE - 1 && board[r]![c + 1] === v) return true;
      if (r < SIZE - 1 && board[r + 1]![c] === v) return true;
    }
  }
  return false;
}

export function Game2048() {
  const qc = useQueryClient();
  const toast = useToast();
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const submittedRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const { data: boardData } = useQuery({
    queryKey: ['game-leaderboard', GAME],
    queryFn: () => api.get<GameLeaderboardResponse>(`/games/${GAME}/leaderboard`),
  });

  const submitScore = useMutation({
    mutationFn: (s: number) => api.post<GameScoreResponse>(`/games/${GAME}/score`, { score: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['game-leaderboard', GAME] }),
    onError: () => toast('Не удалось сохранить результат — счёт всё равно засчитан за эту игру', 'error'),
  });

  function startGame() {
    let b = emptyBoard();
    b = spawnTile(b);
    b = spawnTile(b);
    setBoard(b);
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    submittedRef.current = false;
    setRunning(true);
  }

  const doMove = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (!running || gameOver) return;
      setBoard((prev) => {
        const res = move(prev, dir);
        if (!res.moved) return prev;
        const next = spawnTile(res.board);
        scoreRef.current += res.gained;
        setScore(scoreRef.current);
        if (!canMove(next)) {
          setGameOver(true);
          setRunning(false);
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitScore.mutate(scoreRef.current);
          }
        }
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [running, gameOver],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      };
      const dir = map[e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ? e.key : ''];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doMove]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const threshold = 24;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
  }

  const top10 = boardData?.rows.filter((r) => r.position <= 10) ?? [];
  const myRow = boardData?.rows.find((r) => r.is_me && r.position > 10);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-lavender">Счёт</p>
        <p className="font-display text-xl font-bold text-white">{score}</p>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-purple-mid p-2"
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2">
          {board.map((row, r) =>
            row.map((v, c) => {
              const color = v ? tileColor(v) : null;
              return (
                <div
                  key={`${r}-${c}`}
                  className="flex aspect-square items-center justify-center rounded-lg font-display font-bold"
                  style={{
                    background: color ? color.bg : 'rgba(90,54,162,0.12)',
                    color: color ? color.text : 'transparent',
                    fontSize: v >= 1024 ? 15 : v >= 100 ? 17 : 20,
                  }}
                >
                  {v || ''}
                </div>
              );
            }),
          )}
        </div>

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/85 p-4 text-center">
            {gameOver ? (
              <>
                <p className="font-display text-2xl font-bold text-white">Игра окончена</p>
                <p className="text-lavender">
                  Счёт: <span className="font-semibold text-white">{score}</span>
                  {boardData && score >= boardData.myBest && <span className="ml-1 text-sm text-purple">новый рекорд!</span>}
                </p>
                <Button onClick={startGame}>
                  <RotateCcw className="size-4" aria-hidden /> Играть снова
                </Button>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-semibold text-white">2048</p>
                <p className="max-w-xs text-sm text-lavender">
                  Стрелки или свайп — двигай плитки. Одинаковые плитки сливаются. Играй сколько угодно — без ограничения в 2048!
                </p>
                <Button onClick={startGame}>Начать игру</Button>
              </>
            )}
          </div>
        )}
      </div>

      {boardData && boardData.myBest > 0 && (
        <p className="mt-3 text-center text-sm text-lavender">
          Твой рекорд: <span className="font-semibold text-white">{boardData.myBest}</span>
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

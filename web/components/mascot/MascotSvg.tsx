import type { MascotStageCode } from '@/lib/types';

interface Props {
  stageCode: MascotStageCode;
  frame?: string | null;
  className?: string;
}

/**
 * Единый мотив по всем стадиям: голова-экран с двумя узлами и импульсом между ними —
 * нейрон, сигнал проходит и зажигает следующий. С каждой стадией цепочка узлов растёт.
 */
export function MascotSvg({ stageCode, frame, className = 'size-56' }: Props) {
  return (
    <div className={`relative ${className}`}>
      {frame && (
        <div
          aria-hidden
          className="absolute -inset-3 rounded-full border-2 border-white/70"
          style={{ boxShadow: '0 0 0 6px rgba(116,68,212,0.25)' }}
        />
      )}
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={stageLabel[stageCode]}>
        {stageCode === 'egg' && <EggStage />}
        {stageCode === 'chick' && <ChickStage />}
        {stageCode === 'student' && <StudentStage />}
        {stageCode === 'engineer' && <EngineerStage />}
        {stageCode === 'master' && <MasterStage />}
      </svg>
    </div>
  );
}

const stageLabel: Record<MascotStageCode, string> = {
  egg: 'Маскот: яйцо',
  chick: 'Маскот: робо-птенец',
  student: 'Маскот: робот-ученик',
  engineer: 'Маскот: робот-инженер',
  master: 'Маскот: робот-мастер',
};

const PURPLE = 'var(--color-purple)';
const WHITE = 'var(--color-white)';
const MID = 'var(--color-purple-mid)';
const LAVENDER = 'var(--color-lavender)';

function EggStage() {
  return (
    <g>
      <ellipse cx="100" cy="112" rx="52" ry="66" fill={PURPLE} stroke={WHITE} strokeWidth="3" />
      <path d="M78 70 L92 92 L74 100 L96 128" fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx="100" cy="110" r="5" fill={WHITE} />
    </g>
  );
}

function ChickStage() {
  return (
    <g>
      <path d="M56 130 Q56 172 100 172 Q144 172 144 130 L134 118 Q100 106 66 118 Z" fill={MID} stroke={WHITE} strokeWidth="2" opacity="0.5" />
      <circle cx="100" cy="96" r="46" fill={PURPLE} stroke={WHITE} strokeWidth="3" />
      <circle cx="84" cy="92" r="6" fill={WHITE} />
      <circle cx="116" cy="92" r="6" fill={WHITE} />
      <line x1="100" y1="50" x2="100" y2="34" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="28" r="6" fill={WHITE} />
    </g>
  );
}

function StudentStage() {
  return (
    <g>
      <rect x="62" y="112" width="76" height="60" rx="18" fill={MID} stroke={WHITE} strokeWidth="2.5" />
      <circle cx="100" cy="88" r="50" fill={PURPLE} stroke={WHITE} strokeWidth="3" />
      <circle cx="82" cy="84" r="7" fill={WHITE} />
      <circle cx="118" cy="84" r="7" fill={WHITE} />
      <path d="M84 106 Q100 116 116 106" stroke={WHITE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="100" y1="38" x2="100" y2="20" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="15" r="7" fill={WHITE} />
      <rect x="76" y="128" width="48" height="6" rx="3" fill={LAVENDER} opacity="0.7" />
    </g>
  );
}

function EngineerStage() {
  return (
    <g>
      <rect x="58" y="110" width="84" height="66" rx="20" fill={MID} stroke={WHITE} strokeWidth="2.5" />
      <circle cx="100" cy="86" r="52" fill={PURPLE} stroke={WHITE} strokeWidth="3" />
      <circle cx="80" cy="82" r="7.5" fill={WHITE} />
      <circle cx="120" cy="82" r="7.5" fill={WHITE} />
      <path d="M82 104 Q100 118 118 104" stroke={WHITE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="100" y1="34" x2="100" y2="16" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="11" r="7" fill={WHITE} />
      <line x1="107" y1="14" x2="128" y2="24" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <circle cx="132" cy="27" r="5" fill={WHITE} opacity="0.85" />
      <rect x="34" y="140" width="14" height="34" rx="6" fill={PURPLE} stroke={WHITE} strokeWidth="2" transform="rotate(-18 34 140)" />
    </g>
  );
}

function MasterStage() {
  return (
    <g>
      <path d="M44 118 Q34 172 100 182 Q166 172 156 118 L100 128 Z" fill={MID} stroke={WHITE} strokeWidth="2.5" opacity="0.85" />
      <rect x="56" y="106" width="88" height="68" rx="22" fill={MID} stroke={WHITE} strokeWidth="2.5" />
      <circle cx="100" cy="82" r="54" fill={PURPLE} stroke={WHITE} strokeWidth="3.5" />
      <circle cx="100" cy="82" r="54" fill="url(#coreGlow)" opacity="0.5" />
      <circle cx="79" cy="78" r="8" fill={WHITE} />
      <circle cx="121" cy="78" r="8" fill={WHITE} />
      <path d="M80 100 Q100 114 120 100" stroke={WHITE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="100" y1="28" x2="100" y2="10" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="6" r="7.5" fill={WHITE} />
      <line x1="108" y1="12" x2="132" y2="20" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="137" cy="22" r="5.5" fill={WHITE} />
      <line x1="92" y1="12" x2="68" y2="20" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="63" cy="22" r="5.5" fill={WHITE} />
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={WHITE} stopOpacity="0.55" />
          <stop offset="100%" stopColor={WHITE} stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
}

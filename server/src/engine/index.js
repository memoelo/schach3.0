import { createFallbackEngine } from './fallback.js';
import { log, warn } from '../utils/logger.js';

let Stockfish = null;
try {
  // optional dependency
  Stockfish = (await import('stockfish')).default || (await import('stockfish')).default;
} catch (e) {
  warn('Stockfish not available, using fallback engine.');
}

export const createEngine = ({ skill = 10, depth = 12, movetime = 200 }) => {
  if (Stockfish) {
    return createStockfishEngine({ skill, depth, movetime });
  }
  return createFallbackEngine({ depth });
};

export const createStockfishEngine = ({ skill = 10, depth = 12, movetime = 200 }) => {
  // stockfish npm exposes a function returning a worker‑like engine
  const engine = Stockfish();
  engine.postMessage('uci');
  engine.postMessage('setoption name Skill Level value ' + Math.max(0, Math.min(20, Math.round(skill))));
  engine.postMessage('setoption name Threads value 1');
  engine.postMessage('ucinewgame');

  const listeners = new Set();
  engine.onmessage = (line) => {
    listeners.forEach((fn) => fn(typeof line === 'string' ? line : line.data));
  };

  const addListener = (fn) => listeners.add(fn);
  const removeListener = (fn) => listeners.delete(fn);

  const go = (fen) => new Promise((resolve, reject) => {
    let bestMove = null;
    let evalCp = null;
    const onLine = (l) => {
      if (typeof l !== 'string') return;
      if (l.startsWith('info ')) {
        const m = l.match(/ score (cp|mate) (-?\d+)/);
        if (m) {
          if (m[1] === 'cp') evalCp = parseInt(m[2], 10);
          else if (m[1] === 'mate') evalCp = (parseInt(m[2], 10) > 0 ? 100000 : -100000);
        }
      }
      if (l.startsWith('bestmove')) {
        bestMove = l.split(' ')[1];
        removeListener(onLine);
        resolve({ bestMove, evalCp });
      }
    };
    addListener(onLine);
    engine.postMessage('position fen ' + fen);
    if (movetime) engine.postMessage('go movetime ' + movetime);
    else engine.postMessage('go depth ' + depth);
    // Timeout safety
    setTimeout(() => {
      removeListener(onLine);
      if (bestMove) resolve({ bestMove, evalCp });
      else resolve({ bestMove: null, evalCp: evalCp ?? 0 });
    }, Math.max(1500, movetime ? movetime + 500 : depth * 300));
  });

  return { type: 'stockfish', go };
};

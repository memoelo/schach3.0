import { Chess } from 'chess.js'

function evaluateBoard(chess) {
  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
  let total = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const sq = board[r][c]; if (!sq) continue
    const val = pieceValues[sq.type] || 0
    total += sq.color === 'w' ? val : -val
  }
  return total
}

function minimax(chess, depth, alpha, beta, isMax) {
  if (depth === 0 || chess.isGameOver()) return { score: evaluateBoard(chess) }
  const moves = chess.moves({ verbose: true })
  moves.sort((a, b) => (b.flags.includes('c') - a.flags.includes('c')))
  let best = { score: isMax ? -Infinity : Infinity, move: null }
  for (const m of moves) {
    chess.move(m)
    const { score } = minimax(chess, depth - 1, alpha, beta, !isMax)
    chess.undo()
    if (isMax && score > best.score) { best = { score, move: m.san }; alpha = Math.max(alpha, score) }
    else if (!isMax && score < best.score) { best = { score, move: m.san }; beta = Math.min(beta, score) }
    if (beta <= alpha) break
  }
  return best
}

export const createFallbackEngine = ({ depth = 2 } = {}) => {
  const go = async (fen) => {
    const chess = new Chess(fen)
    const isMax = chess.turn() === 'w'
    const result = minimax(chess, Math.max(1, Math.min(3, depth)), -Infinity, Infinity, isMax)
    const san = result.move
    if (!san) return { bestMove: null, evalCp: 0 }
    const legal = chess.moves({ verbose: true })
    const match = legal.find(m => m.san === san)
    const uci = match ? (match.from + match.to + (match.promotion || '')) : null
    return { bestMove: uci, evalCp: Math.round(result.score) }
  }
  return { type: 'fallback', go }
}

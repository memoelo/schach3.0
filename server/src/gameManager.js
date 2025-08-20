import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { BOT_LEVELS } from './engine/bots.js';
import { createEngine } from './engine/index.js';
import { log, warn } from './utils/logger.js';

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> state
  }

  createRoom({ mode = 'pvp', botId = null }) {
    const id = uuidv4().split('-')[0];
    const state = {
      id, mode, botId,
      chess: new Chess(),
      white: null, black: null,
      moves: [],
      lastMove: null,
      createdAt: Date.now(),
      analysis: null
    };
    this.rooms.set(id, state);
    return state;
  }

  joinRoom(roomId, socket) {
    const state = this.rooms.get(roomId);
    if (!state) throw new Error('Room not found');
    if (!state.white) state.white = socket.id;
    else if (!state.black) state.black = socket.id;
    else socket.join(roomId); // spectator
    socket.join(roomId);
    this.emitState(roomId);
    return state;
  }

  setBot(roomId, botId) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    state.mode = 'bot';
    state.botId = botId;
    this.emitState(roomId);
  }

  makeMove(roomId, socket, uci) {
    const state = this.rooms.get(roomId);
    if (!state) return { ok: false, reason: 'Room gone' };

    const { chess } = state;
    const legal = chess.moves({ verbose: true });
    const mv = legal.find(m => (m.from + m.to + (m.promotion || '')) === uci);
    if (!mv) return { ok: false, reason: 'Illegal move' };

    // Enforce turn / player
    const isWhiteTurn = chess.turn() === 'w';
    const isPlayerWhite = socket.id === state.white;
    const isPlayerBlack = socket.id === state.black;
    if (state.mode === 'pvp') {
      if ((isWhiteTurn && !isPlayerWhite) || (!isWhiteTurn && !isPlayerBlack)) {
        return { ok: false, reason: 'Not your turn' };
      }
    }

    chess.move(mv);
    state.moves.push(uci);
    state.lastMove = uci;

    this.emitState(roomId);

    // Check end
    if (chess.isGameOver()) {
      this.io.to(roomId).emit('game_over', this.getResult(chess));
      return { ok: true };
    }

    // If vs bot and now bot's turn, trigger bot move
    if (state.mode === 'bot') {
      const isBotTurn = (chess.turn() === 'w' && state.white === null) || (chess.turn() === 'b' && state.black === null);
      // BUT our model: player is always white; bot is black by default unless both seats are empty.
      // Simpler: If there's only one human (one seat filled), let bot play opponent side.
      const humans = [state.white, state.black].filter(Boolean).length;
      if (humans === 1) this.botReply(roomId).catch(e => warn('Bot move error', e));
    }

    return { ok: true };
  }

  async botReply(roomId) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    const { chess } = state;
    if (chess.isGameOver()) return;

    // Choose bot level
    const bot = BOT_LEVELS.find(b => b.id === state.botId) || BOT_LEVELS[1];
    const engine = createEngine({ skill: bot.skill, depth: bot.depth, movetime: bot.movetime });

    const { bestMove } = await engine.go(chess.fen());
    if (!bestMove) return;
    const legal = chess.moves({ verbose: true });
    const mv = legal.find(m => (m.from + m.to + (m.promotion || '')) === bestMove);
    if (!mv) return;
    chess.move(mv);
    state.moves.push(bestMove);
    state.lastMove = bestMove;
    this.emitState(roomId);

    if (chess.isGameOver()) {
      this.io.to(roomId).emit('game_over', this.getResult(chess));
    }
  }

  getResult(chess) {
    let result = '1/2-1/2';
    if (chess.isCheckmate()) {
      result = chess.turn() === 'w' ? '0-1' : '1-0'; // side to move is checkmated
    } else if (chess.isDraw()) {
      result = '1/2-1/2';
    }
    return { result, reason: this.reason(chess) };
  }

  reason(chess) {
    if (chess.isCheckmate()) return 'Checkmate';
    if (chess.isStalemate()) return 'Stalemate';
    if (chess.isThreefoldRepetition()) return 'Threefold repetition';
    if (chess.isInsufficientMaterial()) return 'Insufficient material';
    if (chess.isDraw()) return 'Draw';
    return 'Game over';
  }

  emitState(roomId) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    const payload = {
      id: state.id,
      mode: state.mode,
      botId: state.botId,
      fen: state.chess.fen(),
      moves: state.moves,
      lastMove: state.lastMove,
      turn: state.chess.turn(),
      isCheck: state.chess.isCheck(),
      pgn: state.chess.pgn()
    };
    this.io.to(roomId).emit('state', payload);
  }
}

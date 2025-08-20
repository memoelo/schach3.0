import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

export default function ChessBoardView({ state, onMove }) {
  const [game, setGame] = useState(new Chess())
  const [moveSquares, setMoveSquares] = useState({})
  const [lastMove, setLastMove] = useState(null)
  const [premove, setPremove] = useState(null)

  useEffect(() => {
    if (!state?.fen) return
    const g = new Chess(state.fen)
    setGame(g)
    setLastMove(state.lastMove || null)
    if (premove && g.turn() !== (premove.color === 'w' ? 'w' : 'b')) {
      // apply premove when turn changes
      const legal = g.moves({ verbose: true })
      const mv = legal.find(m => (m.from + m.to + (m.promotion || '')) === premove.uci)
      if (mv) { onMove(premove.uci); setPremove(null) }
    }
  }, [state?.fen])

  function getMoveOptions(square) {
    const legal = game.moves({ verbose: true })
    const ms = {}
    legal.forEach(m => {
      if (m.from === square) {
        ms[m.to] = {
          background: 'radial-gradient(circle, rgba(147,197,253,0.8) 25%, transparent 26%)',
          borderRadius: '50%'
        }
      }
    })
    setMoveSquares(ms)
  }

  function onSquareClick(square) {
    const legal = game.moves({ verbose: true })
    const from = Object.keys(moveSquares).length ? null : square
    if (!from) {
      // second click: do a move if possible
      const selectedFrom = Object.keys(moveSquares).find(() => true) // not needed
    } else {
      getMoveOptions(square)
    }
  }

  const onPieceDrop = (sourceSquare, targetSquare, piece) => {
    const legal = game.moves({ verbose: true })
    const mv = legal.find(m => m.from === sourceSquare && m.to === targetSquare)
    const uci = mv ? (mv.from + mv.to + (mv.promotion || '')) : null
    if (!uci) {
      // set premove if not legal now
      setPremove({ uci: sourceSquare + targetSquare, color: game.turn() })
      return false
    }
    onMove(uci)
    setMoveSquares({})
    return true
  }

  const customSquareStyles = useMemo(() => {
    const styles = { ...moveSquares }
    if (lastMove) {
      const from = lastMove.slice(0,2)
      const to = lastMove.slice(2,4)
      styles[from] = { backgroundColor: 'rgba(34,197,94,0.5)' }
      styles[to] = { backgroundColor: 'rgba(34,197,94,0.5)' }
    }
    return styles
  }, [moveSquares, lastMove])

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 140px)' }}>
      <Chessboard
        id="Board"
        position={state?.fen || 'start'}
        onPieceDrop={onPieceDrop}
        customBoardStyle={{ borderRadius: '12px', boxShadow: '0 0 0 1px #1f2937 inset' }}
        customSquareStyles={customSquareStyles}
        boardOrientation={'white'}
        animationDuration={200}
        arePiecesDraggable={true}
        arePremovesAllowed={true}
        showBoardNotation={true}
        customLightSquareStyle={{ backgroundColor: '#9ca3af' }}
        customDarkSquareStyle={{ backgroundColor: '#374151' }}
      />
    </div>
  )
}

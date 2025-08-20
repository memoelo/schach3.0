import React from 'react'

export default function EvalBar({ evalCp = 0 }) {
  // evalCp > 0 => Vorteil Weiß
  const pctWhite = Math.max(0, Math.min(100, 50 + evalCp / 10))
  return (
    <div className="evalbar">
      <div className="marker" style={{ top: (100 - pctWhite) + '%' }}></div>
    </div>
  )
}

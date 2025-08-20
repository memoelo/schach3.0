import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'

test('chess rules basic', () => {
  const c = new Chess()
  assert.equal(c.moves().length, 20)
  c.move('e4'); c.move('e5'); c.move('Nf3')
  assert.ok(!c.isGameOver())
})

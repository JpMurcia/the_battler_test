import { describe, expect, it } from 'vitest'
import { getLevelState } from '../../../src/data/levelState'

describe('getLevelState', () => {
  it('devuelve "locked" cuando el índice es mayor al máximo desbloqueado', () => {
    expect(getLevelState(1, 0, false)).toBe('locked')
  })

  it('devuelve "unlocked" cuando el índice es igual al máximo desbloqueado y no está completado', () => {
    expect(getLevelState(0, 0, false)).toBe('unlocked')
  })

  it('devuelve "unlocked" cuando el índice es menor al máximo desbloqueado y no está completado', () => {
    expect(getLevelState(0, 1, false)).toBe('unlocked')
  })

  it('devuelve "completed" cuando está desbloqueado y completado, sin importar el índice', () => {
    expect(getLevelState(0, 0, true)).toBe('completed')
  })
})

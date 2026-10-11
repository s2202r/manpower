import { describe, it, expect } from 'vitest'
import { canTransition, allowedTransitions } from '../task-state-machine'

describe('task state machine', () => {
  it('poster can publish draft to open', () => {
    expect(canTransition('draft', 'open', 'poster')).toBe(true)
  })

  it('poster can cancel open task', () => {
    expect(canTransition('open', 'cancelled', 'poster')).toBe(true)
  })

  it('system moves open to assigned', () => {
    expect(canTransition('open', 'assigned', 'system')).toBe(true)
  })

  it('tasker cannot skip to completed', () => {
    expect(canTransition('in_progress', 'completed', 'tasker')).toBe(false)
  })

  it('poster can confirm completed from tasker_done', () => {
    expect(canTransition('tasker_done', 'completed', 'poster')).toBe(true)
  })

  it('system auto-releases after 48h (tasker_done → completed)', () => {
    expect(canTransition('tasker_done', 'completed', 'system')).toBe(true)
  })

  it('either party can raise dispute from in_progress', () => {
    expect(canTransition('in_progress', 'disputed', 'poster')).toBe(true)
    expect(canTransition('in_progress', 'disputed', 'tasker')).toBe(true)
  })

  it('admin resolves dispute', () => {
    expect(canTransition('disputed', 'completed', 'admin')).toBe(true)
    expect(canTransition('disputed', 'cancelled', 'admin')).toBe(true)
  })

  it('allowedTransitions returns correct states for poster from open', () => {
    const transitions = allowedTransitions('open', 'poster')
    expect(transitions).toContain('cancelled')
    expect(transitions).not.toContain('assigned')
  })
})

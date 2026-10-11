export const TASK_STATES = [
  'draft',
  'open',
  'assigned',
  'in_progress',
  'tasker_done',
  'completed',
  'paid_out',
  'cancelled',
  'disputed',
  'expired',
] as const

export type TaskState = typeof TASK_STATES[number]

type Transition = { from: TaskState[]; to: TaskState; role: 'poster' | 'tasker' | 'system' | 'admin' }

const TRANSITIONS: Transition[] = [
  { from: ['draft'], to: 'open', role: 'poster' },
  { from: ['draft', 'open'], to: 'cancelled', role: 'poster' },
  { from: ['open'], to: 'assigned', role: 'system' },       // after payment
  { from: ['assigned'], to: 'in_progress', role: 'tasker' },
  { from: ['in_progress'], to: 'tasker_done', role: 'tasker' },
  { from: ['tasker_done'], to: 'completed', role: 'poster' },
  { from: ['completed'], to: 'paid_out', role: 'system' },
  { from: ['tasker_done'], to: 'completed', role: 'system' }, // auto-release after 48h
  { from: ['assigned', 'in_progress', 'tasker_done'], to: 'disputed', role: 'poster' },
  { from: ['assigned', 'in_progress', 'tasker_done'], to: 'disputed', role: 'tasker' },
  { from: ['disputed'], to: 'completed', role: 'admin' },
  { from: ['disputed'], to: 'cancelled', role: 'admin' },
  { from: ['open'], to: 'expired', role: 'system' },
]

export function canTransition(from: TaskState, to: TaskState, role: Transition['role']): boolean {
  return TRANSITIONS.some(
    t => t.to === to && t.role === role && t.from.includes(from)
  )
}

export function allowedTransitions(from: TaskState, role: Transition['role']): TaskState[] {
  return TRANSITIONS
    .filter(t => t.from.includes(from) && t.role === role)
    .map(t => t.to)
}

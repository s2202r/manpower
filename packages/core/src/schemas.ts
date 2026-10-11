import { z } from 'zod'

export const TaskTypeSchema = z.enum(['in_person', 'pickup_drop', 'remote'])
export type TaskType = z.infer<typeof TaskTypeSchema>

export const TaskStateSchema = z.enum([
  'draft', 'open', 'assigned', 'in_progress',
  'tasker_done', 'completed', 'paid_out',
  'cancelled', 'disputed', 'expired',
])
export type TaskState = z.infer<typeof TaskStateSchema>

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  photo_url: z.string().url().nullable(),
  preferred_locale: z.string().length(2),
  roles: z.array(z.enum(['poster', 'tasker', 'admin'])),
  verification_tier: z.enum(['none', 'email', 'kyc']).default('none'),
})
export type Profile = z.infer<typeof ProfileSchema>

export const CreateTaskSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(2000),
  category_id: z.string().uuid(),
  task_type: TaskTypeSchema,
  budget_paise: z.bigint().positive(),
  date_flexibility: z.enum(['exact', 'week', 'month']),
  location_lat: z.number().min(-90).max(90).nullable(),
  location_lng: z.number().min(-180).max(180).nullable(),
})
export type CreateTask = z.infer<typeof CreateTaskSchema>

export const WorkZoneSchema = z.object({
  id: z.string().uuid(),
  tasker_id: z.string().uuid(),
  label: z.string().min(1).max(100),
  centre_lat: z.number(),
  centre_lng: z.number(),
  radius_km: z.union([z.literal(2), z.literal(5), z.literal(10), z.literal(15), z.literal(25)]),
})
export type WorkZone = z.infer<typeof WorkZoneSchema>

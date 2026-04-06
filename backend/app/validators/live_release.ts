import vine from '@vinejs/vine'
import { RELEASE_TYPES, SORT_OPTIONS } from '#utils/constants'

export const releaseLiveIndexValidator = vine.create({
  page: vine.number().positive().optional(),
  limit: vine.number().range([1, 50]).optional(),
  type: vine.enum(RELEASE_TYPES).optional(),
  artist_id: vine.number().positive().optional(),
  sort: vine.enum(Object.values(SORT_OPTIONS)).optional(),
  q: vine.string().maxLength(100).optional(),
  from_date: vine
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to_date: vine
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})


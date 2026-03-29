import vine from '@vinejs/vine'

export const releaseIndexValidator = vine.create({
  page: vine.number().positive().optional(),
  limit: vine.number().range([1, 50]).optional(),
  type: vine.enum(['album', 'single', 'ep', 'compilation']).optional(),
  artist_id: vine.number().positive().optional(),
  sort: vine.enum(['release_date_desc', 'release_date_asc']).optional(),
  q: vine.string().maxLength(100).optional(),
  from_date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const releaseLatestValidator = vine.create({
  days: vine.number().range([1, 365]).optional(),
})

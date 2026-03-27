import vine from '@vinejs/vine'

export const notificationSettingsValidator = vine.create({
  enabled: vine.boolean().optional(),
  frequency: vine.string().in(['daily', 'weekly']).optional(),
  types: vine.array(vine.string().in(['album', 'single', 'ep', 'compilation'])).optional(),
})

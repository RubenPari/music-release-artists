import vine from '@vinejs/vine'

const password = () => vine.string().minLength(8).maxLength(32)

export const resetPasswordValidator = vine.create({
  token: vine.string().minLength(16),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})


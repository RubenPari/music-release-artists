import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)

export const forgotPasswordValidator = vine.create({
  email: email(),
})


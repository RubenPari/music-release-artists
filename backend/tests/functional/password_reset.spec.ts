import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'

test.group('Password reset', () => {
  test('should return 200 even when email does not exist', async ({ client }) => {
    const response = await client.post('/api/v1/auth/forgot-password').form({
      email: 'missing@example.com',
    })

    response.assertStatus(200)
  })

  test('should reset password using token', async ({ client }) => {
    const uniqueEmail = `reset-${Date.now()}@example.com`
    const user = await User.create({
      fullName: 'Test User',
      email: uniqueEmail,
      password: 'OldPass123!',
      emailVerifiedAt: DateTime.now(),
    })

    const forgotResponse = await client.post('/api/v1/auth/forgot-password').form({
      email: user.email,
    })
    forgotResponse.assertStatus(200)

    await user.refresh()
    const token = user.passwordResetToken
    if (!token) {
      throw new Error('Expected password reset token to be generated')
    }

    const resetResponse = await client.post('/api/v1/auth/reset-password').form({
      token,
      password: 'NewPass123!',
      passwordConfirmation: 'NewPass123!',
    })
    resetResponse.assertStatus(200)

    const loginResponse = await client.post('/api/v1/auth/login').form({
      email: user.email,
      password: 'NewPass123!',
    })
    loginResponse.assertStatus(200)
  })
})


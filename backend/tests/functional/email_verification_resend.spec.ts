import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'

test.group('Email verification - resend', () => {
  test('should return 200 even when email does not exist', async ({ client }) => {
    const response = await client.post('/api/v1/auth/verify-email/resend').form({
      email: 'missing-verify@example.com',
    })
    response.assertStatus(200)
  })

  test('should return 200 when email exists but already verified', async ({ client }) => {
    const uniqueEmail = `verified-${Date.now()}@example.com`
    await User.create({
      fullName: 'Verified User',
      email: uniqueEmail,
      password: 'StrongPass123!',
      emailVerifiedAt: DateTime.now(),
    })

    const response = await client.post('/api/v1/auth/verify-email/resend').form({
      email: uniqueEmail,
    })
    response.assertStatus(200)
  })

  test('should generate verification token for unverified user', async ({ client }) => {
    const uniqueEmail = `unverified-${Date.now()}@example.com`
    const user = await User.create({
      fullName: 'Unverified User',
      email: uniqueEmail,
      password: 'StrongPass123!',
      emailVerifiedAt: null,
    })

    const response = await client.post('/api/v1/auth/verify-email/resend').form({
      email: uniqueEmail,
    })
    response.assertStatus(200)

    await user.refresh()
    if (!user.emailVerificationToken) {
      throw new Error('Expected email verification token to be generated')
    }
  })
})


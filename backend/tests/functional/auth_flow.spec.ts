import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Auth Flow', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('full signup and login flow', async ({ client, assert }) => {
    // Signup
    const signupResponse = await client.post('/api/v1/auth/signup').form({
      fullName: 'Test User',
      email: 'flow@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    })
    signupResponse.assertStatus(201)
    signupResponse.assertBodyContains({ email: 'flow@example.com' })

    // Verify the user was created
    const user = await User.findByOrFail('email', 'flow@example.com')
    assert.equal(user.fullName, 'Test User')
    assert.isNotNull(user.emailVerificationToken)

    // Mark email as verified so login works
    await user.markAsVerified()

    // Login
    const loginResponse = await client.post('/api/v1/auth/login').form({
      email: 'flow@example.com',
      password: 'StrongPass123!',
    })
    loginResponse.assertStatus(200)
    loginResponse.assertBodyContains({ token: loginResponse.body().token })
    assert.isString(loginResponse.body().token)
  })

  test('should reject login with wrong password', async ({ client }) => {
    const user = await User.create({
      fullName: 'Test',
      email: 'wrong@example.com',
      password: 'StrongPass123!',
    })
    await user.markAsVerified()

    const response = await client.post('/api/v1/auth/login').form({
      email: 'wrong@example.com',
      password: 'WrongPassword!',
    })
    response.assertStatus(400)
  })

  test('should reject signup with duplicate email', async ({ client }) => {
    await User.create({
      fullName: 'Existing',
      email: 'duplicate@example.com',
      password: 'StrongPass123!',
    })

    const response = await client.post('/api/v1/auth/signup').form({
      fullName: 'New User',
      email: 'duplicate@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    })
    response.assertStatus(422)
  })

  test('should logout and invalidate token', async ({ client }) => {
    const user = await User.create({
      fullName: 'Logout Test',
      email: 'logout@example.com',
      password: 'StrongPass123!',
    })
    await user.markAsVerified()

    const loginResponse = await client.post('/api/v1/auth/login').form({
      email: 'logout@example.com',
      password: 'StrongPass123!',
    })
    const token = loginResponse.body().token

    // Logout
    const logoutResponse = await client
      .post('/api/v1/auth/logout')
      .header('Authorization', `Bearer ${token}`)
    logoutResponse.assertStatus(200)

    // Token should no longer work
    const profileResponse = await client
      .get('/api/v1/account/profile')
      .header('Authorization', `Bearer ${token}`)
    profileResponse.assertStatus(401)
  })
})

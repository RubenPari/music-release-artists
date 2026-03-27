import { test } from '@japa/runner'

test.group('Auth API', (group) => {
  test('should reject signup without required fields', async ({ client }) => {
    const response = await client.post('/api/v1/auth/signup').form({})
    response.assertStatus(422)
  })

  test('should reject signup with mismatched passwords', async ({ client }) => {
    const response = await client.post('/api/v1/auth/signup').form({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'DifferentPass123!',
    })
    response.assertStatus(422)
  })

  test('should reject login without credentials', async ({ client }) => {
    const response = await client.post('/api/v1/auth/login').form({})
    response.assertStatus(422)
  })

  test('should reject profile access without auth', async ({ client }) => {
    const response = await client.get('/api/v1/account/profile')
    response.assertStatus(401)
  })

  test('should reject logout without auth', async ({ client }) => {
    const response = await client.post('/api/v1/auth/logout')
    response.assertStatus(401)
  })
})

import { test } from '@japa/runner'

test.group('Settings API', () => {
  test('should reject settings access without auth', async ({ client }) => {
    const response = await client.get('/api/v1/settings/notifications')
    response.assertStatus(401)
  })

  test('should reject settings update without auth', async ({ client }) => {
    const response = await client.patch('/api/v1/settings/notifications')
    response.assertStatus(401)
  })

  test('should reject unsubscribe without token', async ({ client }) => {
    const response = await client.post('/api/v1/notifications/unsubscribe')
    response.assertStatus(400)
  })

  test('should reject notification history without auth', async ({ client }) => {
    const response = await client.get('/api/v1/notifications/history')
    response.assertStatus(401)
  })
})

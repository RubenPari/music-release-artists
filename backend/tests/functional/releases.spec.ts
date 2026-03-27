import { test } from '@japa/runner'

test.group('Releases API', () => {
  test('should reject releases access without auth', async ({ client }) => {
    const response = await client.get('/api/v1/releases')
    response.assertStatus(401)
  })

  test('should reject latest releases access without auth', async ({ client }) => {
    const response = await client.get('/api/v1/releases/latest')
    response.assertStatus(401)
  })

  test('should reject releases sync without auth', async ({ client }) => {
    const response = await client.post('/api/v1/releases/sync')
    response.assertStatus(401)
  })
})

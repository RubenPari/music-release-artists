import { test } from '@japa/runner'

test.group('Releases API', () => {
  test('should reject live releases access without auth', async ({ client }) => {
    const response = await client.get('/api/v1/releases/live')
    response.assertStatus(401)
  })
})

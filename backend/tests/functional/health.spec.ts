import { test } from '@japa/runner'

test.group('Health Check', () => {
  test('should return ok status', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok' })
  })
})

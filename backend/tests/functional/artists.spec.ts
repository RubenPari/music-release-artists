import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Artists API', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should reject artists list without auth', async ({ client }) => {
    const response = await client.get('/api/v1/artists')
    response.assertStatus(401)
  })

  test('should reject artists sync without auth', async ({ client }) => {
    const response = await client.post('/api/v1/artists/sync')
    response.assertStatus(401)
  })

  test('should return empty artists list for new user', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Artist User',
      email: 'artists@example.com',
      password: 'StrongPass123!',
    })

    const response = await client
      .get('/api/v1/artists')
      .loginAs(user)
    response.assertStatus(200)

    const body = response.body()
    assert.isObject(body.data)
    assert.isArray(body.data.data)
    assert.equal(body.data.data.length, 0)
  })

  test('should reject sync when Spotify not connected', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Spotify User',
      email: 'nospotify@example.com',
      password: 'StrongPass123!',
    })

    const response = await client
      .post('/api/v1/artists/sync')
      .loginAs(user)
    response.assertStatus(500)
  })
})

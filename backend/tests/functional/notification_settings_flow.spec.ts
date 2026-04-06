import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Notification Settings Flow', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should get default notification settings', async ({ client }) => {
    const user = await User.create({
      fullName: 'Settings User',
      email: 'settings@example.com',
      password: 'StrongPass123!',
    })

    const response = await client
      .get('/api/v1/settings/notifications')
      .loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      notificationsEnabled: false,
      notificationFrequency: 'daily',
      notificationEmail: 'settings@example.com',
    })
  })

  test('should update notification settings', async ({ client }) => {
    const user = await User.create({
      fullName: 'Update User',
      email: 'update@example.com',
      password: 'StrongPass123!',
    })

    const response = await client
      .patch('/api/v1/settings/notifications')
      .loginAs(user)
      .form({
        enabled: true,
        frequency: 'weekly',
        types: ['album', 'single'],
        email: 'notify@example.com',
      })
    response.assertStatus(200)
    response.assertBodyContains({
      notificationsEnabled: true,
      notificationFrequency: 'weekly',
      notificationTypes: ['album', 'single'],
      notificationEmail: 'notify@example.com',
    })
  })

  test('should reject invalid frequency', async ({ client }) => {
    const user = await User.create({
      fullName: 'Invalid User',
      email: 'invalid@example.com',
      password: 'StrongPass123!',
    })

    const response = await client
      .patch('/api/v1/settings/notifications')
      .loginAs(user)
      .form({ frequency: 'hourly' })
    response.assertStatus(422)
  })

  test('should partially update settings', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Partial User',
      email: 'partial@example.com',
      password: 'StrongPass123!',
    })

    // Enable notifications
    await client
      .patch('/api/v1/settings/notifications')
      .loginAs(user)
      .form({ enabled: true })

    // Update only frequency
    const response = await client
      .patch('/api/v1/settings/notifications')
      .loginAs(user)
      .form({ frequency: 'monthly' })
    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.notificationsEnabled)
    assert.equal(body.notificationFrequency, 'monthly')
  })
})

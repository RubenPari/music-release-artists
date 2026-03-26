import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('spotify_id').nullable().unique()
      table.string('display_name').nullable()
      table.string('avatar_url').nullable()
      table.text('access_token_enc').nullable()
      table.text('refresh_token_enc').nullable()
      table.timestamp('token_expires_at').nullable()
      table.boolean('notifications_enabled').defaultTo(false)
      table.string('notification_frequency').defaultTo('daily')
      table.text('notification_types').nullable()
      table.string('country').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'spotify_id',
        'display_name',
        'avatar_url',
        'access_token_enc',
        'refresh_token_enc',
        'token_expires_at',
        'notifications_enabled',
        'notification_frequency',
        'notification_types',
        'country'
      )
    })
  }
}

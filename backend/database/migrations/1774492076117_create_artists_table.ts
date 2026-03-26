import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'artists'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('spotify_artist_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('image_url').nullable()
      table.text('genres').nullable()
      table.integer('followers').defaultTo(0)
      table.timestamp('last_synced_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'releases'

  async up() {
    this.schema.dropTable(this.tableName)
  }

  async down() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('spotify_release_id').notNullable().unique()
      table
        .integer('artist_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('artists')
        .onDelete('CASCADE')
      table.string('title').notNullable()
      table.string('type').notNullable()
      table.string('cover_url').nullable()
      table.string('release_date').notNullable()
      table.string('spotify_url').notNullable()
      table.timestamp('first_seen_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }
}


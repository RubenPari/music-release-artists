import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('email_verified_at').nullable().after('email')
      table.string('email_verification_token', 64).nullable().after('email_verified_at')
      table.timestamp('email_sent_at').nullable().after('email_verification_token')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified_at')
      table.dropColumn('email_verification_token')
      table.dropColumn('email_sent_at')
    })
  }
}

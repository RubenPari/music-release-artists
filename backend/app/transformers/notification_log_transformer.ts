import type NotificationLog from '#models/notification_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class NotificationLogTransformer extends BaseTransformer<NotificationLog> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'sentAt',
      'releasesCount',
      'status',
      'errorMessage',
      'createdAt',
    ])
  }
}

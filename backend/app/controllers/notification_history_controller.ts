import type { HttpContext } from '@adonisjs/core/http'
import NotificationLogTransformer from '#transformers/notification_log_transformer'

export default class NotificationHistoryController {
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const logs = await user
      .related('notificationLogs')
      .query()
      .orderBy('sent_at', 'desc')
      .paginate(page, limit)

    return serialize(
      NotificationLogTransformer.paginate(logs.all(), logs.getMeta())
    )
  }
}

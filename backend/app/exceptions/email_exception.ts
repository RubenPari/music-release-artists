import { Exception } from '@adonisjs/core/exceptions'

export class EmailSendException extends Exception {
  static sendFailed(status: number, body: string) {
    return new this(`Failed to send email: ${status} ${body}`, { status: 503, code: 'E_EMAIL_SEND_FAILED' })
  }
}

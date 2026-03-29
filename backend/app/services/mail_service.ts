import Env from '#start/env'
import { Logger } from '@adonisjs/core/logger'
import type User from '#models/user'

const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send'
const logger = new Logger()

interface MailtrapEmail {
  to: { email: string; name?: string }[]
  from: { email: string; name?: string }
  subject: string
  html: string
  text: string
}

export class MailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string
  private appUrl: string

  constructor() {
    this.apiKey = Env.get('MAILTRAP_API_KEY', '')
    this.fromEmail = Env.get('MAILTRAP_FROM_EMAIL', 'noreply@example.com')
    this.fromName = Env.get('MAILTRAP_FROM_NAME', 'Music Release Artists')
    this.appUrl = Env.get('APP_URL', 'http://localhost:5173')
  }

  async sendEmail(email: MailtrapEmail): Promise<void> {
    if (!this.apiKey) {
      logger.warn('Mailtrap API key not configured. Skipping email send.')
      return
    }

    const response = await fetch(MAILTRAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(email),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${response.status} ${error}`)
    }
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/api/v1/auth/verify-email/${token}`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma il tuo account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #aa3bff; margin: 0 0 24px; font-size: 24px;">Benvenuto in Music Release Artists!</h1>
    
    <p style="margin: 0 0 16px;">Ciao ${user.fullName || user.email},</p>
    
    <p style="margin: 0 0 24px;">Grazie per aver creato un account. Per attivare il tuo account, clicca sul pulsante qui sotto:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: #aa3bff; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Conferma il tuo account</a>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #666;">O copia e incolla questo link nel tuo browser:</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #aa3bff; word-break: break-all;">${verificationUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #e5e4e7; margin: 24px 0;">
    
    <p style="margin: 0; font-size: 14px; color: #999;">Questo link scade tra 24 ore.</p>
  </div>
</body>
</html>
`

    const text = `
Benvenuto in Music Release Artists!

Ciao ${user.fullName || user.email},

Grazie per aver creato un account. Per attivare il tuo account, clicca sul link qui sotto:

${verificationUrl}

Questo link scade tra 24 ore.
`

    await this.sendEmail({
      to: [{ email: user.email, name: user.fullName || undefined }],
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Conferma il tuo account - Music Release Artists',
      html,
      text,
    })
  }
}

export const mailService = new MailService()

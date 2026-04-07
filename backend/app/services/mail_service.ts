import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import Env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import type User from '#models/user'
import { EmailSendException } from '#exceptions/email_exception'

const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send'

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
    this.appUrl = Env.get('APP_URL', 'http://127.0.0.1:5173')
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
      throw EmailSendException.sendFailed(response.status, error)
    }
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/api/v1/auth/verify-email/${token}`
    const name = user.fullName || user.email
    const vars = { name, url: verificationUrl }

    const html = await this.loadTemplate('verification.html', vars)
    const text = await this.loadTemplate('verification.txt', vars)

    await this.sendEmail({
      to: [{ email: user.email, name: user.fullName || undefined }],
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Conferma il tuo account - Music Release Artists',
      html,
      text,
    })
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/api/v1/auth/reset-password/${token}`
    const name = user.fullName || user.email
    const vars = { name, url: resetUrl }

    const html = await this.loadTemplate('reset-password.html', vars)
    const text = await this.loadTemplate('reset-password.txt', vars)

    await this.sendEmail({
      to: [{ email: user.email, name: user.fullName || undefined }],
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Reimposta la password - Music Release Artists',
      html,
      text,
    })
  }

  private async loadTemplate(
    filename: string,
    vars: Record<string, string>
  ): Promise<string> {
    const templatePath = join(app.makePath('resources', 'emails'), filename)
    let content = await readFile(templatePath, 'utf-8')
    for (const [key, value] of Object.entries(vars)) {
      content = content.replaceAll(`{{${key}}}`, value)
    }
    return content
  }
}

export const mailService = new MailService()

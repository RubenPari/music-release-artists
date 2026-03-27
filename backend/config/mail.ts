import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'smtp.sendgrid.net'),
      port: Number(env.get('SMTP_PORT', '587')),
      secure: false,
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME', 'apikey'),
        pass: env.get('SMTP_PASSWORD', ''),
      },
    }),
  },
})

export default mailConfig

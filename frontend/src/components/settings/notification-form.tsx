import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useNotificationSettings } from '@/hooks/use-notification-settings'
import { useToast } from '@/hooks/use-toast'
import { RELEASE_TYPE_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/constants'
import type { NotificationFrequency, ReleaseType } from '@/types'

export function NotificationForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useNotificationSettings()
  const { addToast } = useToast()

  const [initialized, setInitialized] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [frequency, setFrequency] = useState<NotificationFrequency>('daily')
  const [selectedTypes, setSelectedTypes] = useState<ReleaseType[]>([])
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings && !initialized) {
      setEnabled(settings.notificationsEnabled)
      setFrequency(settings.notificationFrequency)
      setSelectedTypes(settings.notificationTypes)
      setEmail(settings.notificationEmail)
      setInitialized(true)
    }
  }, [settings, initialized])

  const handleTypeToggle = (type: ReleaseType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSave = async () => {
    try {
      await updateSettings({
        enabled,
        frequency,
        types: selectedTypes,
        email,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      addToast('Salvataggio impostazioni fallito. Riprova più tardi.', 'error')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifiche Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 rounded bg-surface" />
            <div className="h-10 w-full rounded bg-surface" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifiche Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Notifiche attive</p>
            <p className="text-sm text-muted">
              Ricevi un'email quando escono nuove release dei tuoi artisti
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${enabled ? 'bg-brand' : 'bg-border'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Input
                label="Email destinatario"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="esempio@email.com"
                className="max-w-xs"
              />
              <p className="text-xs text-muted">
                L'indirizzo email dove riceverai le notifiche sulle nuove uscite
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Frequenza</label>
              <Select
                options={FREQUENCY_OPTIONS}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as NotificationFrequency)}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-muted">
                {frequency === 'daily' && 'Riceverai un email ogni giorno se ci sono nuove release'}
                {frequency === 'weekly' && 'Riceverai un email ogni settimana se ci sono nuove release'}
                {frequency === 'monthly' && 'Riceverai un email ogni mese se ci sono nuove release'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Tipi di release da notificare
              </label>
              <div className="flex flex-wrap gap-3">
                {RELEASE_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      className="h-4 w-4 rounded border-border text-brand focus:ring-brand/50"
                    />
                    <span className="text-sm text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-4">
          <Button onClick={() => void handleSave()} isLoading={isUpdating}>
            Salva preferenze
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Salvato!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useNotificationSettings } from '@/hooks/use-notification-settings'

const RELEASE_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilation' },
]

const frequencyOptions = [
  { value: 'daily', label: 'Giornaliera' },
  { value: 'weekly', label: 'Settimanale' },
]

export function NotificationForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useNotificationSettings()

  const [enabled, setEnabled] = useState(settings?.notificationsEnabled ?? false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(settings?.notificationFrequency ?? 'daily')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(settings?.notificationTypes ?? [])
  const [saved, setSaved] = useState(false)

  const handleTypeToggle = (type: string) => {
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
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
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
            <div className="h-6 w-32 rounded bg-[#f4f3ec]" />
            <div className="h-10 w-full rounded bg-[#f4f3ec]" />
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
            <p className="font-medium text-[#08060d]">Notifiche attive</p>
            <p className="text-sm text-[#6b6375]">
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
              ${enabled ? 'bg-[#aa3bff]' : 'bg-[#e5e4e7]'}
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
              <label className="block text-sm font-medium text-[#08060d]">Frequenza</label>
              <Select
                options={frequencyOptions}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-[#6b6375]">
                {frequency === 'daily'
                  ? 'Riceverai un email ogni giorno se ci sono nuove release'
                  : 'Riceverai un email ogni settimana con tutte le nuove release'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#08060d]">
                Tipi di release da notificare
              </label>
              <div className="flex flex-wrap gap-3">
                {RELEASE_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      className="h-4 w-4 rounded border-[#e5e4e7] text-[#aa3bff] focus:ring-[#aa3bff]/50"
                    />
                    <span className="text-sm text-[#08060d]">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} isLoading={isUpdating}>
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

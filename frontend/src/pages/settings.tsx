import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-[#08060d]">Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle>Coming in Fase 5</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#6b6375]">
            Le impostazioni complete saranno implementate nella prossima fase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

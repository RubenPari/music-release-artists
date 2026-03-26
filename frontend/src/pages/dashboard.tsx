import { useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const spotifyStatus = searchParams.get('spotify')
  const error = searchParams.get('error')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-[#08060d]">Dashboard</h1>

      {spotifyStatus === 'connected' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-3 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Spotify collegato con successo!
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">
            Errore: {decodeURIComponent(error)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Coming in Fase 4</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#6b6375]">
            La dashboard completa sara implementata nella prossima fase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

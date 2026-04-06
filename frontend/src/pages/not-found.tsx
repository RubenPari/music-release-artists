import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="max-w-md text-center">
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-6 text-8xl font-bold text-brand">404</div>
          
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            Pagina non trovata
          </h1>
          
          <p className="mb-8 text-muted">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
          
          <Link to="/dashboard">
            <Button>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Torna alla Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

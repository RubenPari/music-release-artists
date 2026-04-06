import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

interface SignupFormData {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
}

export function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  const signupMutation = useMutation({
    mutationFn: (data: SignupFormData) =>
      api.auth.signup(data),
    onSuccess: (data) => setRegisteredEmail(data.email),
  })

  if (registeredEmail) {
    return (
      <SignupSuccessView email={registeredEmail} onLoginClick={() => void navigate('/login')} />
    )
  }

  const handleChange = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void signupMutation.mutateAsync(formData)
  }

  const errorMessage = signupMutation.error
    ? ((signupMutation.error as ApiError).message || 'Errore durante la registrazione')
    : null

  return (
    <>
      <CardTitle className="mb-6">Crea un account</CardTitle>
      <SignupForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        error={errorMessage}
        isPending={signupMutation.isPending}
      />
      <p className="mt-4 text-center text-sm text-muted">
        Hai gia un account?{' '}
        <Link to="/login" className="text-brand hover:underline">Accedi</Link>
      </p>
    </>
  )
}

/** Form fields configuration */
const FORM_FIELDS: Array<{
  name: keyof Pick<SignupFormData, 'fullName' | 'email' | 'password' | 'passwordConfirmation'>
  type: 'text' | 'email' | 'password'
  label: string
  placeholder: string
  autoComplete: string
}> = [
  { name: 'fullName', type: 'text', label: 'Nome completo', placeholder: 'Mario Rossi', autoComplete: 'name' },
  { name: 'email', type: 'email', label: 'Email', placeholder: 'tu@email.com', autoComplete: 'email' },
  { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', autoComplete: 'new-password' },
  { name: 'passwordConfirmation', type: 'password', label: 'Conferma password', placeholder: '••••••••', autoComplete: 'new-password' },
]

/** Signup form component */
interface SignupFormProps {
  formData: SignupFormData
  onChange: (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
  error: string | null
  isPending: boolean
}

function SignupForm({ formData, onChange, onSubmit, error, isPending }: SignupFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {FORM_FIELDS.map(({ name, type, label, placeholder, autoComplete }) => (
        <Input
          key={name}
          type={type}
          name={name}
          label={label}
          placeholder={placeholder}
          value={formData[name]}
          onChange={onChange(name)}
          required
          autoComplete={autoComplete}
        />
      ))}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" isLoading={isPending}>Registrati</Button>
    </form>
  )
}

/** Success view after registration */
function SignupSuccessView({ email, onLoginClick }: { email: string; onLoginClick: () => void }) {
  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle>Account creato!</CardTitle>
      </div>
      <div className="space-y-4 text-center">
        <p className="text-muted">
          Abbiamo inviato un'email di verifica a <strong className="text-foreground">{email}</strong>
        </p>
        <p className="text-sm text-muted">Clicca sul link nell'email per attivare il tuo account.</p>
        <Button variant="outline" className="mt-4 w-full" onClick={onLoginClick}>Vai al login</Button>
      </div>
    </>
  )
}

/** Check icon */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

import { Link, useSearchParams } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { Card } from '../components/ui'

export default function Login() {
  const [params] = useSearchParams()
  // Preserve where they were headed (e.g. an invite link) across sign-in.
  const next = params.get('next') ?? '/workspaces'

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-1 text-2xl tracking-tight lowercase">
        rhoad<span className="text-umber">.</span>
      </Link>
      <Card className="p-5">
        <AuthForm next={next} />
      </Card>
    </div>
  )
}

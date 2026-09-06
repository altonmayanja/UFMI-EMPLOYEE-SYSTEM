'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Building2, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react'
import { useAuthStore, type User } from '@/store/auth-store'
import { apiPost, ApiError } from '@/lib/api'

interface OrganizationOption {
  id: string
  name: string
  slug: string
}

export default function CommercialLoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [organization, setOrganization] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/login', {
        organization,
        username,
        password,
      })
      login(data.token, data.user)
      router.replace(data.user.role === 'super_admin' ? '/platform' : '/app')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        const body = requestError.data as { organizations?: OrganizationOption[] } | undefined
        setOrganizationOptions(body?.organizations ?? [])
        setError(requestError.message)
      } else {
        setError('Unable to sign in right now. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a0a] px-4 py-6 text-[#f4f1e8] sm:px-6 sm:py-10">
      <section className="w-full max-w-lg bg-[#f4f1e8] px-5 py-8 text-[#161a18] sm:px-10 sm:py-10">
          <div className="w-full">
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#161a18] text-[#f4f1e8]">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-3xl">Sign in to your organization</h2>
              <p className="mt-2 text-sm leading-6 text-[#69706a]">Use your organization identifier and existing account credentials.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div role="alert" className="flex gap-3 border border-[#ef4b3f]/30 bg-[#ef4b3f]/10 p-3 text-sm text-[#a52e27]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p>{error}</p>
                    {organizationOptions.length > 0 && <p className="mt-1 text-xs">Choose an organization below, then sign in again.</p>}
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium" htmlFor="organization">
                Organization / Company
                <div className="relative mt-2">
                  <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#69706a]" aria-hidden="true" />
                  <input id="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Company name or organization code" required className="h-11 w-full border border-[#c9c7bc] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#161a18]" />
                </div>
              </label>

              {organizationOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#69706a]">Select your organization</p>
                  <div className="grid gap-2">
                    {organizationOptions.map((option) => (
                      <button type="button" key={option.id} onClick={() => { setOrganization(option.slug); setOrganizationOptions([]); setError('') }} className="flex min-h-11 items-center justify-between border border-[#c9c7bc] bg-white px-3 text-left text-sm hover:border-[#161a18]">
                        <span>{option.name}</span><span className="font-mono text-xs text-[#69706a]">{option.slug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium" htmlFor="username">
                Username
                <div className="relative mt-2">
                  <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#69706a]" aria-hidden="true" />
                  <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="h-11 w-full border border-[#c9c7bc] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#161a18]" />
                </div>
              </label>

              <label className="block text-sm font-medium" htmlFor="password">
                Password
                <div className="relative mt-2">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="h-11 w-full border border-[#c9c7bc] bg-white px-3 pr-11 text-sm outline-none transition focus:border-[#161a18]" />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-2.5 text-[#69706a] hover:text-[#161a18]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </label>

              <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 bg-[#161a18] text-sm font-semibold text-[#f4f1e8] transition hover:bg-[#2b332e] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-[#69706a]">Need access or forgot your password? Contact your organization administrator.</p>
          </div>
      </section>
    </main>
  )
}

import { useState } from 'react'
import logo from '../assets/logo.ico'
import { useAuth } from '../context/useAuth.js'
import HomePage from './HomePage.jsx'

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.6 4.8 9.5 6.3a1.3 1.3 0 010 1.4 15 15 0 01-3.1 3.4M6.2 6.3a15.4 15.4 0 00-3.7 5 1.3 1.3 0 000 1.4C3.4 14.2 6.8 19 12 19a10.8 10.8 0 004.1-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      <path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


function Field({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  minLength,
  required = true,
  trailingAction,
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#353d43]">
      {label}
      <span className="relative">
        <input
          name={name}
          required={required}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          className={`h-12 w-full rounded-xl border border-[#d9dfdc] bg-white px-4 text-[15px] font-normal text-[#202b39] outline-none transition placeholder:text-[#9aa5a1] hover:border-[#b9c8c1] focus:border-[#258b68] focus:ring-4 focus:ring-[#258b68]/10 ${trailingAction ? 'pr-12' : ''}`}
        />
        {trailingAction}
      </span>
    </label>
  )
}

function LoginRegister() {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const { user, login, register } = useAuth()
  const isRegister = mode === 'register'

  function changeMode(nextMode) {
    setMode(nextMode)
    setShowPassword(false)
    setFormError('')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError('')
    setNotice('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = formData.get('email').trim()
    const password = formData.get('password')

    try {
      if (isRegister) {
        const department = formData.get('department').trim()
        await register({
          email,
          password,
          firstName: formData.get('firstName').trim(),
          lastName: formData.get('lastName').trim(),
          ...(department ? { department } : {}),
        })
        form.reset()
        setMode('login')
        setShowPassword(false)
        setNotice('Your account has been created. Please sign in.')
      } else {
        await login({ email, password })
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to complete your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return <HomePage />
  }

  return (
    <main className="min-h-screen bg-[#f3f4f1] text-[#202b39]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" aria-label="PeopleDesk home" className="inline-flex items-center gap-3">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src={logo} alt="" className="size-full rounded-full object-cover" />
          </span>

        </a>
        <p className="hidden text-sm text-[#727d79] sm:block">
          {isRegister ? 'Already have an account?' : 'New to PeopleDesk?'}{' '}
          <button
            type="button"
            onClick={() => changeMode(isRegister ? 'login' : 'register')}
            className="font-semibold text-[#237c5e] transition hover:text-[#185f47] hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-88px)] max-w-6xl items-start justify-center px-5 pb-10 pt-6 sm:px-8 sm:pt-10 lg:items-center lg:px-12 lg:pb-16 lg:pt-0">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#e0e4df] bg-[#fcfcfa] shadow-[0_18px_60px_rgba(28,45,37,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden flex-col justify-between bg-[#e7eee9] p-10 lg:flex xl:p-12">
            <div>
              <p className="text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#183047]">
                A better way
                <br />
                to care for
                <br />
                your people.
              </p>
              <p className="mt-6 max-w-xs text-sm leading-6 text-[#66766f]">
                One thoughtful home for your team, their work, and everything in between.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-10 lg:p-12 xl:p-16">
            <div className="mx-auto w-full max-w-105">
              <div className="mb-7">
                <p className="mb-3 text-sm font-medium text-[#258b68]">
                  People operations, made simple
                </p>
                <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[#202b39] sm:text-[2.25rem]">
                  {isRegister ? 'Create your workspace' : 'Welcome'}
                </h1>
                <p className="mt-3 text-[15px] leading-6 text-[#727d79]">
                  {isRegister
                    ? 'Bring your team together in one calm, clear place.'
                    : 'Sign in to continue to your PeopleDesk workspace.'}
                </p>
              </div>

              <div className="mb-7 flex border-b border-[#e0e4df]" role="tablist" aria-label="Account access">
                <button
                  id="login-tab"
                  type="button"
                  role="tab"
                  aria-selected={!isRegister}
                  aria-controls="auth-panel"
                  onClick={() => changeMode('login')}
                  className={`-mb-px flex-1 border-b-2 pb-3 text-sm font-semibold transition ${!isRegister ? 'border-[#258b68] text-[#237c5e]' : 'border-transparent text-[#969f9b] hover:text-[#596962]'}`}
                >
                  Sign in
                </button>
                <button
                  id="register-tab"
                  type="button"
                  role="tab"
                  aria-selected={isRegister}
                  aria-controls="auth-panel"
                  onClick={() => changeMode('register')}
                  className={`-mb-px flex-1 border-b-2 pb-3 text-sm font-semibold transition ${isRegister ? 'border-[#258b68] text-[#237c5e]' : 'border-transparent text-[#969f9b] hover:text-[#596962]'}`}
                >
                  Register
                </button>
              </div>

              <div id="auth-panel" role="tabpanel" aria-labelledby={isRegister ? 'register-tab' : 'login-tab'}>
                {formError && (
                  <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                )}
                {notice && (
                  <p role="status" className="mb-4 rounded-xl border border-[#b8ddcd] bg-[#eef7f2] px-4 py-3 text-sm text-[#237c5e]">
                    {notice}
                  </p>
                )}
                <form key={mode} className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  {isRegister && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="First name"
                        name="firstName"
                        placeholder="Alex"
                        autoComplete="given-name"
                      />
                      <Field
                        label="Last name"
                        name="lastName"
                        placeholder="Morgan"
                        autoComplete="family-name"
                      />
                    </div>
                  )}
                  <Field
                    label="Work email"
                    name="email"
                    type="email"
                    placeholder="youremail@company.com"
                    autoComplete="email"
                  />
                  {isRegister && (
                    <Field
                      label="Department (optional)"
                      name="department"
                      placeholder="e.g. People Operations"
                      autoComplete="organization-title"
                      required={false}
                    />
                  )}
                  <Field
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    minLength={isRegister ? 8 : undefined}
                    trailingAction={
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#89958f] transition hover:bg-[#f0f3f0] hover:text-[#237c5e] focus:outline-none focus:ring-2 focus:ring-[#258b68]/30"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon hidden={showPassword} />
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#183047] text-sm font-semibold text-white shadow-[0_5px_12px_rgba(24,48,71,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#10253a] hover:shadow-[0_8px_18px_rgba(24,48,71,0.18)] active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#183047]/20"
                  >
                    {isSubmitting
                      ? 'Please wait...'
                      : isRegister
                        ? 'Create account'
                        : 'Sign in'}
                    {!isSubmitting && <ArrowRightIcon />}
                  </button>
                </form>
              </div>


            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginRegister

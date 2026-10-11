import { useAuth } from '../context/useAuth.js'

function HomePage() {
  const { user, logout } = useAuth()
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f1] px-5 text-[#202b39]">
      <section className="w-full max-w-xl rounded-3xl border border-[#e0e4df] bg-[#fcfcfa] p-8 shadow-[0_18px_60px_rgba(28,45,37,0.08)] sm:p-12">
        <p className="text-sm font-semibold text-[#258b68]">PeopleDesk</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Welcome{name ? `, ${name}` : ''}!
        </h1>
        <p className="mt-3 text-[#727d79]">
          You’re signed in. Your PeopleDesk workspace is ready.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-8 rounded-xl bg-[#183047] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10253a] focus:outline-none focus:ring-4 focus:ring-[#183047]/20"
        >
          Sign out
        </button>
      </section>
    </main>
  )
}

export default HomePage

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-3xl text-center">

        <p className="text-sm font-semibold tracking-[0.3em] text-blue-600 uppercase">
          Children's Convention 2026
        </p>

        <h1 className="mt-4 text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
          NINAD 2026
        </h1>

        <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-blue-600">
          BHURGYALEM FEST
        </h2>

        <p className="mt-8 text-lg text-gray-600">
          Parish Registration Portal
        </p>

        <p className="mt-3 text-gray-500 max-w-lg mx-auto">
          Register your parish coordinators and participating children
          for NINAD 2026.
        </p>

        <a
  href="/register"
  className="inline-block mt-10 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 transition"
>
  Start Registration
</a>

        <p className="mt-6 text-sm text-gray-400">
          One Parish • One Registration • Multiple Coordinators
        </p>

      </div>
    </main>
  );
}
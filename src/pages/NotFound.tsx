import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 py-16">
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-100 blur-3xl opacity-60"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-xl sm:p-12 text-center">
        {/* Icon badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
          <Search className="h-7 w-7" />
        </div>

        {/* Big 404 */}
        <h1 className="mt-6 text-7xl font-black tracking-tight text-gray-900 sm:text-8xl">
          4<span className="text-indigo-600">0</span>4
        </h1>

        <h2 className="mt-3 text-xl font-semibold text-gray-900">
          Page not found
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          The page you're looking for doesn't exist, was moved, or is
          temporarily unavailable. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>

        {/* Helpful hint */}
        <p className="mt-8 text-xs text-gray-400">
          Need help? Check the URL or contact support.
        </p>
      </div>
    </div>
  );
}

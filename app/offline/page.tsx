/**
 * Offline Fallback Page
 *
 * Displayed when the user is offline and tries to access a page
 * that is not cached by the service worker
 */

export const metadata = {
  title: 'Offline - Simple Suppers',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-teal-500 dark:text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          You're Offline
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          It looks like you've lost your internet connection. Some features may not be available right now.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            What you can do:
          </h2>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>View previously loaded meal plans</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Browse cached content</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Check your internet connection</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>

        <a
          href="/"
          className="inline-block mt-4 text-teal-600 dark:text-teal-400 hover:underline"
        >
          Go to Home
        </a>
      </div>
    </div>
  )
}

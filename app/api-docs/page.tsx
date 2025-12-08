'use client'

import { useState } from 'react'

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('auth')

  const endpoints = {
    auth: {
      title: 'Authentication',
      routes: [
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          body: {
            email: 'user@example.com',
            password: 'password123',
            name: 'John Doe',
            user_type: 'user'
          },
          response: {
            success: true,
            data: {
              user: {
                id: 'uuid',
                email: 'user@example.com',
                name: 'John Doe',
                user_type: 'user'
              },
              session: {
                access_token: 'jwt-token'
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Authenticate existing user',
          body: {
            email: 'user@example.com',
            password: 'password123'
          },
          response: {
            success: true,
            data: {
              user: {
                id: 'uuid',
                email: 'user@example.com',
                name: 'John Doe',
                user_type: 'user'
              },
              token: 'jwt-token'
            }
          }
        }
      ]
    },
    'meal-plans': {
      title: 'Meal Plans',
      routes: [
        {
          method: 'GET',
          path: '/api/meal-plans',
          description: 'Get paginated list of meal plans with filtering',
          queryParams: 'category, duration_type, min_price, max_price, dietary_tags, search, is_free, limit, offset',
          response: {
            success: true,
            data: {
              meal_plans: [
                {
                  id: 'uuid',
                  title: 'Quick & Cheap Weekly Meals',
                  description: '7 dinners and 7 lunch ideas...',
                  final_price: 35.00,
                  category: 'budget-friendly',
                  dietary_tags: ['family', 'budget'],
                  provider: {
                    business_name: 'Mom of Five Kitchen'
                  }
                }
              ],
              total: 25
            }
          }
        },
        {
          method: 'GET',
          path: '/api/meal-plans/{id}',
          description: 'Get detailed meal plan with all days and meals',
          auth: false,
          response: {
            success: true,
            data: {
              meal_plan: {
                id: 'uuid',
                title: 'Quick & Cheap Weekly Meals',
                meal_plan_days: [
                  {
                    day_number: 1,
                    day_title: 'Monday',
                    meals: [
                      {
                        meal_type: 'dinner',
                        meal_name: 'Spaghetti with Meat Sauce',
                        ingredients: ['1 lb spaghetti', '1 lb ground beef'],
                        instructions: '1. Brown ground beef...'
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      ]
    },
    purchases: {
      title: 'Purchases',
      routes: [
        {
          method: 'POST',
          path: '/api/purchases/create-intent',
          description: 'Create payment intent for meal plan purchase',
          auth: true,
          body: {
            meal_plan_id: 'uuid'
          },
          response: {
            success: true,
            data: {
              payment_intent: {
                id: 'pi_mock_12345',
                amount: 3500,
                currency: 'usd'
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/api/purchases/confirm',
          description: 'Confirm completed payment',
          auth: true,
          body: {
            payment_intent_id: 'pi_mock_12345',
            meal_plan_id: 'uuid'
          }
        },
        {
          method: 'GET',
          path: '/api/purchases/history',
          description: 'Get user purchase history',
          auth: true,
          queryParams: 'limit, offset'
        }
      ]
    },
    user: {
      title: 'User Management',
      routes: [
        {
          method: 'GET',
          path: '/api/user/profile',
          description: 'Get user profile',
          auth: true
        },
        {
          method: 'PUT',
          path: '/api/user/profile',
          description: 'Update user profile',
          auth: true,
          body: {
            name: 'John Smith',
            dietary_preferences: ['vegetarian']
          }
        },
        {
          method: 'GET',
          path: '/api/user/dashboard',
          description: 'Get user dashboard data',
          auth: true
        }
      ]
    },
    'shopping-lists': {
      title: 'Shopping Lists',
      routes: [
        {
          method: 'POST',
          path: '/api/shopping-lists/generate',
          description: 'Generate shopping list for purchased meal plan',
          auth: true,
          body: {
            meal_plan_id: 'uuid',
            selected_days: [1, 2, 3]
          }
        },
        {
          method: 'GET',
          path: '/api/shopping-lists/{id}/download',
          description: 'Download shopping list as PDF',
          auth: true
        }
      ]
    },
    creators: {
      title: 'Creator Management',
      routes: [
        {
          method: 'GET',
          path: '/api/creators/profile',
          description: 'Get creator profile',
          auth: 'Creator'
        },
        {
          method: 'POST',
          path: '/api/creators/profile',
          description: 'Update creator profile',
          auth: 'Creator'
        },
        {
          method: 'GET',
          path: '/api/creators/dashboard',
          description: 'Get creator dashboard',
          auth: 'Creator'
        },
        {
          method: 'GET',
          path: '/api/creators/meal-plans',
          description: 'Get creator meal plans',
          auth: 'Creator'
        },
        {
          method: 'POST',
          path: '/api/creators/meal-plans',
          description: 'Create new meal plan',
          auth: 'Creator'
        },
        {
          method: 'PATCH',
          path: '/api/creators/meal-plans/{id}',
          description: 'Update meal plan',
          auth: 'Creator'
        },
        {
          method: 'DELETE',
          path: '/api/creators/meal-plans/{id}',
          description: 'Delete meal plan',
          auth: 'Creator'
        },
        {
          method: 'POST',
          path: '/api/user/enable-creator-mode',
          description: 'Enable creator mode for user',
          auth: true
        }
      ]
    },
    admin: {
      title: 'Admin Panel',
      routes: [
        {
          method: 'GET',
          path: '/api/admin/dashboard',
          description: 'Get admin dashboard with platform stats',
          auth: 'Admin'
        },
        {
          method: 'GET',
          path: '/api/admin/users',
          description: 'Get all users with filtering',
          auth: 'Admin'
        },
        {
          method: 'GET',
          path: '/api/admin/meal-plans',
          description: 'Get all meal plans with filtering',
          auth: 'Admin'
        },
        {
          method: 'GET',
          path: '/api/admin/pricing-rules',
          description: 'Get pricing rules',
          auth: 'Admin'
        },
        {
          method: 'POST',
          path: '/api/admin/pricing-rules',
          description: 'Create new pricing rule',
          auth: 'Admin'
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Simple Suppers API Documentation</h1>
          <p className="text-gray-600">
            Base URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/api</code>
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Endpoints</h3>
            <nav className="space-y-2">
              {Object.entries(endpoints).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedEndpoint === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {endpoints[selectedEndpoint as keyof typeof endpoints].title}
            </h2>

            <div className="space-y-8">
              {endpoints[selectedEndpoint as keyof typeof endpoints].routes.map((route, index) => (
                <div key={index} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      route.method === 'GET' ? 'bg-green-100 text-green-800' :
                      route.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      route.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {route.method}
                    </span>
                    <code className="text-gray-800 font-mono">{route.path}</code>
                    {'auth' in route && route.auth && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                        🔒 {typeof route.auth === 'string' ? route.auth : 'Auth Required'}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{route.description}</p>

                  {'queryParams' in route && route.queryParams && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Query Parameters:</h4>
                      <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                        {route.queryParams}
                      </code>
                    </div>
                  )}

                  {'body' in route && route.body && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Request Body:</h4>
                      <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
                        <code>{JSON.stringify(route.body, null, 2)}</code>
                      </pre>
                    </div>
                  )}

                  {'response' in route && route.response && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                      <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
                        <code>{JSON.stringify(route.response, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
          <p className="text-gray-600 mb-4">
            Most endpoints require authentication. Include the JWT token in the Authorization header:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            <code>Authorization: Bearer &lt;your-jwt-token&gt;</code>
          </pre>
        </div>

        {/* Error Codes */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Codes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <code className="text-green-600">200</code> - Success
            </div>
            <div>
              <code className="text-green-600">201</code> - Created
            </div>
            <div>
              <code className="text-red-600">400</code> - Bad Request
            </div>
            <div>
              <code className="text-red-600">401</code> - Unauthorized
            </div>
            <div>
              <code className="text-red-600">403</code> - Forbidden
            </div>
            <div>
              <code className="text-red-600">404</code> - Not Found
            </div>
            <div>
              <code className="text-red-600">429</code> - Rate Limited
            </div>
            <div>
              <code className="text-red-600">500</code> - Server Error
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
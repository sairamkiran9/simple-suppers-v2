/**
 * API Client Tests
 *
 * Tests the core API client functionality including:
 * - GET, POST, PATCH, PUT, DELETE requests
 * - Query parameter serialization
 * - Authentication token handling
 * - Error handling (simple and detailed formats)
 * - Network error handling
 */

import { apiClient, ApiClient } from '@/lib/api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: '1', title: 'Test Meal Plan' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      })

      const result = await apiClient.get('/meal-plans')

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })

    it('should serialize query parameters correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        category: 'family',
        limit: 10,
        tags: ['vegetarian', 'quick']
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?category=family&limit=10&tags=vegetarian%2Cquick',
        expect.any(Object)
      )
    })

    it('should handle undefined and null parameters', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        category: 'family',
        search: undefined,
        limit: null as any
      })

      // Should only include category, not undefined/null values
      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?category=family',
        expect.any(Object)
      )
    })

    it('should include auth token if present in localStorage', async () => {
      localStorage.setItem('auth_token', 'test-token-123')
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.get('/user/profile')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      )
    })

    it('should not include auth header if no token in localStorage', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.get('/meal-plans')

      const fetchCall = (fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers
      expect(headers['Authorization']).toBeUndefined()
    })
  })

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const body = { email: 'test@example.com', password: 'password123' }
      const mockResponse = { user: { id: '1' }, token: 'abc' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      })

      await apiClient.post('/auth/login', body)

      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle POST without body', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.post('/some-endpoint')

      const fetchCall = (fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[1].body).toBeUndefined()
    })

    it('should include auth token in POST requests', async () => {
      localStorage.setItem('auth_token', 'test-token-456')
      const body = { meal_plan_id: 'plan-123' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.post('/purchases/create-intent', body)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-456'
          })
        })
      )
    })
  })

  describe('PATCH requests', () => {
    it('should make PATCH request with body', async () => {
      const body = { name: 'Updated Name' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: body })
      })

      await apiClient.patch('/user/profile', body)

      expect(fetch).toHaveBeenCalledWith(
        '/api/user/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body)
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request with body', async () => {
      const body = { business_name: 'New Business Name' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: body })
      })

      await apiClient.put('/providers/profile', body)

      expect(fetch).toHaveBeenCalledWith(
        '/api/providers/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body)
        })
      )
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.delete('/some-resource/123')

      expect(fetch).toHaveBeenCalledWith(
        '/api/some-resource/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle 401 unauthorized error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      })

      await expect(apiClient.get('/user/profile')).rejects.toThrow('Unauthorized')
    })

    it('should handle simple error format (string)', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Bad request' })
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Bad request')
    })

    it('should handle detailed error format (object)', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid data provided',
            details: { field: 'email' }
          }
        })
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid data provided')
    })

    it('should handle 404 not found error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Meal plan not found'
        })
      })

      await expect(apiClient.get('/meal-plans/nonexistent')).rejects.toThrow('Meal plan not found')
    })

    it('should handle 429 rate limit error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests'
          }
        })
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Too many requests')
    })

    it('should handle 500 internal server error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error'
        })
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Internal server error')
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })

    it('should handle generic non-Error exceptions', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce('Some string error')

      await expect(apiClient.get('/test')).rejects.toThrow('An unexpected error occurred')
    })

    it('should provide default error message if error object has no message', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'UNKNOWN' }
        })
      })

      await expect(apiClient.get('/test')).rejects.toThrow('An error occurred')
    })
  })

  describe('Base URL configuration', () => {
    it('should use NEXT_PUBLIC_API_BASE_URL if set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com'

      const client = new ApiClient()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      client.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )

      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv
    })

    it('should fallback to /api if NEXT_PUBLIC_API_BASE_URL is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL
      delete process.env.NEXT_PUBLIC_API_BASE_URL

      const client = new ApiClient()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      client.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.any(Object)
      )

      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv
    })
  })

  describe('Server-side rendering (SSR) compatibility', () => {
    it('should return null for auth token when window is undefined', async () => {
      // Simulate SSR by temporarily removing window
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })

      await apiClient.get('/test')

      const fetchCall = (fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers
      expect(headers['Authorization']).toBeUndefined()

      // Restore window
      // @ts-ignore
      global.window = originalWindow
    })
  })

  describe('Response data handling', () => {
    it('should return full response object including success flag', async () => {
      const mockData = { plans: [], total: 0 }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      })

      const result = await apiClient.get('/meal-plans')

      expect(result).toEqual({
        success: true,
        data: mockData
      })
    })

    it('should handle response with additional metadata fields', async () => {
      const mockResponse = {
        success: true,
        data: { items: [] },
        meta: { page: 1, total: 10 }
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.get('/test')

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Array parameter serialization', () => {
    it('should serialize array as comma-separated values', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        dietary_tags: ['vegetarian', 'gluten-free', 'dairy-free']
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?dietary_tags=vegetarian%2Cgluten-free%2Cdairy-free',
        expect.any(Object)
      )
    })

    it('should handle empty array parameters', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        category: 'family',
        tags: []
      })

      // Empty array should result in "tags=" in URL
      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?category=family&tags=',
        expect.any(Object)
      )
    })
  })

  describe('Boolean parameter serialization', () => {
    it('should serialize boolean true as string "true"', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        is_free: true
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?is_free=true',
        expect.any(Object)
      )
    })

    it('should serialize boolean false as string "false"', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        is_free: false
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?is_free=false',
        expect.any(Object)
      )
    })
  })

  describe('Number parameter serialization', () => {
    it('should serialize numbers correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.get('/meal-plans', {
        min_price: 10,
        max_price: 50.99,
        limit: 20,
        offset: 0
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/meal-plans?min_price=10&max_price=50.99&limit=20&offset=0',
        expect.any(Object)
      )
    })
  })
})

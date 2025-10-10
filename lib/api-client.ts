/**
 * API Client for Simple Suppers v2
 *
 * Provides a centralized HTTP client for making API requests with:
 * - Automatic base URL handling
 * - JWT token management via localStorage
 * - Type-safe request/response handling
 * - Consistent error handling
 * - Query parameter serialization
 */

import type { APIResponse } from './api/errors'

export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
  }

  /**
   * Retrieves authentication token from localStorage
   * Returns null during server-side rendering
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Builds URL with query parameters
   * @param endpoint - API endpoint path
   * @param params - Query parameters object
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint}`
    if (!params) return url

    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','))
        } else {
          queryParams.append(key, String(value))
        }
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  /**
   * Makes an HTTP request
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param options - Request options including body and query params
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: { body?: any; params?: Record<string, any> } = {}
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint, options.params)
    const token = this.getAuthToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (options.body) {
      config.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Handle both error formats: simple string and detailed object
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || 'An error occurred'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  /**
   * Makes a GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>('GET', endpoint, { params })
  }

  /**
   * Makes a POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   */
  async post<T>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    return this.request<T>('POST', endpoint, { body })
  }

  /**
   * Makes a PATCH request
   * @param endpoint - API endpoint
   * @param body - Request body
   */
  async patch<T>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body })
  }

  /**
   * Makes a PUT request
   * @param endpoint - API endpoint
   * @param body - Request body
   */
  async put<T>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    return this.request<T>('PUT', endpoint, { body })
  }

  /**
   * Makes a DELETE request
   * @param endpoint - API endpoint
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', endpoint)
  }
}

// Export singleton instance for use throughout the application
export const apiClient = new ApiClient()

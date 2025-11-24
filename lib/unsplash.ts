// Unsplash API Client

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
const UNSPLASH_API_BASE = 'https://api.unsplash.com'

// Validate API key is configured
function getAccessKey(): string {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is not configured. Please add it to .env.local')
  }
  return UNSPLASH_ACCESS_KEY
}

export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  description: string | null
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
  width: number
  height: number
}

export interface UnsplashSearchResult {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

// Search photos by query
export async function searchUnsplashPhotos(
  query: string,
  page = 1,
  perPage = 12
): Promise<UnsplashSearchResult> {
  const params = new URLSearchParams({
    query,
    page: page.toString(),
    per_page: perPage.toString(),
    orientation: 'squarish' // Better for Instagram-style feed
  })

  const response = await fetch(
    `${UNSPLASH_API_BASE}/search/photos?${params}`,
    {
      headers: {
        Authorization: `Client-ID ${getAccessKey()}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to search Unsplash photos')
  }

  return response.json()
}

// Get curated food photos (default suggestions)
export async function getFoodPhotos(page = 1, perPage = 12): Promise<UnsplashPhoto[]> {
  // Search for food-related photos by default
  const result = await searchUnsplashPhotos('food cooking recipe', page, perPage)
  return result.results
}

// Track download (required by Unsplash API guidelines)
export async function trackDownload(photoId: string): Promise<void> {
  try {
    await fetch(
      `${UNSPLASH_API_BASE}/photos/${photoId}/download`,
      {
        headers: {
          Authorization: `Client-ID ${getAccessKey()}`
        }
      }
    )
  } catch (error) {
    console.error('Failed to track Unsplash download:', error)
  }
}

// Get attribution text for a photo
export function getAttribution(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`
}

// Get the best URL for display (regular size is good balance of quality/speed)
export function getDisplayUrl(photo: UnsplashPhoto): string {
  return photo.urls.regular
}

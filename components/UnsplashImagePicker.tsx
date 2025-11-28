'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { searchUnsplashPhotos, getFoodPhotos, trackDownload, getAttribution, type UnsplashPhoto } from '@/lib/unsplash'
import { useDebounce } from '@/hooks/useDebounce'
import Image from 'next/image'

interface UnsplashImagePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (imageUrl: string, attribution: string) => void
}

export function UnsplashImagePicker({ open, onClose, onSelect }: UnsplashImagePickerProps) {
  const [query, setQuery] = useState('')
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null)

  const debouncedQuery = useDebounce(query, 500)

  const loadDefaultPhotos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await getFoodPhotos()
      setPhotos(results)
    } catch (err) {
      setError('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchPhotos = useCallback(async (searchQuery: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await searchUnsplashPhotos(searchQuery)
      setPhotos(result.results)
    } catch (err) {
      setError('Failed to search photos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load default food photos on open
  useEffect(() => {
    if (open && photos.length === 0 && !query) {
      loadDefaultPhotos()
    }
  }, [open, photos.length, query, loadDefaultPhotos])

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchPhotos(debouncedQuery)
    } else if (open) {
      loadDefaultPhotos()
    }
  }, [debouncedQuery, open, loadDefaultPhotos, searchPhotos])

  const handleSelect = async (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo)
  }

  const handleConfirm = async () => {
    if (!selectedPhoto) return

    // Track download as required by Unsplash
    await trackDownload(selectedPhoto.id)

    // Pass the regular size URL and attribution
    onSelect(selectedPhoto.urls.regular, getAttribution(selectedPhoto))
    handleClose()
  }

  const handleClose = () => {
    setSelectedPhoto(null)
    setQuery('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col bg-white dark:bg-gray-800 p-0">
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Choose an Image
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for food, recipes, cooking..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Photo Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No photos found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => handleSelect(photo)}
                  className={`relative aspect-square overflow-hidden rounded-lg transition-all ${selectedPhoto?.id === photo.id
                    ? 'ring-4 ring-teal-500'
                    : 'hover:opacity-80 hover:ring-2 hover:ring-gray-300'
                    }`}
                >
                  <Image
                    src={photo.urls.small}
                    alt={photo.alt_description || 'Unsplash photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={300}
                    height={300}
                  />
                  {selectedPhoto?.id === photo.id && (
                    <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                      <div className="bg-teal-500 text-white rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Always visible */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
          {/* Selected Photo Preview & Attribution */}
          {selectedPhoto && (
            <div className="mb-4">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <Image
                  src={selectedPhoto.urls.small}
                  alt={selectedPhoto.alt_description || ''}
                  className="w-12 h-12 object-cover rounded"
                  width={48}
                  height={48}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Photo by{' '}
                    <a
                      href={`${selectedPhoto.user.links.html}?utm_source=simple_suppers&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline font-medium"
                    >
                      {selectedPhoto.user.name}
                    </a>{' '}
                    on Unsplash
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPhoto}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {selectedPhoto ? 'Use This Image' : 'Select an Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

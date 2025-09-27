import { cn, generateStars, showSuccessNotification } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('resolves Tailwind conflicts', () => {
      const result = cn('p-4', 'px-6')
      expect(result).toBe('p-4 px-6')
    })

    it('handles undefined and null values', () => {
      const result = cn('valid-class', undefined, null, 'another-class')
      expect(result).toBe('valid-class another-class')
    })
  })

  describe('generateStars', () => {
    it('generates correct stars for whole numbers', () => {
      expect(generateStars(5)).toBe('★★★★★')
      expect(generateStars(3)).toBe('★★★☆☆')
      expect(generateStars(1)).toBe('★☆☆☆☆')
      expect(generateStars(0)).toBe('☆☆☆☆☆')
    })

    it('handles decimal ratings by flooring', () => {
      expect(generateStars(4.7)).toBe('★★★★☆')
      expect(generateStars(2.3)).toBe('★★☆☆☆')
      expect(generateStars(3.9)).toBe('★★★☆☆')
    })

    it('handles edge cases', () => {
      expect(generateStars(-1)).toBe('☆☆☆☆☆')
      expect(generateStars(6)).toBe('★★★★★')
    })

    it('always returns 5 total stars', () => {
      const ratings = [0, 1, 2, 3, 4, 5, 2.5, 4.8]
      ratings.forEach(rating => {
        const stars = generateStars(rating)
        expect(stars.length).toBe(5)
      })
    })
  })

  describe('showSuccessNotification', () => {
    beforeEach(() => {
      // Clear any existing notifications
      document.body.innerHTML = ''
      jest.clearAllTimers()
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('creates a notification element', () => {
      showSuccessNotification('Test message')

      const notification = document.querySelector('div')
      expect(notification).toBeInTheDocument()
      expect(notification?.textContent).toBe('Test message')
    })

    it('applies correct styles to notification', () => {
      showSuccessNotification('Test message')

      const notification = document.querySelector('div')
      expect(notification?.style.position).toBe('fixed')
      expect(notification?.style.top).toBe('20px')
      expect(notification?.style.right).toBe('20px')
      expect(notification?.style.zIndex).toBe('300')
    })

    it('removes notification after 3 seconds', () => {
      showSuccessNotification('Test message')

      let notification = document.querySelector('div')
      expect(notification).toBeInTheDocument()

      // Fast-forward time
      jest.advanceTimersByTime(3000)

      notification = document.querySelector('div')
      expect(notification).not.toBeInTheDocument()
    })

    it('handles multiple notifications', () => {
      showSuccessNotification('Message 1')
      showSuccessNotification('Message 2')

      const notifications = document.querySelectorAll('div')
      expect(notifications).toHaveLength(2)
      expect(notifications[0].textContent).toBe('Message 1')
      expect(notifications[1].textContent).toBe('Message 2')
    })
  })
})
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { useCreateFeedPost } from '@/hooks/useCreateFeedPost'
import { toast } from 'sonner'
import { Image as ImageIcon, X } from 'lucide-react'
import { UnsplashImagePicker } from './UnsplashImagePicker'

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  post_type: z.enum(['meal_plan', 'recipe_tip', 'announcement']),
  image_url: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional()
})

type CreatePostForm = z.infer<typeof createPostSchema>

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
  onPostCreated: () => void
}

export function CreatePostModal({ open, onClose, onPostCreated }: CreatePostModalProps) {
  const { createPost, loading } = useCreateFeedPost()
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; attribution: string } | null>(null)

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
      post_type: 'recipe_tip',
      image_url: '',
      tags: ''
    }
  })

  const handleImageSelect = (imageUrl: string, attribution: string) => {
    setSelectedImage({ url: imageUrl, attribution })
    form.setValue('image_url', imageUrl)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    form.setValue('image_url', '')
  }

  const handleClose = () => {
    form.reset()
    setSelectedImage(null)
    onClose()
  }

  const onSubmit = async (data: CreatePostForm) => {
    try {
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : []

      const post = await createPost({
        title: data.title,
        content: data.content,
        post_type: data.post_type,
        image_url: data.image_url || undefined,
        tags
      })

      if (post) {
        toast.success('Post created successfully!')
        form.reset()
        setSelectedImage(null)
        onClose()
        onPostCreated()
      }
    } catch (error) {
      toast.error('Failed to create post')
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="post_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="recipe_tip">Recipe Tip</SelectItem>
                      <SelectItem value="meal_plan">Meal Plan</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, tips, or announcements..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image (Optional)</label>
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage.url}
                    alt="Selected"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1">{selectedImage.attribution}</p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImagePicker(true)}
                  className="w-full h-32 border-dashed flex flex-col items-center justify-center gap-2"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to add an image from Unsplash</span>
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="healthy, quick, vegetarian (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Unsplash Image Picker Modal */}
    <UnsplashImagePicker
      open={showImagePicker}
      onClose={() => setShowImagePicker(false)}
      onSelect={handleImageSelect}
    />
    </>
  )
}
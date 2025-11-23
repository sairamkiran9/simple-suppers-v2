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
        onClose()
        onPostCreated()
      }
    } catch (error) {
      toast.error('Failed to create post')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
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

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="button" variant="outline" onClick={onClose}>
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
  )
}
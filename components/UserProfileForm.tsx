'use client'

/**
 * UserProfileForm Component
 *
 * Form for updating user profile information
 * Includes name and dietary preferences with validation
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUserProfile } from '@/hooks/useUserProfile'
import type { ApiUser } from '@/lib/api-types'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dietary_preferences: z.array(z.string()).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Available dietary preferences
const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'nut-free', label: 'Nut-Free' },
  { id: 'low-carb', label: 'Low-Carb' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
]

interface UserProfileFormProps {
  user: ApiUser
  onSuccess?: () => void
}

export function UserProfileForm({ user, onSuccess }: UserProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      dietary_preferences: user.dietary_preferences || [],
    },
  })

  const { updateProfile, isUpdating, error } = useUserProfile({
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully!')
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update profile')
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        name: data.name,
        dietary_preferences: data.dietary_preferences || [],
      })
    } catch (err) {
      // Error is handled by the hook's onError callback
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and dietary preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      {...field}
                      disabled={isUpdating}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the name that will be displayed on your account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field (Read-only) */}
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input value={user.email} disabled />
              </FormControl>
              <FormDescription>
                Your email address cannot be changed
              </FormDescription>
            </FormItem>

            {/* Dietary Preferences */}
            <FormField
              control={form.control}
              name="dietary_preferences"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Dietary Preferences</FormLabel>
                    <FormDescription>
                      Select your dietary preferences to get personalized meal plan
                      recommendations
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {DIETARY_OPTIONS.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="dietary_preferences"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          option.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                  disabled={isUpdating}
                                  aria-label={option.label}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

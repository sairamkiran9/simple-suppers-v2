import { z } from 'zod'

// Common schemas
export const UUIDSchema = z.string().uuid()
export const EmailSchema = z.string().email()
export const PasswordSchema = z.string().min(6, 'Password must be at least 6 characters')

// Auth schemas
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1, 'Name is required'),
  user_type: z.enum(['user', 'provider'], {
    required_error: 'User type is required'
  })
})

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required')
})

// User schemas
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  dietary_preferences: z.array(z.string()).optional()
}).refine(
  (data) => data.name !== undefined || data.dietary_preferences !== undefined,
  { message: 'At least one field must be provided for update' }
)

// Meal plan schemas
export const MealPlanQuerySchema = z.object({
  category: z.string().optional(),
  duration_type: z.enum(['daily', 'weekly', 'monthly']).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  dietary_tags: z.string().optional(), // comma-separated, will be split
  search: z.string().optional(),
  is_free: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

export const MealSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  meal_name: z.string().min(1, 'Meal name is required'),
  description: z.string().optional(),
  prep_time_minutes: z.number().min(0).optional(),
  cook_time_minutes: z.number().min(0).optional(),
  servings: z.number().min(1).default(1),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient required'),
  instructions: z.string().min(1, 'Instructions are required'),
  image_url: z.string().url().optional(),
  nutritional_info: z.any().optional()
})

export const MealPlanDaySchema = z.object({
  day_number: z.number().min(1),
  day_title: z.string().min(1, 'Day title is required'),
  meals: z.array(MealSchema).min(1, 'At least one meal required')
})

export const CreateMealPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration_days: z.number().min(1),
  duration_type: z.enum(['daily', 'weekly', 'monthly']),
  suggested_price: z.number().min(0),
  category: z.string().min(1, 'Category is required'),
  dietary_tags: z.array(z.string()).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  is_free: z.boolean().default(false),
  meal_plan_days: z.array(MealPlanDaySchema).min(1, 'At least one day required')
})

export const UpdateMealPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  dietary_tags: z.array(z.string()).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

// Provider schemas
export const CompleteProviderProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  bio: z.string().min(1, 'Bio is required'),
  profile_image_url: z.string().url().optional()
})

export const ProviderProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  bio: z.string().min(1, 'Bio is required'),
  profile_image_url: z.string().url().optional()
})

export const ProviderMealPlansQuerySchema = z.object({
  status: z.enum(['all', 'published', 'draft', 'inactive']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

// Purchase schemas
export const CreatePaymentIntentSchema = z.object({
  meal_plan_id: UUIDSchema
})

export const ConfirmPurchaseSchema = z.object({
  payment_intent_id: z.string().min(1, 'Payment intent ID is required'),
  meal_plan_id: UUIDSchema
})

export const PurchaseHistoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0)
})

// Shopping list schemas
export const GenerateShoppingListSchema = z.object({
  meal_plan_id: UUIDSchema,
  selected_days: z.array(z.number().int().min(1)).optional()
})

// Admin schemas
export const AdminUsersQuerySchema = z.object({
  user_type: z.enum(['user', 'provider']).optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

export const AdminMealPlansQuerySchema = z.object({
  status: z.enum(['all', 'published', 'draft', 'inactive', 'deleted']).default('all'),
  provider_id: UUIDSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

export const CreatePricingRuleSchema = z.object({
  duration_days: z.number().min(1),
  base_price_per_day: z.number().min(0),
  bulk_discount_percentage: z.number().min(0).max(100).default(0),
  provider_share_percentage: z.number().min(0).max(100).default(70)
})

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
  return { success: false, error: errors }
}

// Helper function to validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): { success: true; data: T } | { success: false; error: string } {
  const queryObj = Object.fromEntries(params.entries())
  return validateBody(schema, queryObj)
}
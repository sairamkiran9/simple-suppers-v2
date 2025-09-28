/**
 * Database Setup Validation Tests
 * Tests the Supabase database configuration and basic operations
 */

import { supabase } from '../../lib/supabase'
import { getMealPlans, getUserById, getMealPlanById } from '../../lib/database-utils'

describe('Database Setup Validation', () => {
  beforeAll(async () => {
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  describe('Supabase Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have the correct environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
    })
  })

  describe('Database Tables', () => {
    it('should have all required tables', async () => {
      const tables = [
        'users',
        'meal_plan_providers',
        'meal_plans',
        'meal_plan_days',
        'meals',
        'user_plan_purchases',
        'shopping_lists',
        'meal_plan_reviews',
        'admin_pricing_rules',
        'admin_activity_logs',
        'platform_analytics'
      ]

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        expect(error).toBeNull()
      }
    })
  })

  describe('Sample Data', () => {
    it('should have sample admin user', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@simplesuppers.com')
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.user_type).toBe('admin')
    })

    it('should have sample meal plans', async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('is_published', true)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBeGreaterThan(0)
    })

    it('should have sample providers', async () => {
      const { data, error } = await supabase
        .from('meal_plan_providers')
        .select('*')
        .eq('is_active', true)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBeGreaterThan(0)
    })

    it('should have pricing rules', async () => {
      const { data, error } = await supabase
        .from('admin_pricing_rules')
        .select('*')
        .eq('is_active', true)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBe(4) // 1, 7, 14, 30 day rules
    })
  })

  describe('Database Utilities', () => {
    it('should fetch meal plans successfully', async () => {
      const mealPlans = await getMealPlans()
      expect(mealPlans).toBeDefined()
      expect(Array.isArray(mealPlans)).toBe(true)

      if (mealPlans.length > 0) {
        expect(mealPlans[0]).toHaveProperty('id')
        expect(mealPlans[0]).toHaveProperty('title')
        expect(mealPlans[0]).toHaveProperty('provider')
      }
    })

    it('should fetch meal plan by ID with relations', async () => {
      // First get a meal plan ID
      const mealPlans = await getMealPlans()
      if (mealPlans.length === 0) {
        return // Skip if no meal plans
      }

      const mealPlan = await getMealPlanById(mealPlans[0].id)
      expect(mealPlan).toBeDefined()
      expect(mealPlan).toHaveProperty('id')
      expect(mealPlan).toHaveProperty('provider')
      expect(mealPlan).toHaveProperty('meal_plan_days')
    })
  })

  describe('Row Level Security', () => {
    it('should allow public access to published meal plans', async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('is_published', true)
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow public access to active providers', async () => {
      const { data, error } = await supabase
        .from('meal_plan_providers')
        .select('*')
        .eq('is_active', true)
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow public access to meal plan reviews', async () => {
      const { data, error } = await supabase
        .from('meal_plan_reviews')
        .select('*')
        .eq('is_active', true)
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Database Relationships', () => {
    it('should maintain meal plan to provider relationship', async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          provider:meal_plan_providers(*)
        `)
        .eq('is_published', true)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.provider).toBeDefined()
    })

    it('should maintain meal plan to days relationship', async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_days(*)
        `)
        .eq('is_published', true)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should maintain meal plan days to meals relationship', async () => {
      const { data, error } = await supabase
        .from('meal_plan_days')
        .select(`
          *,
          meals(*)
        `)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})
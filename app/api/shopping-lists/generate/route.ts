import { NextRequest } from 'next/server'
import { GenerateShoppingListSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface MealIngredient {
  name: string
  amount: string
  unit: string
  category?: string
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(GenerateShoppingListSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { meal_plan_id, selected_days } = validation.data

    // Verify user has access to this meal plan
    const { data: purchase } = await supabaseAdmin
      .from('user_plan_purchases')
      .select('id, meal_plan_id, expires_at')
      .eq('user_id', user.id)
      .eq('meal_plan_id', meal_plan_id)
      .eq('status', 'completed')
      .eq('is_active', true)
      .single()

    if (!purchase) {
      // Check if it's a free plan
      const { data: freePlan } = await supabaseAdmin
        .from('meal_plans')
        .select('id')
        .eq('id', meal_plan_id)
        .eq('is_free', true)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .eq('is_published', true)
        .single()

      if (!freePlan) {
        return ErrorResponses.forbidden('You do not have access to this meal plan')
      }
    }

    // Check if purchase has expired (for paid plans)
    if (purchase && purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
      return ErrorResponses.forbidden('Your access to this meal plan has expired')
    }

    // Get meal plan details with meals
    const { data: mealPlan, error: mealPlanError } = await supabaseAdmin
      .from('meal_plans')
      .select(`
        id,
        title,
        meal_plan_days(
          day_number,
          meals(
            meal_type,
            meal_name,
            ingredients,
            servings
          )
        )
      `)
      .eq('id', meal_plan_id)
      .single()

    if (mealPlanError || !mealPlan) {
      throw new Error('Failed to fetch meal plan details')
    }

    // Filter meals based on selected days
    const filteredDays = (mealPlan as any).meal_plan_days.filter((day: any) =>
      selected_days ? selected_days.includes(day.day_number) : true
    )

    // Aggregate ingredients from all selected meals
    const ingredientMap = new Map<string, MealIngredient>()

    filteredDays.forEach((day: any) => {
      day.meals.forEach((meal: any) => {
        try {
          const ingredients: MealIngredient[] = JSON.parse(meal.ingredients)

          ingredients.forEach((ingredient: MealIngredient) => {
            const key = `${ingredient.name.toLowerCase()}-${ingredient.unit || 'piece'}`

            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)!
              // Simple amount aggregation (assumes numeric amounts)
              const existingAmount = parseFloat(existing.amount) || 0
              const newAmount = parseFloat(ingredient.amount) || 0
              existing.amount = (existingAmount + newAmount).toString()
            } else {
              ingredientMap.set(key, { ...ingredient })
            }
          })
        } catch (error) {
          // Skip invalid ingredient JSON
          console.warn(`Invalid ingredients JSON for meal: ${meal.meal_name}`)
        }
      })
    })

    // Convert map to array and group by category
    const allIngredients = Array.from(ingredientMap.values())
    const groupedIngredients = allIngredients.reduce((groups: any, ingredient) => {
      const category = ingredient.category || 'Miscellaneous'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit
      })
      return groups
    }, {})

    // Save shopping list to database
    const { data: shoppingList, error: saveError } = await supabaseAdmin
      .from('shopping_lists')
      .insert({
        meal_plan_id,
        user_id: user.id,
        purchase_id: purchase?.id || null,
        ingredients_json: JSON.stringify(groupedIngredients),
        list_type: 'auto'
      })
      .select()
      .single()

    if (saveError) {
      throw new Error('Failed to save shopping list')
    }

    return SuccessResponses.created({
      shopping_list: {
        id: shoppingList.id,
        meal_plan_id: shoppingList.meal_plan_id,
        ingredients: groupedIngredients,
        generated_at: shoppingList.generated_at,
        download_url: `/api/shopping-lists/${shoppingList.id}/download`
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PATCH() {
  return ErrorResponses.validation('Method not allowed')
}
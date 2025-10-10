import { NextRequest } from 'next/server'
import { handleAPIError, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    const { id } = params

    // First check if shopping list exists
    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .select(`
        id,
        user_id,
        meal_plan_id,
        ingredients_json,
        generated_at,
        meal_plan:meal_plans(title)
      `)
      .eq('id', id)
      .single()

    if (error || !shoppingList) {
      return ErrorResponses.notFound('Shopping list')
    }

    // Then verify ownership
    if (shoppingList.user_id !== user.id) {
      return ErrorResponses.forbidden('You can only download your own shopping lists')
    }

    // Parse ingredients
    let ingredients: any
    try {
      ingredients = JSON.parse(shoppingList.ingredients_json)
    } catch (error) {
      throw new Error('Invalid shopping list data')
    }

    // Get format from query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    if (format === 'pdf') {
      // Generate PDF (mock implementation for now)
      const pdfContent = generatePDFContent(
        (shoppingList as any).meal_plan.title,
        ingredients,
        shoppingList.generated_at
      )

      return new Response(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="shopping-list-${id}.pdf"`
        }
      })
    }

    if (format === 'txt') {
      // Generate plain text format
      const txtContent = generateTextContent(
        (shoppingList as any).meal_plan.title,
        ingredients,
        shoppingList.generated_at
      )

      return new Response(txtContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="shopping-list-${id}.txt"`
        }
      })
    }

    // Default JSON format
    return Response.json({
      shopping_list: {
        id: shoppingList.id,
        meal_plan_id: shoppingList.meal_plan_id,
        meal_plan_title: (shoppingList as any).meal_plan.title,
        ingredients,
        generated_at: shoppingList.generated_at
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Mock PDF generation (would use a real PDF library in production)
function generatePDFContent(mealPlanTitle: string, ingredients: any, generatedAt: string): string {
  // This is a mock PDF response - in production you'd use a library like jsPDF or Puppeteer
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Shopping List for: ${mealPlanTitle}) Tj
0 -20 Td
(Generated: ${new Date(generatedAt).toLocaleDateString()}) Tj
0 -40 Td
${Object.entries(ingredients).map(([category, items]: [string, any]) =>
  `(${category}:) Tj 0 -15 Td ${(items as any[]).map((item: any) =>
    `(- ${item.amount} ${item.unit || ''} ${item.name}) Tj 0 -12 Td`
  ).join(' ')}`
).join(' 0 -20 Td ')}
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000224 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
500
%%EOF`
}

// Generate plain text content
function generateTextContent(mealPlanTitle: string, ingredients: any, generatedAt: string): string {
  let content = `SHOPPING LIST\n`
  content += `Meal Plan: ${mealPlanTitle}\n`
  content += `Generated: ${new Date(generatedAt).toLocaleDateString()}\n\n`
  content += `${'='.repeat(50)}\n\n`

  Object.entries(ingredients).forEach(([category, items]) => {
    content += `${category.toUpperCase()}\n`
    content += `${'-'.repeat(category.length)}\n`

    ;(items as any[]).forEach((item: any) => {
      content += `☐ ${item.amount} ${item.unit || ''} ${item.name}\n`
    })

    content += '\n'
  })

  return content
}

// Handle unsupported methods
export async function POST() {
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
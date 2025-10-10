/**
 * PDF Generator Utility
 *
 * Generates PDF documents for meal plan samples using jsPDF
 */

import jsPDF from 'jspdf'
import { ApiMealPlanDetail } from './api-types'

/**
 * Generates a sample PDF for a meal plan
 * Shows only the first 2 days with a watermark indicating it's a sample
 *
 * @param plan - The meal plan details
 */
export function generateSamplePDF(plan: ApiMealPlanDetail): void {
  const doc = new jsPDF()

  // Add watermark
  doc.setFontSize(50)
  doc.setTextColor(220, 220, 220)
  doc.text('SAMPLE', 105, 150, { align: 'center', angle: 45 })

  // Reset text color for content
  doc.setTextColor(0, 0, 0)

  // Add title
  doc.setFontSize(20)
  doc.text(plan.title, 20, 20)

  // Add subtitle
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('Sample Preview - First 2 Days', 20, 30)

  // Add provider info
  const providerName = plan.provider?.name || plan.provider?.business_name || 'Unknown Provider'
  doc.text(`by ${providerName}`, 20, 38)

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Add meals from first 2 days
  let y = 50

  if (plan.meal_plan_days && plan.meal_plan_days.length > 0) {
    const previewDays = plan.meal_plan_days.slice(0, 2)

    previewDays.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage()
        y = 20

        // Re-add watermark on new page
        doc.setFontSize(50)
        doc.setTextColor(220, 220, 220)
        doc.text('SAMPLE', 105, 150, { align: 'center', angle: 45 })
        doc.setTextColor(0, 0, 0)
      }

      // Day title
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const dayTitle = day.day_title || `Day ${day.day_number}`
      doc.text(dayTitle, 20, y)
      y += 8

      // Meals for this day
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      day.meals.forEach((meal) => {
        // Check if we need a new page
        if (y > 270) {
          doc.addPage()
          y = 20

          // Re-add watermark on new page
          doc.setFontSize(50)
          doc.setTextColor(220, 220, 220)
          doc.text('SAMPLE', 105, 150, { align: 'center', angle: 45 })
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
        }

        // Meal type and name
        doc.setFont('helvetica', 'bold')
        doc.text(`${meal.meal_type}:`, 25, y)

        doc.setFont('helvetica', 'normal')
        const mealNameX = 25 + doc.getTextWidth(`${meal.meal_type}: `)
        doc.text(meal.meal_name, mealNameX, y)

        // Prep time if available
        if (meal.prep_time_minutes) {
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(`(${meal.prep_time_minutes} min prep)`, 150, y)
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
        }

        y += 6
      })

      // Add space between days
      y += 8
    })
  } else {
    doc.setFontSize(11)
    doc.text('No meal details available in preview.', 20, y)
  }

  // Add footer on last page
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const footerY = 280
  doc.text('SAMPLE - Purchase for Full Access', 105, footerY, { align: 'center' })
  doc.text('This is a preview of the first 2 days only.', 105, footerY + 5, { align: 'center' })

  // Generate filename from title (remove special characters, replace spaces with hyphens)
  const filename = `${plan.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-sample.pdf`

  // Download the PDF
  doc.save(filename)
}

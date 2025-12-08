'use client'

/**
 * Dashboard Component
 *
 * User dashboard displaying:
 * - Account overview with stats
 * - Purchased meal plans
 * - Free meal plans
 * - Profile editing
 */

import React, { useState } from 'react'
import { useUserDashboard } from '@/hooks/useUserDashboard'
import { useShoppingListDownload } from '@/hooks/useShoppingListDownload'
import { UserProfileForm } from '@/components/UserProfileForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Download, ShoppingCart, User } from 'lucide-react'

interface DashboardProps {
  onViewMealPlan?: (planId: string, origin?: 'browse' | 'dashboard') => void
}

export default function Dashboard({ onViewMealPlan }: DashboardProps = {}) {
  const { data, isLoading, error, refetch } = useUserDashboard()
  const { generateAndDownload, isGenerating } = useShoppingListDownload()
  const [activeTab, setActiveTab] = useState('overview')

  // Loading state
  if (isLoading) {
    return (
      <div className="container">
        <div className="page-header">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>My Account</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error loading dashboard</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button onClick={refetch} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data
  if (!data) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>My Account</h1>
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Manage your meal plans and account settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/* Stats Overview */}
          {data.overview && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.overview.total_purchases || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Active Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.overview.active_plans || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${data.total_spent.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Purchased Plans */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Purchased Meal Plans</CardTitle>
              <CardDescription>
                Your active and past meal plan purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.purchased_plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t purchased any meal plans yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.purchased_plans.map((plan) => (
                    <div key={plan.id}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {plan.title || plan.meal_plan?.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            by {plan.provider_name}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">
                              ${plan.purchase_price?.toFixed(2) || '0.00'}
                            </Badge>
                            {plan.purchased_at && (
                              <Badge variant="outline">
                                Purchased: {new Date(plan.purchased_at).toLocaleDateString()}
                              </Badge>
                            )}
                            {plan.expires_at && (
                              <Badge variant="outline">
                                Expires: {new Date(plan.expires_at).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Get meal plan ID - purchased plans have nested meal_plan object
                              const mealPlanId = plan.meal_plan?.id || plan.id
                              if (onViewMealPlan) {
                                onViewMealPlan(mealPlanId, 'dashboard')
                              }
                            }}
                          >
                            View Plan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Get meal plan ID from either the plan or the nested meal_plan object
                              const mealPlanId = plan.meal_plan?.id || plan.id
                              const planTitle = plan.title || plan.meal_plan?.title || 'meal-plan'
                              generateAndDownload(mealPlanId, planTitle)
                            }}
                            disabled={isGenerating}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'Download'}
                          </Button>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Free Plans */}
          {data.free_plans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Free Plans</CardTitle>
                <CardDescription>
                  Free meal plans you can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.free_plans.map((plan) => (
                    <div key={plan.id}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{plan.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {plan.provider_name}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            Free
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onViewMealPlan) {
                              onViewMealPlan(plan.id, 'dashboard')
                            }
                          }}
                        >
                          View Plan
                        </Button>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {data.user && (
            <UserProfileForm
              user={{
                id: 'current-user',
                email: data.user.email,
                name: data.user.name,
                user_type: 'user',
                subscription_tier: data.user.subscription_tier,
                dietary_preferences: [],
                is_active: true,
              }}
              onSuccess={refetch}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

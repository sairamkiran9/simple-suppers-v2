# Simple Suppers API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Authentication Endpoints

### Register User
Creates a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "user_type": "user" // "user" or "provider"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "user_type": "user"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  }
}
```

### Login User
Authenticates existing user.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "user_type": "user"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  }
}
```

---

## Meal Plans Endpoints

### Get Meal Plans
Retrieves a paginated list of meal plans with filtering options.

```http
GET /api/meal-plans
```

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "family", "budget-friendly")
- `duration_type` (optional): Filter by duration type ("daily", "weekly", "monthly")
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `dietary_tags` (optional): Comma-separated dietary tags
- `search` (optional): Search in title and description
- `is_free` (optional): Filter free plans (true/false)
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_plans": [
      {
        "id": "uuid",
        "title": "Quick & Cheap Weekly Meals",
        "description": "7 dinners and 7 lunch ideas...",
        "duration_days": 7,
        "duration_type": "weekly",
        "final_price": 35.00,
        "category": "budget-friendly",
        "dietary_tags": ["family", "budget", "quick"],
        "difficulty_level": "beginner",
        "is_free": false,
        "is_featured": true,
        "average_rating": 4.5,
        "rating_count": 10,
        "total_purchases": 50,
        "provider": {
          "id": "uuid",
          "business_name": "Mom of Five Kitchen"
        }
      }
    ],
    "total": 25
  }
}
```

### Get Meal Plan Details
Retrieves detailed information about a specific meal plan including all days and meals.

```http
GET /api/meal-plans/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "id": "uuid",
      "title": "Quick & Cheap Weekly Meals",
      "description": "7 dinners and 7 lunch ideas...",
      "duration_days": 7,
      "duration_type": "weekly",
      "final_price": 35.00,
      "category": "budget-friendly",
      "dietary_tags": ["family", "budget", "quick"],
      "difficulty_level": "beginner",
      "is_free": false,
      "provider": {
        "id": "uuid",
        "business_name": "Mom of Five Kitchen",
        "bio": "Practical meals for busy families..."
      },
      "meal_plan_days": [
        {
          "id": "uuid",
          "day_number": 1,
          "day_title": "Monday",
          "meals": [
            {
              "id": "uuid",
              "meal_type": "dinner",
              "meal_name": "Spaghetti with Meat Sauce",
              "description": "Classic family dinner...",
              "prep_time_minutes": 10,
              "cook_time_minutes": 30,
              "servings": 6,
              "ingredients": ["1 lb spaghetti", "1 lb ground beef", "..."],
              "instructions": "1. Brown ground beef...",
              "image_url": "https://example.com/image.jpg"
            }
          ]
        }
      ]
    }
  }
}
```

---

## User Management Endpoints

### Get User Profile
🔒 **Requires Authentication**

```http
GET /api/user/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "user_type": "user",
      "subscription_tier": "freemium",
      "free_plans_used": 1,
      "dietary_preferences": ["vegetarian", "gluten-free"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Update User Profile
🔒 **Requires Authentication**

```http
PUT /api/user/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "dietary_preferences": ["vegetarian", "low-carb"]
}
```

### Get User Dashboard
🔒 **Requires Authentication**

```http
GET /api/user/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_purchases": 5,
      "active_plans": 2,
      "free_plans_remaining": 2
    },
    "active_purchases": [
      {
        "id": "uuid",
        "meal_plan": {
          "id": "uuid",
          "title": "Quick Family Meals",
          "duration_days": 7
        },
        "purchased_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-04-01T00:00:00Z"
      }
    ],
    "recommended_plans": [
      // Similar format to meal plans list
    ]
  }
}
```

---

## Purchase Endpoints

### Create Payment Intent
🔒 **Requires Authentication**

Creates a payment intent for purchasing a meal plan.

```http
POST /api/purchases/create-intent
```

**Request Body:**
```json
{
  "meal_plan_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_intent": {
      "id": "pi_mock_12345",
      "amount": 3500,
      "currency": "usd",
      "client_secret": "pi_mock_12345_secret_xyz"
    },
    "meal_plan": {
      "id": "uuid",
      "title": "Quick Family Meals",
      "final_price": 35.00
    }
  }
}
```

### Confirm Purchase
🔒 **Requires Authentication**

Confirms a completed payment and creates the purchase record.

```http
POST /api/purchases/confirm
```

**Request Body:**
```json
{
  "payment_intent_id": "pi_mock_12345",
  "meal_plan_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchase": {
      "id": "uuid",
      "user_id": "uuid",
      "meal_plan_id": "uuid",
      "purchase_price": 35.00,
      "status": "completed",
      "purchased_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-04-01T00:00:00Z"
    }
  }
}
```

### Get Purchase History
🔒 **Requires Authentication**

```http
GET /api/purchases/history
```

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "uuid",
        "purchase_price": 35.00,
        "purchased_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-04-01T00:00:00Z",
        "status": "completed",
        "meal_plan": {
          "id": "uuid",
          "title": "Quick Family Meals",
          "duration_days": 7
        },
        "provider": {
          "business_name": "Mom's Kitchen"
        }
      }
    ],
    "total": 5
  }
}
```

---

## Shopping Lists Endpoints

### Generate Shopping List
🔒 **Requires Authentication**

Generates a shopping list for a purchased meal plan.

```http
POST /api/shopping-lists/generate
```

**Request Body:**
```json
{
  "meal_plan_id": "uuid",
  "selected_days": [1, 2, 3] // Optional: specific days
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shopping_list": {
      "id": "uuid",
      "meal_plan_id": "uuid",
      "ingredients": {
        "Produce": [
          { "item": "Onions", "quantity": "2 large", "meals": ["Day 1 - Dinner"] }
        ],
        "Meat & Dairy": [
          { "item": "Ground beef", "quantity": "2 lbs", "meals": ["Day 1 - Dinner", "Day 3 - Lunch"] }
        ]
      },
      "generated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Download Shopping List PDF
🔒 **Requires Authentication**

```http
GET /api/shopping-lists/{id}/download
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="shopping-list.pdf"

[PDF binary data]
```

---

## Provider Endpoints

### Get Provider Profile
🔒 **Requires Provider Authentication**

```http
GET /api/providers/profile
```

### Update Provider Profile
🔒 **Requires Provider Authentication**

```http
PUT /api/providers/profile
```

**Request Body:**
```json
{
  "business_name": "Updated Business Name",
  "bio": "Updated bio...",
  "profile_image_url": "https://example.com/image.jpg"
}
```

### Get Provider Dashboard
🔒 **Requires Provider Authentication**

```http
GET /api/providers/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_plans": 5,
      "total_earnings": 350.00,
      "total_purchases": 25,
      "average_rating": 4.5
    },
    "recent_purchases": [
      // Recent purchase data
    ],
    "performance_metrics": {
      "views_this_month": 150,
      "purchases_this_month": 10
    }
  }
}
```

### Get Provider Meal Plans
🔒 **Requires Provider Authentication**

```http
GET /api/providers/meal-plans
```

**Query Parameters:**
- `status` (optional): Filter by status ("all", "published", "draft", "inactive")
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

---

## Admin Endpoints

### Get Admin Dashboard
🔒 **Requires Admin Authentication**

```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 150,
      "total_providers": 25,
      "total_meal_plans": 100,
      "total_purchases": 500,
      "total_revenue": 15000.00,
      "platform_revenue": 4500.00
    },
    "recent_activity": {
      "users": [/* Recent user registrations */],
      "meal_plans": [/* Recent meal plan submissions */],
      "purchases": [/* Recent purchases */]
    },
    "monthly_revenue": [
      {
        "month": "2024-01",
        "total_revenue": 5000.00,
        "platform_revenue": 1500.00,
        "total_purchases": 150
      }
    ]
  }
}
```

### Get All Users (Admin)
🔒 **Requires Admin Authentication**

```http
GET /api/admin/users
```

**Query Parameters:**
- `user_type` (optional): Filter by user type ("user", "provider")
- `is_active` (optional): Filter by active status (true/false)
- `search` (optional): Search in name and email
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

### Get All Meal Plans (Admin)
🔒 **Requires Admin Authentication**

```http
GET /api/admin/meal-plans
```

**Query Parameters:**
- `status` (optional): Filter by status ("all", "published", "draft", "inactive", "deleted")
- `provider_id` (optional): Filter by provider
- `search` (optional): Search in title, description, and category
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

### Get Pricing Rules
🔒 **Requires Admin Authentication**

```http
GET /api/admin/pricing-rules
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pricing_rules": [
      {
        "id": "uuid",
        "duration_days": 7,
        "base_price_per_day": 6.00,
        "bulk_discount_percentage": 15.00,
        "final_price": 35.00,
        "provider_share_percentage": 70.00,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Create Pricing Rule
🔒 **Requires Admin Authentication**

```http
POST /api/admin/pricing-rules
```

**Request Body:**
```json
{
  "duration_days": 14,
  "base_price_per_day": 6.00,
  "bulk_discount_percentage": 25.00,
  "provider_share_percentage": 70.00
}
```

---

## Error Codes

- `400` - Bad Request (validation errors, invalid parameters)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

All endpoints are rate limited:
- **General users**: 100 requests per minute
- **Providers**: 200 requests per minute
- **Admins**: 500 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```
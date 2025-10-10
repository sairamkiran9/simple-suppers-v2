
# API Integration Guide

This document provides a step-by-step guide for integrating the backend APIs with the frontend components.

## Backend URL

Throughout this document, `{backend_url}` should be replaced with the actual URL of the backend service. For local development, this will likely be `http://localhost:3000`.

---

## Admin APIs

### 1. Admin Dashboard

- **API Endpoint:** `GET /api/admin/dashboard`
- **Description:** Retrieves aggregated data for the admin dashboard.
- **Authentication:** Admin
- **Frontend Integration:**
    - **Component:** `components/Dashboard.tsx`
    - **Page:** `app/admin/dashboard/page.tsx`
    - **Instructions:**
        1. Fetch data from the endpoint on the page.
        2. Pass the data as props to the `Dashboard.tsx` component.
        3. The component should be updated to accept and display the data.

### 2. Admin Meal Plans

- **API Endpoint:** `GET /api/admin/meal-plans`
- **Description:** Retrieves a list of all meal plans with filtering and pagination.
- **Authentication:** Admin
- **Frontend Integration:**
    - **Component:** `AdminMealPlanList` (new component)
    - **Page:** `app/admin/meal-plans/page.tsx`
    - **Instructions:**
        1. Create a component to display a filterable and paginated list of meal plans.
        2. Fetch data from the endpoint based on user-selected filters.

### 3. Admin Pricing Rules

- **API Endpoints:**
    - `GET /api/admin/pricing-rules`
    - `POST /api/admin/pricing-rules`
- **Description:** `GET` retrieves all pricing rules. `POST` creates a new pricing rule.
- **Authentication:** Admin
- **Frontend Integration:**
    - **Component:** `AdminPricingRules` (new component)
    - **Page:** `app/admin/pricing-rules/page.tsx`
    - **Instructions:**
        1. Create a component to display existing rules and a form to create new ones.
        2. Use the `GET` endpoint to display rules.
        3. Use the `POST` endpoint to submit the form for creating a new rule.

### 4. Admin Users

- **API Endpoint:** `GET /api/admin/users`
- **Description:** Retrieves a list of all users with filtering and pagination.
- **Authentication:** Admin
- **Frontend Integration:**
    - **Component:** `AdminUserList` (new component)
    - **Page:** `app/admin/users/page.tsx`
    - **Instructions:**
        1. Create a component to display a filterable and paginated list of users.
        2. Fetch data from the endpoint based on user-selected filters.

---

## Auth APIs

### 1. Login

- **API Endpoint:** `POST /api/auth/login`
- **Description:** Authenticates a user.
- **Authentication:** None
- **Frontend Integration:**
    - **Component:** `LoginForm` (new or existing)
    - **Page:** `app/login/page.tsx`
    - **Instructions:**
        1. Create a login form.
        2. On submission, `POST` credentials to the endpoint.
        3. On success, store the JWT and redirect.

### 2. Register

- **API Endpoint:** `POST /api/auth/register`
- **Description:** Registers a new user.
- **Authentication:** None
- **Frontend Integration:**
    - **Component:** `RegisterForm` (new or existing)
    - **Page:** `app/register/page.tsx`
    - **Instructions:**
        1. Create a registration form.
        2. On submission, `POST` user data to the endpoint.
        3. On success, store the JWT and redirect.

---

## Meal Plan APIs

### 1. Get Meal Plans

- **API Endpoint:** `GET /api/meal-plans`
- **Description:** Retrieves a list of available meal plans.
- **Authentication:** Optional
- **Frontend Integration:**
    - **Component:** `MealPlanList` (new component)
    - **Page:** `app/meal-plans/page.tsx`
    - **Instructions:**
        1. Create a component to display a filterable list of meal plans.
        2. Fetch data from the endpoint.

### 2. Get Meal Plan Details

- **API Endpoint:** `GET /api/meal-plans/:id`
- **Description:** Retrieves details for a specific meal plan.
- **Authentication:** Optional
- **Frontend Integration:**
    - **Component:** `components/MealPlanDetail.tsx`
    - **Page:** `app/meal-plans/[id]/page.tsx`
    - **Instructions:**
        1. Fetch data from the endpoint on the page.
        2. Pass the data to the `MealPlanDetail.tsx` component.
        3. The component should render differently based on the user's access level (`preview` vs. `full`).

---

## Provider APIs

### 1. Provider Dashboard

- **API Endpoint:** `GET /api/providers/dashboard`
- **Description:** Retrieves dashboard data for a provider.
- **Authentication:** Provider
- **Frontend Integration:**
    - **Component:** `components/ProviderDashboard.tsx`
    - **Page:** `app/provider/dashboard/page.tsx`
    - **Instructions:**
        1. Fetch data from the endpoint on the page.
        2. Pass the data to the `ProviderDashboard.tsx` component.

### 2. Provider Meal Plans

- **API Endpoints:**
    - `GET /api/providers/meal-plans`
    - `POST /api/providers/meal-plans`
- **Description:** `GET` retrieves the provider's meal plans. `POST` creates a new meal plan.
- **Authentication:** Provider
- **Frontend Integration:**
    - **Component:** `ProviderMealPlanManager` (new component)
    - **Page:** `app/provider/meal-plans/page.tsx`
    - **Instructions:**
        1. Create a component to list, filter, and create meal plans.
        2. Use the `GET` endpoint to display plans.
        3. Use the `POST` endpoint to create new plans via a form.

### 3. Provider Profile

- **API Endpoints:**
    - `GET /api/providers/profile`
    - `POST /api/providers/profile`
- **Description:** `GET` retrieves the provider's profile. `POST` creates or updates it.
- **Authentication:** Provider
- **Frontend Integration:**
    - **Component:** `ProviderProfileForm` (new component)
    - **Page:** `app/provider/profile/page.tsx`
    - **Instructions:**
        1. Use the `GET` endpoint to fetch and display profile data in a form.
        2. Use the `POST` endpoint to save changes from the form.

---

## Purchase APIs

### 1. Create Payment Intent

- **API Endpoint:** `POST /api/purchases/create-intent`
- **Description:** Initiates the payment process for a meal plan.
- **Authentication:** User
- **Frontend Integration:**
    - **Component:** Part of the purchase flow (e.g., in `MealPlanDetail.tsx`).
    - **Instructions:**
        1. When a user decides to purchase, call this endpoint.
        2. Use the returned `client_secret` with the Stripe.js library to complete the payment on the frontend.

### 2. Purchase History

- **API Endpoint:** `GET /api/purchases/history`
- **Description:** Retrieves the user's purchase history.
- **Authentication:** User
- **Frontend Integration:**
    - **Component:** `PurchaseHistoryList` (new component)
    - **Page:** `app/user/purchases/page.tsx`
    - **Instructions:**
        1. Create a component to display a paginated list of the user's purchases.

---

## Shopping List APIs

### 1. Generate Shopping List

- **API Endpoint:** `POST /api/shopping-lists/generate`
- **Description:** Generates a shopping list for a meal plan.
- **Authentication:** User with access to the meal plan.
- **Frontend Integration:**
    - **Component:** Integrated into `MealPlanDetail.tsx`.
    - **Instructions:**
        1. For users with full access, provide an option to generate a shopping list.
        2. Allow users to select days.
        3. Call the endpoint and display the returned list.

---

## User APIs

### 1. User Dashboard

- **API Endpoint:** `GET /api/user/dashboard`
- **Description:** Retrieves dashboard data for a user.
- **Authentication:** User
- **Frontend Integration:**
    - **Component:** `UserDashboard` (new component)
    - **Page:** `app/dashboard/page.tsx`
    - **Instructions:**
        1. Fetch data from the endpoint on the page.
        2. Pass the data to the `UserDashboard` component to display the user's plans and stats.

### 2. User Profile

- **API Endpoint:** `PATCH /api/user/profile`
- **Description:** Updates the user's profile.
- **Authentication:** User
- **Frontend Integration:**
    - **Component:** `UserProfileForm` (new component)
    - **Page:** `app/user/profile/page.tsx`
    - **Instructions:**
        1. Create a form to edit user profile information (name, dietary preferences).
        2. Pre-fill the form with existing user data.
        3. Use the `PATCH` endpoint to save changes.

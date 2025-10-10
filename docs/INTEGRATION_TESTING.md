
# Integration Testing Guide

This document provides a set of test cases to verify the correct integration of the backend APIs with the frontend. These tests should be performed manually by the developer after implementing each feature.

---

## Admin APIs

### 1. Admin Dashboard (`GET /api/admin/dashboard`)

- **Test Case 1.1: Successful Data Display**
  - **Action:** Log in as an admin user and navigate to the `/admin/dashboard` page.
  - **Expected Result:** The dashboard displays all the overview statistics (total users, providers, etc.), recent activity feeds, and the monthly revenue chart correctly, without any errors.

- **Test Case 1.2: Unauthorized Access**
  - **Action:** Try to access the `/admin/dashboard` page without being logged in, or by logging in as a non-admin user.
  - **Expected Result:** The user should be redirected to a login page or an unauthorized/forbidden error page. The dashboard data should not be visible.

### 2. Admin Meal Plans (`GET /api/admin/meal-plans`)

- **Test Case 2.1: View and Paginate Meal Plans**
  - **Action:** As an admin, go to the `/admin/meal-plans` page. Navigate through the pages of meal plans.
  - **Expected Result:** The list of meal plans is displayed correctly. Pagination controls work as expected, loading the next/previous set of plans.

- **Test Case 2.2: Filter Meal Plans**
  - **Action:** Use the filter controls to filter meal plans by status (e.g., 'published', 'draft').
  - **Expected Result:** The list updates to show only the meal plans that match the selected status.

- **Test Case 2.3: Search Meal Plans**
  - **Action:** Use the search bar to search for a meal plan by its title or description.
  - **Expected Result:** The list updates to show only meal plans that match the search term.

### 3. Admin Pricing Rules (`GET` & `POST`)

- **Test Case 3.1: View Pricing Rules**
  - **Action:** As an admin, navigate to the `/admin/pricing-rules` page.
  - **Expected Result:** All existing pricing rules are displayed in a list or table.

- **Test Case 3.2: Create a New Pricing Rule**
  - **Action:** Fill out and submit the form to create a new pricing rule.
  - **Expected Result:** The new rule appears in the list without needing a page reload. The form should clear or reset.

- **Test Case 3.3: Handle Validation Errors**
  - **Action:** Try to create a pricing rule with invalid data (e.g., non-numeric price) or for a duration that already has a rule.
  - **Expected Result:** A clear validation error message is displayed to the user, and the rule is not created.

### 4. Admin Users (`GET /api/admin/users`)

- **Test Case 4.1: View and Paginate Users**
  - **Action:** As an admin, go to the `/admin/users` page. Navigate through the pages of users.
  - **Expected Result:** The list of users is displayed correctly with working pagination.

- **Test Case 4.2: Filter Users**
  - **Action:** Use the filters to see users by type ('customer', 'provider') or status ('active', 'inactive').
  - **Expected Result:** The user list updates to match the filter criteria.

- **Test Case 4.3: Search Users**
  - **Action:** Search for a user by name or email.
  - **Expected Result:** The list updates to show only users matching the search term.

---

## Auth APIs

### 1. Login (`POST /api/auth/login`)

- **Test Case 1.1: Successful Login**
  - **Action:** Enter valid credentials into the login form and submit.
  - **Expected Result:** The user is redirected to their appropriate dashboard (user or provider). The application should now treat the user as logged in.

- **Test Case 1.2: Invalid Credentials**
  - **Action:** Enter an incorrect email or password and submit.
  - **Expected Result:** An error message like "Invalid email or password" is displayed. The user is not logged in.

### 2. Register (`POST /api/auth/register`)

- **Test Case 2.1: Successful Registration**
  - **Action:** Fill out the registration form with valid data and submit.
  - **Expected Result:** The user is automatically logged in and redirected to their dashboard. A new user account is created.

- **Test Case 2.2: Email Already Exists**
  - **Action:** Try to register with an email address that is already in use.
  - **Expected Result:** An error message like "Email already exists" is displayed.

---

## Meal Plan APIs

### 1. Browse Meal Plans (`GET /api/meal-plans`)

- **Test Case 1.1: View and Filter Plans**
  - **Action:** Go to the `/meal-plans` page. Use the various filters (category, price, etc.).
  - **Expected Result:** The list of meal plans updates correctly based on the selected filters.

### 2. Meal Plan Details (`GET /api/meal-plans/:id`)

- **Test Case 2.1: View Preview Data**
  - **Action:** As a logged-out user, navigate to a non-free meal plan's detail page.
  - **Expected Result:** You see the 'preview' version of the meal plan, with limited information and a call-to-action to purchase.

- **Test Case 2.2: View Full Data (Purchased)**
  - **Action:** Log in as a user who has purchased a specific meal plan and navigate to its detail page.
  - **Expected Result:** You see the 'full' version of the meal plan, with all recipes, ingredients, and instructions visible.

- **Test Case 2.3: View Full Data (Free)**
  - **Action:** As any user (logged in or out), navigate to a free meal plan's detail page.
  - **Expected Result:** You see the 'full' version of the meal plan.

---

## Provider APIs

### 1. Provider Dashboard (`GET /api/providers/dashboard`)

- **Test Case 1.1: Successful Data Display**
  - **Action:** Log in as a provider and go to `/provider/dashboard`.
  - **Expected Result:** The dashboard correctly displays the provider's stats, earnings, top plans, and recent sales.

- **Test Case 1.2: Unauthorized Access**
  - **Action:** Try to access `/provider/dashboard` as a regular customer or a logged-out user.
  - **Expected Result:** Access is denied, and the user is redirected or shown a forbidden error.

### 2. Provider Meal Plans (`GET` & `POST`)

- **Test Case 2.1: View and Create Meal Plans**
  - **Action:** As a provider, go to `/provider/meal-plans`. View your existing plans and then create a new one using the form.
  - **Expected Result:** Your plans are listed correctly. The new plan is created successfully and appears in the list.

### 3. Provider Profile (`GET` & `POST`)

- **Test Case 3.1: View and Update Profile**
  - **Action:** As a provider, go to `/provider/profile`. View your current profile information, make a change, and save it.
  - **Expected Result:** The form is pre-filled with your data. After saving, the changes are persisted and reflected on the page.

---

## Purchase APIs

### 1. Purchase Flow (`POST /api/purchases/create-intent`)

- **Test Case 1.1: Initiate Purchase**
  - **Action:** As a logged-in user, click the 'Purchase' button on a meal plan detail page.
  - **Expected Result:** The Stripe payment form/modal appears, ready to accept payment details.

- **Test Case 1.2: Already Purchased**
  - **Action:** Try to purchase a meal plan you already own.
  - **Expected Result:** The API should return a conflict error, and the UI should inform the user that they already have access.

### 2. Purchase History (`GET /api/purchases/history`)

- **Test Case 2.1: View History**
  - **Action:** As a logged-in user, navigate to the purchase history page.
  - **Expected Result:** A list of all your past purchases is displayed with correct information and working pagination.

---

## Shopping List APIs

### 1. Generate Shopping List (`POST /api/shopping-lists/generate`)

- **Test Case 1.1: Generate a Full List**
  - **Action:** On a meal plan detail page you have access to, generate a shopping list without selecting specific days.
  - **Expected Result:** A complete shopping list for all days is generated and displayed, grouped by ingredient category.

- **Test Case 1.2: Generate a Partial List**
  - **Action:** Select a few specific days and generate the shopping list.
  - **Expected Result:** The list is generated containing ingredients only from the selected days.

- **Test Case 1.3: Unauthorized Generation**
  - **Action:** Attempt to trigger the generate function for a plan you do not have access to (e.g., through developer tools).
  - **Expected Result:** The API call fails with a forbidden error.

---

## User APIs

### 1. User Dashboard (`GET /api/user/dashboard`)

- **Test Case 1.1: View Dashboard**
  - **Action:** Log in as a regular user and navigate to `/dashboard`.
  - **Expected Result:** The dashboard displays your purchased plans, accessible free plans, and total spending.

### 2. User Profile (`PATCH /api/user/profile`)

- **Test Case 2.1: Update Profile**
  - **Action:** Go to your profile page, change your name or dietary preferences, and save.
  - **Expected Result:** A success message is shown, and the changes are saved. If you reload the page, the new information should be there.

Here’s an **end-to-end actionable checklist** covering all changes, features, and design/tech updates for your “Simple Suppers” meal planning app based on our discussion:

***

### 1. **Authentication & User Account**

- [ ] Implement **single login/sign-up** flow for all users
- [ ] User profile includes “Created Plans,” “Subscribed Plans,” and standard info (photo, bio, email)
- [ ] Remove “provider”/“subscriber” roles in database—let any user upload or subscribe

***

### 2. **Database Schema Updates**

- [ ] **User Table**: Unified user type, add profile fields
- [ ] **Meal_Plan Table**: Stores plan info; fields for free/premium and price
- [ ] **Subscriptions Table**: Track who subscribes to which plans; enforce “no self-subscription”
- [ ] **Payment Table** (if premium plans): Records payments, linked to subscriptions
- [ ] Optional: **Likes/Comments Table** for social engagement

***

### 3. **Meal Plan Upload Flow (Creator Experience)**

- [ ] Add “Upload Meal Plan” button to dashboard
- [ ] Form fields: Title, Description, Recipes, Prep Time, Cuisine Tags, Image
- [ ] Selection: Free vs Premium plan; prompt for price if Premium
- [ ] Preview function to show posted plan card
- [ ] Publish action with validation and error handling

***

### 4. **Discover & Browse Plans (Subscriber Experience)**

- [ ] Plan feed with search and filters (cuisine, price, prep time)
- [ ] Visual badges for Free/Premium
- [ ] Click any plan for full details
- [ ] Subscribe/Buy button (disabled on user’s own plans)
- [ ] Payment gateway modal for premium plans

***

### 5. **Plan Details Page**

- [ ] Display plan info, creator name/profile, tags, image, price
- [ ] Show recipes (gated if premium until purchased)
- [ ] Action button: “Subscribe” or “Purchase & Subscribe”
- [ ] “Related Plans by Creator” section

***

### 6. **Provider/Creator Dashboard**

- [ ] List and manage plans user uploaded
- [ ] Show analytics: downloads, subscribers, earnings (optional for phase 2)
- [ ] Edit/Delete options for own plans

***

### 7. **UX Enhancements**

- [ ] Welcome/onboarding flow for first-timers
- [ ] Improved messaging for empty states with CTAs (“Browse Plans,” “Upload Your First Plan”)
- [ ] Quick access to help/FAQ/support
- [ ] Responsive layout for mobile/tablet

***

### 8. **Validation & Enforcement**

- [ ] Backend/API prevents users from subscribing to their own plans
- [ ] All forms and actions show clear feedback (success/error)

***

### 9. **Optional: Social Features**

- [ ] Like, comment system for plans
- [ ] “Follow” creators for updates
- [ ] Notifications for new plans by followed creators

***

### 10. **Next Steps**

- [ ] Wireframe pages in Figma (Upload, Plan Feed, Plan Detail, Dashboard)
- [ ] Update database schema and API logic
- [ ] Implement new UI flows and validate against requirements
- [ ] Set up payment integration for premium plans
- [ ] Test with sample users end-to-end for smooth creator/subscriber experiences

***

**This checklist provides a clear, actionable roadmap for revamping the product from core logic all the way to UI and user journey. Ready to help expand any specific technical or design section!**

# Simple Suppers - Supabase Database Setup

This directory contains the complete database schema and setup for Simple Suppers, following the exact specification from `docs/simple-suppers-database-schema`.

## Database Overview

- **11 Core Tables**: Users, providers, meal plans, purchases, reviews, admin tools, and analytics
- **Row Level Security**: Comprehensive RLS policies for data protection
- **Triggers & Functions**: Automatic statistics updates and timestamp management
- **Sample Data**: Production-ready sample data for development and testing

## Project Structure

```
supabase/
├── config.toml           # Supabase configuration
├── migrations/           # Database migrations
│   ├── 20240101000000_create_core_tables.sql
│   ├── 20240101000001_create_transaction_tables.sql
│   ├── 20240101000002_create_admin_tables.sql
│   ├── 20240101000003_create_functions_triggers.sql
│   └── 20240101000004_create_rls_policies.sql
├── seed/                 # Sample data
│   └── sample_data.sql
└── README.md            # This file
```

## Database Tables

### Core Tables
1. **users** - User management with auth integration
2. **meal_plan_providers** - Provider profiles
3. **meal_plans** - Meal plan catalog
4. **meal_plan_days** - Day structure within plans
5. **meals** - Individual meal entries

### Transaction Tables
6. **user_plan_purchases** - Purchase tracking with expiry
7. **shopping_lists** - Generated shopping lists
8. **meal_plan_reviews** - Reviews and ratings

### Admin Tables
9. **admin_pricing_rules** - Admin-controlled pricing
10. **admin_activity_logs** - Audit logging
11. **platform_analytics** - Event tracking

## Getting Started

### 1. Environment Setup

Ensure your `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Start Local Development

```bash
# Start Supabase local development
npm run supabase:start

# Reset and seed database
npm run db:reset
```

### 3. Run Migrations

Migrations are automatically applied when starting Supabase locally. For production:

```bash
# Apply migrations to remote database
npx supabase db push
```

### 4. Generate TypeScript Types

```bash
# Generate types from local database
npm run supabase:gen-types
```

## Sample Data

The database includes production-ready sample data:

- **Admin User**: admin@simplesuppers.com
- **3 Providers**: Mom of Five Kitchen, Healthy Campus Chef, Busy Mom Solutions
- **4 Meal Plans**: Including featured and free plans
- **Sample Reviews**: Verified and unverified reviews
- **Pricing Rules**: Default pricing for 1, 7, 14, and 30-day plans

## Security Features

### Row Level Security (RLS)

- **Users**: Can only access their own data
- **Providers**: Can manage their own meal plans
- **Public Access**: Published meal plans and active providers
- **Admin Access**: Full access with proper verification

### Authentication Integration

The database is designed to work with Supabase Auth:
- User IDs match auth.uid()
- RLS policies check authentication status
- Admin roles are properly validated

## Database Functions

### Automatic Updates
- `update_updated_at_column()`: Auto-timestamp management
- `update_provider_stats()`: Real-time provider statistics
- `update_meal_plan_rating()`: Auto-calculate average ratings

### Triggers
- Updated timestamps on all relevant tables
- Provider statistics on purchases
- Meal plan ratings on reviews

## Development Utilities

### Database Operations
```bash
# Reset database and apply migrations
npm run supabase:reset

# Create new migration
npm run supabase:migrate

# Seed with sample data
npm run db:seed

# Generate TypeScript types
npm run supabase:gen-types
```

### Testing
```bash
# Run database validation tests
npm test __tests__/database/
```

## API Integration

The database utilities in `lib/database-utils.ts` provide:

- **Meal Plan Operations**: Get, search, track views
- **User Management**: Create, get user data
- **Provider Operations**: Create, manage provider profiles
- **Purchase Tracking**: Create purchases, check access
- **Review System**: Create and fetch reviews
- **Analytics**: Event tracking

## Production Deployment

1. **Environment Variables**: Set production Supabase credentials
2. **Migrations**: Apply all migrations to production database
3. **RLS Policies**: Verify all security policies are active
4. **Sample Data**: Import sample data for initial content

## Maintenance

### Regular Tasks
```sql
-- Cleanup old analytics data (run monthly)
DELETE FROM platform_analytics WHERE created_at < NOW() - INTERVAL '6 months';

-- Cleanup expired purchases
UPDATE user_plan_purchases SET is_active = false WHERE expires_at < NOW() AND is_active = true;
```

### Monitoring
- Track database size and performance
- Monitor RLS policy effectiveness
- Review analytics data for insights

## Support

For issues with the database setup:
1. Check Supabase logs: `npx supabase status`
2. Verify environment variables
3. Run database tests: `npm test __tests__/database/`
4. Check migration status: `npx supabase migration list`
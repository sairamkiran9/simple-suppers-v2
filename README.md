# Simple Suppers v2

A modern meal planning application built with Next.js, TypeScript, and Tailwind CSS. Simple Suppers connects users with meal plan providers, offering a comprehensive platform for browsing, subscribing to, and managing meal plans.

## Features

- **Meal Plan Browsing**: Browse and filter meal plans from various providers
- **Detailed Plan Views**: View comprehensive meal plan details including weekly menus
- **Provider Dashboard**: Interface for meal plan providers to manage their offerings
- **User Dashboard**: Personal dashboard for managing subscriptions and preferences
- **Subscription Management**: Handle meal plan subscriptions with modal workflows
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Theme Support**: Light/dark theme toggle with next-themes
- **Accessibility**: Built with Radix UI components for enhanced accessibility

## Tech Stack

- **Framework**: Next.js 13.5.1 with App Router
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3 with CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Sonner toast notifications
- **Database**: Supabase integration
- **Date Handling**: date-fns
- **Charts**: Recharts for data visualization

## Project Structure

```
├── app/                 # Next.js app router pages
│   ├── layout.tsx      # Root layout with global styles
│   └── page.tsx        # Main application component
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── Dashboard.tsx   # User dashboard
│   ├── Features.tsx    # Landing page features
│   ├── Hero.tsx        # Landing page hero
│   ├── MealPlanCard.tsx
│   ├── Navigation.tsx
│   └── ...
├── lib/               # Utilities and configurations
│   ├── types.ts       # TypeScript type definitions
│   ├── data.ts        # Sample data
│   └── utils.ts       # Utility functions
├── hooks/             # Custom React hooks
└── docs/              # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- Docker Desktop (for containerized development and testing)
- PostgreSQL (or use Docker)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-suppers-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3010](http://localhost:3010) in your browser.

### Docker Development

For a complete development environment with database:

```bash
# Start all services (app + database)
make docker-up
# or
npm run docker:up

# View logs
make docker-logs

# Stop services
make docker-down
```

See [Docker Testing Guide](docs/DOCKER_TESTING.md) for detailed instructions.

## Available Scripts

### Development
- `npm run dev` - Start development server (port 3010)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:docker` - Run tests in Docker environment

### Database
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:reset` - Reset database
- `npm run db:seed` - Seed database with sample data

### Docker
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run docker:test` - Run tests in Docker
- `npm run docker:clean` - Clean Docker volumes
- `npm run ci:test` - Simulate CI environment locally

### Convenience (with Make)
- `make docker-up` - Start development environment
- `make docker-test` - Run tests
- `make docker-logs` - View logs
- `make docker-db-shell` - Access database shell
- `make ci-test` - Run CI tests locally

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configuration with Next.js rules
- Tailwind CSS for styling with CSS variables
- Component-based architecture

### UI Components
- Uses shadcn/ui component library
- Radix UI primitives for accessibility
- Consistent design system with CSS variables
- Responsive design patterns

### Data Flow
- React state management for application state
- Sample data structure defined in `lib/data.ts`
- Type-safe interfaces in `lib/types.ts`

## Key Components

- **Navigation**: App navigation with theme toggle
- **Hero**: Landing page hero section
- **Features**: Feature showcase
- **MealPlanCard**: Individual meal plan display
- **MealPlanDetail**: Detailed meal plan view
- **Dashboard**: User dashboard interface
- **ProviderDashboard**: Provider management interface

## Contributing

1. Follow the established code style and conventions
2. Use TypeScript for all new code
3. Ensure components are accessible and responsive
4. Add appropriate type definitions
5. Test thoroughly before submitting changes

## License

This project is private and proprietary.
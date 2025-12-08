# Claude Code Instructions for Simple Suppers v2

## Project Overview
Simple Suppers v2 is a Next.js meal planning application that connects users with meal plan providers. The app features meal plan browsing, subscription management, provider dashboards, and user dashboards.

## Development Guidelines

### Code Standards
- **TypeScript**: Use strict TypeScript with proper type definitions
- **Components**: Follow React functional component patterns with hooks
- **Styling**: Use Tailwind CSS with the established design system
- **UI Components**: Leverage shadcn/ui and Radix UI components
- **File Organization**: Maintain the established directory structure

### Key Development Rules
1. **Never run `npm run build`** unless explicitly requested by the user
2. **Ask for clarification** if requirements are unclear - do not make assumptions
3. **Discuss approach** before implementing significant changes
4. **Team collaboration** is key - communicate your thought process
5. **Follow existing patterns** for consistency across the codebase
6. **Test thoroughly** before finalizing changes
7. **Never Bypass** an error with temporary fix

### Testing & Quality
- Run `npm run lint` to check code style
- Run `npm run typecheck` to verify TypeScript compliance
- Test components in both light and dark themes
- Ensure responsive design across device sizes

### Component Patterns
- Use functional components with TypeScript interfaces
- Implement proper prop validation with TypeScript
- Follow the established naming conventions
- Maintain component reusability and modularity

### State Management
- Use React hooks for component state
- Implement proper state lifting when needed
- Follow the established patterns for view management
- Use type-safe state interfaces

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow the established design token system
- Implement responsive design patterns
- Maintain consistent spacing and typography

### File Structure Conventions
```
components/
├── ui/              # shadcn/ui components
├── [Feature].tsx    # Feature-specific components
└── ...

lib/
├── types.ts         # TypeScript definitions
├── data.ts          # Sample data and constants
├── utils.ts         # Utility functions
└── ...

app/
├── layout.tsx       # Root layout
├── page.tsx         # Main application
└── globals.css      # Global styles
```

### Dependencies & Libraries
- **UI Framework**: Next.js 13.5.1 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Database**: Supabase (configured but not actively used in current implementation)
- **Theme**: next-themes for light/dark mode

### Common Tasks
- **Adding Components**: Create in appropriate directory with TypeScript interfaces
- **Styling Changes**: Use Tailwind classes and CSS variables
- **New Features**: Follow established patterns for state management and routing
- **Bug Fixes**: Ensure TypeScript compliance and responsive behavior

### Important Notes
- The application uses a single-page architecture with view state management
- Sample data is provided in `lib/data.ts` for development
- The design system uses CSS variables for theme consistency
- All components should be accessible and keyboard navigable

### Testing Approach
- Manual testing across different screen sizes
- Verify theme switching functionality
- Test form validation and submission flows
- Check navigation and state management

### Before Making Changes
1. Understand the current implementation patterns
2. Check existing components for similar functionality
3. Verify TypeScript interfaces and prop types
4. Ensure changes align with the design system
5. Test responsive behavior and accessibility
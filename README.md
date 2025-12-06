# Refinery UI

An AI-augmented component refinement platform built with Next.js 15, Turborepo, and Prisma.

## Project Structure

```
.
├── apps/
│   └── studio/          # Main Next.js application
├── packages/
│   ├── core/            # Shared domain logic & Prisma client
│   ├── ui/              # Internal UI component library
│   └── llm/             # LLM integration (placeholder)
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js v5 (Auth.js)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+
- PostgreSQL database

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
# Copy the example env file
cp apps/studio/.env.example apps/studio/.env.local

# Edit apps/studio/.env.local with your values:
# - DATABASE_URL: Your PostgreSQL connection string
# - AUTH_SECRET: Generate with: openssl rand -base64 32
```

3. Generate Prisma client:

```bash
pnpm db:generate
```

4. Push database schema:

```bash
pnpm db:push
```

### Development

Start the development server:

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (for development)
pnpm db:push

# Create a migration (for production)
cd packages/core && pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Features

### Phase 0 (Complete)

- Turborepo monorepo setup
- Next.js 15 app with Tailwind CSS
- PostgreSQL + Prisma database
- NextAuth.js authentication (email-based)

### Phase 1 (Complete)

- User authentication & session management
- Workspace management (create, list, view)
- Component management (create, list, view)
- Component versioning system
- Basic component editor (textarea placeholder)

### Phase 2 (Coming Soon)

- LLM integration for component refinement
- Advanced code editor (Monaco/CodeMirror)
- Component transformation & documentation generation
- Version comparison & diff view

## Database Schema

### Models

- **User**: User accounts with email authentication
- **Workspace**: Container for organizing components
- **Component**: Individual UI components with versions
- **ComponentVersion**: Versioned snapshots of component code

## Authentication

This project uses NextAuth.js v5 with a simple credential-based authentication:

- No password required (email-only for development)
- Users are auto-created on first sign-in
- Session management with JWT strategy

**Note**: For production, implement proper password authentication or use OAuth providers.

## Project Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all apps

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio

# Utilities
pnpm format           # Format code with Prettier
pnpm clean            # Clean all build artifacts
```

## Contributing

This is a side project for learning and experimentation. Feel free to fork and modify as needed.

## License

MIT

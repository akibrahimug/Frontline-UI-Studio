# Refinery UI

An AI-augmented collaborative component refinement platform built with Next.js 15, enabling teams to build, refine, and share React components with real-time collaboration.

## Features

### Core Functionality
- **AI-Powered Refinement**: Transform components using HuggingFace LLMs with custom prompts
- **Real-time Collaboration**: See who's viewing and editing components live with Pusher integration
- **Workspace Management**: Organize components in workspaces with team collaboration
- **Component Registry**: Browse, search, and filter components by status (draft/canonical/deprecated)
- **Version Control**: Track component versions with canonical version management
- **Analytics Dashboard**: Monitor component usage, views, and refactor activity
- **Monaco Editor**: Advanced code editing with syntax highlighting and IntelliSense

### Collaboration Features
- **Workspace Membership**: Invite team members with role-based access control
- **Email Invitations**: Send shareable invitation links (7-day expiration)
- **Role-Based Permissions**: Owner, Editor, and Viewer roles with granular permissions
- **Activity Logging**: Complete audit trail of all workspace actions
- **Public Sharing**: Make workspaces public with unique shareable URLs
- **Member Management**: Add, remove, and manage team member roles

## Project Structure

```
.
├── apps/
│   └── studio/          # Main Next.js application
├── packages/
│   ├── core/            # Shared domain logic, Prisma client, activity logging
│   ├── ui/              # Internal UI component library
│   └── llm/             # LLM integration with HuggingFace
├── docs/                # Documentation
│   ├── phase-2-implementation.md
│   ├── phase-4-5-collaboration-implementation.md
│   ├── huggingface-setup.md
│   └── execution-plan.md
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Real-time**: Pusher (presence & collaboration)
- **AI/LLM**: HuggingFace Inference API
- **Code Editor**: Monaco Editor (VS Code engine)
- **Testing**: Playwright (E2E tests)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+
- PostgreSQL database
- HuggingFace API token (for AI features)
- Pusher account (for real-time collaboration)

### Installation

1. **Install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

```bash
# Copy the example env file
cp apps/studio/.env.example apps/studio/.env.local

# Edit apps/studio/.env.local with your values
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/refinery"

# Authentication
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# HuggingFace (for AI refinement)
HUGGINGFACE_API_TOKEN="hf_xxxxxxxxxxxxx"

# Pusher (for real-time collaboration)
NEXT_PUBLIC_PUSHER_APP_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
PUSHER_APP_ID="your_app_id"
PUSHER_SECRET="your_secret"

# Sentry (optional, for error tracking)
SENTRY_AUTH_TOKEN="your_sentry_token"
```

3. **Set up database:**

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

4. **Start development server:**

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### First-Time Setup

1. Sign in with any email (no password required in development)
2. Create your first workspace
3. Create a component and start refining
4. Invite team members to collaborate

## Database Schema

### Core Models

- **User**: User accounts with email authentication
- **Workspace**: Container for organizing components with public/private sharing
  - `isPublic`: Boolean flag for public access
  - `publicSlug`: Unique identifier for public URLs
- **Component**: Individual UI components with status tracking
- **ComponentVersion**: Versioned snapshots of component code with canonical flagging

### Collaboration Models

- **WorkspaceMember**: Many-to-many relationship between users and workspaces
  - `role`: "owner" | "editor" | "viewer"
  - Enforces role-based access control
- **WorkspaceInvitation**: Email invitation system with token-based acceptance
  - `status`: "pending" | "accepted" | "declined" | "expired"
  - `expiresAt`: 7-day expiration
  - `token`: Unique invitation link identifier
- **ActivityLog**: Audit trail of all workspace actions
  - Tracks member additions, component changes, invitation activity
  - Non-blocking logging (failures don't break main operations)

### Analytics Models

- **AnalyticsEvent**: Usage tracking for components
  - `action`: "component_viewed" | "docs_viewed" | "refactor_run"
  - `metadata`: Additional context (component name, duration, etc.)

## Development Phases

### ✅ Phase 0: Foundation
- Turborepo monorepo setup
- Next.js 15 app with Tailwind CSS
- PostgreSQL + Prisma database
- NextAuth.js authentication (email-based)

### ✅ Phase 1: Core Features
- User authentication & session management
- Workspace management (create, list, view)
- Component management (create, list, view)
- Component versioning system
- Basic component editor

### ✅ Phase 2: AI Integration
- HuggingFace LLM integration for component refinement
- Monaco code editor with syntax highlighting
- Component transformation & documentation generation
- Version comparison & diff view

### ✅ Phase 4-5: Collaboration & Analytics
- Real-time collaboration with Pusher presence
- Component registry with filtering/search
- Analytics dashboard (views, refactors, cold components)
- Workspace membership model with role-based access
- Email invitation system with shareable links
- Activity logging for audit trails
- Role-based permissions (Owner/Editor/Viewer)
- Public workspace sharing

### 🔄 Phase 3: Advanced Features (Planned)
- Enhanced version diffing
- Component templates
- Advanced search & filtering
- Component dependencies tracking

## Project Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm test             # Run tests
pnpm test:e2e         # Run E2E tests with Playwright

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database (dev)
pnpm db:migrate       # Create migration (production)
pnpm db:studio        # Open Prisma Studio

# Utilities
pnpm format           # Format code with Prettier
pnpm clean            # Clean all build artifacts
```

## Testing

Run end-to-end tests:

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests with UI
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e apps/studio/e2e/workspace.spec.ts
```

See `docs/phase-4-5-collaboration-implementation.md` for comprehensive testing guide.

## Authentication

This project uses NextAuth.js v5 with credential-based authentication:

- **Development**: Email-only (no password required)
- **Production**: Implement proper password authentication or OAuth providers
- Users are auto-created on first sign-in
- Session management with JWT strategy

## Collaboration Workflows

### Inviting Team Members

1. Navigate to workspace members page
2. Enter team member's email address
3. Select role (Editor or Viewer)
4. Send invitation and share the generated link
5. Team member creates account (if needed) and accepts invitation
6. Team member gains access to workspace

### Role-Based Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View components | ✅ | ✅ | ✅ |
| Edit components | ✅ | ✅ | ❌ |
| Create components | ✅ | ✅ | ❌ |
| Delete components | ✅ | ✅ | ❌ |
| Manage members | ✅ | ❌ | ❌ |
| Workspace settings | ✅ | ❌ | ❌ |

### Public Workspace Sharing

1. Owner makes workspace public (generates unique slug)
2. Share public URL: `/public/{workspace-slug}`
3. Anyone can view canonical components (no sign-in required)
4. Owner can revoke public access anytime

## Documentation

- **[Phase 2 Implementation](docs/phase-2-implementation.md)**: LLM integration and Monaco editor
- **[Phase 4-5 Collaboration](docs/phase-4-5-collaboration-implementation.md)**: Complete collaboration features guide with testing instructions
- **[HuggingFace Setup](docs/huggingface-setup.md)**: AI integration configuration
- **[Execution Plan](docs/execution-plan.md)**: Original project roadmap

## Architecture Highlights

### Real-time Collaboration
- Pusher channels for workspace-level presence
- Debounced updates (500ms) to reduce network calls
- Live cursor presence and user indicators

### Activity Logging
- Non-blocking logging system (failures don't break operations)
- Tracks all workspace actions (members, components, invitations)
- Human-readable activity feed with timestamps

### Permission System
- Type-safe permission checking with TypeScript
- Server-side enforcement in all actions
- Extensible permission matrix for future roles

### Invitation System
- Token-based with 7-day expiration
- Email verification on acceptance
- Status tracking (pending/accepted/declined/expired)
- Owner can cancel pending invitations

## Security

- ✅ Server-side authorization on all actions
- ✅ Email validation for invitations
- ✅ Role-based access control enforced
- ✅ Only workspace owners can manage members
- ✅ Public workspaces show canonical versions only
- ✅ Activity logging for audit trails
- ✅ Session-based authentication

## Contributing

This is a side project for learning and experimentation. Feel free to fork and modify as needed.

## License

MIT

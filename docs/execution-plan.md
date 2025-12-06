# Frontline UI Studio — Execution Plan

> Goal: Ship a convincing “senior-level” AI-augmented component platform in small, shippable slices.  
> Style: Work in short bursts — every slice should be demo-able.

---

## Phase 0 — Groundwork & Repo Setup

**Objective:** Have a monorepo + Next app + DB + deployment working. No features, just skeleton.

### Step 0.1 — Create Monorepo

- [ ] Create GitHub repo: `frontline-ui-studio`
- [ ] Initialize monorepo (pick one):
  - Nx: `npx create-nx-workspace@latest`
  - Turborepo: `npx create-turbo@latest`
- [ ] Add structure:

  - `apps/studio` — Next.js 15 app
  - `packages/ui` — internal UI kit
  - `packages/core` — shared domain types/helpers
  - `packages/llm` — LLM prompts, schemas, client

### Step 0.2 — Add Next.js 15 + Tailwind

- [ ] In `apps/studio`:
  - `npx create-next-app@latest` (ensure App Router, TS, Tailwind)
- [ ] Wire Tailwind (if not auto-done)
- [ ] Set up basic layout:
  - sidebar: “Workspaces”, “Components”, “Settings”
  - main area with “Welcome” text

### Step 0.3 — Database & Prisma

- [ ] Create Postgres DB (Supabase/Neon/PlanetScale (MySQL) but stick to Postgres if possible)
- [ ] Add Prisma to repo root:
  - `pnpm add -D prisma`
  - `pnpm add @prisma/client`
- [ ] Create `prisma/schema.prisma` with **just User + Workspace** models to start
- [ ] Run:
  - `npx prisma migrate dev --name init`
- [ ] Create `packages/core/db.ts`:
  - export a singleton Prisma client

### Step 0.4 — Auth

- [ ] Choose one: Clerk / Auth.js / NextAuth
- [ ] Wire basic auth:
  - sign in / sign out
  - protect `(app)` routes
- [ ] Add `User` entry in DB on first login (if needed)

### Step 0.5 — Deployment & CI

- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Configure environment vars:
  - `DATABASE_URL`
  - auth provider keys
- [ ] Add GitHub Actions:
  - `pnpm lint`
  - `pnpm test` (can be a stub for now)
  - `pnpm type-check`

✅ **Definition of Done for Phase 0**

- You can log in.
- You see a basic dashboard layout.
- Deployed to Vercel production + PR previews.

---

## Phase 1 — Core Domain: Workspaces & Components

**Objective:** Basic domain: Workspaces, Components, and navigation.

### Step 1.1 — Workspace CRUD

- [ ] Extend Prisma schema with:

  - `Workspace { id, name, ownerId, createdAt }`

- [ ] Migrate DB.
- [ ] Server Actions:
  - `createWorkspaceAction(name)`
  - `listWorkspacesForUserAction()`
- [ ] UI:
  - Workspace switcher in sidebar (current workspace highlighted)
  - “Create Workspace” modal

### Step 1.2 — Component Model (Minimal)

- [ ] Extend Prisma schema:

  ```prisma
  model Component {
    id          String   @id @default(cuid())
    workspaceId String
    name        String
    slug        String   @unique
    status      String   // "draft" | "canonical" | "deprecated"
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    workspace   Workspace @relation(fields: [workspaceId], references: [id])
  }
  ```

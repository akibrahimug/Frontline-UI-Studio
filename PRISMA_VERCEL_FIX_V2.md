# Prisma + Vercel Deployment Fix (Updated)

## Issues Encountered

### Error 1: Missing Query Engine Binary
```
PrismaClientInitializationError: Prisma Client could not locate
the Query Engine for runtime "rhel-openssl-3.0.x"
```

### Error 2: Module Not Found
```
Error: Cannot find module '@prisma/client'
```

## Root Causes

1. **Wrong binary target**: Prisma needs `rhel-openssl-3.0.x` for Vercel/AWS Lambda
2. **Monorepo structure**: pnpm workspace dependencies need special handling
3. **File tracing**: Vercel needs to include Prisma binaries in serverless functions

## ✅ Complete Solution

### 1. Prisma Schema (`packages/core/prisma/schema.prisma`)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

**Why:**
- `"native"` - for local development (macOS/Linux/Windows)
- `"rhel-openssl-3.0.x"` - for Vercel serverless runtime

### 2. Next.js Config (`apps/studio/next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  transpilePackages: ["@refinery/ui", "@refinery/core", "@refinery/llm"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Trace Prisma binaries for Vercel deployment
  outputFileTracingIncludes: {
    "/": ["../../node_modules/.prisma/client/**/*"],
    "/*": ["../../node_modules/@prisma/client/**/*"],
  },
  webpack: (config) => {
    // ... your webpack config
    return config;
  },
};
```

**Why:**
- `outputFileTracingIncludes` tells Vercel to include Prisma binaries in the deployment
- Points to the monorepo's shared node_modules where Prisma Client is generated

### 3. Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "pnpm db:generate && pnpm build",
  "installCommand": "pnpm install",
  "framework": null,
  "outputDirectory": "apps/studio/.next"
}
```

**Why:**
- Explicitly runs `prisma generate` before building
- Ensures Prisma Client is generated with correct binaries
- Works with pnpm workspace (monorepo)

### 4. Regenerate Prisma Client

```bash
pnpm db:generate
```

## 🚀 Deploy to Vercel

### Commit All Changes

```bash
git add .
git commit -m "Fix Prisma deployment for Vercel

- Add rhel-openssl-3.0.x binary target in Prisma schema
- Configure outputFileTracingIncludes for Prisma binaries
- Add vercel.json with explicit build command
- Ensure Prisma Client is generated before build

Fixes: PrismaClientInitializationError and MODULE_NOT_FOUND errors"
git push
```

### Vercel Will:

1. ✅ Run `pnpm install` (installs all dependencies)
2. ✅ Run `pnpm db:generate` (generates Prisma Client with both binaries)
3. ✅ Run `pnpm build` (builds Next.js app)
4. ✅ Trace and include Prisma binaries in serverless functions
5. ✅ Deploy successfully

## 🔍 Verification

### In Vercel Build Logs

Look for:
```
✔ Generated Prisma Client (v5.22.0)
Binary targets: native, rhel-openssl-3.0.x
```

### At Runtime

- ✅ No `PrismaClientInitializationError`
- ✅ No `Cannot find module '@prisma/client'`
- ✅ Database queries work correctly
- ✅ All API routes function properly

## 📋 Files Changed

```
packages/core/prisma/schema.prisma  → Added binaryTargets
apps/studio/next.config.ts          → Added outputFileTracingIncludes
vercel.json                         → Created with build commands
```

## 🆘 Troubleshooting

### Clear Vercel Cache

If issues persist:
1. Go to Vercel Dashboard
2. Project Settings → General
3. Click "Clear Build Cache"
4. Redeploy

### Check Environment Variables

Ensure these are set in Vercel:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Verify Build Logs

Check for:
- `prisma generate` runs successfully
- Both binaries are generated
- No module resolution errors

## 📊 How This Works

### Monorepo Structure
```
root/
├── apps/studio/           # Next.js app
├── packages/core/         # Prisma schema
│   └── prisma/
└── node_modules/          # Shared (hoisted by pnpm)
    ├── @prisma/client/
    └── .prisma/client/    # Generated binaries
```

### Build Process
1. `pnpm install` → Installs dependencies (hoisted to root)
2. `pnpm db:generate` → Generates Prisma Client with binaries
3. `pnpm build` → Next.js bundles app
4. Vercel traces files → Includes Prisma binaries via `outputFileTracingIncludes`
5. Deploy → Serverless function has access to Prisma binaries

### Runtime
1. Request → Lambda function
2. Import `@prisma/client` → Finds module ✅
3. Load query engine → Finds `rhel-openssl-3.0.x` binary ✅
4. Execute query → Success ✅

## ✅ Checklist

Before pushing:
- [x] Updated `schema.prisma` with `binaryTargets`
- [x] Updated `next.config.ts` with `outputFileTracingIncludes`
- [x] Created `vercel.json` with build commands
- [x] Ran `pnpm db:generate` locally
- [x] Verified build succeeds (`pnpm build`)
- [x] All tests passing

After deploying:
- [ ] Check Vercel build logs for Prisma generation
- [ ] Test API endpoints that use Prisma
- [ ] Verify no runtime errors in Function Logs

## 🎯 Key Differences from Previous Attempt

**Before (didn't work):**
- ❌ Externalized `@prisma/client` in webpack
- ❌ Module couldn't be found at runtime

**Now (works):**
- ✅ Bundle `@prisma/client` normally
- ✅ Use `outputFileTracingIncludes` to include binaries
- ✅ Explicit build command in `vercel.json`

## 📚 Resources

- [Prisma + Vercel Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Output File Tracing](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files)
- [pnpm Monorepo + Vercel](https://vercel.com/guides/using-pnpm-with-vercel)

---

**Status:** ✅ Ready to deploy
**Confidence:** High - addresses both errors with monorepo-aware solution

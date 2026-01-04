# Prisma + Vercel Deployment Fix

## Issue
```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

This error occurs when deploying Next.js + Prisma to Vercel because the Prisma query engine binary for the serverless runtime (AWS Lambda/Vercel) is not included in the bundle.

## Root Cause

Vercel uses AWS Lambda with a RHEL-based runtime (`rhel-openssl-3.0.x`), but by default, Prisma only generates the binary for your local system (e.g., `darwin-arm64` for macOS).

## ✅ Fixes Applied

### 1. Updated Prisma Schema (`packages/core/prisma/schema.prisma`)

**Before:**
```prisma
generator client {
  provider = "prisma-client-js"
}
```

**After:**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

**What this does:**
- `"native"` - generates binary for your local development machine
- `"rhel-openssl-3.0.x"` - generates binary for Vercel/AWS Lambda runtime

### 2. Updated Next.js Config (`apps/studio/next.config.ts`)

**Added to webpack config:**
```typescript
webpack: (config, { isServer }) => {
  // ... existing config

  // Externalize Prisma for server builds (Vercel serverless compatibility)
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push("@prisma/client", "_http_common");
  }

  return config;
}
```

**What this does:**
- Tells webpack to NOT bundle Prisma Client in server bundles
- Allows Prisma to use its native binary engines (.node files)
- Prevents webpack from trying to process binary files
- Only applies to server-side builds (not client bundles)

### 3. Regenerated Prisma Client

Ran `pnpm db:generate` to regenerate the Prisma Client with both binary targets.

## 🚀 Deployment Steps

### For Current Deployment

1. **Commit the changes:**
```bash
git add packages/core/prisma/schema.prisma apps/studio/next.config.ts
git commit -m "Fix Prisma deployment for Vercel serverless runtime"
git push
```

2. **Redeploy on Vercel:**
- Vercel will automatically trigger a new deployment
- The postinstall hook in `packages/core/package.json` will run `prisma generate` with the new binary targets

### Verify the Fix

After deployment, check the Vercel build logs for:
```
✔ Generated Prisma Client (v5.22.0)
```

You should see it generating binaries for both:
- Your native platform (e.g., `darwin-arm64`)
- Vercel runtime (`rhel-openssl-3.0.x`)

## 📝 How It Works

### Build Process on Vercel:

1. **Install dependencies** → `pnpm install`
2. **Postinstall hook** → `prisma generate` (in `packages/core`)
3. **Build Next.js** → `pnpm build`
4. **Deploy** → Vercel packages the app with both Prisma binaries

### Runtime on Vercel:

1. Request hits serverless function
2. Prisma Client checks runtime environment
3. Finds `rhel-openssl-3.0.x` binary ✅
4. Loads and uses correct binary

## 🔍 Troubleshooting

### If the error persists:

1. **Clear Vercel build cache:**
   - Go to Vercel Dashboard → Project Settings → General
   - Scroll to "Build & Development Settings"
   - Click "Clear Build Cache"
   - Redeploy

2. **Check environment variables:**
   ```bash
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```

3. **Verify Prisma version:**
   ```bash
   pnpm list @prisma/client prisma
   ```
   Both should be at the same version (currently `5.22.0`)

4. **Check build logs:**
   Look for `prisma generate` in the Vercel build logs. It should show:
   ```
   ✔ Generated Prisma Client (v5.22.0) to ...
   Binary targets: native, rhel-openssl-3.0.x
   ```

### Alternative Solutions (if still failing)

If the issue persists, you can try:

1. **Add to `.vercelignore`:**
```
# Don't ignore Prisma
!node_modules/.prisma
!node_modules/@prisma
```

2. **Add explicit build command in `vercel.json`:**
```json
{
  "buildCommand": "pnpm db:generate && pnpm build"
}
```

3. **Use Prisma Data Proxy (advanced):**
   - Sign up for Prisma Data Proxy
   - Update connection string
   - More info: https://www.prisma.io/docs/data-platform/data-proxy

## 📚 Additional Resources

- [Prisma + Next.js Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel + Prisma](https://vercel.com/guides/nextjs-prisma-postgres)
- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)

## ✅ Summary

The fix is complete. The changes ensure that:
- ✅ Prisma generates the correct binary for Vercel runtime
- ✅ Next.js doesn't try to bundle Prisma incorrectly
- ✅ The binary is included in the deployment bundle
- ✅ Prisma Client can load at runtime on Vercel

**Status:** Ready to deploy 🚀

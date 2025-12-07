# Phase 2 Implementation: LLM Refactor Flow

## Overview

Phase 2 adds AI-powered component refactoring with version management and documentation generation.

## What's Been Implemented

### 1. LLM Integration (`packages/llm`)

- **Types**: `LLMRefactorResult` with structured output including:
  - `transformedCode`: Refactored component code
  - `commentary`: Explanation of changes
  - `docsMarkdown`: Component documentation
  - `props`: Array of component props with types
  - `breakingChanges`: List of breaking changes
  - `suggestions`: Improvement suggestions
  - `testIdeas`: Test case suggestions

- **Refactor Utility**: `refactorComponent()` function that:
  - Uses Vercel AI SDK with OpenAI GPT-4o
  - Takes source code and API key
  - Returns structured refactor results
  - Includes comprehensive prompts for refactoring and documentation

### 2. Server Actions

**New Actions** (`apps/studio/src/app/actions/llm.ts`):
- `refactorComponentAction()`: Runs AI refactor and creates new version

**Enhanced Actions** (`apps/studio/src/app/actions/components.ts`):
- `getComponentVersionsAction()`: Get all versions for a component
- `getComponentVersionAction()`: Get a specific version by ID

### 3. Enhanced Component Editor

**Features**:
- **Tabbed Interface**: Switch between Code and Documentation tabs
- **Version History**: Sidebar showing all component versions
- **Version Switching**: Click any version to view its code/docs
- **AI Refactor Button**: One-click refactoring with OpenAI
- **Real-time Updates**: Auto-refreshes version list after refactor
- **Error Handling**: Displays errors clearly to the user
- **Markdown Rendering**: Docs tab renders markdown with GitHub Flavored Markdown support

### 4. Auto-versioning

- Automatically increments patch version (e.g., 0.1.0 → 0.1.1)
- First version starts at 0.1.0
- Versions displayed in chronological order (newest first)

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure OpenAI API Key

Add to `apps/studio/.env.local`:

```env
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Start Development Server

```bash
pnpm dev
```

## Usage Flow

### Creating and Refactoring a Component

1. **Create a Component**:
   - Navigate to a workspace
   - Click "New Component"
   - Enter component name

2. **Paste Source Code**:
   - In the component editor, paste your React component code in the "Original Code" textarea

3. **Run AI Refactor**:
   - Click "Run AI Refactor" button
   - Wait for processing (typically 10-30 seconds)
   - New version is automatically created

4. **View Results**:
   - Transformed code appears below the original
   - Switch to "Documentation" tab to see generated docs
   - Version history updates in the sidebar

5. **Switch Between Versions**:
   - Click any version in the sidebar
   - View its original code, transformed code, and documentation
   - Each version is preserved independently

## Technical Details

### LLM Prompt Strategy

The refactor prompt instructs the AI to:
- Use modern React patterns (hooks, functional components)
- Apply TypeScript best practices
- Follow Tailwind CSS conventions
- Improve readability and maintainability
- Ensure accessibility (a11y)
- Generate comprehensive documentation

### Structured Output

Uses Vercel AI SDK's `generateObject()` with Zod schemas to ensure:
- Type-safe results
- Consistent output format
- Validation of AI responses
- Easy integration with Prisma

### Version Management

- Versions are immutable once created
- Each version stores:
  - Original code (as pasted by user)
  - Transformed code (from AI)
  - Documentation (from AI)
  - Metadata (version number, creator, timestamp)

## API Cost Considerations

- Each refactor call uses OpenAI GPT-4o
- Typical cost: $0.005-$0.02 per refactor (depending on code length)
- Structured output mode has slightly higher cost than regular completions
- Consider adding usage limits or quotas for production use

## Future Enhancements

Potential improvements for Phase 3:

1. **Advanced Code Editor**:
   - Syntax highlighting (Monaco or CodeMirror)
   - Code diff view between versions
   - Copy-to-clipboard buttons

2. **Version Comparison**:
   - Side-by-side diff view
   - Highlight breaking changes
   - Show prop changes

3. **Batch Refactoring**:
   - Refactor multiple components at once
   - Apply consistent style across workspace

4. **Custom Prompts**:
   - Allow users to customize refactor instructions
   - Save prompt templates
   - Framework-specific refactors (Next.js, Remix, etc.)

5. **Testing Integration**:
   - Generate test files from `testIdeas`
   - Run tests automatically
   - Show test coverage

6. **Export/Import**:
   - Export component versions as files
   - Import from GitHub/GitLab
   - Generate npm packages

## Troubleshooting

### "OpenAI API key not configured"

**Solution**: Add `OPENAI_API_KEY` to `apps/studio/.env.local`

### "Failed to refactor component"

**Possible causes**:
- Invalid API key
- API rate limit exceeded
- Malformed source code
- Network connectivity issues

**Solution**: Check browser console and server logs for detailed error messages

### "No documentation available"

**Cause**: Refactor hasn't been run yet or failed

**Solution**: Run AI Refactor to generate documentation

### Slow refactoring

**Cause**: GPT-4o processing time varies with code complexity

**Normal**: 10-30 seconds for typical components
**Longer**: 30-60+ seconds for very large components

## Files Changed/Created

### New Files:
- `packages/llm/src/types.ts`
- `packages/llm/src/refactor.ts`
- `apps/studio/src/app/actions/llm.ts`
- `docs/phase-2-implementation.md`

### Modified Files:
- `packages/llm/package.json`
- `packages/llm/src/index.ts`
- `apps/studio/package.json`
- `apps/studio/.env.example`
- `apps/studio/src/app/actions/components.ts`
- `apps/studio/src/app/components/[componentId]/page.tsx`
- `apps/studio/src/app/components/[componentId]/component-editor.tsx`

## Dependencies Added

- `ai@^4.0.38` - Vercel AI SDK
- `openai@^4.77.3` - OpenAI SDK
- `zod@^3.23.8` - Schema validation
- `react-markdown@^9.0.1` - Markdown rendering
- `remark-gfm@^4.0.0` - GitHub Flavored Markdown support

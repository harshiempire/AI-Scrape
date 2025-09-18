# Build Guide

## ES Module Import Issues

This project uses ES modules, and TypeScript doesn't automatically add `.js` extensions to relative imports when compiling. This causes runtime errors like:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/path/to/dist/core/tool'
```

## Solution

We have an automated fix for this issue:

### 1. Use the Build Script
```bash
npm run build
```
This runs TypeScript compilation followed by automatic import fixing.

### 2. Manual Fix (if needed)
```bash
npx tsc
node fix-imports.cjs
```

### 3. Watch Mode (for development)
```bash
npm run build:watch
```

## How It Works

The `fix-imports.cjs` script automatically:
- Scans all `.js` files in the `dist` directory
- Finds relative imports missing `.js` extensions
- Adds `.js` extensions to fix ES module compatibility
- Reports which files were fixed

## Why This Happens

- TypeScript compiles `import { Tool } from './tool'` to `import { Tool } from './tool'`
- Node.js ES modules require `import { Tool } from './tool.js'`
- Our script fixes this automatically after compilation

## Alternative Solutions

1. **Use `.ts` extensions in source** (not recommended for Node.js)
2. **Use CommonJS** (changes module system)
3. **Use bundlers** (adds complexity)
4. **Manual fixing** (error-prone)

Our automated solution is the most reliable approach for this TypeScript + ES modules setup.

---
name: Bug report
about: Something doesn't work the way it should
labels: bug
---

## What happened

<!-- A clear description of what you observed. -->

## What you expected

<!-- What should have happened instead. -->

## Minimal reproduction

<!--
Ideally a CodeSandbox / StackBlitz with a single `<BranchIndicator />`
invocation, or the smallest possible snippet that triggers the bug.
-->

```tsx
<BranchIndicator />
```

## Environment

- branch-beacon version: <!-- e.g. 0.1.2 -->
- React version: <!-- e.g. 19.0.0 -->
- Browser: <!-- e.g. Chrome 130 -->
- Bundler: <!-- e.g. Vite 5, Webpack 5, Next.js 15 -->

## "It doesn't show up" checklist

- [ ] `process.env.NODE_ENV` is `"development"` (not `"production"`)
- [ ] Tried `<BranchIndicator enabled />` to bypass the production gate
- [ ] The `/api/dev/git-branch` endpoint returns `{ "branch": "..." }` (not `null` or 5xx)

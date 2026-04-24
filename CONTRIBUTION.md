# Contribution Guide

## Prerequisites

- Node.js 20+ or 22+
- npm
- Obsidian desktop

## Install Dependencies

```bash
npm install
```

## Start Development Build

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Local Verification

Run the same checks used by CI before opening a pull request:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Repository Structure

- `src/` contains the plugin source code
- `spec/` contains planning and design documents
- `manifest.json` defines the Obsidian plugin metadata
- `.github/workflows/` contains CI and release automation

## Release Notes

The repository includes CI and release workflows.

- CI runs lint, tests, typecheck, and build on pushes and pull requests
- Releases are created from `main` when the version changes

## Pull Requests

- Keep changes focused and minimal
- Run the local verification commands before pushing
- Update user-facing docs when behavior changes

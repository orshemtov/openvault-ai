# TECH_STACK

## Core Stack

### Language

- TypeScript

### Plugin Platform

- Obsidian Plugin API

### Build

- `esbuild`
- TypeScript compiler
- standard Obsidian plugin tooling

### UI

- React
- plain CSS or CSS modules
- minimal local state architecture, likely React state plus a lightweight store such as Zustand if needed

### Validation

- `zod`

### Testing

- Vitest
- integration and smoke-test tooling around provider adapters and orchestration

## Recommended Runtime Architecture

We should keep the codebase split into these internal modules:

- `app`
- `ui`
- `core`
- `agents`
- `providers`
- `retrieval`
- `skills`
- `tools`
- `scheduler`
- `storage`

## Provider Layer

Initial provider adapters:

- `OpenRouterAdapter`
- `OllamaAdapter`
- `OpenAiAdapter`
- `AnthropicAdapter`

Provider interface should support:

- list models
- get capability metadata
- generate text
- stream text where available
- generate embeddings
- normalize errors

Rationale:

- provider/model switching is a core feature
- cloud and local support are both required
- embedding generation is first-class

## Retrieval and Embeddings

We need:

- note chunking
- embedding generation abstraction
- local index storage
- incremental index updates
- full rebuild support
- hybrid retrieval

Potential local search/index libraries:

- `flexsearch` or `minisearch` for lexical indexing
- local vector storage implemented in-plugin if small enough
- lightweight local persistence for embeddings and chunk metadata

We should avoid introducing a heavyweight external vector database unless there is a real need.

## Editing and Diffing

We need:

- text diff generation
- structured patch application where possible

Candidate:

- `diff-match-patch` or similarly lightweight diff library

Rationale:

- edits must be previewable and auditable

## Markdown and Rendering

Use Obsidian rendering where possible for:

- Markdown
- wikilinks
- note references
- Mermaid blocks where supported in chat output

## Agents

Agent file format:

- `Agents/<agent-name>/AGENT.md`

Each file should contain:

- YAML frontmatter for metadata
- Markdown body for prompt and behavioral instructions

Each agent folder may later contain additional files, so folder-based layout is intentional.

Initial built-in agents:

- `ask`
- `edit`

We need:

- agent registry
- agent loader
- agent schema validation
- built-in override resolution
- primitive permission model for tools and skills

## Skills

Skill file format:

- `Skills/<skill-name>/SKILL.md`

Each file should contain:

- YAML frontmatter for metadata
- Markdown body for instructions

Possible frontmatter fields:

- `id`
- `name`
- `description`
- `version`
- `tags`
- `tools`
- `mode`
- `modelHints`

## Tools

We need:

- internal tool schema
- adapter interface
- permission layer
- backend abstraction

Primitive tool families planned:

- active note tools
- selection tools
- note read and search tools
- note create and update tools
- frontmatter tools

Rationale:

- these should look consistent to the orchestrator even if the backend differs

Backend options:

- Obsidian Plugin API
- `obsidian CLI`

`obsidian CLI` is an execution backend and capability reference, not the main user-facing concept.

## Scheduling

Scheduled tasks should be implemented inside the plugin runtime.

Behavior:

- evaluate schedules while Obsidian is open
- record missed runs
- support optional catch-up
- persist execution history locally

## Storage

Use plugin-local storage for:

- settings
- provider configs
- defaults
- tasks
- task history
- conversations
- audit logs
- retrieval metadata

We should keep storage readable and versioned where possible.

## Linting and Formatting

- ESLint
- Prettier

## Why This Stack

This stack is intentionally conservative:

- proven for Obsidian plugins
- easy to understand
- easy to test
- flexible enough for semantic retrieval, provider switching, and tool integration
- avoids infrastructure we do not need yet

## Technologies To Avoid Unless Necessary

- heavy agent frameworks
- mandatory external vector databases
- complex backend services
- overly abstract event systems
- large hidden runtime dependencies

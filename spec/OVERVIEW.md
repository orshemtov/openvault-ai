# OVERVIEW

## What Are We Building?

We are building an AI assistant plugin for Obsidian.

The plugin helps users:

- chat with their notes
- edit notes safely
- analyze vault structure and content
- run scheduled note-maintenance tasks
- use Obsidian-style primitive tools through a tool architecture
- load reusable skills from their vault
- switch between built-in and vault-defined agents
- switch between cloud and local models

The primary UX is a right-sidebar assistant tab, similar in spirit to Copilot in VS Code, but designed for knowledge work inside Obsidian.

## Who Is It For?

This product is for Obsidian users who actively work inside their vault and want AI to help with thinking, editing, organizing, and maintaining their knowledge base.

Typical users:

- researchers
- writers
- founders and operators
- students
- knowledge workers
- personal knowledge management enthusiasts
- privacy-conscious users who prefer local models when possible

These users usually:

- have many notes
- forget where relevant information lives
- spend too much time organizing and cleaning notes
- want AI help, but do not want blind automation
- want control over model/provider choice

## Why Are We Building It?

Obsidian users often face three problems:

### 1. Knowledge is fragmented

Relevant information is spread across many notes, folders, and links. Users know the answer exists somewhere, but assembling the right context is slow.

### 2. Maintenance is repetitive

Tagging, organizing, metadata cleanup, summarization, and link creation are useful but tedious.

### 3. Existing AI integrations are often either too shallow or too risky

Some plugins are just generic chat. Others are powerful but unclear about permissions, context, and safety.

We are building this plugin to solve those problems with a system that is:

- useful
- explicit
- safe
- semantic
- extensible
- model-flexible

## Product Principles

- Obsidian-native first
- Explicit context beats hidden magic
- Semantic understanding is a core feature
- Safety and trust are product features
- Users choose their models and providers
- Local models must be supported
- Agents should live inside the vault
- Skills should live inside the vault
- Tools should be permissioned and auditable

## Core Pillars

### Chat With Notes

The `ask` agent can answer questions using:

- current note
- current selection
- selected notes
- folders
- search results
- the whole vault

### Safe Editing

The `edit` agent can propose note edits, but changes are previewed and approved before apply by default.

### Analytics

Skills can extend the assistant to inspect vault structure and content to surface:

- themes
- duplicates
- stale notes
- weak metadata
- missing links
- organization issues

### Scheduled Tasks

Agents and skills can run recurring note workflows such as:

- tagging
- cleanup
- metadata enrichment
- organization
- summary generation
- orphan note detection

### Agents

Users can work through built-in or vault-defined agents.

Initial built-in primary agents:

- `ask`
- `edit`

Agents live in:

`Agents/<agent-name>/AGENT.md`

Agents define behavior, default models, and permissions for tools and skills.

### Skills

Users can place reusable skills in:

`Skills/<skill-name>/SKILL.md`

Skills are separate from agents.

Skills represent higher-level reusable workflows such as:

- `analyze-notes`
- `tag-notes`
- `summarize-note`
- `link-notes`

Agents may use skills unless restricted by the agent definition.

### Tools

Agents use Obsidian-style primitive tools for immediate actions such as:

- reading the active note
- reading the current selection
- searching notes
- creating notes
- updating notes
- appending to notes
- inspecting frontmatter
- updating frontmatter

These tools are the direct actions agents can take.

External integrations such as Audible and Kindle are better represented as skills or workflows built on top of tools, not as primitive tools themselves.

### Model and Provider Flexibility

Users can:

- choose a provider
- choose a model
- switch between them
- use cloud models through `OpenRouter`
- use local models through `Ollama`

### Obsidian CLI as Backend

The product concept is not centered on the CLI, but `obsidian CLI` can be used by agents and tools as one of the execution backends and as a reference for what Obsidian can do.

This means tools may be implemented through:

- the Obsidian Plugin API
- `obsidian CLI`
- or both, depending on which path is more reliable

## Shipping Philosophy

There is no staged release plan in this product definition.

We are building the complete intended product and will ship after the full planned feature set is implemented and validated.

Implementation phases in `spec/TASKS.md` represent build order and project tracking only.

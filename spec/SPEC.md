# SPEC

## Scope

This specification describes the intended product behavior for the full plugin.

## Functional Requirements

### 1. Agents and Chat With Notes

As a user, I want the plugin to support agents as the main behavior unit.

As a user, I want built-in primary agents:

- `ask`
- `edit`

As a user, I want vault-defined agents to live in:

`Agents/<agent-name>/AGENT.md`

As a user, I want each agent to define:

- description
- mode
- default model
- prompt body
- permissions
- allowed tools
- allowed skills

As a user, I want vault agents to be able to override built-in agents with the same identifier.

As a user, I want to ask questions about:

- the current note
- the current selection
- selected notes
- a folder
- search results
- the entire vault

As a user, I want default context to come from the current note, with explicit
chat mentions such as `@note`, `@folder/`, and `@all` refining context from the
composer instead of a separate visible scope selector.

As a user, I want answers grounded in notes when note context is selected.

As a user, I want answers to cite which notes were used.

### 2. Semantic Retrieval

As a user, I want semantic embeddings to power retrieval so results are meaning-aware, not only keyword-based.

As a user, I want retrieval to respect my chosen scope first.

As a user, I want retrieval behavior to be hybrid within the selected scope:

- semantic search
- lexical boost where useful
- metadata-aware filtering where relevant

As a user, I want the system to support both cloud and local embedding generation.

As a user, I want indexing to support:

- automatic background updates when notes change
- manual rebuild commands

As a user, I want retrieval results to map cleanly back to notes and citations.

### 3. Edit Notes

As a user, I want the assistant to propose edits to:

- the current selection
- the current note
- multiple selected notes

As a user, I want every edit to be previewed before apply by default.

As a user, I want edit approvals similar to coding assistants:

- approve once
- approve next similar action
- approve remaining actions in the current run or conversation where allowed

As a user, I want destructive actions to always require explicit approval.

As a user, I want note edits to stay within the allowed working directory and allowed action set.

### 4. Analytics

As a user, I want analytics behavior to exist as a skill or future specialized agent rather than as a hardcoded top-level mode.

As a user, I want skills such as `analyze-notes` to analyze:

- duplicate or overlapping notes
- stale notes
- missing links
- weak tags or metadata
- organizational patterns
- topic distribution across notes

As a user, I want analytics outputs to be non-destructive by default.

As a user, I want analytics to explain which notes or evidence informed the conclusion.

### 5. Scheduled Tasks

As a user, I want to create scheduled tasks for workflows such as:

- tagging
- organizing notes
- metadata cleanup
- summary generation
- orphan detection
- link suggestions

As a user, I want each task to define:

- name
- schedule
- target scope
- allowed actions
- selected agent
- selected provider and model
- selected embedding strategy if relevant
- selected skill if any
- execution mode
- logging behavior

As a user, I want task execution modes:

- dry run
- approval required
- autonomous apply

As a user, I want scheduled tasks to run only while Obsidian is open.

As a user, I want missed runs to be marked as missed by default, with optional catch-up behavior on next open.

As a user, I want task history and outcomes to be inspectable.

### 6. Security and Permissions

As a user, I want the plugin to operate only inside an allowed working directory, which defaults to the vault.

As a user, I want permissions to be explicit for actions such as:

- read note
- search notes
- create note
- edit note
- move note
- delete note
- call external tool

As a user, I want tool permissions to be granted per tool and per action category where applicable.

As a user, I want all destructive actions to require explicit approval.

As a user, I want the assistant to explain when an action is blocked by policy.

As a user, I want agent permissions to control:

- allowed note operations
- allowed tools
- allowed skills
- scheduled execution behavior where applicable

### 7. Tools

As a user, I want tools to represent immediate Obsidian-style actions agents can take.

As a user, I want primitive tools such as:

- `get-active-note`
- `get-selection`
- `read-note`
- `search-notes`
- `list-notes-in-folder`
- `create-note`
- `append-note`
- `update-note`
- `read-frontmatter`
- `update-frontmatter`

As a user, I want tools to be:

- discoverable
- permissioned
- auditable

As a user, I want tools to be implemented through Obsidian-native backends such as:

- the Obsidian Plugin API
- `obsidian CLI`
- future backend adapters when useful

As a user, I do not want higher-level workflows like Audible sync or Kindle import to be modeled as primitive tools.

### 8. Models and Providers

As a user, I want to choose a model through a coherent combined
`provider/model` selection flow.

As a user, I want to switch providers and models without changing the rest of my workflow.

As a user, I want cloud model access through `OpenRouter`.

As a user, I want local model access through `Ollama`.

As a user, I want direct cloud model access through `OpenAI`.

As a user, I want direct cloud model access through `Anthropic`.

As a user, I want sensible default models for workflows such as:

- chat
- edit
- analytics
- scheduled tasks
- embeddings

As a user, I want to override those defaults globally and per task.

As a user, I want the UI to adapt to provider/model capabilities such as:

- streaming
- tool calling
- structured output
- embedding support
- context size

### 9. Skills

As a user, I want custom skills to live in this structure:

`Skills/<skill-name>/SKILL.md`

As a user, I want each skill file to use:

- Markdown body for instructions
- YAML frontmatter for metadata

As a user, I want each skill to live in its own folder directly inside `Skills/`.

As a user, I do not want nested skills inside other skills.

As a user, I want skills to be separate from agents.

As a user, I want skills to be usable from:

- chat
- edit workflows where relevant
- scheduled tasks

As a user, I want vault skills to override built-in skills with the same identifier.

As a user, I want invalid skills to be rejected with clear validation errors.

### 10. UI/UX

As a user, I want a right-sidebar assistant tab for ongoing conversations.

As a user, I want the primary UI to be dominated by the chat thread and
composer, with session/history controls and advanced configuration secondary.

As a user, I want the sidebar to include:

- conversation thread
- agent selector
- context selector
- provider selector
- model selector
- skill picker
- tool usage visibility
- action approvals
- citations
- task status where relevant

As a user, I want inline entry points from notes such as:

- ask about selection
- edit selection
- summarize note
- run skill on note

As a user, I want the UI to clearly indicate when the assistant is:

- reading context
- retrieving notes
- generating
- proposing changes
- waiting for approval
- applying actions
- blocked by permissions

## Non-Functional Requirements

- Desktop-only
- Local-first where possible
- No hidden destructive behavior
- Good responsiveness for common workflows
- Reasonable scaling to large vaults
- Clear auditability
- Extensible internal architecture
- Minimal irreversible actions

## Exclusions

The product does not aim to provide:

- mobile support
- a hosted backend owned by us
- unrestricted autonomous agents
- hidden long-term memory outside explicit product storage

# TASKS

## Notes

This file is our implementation board.
Phases represent implementation order, not release milestones.

## Phase 0: Final Planning

- [ ] Approve all planning documents
- [ ] Freeze core product assumptions
- [ ] Define acceptance criteria format for future tasks
- [ ] Define sample fixture vaults for testing
- [ ] Define baseline agent frontmatter format
- [ ] Define baseline skill metadata format
- [ ] Define baseline provider capability schema

## Phase 1: Project Setup

- [ ] Initialize Obsidian plugin project
- [ ] Configure TypeScript, build, lint, and test tooling
- [ ] Create plugin manifest and development workflow
- [ ] Create base folder structure
- [ ] Add shared utility and validation foundations

## Phase 2: Plugin Shell and UI Foundation

- [ ] Register plugin lifecycle hooks
- [ ] Create right sidebar assistant view
- [ ] Add command palette entries
- [ ] Add settings tab
- [ ] Add basic local persistence layer
- [ ] Add initial chat thread rendering
- [ ] Add agent selector UI
- [ ] Add context selector UI
- [ ] Add provider/model selector UI
- [ ] Add skill selector UI

## Phase 3: Agent System

- [ ] Define `AGENT.md` frontmatter schema
- [ ] Implement built-in `ask` agent
- [ ] Implement built-in `edit` agent
- [ ] Implement vault agent discovery from `Agents/<agent-name>/AGENT.md`
- [ ] Validate agent structure and metadata
- [ ] Implement vault-agent override precedence
- [ ] Implement primitive agent permission model for tools and skills
- [ ] Replace hardcoded mode selection with agent selection

## Phase 4: Provider Layer

- [ ] Define `ProviderAdapter` interface
- [ ] Define provider capability metadata format
- [ ] Implement `OpenRouterAdapter`
- [ ] Implement `OllamaAdapter`
- [ ] Implement model listing and selection
- [ ] Implement streaming support abstraction
- [ ] Implement embedding request abstraction
- [ ] Normalize provider errors and timeouts
- [ ] Add global default model settings
- [ ] Add workflow-specific default model settings

## Phase 5: Vault Gateway and Policy

- [ ] Define allowed working directory policy
- [ ] Define allowed action set policy
- [ ] Implement read note action
- [ ] Implement search notes action
- [ ] Implement create note action
- [ ] Implement edit note action
- [ ] Implement move note action
- [ ] Implement delete note action
- [ ] Add policy explanations for blocked actions
- [ ] Add destructive action safeguards

## Phase 6: Retrieval and Embedding Pipeline

- [ ] Define chunking strategy
- [ ] Define chunk-to-note citation mapping
- [ ] Implement note chunking
- [ ] Implement lexical indexing
- [ ] Implement embedding indexing
- [ ] Support cloud embeddings
- [ ] Support local embeddings
- [ ] Implement incremental re-index on note changes
- [ ] Implement manual full rebuild command
- [ ] Implement hybrid retrieval within selected scope
- [ ] Add retrieval result inspection for debugging and trust
- [ ] Add excluded paths or files support for indexing

## Phase 7: Chat Workflows

- [ ] Implement `ask` agent orchestration
- [ ] Implement current note context flow
- [ ] Implement selection context flow
- [ ] Implement selected notes context flow
- [ ] Implement folder context flow
- [ ] Implement search-results context flow
- [ ] Implement whole-vault context flow
- [ ] Render citations in answers
- [ ] Show retrieval state in UI
- [ ] Show provider/model capability warnings in UI

## Phase 8: Editing Workflows

- [ ] Implement `edit` agent orchestration
- [ ] Implement edit proposal flow
- [ ] Implement selection edit flow
- [ ] Implement note edit flow
- [ ] Implement multi-note edit flow
- [ ] Implement diff preview UI
- [ ] Implement approve once flow
- [ ] Implement approve next flow
- [ ] Implement approve remaining actions flow
- [ ] Ensure delete and move always require explicit approval
- [ ] Implement reject and cancel flows
- [ ] Add inline editor entry points

## Phase 9: Skills

- [ ] Define skill frontmatter schema
- [ ] Implement built-in skill registry
- [ ] Implement vault skill discovery from `Skills/<skill-name>/SKILL.md`
- [ ] Validate skill structure and metadata
- [ ] Reject invalid skills with clear errors
- [ ] Implement vault-skill override precedence
- [ ] Build skill picker UI
- [ ] Implement agent-level skill restrictions
- [ ] Allow skills in chat workflows
- [ ] Allow skills in scheduled tasks
- [ ] Add skill reload behavior on vault changes

## Phase 10: Tools

- [ ] Define tool adapter schema
- [ ] Define tool permission model
- [ ] Define tool backend abstraction
- [ ] Implement tool logging
- [ ] Implement `get-active-note` tool
- [ ] Implement `get-selection` tool
- [ ] Implement `read-note` tool
- [ ] Implement `search-notes` tool
- [ ] Implement `create-note` tool
- [ ] Implement `append-note` tool
- [ ] Implement `update-note` tool
- [ ] Implement `read-frontmatter` tool
- [ ] Implement `update-frontmatter` tool
- [ ] Add Obsidian Plugin API backend
- [ ] Evaluate and add `obsidian CLI` backend where useful
- [ ] Add tool permission UI
- [ ] Add tool execution visibility in conversations

## Phase 11: Scheduled Tasks

- [ ] Define task definition schema
- [ ] Build task creation UI
- [ ] Build task editing UI
- [ ] Implement dry-run mode
- [ ] Implement approval-required mode
- [ ] Implement autonomous mode
- [ ] Implement scheduler runtime while Obsidian is open
- [ ] Record missed runs by default
- [ ] Implement optional catch-up behavior
- [ ] Implement task history and logs
- [ ] Implement per-task agent selection
- [ ] Implement per-task provider/model overrides
- [ ] Implement per-task skill selection
- [ ] Implement task result previews and approvals

## Phase 12: Analytics and Higher-Level Skills

- [ ] Implement `analyze-notes` skill
- [ ] Implement `tag-notes` skill
- [ ] Implement `summarize-note` skill
- [ ] Implement `link-notes` skill
- [ ] Explore future Audible-related skill design
- [ ] Explore future Kindle-related skill design

## Phase 13: Security, Audit, and Trust

- [ ] Add audit log storage
- [ ] Log model actions and applied edits
- [ ] Log tool calls and outcomes
- [ ] Log scheduled task runs and missed runs
- [ ] Add user-facing trust explanations in UI
- [ ] Ensure secrets are not leaked in logs
- [ ] Add clear visibility for context used in each run

## Phase 14: Testing Infrastructure

- [ ] Create tiny fixture vault
- [ ] Create medium realistic vault
- [ ] Create stress vault
- [ ] Create fault-injection vault
- [ ] Add unit test harness
- [ ] Add integration test harness
- [ ] Add provider smoke-test harness
- [ ] Add retrieval benchmark harness
- [ ] Add performance baseline recording workflow

## Phase 15: Hardening and Validation

- [ ] Run full manual workflow tests
- [ ] Run provider smoke tests with `OpenRouter`
- [ ] Run provider smoke tests with `Ollama`
- [ ] Establish performance baselines
- [ ] Verify large-vault responsiveness
- [ ] Verify re-index reliability
- [ ] Verify security boundaries
- [ ] Add regression tests for discovered bugs
- [ ] Fix failure recovery gaps

## Phase 16: Documentation and Packaging

- [ ] Write README
- [ ] Write setup instructions
- [ ] Write agent authoring docs
- [ ] Write provider configuration docs
- [ ] Write skills authoring docs
- [ ] Write tool permission docs
- [ ] Write troubleshooting docs
- [ ] Prepare release assets
- [ ] Package final build

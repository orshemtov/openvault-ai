# Scheduled Vault Management

## Purpose

This document defines the scheduled vault-management feature for OpenVault AI.

The goal is to let the plugin run useful asynchronous Obsidian-native jobs that help with:

- organizing
- tagging
- aggregating and reporting
- formatting
- summarizing and presenting

This feature is intentionally focused on the Obsidian vault first.

It does not assume web search, finance integrations, or broad autonomous internet workflows in v1.

## Product Goals

We want the plugin to proactively help maintain and improve the vault when the user is not actively chatting.

Examples:

- review yesterday's daily note and carry unfinished work forward
- summarize activity across project notes
- detect untagged or poorly tagged notes and suggest tags
- identify interesting graph/link relationships
- improve note presentation and consistency
- generate recurring review reports

The scheduler should feel like a reliable background analyst and organizer.

## Non-Goals For V1

These are explicitly out of scope for the first version:

- open web/news scheduled jobs
- finance or Riseup scheduled jobs
- broad autonomous note rewrites
- silent large-scale vault mutation
- arbitrary freeform scheduled prompts with no safety boundaries
- user-facing memory management UI

## Design Principles

- Obsidian-first
- Read-heavy by default
- Safe writes only
- Clear output destinations
- Deterministic task types over unrestricted autonomous behavior
- Easy to inspect after execution
- Jobs should be understandable and auditable
- Avoid background behavior that surprises the user

## Scope

V1 supports scheduled jobs for vault management only.

Each scheduled job should have:

- a defined task type
- a schedule
- a scope
- an agent
- a write mode
- an output target
- internal execution state

The scheduler should support recurring jobs that run while Obsidian is open and evaluate catch-up behavior when Obsidian is reopened.

## Core Task Types

### 1. Daily Note Carryover

Purpose:

- review the previous day's daily note
- identify unfinished work, open tasks, unresolved questions, or follow-up items
- create a concise carryover summary

Expected inputs:

- yesterday's daily note
- optionally linked project notes or referenced tasks

Expected outputs:

- append to today's daily note, or
- write to a configured report note

Write mode:

- safe writes allowed
- append-only or section-replace only

### 2. Tag Suggestions

Purpose:

- scan notes missing tags or with weak metadata
- propose relevant tags from note content

Expected inputs:

- selected folder / vault scope
- note content
- existing frontmatter tags

Expected outputs:

- report note listing suggested tags
- optional safe frontmatter updates when enabled

Write mode:

- report-only by default
- safe frontmatter writes optionally allowed

### 3. Graph Insights

Purpose:

- analyze links/backlinks across the vault
- identify interesting note relationships

Expected behaviors:

- detect orphan notes
- detect likely bridge notes
- detect clusters
- detect notes that probably should link to each other
- detect isolated project notes that should connect to existing concepts

Expected outputs:

- report note with findings and suggestions

Write mode:

- read-only

### 4. Project Review Digest

Purpose:

- summarize status, open work, unresolved questions, and notable changes for a project area

Expected inputs:

- folder scope, note set, or tag scope
- linked notes
- recent note activity if available

Expected outputs:

- report note
- optional append to a project dashboard note

Write mode:

- safe writes allowed for append/report sections only

### 5. Formatting Review

Purpose:

- identify notes that are hard to read or inconsistently structured
- suggest or optionally apply formatting improvements

Examples:

- inconsistent headings
- giant walls of text
- missing summary sections
- inconsistent list formatting
- malformed frontmatter presentation

Expected outputs:

- formatting suggestions report
- optional safe note updates if explicitly enabled

Write mode:

- safe writes allowed only for narrow formatting changes

### 6. Vault Hygiene Report

Purpose:

- provide recurring maintenance insight across the vault

Expected checks:

- untagged notes
- notes with broken links
- notes with no backlinks
- duplicate-ish titles
- stale notes in key folders
- notes missing expected structure

Expected outputs:

- recurring hygiene report note

Write mode:

- read-only

## Job Model

Each scheduled job should contain at least:

- `id`
- `name`
- `enabled`
- `taskType`
- `schedule`
- `agentId`
- `scope`
- `writeMode`
- `output`
- `config`
- `lastRunAt`
- `lastSuccessAt`
- `lastFailureAt`
- `lastResultSummary`
- `failureCount`

## Schedule Model

V1 schedule options should stay simple.

Supported forms:

- daily at a local time
- weekly on selected days at a local time
- interval in hours
- manual run now

Avoid cron syntax in v1 unless it becomes necessary.

Recommended shape:

- `kind: "daily" | "weekly" | "interval"`
- `time: "09:00"`
- `daysOfWeek: [...]`
- `everyHours: number`

## Scope Model

A job scope defines what part of the vault the task should inspect.

Supported scope types:

- current daily note family
- folder
- tag
- explicit note list
- whole vault

Examples:

- `daily-notes`
- `folder: Projects`
- `tag: project`
- `folder: Fleeting`
- `whole-vault`

## Write Modes

V1 should support explicit write modes.

### 1. Read Only

Behavior:

- analyze only
- produce report/suggestions
- no note mutation

Use for:

- graph insights
- hygiene reports
- most suggestions

### 2. Safe Write

Behavior:

- only narrow writes allowed
- append to notes
- replace named sections
- update frontmatter tags
- apply small formatting changes

Use for:

- daily note carryover
- optional tag application
- append-only project reports
- narrow formatting fixes

### 3. No Broad Write Mode In V1

Not allowed:

- arbitrary note rewrites
- large-scale autonomous reorganization
- silent mass-editing across the vault

## Output Model

Scheduled jobs should always leave an inspectable artifact.

Supported output modes:

- append to note
- replace named section in note
- create report note
- create dated report note
- save conversation log

Recommended default output root:

- `AI/Reports/`

Examples:

- `AI/Reports/Daily Carryover.md`
- `AI/Reports/Vault Hygiene.md`
- `AI/Reports/Graph Insights/2026-04-24.md`

## Safety Model

### Allowed in V1

- read notes
- search notes
- list notes in folders
- inspect frontmatter
- inspect graph/link metadata
- append report notes
- update frontmatter tags in safe-write jobs
- replace a designated section in a known target note

### Restricted in V1

- broad note rewrites
- autonomous deletions
- autonomous moves/renames
- destructive formatting over many notes
- unrestricted edit loops

### Approval Model

Scheduled jobs should not require interactive approval to run, so approval-gated operations are a poor fit for V1.

Therefore V1 should restrict scheduled jobs to operations that are safe enough to run non-interactively.

## Scheduler Runtime

We already have a placeholder `SchedulerService`.

V1 scheduler runtime should:

- load persisted jobs on startup
- evaluate due jobs on a timer
- run missed jobs once on startup when appropriate
- avoid double-running overlapping jobs
- record run history and failure state
- stop cleanly on plugin unload

Recommended runtime behaviors:

- evaluate every minute
- skip a job if already running
- catch-up only once per missed daily/weekly run
- back off after repeated failures
- surface failures in logs and report notes

## Execution Pipeline

Each scheduled run should do the following:

1. Load job definition
2. Resolve scope into note set/context
3. Build task-specific prompt/context
4. Select agent
5. Run orchestrator with the allowed tool surface
6. Apply output behavior
7. Persist run metadata
8. Record success/failure summary

## Agent Model

V1 should use built-in agents only:

- `ask`
- `edit`

Recommended defaults:

- use `ask` for:
  - graph insights
  - hygiene reports
  - tag suggestions
  - project reviews

- use `edit` only for:
  - safe-write jobs like carryover append
  - tag/frontmatter updates
  - section replacement
  - narrow formatting fixes

## Required Vault Capabilities

To support the task set, the plugin should add or solidify helpers for:

- resolve yesterday's daily note
- resolve today's daily note
- inspect backlinks/outlinks
- inspect tag presence in frontmatter
- gather notes by folder
- gather notes by tag
- collect candidate notes for graph analysis
- write reports to `AI/Reports`
- append to known target notes safely
- replace named sections safely

## Recommended Internal Task Implementations

### Daily Note Carryover

Input:

- yesterday note
- optional today's note
  Output:
- append carryover block to today's note or a report
  Writes:
- append-only

### Tag Suggestions

Input:

- note set
  Output:
- report with note -> suggested tags
  Writes:
- optional frontmatter tag update only

### Graph Insights

Input:

- note graph / link data
  Output:
- report with:
  - orphan notes
  - bridge notes
  - suggested links
    Writes:
- none

### Project Review

Input:

- folder/tag scope
  Output:
- summary report
  Writes:
- append/report only

### Formatting Review

Input:

- note content
  Output:
- report and optional narrow formatting update
  Writes:
- section/format limited only

## Persistence

V1 job definitions can live in plugin storage.

Recommended later upgrade:

- optional vault-backed job definitions under something like:
  - `AI/Tasks/`

But plugin storage is sufficient to start.

Run history can remain internal at first, with optional report-note output.

## Observability

Each job should track:

- last run time
- last success time
- last failure time
- last result summary
- failure count
- last output path

The plugin should make failures visible through:

- debug logging
- notices for repeated failures
- optional failure report notes

## UX Direction

The user should be able to define jobs in terms of outcomes, not low-level tooling.

Examples:

- summarize unfinished work from yesterday every morning
- review untagged notes weekly
- generate graph insights every Sunday
- review project notes every Friday

The internal system can map those into structured scheduled jobs.

## Acceptance Criteria

V1 is complete when:

- jobs can be created, stored, loaded, and evaluated on schedule
- at least these task types work:
  - daily note carryover
  - tag suggestions
  - graph insights
  - project review
- read-only jobs produce stable report notes
- safe-write jobs only perform bounded note/frontmatter updates
- jobs do not silently perform broad vault mutations
- failures are tracked
- jobs do not duplicate runs unnecessarily
- output artifacts are inspectable

## Test Plan

We should add coverage for:

### Scheduler Core

- due-job evaluation
- daily/weekly scheduling
- interval scheduling
- startup catch-up behavior
- no double-run while already active

### Task Resolution

- daily note lookup
- folder scope resolution
- tag scope resolution
- whole-vault scan selection

### Output Behavior

- append to note
- replace section
- create report note
- safe frontmatter tag update

### Safety

- read-only jobs never mutate notes
- safe-write jobs only mutate allowed targets/fields
- no broad rewrite behavior

### Task Quality

- daily carryover identifies open work correctly
- tag suggestion outputs are plausible
- graph insights are useful and grounded
- project reviews summarize the right notes

## Deferred Work

Explicitly defer:

- web/news scheduled jobs
- Riseup scheduled jobs
- broad autonomous editing
- destructive note operations
- unrestricted freeform background prompts
- background internet research agents

# TESTING

## Goal

We need confidence that the plugin:

- works correctly
- stays safe
- stays reasonably fast
- remains stable as features accumulate
- does not regress over time

We will achieve that with both manual and automated testing.

## Testing Principles

- Test real user workflows, not just isolated functions
- Prefer deterministic automated tests for core logic
- Keep provider-specific nondeterminism out of most tests
- Use fixture vaults so failures are reproducible
- Add regression coverage whenever we fix a real bug
- Verify safety and trust behavior, not only happy paths
- Establish performance baselines first, then set thresholds from real measurements

## What We Must Verify

### Functional correctness

We must verify:

- chat with notes uses the right scope
- retrieval finds relevant notes
- citations map back to the correct notes
- edit proposals are correct
- approvals work as designed
- analytics behave as expected
- scheduled tasks run according to configuration
- provider and model switching works
- `Skills/<skill-name>/SKILL.md` files are discovered and used correctly
- tool permissions and tool logging work correctly

### Safety

We must verify:

- no access outside the allowed working directory
- destructive actions always require explicit approval
- blocked actions stay blocked
- secrets are not leaked in logs or UI
- autonomous task behavior stays within policy

### Performance

We must verify:

- the assistant sidebar stays responsive
- retrieval is fast enough on realistic vaults
- indexing and re-indexing are practical on real vaults
- large vaults do not freeze the app
- scheduled tasks do not make normal usage unpleasant

### Reliability

We must verify:

- provider failures are handled gracefully
- tool failures are handled gracefully
- partial failures do not corrupt plugin state
- rebuilds and retries recover cleanly
- missed task runs are recorded correctly

## Test Environments

We should maintain four fixture vaults.

### 1. Tiny fixture vault

Purpose:

- deterministic fast tests
- clear expected retrieval results

Contents:

- 10 to 20 notes
- known links
- known tags
- a few valid skills
- one or two invalid skills

### 2. Medium realistic vault

Purpose:

- integration and workflow testing

Contents:

- hundreds of notes
- mixed note lengths
- realistic frontmatter
- linked and unlinked notes
- multiple folders
- real-looking writing quality variation

### 3. Stress vault

Purpose:

- performance and scaling validation

Contents:

- thousands of notes
- large notes
- many links
- frequent metadata variation
- large retrieval candidate sets

### 4. Fault-injection vault

Purpose:

- robustness testing

Contents:

- malformed frontmatter
- invalid skill structures
- conflicting note names
- weird formatting
- broken references
- unsupported files

## Manual Testing

## Why Manual Testing Matters

Manual testing is how we verify:

- UX quality
- trust
- clarity
- flow coherence
- real user behavior

Automated tests will not fully catch those issues.

## Manual Test Areas

### Chat with notes

Test:

- current note
- selection
- selected notes
- folder
- search results
- whole vault

Verify:

- chosen scope is honored
- retrieval feels relevant
- citations are correct
- context selection is understandable
- answers are not obviously using the wrong notes

### Retrieval quality

Test:

- direct factual note lookup
- concept similarity queries
- ambiguous terminology
- narrow scopes
- broad scopes

Verify:

- relevant notes are retrieved
- irrelevant notes are not dominating
- citations match actual source notes
- retrieval behavior is explainable

### Editing

Test:

- selection rewrites
- note-level edits
- multi-note edits
- approval flows
- approve once
- approve next
- approve remaining actions in allowed cases

Verify:

- preview diff is correct
- rejected edits do nothing
- approved edits match preview
- destructive actions still require explicit confirmation

### Analytics

Test:

- duplicate note analysis
- stale note analysis
- missing link suggestions
- metadata coverage analysis
- organization analysis

Verify:

- outputs are plausible
- evidence can be inspected
- analytics are non-destructive by default

### Scheduled tasks

Test:

- dry-run tasks
- approval-required tasks
- autonomous tasks
- missed runs while Obsidian is closed
- optional catch-up behavior
- task history

Verify:

- tasks run only while Obsidian is open
- logs are correct
- missed runs are recorded
- task scope and permissions are respected

### Providers and models

Test:

- `OpenRouter` setup and use
- `Ollama` setup and use
- switching providers mid-session
- switching models mid-session
- missing credentials
- unreachable provider
- unsupported capability combinations

Verify:

- model choices update correctly
- errors are actionable
- capability warnings are shown
- workflow still behaves correctly after switching

### Skills

Test:

- valid skill discovery
- invalid skill rejection
- vault-skill override behavior
- invoking a skill in chat
- invoking a skill in scheduled tasks

Verify:

- skills load from `Skills/<skill-name>/SKILL.md`
- invalid skills show clear errors
- expected instruction behavior is actually applied

### Tools and MCP

Test:

- allowed tool usage
- denied tool usage
- tool permission prompts
- failing tool adapters
- disconnected tool cases

Verify:

- tool boundaries are respected
- logs are correct
- conversations stay stable when tools fail

### Security

Test:

- read outside vault attempt
- write outside vault attempt
- blocked delete or move cases
- secret handling in settings and logs

Verify:

- boundaries are enforced
- explanations are clear
- secrets stay hidden

## Manual Testing Cadence

We should manually test:

- every major feature before marking it complete
- every change to orchestration, permissions, retrieval, or indexing
- regular end-to-end sanity passes as the system grows

## Automated Testing

## 1. Unit Tests

Purpose:

- fast, deterministic validation of isolated logic

Candidates:

- scope resolution
- chunking
- citation mapping
- skill parsing and validation
- task definition validation
- provider capability mapping
- approval state transitions
- diff generation helpers
- policy decisions
- log redaction helpers

These should be our fastest and most frequent tests.

## 2. Integration Tests

Purpose:

- validate multiple subsystems working together

Candidates:

- orchestrator plus retrieval plus mock provider
- orchestrator plus approval engine plus vault gateway
- scheduler plus task policy plus logging
- skill loader plus invocation pipeline
- tool registry plus permission checks
- indexing plus retrieval plus citation output

These should run regularly in normal development.

## 3. Contract Tests

Purpose:

- ensure adapters conform to shared interfaces

Targets:

- `OpenRouterAdapter`
- `OllamaAdapter`
- tool adapters
- MCP bridge adapters

Each adapter should pass the same expectations:

- capability reporting
- request normalization
- embedding behavior
- timeout behavior
- error normalization

## 4. End-to-End Smoke Tests

Purpose:

- verify critical user flows through the full stack

Critical flows:

- ask question with note citations
- propose edit and approve it
- reject proposed edit
- run scheduled task and inspect result
- load and invoke a vault skill
- switch provider and continue usage

Keep these focused and small.

## 5. Retrieval Quality Tests

Semantic retrieval is core, so it needs dedicated evaluation.

We should maintain a benchmark set of:

- query
- expected relevant notes
- expected non-relevant notes
- expected citation behavior

We should evaluate:

- whether relevant notes are found
- ranking quality
- citation correctness
- behavior across different scopes

This does not need to be a research-grade benchmark, but it must be stable and repeatable.

## 6. Performance Tests

We need repeatable measurements for:

- initial indexing time
- incremental re-index time
- retrieval latency
- request preparation time
- sidebar responsiveness during indexing
- task execution time on realistic scopes

Policy:

- establish baselines first
- record them
- define thresholds only after real measurements exist

## Live Provider Smoke Tests

We agreed these should be part of normal development.

They should remain small and purposeful.

For `OpenRouter`, test:

- list models
- minimal text generation request
- minimal embedding request
- error normalization

For `Ollama`, test:

- list models
- minimal text generation request
- minimal embedding request if supported by selected local stack
- offline or unavailable-model behavior

Important:

- these tests should exist in normal development
- they should not replace mocked tests
- they should stay small enough to avoid unnecessary cost and friction

## Verification Strategy

### Functional verification

Use:

- unit tests
- integration tests
- end-to-end smoke tests
- manual acceptance flows

### Safety verification

Use:

- policy unit tests
- integration tests around blocked actions
- approval flow tests
- path boundary tests
- secret-handling tests

### Performance verification

Use:

- benchmark runs on fixture vaults
- baseline recording
- repeat measurements as features change

### Reliability verification

Use:

- fault-injection fixture vault
- provider failure tests
- tool failure tests
- interrupted index tests
- scheduled task failure tests

## Preventing Regressions

### 1. Add a regression test for every real bug

Every meaningful bug fix should add one of:

- a unit test
- an integration test
- an end-to-end test

### 2. Keep fixture vaults versioned and stable

This makes failures reproducible.

### 3. Mock providers for most tests

Most automated tests should not depend on real APIs.

This keeps tests:

- fast
- deterministic
- cheap
- stable

### 4. Keep live smoke tests small

Real provider tests are useful, but must stay minimal.

### 5. Run core test gates regularly

Regular development should run:

- lint
- typecheck
- unit tests
- integration tests
- live provider smoke tests where appropriate

### 6. Track performance over time

After baselines are established, compare future runs to them and investigate regressions.

### 7. Add acceptance criteria to tasks

Each completed task should eventually record:

- what was implemented
- how it was manually verified
- what automated coverage was added

## Definition of Done

A feature is done only when:

- the intended workflow works manually
- important logic has automated coverage
- failure cases are handled
- permissions and trust behavior are verified
- no obvious regression is introduced
- relevant tasks and verification notes are updated

## Final Rule

We will not accept "it seems to work" as proof.

Every important feature needs:

- a manual verification path
- automated coverage where practical
- a clear regression-prevention mechanism

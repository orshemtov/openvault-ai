# ARCHITECTURE

## High-Level Structure

The plugin is composed of these major systems:

- Plugin Shell
- Assistant UI
- Orchestrator
- Agent Registry
- Policy and Approval Engine
- Vault Gateway
- Retrieval and Embedding Pipeline
- Provider Layer
- Skills Registry
- Tool Registry
- Scheduler
- Local Persistence and Audit

## Core Components

### 1. Plugin Shell

Responsibilities:

- plugin lifecycle
- command registration
- view registration
- settings registration
- scheduler startup
- indexing lifecycle hooks

### 2. Assistant UI

Responsibilities:

- right sidebar assistant
- conversation rendering
- agent switching
- context selection
- provider/model selection
- skill selection
- approval controls
- task creation and inspection
- logs and history views

### 3. Agent Registry

Responsibilities:

- define built-in agents
- load vault agents from `Agents/<agent-name>/AGENT.md`
- parse frontmatter
- validate agent definitions
- resolve built-in and vault override precedence
- expose agent metadata to UI and orchestrator

Initial built-in primary agents:

- `ask`
- `edit`

### 4. Orchestrator

Responsibilities:

- merge selected agent, user intent, context, skill, policy, and tool availability
- route requests to the correct execution path
- coordinate retrieval, provider calls, and tool calls
- turn model responses into user-visible actions
- enforce conversation-level execution behavior

### 5. Policy and Approval Engine

Responsibilities:

- allowed working directory enforcement
- allowed action checks
- tool permission checks
- skill permission checks
- agent permission checks
- approval state tracking
- temporary trust scopes
- destructive action protection

Approval behavior:

- edit and action proposals require approval by default
- temporary approvals may cover the current run or conversation where allowed
- delete and move actions always require explicit approval
- blocked actions return clear explanations

### 6. Vault Gateway

Responsibilities:

- read notes
- search notes
- create notes
- edit notes
- move notes
- delete notes
- inspect metadata and links
- generate and apply diffs
- enforce path boundaries

All vault access goes through this layer.

### 7. Retrieval and Embedding Pipeline

Responsibilities:

- note discovery
- chunking
- embedding generation
- index storage
- incremental re-indexing
- full rebuilds
- hybrid retrieval
- citation mapping

Design choices:

- embeddings are first-class
- retrieval happens inside the selected scope
- retrieval is hybrid within that scope:
  - semantic similarity
  - lexical boost
  - metadata-aware filtering
- both cloud and local embeddings are supported

### 8. Provider Layer

Responsibilities:

- normalize cloud and local providers
- list models
- report capabilities
- execute generation requests
- execute embedding requests
- normalize errors and timeouts

Initial providers:

- `OpenRouter`
- `Ollama`

Provider metadata should expose:

- provider id
- model id
- display name
- local or cloud
- generation support
- embedding support
- streaming support
- tool-calling support
- structured output support
- context size
- recommended uses

### 9. Skills Registry

Responsibilities:

- load built-in skills
- load vault skills from `Skills/<skill-name>/SKILL.md`
- parse frontmatter
- validate metadata
- expose skills to chat and tasks
- resolve override precedence

Rule:

- vault skills override built-in skills with the same identifier

### 10. Tool Registry

Responsibilities:

- register built-in tools
- register tool adapters
- expose tool schemas
- enforce tool permissions
- execute tool calls
- log tool use
- route tools through the chosen backend

Initial primitive tool families:

- active note and selection tools
- note read and search tools
- note create and update tools
- frontmatter tools

Backend options:

- Obsidian Plugin API
- `obsidian CLI`
- future backend adapters where useful

### 11. Scheduler

Responsibilities:

- store scheduled tasks
- evaluate due runs while Obsidian is open
- execute task pipelines
- record task history
- record missed runs
- optionally perform catch-up runs if configured

### 12. Local Persistence and Audit

Responsibilities:

- plugin settings
- provider settings
- model defaults
- task definitions
- task history
- conversation metadata
- approval state where needed
- audit logs
- local retrieval index metadata

## Architecture Diagram

```mermaid
flowchart TD
    A[User in Obsidian] --> B[Assistant UI / Commands]
    B --> C[Orchestrator]

    C --> D[Agent Registry]
    C --> E[Policy and Approval Engine]
    C --> F[Context Resolver]
    C --> G[Retrieval and Embedding Pipeline]
    C --> H[Skills Registry]
    C --> I[Provider Layer]
    C --> J[Tool Registry]
    C --> K[Scheduler]
    C --> L[Local Persistence and Audit]

    D --> M[Built-in Agents]
    D --> N[Vault Agents]
    F --> O[Vault Gateway]
    G --> O
    G --> P[Embedding Index]
    H --> Q[Built-in Skills]
    H --> R[Vault Skills]
    I --> S[OpenRouter]
    I --> T[Ollama]
    J --> U[Obsidian Plugin API]
    J --> V[obsidian CLI]
    O --> W[Obsidian Vault]
```

## Chat Request Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Assistant UI
    participant O as Orchestrator
    participant A as Agent Registry
    participant P as Policy Engine
    participant C as Context Resolver
    participant R as Retrieval Pipeline
    participant S as Skills Registry
    participant M as Provider
    participant V as Vault Gateway

    U->>UI: Submit prompt with agent, scope, provider, model, skill
    UI->>O: Create request
    O->>A: Load selected agent
    A-->>O: Agent definition
    O->>P: Validate intent and permissions
    P-->>O: Allowed policy and approval state
    O->>C: Resolve explicit scope
    C->>V: Read allowed notes
    V-->>C: Candidate notes
    O->>R: Retrieve relevant chunks within scope
    R-->>O: Ranked context and citations
    O->>S: Load selected skill if any
    S-->>O: Skill instructions
    O->>M: Send normalized request
    M-->>O: Response and optional action intents
    O->>P: Validate proposed actions
    P-->>O: Allowed / blocked / needs approval
    O-->>UI: Render answer, citations, and approvals
```

## Scheduled Task Sequence

```mermaid
sequenceDiagram
    participant SCH as Scheduler
    participant O as Orchestrator
    participant P as Policy Engine
    participant R as Retrieval Pipeline
    participant M as Provider
    participant V as Vault Gateway
    participant U as User

    SCH->>O: Execute due task
    O->>P: Load task permissions and mode
    P-->>O: dry-run / approval / autonomous
    O->>R: Build task context
    R-->>O: Relevant context
    O->>M: Execute task request
    M-->>O: Proposed actions
    O->>P: Validate actions

    alt approval required or dry-run
        O-->>U: Show preview and await approval
    else autonomous apply
        O->>V: Apply allowed changes
        V-->>O: Success result
    end

    O-->>SCH: Record history or missed run state
```

## Retrieval Pipeline

### Indexing

- detect note creation, update, rename, and deletion
- chunk notes into retrieval units
- generate embeddings
- store chunk-to-note mapping
- update index incrementally
- support full rebuild command

### Retrieval

- start from explicit user scope
- fetch candidate chunks from that scope
- rank semantically
- apply lexical boost where useful
- apply metadata constraints where relevant
- return citations mapped to notes and source chunks

## Security Model

Boundaries:

- all file operations go through `Vault Gateway`
- all permissions go through `Policy and Approval Engine`
- all model interactions go through `Provider Layer`
- all tool calls go through `Tool Registry`
- tool backends may use the Obsidian Plugin API or `obsidian CLI`

Trust rules:

- no write outside allowed working directory
- delete and move always require explicit approval
- temporary approvals never bypass destructive safeguards

## Storage Model

Persist locally:

- settings
- provider configs
- model defaults
- skills index metadata
- retrieval index metadata
- task definitions
- task history
- conversation metadata
- audit logs

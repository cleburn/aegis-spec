# Aegis

**`.editorconfig` for AI agents — but with the depth of an actual governance framework.**

Run `aegis init`, have a conversation, and give every AI agent that touches your codebase a structured operating contract: what it can touch, what's off-limits, what conventions to follow, how much autonomy it has, and who else is on the team. Schema-validated, machine-parseable, agent-agnostic.

---

## The Problem

AI agents are writing production code. But every time one starts a session, it rebuilds its understanding of your project from scratch. The workarounds — markdown files, scattered configs, rules files — are written for humans, and agents just cope. Nothing is structured for how agents actually consume information. Nothing is queryable. Nothing is enforced.

When multiple agents work the same codebase? No shared state. No role boundaries. No coordination. They duplicate work, re-explore dead ends, and step on each other's changes without knowing anyone else was there.

The tools exist. The governance doesn't.

## The Solution

Aegis produces `.agentpolicy/` — a directory of schema-validated JSON that any agent, tool, or orchestration layer can parse deterministically. Not prose. Not suggestions. A contract.

```
.agentpolicy/
├── constitution.json       # Project identity, tech stack, principles, build commands
├── governance.json         # Autonomy levels, permissions, conventions, quality gates
├── roles/
│   ├── default.json        # Catch-all role for single-agent workflows
│   ├── frontend.json       # Scoped: owns UI, components, client-side state
│   ├── backend.json        # Scoped: owns API, business logic, database
│   └── testing.json        # Scoped: owns test suites, quality validation
└── state/
    └── ledger.json         # Living task state: in progress, done, failed, blocked
```

You don't write these files. You have a conversation with Aegis — it scans your repo, asks the right questions, and compiles your answers into the policy. When something needs to change, you talk to Aegis again. You never hand-edit JSON.

## Quick Start

```bash
# Install
npm install -g aegis-cli

# Start the discovery conversation
aegis init

# Have Aegis explain the current policy in plain language
aegis explain

# Validate policy files against the schema
aegis validate

# See what Aegis remembers about you
aegis memory
```

## How `aegis init` Works

Run it in your project root. Aegis scans your repo — not just the file tree, but the actual contents of your config files, documentation, CI workflows, and project structure. By the time the conversation starts, Aegis already knows your stack, your architecture, your build pipeline, and your patterns.

If Aegis detects files that look sensitive — environment variables, credentials, database files — it skips them and tells you what it chose not to read. You decide whether it needs access. Nothing gets opened without your awareness.

From there, the conversation is focused and specific. Aegis doesn't ask what language you're using — it already knows. Instead, it asks about the things it can't infer from code alone:

- Your guiding principles and what's non-negotiable
- How much autonomy agents should have across different domains
- Which files are sacred and which are fair game
- How you want agents to coordinate when multiple roles are in play
- What should happen when an agent hits ambiguity or a gap in the rules

The conversation moves fast. Aegis confirms what it already knows, fills in what it doesn't, and when it has the full picture, your `.agentpolicy/` directory appears — complete, schema-validated, and ready for every agent that works here next.

## The `.agentpolicy/` Format

### Constitution

The first file any agent reads. What is this project? What's the tech stack? What are the non-negotiable principles? If an agent reads nothing else, this prevents catastrophic mistakes.

### Governance

The employee handbook. Autonomy levels per domain (can the agent add dependencies freely, or must it ask?), file permissions (writable, read-only, forbidden), coding conventions as machine-queryable rules, quality gates that define "done," and escalation protocols for when policy doesn't cover a situation.

### Roles

Individual job descriptions. Each role defines a scope (what paths it owns), autonomy overrides, convention overrides, and collaboration protocols — who it depends on, who depends on it, how it signals completion, and how it coordinates access to shared resources.

### Ledger

The shared whiteboard — and the only file agents write to, not just read. Every task is recorded here with timestamps, change logs, and failure records that prevent the next agent from retrying the same broken approach. A built-in write protocol with sequence checking and lock files ensures agents never corrupt each other's entries, even in parallel.

## The Autonomy Framework

Every operational domain gets an autonomy level:

| Level | Behavior |
|-------|----------|
| **Conservative** | Agent never acts without explicit human approval. |
| **Advisory** | Agent surfaces recommendations and waits for approval. |
| **Delegated** | Agent acts on its own judgment and reports afterward. |

You set this per domain. Code modification might be `delegated` while infrastructure changes are `conservative`. A senior role might get more autonomy than a narrow specialist. You always decide how much rope to give.

## Agent-Agnostic

Aegis doesn't compete with Claude Code, Cursor, Codex, Gemini, or any other agent. It serves all of them. The `.agentpolicy/` format is an open spec — any tool can read it, and every tool benefits from a standardized way to understand its operating rules in a given repo.

## Schema Spec

The `.agentpolicy/` format is defined by four JSON Schemas:

| Schema | Purpose |
|--------|---------|
| [`constitution.schema.json`](schema/constitution.schema.json) | Project identity, stack, principles, build commands |
| [`governance.schema.json`](schema/governance.schema.json) | Autonomy, permissions, conventions, quality gates, escalation |
| [`role.schema.json`](schema/role.schema.json) | Scoped role definitions with collaboration protocols |
| [`ledger.schema.json`](schema/ledger.schema.json) | Shared operational state and task tracking |

See the [`examples/`](examples/) directory for a complete `.agentpolicy/` configuration built around a fictional B2B CRM project.

## What's Next

Today, Aegis writes the operating rules. Your agents read them and operate better immediately — no integration required from any tool vendor.

What's coming: Aegis as a resident process that actively manages the team. Assigning tasks, routing work to the right specialist role, maintaining the ledger in real time, coordinating handoffs between agents, and enforcing policy boundaries as agents work. The COO doesn't just write the handbook — the COO runs the operation.

---

## Philosophy

We're building dev tools for humans who happen to use AI, when we should be building dev tools for AI agents who happen to work with humans.

The role of "software developer" is becoming "systems architect" — someone who designs and orchestrates a collaborative effort between themselves and a team of AI agents. Those agents need structure to operate well. Clear scopes, explicit rules, shared state, coordination protocols. They need governance.

Aegis is the bridge between your vision and the agents who bring it to life.

## Design Principles

Aegis is the operational steward of human-AI collaboration — not a task-doer, but the layer that makes task-doing coherent, scoped, and aligned.

**With the human:** Partner and mentor. Experienced, relaxed confidence — the energy of someone who's done this a thousand times and still loves it. Sharp questions that feel like good conversation, not interrogation. Proactively surfaces things you haven't considered, framed as care not criticism. Makes policy setup feel enjoyable, even exciting — never bureaucratic.

**With agents:** The clearest, most complete, most deterministically parseable context possible. Information structured the way agents actually consume it — no ambiguity, no interpretation required. Scopes and boundaries that let agents operate with confidence rather than caution.

**With the ecosystem:** Tool-agnostic. Format-first — the `.agentpolicy/` schema is the product, the CLI is the interface. The spec should be adoptable even without the CLI.

## Contributing

Aegis is MIT licensed. The `.agentpolicy/` format is an open spec and contributions to the schema, CLI, or documentation are welcome. See the schema files for the full specification.

## License

MIT
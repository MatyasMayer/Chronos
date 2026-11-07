@AGENTS.md

## Delegation (Claude subagents)

- Before designing or naming anything: ask `doc-explorer` what ADRs and glossary terms already cover it.
- Before creating a branch, opening a PR or creating an ADR: ask `branch-scout`, passing the files the work will touch.
- Research issues: hand the issue number to `researcher`.
- Keep in the main thread: design decisions, ADR and glossary edits, reviewing subagent output, anything `branch-scout` flags as needing the owner.
- For a decision that matters (e.g. "does this contradict ADR-0007?"), open the actual file yourself; don't rely only on a subagent's summary.

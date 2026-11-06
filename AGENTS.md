## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on MatyasMayer/Chronos (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Branching

Commit only on a work branch: `main` and `develop` change through PRs alone. Design work lands on `main` until the owner creates `develop`; from then on, everything lands on `develop`. Before creating a branch or opening a PR, read `docs/agents/branching.md`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on MatyasMayer/Chronos (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Branching

`main` is the single source of truth: every decision and all finished code lands there.

- **Implementation:** one issue, one short-lived branch from current `main`, one PR. Delete the branch after merge.
- **Order:** issues touching the same code run in sequence; only disjoint issues run in parallel.
- **Research:** `research/*` branches are an archive that issue comments link to, so they stay unmerged and in place. Carry their conclusions to `main` as ADRs, glossary terms or a spec, and branch implementation from `main`.

# Branching

The project has two phases, and each phase has one base branch that everything lands on:

| Phase          | Base      | Lasts                                                                         | Work branches                                                                   |
| -------------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Design         | `main`    | Until the owner creates `develop` (after the first wayfinder map is complete) | `docs/<slug>`, `prototype/<slug>`, `research/<slug>`                            |
| Implementation | `develop` | From when `develop` is created onward                                         | `feature/<number>-<slug>`, `docs/<slug>`, `prototype/<slug>`, `research/<slug>` |

**Which phase are we in?** Run `git fetch origin`. If `origin/develop` exists, the base is `develop`. Otherwise the base is `main`. This is the only signal: the state of the wayfinder map never changes the base.

The owner creates `develop` from `main`. Agents never create it.

Once `develop` exists, `main` is the frozen design baseline. Nothing lands on it, and agents never branch from it or open PRs against it. The owner may merge `develop` into `main` at milestones; agents do this only when the owner asks for it in the current session.

Every branch is kept with its full history, merged or not. Closing a branch's PR unmerged marks it abandoned.

## Where conclusions go

All of these land on the current base, including when they come up during implementation:

- **Decisions:** `docs/adr/NNNN-<slug>.md`
- **Domain terms:** `GLOSSARY.md`
- **Spec:** `docs/spec/`
- **Prototypes:** `prototypes/<slug>/`

During implementation, a decision or term that belongs to a feature may go in that feature's PR. One that stands on its own gets its own `docs/<slug>` PR.

### ADR numbers

Take the next free number when creating the ADR: the highest `NNNN` in `docs/adr/` on `origin/<base>` and in the files of open PRs (`gh pr list --state open --base <base> --json files`), plus one.

If the base later gains an ADR with the same number, renumber yours to the next free number while keeping the branch current, and update every reference to it (other ADRs, the spec, the PR body).

## Research

Each finding sits on its own `research/<slug>` branch as `research/<slug>.md` and is never merged.

When the finding is done, the research agent pushes the branch and comments on the issue with:

- a link to the finding
- the conclusions it proposes, each labelled as an ADR, glossary term or spec change

Then it stops. The owner decides which conclusions to adopt. Adopted ones reach the base through a `docs/<slug>` PR with `Refs #<n>` to the research issue, opened by the owner or by an agent the owner asks.

## Starting work

1. **Find the base.** Run `git fetch origin` and check for `origin/develop` as above.
2. **`feature/*` only:** if `origin/develop` is missing, implementation hasn't started. Ask the owner.
3. **Check overlap** (every branch except `research/*`). List the files the work will touch. Compare them with in-flight work on the same base:
   - Open PRs: `gh pr list --state open --base <base> --limit 1000 --json number,headRefName,files`
   - Unmerged branches: `git branch -r --no-merged origin/<base> --list 'origin/feature/*' 'origin/docs/*' 'origin/prototype/*'`, minus abandoned ones from `gh pr list --state closed --limit 1000 --json headRefName`, then `git diff --name-only origin/<base>...<branch>` for each

   A shared file means asking the owner whether to wait or proceed, with one exception: `GLOSSARY.md` and `docs/adr/` overlap alone doesn't block. Proceed, and resolve conflicts while keeping the branch current. Ask the owner only if another branch adds or changes the same glossary term.
4. **Branch** from `origin/<base>` with the right prefix.

## Keeping a branch current

Run `git fetch origin`, `git merge origin/<base>`, then a plain `git push`. Branch history stays exactly as it was committed.

If `develop` was created while your branch was based on `main`, ask the owner whether to retarget it before continuing.

On conflicts: resolve them, run the tests, commit the merge, and list the conflicted files in the PR body. If the tests stay red, ask the owner. In `GLOSSARY.md`, keep both sides' terms; if both define the same term differently, ask the owner.

## Finishing

**`research/*`:** see [Research](#research).

**Everything else:** open a PR against the base with `Refs #<n>` in the body, then stop. The owner reviews, merges and closes the issue. An agent merges only when the owner asks for that PR in the current session, and then also closes the issue.

Every merge uses a merge commit (`gh pr merge --merge`), which keeps every commit.

# Where can a student host Chronos for free?

Research for issue [#4](https://github.com/MatyasMayer/Chronos/issues/4). Checked against official pricing, limits, and docs pages on **2026-10-21**. Free tiers change often, so check them again before committing to one.

Chronos's needs: a single user, an iPhone and Windows PWA, a small relational dataset (Subjects, Tasks, Events, Notes), and **a few GB of files** (lecture PDFs, slides, webpage snapshots). Uploads of individual large files (slide decks) are likely.

## TL;DR

| Option | Backend | DB | Files (a few GB) | Sleep / cold start | Lock-in | Verdict |
|---|---|---|---|---|---|---|
| **Oracle Cloud Always Free (Ampere A1 VM)** | 2 OCPU / 12 GB RAM ARM VM | Self-hosted Postgres/SQLite on 200 GB block storage | Same disk, or 20 GB Object Storage | None (always on), **but idle VMs can be reclaimed** | Low (plain Linux VM + Docker) | **Best "real server" for $0** |
| **Cloudflare Workers + D1 + R2** | Workers Free: 100k req/day, 10 ms CPU | D1: 5 GB, 5M reads / 100k writes per day | R2: 10 GB-month free, **free egress** | None (isolates, no cold start to speak of) | **High** (Workers runtime, D1 APIs) | **Best serverless for $0**. $5/mo Paid plan removes the CPU pain |
| **Own Windows PC + Cloudflare Tunnel / Tailscale** | Your PC | Anything | Your disk (unlimited) | **Offline whenever the PC is off/asleep** | None | Fine for dev and as a fallback, poor as the main host for a phone-first app |
| Supabase Free | (Edge Functions) | 500 MB Postgres | **1 GB** storage | **Pauses after 1 week inactive** | Medium | Too small for files. Risky pausing |
| Neon Free | none | 1 GB Postgres per project | none | Compute scales to zero after 5 min (fast resume) | Low (plain Postgres) | Good DB-only pairing |
| Render Free | Web service | Postgres **expires after 30 days** | No persistent disk | Spins down after 15 min, ~1 min cold start | Low | Not viable |
| Fly.io | **No free tier for new orgs** | – | Volumes $0.15/GB-mo | – | Low | Cheap (~$2–5/mo) but not free |
| Google Drive (file store) | – | – | 15 GB shared with Gmail/Photos | – | Medium | Viable with the `drive.file` scope. Has OAuth caveats |
| GitHub Student Pack / Azure for Students | Azure $100/yr credit, Heroku $13/mo × 24 mo | Azure PG 12 mo free, MongoDB $50 credit | – | – | Varies | Time-limited credits, good as a bridge |

**Recommendation:** for a $0, always-on, polished single-user app, two stacks lead:

1. **Oracle Always Free A1 VM** running the whole app in Docker (app + Postgres/SQLite + files on disk), exposed via Caddy or a Cloudflare Tunnel. It has the most headroom and the least lock-in. The risks are reclamation of idle VMs, "out of capacity" errors at signup, and doing your own ops and backups.
2. **Cloudflare Workers + D1 + R2**. It costs nothing to operate and has no sleep, and R2's free egress suits PDFs. The cost is runtime lock-in and the 10 ms CPU cap on the free plan (PDF processing or snapshotting won't fit; $5/mo Workers Paid fixes it).

Keep the storage layer behind an interface (an S3-compatible API is the lingua franca: R2, Oracle Object Storage, B2, and MinIO all speak it). Then Google Drive or local disk can be swapped in later.

---

## 1. Oracle Cloud Infrastructure: Always Free

Source: [OCI Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

- **Ampere A1 (ARM):** 1,500 OCPU-hours and 9,000 GB-hours a month free, which is **2 OCPUs + 12 GB RAM** in total. You can use it as one VM or split it into up to two 1-OCPU VMs. This is less than the 4 OCPU / 24 GB that older blog posts quote, so trust the current docs.
- **AMD micro:** up to 2 VMs at 1/8 OCPU and 1 GB RAM, capped at 50 Mbps to the internet.
- **Block storage:** 200 GB combined boot and block storage, plus 5 backups.
- **Object Storage:** 20 GB (Always Free-only accounts), 50k API requests a month.
- **Egress:** 10 TB a month.
- **Autonomous Database:** 2 instances, 20 GB each, 20 concurrent sessions. It's Oracle-flavoured, so lock-in is high. Self-hosted Postgres on the VM is the better choice.
- **Caveats:**
  - **Idle reclamation:** Oracle may reclaim Always Free compute that sits idle for 7 days (95th-percentile CPU < 20%, network < 20%, and memory < 20% for A1). A single-user app is exactly the idle profile that gets reclaimed. People commonly mitigate this by upgrading to Pay-As-You-Go: per the docs, Always Free resources stay free after the upgrade and you pay only above the limits. Set a budget alert.
  - Always Free compute must be created in the **home region** (pick it carefully at signup, e.g. Frankfurt for CZ). "Out of host capacity" errors for A1 are common, and the fix is to retry or try another availability domain.
  - If an account still on a trial goes over 20 GB of object storage when the trial ends, **all objects are deleted**.
- **Sleep/cold start:** none.
- **Lock-in:** low if you treat it as a generic Linux VM running Docker.

## 2. Cloudflare: Workers, D1, R2

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

- **Workers Free:** 100,000 requests a day, **10 ms CPU per request** (time spent waiting on I/O doesn't count), 128 MB memory, 50 subrequests, **100 MB request-body limit** (set by the account plan).
- **Workers Paid:** $5/month minimum. Includes 10M requests and 30M CPU-ms a month, plus much larger D1 allowances (25B rows read, 50M rows written, 5 GB).
- **D1 Free:** 5M rows read and 100k rows written per day, 5 GB total storage. Queries fail once a daily limit is hit, until 00:00 UTC.
- **R2 Free:** 10 GB-month Standard storage, 1M Class A and 10M Class B operations a month, and **zero egress fees**. Beyond that, $0.015/GB-month.
- **Fit:** a few GB of PDFs fits R2's free tier. Single-user CRUD is far below the D1 and Workers caps. Static PWA assets can be served from Workers or Pages.
- **Caveats:** the 10 ms CPU cap rules out heavy work (PDF text extraction, HTML snapshot rendering) on the free plan. A single upload over 100 MB is rejected, so upload large files directly to R2 with presigned URLs.
- **Sleep/cold start:** effectively none.
- **Lock-in:** **high** for compute and DB (Workers runtime, D1 bindings). R2 is S3-compatible, so its lock-in is low. A framework with adapters (e.g. Hono, or SvelteKit/Nuxt/Remix Cloudflare adapters) and SQLite-compatible SQL (D1 is SQLite) reduces the lock-in.

## 3. Supabase Free

Source: [Supabase pricing](https://supabase.com/pricing)

- 500 MB Postgres (shared CPU, 500 MB RAM), **1 GB file storage**, 5 GB egress (plus 5 GB cached), 2 active projects.
- **Projects pause after 1 week of inactivity.** You unpause them manually. That's a real risk for an app that sits idle over the holidays.
- **Fit:** the DB is fine, but 1 GB of storage is too small for "a few GB" of PDFs. Pair it with R2 or Drive if used.
- **Lock-in:** medium. Postgres is portable, but auth, storage, and RLS-coupled APIs are Supabase-specific (the stack is open source and self-hostable).

## 4. Neon Free (Postgres only)

Source: [Neon pricing](https://neon.com/pricing)

- 1 GB storage per project (20 GB across projects), 100 CU-hours a month per project, up to 2 CU, 5 GB egress, 10 branches, 6 h of restore history.
- **Scale to zero after 5 minutes idle** can't be disabled. Resume takes well under a second, which is acceptable for a PWA.
- Exceeding a limit suspends compute or blocks writes. "None of these limits delete your data."
- **Lock-in:** low (plain Postgres). Pairs well with an Oracle, Cloudflare, or home-PC backend.

## 5. Render Free

Source: [Render free instances](https://render.com/docs/free)

- Web services **spin down after 15 min** without traffic. **Cold start takes about 1 minute.** 750 instance-hours a month.
- **Free Postgres expires 30 days after creation** (14-day grace, then deleted).
- No persistent disk, and the filesystem is wiped on restart.
- **Verdict:** not viable as a primary host. A 1-minute cold start ruins the "polished" requirement.

## 6. Fly.io

Source: [Fly.io pricing](https://docs.fly.io/about/pricing)

- **No free tier for new organizations** (the free allowances were discontinued in Oct 2024 and survive only on legacy plans). The trial lasts 2 machine-hours or 7 days.
- Smallest machine (shared-cpu-1x, 256 MB) costs about $2.19/month if it runs continuously. Volumes cost $0.15/GB-month.
- **Verdict:** a cheap paid option (~$2–5/mo with a small volume), not a free one. Low lock-in (Docker).

## 7. Own Windows PC + tunnel

Sources: [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/), [create a remote tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/), [Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/), [Zero Trust pricing](https://www.cloudflare.com/plans/zero-trust-services/), [Tailscale pricing](https://tailscale.com/pricing), [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)

- **Cloudflare Tunnel** (`cloudflared`, runs as a Windows service): no inbound ports, free. Cloudflare Zero Trust is free for up to 50 users, and Cloudflare Access can put a login in front of the app.
  - A named tunnel with a stable hostname **requires a domain added to Cloudflare**. The Student Pack offers a free 1-year domain (Namecheap .me, Name.com, .TECH, listed below).
  - Quick Tunnels (`trycloudflare.com`) need no account, but the URL changes every run, they have no uptime guarantee, a 200 in-flight request cap, and **no SSE**. They're only good for dev.
  - The free plan's 100 MB request-body cap applies to proxied uploads.
- **Tailscale:** the Personal plan is free (6 users, unlimited devices).
  - *Tailnet-only* access means the iPhone runs the Tailscale VPN app, and Chronos is reachable at `https://<pc>.<tailnet>.ts.net` with a valid cert. This is private and needs no domain.
  - **Funnel** (beta, "all plans") exposes it publicly on ports 443, 8443, and 10000 under `*.ts.net`, with unpublished bandwidth limits.
- **Pros:** $0, unlimited disk, full control, zero lock-in. A good dev environment, and a good place to keep the canonical file archive.
- **Cons:** **the app is down whenever the PC sleeps, reboots for Windows Update, or is off** (e.g. a laptop carried to lectures). That conflicts with "open Chronos on my iPhone between classes". The PWA's offline cache softens it but doesn't fix it. You also carry home-power and ISP risk, and backups are on you.
- **Verdict:** good for dev or as a hybrid (e.g. a home PC holding the large-file archive), weak as the sole production host.

## 8. Google Drive as the file store

Sources: [Google account storage](https://support.google.com/googleone/answer/9312312), [Drive API usage limits](https://developers.google.com/workspace/drive/api/guides/limits), [Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [OAuth 2.0 (refresh-token expiry)](https://developers.google.com/identity/protocols/oauth2)

- **Capacity:** 15 GB free per Google account, **shared with Gmail and Photos**. A few GB of PDFs fits if the account isn't already full.
- **API cost:** "All standard use of the Google Drive API is available at no additional cost." For projects created on or after 1 May 2026, quotas are counted in quota units (e.g. 1M units/min per project; `files.get` costs 5 units, `files.download` 200). Google plans to start billing above-quota usage later in 2026, with 90 days' notice. A single user stays far below the thresholds.
- **Scope:** use `drive.file`, which is **non-sensitive** and needs only basic OAuth verification. The app sees only files it created or that the user picked. Restricted scopes (`drive`, `drive.readonly`) trigger a security assessment, so avoid them.
- **Gotcha:** an OAuth app left in **"Testing"** status gets refresh tokens that **expire after 7 days**, so the server loses Drive access weekly. To get long-lived tokens, either publish the app ("In production"; `drive.file` keeps verification light) or use a service account with a shared folder.
- **Pros:** free, familiar, files remain browsable in Drive and Google's own PDF viewer, and they survive even if Chronos dies. That's a nice "no lock-in for your data" story.
- **Cons:** slower and chattier than S3 for in-app previews (proxy or stream through the backend). There's OAuth plumbing to build, and Google's per-user rate limits apply.
- **Verdict:** viable as a pluggable storage backend. R2, Oracle Object Storage, or the VM disk are simpler for v1.

## 9. GitHub Student Developer Pack and student credits

Sources: [GitHub Student Developer Pack](https://education.github.com/pack), [Azure for Students](https://azure.microsoft.com/en-us/free/students)

- **Azure for Students:** $100 credit for 12 months, **no credit card**, renewable yearly while a student. Also includes 12 months of free B-series VM hours (750 h), Azure Database for PostgreSQL, and always-free Functions (1M requests). When the credit runs out, services are disabled unless you switch to pay-as-you-go.
- **Heroku:** $13/month credit for 24 months (covers an Eco/Basic dyno plus a small Postgres).
- **MongoDB Atlas:** $50 credit. **Appwrite:** Education plan for 6 months.
- **Domains:** Namecheap free 1-year `.me`, Name.com free domain, or `.TECH` for 1 year. Useful for a named Cloudflare Tunnel or custom domain.
- **Verdict:** good bridges, but all time-limited. Don't build on something that disappears at graduation.

## 10. Other S3-compatible file stores worth knowing

- **Backblaze B2:** first 10 GB free, then $6.95/TB-month. Egress is free up to 3× your average stored data ([B2 pricing](https://www.backblaze.com/cloud-storage/pricing)).
- **Oracle Object Storage:** 20 GB free (section 1).
- **Cloudflare R2:** 10 GB free with zero egress (section 2).

## Implications for Chronos

1. **Design for portability:** a Docker-packaged backend, SQL on Postgres or SQLite, and file storage behind an S3-compatible interface. Then Oracle VM, home PC, Fly, and Cloudflare (with an adapter) are all deploy targets, not rewrites.
2. **Avoid hosts that sleep for a minute** (Render) or pause projects (Supabase Free). They clash with the "extremely polished" goal.
3. **Large uploads:** use presigned direct-to-bucket uploads to get around the 100 MB proxy and Worker body caps on Cloudflare-fronted setups.
4. **Heavy jobs** (PDF text extraction, webpage snapshotting) need a real CPU budget: an Oracle VM, the home PC, or Workers Paid. Workers Free's 10 ms can't run them.
5. **Backups are on you** on every $0 option. Schedule DB dumps and a file sync (e.g. to Google Drive or B2).

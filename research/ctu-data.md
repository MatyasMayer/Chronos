# Can Chronos read CTU data?

Research for [issue #2](https://github.com/MatyasMayer/Chronos/issues/2). Checked 2026-10-21. Every "live probe" result below comes from an unauthenticated HTTP request made that day.

## Short answer

Yes, and a single self-hosted user can do it without asking the university for anything special.

- **Timetable events (the main value):** the FIT **Sirius** personal iCalendar feed. It is a single secret URL that is already meant for calendar apps. No OAuth is needed.
- **Subjects + semesters:** Sirius's public semester endpoint and the public `courses.fit.cvut.cz` course catalogue JSON. Both work without auth.
- **Exams + enrollment (richer, optional):** **KOSapi** or Sirius JSON through the CTU OAuth server (`auth.fit.cvut.cz`). Any member of the CTU academic community can register their own app there.
- **Moodle deadlines:** Moodle's per-user calendar export URL (iCal). No Moodle API token is needed.
- **CTU SSO itself (SAML through Microsoft Entra ID)** is not usable by a personal app. Don't plan to "log in with CTU" at that level. The OAuth server is the developer-facing path.

## Source by source

### 1. Sirius (FIT timetable API) and the timetable iCal export

**What it is.** Sirius turns KOS timetable data plus FIT's scheduling exceptions into concrete calendar events. It outputs "JSON (for client apps) and iCalendar (for users)" ([cvut/sirius README](https://github.com/cvut/sirius)). The official timetable UI at [timetable.fit.cvut.cz](https://timetable.fit.cvut.cz/) (Fittable) is a client of Sirius ([cvut/fittable](https://github.com/cvut/fittable)).

**Data available** ([API v1 docs](https://cvut.github.io/sirius/docs/api-v1.html), base `https://sirius.fit.cvut.cz/api/v1`):
- `/people/{username}/events`: a student's personal events. Types are `lecture`, `tutorial`, `laboratory`, `exam`, `assessment`, `course_event`. Filters are `from`, `to`, `deleted`, `include=courses,teachers,schedule_exceptions`, and `limit` (max 100).
- `/courses/{code}/events`, `/rooms/{kosId}/events`, `/teachers/{username}/events`.
- `/faculties/{facultyId}/semesters`, `/semesters/{code}`: semester start/end dates, teaching and exam periods, holidays, week parity, and lesson start times.
- `/faculties/{id}/schedule/days|weeks`, `/schedule_exceptions`, `/search`.

**Auth.** Sirius accepts two strategies ([source: `lib/sirius_api/strategies/local_token.rb`](https://github.com/cvut/sirius/blob/master/lib/sirius_api/strategies/local_token.rb), [`scopes.rb`](https://github.com/cvut/sirius/blob/master/lib/sirius_api/scopes.rb)):
1. **Local personal token** (`?access_token=` query param). It maps to one username and grants only `READ_PERSONAL`. The docs say this token "allows access to her personal calendar only and it's intended for iCalendar". The feed URL is `https://sirius.fit.cvut.cz/api/v1/people/{username}/events.ical?access_token={token}`. FIT has emailed this URL to students since at least 2014 ([askFIT archive](https://github.com/hroncok/askfit-static)), and current community tools still use it (e.g. [D0mmik/fitmatchday](https://github.com/D0mmik/fitmatchday), [iCyuba/fittable](https://github.com/iCyuba/fittable)).
2. **OAuth bearer token** from `auth.fit.cvut.cz` with scope `cvut:sirius:personal:read` (only your own data), `cvut:sirius:limited-by-idm:read`, or `cvut:sirius:all:read`. The personal scope is what third-party student apps use (e.g. [tkdeeev/koswfriends](https://github.com/tkdeeev/koswfriends)).

**Live probe.** `GET /faculties/18000/semesters` returned 200 with JSON and **no auth** (18000 = FIT). `GET /people/x/events` returned 401 `"Missing local access token. Missing OAuth access token."`, so personal data is protected as documented.

**Stability.** Mixed. The service is still running and is what the official timetable and [courses.fit.cvut.cz](https://courses.fit.cvut.cz/) call today (its JS bundle hardcodes `sirius: https://sirius.fit.cvut.cz/api/v1/`). However, the GitHub repo is **archived** (archived 2024-07-23, last push 2022-07-21) and a successor UI ([cvut/fittable-next](https://github.com/cvut/fittable-next)) is "in development". The API has been stable for about 10 years, but it could be replaced. Treat it as an import source behind an adapter, not as a core dependency.

**Fit for Chronos.** Very good. Paste the iCal URL once. Chronos's server polls it and upserts Events, using the `UID` (`https://sirius.fit.cvut.cz/events/<id>`) as the stable external key. Event summaries carry the course code, which maps to a Subject.

### 2. KOSapi (KOS student information system API)

**What it is.** It is a read-only REST API (Atom/XML) over the KOS database. FIT runs an instance at `https://kosapi.fit.cvut.cz/api/3` ([wiki home](https://kosapi.fit.cvut.cz/projects/kosapi/wiki)).

**Data available** ([Resources](https://kosapi.fit.cvut.cz/projects/kosapi/wiki/Resources)): Courses, CourseEvents, Exams, Parallels, ScheduleSlots, Semesters, Students, Teachers, Rooms, Programmes, StudyPlans, Theses, and more. The student sub-resources are the useful ones ([Students](https://kosapi.fit.cvut.cz/projects/kosapi/wiki/Students)):
- `/students/{username}/enrolledCourses`: your courses (current semester by default, `sem=` to choose, `sem=none` for all).
- `/students/{username}/parallels`: your timetable parallels.
- `/students/{username}/exams` and `/registeredExams`: exam terms you are registered for.
- `/exams`, `/exams/{id}`: all exam terms ([Exams](https://kosapi.fit.cvut.cz/projects/kosapi/wiki/Exams)).

The scope is limited to the faculty's own records. Study codes are unstable, so the docs recommend database IDs.

**Auth** ([Security](https://kosapi.fit.cvut.cz/projects/kosapi/wiki/Security)): OAuth 2.0 through the faculty authorization server. HTTP Basic exists only for legacy local accounts, and "nové lokální účty už nevytvářím" (no new local accounts are issued). The scope used in practice is `cvut:kosapi:read` (e.g. [jotalac/kos-mcp-server](https://github.com/jotalac/kos-mcp-server), [ploca14/EAR-School-Information-System](https://github.com/ploca14/EAR-School-Information-System)). The official Ruby client defaults to `https://auth.fit.cvut.cz/oauth/token` ([cvut/kosapi_client.rb](https://github.com/cvut/kosapi_client.rb)).

**Terms.** The Security page says KOSapi exposes only data that is "public within the academic community of the faculty". There is no separate published ToS. Access questions go to the instance admin. Live probe: `/api/3/semesters/current` returned 401 without a token.

**Stability.** Good. API v3 has been current for years, and pre-3.2 versions were retired with notice. The old FEL host `kosapi.feld.cvut.cz` now 303-redirects to the FIT host. The XML/Atom format is clunky to parse but stable.

**Fit for Chronos.** Optional, for "auto-create my Subjects for this Semester" and "show my exam terms". It needs an OAuth app (see section 6).

### 3. courses.fit.cvut.cz (course pages)

**What it is.** It is a signpost SPA ([gitlab.fit.cvut.cz/course-pages/signpost-app](https://gitlab.fit.cvut.cz/course-pages/signpost-app), referenced in its bundle). Each course has a static site at `https://courses.fit.cvut.cz/{CODE}/` built from a GitLab repo.

**Data available (no auth).** `https://courses.fit.cvut.cz/data/courses-all.json` (live probe: 200, `"semester": "B261"`, generated 2026-10-07). For each course code it gives `nameCs`, `nameEn`, `department`, `programmeType`, `classesLang`, `season` (winter/summer), `active`, `homepage`, and `pagesRepo`. This is a clean source for **Subject name + homepage link (a Resource)**. Per-course materials are HTML pages, not an API, so Chronos would link to them rather than scrape them. The bundle also calls `courses.fit.cvut.cz/api/v1|v2/` and `grades.fit.cvut.cz/api/v1/` (classification overview) behind FIT OAuth (`/_oauth/login`). These are undocumented internal APIs, so don't depend on them.

**Stability.** The JSON file is an undocumented implementation detail of the signpost app. It is useful for a nice-to-have lookup, and Chronos should degrade gracefully if it disappears.

### 4. Moodle (moodle-vyuka.cvut.cz)

**Live probe** (`tool_mobile_get_public_config`, unauthenticated): `enablewebservices: 1`, `enablemobilewebservice: 1`, `typeoflogin: 2` (browser SSO), and the identity provider is "Přihlásit SSO" via `/auth/shibboleth/`. That endpoint redirects to `login.microsoftonline.com` (SAML).

**Options:**
- **Calendar export (recommended).** Moodle's standard per-user export ([Moodle docs: Calendar export](https://docs.moodle.org/en/Calendar_export)) produces a URL like `/calendar/export_execute.php?userid=…&authtoken=…&preset_what=all&preset_time=recentupcoming` containing assignment due dates, quiz closes, and course events. Live probe: the endpoint exists (it returns "Invalid authentication" for a bogus token). Like Sirius, this is a single secret URL you paste once. These items map to **Tasks with due dates** (or Events).
- **Web service API (not recommended).** `login/token.php` with username/password doesn't work for SSO-only accounts. Getting a token needs the mobile-app browser launch flow ([Moodle app SSO](https://docs.moodle.org/en/Moodle_app_SSO), `admin/tool/mobile/launch.php`), which hands the token back via a custom URL scheme. A PWA can't do that cleanly, and it would use the official app's service identity, so it is fragile and grey-area.

**Stability.** The calendar export is core Moodle and has been stable for over 10 years. Note that FIT courses use Moodle unevenly, and many keep materials on courses.fit.cvut.cz instead.

### 5. CTU login (SSO)

- **University SSO** is SAML (Shibboleth), now fronted by **Microsoft Entra ID**. The Moodle probe redirects to tenant `f345c406-…` on `login.microsoftonline.com`. A SAML SP or Entra app registration requires university IT, so it is **not available** to a personal self-hosted app.
- **CTU OAuth 2.0 authorization server** (`https://auth.fit.cvut.cz`, endpoints `/oauth/authorize`, `/oauth/token`, `/oauth/check_token`) is the developer-facing option, and "anyone from the CTU academic community" can use it ([rozvoj.fit.cvut.cz/Main/oauth2](https://rozvoj.fit.cvut.cz/Main/oauth2), [AppsManager](https://rozvoj.fit.cvut.cz/Main/AppsManager); the host failed DNS at check time, so this is quoted via search snippet). The process is to log into the [Apps Manager](https://auth.fit.cvut.cz/manager/), create a project and app, get a `client_id`/`client_secret`, and enable the service scopes you need.
- **App types** ([Apps Manager: app types](https://auth.fit.cvut.cz/manager/app-types.xhtml)):
  - *Web Application*: authorization-code grant. It is the **only type with refresh tokens**.
  - *Installed Application*: implicit grant (`response_type=token`), no refresh.
  - *Service Account*: `client_credentials` ("API keys", no user consent), no refresh.
  - Example tokens show `expires_in` of about 1,209,600 s (14 days).
- Many student projects use this server in production (e.g. [fit-ctu-discord/honza-botner](https://github.com/fit-ctu-discord/honza-botner), [jirkavrba/cvut-socialite-provider](https://github.com/jirkavrba/cvut-socialite-provider), [felwiki/dokuwiki-plugin-oauthcvut](https://github.com/felwiki/dokuwiki-plugin-oauthcvut)). The [cvut GitHub org](https://github.com/cvut) also provides official client libraries.
- **Fit for Chronos.** Register a *Web Application* with Chronos's own callback URL and scopes `cvut:kosapi:read` + `cvut:sirius:personal:read`. The server keeps the refresh token and syncs in the background. **Do not** use CTU OAuth as Chronos's own login, because the app is single-user and its own auth should not depend on CTU being up.

### 6. Terms of use (summary)

- No formal public ToS exists for KOSapi, Sirius, or the OAuth server. The constraints are: data is limited to what is public within the academic community (KOSapi), tokens are scoped to the user (Sirius personal), and apps must be registered through the Apps Manager by a CTU community member.
- Personal tokens and iCal URLs are credentials. Store them server-side and never commit them (Chronos is open source).
- Scraping KOS web UI, grades, or internal course-pages APIs is undocumented and should be avoided.

## What this means for the decision ahead

1. **MVP import = two iCal URLs** (Sirius personal timetable + Moodle calendar export). Neither needs OAuth or app registration. This needs a small server-side poller and an ICS parser, which favours a hosting option with scheduled jobs (cron) and a server component, not a purely static PWA. CORS on these hosts is not guaranteed, so fetching from the browser is not a safe assumption.
2. **Subjects/Semesters** can be seeded from the public Sirius semester endpoint and `courses-all.json` without auth.
3. **Phase 2 = CTU OAuth Web Application** for KOSapi enrolled courses and exam terms. It needs a stable HTTPS callback URL on the free host.
4. Design every source as a replaceable **import adapter** keyed by external IDs (Sirius event UID, KOS course code), because Sirius is archived upstream and may be replaced by a successor.

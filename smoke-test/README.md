# iPhone PWA smoke test (throwaway)

Resolves the wayfinder task "Smoke-test a home-screen PWA on the real iPhone" (#20). Not part of Chronos; never merged.

- `npm i && npx vite build` → `dist/` is published to the `gh-pages` branch (https://matyasmayer.github.io/Chronos/).
- `node scripts/send-push.mjs <vapid.json> <subscription.json>` sends a test push. The VAPID private key is kept outside the repo.

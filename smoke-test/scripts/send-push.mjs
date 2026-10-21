// Usage: node scripts/send-push.mjs <vapid.json> <subscription.json> [title] [body]
// The VAPID private key stays outside the repo.
import { readFileSync } from "node:fs";
import webpush from "web-push";

const [vapidPath, subPath, title = "Chronos smoke test", body = "Push from the server arrived 🎉"] = process.argv.slice(2);
const vapid = JSON.parse(readFileSync(vapidPath, "utf8"));
const subscription = JSON.parse(readFileSync(subPath, "utf8"));

webpush.setVapidDetails("mailto:noreply@example.com", vapid.publicKey, vapid.privateKey);
const res = await webpush.sendNotification(subscription, JSON.stringify({ title, body, sentAt: new Date().toISOString() }));
console.log("push service answered", res.statusCode);

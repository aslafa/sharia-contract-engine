/**
 * SCE — One-time JSON auth sync (temporary data strategy).
 * Adds an Argon2id passwordHash to demo users in data/sce_database.json
 * that do not have one yet. Idempotent. Never logs passwords/hashes.
 * Uses the same atomic write pattern as DBRepository.save.
 *
 * Usage: node scripts/sync-json-auth.js
 */

const fs = require("fs");
const path = require("path");
const jiti = require("jiti")(process.cwd(), {
  alias: { "@": path.resolve("src") },
});
const { hashPasswordSync } = jiti(path.resolve("src/lib/auth/password.ts"));

const DB_FILE = path.join(process.cwd(), "data", "sce_database.json");
const BACKUP = DB_FILE.replace(/\.json$/, ".backup.json");
const TMP = DB_FILE + ".tmp";

if (!fs.existsSync(DB_FILE)) {
  console.error("[SYNC] File database JSON tidak ditemukan:", DB_FILE);
  process.exit(1);
}

const raw = fs.readFileSync(DB_FILE, "utf-8");
const state = JSON.parse(raw);

if (!Array.isArray(state.users)) {
  console.error("[SYNC] Koleksi 'users' tidak valid.");
  process.exit(1);
}

const hash = hashPasswordSync(process.env.SCE_DEMO_PASSWORD || "P@ssword123!");
let changed = 0;
for (const user of state.users) {
  if (!user.passwordHash) {
    user.passwordHash = hash;
    changed++;
  }
}

if (changed > 0) {
  // Atomic persist: backup current -> write temp -> rename replace
  fs.copyFileSync(DB_FILE, BACKUP);
  fs.writeFileSync(TMP, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(TMP, DB_FILE);
}

console.log(`[SYNC] passwordHash (Argon2id) ditambahkan ke ${changed} user demo. Plaintext tidak pernah disimpan.`);

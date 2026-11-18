import { hash as argon2Hash, hashSync as argon2HashSync, verify as argon2Verify } from "@node-rs/argon2";

/**
 * Password hashing — Argon2id (OWASP-recommended parameters).
 * The @node-rs/argon2 default algorithm IS Argon2id (Algorithm.Argon2id),
 * so it is set implicitly — safe under isolatedModules where const enum
 * member access is disallowed.
 * Hashes are stored in User.passwordHash (Prisma). Plaintext is NEVER stored
 * or logged, and hashes are NEVER sent to the client.
 */
const ARGON2ID_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2Hash(plaintext, ARGON2ID_OPTIONS);
}

/** Synchronous variant for bootstrap/seed contexts only (e.g. JSON demo seed). */
export function hashPasswordSync(plaintext: string): string {
  return argon2HashSync(plaintext, ARGON2ID_OPTIONS);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2Verify(hash, plaintext);
  } catch {
    return false;
  }
}

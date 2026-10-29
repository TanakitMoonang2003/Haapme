/**
 * Token utilities for temporary ownership mechanism.
 *
 * TEMPORARY: This is a placeholder for real authentication.
 * A random opaque token is issued at creation time and stored in the
 * visitor's/owner's browser (localStorage).  The token's SHA-256 hash is
 * stored in MongoDB.  On subsequent requests the raw token is sent in an
 * Authorization header and compared against the stored hash.
 *
 * SECURITY NOTE: This is NOT a substitute for real authentication.
 * Anyone who obtains the raw token can impersonate the owner/visitor.
 * Replace with proper session/JWT auth before going to production.
 */
import { createHash, randomBytes } from 'node:crypto'

/** Generate a 32-byte random hex token */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/** SHA-256 hash of the raw token (what gets stored in DB) */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Constant-time comparison to avoid timing attacks */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken)
  if (hash.length !== storedHash.length) return false
  // Use timingSafeEqual via Buffer
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!
  }
  return diff === 0
}

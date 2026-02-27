# Plan 06 — Encryption Recovery & Key Management

> Complete encryption recovery routes, recovery code regeneration, and key rotation.

## Problem

Encryption setup and settings UI exist, but recovery and regeneration API routes are missing or incomplete. Key rotation is not implemented.

## Scope

### 1. Verify Encryption Setup Route (`POST /api/encryption/setup`)
- [ ] Verify it correctly: derives Master Key from passphrase (Argon2id/scrypt), generates AES-256 Data Key, encrypts Data Key with Master Key, stores `encryptionKeyEncrypted` + salt, generates recovery codes (hashed with bcrypt), returns plain recovery codes once
- [ ] Test end-to-end flow

### 2. Encryption Recovery (`POST /api/encryption/recover`)
- [ ] Accept recovery code + new passphrase
- [ ] Query `RecoveryCode` records for company
- [ ] Compare submitted code against bcrypt hashes (try each)
- [ ] If match found: mark code as used
- [ ] Derive new Master Key from new passphrase
- [ ] Decrypt Data Key using old Master Key (need old key derivation from recovery)
- [ ] Re-encrypt Data Key with new Master Key
- [ ] Update `encryptionKeyEncrypted` and salt in Company record
- [ ] Return success

### 3. Recovery Codes Regeneration (`POST /api/encryption/recovery-codes/regenerate`)
- [ ] RBAC: ADMIN only
- [ ] Require current passphrase for verification
- [ ] Delete all existing `RecoveryCode` records for company
- [ ] Generate new set of recovery codes
- [ ] Hash and store new codes
- [ ] Return plain codes (display once)

### 4. Change Passphrase (`POST /api/encryption/change-passphrase`)
- [ ] Verify current passphrase is correct (derive Master Key, try decrypting Data Key)
- [ ] Derive new Master Key from new passphrase
- [ ] Re-encrypt Data Key with new Master Key
- [ ] Update `encryptionKeyEncrypted` and salt
- [ ] Return success

### 5. Key Rotation (`POST /api/encryption/rotate-key`)
- [ ] Generate new AES-256 Data Key
- [ ] Encrypt new Data Key with current Master Key
- [ ] Increment `keyVersion` on Company
- [ ] Background: re-encrypt all existing `EvaluationResponse` records with new key
- [ ] Track re-encryption progress
- [ ] Keep old key version until migration complete

## Files to Modify/Create

- `src/app/api/encryption/recover/route.ts` (create or rewrite)
- `src/app/api/encryption/recovery-codes/regenerate/route.ts` (create or rewrite)
- `src/app/api/encryption/change-passphrase/route.ts` (verify/fix)
- `src/app/api/encryption/setup/route.ts` (verify/fix)
- `src/app/api/encryption/rotate-key/route.ts` (new — key rotation)
- `src/lib/encryption.ts` (verify all crypto functions)

## Dependencies

- None — encryption module is self-contained

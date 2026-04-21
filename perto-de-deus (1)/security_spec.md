# Security Specification - Perto de Deus

## Data Invariants
1. A **JournalEntry** must belong to the user who created it and cannot be read by others.
2. A **PrayerRequest** can be public or private. If private, only the owner can read/write. If public, others can read it and increment the `intercessorCount` but not modify other fields.
3. Users cannot modify their own `spiritualLevel` or `streak` directly without passing consistency checks (though for this initial draft, I'll allow them to write with validation).
4. `userId` in any document must match `request.auth.uid`.

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Attempt to create a `PrayerRequest` with `userId: "attacker_id"` while authenticated as `user_id`.
2. **PII Leak**: Attempt to read another user's `/users/{userId}/journal/{entryId}`.
3. **State Shortcutting**: Attempt to update `PrayerRequest.status` to "Respondido" without providing a `testimony`.
4. **ID Poisoning**: Attempt to create a user profile with an ID longer than 128 characters or containing emoji.
5. **Ghost Field**: Attempt to add `isAdmin: true` to a user document.
6. **Immutable Field**: Attempt to change `createdAt` on an existing prayer request.
7. **Size Attack**: Attempt to submit a journal entry with a `content` field larger than 50,000 characters.
8. **Invalid Schema**: Attempt to create a `User` profile without `spiritualLevel`.
9. **Relational Sync**: Attempt to create a `JournalEntry` for a user profile that doesn't exist.
10. **Unauthenticated Write**: Attempt to create any document without being signed in.
11. **Shadow Update**: Attempt to update `intercessorCount` on a private prayer request.
12. **Malicious Query**: Attempt to list all journal entries across all users.

## Security Controls
- **isValidUser()**: Validates profile structure, spiritual levels, and name length.
- **isValidPrayer()**: Validates prayer request fields, categories, and urgencies.
- **isValidJournal()**: Validates journal entries, content length, and mood.
- **isOwner(id)**: Checks if `request.auth.uid == id`.
- **isEmailVerified()**: Ensures user has verified their email.

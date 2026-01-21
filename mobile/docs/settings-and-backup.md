Settings & Backup UX Plan

Goals
- Tighten wallet account UX: lighter CTAs, reusable buttons, smoother scrolling.
- Make recovery phrase viewing feel trustworthy and legible.
- Define a clean “replace cloud backup with a new mnemonic” flow that reuses existing hooks/screens where possible.

Accounts list / buttons
- Swap bespoke Add/Set Active buttons to use the shared button primitives (`mobile/src/components/ui/button.tsx`), exposing `variant`/`size` props so the list CTA and set-active CTAs feel consistent and can be reused elsewhere.
- Keep backup actions (“View recovery phrase”, “Delete backup”, “Replace backup”) slightly smaller than full-bleed hero buttons; use `size="md"` with icons for hierarchy.
- Preserve max-height scroll; chevron press scrolls to end (already implemented).

Recovery phrase presentation
- Update `ViewMnemonicModal` styling: 3-column grid, numbered badges, subtle card background, larger line-height; hide words by default with blur/gradient, reveal via eye toggle; keep copy action disabled until revealed.
- Keep biometric gate via `useSecurityMethod`; if missing locally, prompt to restore via backup password (calling `walletKit.retrieveWallet(password)`).

Flows / routes
- Accounts list stays at `/settings/accounts` (current screen). Tapping a card still pushes `/settings/accounts/[id]` (id = index for now).
- New replace-backup flow entry from Accounts footer button:
  1) Warning sheet explaining it will delete the existing Google backup and replace it with accounts from a new mnemonic.
  2) Navigate to a dedicated replace screen (new route, e.g. `/wallet-replace`), reusing layout from `wallet-new`/`wallet-restore`.
  3) Step A: paste/type new 12-word mnemonic; validate word count/order; optional eye toggle.
  4) Step B: collect new Google backup password (reuse `GooglePasswordScreen` component).
  5) Step C: delete existing backup (`useDeleteGoogleBackup.deleteBackup` if password known, else `deleteBackupWithoutPassword` after warning).
  6) Step D: import wallet from mnemonic and set as active, then call `walletKit.backupWallet(password)` to upload the new state.
  7) Finish at home with toast “Backup replaced”.
- Forgot-password path (can’t delete without password): use existing `WarningSheet` pattern to guide deletion without password, then proceed to create/import flow with new mnemonic.

Implementation notes
- Hooks: extend `use-create-wallet.ts` with a `useReplaceGoogleBackup` helper that accepts `{ mnemonic, password }`, wraps delete + import + backup, and triggers haptics. If SDK lacks import-by-mnemonic, add `walletKit.importWallet(mnemonic, password)` or similar before backing up.
- Reuse `GooglePasswordScreen` in the replace flow for the password step; reuse mnemonic entry component from onboarding if present, or add a small `MnemonicInput` that enforces 12 words and supports paste.
- Adjust BackupActionsSection to use shared buttons and spacing tokens so buttons are narrower on mobile but still tappable.
- Testing: add flow tests to ensure replace path deletes old backup, writes new backup, and updates active account list; cover missing-mnemonic and backup-not-found cases with user-friendly toasts.

Safety / edge cases
- Make delete/replace warnings explicit: local wallet stays, cloud copy changes; irreversible.
- Disable screenshots when showing mnemonic if platform allows.
- Ensure sign-out clears `wallet` and `mnemonic` keys even after replace; verify `storageManager.clear()` coverage.

Open questions
- Should we force biometric auth before showing the mnemonic if password is absent?
- Should replace flow allow generating a brand-new mnemonic (vs paste existing)? If we support generation, we can reuse the wallet creation path and show words for copy before backup.

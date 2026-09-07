# Badge layout confirmation modal design

## Goal

Replace native browser confirmation prompts in the badge layout editor with an accessible in-app modal.

## Design

The editor owns one `Dialog` and a small pending-confirmation state containing a title, explanatory text, confirm label, destructive styling flag, and callback. Each action that currently calls `window.confirm` opens this modal instead. Cancel, Escape, backdrop close, and the close button clear the pending action without side effects. Confirm clears the modal before invoking the callback, preventing duplicate actions. Every callback re-checks its action-specific preconditions immediately before any mutation or API request; if the editor state changed while the modal was open, it closes and shows a non-destructive status instead.

The scope is the badge layout editor only: restore browser recovery, discard/reload, publish, starter replacement, field reset, and published-revision restore. Browser unload protection remains native because a custom modal cannot block an unload event. Navigation links retain their existing browser-level protection for the same reason.

## Verification

- Component tests assert that publish requires the modal confirmation, only invokes publication after its confirm button is pressed, and refuses a stale confirmation.
- Existing editor behaviour remains covered by the focused badge-layout test suite.

# Conference Unique Link Implementation Plan

1. Add optional `unique_link` to the shared `Conference` interface.
2. Add a clipboard handler to `ConferenceList` using the existing clipboard
   helper and Sonner toasts.
3. Render the registration link row only for non-empty values.
4. Add focused component tests for rendering, hiding, and copying the link.
5. Run the focused Jest test, TypeScript check, and visual verification.

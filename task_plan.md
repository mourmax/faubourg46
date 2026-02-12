# Task Plan - Quantity Field for Custom Items

## Phase 1: Blueprint
- [ ] Answer Discovery Questions (User).
- [ ] Define Data Schema updates in `gemini.md`.
- [ ] Research `customItem` usage in PDF and UI.

## Phase 2: Link
- [x] Verify local file access (Done).

## Phase 3: Architect
- [ ] Update `src/lib/types.ts`: Add `quantity` to `customItem` interface.
- [ ] Update `src/lib/quote-engine.ts`: Update `calculateQuoteTotal` to use `quantity`.
- [ ] Update `src/components/LeadEditor.tsx`:
    - [ ] Add Quantity input field.
    - [ ] Update state management to handle quantity changes.
    - [ ] Implementation of `quantité x prix unitaire = prix total` logic.
- [ ] Update `src/components/PdfDocument.tsx`:
    - [ ] Display quantity and treat `priceTtc` as unit price.

## Phase 4: Stylize
- [ ] Ensure the new field fits well in the grid layout (likely switch from 3 to 4 columns or adjust widths).
- [ ] Test the UI for responsiveness.

## Phase 5: Trigger
- [ ] Final verification with user.
- [ ] Update `progress.md`.

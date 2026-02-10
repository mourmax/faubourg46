# Findings - Formula Availability Rules

## Code Logic Breakdown

### Availability Matrix (extracted from `StepMenu.tsx` and `data.ts`)

| Service Type | Days | Available Formulas | Notes |
| :--- | :--- | :--- | :--- |
| **LUNCH** | Mon-Fri | All + Plat du Jour | Standard lunch service |
| **LUNCH** | Sat-Sun | **Brunch Only** | Adults & Children |
| **DINNER_1 / FULL**| Fri-Sat | **Festive Only** | Tapas Festif, Brasserie Festive |
| **DINNER_2** | Fri-Sat | All | Late service (after 22:15) |
| **DINNER (Any)** | Sun-Thu | All (except Brunch/Plat du Jour)| Standard dinner service |

### Specific Constraints
- **Brasserie (Partial/Full/Cocktail):** Limited to **30 guests max**.
- **Plat du Jour:** Only available during LUNCH on Weekdays (Mon-Fri).
- **Brunch:** Only available during LUNCH on Weekends (Sat-Sun).
- **Tapas (Standard):** Restricted to Dinner 2 in data schema but logic in `StepMenu` seems to allow it more broadly (need to clarify if this is intentional).

### Implementation Details
- Rules are enforced in `StepMenu.tsx` via the `getAvailabilityStatus` function.
- UI displays a "Locked" state with a reason (e.g., "Brunch UNIQUEMENT") if a formula is unavailable.
- guest count validation is active (matches formulas to convives).

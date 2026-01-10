# Intent Document: [Feature Name]

**Status:** Draft / Ready for Implementation
**Related Files:** [List related existing files, e.g., src/auth.js]

## 1. Business Goal (The "Why")
*Briefly explain the purpose of this feature. What problem does it solve?*
> Example: Allow users to customize how/when they receive notifications to reduce unsubscribe rates.

## 2. User Workflow (The "What")
*Step-by-step description of the user interaction.*
1.  [User Action] -> [System Response]
2.  [User Action] -> [System Response]
3.  ...

## 3. Technical Requirements (The "How")
*Be specific. Antigravity will follow these as constraints.*

### 3.1 Data & Storage
* **Schema Changes:** [e.g., Add `preferences` JSON column to `users` table]
* **State Management:** [e.g., Use local state for toggle, sync to DB on 'Save']

### 3.2 API & Logic
* **Endpoints:** [e.g., POST /api/settings/notifications]
* **Validation:** [e.g., Frequency must be one of: 'daily', 'weekly', 'realtime']

### 3.3 UI Components
* **Components Needed:** [e.g., ToggleSwitch, FrequencyDropdown]
* **Location:** `src/components/[FeatureName]/`
* **Styling:** Must use CSS Variables from `src/styles/variables.css`.

## 4. Success Criteria (Definition of Done)
* [ ] **Functionality:** All workflows in Section 2 work as described.
* [ ] **Testing:** Unit tests created for logic; Integration test for the full flow.
* [ ] **Compliance:** Passes `PROJECT_RULES.md` (Linting, No duplication, Accessibility).
* [ ] **Performance:** [e.g., Updates persist in <200ms]

## 5. Edge Cases & Risks
* [ ] What if the user is offline?
* [ ] What if the data is missing/null?
* [ ] Security: Ensure [Specific Check] is implemented.
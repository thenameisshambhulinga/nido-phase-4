# TODO - Nido-Tech Enterprise Platform (Phase Implementation Tracker)

## Phase A — AMC Category section rebuild + enterprise form UX (approved)

- [x] Step A1: Backup current AMC form component (AMCForm.tsx)
- [ ] Step A2: Rebuild AMC Category section to match required exact ordering and include:
  - [ ] radio selections
  - [ ] asset details table (responsive)
  - [ ] services included tabs
  - [ ] specification rows
  - [ ] SLA section
  - [ ] maintenance scope section
  - [ ] commercial details
  - [ ] payment terms
  - [ ] exclusions
  - [ ] special terms
  - [ ] attachments
  - [ ] authorization area

- [ ] Step A3: Implement enterprise form UX:
  - [ ] floating validation
  - [ ] inline error handling
  - [ ] meaningful placeholders
  - [ ] autosave draft (where appropriate)
- [ ] Step A4: Ensure company selection auto-fetch fills GST/address/contact person/designation/email/mobile.
- [ ] Step A5: Ensure validation blocks invalid email/mobile/GST and submit cannot proceed.
- [ ] Step A6: Ensure Tabs work properly and inputs persist.
- [ ] Step A7: Run targeted validation pass + basic runtime checks (no console errors).

## Phase B onward (not started yet)

- [ ] Phase B: centralized strict email validation across all flows
- [ ] Phase C: backend email system hardening + templates + delivery logging
- [ ] Phase D: restore enterprise search
- [ ] Phase E: product card/overview/image/cart corrections
- [ ] Phase F: profile systems identical to references

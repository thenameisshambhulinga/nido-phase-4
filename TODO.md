<<<<<<< HEAD
# TODO - Shop Products UI + Cart + Enquiry + User Profile Enhancements

## Step 1: Plan validation (no code changes)

- [x] Located relevant files: `src/pages/ShopPage.tsx`, `src/pages/CartPage.tsx`, `src/pages/ProductEnquiryPage.tsx`, `src/contexts/CartContext.tsx`, `src/pages/ClientDetailPage.tsx`, `src/pages/NidoUserProfilePage.tsx`, `src/pages/UsersPage.tsx`, `src/pages/EnhancedUsersPage.tsx`.

## Step 2: Make Shop product cards match enterprise requirement

- [ ] Update `ProductCard` layout in `src/pages/ShopPage.tsx`:
  - [ ] Move stock indicator to **top-left corner** (currently top-right)
  - [ ] Ensure image is strictly **left**, specs bullets **right**, action buttons at **bottom**
  - [ ] Ensure spacing/premium hover/responsive correctness

## Step 3: Enquiry AI chat enhancement

- [ ] Enhance `src/pages/ProductEnquiryPage.tsx`:
  - [ ] Use richer context (product fields + last messages)
  - [ ] Make automated responses more structured/enterprise
  - [ ] Preserve stability (no runtime errors)

## Step 4: Critical cart product rendering parity with shop

- [ ] Fix `src/pages/CartPage.tsx`:
  - [ ] Replace cart item UI with the same “wider product card” layout as shop
  - [ ] Ensure cart cards show the same key specs bullets, stock badge position, and action buttons
- [ ] Ensure cart data supports parity:
  - [ ] Update `src/contexts/CartContext.tsx` to persist required product metadata (or
        derive in CartPage) so parity is exact

## Step 5: CartContext augmentation (if needed)

- [ ] Migrate persisted cart shape (localStorage) safely if shape changes

## Step 6: Nido/clients user profile enhancements

- [ ] Enhance `src/pages/NidoUserProfilePage.tsx`:
  - [ ] Premium enterprise layout polish
  - [ ] Additional missing high-value sections as per established language

## Step 7: Testing & validation loop

- [ ] Run build/dev and validate:
  - [ ] Shop stock badge position is top-left
  - [ ] Shop cards have bullets/specs on right, image left, buttons at bottom
  - [ ] Enquire opens enquiry chat and automation responds
  - [ ] Cart products render identically to shop
  - [ ] Responsive behavior works (mobile/tablet/desktop)
  - [ ] No build/TS/Tailwind/runtime errors
=======
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
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e

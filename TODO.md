## Phase 1 — Critical dependency fixes (vendor → productCode → shop rendering)

### Vendor autocomplete (CRITICAL FIX 1)

- [ ] Replace the “Add Vendor Stock” vendor name input in `src/pages/AddMasterCatalogueItemPage.tsx` with a vendor-only autocomplete.
- [ ] Source vendors exclusively from `DataContext` (`vendors`) which comes from `GET /api/vendors`.
- [ ] Implement debounced (~300ms) search with dropdown that:
  - [ ] shows only while typing
  - [ ] closes on selection
  - [ ] is keyboard accessible (↑/↓, Enter, Esc)
  - [ ] closes on outside click
- [ ] Populate `vendorInventory` using selected vendor’s `name/id` and preserve existing add/delete behavior.
- [ ] Remove any static vendor arrays / hardcoded vendor blocks.

### Product code generation (CRITICAL FIX 2)

- [ ] Ensure productCode is generated ONCE only on page open in `src/pages/AddMasterCatalogueItemPage.tsx` using the required format:
  - `PROD-<CURRENT_YEAR>-<UNIQUE_6_DIGITS>`
- [ ] Ensure it never regenerates on rerender or edits (useRef guard).
- [ ] Ensure payload always sends `productCode: formData.productCode` (no `sku` fallback).
- [ ] Remove any logic that overwrites existing `productCode` with `sku` during add/publish or edit.

### Dynamic Shop rendering (CRITICAL FIX 3)

- [ ] Remove all placeholder procurement/marketing copy from shop UI.
- [ ] Make `publish` payload store fields needed by shop cards:
  - [ ] description
  - [ ] keySpecifications
  - [ ] generalSpecifications
  - [ ] productNotes
  - [ ] tags
  - [ ] brand
  - [ ] images
  - [ ] vendorInventory
  - [ ] leadTime
  - [ ] stock
- [ ] Update `src/pages/ShopPage.tsx` mapping so `EnterpriseProductCard` receives the required fields with correct shapes.
- [ ] Update `src/components/shop/EnterpriseProductCard.tsx` rendering so it consumes:
  - [ ] description
  - [ ] keySpecifications
  - [ ] generalSpecifications
  - [ ] productNotes
  - [ ] tags
  - [ ] brand
  - [ ] images
  - [ ] vendorInventory
  - [ ] leadTime
  - [ ] stock
  - [ ] and no hardcoded fallback marketing text.

### Verification gates (end-to-end)

- [ ] `npm run build`
- [ ] `npm test`
- [ ] Backend:
  - [ ] `curl GET /api/products`
  - [ ] `curl POST /api/products`
- [ ] End-to-end manual flow:
  - [ ] Create Product
  - [ ] Publish
  - [ ] Mongo save
  - [ ] GET products
  - [ ] Shop render shows real data (no placeholders)
  - [ ] Vendor inventory visible
  - [ ] Product code preserved

## Status

- Phase 1: not started

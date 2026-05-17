- [ ] Update MasterCataloguePage.tsx:
  - [ ] Make SKU manual-only (remove autoSku UX/logic; SKU always editable; handleAddItem uses form.sku)
  - [ ] Replace spec Up/Down controls with drag-and-drop reorder for specAttributes
  - [ ] Add brand autocomplete input (keep custom override allowed)
  - [ ] Add category searchable dropdown + custom create (reuse existing addNewCategory/addNewSubCategory logic)
  - [ ] Rename “Bulk Import” text to “Price Engine” (labels only)
- [ ] Update AddMasterCatalogueItemPage.tsx:
  - [ ] Remove “Price Preview” sidebar block
  - [ ] Make SKU manual-only (remove auto sku generation effect + remove SKU generate button; SKU input editable)
  - [ ] Replace spec Up/Down controls with drag-and-drop reorder for specRows
- [ ] Manual verification on localhost:
  - [ ] Configuration → Master Catalogue (grid, edit dialog)
  - [ ] Add New Item → spec reorder + SKU manual + brand/category UX
  - [ ] Configuration → Master Catalogue → Add/Edit Item page (sidebar no price preview, SKU manual, spec drag reorder)
  - [] maintain the clean code 

  master catalogue--> add new item should be edited as per the instruction
  

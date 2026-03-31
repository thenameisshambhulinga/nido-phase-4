# Nido Phase 3 Lint Fix & Execution TODO

Current: 64 ESLint errors. Goal: 0 errors + `npm run dev`.

## Steps (Approved Plan Breakdown):

- [x] 1. Fix Header.tsx (Date.now in formatTime → useMemo)
- [x] 2. Fix VendorScorecard.tsx (Math.random → seeded values)
- [x] 3. Plan created
- [x] 4. Fix QuickMailComposer.tsx (effect setState → key prop)
- [x] 5. Fix Sidebar.tsx ('any' → proper type)
- [x] 6. Fix DataContext.tsx (useCallback deps)
- [ ] 7. Fix UI sidebar.tsx, MagicVendorUpload.tsx (random/escapes)
- [ ] 8. Batch fix pages (Invoices, Login, etc.)
- [ ] 9. `npm run lint` verify 0 errors
- [ ] 10. `npm run dev` (localhost:8080)
- [ ] 11. Test app: login → navigate pages

Progress: Starting fixes...

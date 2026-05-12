# Bundle Optimization - Production Performance

**NEW TASK: Reduce main bundle 3MB+ → <500KB**

## Plan (Step-by-step)

### 1. Bundle Analysis

- [ ] Install `rollup-plugin-visualizer`
- [ ] Add to vite.config.ts dev mode ✓

### 2. Lazy Load ALL Pages (App.tsx ~60 imports)

- [ ] Replace static imports with `React.lazy(() => import("./pages/..."))`
- [ ] Wrap `<Routes>` with `<Suspense fallback={<Loader />} />`

### 3. Dynamic Heavy Libs

- [ ] html2canvas/jsPDF: CredentialsModal.tsx, OrderConfirmationPage.tsx → dynamic `await import()`
- [ ] recharts: Dashboards → lazy components or dynamic

### 4. Vite Config

- [ ] Add `manualChunks` for vendor/ui/chunks
- [ ] Enable visualizer

### 5. Verify

- [ ] `npm run build`
- [ ] All chunks <500KB
- [ ] Initial bundle <500KB

### 6. Cleanup

- [ ] Remove unused deps after analysis

**✅ PLAN APPROVED**

**Progress:**

1. [x] Created TODO ✓
2. [x] Install visualizer `npm i -D rollup-plugin-visualizer` ✓
3. [ ] Lazy App.tsx (60+ pages)
4. [ ] Dynamic jsPDF
5. [x] Vite manualChunks + visualizer in vite.config.ts ✓
6. [ ] Build + verify <500KB

# SevaSetu Comprehensive Testing Guide

> **Testing Philosophy**: Every eligibility claim is deterministically verified. Tests run green out of the box with **zero API keys required**, strictly mocking external Google endpoints.

---

## 1. Test Suite Summary & Structure

| Suite Category | File Location | Tests | Target / Coverage |
| :--- | :--- | :--- | :--- |
| **Rules Engine Unit Tests** | `tests/unit/rulesEngine.test.ts` | 30 | ≥ 90% (Actual: 98.16% Lines, 91.56% Branch) |
| **Schema Validation Tests** | `tests/unit/schemaValidation.test.ts` | 12 | ≥ 90% (Actual: 100% Lines & Branch) |
| **Security Redactor Tests** | `tests/unit/redactor.test.ts` | 7 | Masks Aadhaar, PAN, and phone numbers |
| **Image Sanitizer Tests** | `tests/unit/image.test.ts` | 8 | Magic bytes validation, 5MB limit, EXIF stripping |
| **Rate Limiter Tests** | `tests/unit/rateLimit.test.ts` | 3 | Token bucket window, IP isolation |
| **i18n Completeness Tests** | `tests/unit/i18n.test.ts` | 4 | 100% key parity across `en.json`, `te.json`, `hi.json` |
| **SHA-256 Cache Tests** | `tests/unit/cache.test.ts` | 4 | Normalized key hashing and TTL eviction |
| **Schemes Golden Baseline** | `tests/golden/schemesGolden.test.ts` | 14 | 7 fixed citizen baseline profiles |
| **API Integration Tests** | `tests/integration/*.test.ts` | 12 | Extract, Explain, Draft, Schemes, STT endpoints |
| **End-to-End User Journeys**| `tests/e2e/*.spec.ts` | 4 | English, Telugu, Keyboard navigation, Axe accessibility |

---

## 2. Command Reference

### Run All Unit, Golden, and Integration Tests
```bash
npm test
```
*Executes all unit, golden, and integration test files with v8 code coverage reporting.*

### Run Code Coverage Check
```bash
npx vitest run --coverage
```
*Enforces ≥ 90% statement, branch, function, and line coverage thresholds on `src/services/rules/**` and `src/schemas/**`.*

### Run TypeScript Strict Type Check
```bash
npm run typecheck
```
*Verifies 0 TypeScript errors with `noImplicitAny: true`, `strict: true`, `noUnusedLocals: true`.*

### Run ESLint Quality Check
```bash
npm run lint
```
*Verifies 0 ESLint errors and 0 warnings under strict Next.js and TypeScript rules.*

### Run Production Security Audit
```bash
npm audit --omit=dev
```
*Confirms 0 high or critical vulnerabilities in production dependencies.*

### Run End-to-End & WCAG Accessibility Tests
```bash
npx playwright test
```
*Runs end-to-end user journeys in English and Telugu, validates keyboard-only interaction, and executes axe-core accessibility audits for WCAG 2.2 AA.*

---

## 3. Golden Baseline Profiles

To guarantee that changes to scheme data cannot inadvertently alter citizen outcomes without failing tests, `tests/golden/schemesGolden.test.ts` maintains 7 immutable profiles:

1. **Small Marginal Farmer**: Resident of AP, 2.5 acres land, income ₹90,000 -> `LIKELY_ELIGIBLE` for YSR Rythu Bharosa.
2. **Wealthy Landowner**: Farmer with 12 acres -> `NOT_ELIGIBLE` for YSR Rythu Bharosa (exceeds 5.0 acre ceiling).
3. **Senior Citizen**: 64-year-old resident, income ₹60,000 -> `LIKELY_ELIGIBLE` for YSR Pension Kanuka.
4. **Young Non-Disabled Person**: 35-year-old worker, 0% disability -> `NOT_ELIGIBLE` for YSR Pension Kanuka.
5. **Disabled Citizen**: 28-year-old resident with 50% SADAREM disability -> `LIKELY_ELIGIBLE` for YSR Pension Kanuka.
6. **BPL Healthcare Beneficiary**: Resident with White Ration Card, income ₹220,000 -> `LIKELY_ELIGIBLE` for Dr. YSR Aarogyasri.
7. **BC Woman Entrepreneur**: 52-year-old BC woman, income ₹75,000 -> `LIKELY_ELIGIBLE` for YSR Cheyutha.

# Component library: branch & MR workflow

Implement the shared UI components **one per branch**, then open and merge MRs one by one.

## Component order (recommended)

| # | Branch name       | Component          | Location              |
|---|-------------------|--------------------|------------------------|
| 1 | `feat/ui-button`  | Button             | `components/ui/`       |
| 2 | `feat/ui-label`   | Label              | `components/ui/`      |
| 3 | `feat/ui-error-message` | ErrorMessage | `components/ui/`  |
| 4 | `feat/ui-card`    | Card               | `components/ui/`       |
| 5 | `feat/ui-input`   | Input              | `components/ui/`       |
| 6 | `feat/ui-textarea` | Textarea          | `components/ui/`       |
| 7 | `feat/ui-select`  | Select             | `components/ui/`       |
| 8 | `feat/ui-tag`     | Tag                | `components/ui/`       |
| 9 | `feat/ui-modal`   | Modal              | `components/ui/`       |
| 10| `feat/ui-page-header` | PageHeader   | `components/layout/`   |
| 11| `feat/ui-empty-state` | EmptyState   | `components/layout/`   |
| 12| `feat/ui-pagination`  | Pagination  | `components/layout/`   |
| 13| `feat/ui-data-table`  | DataTable   | `components/layout/`   |
| 14| `feat/ui-qr-display`  | QRDisplay   | `components/layout/`   |
| 15| `feat/ui-form-card`    | FormCard    | `components/layout/`   |
| 16| `feat/ui-form-field-renderer` | FormFieldRenderer | `components/forms/` |
| 17| `feat/ui-dropdown-menu` | DropdownMenu | `components/ui/`   |

## Workflow per component

1. From `main`: `git checkout main && git pull`
2. Create branch: `git checkout -b feat/ui-<component>`
3. Implement component + tests under `frontend/suggestion/src/components/` (see `.cursor/rules/frontend-component-library.mdc` for props).
4. Run tests: `npm run test` (from `frontend/suggestion/`)
5. Commit, push, open MR targeting `main`
6. After review, merge the MR
7. Repeat from step 1 for the next component

## Reference

- Component list and props: `.cursor/rules/frontend-component-library.mdc`
- UX and patterns: `.cursor/rules/frontend-components-ux.mdc`

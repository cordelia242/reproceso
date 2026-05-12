# Status Buttons per Cell — Design Spec

**Date:** 2026-05-11  
**File affected:** `app/components/documents-table.tsx`

## Summary

Replace per-row "Reprocesar" button and per-cell checkboxes with circular status buttons that drive reprocessing at the individual cell level. Right-click on a button with an active job navigates to the detail page.

## Changes

### Remove
- `<th>Acción</th>` column and its `<td>` in every row
- `<input type="checkbox">` cells for each participant column
- `selections` state (useState) and the `toggle` function
- `needsReprocess` helper and `reprocessRow` function
- `selectionsMap` / `setGlobalSelections` usage in the component (context can keep those fields)

### Add

#### `reprocessCell(doc: SigningDocument, sig: Signatory) => Promise<void>`
- Checks if job is currently loading → returns early (no double call)
- Generates a new `jobId` via `crypto.randomUUID()`
- Saves job as `loading` via `saveJob`
- Updates `cellJobs` in global context with `setGlobalCellJobs`
- Calls the API endpoint `${API_BASE}/${doc.DocumentId}` with POST body `{ InterviewId, DirectoryId, FlowType: 0, SigningRepresentative }`
- On response: saves job as `completed` or `error`

#### Status button per participant cell

| Condition | Background | Content | `disabled` | `onContextMenu` |
|-----------|-----------|---------|-----------|----------------|
| No job, has signatory | `bg-blue-600` | `"O"` text | `false` | — |
| Job loading | `bg-yellow-400` | `<SpinnerIcon animate-spin>` | `true` | navigate to detail |
| Job completed | `bg-green-500` | `<CheckIcon>` | `false` | navigate to detail |
| Job error | `bg-red-500` | `<XIcon>` | `false` | navigate to detail |
| No signatory | `bg-gray-300` | `"O"` text | `true` | — |

Button shape: `w-7 h-7 rounded-full text-white inline-flex items-center justify-center`

**Right-click** (`onContextMenu`): calls `e.preventDefault()` then `router.push(`/reprocess/${jobId}`)`.  
Only attached when a `jobId` exists for the cell.

## Architecture

No new files. All changes in `documents-table.tsx`.  
`useRouter` from `next/navigation` added for programmatic navigation on right-click.  
`selections` / `selectionsMap` removed from component but left intact in the context (no context changes needed).

## Error handling / edge cases

- If `!hasSignatory`: grayed-out disabled button, no click or right-click handler
- Concurrent right-clicks on the same loading cell do not trigger new jobs (handled by early-return check)
- Re-reprocess on success/error creates a new job record and replaces the `cellJobs` entry for that key

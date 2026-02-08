# Meta Analyzer - Functional Specification for Rebuild

## Purpose
Build a web-based analysis tool that compares page-level metadata between two website bases across many paths. The tool is used for SEO validation, migration QA, and content parity checks.

## Primary User Outcome
Given:
- Base URL 1 (required unless Base URL 2 is provided)
- Base URL 2 (optional unless Base URL 1 is provided)
- A list of URL paths

The user gets:
- Per-path comparison results for both **meta tags** and **link tags**
- Clear categorization of what is only in one side, different, or identical
- Summary counts per category
- Ability to export detected differences to Markdown

## End-to-End User Flow
1. User opens the app and sees a single-page form.
2. User enters one or two base URLs.
3. User enters one or more relative paths (one per line).
4. User submits.
5. System validates input and normalizes paths.
6. System fetches each URL version for each path.
7. System extracts all meta and link tags.
8. System compares tags per path and renders side-by-side results.
9. User optionally exports differences to Markdown (copied to clipboard).

## Inputs and Validation Rules
- Must provide at least one base URL.
- Must provide at least one path.
- Paths are normalized to begin with `/`.
- Empty path lines are ignored.
- If input is invalid, user gets an immediate message and no processing starts.

## URL Construction Rules
- For each path, construct final URL as:
  - `normalizedBaseUrl + normalizedPath`
- Normalize base URL by removing a trailing slash before concatenation.
- Support 3 operation modes:
  - Two-URL compare mode (both bases present)
  - Left-only mode (only Base URL 1 present)
  - Right-only mode (only Base URL 2 present)

## Fetching Behavior
- Each URL fetch has a fixed timeout window (10 seconds in current behavior).
- Non-success HTTP responses are treated as fetch failures for that URL and path.
- Network/timeout errors are captured and surfaced as readable errors.
- Processing continues for other paths/URLs even when some fail.

## Data Extraction Behavior
### Meta tags
- Extract all `<meta>` elements.
- Preserve all attributes present on each element as key/value pairs.
- Include every non-empty extracted tag.

### Link tags
- Extract all `<link>` elements.
- Preserve all attributes present on each element as key/value pairs.
- Exclude link tags whose `href` contains the substring `build`.

## Comparison Model
Comparison happens independently for:
- Meta tags
- Link tags

Each comparison produces 4 buckets:
- `onlyLeft`: tag exists only in URL 1 set
- `onlyRight`: tag exists only in URL 2 set
- `different`: tags are considered same logical key but differ in attributes/values
- `identical`: exact tag match

### Identity and Similarity Rules
#### Meta key precedence
Use first available:
1. `name`
2. `property`
3. `charset`
4. `http-equiv`
5. fallback key `other`

#### Link key precedence
Use first available:
1. `rel`
2. `type`
3. fallback key `other`

#### Identical
- Tags are identical only when full attribute content matches exactly.

#### Different
- Tags are considered "different" when they share the same logical key but are not exact matches.

## Result Presentation Requirements
For each path:
- Show path identifier.
- Show resolved URL(s) as clickable links.
- Show per-URL error badges when fetch fails.
- If both URLs fail for that path, display a path-level failure state and skip diff rendering.
- If single-URL mode is active, show all discovered tags as inventory (not bilateral comparison).

For each tag type section (Meta, Link):
- Render tag-level entries with distinct visual status:
  - Only in left
  - Only in right
  - Different
  - Identical
- Show summary counts for each status bucket.
- In single-URL mode, show total count only.

## Export Behavior
- Export action is available only after successful comparison data is present.
- Export creates a Markdown table with columns:
  - Path
  - Type (Meta/Link)
  - URL 1 tag representation
  - URL 2 tag representation
  - Status
- Export includes:
  - Only-in-URL1 rows
  - Only-in-URL2 rows
  - Different rows
- Identical rows are intentionally not exported.
- Output is copied to clipboard.
- User receives success/failure feedback on copy action.

## Error and State Handling
- Global submit state:
  - Disable submit while processing.
  - Show loading indicator during processing.
  - Re-enable submit and hide loader when finished.
- On request-level failure, show a top-level error message.
- Store latest successful comparison dataset in memory for export.
- Clear/disable export state when no valid comparison dataset exists.

## Functional Components to Replicate
1. Input form with two base URL fields and multi-line path input.
2. Submit workflow with input validation and normalization.
3. Batch URL processing across all paths.
4. Robust fetch with timeout and per-URL error capture.
5. Meta/link extraction preserving all attributes.
6. Link filtering rule for `href` containing `build`.
7. Diff engine with four result buckets and key precedence logic.
8. Per-path rendering for headers, links, errors, tag sections, and summaries.
9. Single-URL inventory mode behavior.
10. Markdown export of non-identical differences to clipboard.
11. User feedback states for loading, failures, and export success/failure.

## Non-Functional Expectations (Behavioral)
- Responsive interface usable on desktop and mobile.
- Clear visual differentiation of comparison statuses.
- Fast enough to process multiple paths in one run.
- Tolerant to partial failures without aborting full batch.

## Parity Checklist for New Repository
- [ ] Can run with only URL 1, only URL 2, or both.
- [ ] Path normalization always adds leading slash.
- [ ] Per-URL timeout and HTTP-error handling are implemented.
- [ ] Meta and link extraction preserve full attribute sets.
- [ ] Link `href` containing `build` is excluded.
- [ ] Diff logic supports only-left, only-right, different, identical.
- [ ] Key precedence rules match current behavior.
- [ ] Per-path error states and normal states render correctly.
- [ ] Summary counts are shown for both Meta and Link sections.
- [ ] Export outputs Markdown table of non-identical differences only.
- [ ] Export copies output to clipboard and reports status.

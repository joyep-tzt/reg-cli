# Feature: Diff Percentage in Reports

## Summary
Added support for displaying the percentage of difference in both JSON and HTML reports when image comparisons fail.

## Changes Made

### 1. Core Diff Calculation (`src/diff.js`)
- Enhanced `DiffResult` type to include `width`, `height`, `diffCount`, and `diffPercentage`
- Modified diff process to calculate and return the percentage: `(diffCount / totalPixels) * 100`
- Sends comprehensive diff data back to the parent process

### 2. Report Generation (`src/report.js`)
- Updated `ReportParams` type to include optional `diffDetails` object
- Modified `createJSONReport()` to include `diffDetails` when failed items exist
- Modified `createHTMLReport()` to include `diffPercentage` in failed item data
- Only includes `diffDetails` when there are actual failed comparisons (backward compatible)

### 3. Data Flow (`src/index.js`)
- Updated `CompareResult` type to include diff metrics
- Modified `aggregate()` function to preserve diff details for failed items
- Passes `diffDetails` object to report creation

### 4. Tests (`test/cli.test.mjs`)
- Updated `replaceReportPath()` helper to handle object fields (not just arrays)
- Added assertions in failing test cases to verify `diffDetails` presence and structure
- Ensures backward compatibility by checking for field existence

## Output Format

### JSON Report
```json
{
  "failedItems": ["image.png"],
  "diffDetails": {
    "image.png": {
      "width": 800,
      "height": 578,
      "diffCount": 4969,
      "diffPercentage": 1.0746107266435985
    }
  },
  ...
}
```

### HTML Report
The `diffPercentage` is included in the data structure passed to the HTML template, making it available for display in the UI.

## Backward Compatibility
- When no images fail comparison, `diffDetails` is not included (keeps JSON clean)
- Existing tools that don't expect `diffDetails` will continue to work
- The field is optional and only present when relevant

## Testing
- All existing tests pass (24/25 tests - one pre-existing failure in perf test)
- Verified with sample images showing 1.07% difference
- Tested with identical images (no diffDetails added)
- JSON and HTML reports both include the percentage data

## Usage Example
```bash
# Run comparison
reg-cli ./actual ./expected ./diff -J ./report.json -R ./report.html

# The report.json will include diffDetails for failed comparisons:
# - width, height: Image dimensions
# - diffCount: Number of different pixels
# - diffPercentage: Percentage of pixels that differ (0-100)
```

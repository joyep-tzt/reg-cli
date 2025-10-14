# Before/After Comparison: Diff Percentage Feature

## Command
```bash
reg-cli ./sample/actual ./sample/expected ./sample/diff -J ./report.json
```

## Console Output
```
✘ change  sample/actual/sample.png

✘ 1 file(s) changed.

Inspect your code changes, re-run with `-U` to update them.
```

---

## JSON Report Output

### ❌ BEFORE (Without Diff Percentage)
```json
{
  "failedItems": ["sample.png"],
  "newItems": [],
  "deletedItems": [],
  "passedItems": [],
  "expectedItems": ["sample.png"],
  "actualItems": ["sample.png"],
  "diffItems": ["sample.png"],
  "actualDir": "./sample/actual",
  "expectedDir": "./sample/expected",
  "diffDir": "./sample/diff"
}
```

**Problem**: No way to know HOW MUCH the images differ. Is it 1% or 99%?

---

### ✅ AFTER (With Diff Percentage)
```json
{
  "failedItems": ["sample.png"],
  "newItems": [],
  "deletedItems": [],
  "passedItems": [],
  "expectedItems": ["sample.png"],
  "actualItems": ["sample.png"],
  "diffItems": ["sample.png"],
  "actualDir": "./sample/actual",
  "expectedDir": "./sample/expected",
  "diffDir": "./sample/diff",
  "diffDetails": {
    "sample.png": {
      "width": 800,
      "height": 578,
      "diffCount": 4969,
      "diffPercentage": 1.0746107266435985
    }
  }
}
```

**Benefits**:
- ✅ Know exact image dimensions (800×578 = 462,400 pixels)
- ✅ Know exact number of different pixels (4,969)
- ✅ Know percentage difference (1.07%)
- ✅ Can make informed decisions about severity
- ✅ Can automate threshold checks

---

## Use Cases

### 1. Understanding Severity
```javascript
const report = require('./report.json');
const details = report.diffDetails['sample.png'];

if (details.diffPercentage < 1) {
  console.log('Minor change - probably acceptable');
} else if (details.diffPercentage < 5) {
  console.log('Moderate change - needs review');
} else {
  console.log('Major change - requires investigation');
}
```

### 2. Automated Threshold Checks
```javascript
const MAX_DIFF_PERCENTAGE = 2.0;

Object.entries(report.diffDetails).forEach(([image, details]) => {
  if (details.diffPercentage > MAX_DIFF_PERCENTAGE) {
    throw new Error(
      `${image} has ${details.diffPercentage.toFixed(2)}% difference ` +
      `(max allowed: ${MAX_DIFF_PERCENTAGE}%)`
    );
  }
});
```

### 3. Reporting and Analytics
```javascript
const avgDiff = Object.values(report.diffDetails)
  .reduce((sum, d) => sum + d.diffPercentage, 0) / 
  Object.keys(report.diffDetails).length;

console.log(`Average difference across all images: ${avgDiff.toFixed(2)}%`);
```

---

## Backward Compatibility

### When NO failures (all images pass):
```json
{
  "failedItems": [],
  "passedItems": ["sample.png"],
  "actualDir": "./sample/actual",
  "expectedDir": "./sample/expected",
  "diffDir": "./sample/diff"
}
```

**Note**: `diffDetails` is NOT included when there are no failures. 
This keeps the JSON clean and maintains backward compatibility.

---

## HTML Report

The HTML report also includes the `diffPercentage` data:

```javascript
// Embedded in HTML report
window['__reg__'] = {
  "hasFailed": true,
  "failedItems": [
    {
      "raw": "sample.png",
      "encoded": "sample.png",
      "diffPercentage": 1.0746107266435985
    }
  ],
  // ... other fields
}
```

The UI can now display: **"1.07% difference"** next to each failed image.

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _mustache = _interopRequireDefault(require("mustache"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var loadFaviconAsDataURL = type => {
  var colors = {
    success: '#4CAF50',
    failure: '#F44336'
  };
  var color = colors[type] || colors.success;
  var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="${color}" stroke="#fff" stroke-width="1"/>
    <text x="8" y="12" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">
      ${type === 'failure' ? '✗' : '✓'}
    </text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
};
var encodeFilePath = filePath => {
  return filePath.split(_path.default.sep).map(p => encodeURIComponent(p)).join(_path.default.sep);
};
var createSimpleCSS = () => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .header.danger {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }
    
    .header.success {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      color: #666;
    }
    
    .section {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    
    .item-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .item {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .item-name {
      font-weight: 600;
      margin-bottom: 10px;
      word-break: break-word;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .item-meta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: normal;
      color: #666;
    }
    
    .item-meta .percentage-badge {
      position: static;
      margin: 0;
      padding: 3px 8px;
      font-size: 12px;
    }
    
    .item-images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .image-container {
      position: relative;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .image-container img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .image-label {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 8px;
      font-size: 12px;
      text-align: center;
    }
    
    .percentage-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: #f44336;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .percentage-badge.low {
      background: #4caf50;
    }
    
    .percentage-badge.medium {
      background: #ff9800;
    }
    
    .percentage-badge.high {
      background: #f44336;
    }
    
    .item-details {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
      font-size: 13px;
      color: #666;
    }
    
    .item-details span {
      display: inline-block;
      margin-right: 15px;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 14px;
    }
  `;
};
var createSimpleJS = () => {
  return `
    (function() {
      const data = window['__reg__'];
      const app = document.getElementById('app');
      
      if (!data) {
        app.innerHTML = '<div class="container"><div class="header danger"><h1>Error: No report data found</h1></div></div>';
        return;
      }
      
      const formatPercentage = (percentage) => {
        if (typeof percentage === 'number') {
          return percentage.toFixed(4) + '%';
        }
        return 'N/A';
      };
      
      const getPercentageClass = (percentage) => {
        if (typeof percentage !== 'number') return '';
        if (percentage < 0.1) return 'low';
        if (percentage < 5) return 'medium';
        return 'high';
      };
      
      const createFailedItem = (item) => {
        const actualSrc = \`\${data.actualDir}/\${item.encoded}\`;
        const expectedSrc = \`\${data.expectedDir}/\${item.encoded}\`;
        const diffSrc = \`\${data.diffDir}/\${item.encoded.replace(/\\.[^.]+$/, '.png')}\`;
        const percentage = item.diffPercentage;
        const percentageClass = getPercentageClass(percentage);
        
        const detailsText = [];
        if (percentage !== undefined) {
          detailsText.push(\`<span class="percentage-badge \${percentageClass}">\${formatPercentage(percentage)}</span>\`);
        }
        if (item.diffCount) {
          detailsText.push(\`\${item.diffCount.toLocaleString()} px\`);
        }
        if (item.width && item.height) {
          detailsText.push(\`\${item.width}×\${item.height}\`);
        }
        
        return \`
          <div class="item">
            <div class="item-name">
              ❌ \${item.raw}
              \${detailsText.length > 0 ? \`<span class="item-meta">\${detailsText.join(' • ')}</span>\` : ''}
            </div>
            <div class="item-images">
              <div class="image-container">
                <div class="image-label">Expected</div>
                <img src="\${expectedSrc}" alt="Expected">
              </div>
              <div class="image-container">
                <div class="image-label">Actual</div>
                <img src="\${actualSrc}" alt="Actual">
              </div>
              <div class="image-container">
                <div class="image-label">Diff</div>
                <img src="\${diffSrc}" alt="Diff">
              </div>
            </div>
          </div>
        \`;
      };
      
      const createPassedItem = (item) => {
        const actualSrc = \`\${data.actualDir}/\${item.encoded}\`;
        const expectedSrc = \`\${data.expectedDir}/\${item.encoded}\`;
        const percentage = item.diffPercentage;
        const percentageClass = getPercentageClass(percentage);
        
        const detailsText = [];
        if (percentage !== undefined) {
          detailsText.push(\`<span class="percentage-badge \${percentageClass}">\${formatPercentage(percentage)}</span>\`);
        }
        if (item.diffCount) {
          detailsText.push(\`\${item.diffCount.toLocaleString()} px\`);
        }
        if (item.width && item.height) {
          detailsText.push(\`\${item.width}×\${item.height}\`);
        }
        
        return \`
          <div class="item">
            <div class="item-name">
              ✅ \${item.raw}
              \${detailsText.length > 0 ? \`<span class="item-meta">\${detailsText.join(' • ')}</span>\` : ''}
            </div>
            <div class="item-images">
              <div class="image-container">
                <div class="image-label">Expected</div>
                <img src="\${expectedSrc}" alt="Expected">
              </div>
              <div class="image-container">
                <div class="image-label">Actual</div>
                <img src="\${actualSrc}" alt="Actual">
              </div>
            </div>
          </div>
        \`;
      };
      
      const createNewItem = (item) => {
        const actualSrc = \`\${data.actualDir}/\${item.encoded}\`;
        return \`
          <div class="item">
            <div class="item-name">🆕 \${item.raw}</div>
            <div class="item-images">
              <div class="image-container">
                <div class="image-label">New Image</div>
                <img src="\${actualSrc}" alt="New">
              </div>
            </div>
          </div>
        \`;
      };
      
      const createDeletedItem = (item) => {
        const expectedSrc = \`\${data.expectedDir}/\${item.encoded}\`;
        return \`
          <div class="item">
            <div class="item-name">🗑️ \${item.raw}</div>
            <div class="item-images">
              <div class="image-container">
                <div class="image-label">Deleted Image</div>
                <img src="\${expectedSrc}" alt="Deleted">
              </div>
            </div>
          </div>
        \`;
      };
      
      const createSection = (title, items, createFn) => {
        if (!items || items.length === 0) {
          return \`
            <div class="section">
              <h2>\${title} (0)</h2>
              <div class="empty-state">📭 No \${title.toLowerCase()}</div>
            </div>
          \`;
        }
        
        return \`
          <div class="section">
            <h2>\${title} (\${items.length})</h2>
            <div class="item-grid">
              \${items.map(createFn).join('')}
            </div>
          </div>
        \`;
      };
      
      const getTotalTests = () => {
        return data.failedItems.length + data.passedItems.length + data.newItems.length + data.deletedItems.length;
      };
      
      const getSuccessRate = () => {
        const total = getTotalTests();
        if (total === 0) return 100;
        return ((data.passedItems.length / total) * 100).toFixed(1);
      };
      
      const html = \`
        <div class="container">
          <div class="header \${data.type}">
            <h1>🔍 Visual Regression Test Report</h1>
            <p>
              \${getTotalTests()} total tests • \${getSuccessRate()}% success rate
              \${data.hasFailed ? \` • \${data.failedItems.length} failed\` : ''}
              \${data.hasNew ? \` • \${data.newItems.length} new\` : ''}
              \${data.hasDeleted ? \` • \${data.deletedItems.length} deleted\` : ''}
            </p>
          </div>
          
          \${createSection('Failed Tests', data.failedItems, createFailedItem)}
          \${createSection('Passed Tests', data.passedItems, createPassedItem)}
          \${createSection('New Images', data.newItems, createNewItem)}
          \${createSection('Deleted Images', data.deletedItems, createDeletedItem)}
          
          <div class="footer">
            <p>Generated by reg-cli with percentage differences • \${new Date().toLocaleString()}</p>
          </div>
        </div>
      \`;
      
      app.innerHTML = html;
    })();
  `;
};
var createJSONReport = params => {
  var report = {
    failedItems: params.failedItems,
    newItems: params.newItems,
    deletedItems: params.deletedItems,
    passedItems: params.passedItems,
    expectedItems: params.expectedItems,
    actualItems: params.actualItems,
    diffItems: params.diffItems,
    actualDir: `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.json), params.actualDir)}`,
    expectedDir: `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.json), params.expectedDir)}`,
    diffDir: `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.json), params.diffDir)}`
  };
  if (params.diffDetails) {
    report.diffDetails = params.diffDetails;
  }
  return report;
};
var createHTMLReport = params => {
  var file = _path.default.join(__dirname, '../template/template.html');
  var template = _fs.default.readFileSync(file);
  var addPercentageInfo = items => {
    if (!params.diffDetails) return items.map(item => ({
      raw: item,
      encoded: encodeFilePath(item)
    }));
    return items.map(item => {
      var encoded = encodeFilePath(item);
      var details = params.diffDetails[item];
      if (details) {
        return {
          raw: item,
          encoded: encoded,
          diffPercentage: details.diffPercentage,
          diffCount: details.diffCount,
          width: details.width,
          height: details.height
        };
      }
      return {
        raw: item,
        encoded: encoded
      };
    });
  };
  var json = {
    type: params.failedItems.length === 0 ? 'success' : 'danger',
    hasNew: params.newItems.length > 0,
    newItems: params.newItems.map(item => ({
      raw: item,
      encoded: encodeFilePath(item)
    })),
    hasDeleted: params.deletedItems.length > 0,
    deletedItems: params.deletedItems.map(item => ({
      raw: item,
      encoded: encodeFilePath(item)
    })),
    hasPassed: params.passedItems.length > 0,
    passedItems: addPercentageInfo(params.passedItems),
    hasFailed: params.failedItems.length > 0,
    failedItems: addPercentageInfo(params.failedItems),
    actualDir: params.fromJSON ? params.actualDir : `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.report), params.actualDir)}`,
    expectedDir: params.fromJSON ? params.expectedDir : `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.report), params.expectedDir)}`,
    diffDir: params.fromJSON ? params.diffDir : `${params.urlPrefix}${_path.default.relative(_path.default.dirname(params.report), params.diffDir)}`,
    diffDetails: params.diffDetails || {}
  };
  var faviconType = json.hasFailed || json.hasNew || json.hasDeleted ? 'failure' : 'success';
  var view = {
    js: createSimpleJS(),
    css: createSimpleCSS(),
    report: JSON.stringify(json),
    faviconData: loadFaviconAsDataURL(faviconType)
  };
  return _mustache.default.render(template.toString(), view);
};
var createJunitReport = params => {
  var builder = require('xmlbuilder');
  var testsuiteElement = builder.create('testsuites').att('name', 'reg').ele('testsuite').att('name', 'reg.test').att('tests', params.failedItems.length + params.passedItems.length + params.newItems.length + params.deletedItems.length).att('failures', params.failedItems.length + params.newItems.length + params.deletedItems.length);
  params.passedItems.forEach(item => addPassedJunitTestElement(testsuiteElement, item));
  params.failedItems.forEach(item => addFailedJunitTestElement(testsuiteElement, item, 'not matched'));
  params.newItems.forEach(item => addFailedJunitTestElement(testsuiteElement, item, 'new file'));
  params.deletedItems.forEach(item => addFailedJunitTestElement(testsuiteElement, item, 'deleted'));
  return testsuiteElement.end({
    pretty: true
  });
};
function addPassedJunitTestElement(testsuiteElement, item) {
  testsuiteElement.ele('testcase').att('name', item);
}
function addFailedJunitTestElement(testsuiteElement, item, reason) {
  testsuiteElement.ele('testcase').att('name', item).ele('failure').att('message', reason);
}
function createXimdiffWorker(params) {
  var file = _path.default.join(__dirname, '../template/worker_pre.js');
  var template = _fs.default.readFileSync(file);
  var view = {
    threshold: params.enableClientAdditionalDetection
  };
  return _mustache.default.render(template.toString(), view);
}
var _default = params => {
  if (!!params.report) {
    var html = createHTMLReport(params);
    _fs.default.writeFileSync(params.report, html);
  }
  if (!!params.json) {
    var json = createJSONReport(params);
    _fs.default.writeFileSync(params.json, JSON.stringify(json, null, 2));
  }
  if (params.enableClientAdditionalDetection) {
    var workerjs = createXimdiffWorker(params);
    _fs.default.writeFileSync(_path.default.join(_path.default.dirname(params.report), 'worker.js'), workerjs);
  }
};
exports.default = _default;
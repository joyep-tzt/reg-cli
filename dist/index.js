"use strict";

var _glob = _interopRequireDefault(require("glob"));
var _makeDir = _interopRequireDefault(require("make-dir"));
var _del = _interopRequireDefault(require("del"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _lodash = require("lodash");
var _log = _interopRequireDefault(require("./log"));
var _report = _interopRequireDefault(require("./report"));
var _bluebird = _interopRequireDefault(require("bluebird"));
var _events = _interopRequireDefault(require("events"));
var _processAdaptor = _interopRequireDefault(require("./process-adaptor"));
var _imageFinder = require("./image-finder");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// $FlowIgnore
// $FlowIgnore
// $FlowIgnore
// $FlowIgnore
var copyImages = (actualImages, {
  expectedDir,
  actualDir
}) => {
  return Promise.all(actualImages.map(image => new Promise((resolve, reject) => {
    try {
      _makeDir.default.sync(_path.default.dirname(_path.default.join(expectedDir, image)));
      var writeStream = _fs.default.createWriteStream(_path.default.join(expectedDir, image));
      _fs.default.createReadStream(_path.default.join(actualDir, image)).pipe(writeStream);
      writeStream.on('finish', err => {
        if (err) reject(err);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  })));
};
var compareImages = (emitter, {
  expectedImages,
  actualImages,
  dirs,
  matchingThreshold,
  thresholdPixel,
  thresholdRate,
  concurrency,
  enableAntialias
}) => {
  var images = actualImages.filter(actualImage => expectedImages.includes(actualImage));
  var debug = process.env.REG_DEBUG || false;
  if (debug) {
    console.log(`[INDEX] Starting comparison for ${images.length} images`);
    console.log(`[INDEX] Images to process:`, images);
  }
  concurrency = images.length < 20 ? 1 : concurrency || 4;
  if (debug) console.log(`[INDEX] Using concurrency level: ${concurrency}`);
  var processes = (0, _lodash.range)(concurrency).map(() => new _processAdaptor.default(emitter));
  return _bluebird.default.map(images, (image, index) => {
    if (debug) console.log(`[INDEX] Processing image ${index + 1}/${images.length}: ${image}`);
    var p = processes.find(p => !p.isRunning());
    if (p) {
      return p.run({
        ...dirs,
        image,
        matchingThreshold,
        thresholdRate,
        thresholdPixel,
        enableAntialias
      });
    } else {
      if (debug) console.warn(`[INDEX] No available process found for ${image}`);
    }
  }, {
    concurrency
  }).then(result => {
    if (debug) console.log(`[INDEX] Comparison completed for all ${images.length} images`);
    processes.forEach(p => p.close());
    return result;
  }).filter(r => !!r);
};
var cleanupExpectedDir = (expectedDir, changedFiles) => {
  var paths = changedFiles.map(image => {
    var directories = expectedDir.split("\\");
    return escapeGlob(_path.default.posix.join(...directories, image));
  });
  // force: true needed to allow deleting outside working directory
  return (0, _del.default)(paths, {
    force: true
  });
};
var escapeGlob = fileName => {
  return fileName.replace(/(\*)/g, '[$1]').replace(/(\*)/g, '[$1]').replace(/(\?)/g, '[$1]').replace(/(\[)/g, '[$1]').replace(/(\])/g, '[$1]').replace(/(\{)/g, '[$1]').replace(/(\})/g, '[$1]').replace(/(\))/g, '[$1]').replace(/(\()/g, '[$1]').replace(/(\!)/g, '[$1]');
};
var aggregate = (result, emitterResults) => {
  var passed = result.filter(r => r.passed).map(r => r.image);
  var failed = result.filter(r => !r.passed).map(r => r.image);
  var diffItems = failed.map(image => image.replace(/\.[^\.]+$/, '.png'));

  // Create diffDetails object from emitter results
  var diffDetails = {};
  emitterResults.forEach(emitterResult => {
    if (emitterResult.diffDetails) {
      diffDetails[emitterResult.path] = emitterResult.diffDetails;
    }
  });
  return {
    passed,
    failed,
    diffItems,
    diffDetails
  };
};
var updateExpected = ({
  actualDir,
  expectedDir,
  diffDir,
  deletedImages,
  newImages,
  diffItems
}) => {
  return cleanupExpectedDir(expectedDir, [...deletedImages, ...diffItems]).then(() => copyImages([...newImages, ...diffItems], {
    actualDir,
    expectedDir,
    diffDir
  })).then(() => {
    _log.default.success(`\nAll images are updated. `);
  });
};
module.exports = params => {
  var {
    actualDir,
    expectedDir,
    diffDir,
    json,
    concurrency = 4,
    update,
    report,
    junitReport,
    extendedErrors,
    urlPrefix,
    threshold,
    matchingThreshold = 0,
    thresholdRate,
    thresholdPixel,
    enableAntialias,
    enableClientAdditionalDetection
  } = params;
  var dirs = {
    actualDir,
    expectedDir,
    diffDir
  };
  var emitter = new _events.default();
  var emitterResults = []; // Collect emitter results to get diffDetails

  // Listen for compare events to collect diffDetails
  emitter.on('compare', result => {
    emitterResults.push(result);
  });
  var {
    expectedImages,
    actualImages,
    deletedImages,
    newImages
  } = (0, _imageFinder.findImages)(expectedDir, actualDir);
  var debug = process.env.REG_DEBUG || false;
  if (debug) {
    console.log(`[INDEX] Image discovery results:`);
    console.log(`[INDEX] - Expected images: ${expectedImages.length}`, expectedImages.slice(0, 5));
    console.log(`[INDEX] - Actual images: ${actualImages.length}`, actualImages.slice(0, 5));
    console.log(`[INDEX] - Deleted images: ${deletedImages.length}`, deletedImages.slice(0, 5));
    console.log(`[INDEX] - New images: ${newImages.length}`, newImages.slice(0, 5));
  }
  _makeDir.default.sync(expectedDir);
  _makeDir.default.sync(diffDir);
  setImmediate(() => emitter.emit('start'));
  if (debug) console.log(`[INDEX] Starting image comparison process...`);
  compareImages(emitter, {
    expectedImages,
    actualImages,
    dirs,
    matchingThreshold,
    thresholdRate: thresholdRate || threshold,
    thresholdPixel,
    concurrency,
    enableAntialias: !!enableAntialias
  }).then(result => {
    if (debug) console.log(`[INDEX] Image comparison completed, aggregating results...`);
    return aggregate(result, emitterResults);
  }).then(({
    passed,
    failed,
    diffItems,
    diffDetails
  }) => {
    if (debug) console.log(`[INDEX] Results - passed: ${passed.length}, failed: ${failed.length}, diffItems: ${diffItems.length}`);
    if (debug) console.log(`[INDEX] Creating reports...`);
    return (0, _report.default)({
      passedItems: passed,
      failedItems: failed,
      newItems: newImages,
      deletedItems: deletedImages,
      expectedItems: update ? actualImages : expectedImages,
      actualItems: actualImages,
      diffItems,
      diffDetails,
      // Pass diffDetails to the report
      json: json || './reg.json',
      actualDir,
      expectedDir,
      diffDir,
      report: report || '',
      junitReport: junitReport || '',
      extendedErrors: !!extendedErrors,
      urlPrefix: urlPrefix || '',
      enableClientAdditionalDetection: !!enableClientAdditionalDetection
    });
  }).then(result => {
    if (debug) console.log(`[INDEX] Reports created successfully`);
    deletedImages.forEach(image => emitter.emit('compare', {
      type: 'delete',
      path: image
    }));
    newImages.forEach(image => emitter.emit('compare', {
      type: 'new',
      path: image
    }));
    if (update) {
      return updateExpected({
        actualDir,
        expectedDir,
        diffDir,
        deletedImages,
        newImages,
        diffItems: result.diffItems
      }).then(() => {
        emitter.emit('update');
        return result;
      });
    }
    return result;
  }).then(result => emitter.emit('complete', result)).catch(err => {
    console.error(`[INDEX] Error in main process:`, err);
    emitter.emit('error', err);
  });
  return emitter;
};
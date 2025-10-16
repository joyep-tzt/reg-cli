"use strict";

var _imgDiffJs = require("img-diff-js");
var _md5File = _interopRequireDefault(require("md5-file"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// $FlowIgnore
// $FlowIgnore
var getMD5 = file => new Promise((resolve, reject) => {
  (0, _md5File.default)(file, (err, hash) => {
    if (err) reject(err);
    resolve(hash);
  });
});
var isPassed = ({
  width,
  height,
  diffCount,
  thresholdPixel,
  thresholdRate
}) => {
  if (typeof thresholdPixel === "number") {
    return diffCount <= thresholdPixel;
  } else if (typeof thresholdRate === "number") {
    var totalPixel = width * height;
    var ratio = diffCount / totalPixel;
    return ratio <= thresholdRate;
  }
  return diffCount === 0;
};
var createDiff = ({
  actualDir,
  expectedDir,
  diffDir,
  image,
  matchingThreshold,
  thresholdRate,
  thresholdPixel,
  enableAntialias
}) => {
  var debug = process.env.REG_DEBUG || false;
  if (debug) console.log(`[DIFF] Starting comparison for image: ${image}`);
  if (debug) console.log(`[DIFF] Directories - actual: ${actualDir}, expected: ${expectedDir}, diff: ${diffDir}`);
  return Promise.all([getMD5(_path.default.join(actualDir, image)), getMD5(_path.default.join(expectedDir, image))]).then(([actualHash, expectedHash]) => {
    if (debug) console.log(`[DIFF] MD5 hashes - actual: ${actualHash}, expected: ${expectedHash}`);
    if (actualHash === expectedHash) {
      if (debug) console.log(`[DIFF] Images are identical (MD5 match), skipping pixel comparison`);
      if (!process || !process.send) return;
      return process.send({
        passed: true,
        image
      });
    }
    var diffImage = image.replace(/\.[^\.]+$/, ".png");
    if (debug) console.log(`[DIFF] Images differ, starting pixel comparison. Output diff: ${diffImage}`);
    return (0, _imgDiffJs.imgDiff)({
      actualFilename: _path.default.join(actualDir, image),
      expectedFilename: _path.default.join(expectedDir, image),
      diffFilename: _path.default.join(diffDir, diffImage),
      options: {
        threshold: matchingThreshold,
        includeAA: !enableAntialias
      }
    }).then(({
      width,
      height,
      diffCount
    }) => {
      if (debug) console.log(`[DIFF] Pixel comparison completed - dimensions: ${width}x${height}, diffCount: ${diffCount}`);
      var passed = isPassed({
        width,
        height,
        diffCount,
        thresholdPixel,
        thresholdRate
      });
      var totalPixels = width * height;
      var diffPercentage = totalPixels > 0 ? diffCount / totalPixels * 100 : 0;
      if (debug) console.log(`[DIFF] Result - passed: ${passed}, diffPercentage: ${diffPercentage.toFixed(2)}%`);
      if (!process || !process.send) return;
      process.send({
        passed,
        image,
        diffDetails: {
          width,
          height,
          diffCount,
          diffPercentage
        }
      });
    }).catch(error => {
      console.error(`[DIFF] Error during pixel comparison for ${image}:`, error.message);

      // For corrupted or invalid files, treat as failed comparison
      if (!process || !process.send) return;
      process.send({
        passed: false,
        image,
        error: error.message,
        diffDetails: {
          width: 0,
          height: 0,
          diffCount: 0,
          diffPercentage: 0
        }
      });
    });
  }).catch(error => {
    console.error(`[DIFF] Error during MD5 comparison for ${image}:`, error.message);
    // For corrupted files, still send a result to prevent hanging
    if (!process || !process.send) return;
    process.send({
      passed: false,
      image,
      error: error.message,
      diffDetails: {
        width: 0,
        height: 0,
        diffCount: 0,
        diffPercentage: 0
      }
    });
  });
};
process.on('message', data => {
  createDiff(data);
});
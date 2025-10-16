"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findImages = void 0;
var _glob = _interopRequireDefault(require("glob"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// $FlowIgnore
var difference = (arrA, arrB) => arrA.filter(a => !arrB.includes(a));
var IMAGE_FILES = '/**/*.+(tiff|jpeg|jpg|gif|png|bmp)';
var findImages = (expectedDir, actualDir) => {
  var expectedImages = _glob.default.sync(`${expectedDir}${IMAGE_FILES}`).map(p => _path.default.relative(expectedDir, p)).map(p => p[0] === _path.default.sep ? p.slice(1) : p);
  var actualImages = _glob.default.sync(`${actualDir}${IMAGE_FILES}`).map(p => _path.default.relative(actualDir, p)).map(p => p[0] === _path.default.sep ? p.slice(1) : p);
  var deletedImages = difference(expectedImages, actualImages);
  var newImages = difference(actualImages, expectedImages);
  return {
    expectedImages,
    actualImages,
    deletedImages,
    newImages
  };
};
exports.findImages = findImages;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _child_process = require("child_process");
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// $FlowIgnore
class ProcessAdaptor {
  constructor(emitter) {
    this._process = (0, _child_process.fork)(_path.default.resolve(__dirname, './diff.js'));
    this._isRunning = false;
    this._emitter = emitter;

    // Set max listeners to prevent warning
    this._process.setMaxListeners(50);
  }
  isRunning() {
    return this._isRunning;
  }
  run(params) {
    var debug = process.env.REG_DEBUG || false;
    if (debug) console.log(`[PROCESS-ADAPTOR] Starting diff process for image: ${params.image}`);
    return new Promise((resolve, reject) => {
      this._isRunning = true;

      // Add timeout to detect hanging processes
      var timeout = setTimeout(() => {
        console.error(`[PROCESS-ADAPTOR] Timeout after 30s for image: ${params.image}`);
        this._isRunning = false;
        reject(new Error(`Diff process timeout for ${params.image}`));
      }, 30000);
      if (!this._process || !this._process.send) {
        clearTimeout(timeout);
        resolve();
      }
      this._process.send(params);
      this._process.once('message', result => {
        clearTimeout(timeout);
        if (debug) console.log(`[PROCESS-ADAPTOR] Received result for ${params.image}: passed=${result.passed}`);
        this._isRunning = false;
        this._emitter.emit('compare', {
          type: result.passed ? 'pass' : 'fail',
          path: result.image,
          diffDetails: result.diffDetails
        });
        resolve(result);
      });
      this._process.once('error', error => {
        clearTimeout(timeout);
        console.error(`[PROCESS-ADAPTOR] Process error for ${params.image}:`, error);
        this._isRunning = false;
        reject(error);
      });
    });
  }
  close() {
    if (!this._process || !this._process.kill) return;
    this._process.kill();
  }
}
exports.default = ProcessAdaptor;
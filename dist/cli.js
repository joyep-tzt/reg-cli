#!/usr/bin/env node
"use strict";

var _cliSpinner = require("cli-spinner");
var _meow = _interopRequireDefault(require("meow"));
var _path = _interopRequireDefault(require("path"));
var _ = _interopRequireDefault(require("./"));
var _log = _interopRequireDefault(require("./log"));
var _fs = _interopRequireDefault(require("fs"));
var _icon = require("./icon");
var _report = _interopRequireDefault(require("./report"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// import notifier from './notifier';
var spinner = new _cliSpinner.Spinner();
spinner.setSpinnerString(18);
var cli = (0, _meow.default)(`
  Usage
    $ reg-cli /path/to/actual-dir /path/to/expected-dir /path/to/diff-dir
  Options
    -U, --update Update expected images.(Copy \`actual images\` to \`expected images\`).
    -J, --json Specified json report path. If omitted ./reg.json.
    -I, --ignoreChange If true, error will not be thrown when image change detected.
    -E, --extendedErrors If true, also added/deleted images will throw an error. If omitted false.
    -R, --report Output html report to specified directory.
    --junit Output junit report to specified file.
    -P, --urlPrefix Add prefix to all image src.
    -M, --matchingThreshold Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive. 0 by default.
    -T, --thresholdRate Rate threshold for detecting change. When the difference ratio of the image is larger than the set rate detects the change.
    -S, --thresholdPixel Pixel threshold for detecting change. When the difference pixel of the image is larger than the set pixel detects the change. This value takes precedence over \`thresholdRate\`.
    -C, --concurrency How many processes launches in parallel. If omitted 4.
    -A, --enableAntialias. Enable antialias. If omitted false.
    -X, --additionalDetection. Enable additional difference detection(highly experimental). Select "none" or "client" (default: "none").
    -F, --from Generate report from json. Please specify json file. If set, only report will be output without comparing images.
    -D, --customDiffMessage Pass custom massage that will logged to the terminal when there is a diff.
  Examples
    $ reg-cli /path/to/actual-dir /path/to/expected-dir /path/to/diff-dir -U -D ./reg.json
`, {
  flags: {
    update: {
      type: 'boolean',
      alias: 'U'
    },
    json: {
      type: 'string',
      alias: 'J',
      default: './reg.json'
    },
    ignoreChange: {
      type: 'boolean',
      alias: 'I'
    },
    extendedErrors: {
      type: 'boolean',
      alias: 'E',
      default: false
    },
    report: {
      type: 'string',
      alias: 'R'
    },
    junit: {
      type: 'string'
    },
    urlPrefix: {
      type: 'string',
      alias: 'P'
    },
    matchingThreshold: {
      type: 'number',
      alias: 'M',
      default: 0
    },
    thresholdRate: {
      type: 'number',
      alias: 'T'
    },
    thresholdPixel: {
      type: 'number',
      alias: 'S'
    },
    concurrency: {
      type: 'number',
      alias: 'C',
      default: 4
    },
    enableAntialias: {
      type: 'boolean',
      alias: 'A',
      default: false
    },
    additionalDetection: {
      type: 'string',
      alias: 'X',
      default: 'none'
    },
    from: {
      type: 'string',
      alias: 'F'
    },
    customDiffMessage: {
      type: 'string',
      alias: 'D'
    }
  }
});
if (!cli.flags.from) {
  if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
    _log.default.fail('please specify actual, expected and diff images directory.');
    _log.default.fail('e.g.: $ reg-cli /path/to/actual-dir /path/to/expected-dir /path/to/diff-dir');
    process.exit(1);
  }
}
var json = cli.flags.json ? cli.flags.json.toString() : './reg.json'; // default output path

var urlPrefix = typeof cli.flags.urlPrefix === 'string' ? cli.flags.urlPrefix : './';
var report = typeof cli.flags.report === 'string' ? cli.flags.report : !!cli.flags.report ? './report.html' : '';
var junitReport = typeof cli.flags.junit === 'string' ? cli.flags.junit : !!cli.flags.junit ? './junit.xml' : '';
var actualDir = process.argv[2];
var expectedDir = process.argv[3];
var diffDir = process.argv[4];
var update = !!cli.flags.update;
var extendedErrors = !!cli.flags.extendedErrors;
var ignoreChange = !!cli.flags.ignoreChange;
var enableClientAdditionalDetection = cli.flags.additionalDetection === 'client';
var from = String(cli.flags.from || '');
var customDiffMessage = String(cli.flags.customDiffMessage || `\nInspect your code changes, re-run with \`-U\` to update them. `);

// If from option specified, generate report from json and exit.
if (from) {
  var _json = '';
  try {
    _json = _fs.default.readFileSync(from, {
      encoding: 'utf8'
    });
  } catch (e) {
    _log.default.fail('Failed to read specify json.');
    _log.default.fail(e);
    process.exit(1);
  }
  try {
    var params = JSON.parse(_json);
    (0, _report.default)({
      ...params,
      json: _json || './reg.json',
      report: report || './report.html',
      junitReport: junitReport || '',
      extendedErrors,
      urlPrefix: urlPrefix || '',
      enableClientAdditionalDetection,
      fromJSON: true
    });
    process.exit(0);
  } catch (e) {
    _log.default.fail('Failed to parse json. Please specify valid json.');
    _log.default.fail(e);
    process.exit(1);
  }
}
var observer = (0, _.default)({
  actualDir,
  expectedDir,
  diffDir,
  update,
  report,
  junitReport,
  extendedErrors,
  json,
  urlPrefix,
  matchingThreshold: Number(cli.flags.matchingThreshold || 0),
  thresholdRate: Number(cli.flags.thresholdRate),
  thresholdPixel: Number(cli.flags.thresholdPixel),
  concurrency: Number(cli.flags.concurrency || 4),
  enableAntialias: !!cli.flags.enableAntialias,
  enableClientAdditionalDetection
});
observer.once('start', () => spinner.start());
observer.on('compare', params => {
  spinner.stop(true);
  var file = _path.default.join(`${actualDir}`, `${params.path}`);
  switch (params.type) {
    case 'delete':
      return _log.default.warn(`${_icon.MINUS} delete  ${file}`);
    case 'new':
      return _log.default.info(`${_icon.GREEK_CROSS} append  ${file}`);
    case 'pass':
      return _log.default.success(`${_icon.CHECK_MARK} pass    ${file}`);
    case 'fail':
      return _log.default.fail(`${_icon.BALLOT_X} change  ${file}`);
  }
  spinner.start();
});
observer.once('update', () => _log.default.success(`✨ your expected images are updated ✨`));
observer.once('complete', ({
  failedItems,
  deletedItems,
  newItems,
  passedItems
}) => {
  spinner.stop(true);
  _log.default.info('\n');
  if (failedItems.length) _log.default.fail(`${_icon.BALLOT_X} ${failedItems.length} file(s) changed.`);
  if (deletedItems.length) _log.default.warn(`${_icon.MINUS} ${deletedItems.length} file(s) deleted.`);
  if (newItems.length) _log.default.info(`${_icon.GREEK_CROSS} ${newItems.length} file(s) appended.`);
  if (passedItems.length) _log.default.success(`${_icon.CHECK_MARK} ${passedItems.length} file(s) passed.`);
  if (!update && (failedItems.length > 0 || extendedErrors && (newItems.length > 0 || deletedItems.length > 0))) {
    _log.default.fail(customDiffMessage);
    if (!ignoreChange) process.exit(1);
  }
  return process.exit(0);
});
observer.once('error', error => {
  _log.default.fail(error);
  process.exit(1);
});
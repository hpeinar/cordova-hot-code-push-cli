"use strict";

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.split.js");

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _ = _interopRequireWildcard(require("lodash"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const IGNORED_FILES_CONFIG_PATH = _path.default.join(process.cwd(), '.chcpignore');

const DEFAULT_WWW_FOLDER = _path.default.join(process.cwd(), 'www');

const DEFAULT_CLI_CONFIG = _path.default.join(process.cwd(), 'cordova-hcp.json');

const DEFAULT_IGNORE_LIST = ['.DS_Store', 'node_modules/**', 'node_modules\\**', '**/chcp.json', '**/chcp.manifest', '.chcp*', '.gitignore', '.gitkeep', '.git', 'package.json'];

exports.context = function chcpContext(argv) {
  return new Context(argv);
};

const Context = function Context(argv) {
  this.argv = argv ? argv : {};
  this.defaultConfig = DEFAULT_CLI_CONFIG;
  this.sourceDirectory = getSourceDirectory(argv);
  this.manifestFilePath = _path.default.join(this.sourceDirectory, 'chcp.manifest');
  this.projectsConfigFilePath = _path.default.join(this.sourceDirectory, 'chcp.json');
  this.ignoredFiles = getIgnoredFiles();
};

function getSourceDirectory(argv) {
  var consoleArgs = argv._;

  if (!consoleArgs || consoleArgs.length !== 2) {
    return DEFAULT_WWW_FOLDER;
  }

  return _path.default.join(process.cwd(), consoleArgs[1]);
}

function getIgnoredFiles() {
  var projectIgnore = readIgnoredFilesProjectConfig(IGNORED_FILES_CONFIG_PATH);

  var ignoredList = _.union(DEFAULT_IGNORE_LIST, projectIgnore); // remove comments and empty items


  _.remove(ignoredList, function (item) {
    return item.indexOf('#') === 0 || _.trim(item).length === 0;
  });

  return ignoredList;
}

function readIgnoredFilesProjectConfig(pathToConfig) {
  var fileContent;

  try {
    fileContent = _fsExtra.default.readFileSync(pathToConfig, 'utf8');
  } catch (e) {
    return [];
  }

  return _.trim(fileContent).split(/\n/);
}
//# sourceMappingURL=context.js.map
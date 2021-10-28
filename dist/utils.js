"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInput = getInput;
exports.writeFile = writeFile;

require("core-js/modules/es.promise.js");

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getInput(prompt, props) {
  return new Promise(resolve => prompt.get(props, (err, result) => resolve(result, err)));
}

function writeFile(file, content) {
  return new Promise((resolve, reject) => {
    var data = JSON.stringify(content, null, 2);

    _fs.default.writeFile(file, data, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
//# sourceMappingURL=utils.js.map
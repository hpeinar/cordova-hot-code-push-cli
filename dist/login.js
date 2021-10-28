"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;

var _path = _interopRequireDefault(require("path"));

var _prompt = _interopRequireDefault(require("prompt"));

var _fs = _interopRequireDefault(require("fs"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const configFile = _path.default.join(process.cwd(), 'cordova-hcp.json');

const loginFile = _path.default.join(process.cwd(), '.chcplogin');

const schema = {
  properties: {
    key: {
      description: 'Amazon Access Key Id',
      message: 'You need to provide the Amazon Access Key Id',
      required: true
    },
    secret: {
      description: 'Amazon Secret Access Key',
      message: 'You need to provide the Secret Access Key',
      required: true
    }
  }
};

function execute(context) {
  validateConfig();
  _prompt.default.override = context.argv;
  _prompt.default.message = 'Please provide';
  _prompt.default.delimiter = ': ';

  _prompt.default.start();

  (0, _utils.getInput)(_prompt.default, schema).then(content => (0, _utils.writeFile)(loginFile, content)).then(done);
}

function validateConfig() {
  let config;

  try {
    config = _fs.default.readFileSync(configFile, 'utf8');
  } catch (e) {
    console.log('Cannot parse cordova-hcp.json. Did you run cordova-hcp init?');
    process.exit(0);
  }

  if (!config) {
    console.log('You need to run "cordova-hcp init" before you can run "cordova-hcp login".');
    console.log('Both commands needs to be invoked in the root of the project directory.');
    process.exit(0); // eslint-disable-line no-process-exit
  }
}

function done(err) {
  if (err) {
    return console.log(err);
  }

  console.log('Project initialized and .chcindex.plogin file created.');
  console.log('You SHOULD add .chcplogin to your .gitignore');
  console.log('( echo \'.chcplogin\' >> .gitignore )');
}
//# sourceMappingURL=login.js.map
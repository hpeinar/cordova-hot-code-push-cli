"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;

var _path = _interopRequireDefault(require("path"));

var _prompt = _interopRequireDefault(require("prompt"));

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const configFile = _path.default.join(process.cwd(), 'cordova-hcp.json');

const name = {
  description: 'Enter project name (required)',
  pattern: /^[a-zA-Z\-\s0-9]+$/,
  message: 'Name must be only letters, numbers, space or dashes',
  required: true
};
const s3bucket = {
  description: 'Amazon S3 Bucket name (required for cordova-hcp deploy)',
  pattern: /^[a-zA-Z\-0-9\.]+$/,
  message: 'Name must be only letters, numbers, or dashes'
};
const s3prefix = {
  description: 'Path in S3 bucket (optional for cordova-hcp deploy)',
  pattern: /^[a-zA-Z\-\s0-9\.\/]+\/$/,
  default: 'release',
  message: 'Path must be only letters, numbers, spaces, forward slashes or dashes and must end with a forward slash'
};
const s3archivePrefix = {
  description: 'Where should old releases be archived to?',
  pattern: /^[a-zA-Z\-\s0-9\.\/]+\/$/,
  default: 'archive',
  message: 'Path must be only letters, numbers, spaces, forward slashes or dashes and must end with a forward slash'
};
const s3region = {
  description: 'Amazon S3 region (required for cordova-hcp deploy)',
  pattern: /^(us-east-1|us-west-2|us-west-1|eu-west-1|eu-central-1|ap-southeast-1|ap-southeast-2|ap-northeast-1|sa-east-1)$/,
  default: 'us-east-1',
  message: 'Must be one of: us-east-1, us-west-2, us-west-1, eu-west-1, eu-central-1, ap-southeast-1, ap-southeast-2, ap-northeast-1, sa-east-1'
};
const iosIdentifier = {
  description: 'IOS app identifier',
  pattern: /^[a-zA-Z\-0-9\.]+$/
};
const androidIdentifier = {
  description: 'Android app identifier',
  pattern: /^[a-zA-Z\-0-9\.]+$/
};
const update = {
  description: 'Update method (required)',
  pattern: /(start|resume|now)/,
  required: true,
  message: 'Needs to be one of start, resume or now',
  default: 'resume'
};
const schema = {
  properties: {
    name,
    s3bucket,
    s3prefix,
    s3archivePrefix,
    s3region,
    ios_identifier: iosIdentifier,
    android_identifier: androidIdentifier,
    update
  }
};
const urlSchema = {
  properties: {
    content_url: {
      description: 'Enter full URL to directory where cordova-hcp build result will be uploaded',
      message: 'Must supply URL',
      required: true
    }
  }
};

function execute(context) {
  _prompt.default.override = context.argv;
  _prompt.default.message = 'Please provide';
  _prompt.default.delimiter = ': ';

  _prompt.default.start();

  let result;
  (0, _utils.getInput)(_prompt.default, schema).then(validateBucket).then(res => result = res).then(getUrl).then(url => _lodash.default.assign(result, url)).then(content => (0, _utils.writeFile)(configFile, content)).then(done);
}

function validateBucket(result) {
  if (!result.s3bucket) {
    return _lodash.default.omit(result, ['s3region', 's3bucket', 's3prefix']);
  }

  return result;
}

function getUrl(_ref) {
  let {
    s3region: region,
    s3bucket: bucket,
    s3prefix: path
  } = _ref;

  if (!bucket) {
    return (0, _utils.getInput)(_prompt.default, urlSchema);
  }

  return {
    content_url: getContentUrl(region, bucket, path)
  };
}

function getContentUrl(region, bucket, path) {
  let url = region === 'us-east-1' ? 's3.amazonaws.com' : "s3-".concat(region, ".amazonaws.com");
  url = "https://".concat(url, "/").concat(bucket);

  if (path) {
    url += "/".concat(path);
  }

  return url;
}

function done(err) {
  if (err) {
    return console.log(err);
  }

  console.log('Project initialized and cordova-hcp.json file created.');
  console.log('If you wish to exclude files from being published, specify them in .chcpignore');
  console.log('Before you can push updates dont forget to configure AWS credentials in env or AWS credentials file');
}
//# sourceMappingURL=init.js.map
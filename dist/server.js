"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;

require("core-js/modules/es.promise.js");

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _fs = _interopRequireDefault(require("fs"));

var _compression = _interopRequireDefault(require("compression"));

var _watch = _interopRequireDefault(require("watch"));

var _express = _interopRequireDefault(require("express"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _hidefile = _interopRequireDefault(require("hidefile"));

var _http = require("http");

var _socket = require("socket.io");

var _ngrok = _interopRequireDefault(require("ngrok"));

var _build = require("./build.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log('Build', _build.execute);

const envFile = _path.default.join(process.cwd(), '.chcpenv');

const buildDirectory = _path.default.join(process.cwd(), '.chcpbuild');

const app = (0, _express.default)();
const assetPort = process.env.PORT || 80;
const disablePublicTunnel = process.env.DISABLE_PUBLIC_TUNNEL || false;
let io = null;
let chcpContext = null;
let sourceDirectory = './www';
let ignoredFiles = null;
let opts = {
  content_url: null
};
let debugOpts = {};

function updateLocalEnv(localEnv) {
  localEnv.config_url = localEnv.content_url + '/chcp.json';
  var json = JSON.stringify(localEnv, null, 2);

  _fs.default.writeFileSync(envFile, json);

  return localEnv;
}

async function execute(context) {
  chcpContext = context;
  ignoredFiles = context.ignoredFiles;
  chcpContext.argv.localdev = true;
  sourceDirectory = chcpContext.sourceDirectory;
  if (disablePublicTunnel) return;

  try {
    let url = await publicTunnel(assetPort);
    console.log('Server running at ', url);
    opts.content_url = url;
  } catch (err) {
    console.log(err);
  }

  let localUrl = null;

  try {
    localUrl = await assetServer(debugOpts);
    console.log('Local URL', localUrl);
  } catch (err) {
    console.log(err);
  }

  opts.local_url = localUrl;
  let config = {};

  try {
    config = await (0, _build.execute)(chcpContext);
  } catch (err) {
    throw err;
  }

  if (disablePublicTunnel) {
    updateLocalEnv({
      content_url: config.content_url
    });
  }

  console.log('cordova-hcp local server available at: ' + opts.local_url);
  console.log('cordova-hcp public server available at: ' + config.content_url);
}

function fileChangeFilter(file) {
  // Ignore changes in files from the ignore list
  var fileIsAllowed = true;

  var relativeFilePath = _path.default.relative(sourceDirectory, file);

  for (var i = 0, len = ignoredFiles.length; i < len; i++) {
    if (_hidefile.default.isHiddenSync(file) || (0, _minimatch.default)(relativeFilePath, ignoredFiles[i])) {
      fileIsAllowed = false;
      break;
    }
  }

  return fileIsAllowed;
}

function assetServer(opts) {
  let localUrl = 'http://localhost:' + assetPort; // If a lot of files changes at the same time, we only want to trigger the change event once.

  handleFileChange = _lodash.default.debounce(handleFileChange, 500);

  try {
    killCaches(app);
    serveStaticAssets(app, opts);
    serveSocketIO(app);
    watchForFileChange();
    return localUrl;
  } catch (err) {
    console.error('assetServer error: ', err);
    throw err;
  }
}

function watchForFileChange() {
  // Monitor for file changes
  console.log('Checking: ', sourceDirectory);

  _watch.default.watchTree(sourceDirectory, {
    filter: fileChangeFilter
  }, function (f, curr, prev) {
    if (typeof f == 'object' && prev === null && curr === null) {// Finished walking the tree
      // console.log('Finished');
    } else {
      handleFileChange(f);
    }
  });
}

function handleFileChange(file) {
  console.log('File changed: ', file);
  (0, _build.execute)(chcpContext).then(function (config) {
    console.log('Should trigger reload for build: ' + config.release);
    io.emit('release', {
      config: config
    });
  });
}

function serveSocketIO(app) {
  // Let's start the server
  const httpServer = (0, _http.createServer)();
  io = require('socket.io')(app.listen(assetPort, () => {
    console.log("Example app listening at http://localhost:".concat(assetPort));
  })); // Open up socket for file change notifications
  //io.set('transports', ['polling']);

  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
  });
}

function serveStaticAssets(app, opts) {
  // Static assets
  app.use((0, _compression.default)());
  app.enable('view cache');
  app.use('/', _express.default.static(sourceDirectory, {
    maxAge: 0
  }));
  console.log('Serving static', sourceDirectory);
}

function killCaches(ass) {
  // Disable caches
  app.disable('etag');
  app.use(function (req, res, next) {
    req.headers['if-none-match'] = 'no-match-for-this';
    next();
  });
}

async function publicTunnel(port, options) {
  console.log('Tunnelling via port ' + port);

  try {
    const url = await _ngrok.default.connect();
    updateLocalEnv({
      content_url: url
    });
    return url;
  } catch (err) {
    console.log('Could not create ngrok tunnel: ', err);
    throw err;
  }
}
//# sourceMappingURL=server.js.map
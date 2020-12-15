'use strict';

var path$2 = require('path');
var fs$2 = require('fs');
var vm$2 = require('vm');
var Module = require('module');
var babel = require('@babel/core');
var constants$2 = require('constants');
var require$$0 = require('stream');
var util$2 = require('util');
var assert$2 = require('assert');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path$2);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$2);
var vm__default = /*#__PURE__*/_interopDefaultLegacy(vm$2);
var Module__default = /*#__PURE__*/_interopDefaultLegacy(Module);
var babel__default = /*#__PURE__*/_interopDefaultLegacy(babel);
var constants__default = /*#__PURE__*/_interopDefaultLegacy(constants$2);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util$2);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert$2);

var caller = function caller() {
  // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  var origPrepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };

  var stack = new Error().stack;
  Error.prepareStackTrace = origPrepareStackTrace;
  return stack[2].getFileName();
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var _typeof_1 = createCommonjsModule(function (module) {
  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      module.exports = _typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      module.exports = _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  module.exports = _typeof;
});

var pathParse = createCommonjsModule(function (module) {

  var isWindows = process.platform === 'win32'; // Regex to split a windows path into three parts: [*, device, slash,
  // tail] windows-only

  var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/; // Regex to split the tail part of the above into [*, dir, basename, ext]

  var splitTailRe = /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;
  var win32 = {}; // Function to split a filename into [root, dir, basename, ext]

  function win32SplitPath(filename) {
    // Separate device+slash from tail
    var result = splitDeviceRe.exec(filename),
        device = (result[1] || '') + (result[2] || ''),
        tail = result[3] || ''; // Split the tail into dir, basename and extension

    var result2 = splitTailRe.exec(tail),
        dir = result2[1],
        basename = result2[2],
        ext = result2[3];
    return [device, dir, basename, ext];
  }

  win32.parse = function (pathString) {
    if (typeof pathString !== 'string') {
      throw new TypeError("Parameter 'pathString' must be a string, not " + _typeof_1(pathString));
    }

    var allParts = win32SplitPath(pathString);

    if (!allParts || allParts.length !== 4) {
      throw new TypeError("Invalid path '" + pathString + "'");
    }

    return {
      root: allParts[0],
      dir: allParts[0] + allParts[1].slice(0, -1),
      base: allParts[2],
      ext: allParts[3],
      name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
    };
  }; // Split a filename into [root, dir, basename, ext], unix version
  // 'root' is just a slash, or nothing.


  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var posix = {};

  function posixSplitPath(filename) {
    return splitPathRe.exec(filename).slice(1);
  }

  posix.parse = function (pathString) {
    if (typeof pathString !== 'string') {
      throw new TypeError("Parameter 'pathString' must be a string, not " + _typeof_1(pathString));
    }

    var allParts = posixSplitPath(pathString);

    if (!allParts || allParts.length !== 4) {
      throw new TypeError("Invalid path '" + pathString + "'");
    }

    allParts[1] = allParts[1] || '';
    allParts[2] = allParts[2] || '';
    allParts[3] = allParts[3] || '';
    return {
      root: allParts[0],
      dir: allParts[0] + allParts[1].slice(0, -1),
      base: allParts[2],
      ext: allParts[3],
      name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
    };
  };

  if (isWindows) module.exports = win32.parse;else
    /* posix */
    module.exports = posix.parse;
  module.exports.posix = posix.parse;
  module.exports.win32 = win32.parse;
});

var parse = path__default['default'].parse || pathParse;

var getNodeModulesDirs = function getNodeModulesDirs(absoluteStart, modules) {
  var prefix = '/';

  if (/^([A-Za-z]:)/.test(absoluteStart)) {
    prefix = '';
  } else if (/^\\\\/.test(absoluteStart)) {
    prefix = '\\\\';
  }

  var paths = [absoluteStart];
  var parsed = parse(absoluteStart);

  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = parse(parsed.dir);
  }

  return paths.reduce(function (dirs, aPath) {
    return dirs.concat(modules.map(function (moduleDir) {
      return path__default['default'].resolve(prefix, aPath, moduleDir);
    }));
  }, []);
};

var nodeModulesPaths = function nodeModulesPaths(start, opts, request) {
  var modules = opts && opts.moduleDirectory ? [].concat(opts.moduleDirectory) : ['node_modules'];

  if (opts && typeof opts.paths === 'function') {
    return opts.paths(request, start, function () {
      return getNodeModulesDirs(start, modules);
    }, opts);
  }

  var dirs = getNodeModulesDirs(start, modules);
  return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
};

var normalizeOptions = function normalizeOptions(x, opts) {
  /**
   * This file is purposefully a passthrough. It's expected that third-party
   * environments will override it at runtime in order to inject special logic
   * into `resolve` (by manipulating the options). One such example is the PnP
   * code path in Yarn.
   */
  return opts || {};
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

var implementation = function bind(that) {
  var target = this;

  if (typeof target !== 'function' || toStr.call(target) !== funcType) {
    throw new TypeError(ERROR_MESSAGE + target);
  }

  var args = slice.call(arguments, 1);
  var bound;

  var binder = function binder() {
    if (this instanceof bound) {
      var result = target.apply(this, args.concat(slice.call(arguments)));

      if (Object(result) === result) {
        return result;
      }

      return this;
    } else {
      return target.apply(that, args.concat(slice.call(arguments)));
    }
  };

  var boundLength = Math.max(0, target.length - args.length);
  var boundArgs = [];

  for (var i = 0; i < boundLength; i++) {
    boundArgs.push('$' + i);
  }

  bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

  if (target.prototype) {
    var Empty = function Empty() {};

    Empty.prototype = target.prototype;
    bound.prototype = new Empty();
    Empty.prototype = null;
  }

  return bound;
};

var functionBind = Function.prototype.bind || implementation;

var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

var assert = true;
var async_hooks = ">= 8";
var buffer_ieee754 = "< 0.9.7";
var buffer = true;
var child_process = true;
var cluster = true;
var console$1 = true;
var constants = true;
var crypto = true;
var _debug_agent = ">= 1 && < 8";
var _debugger = "< 8";
var dgram = true;
var diagnostics_channel = ">= 15.1";
var dns = true;
var domain = ">= 0.7.12";
var events = true;
var freelist = "< 6";
var fs = true;
var _http_agent = ">= 0.11.1";
var _http_client = ">= 0.11.1";
var _http_common = ">= 0.11.1";
var _http_incoming = ">= 0.11.1";
var _http_outgoing = ">= 0.11.1";
var _http_server = ">= 0.11.1";
var http = true;
var http2 = ">= 8.8";
var https = true;
var inspector = ">= 8.0.0";
var _linklist = "< 8";
var module$1 = true;
var net = true;
var os = true;
var path = true;
var perf_hooks = ">= 8.5";
var process$1 = ">= 1";
var punycode = true;
var querystring = true;
var readline = true;
var repl = true;
var smalloc = ">= 0.11.5 && < 3";
var _stream_duplex = ">= 0.9.4";
var _stream_transform = ">= 0.9.4";
var _stream_wrap = ">= 1.4.1";
var _stream_passthrough = ">= 0.9.4";
var _stream_readable = ">= 0.9.4";
var _stream_writable = ">= 0.9.4";
var stream = true;
var string_decoder = true;
var sys = [
	">= 0.6 && < 0.7",
	">= 0.8"
];
var timers = true;
var _tls_common = ">= 0.11.13";
var _tls_legacy = ">= 0.11.3 && < 10";
var _tls_wrap = ">= 0.11.3";
var tls = true;
var trace_events = ">= 10";
var tty = true;
var url = true;
var util = true;
var v8 = ">= 1";
var vm = true;
var wasi = ">= 13.4 && < 13.5";
var worker_threads = ">= 11.7";
var zlib = true;
var data = {
	assert: assert,
	"assert/strict": ">= 15",
	async_hooks: async_hooks,
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	child_process: child_process,
	cluster: cluster,
	console: console$1,
	constants: constants,
	crypto: crypto,
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	diagnostics_channel: diagnostics_channel,
	dns: dns,
	"dns/promises": ">= 15",
	domain: domain,
	events: events,
	freelist: freelist,
	fs: fs,
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	_http_agent: _http_agent,
	_http_client: _http_client,
	_http_common: _http_common,
	_http_incoming: _http_incoming,
	_http_outgoing: _http_outgoing,
	_http_server: _http_server,
	http: http,
	http2: http2,
	https: https,
	inspector: inspector,
	_linklist: _linklist,
	module: module$1,
	net: net,
	"node-inspect/lib/_inspect": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6.0 && < 12",
	os: os,
	path: path,
	"path/posix": ">= 15.3",
	"path/win32": ">= 15.3",
	perf_hooks: perf_hooks,
	process: process$1,
	punycode: punycode,
	querystring: querystring,
	readline: readline,
	repl: repl,
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	_stream_transform: _stream_transform,
	_stream_wrap: _stream_wrap,
	_stream_passthrough: _stream_passthrough,
	_stream_readable: _stream_readable,
	_stream_writable: _stream_writable,
	stream: stream,
	"stream/promises": ">= 15",
	string_decoder: string_decoder,
	sys: sys,
	timers: timers,
	"timers/promises": ">= 15",
	_tls_common: _tls_common,
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	tls: tls,
	trace_events: trace_events,
	tty: tty,
	url: url,
	util: util,
	"util/types": ">= 15.3",
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	v8: v8,
	vm: vm,
	wasi: wasi,
	worker_threads: worker_threads,
	zlib: zlib
};

function specifierIncluded(current, specifier) {
  var nodeParts = current.split('.');
  var parts = specifier.split(' ');
  var op = parts.length > 1 ? parts[0] : '=';
  var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

  for (var i = 0; i < 3; ++i) {
    var cur = parseInt(nodeParts[i] || 0, 10);
    var ver = parseInt(versionParts[i] || 0, 10);

    if (cur === ver) {
      continue; // eslint-disable-line no-restricted-syntax, no-continue
    }

    if (op === '<') {
      return cur < ver;
    }

    if (op === '>=') {
      return cur >= ver;
    }

    return false;
  }

  return op === '>=';
}

function matchesRange(current, range) {
  var specifiers = range.split(/ ?&& ?/);

  if (specifiers.length === 0) {
    return false;
  }

  for (var i = 0; i < specifiers.length; ++i) {
    if (!specifierIncluded(current, specifiers[i])) {
      return false;
    }
  }

  return true;
}

function versionIncluded(nodeVersion, specifierValue) {
  if (typeof specifierValue === 'boolean') {
    return specifierValue;
  }

  var current = typeof nodeVersion === 'undefined' ? process.versions && process.versions.node && process.versions.node : nodeVersion;

  if (typeof current !== 'string') {
    throw new TypeError(typeof nodeVersion === 'undefined' ? 'Unable to determine current node version' : 'If provided, a valid node version is required');
  }

  if (specifierValue && _typeof_1(specifierValue) === 'object') {
    for (var i = 0; i < specifierValue.length; ++i) {
      if (matchesRange(current, specifierValue[i])) {
        return true;
      }
    }

    return false;
  }

  return matchesRange(current, specifierValue);
}

var isCoreModule = function isCore(x, nodeVersion) {
  return src(data, x) && versionIncluded(nodeVersion, data[x]);
};

var realpathFS = fs__default['default'].realpath && typeof fs__default['default'].realpath["native"] === 'function' ? fs__default['default'].realpath["native"] : fs__default['default'].realpath;

var defaultIsFile = function isFile(file, cb) {
  fs__default['default'].stat(file, function (err, stat) {
    if (!err) {
      return cb(null, stat.isFile() || stat.isFIFO());
    }

    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
    return cb(err);
  });
};

var defaultIsDir = function isDirectory(dir, cb) {
  fs__default['default'].stat(dir, function (err, stat) {
    if (!err) {
      return cb(null, stat.isDirectory());
    }

    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
    return cb(err);
  });
};

var defaultRealpath = function realpath(x, cb) {
  realpathFS(x, function (realpathErr, realPath) {
    if (realpathErr && realpathErr.code !== 'ENOENT') cb(realpathErr);else cb(null, realpathErr ? x : realPath);
  });
};

var maybeRealpath = function maybeRealpath(realpath, x, opts, cb) {
  if (opts && opts.preserveSymlinks === false) {
    realpath(x, cb);
  } else {
    cb(null, x);
  }
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
  var dirs = nodeModulesPaths(start, opts, x);

  for (var i = 0; i < dirs.length; i++) {
    dirs[i] = path__default['default'].join(dirs[i], x);
  }

  return dirs;
};

var async = function resolve(x, options, callback) {
  var cb = callback;
  var opts = options;

  if (typeof options === 'function') {
    cb = opts;
    opts = {};
  }

  if (typeof x !== 'string') {
    var err = new TypeError('Path must be a string.');
    return process.nextTick(function () {
      cb(err);
    });
  }

  opts = normalizeOptions(x, opts);
  var isFile = opts.isFile || defaultIsFile;
  var isDirectory = opts.isDirectory || defaultIsDir;
  var readFile = opts.readFile || fs__default['default'].readFile;
  var realpath = opts.realpath || defaultRealpath;
  var packageIterator = opts.packageIterator;
  var extensions = opts.extensions || ['.js'];
  var includeCoreModules = opts.includeCoreModules !== false;
  var basedir = opts.basedir || path__default['default'].dirname(caller());
  var parent = opts.filename || basedir;
  opts.paths = opts.paths || []; // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory

  var absoluteStart = path__default['default'].resolve(basedir);
  maybeRealpath(realpath, absoluteStart, opts, function (err, realStart) {
    if (err) cb(err);else init(realStart);
  });
  var res;

  function init(basedir) {
    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
      res = path__default['default'].resolve(basedir, x);
      if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';

      if (/\/$/.test(x) && res === basedir) {
        loadAsDirectory(res, opts["package"], onfile);
      } else loadAsFile(res, opts["package"], onfile);
    } else if (includeCoreModules && isCoreModule(x)) {
      return cb(null, x);
    } else loadNodeModules(x, basedir, function (err, n, pkg) {
      if (err) cb(err);else if (n) {
        return maybeRealpath(realpath, n, opts, function (err, realN) {
          if (err) {
            cb(err);
          } else {
            cb(null, realN, pkg);
          }
        });
      } else {
        var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
        moduleError.code = 'MODULE_NOT_FOUND';
        cb(moduleError);
      }
    });
  }

  function onfile(err, m, pkg) {
    if (err) cb(err);else if (m) cb(null, m, pkg);else loadAsDirectory(res, function (err, d, pkg) {
      if (err) cb(err);else if (d) {
        maybeRealpath(realpath, d, opts, function (err, realD) {
          if (err) {
            cb(err);
          } else {
            cb(null, realD, pkg);
          }
        });
      } else {
        var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
        moduleError.code = 'MODULE_NOT_FOUND';
        cb(moduleError);
      }
    });
  }

  function loadAsFile(x, thePackage, callback) {
    var loadAsFilePackage = thePackage;
    var cb = callback;

    if (typeof loadAsFilePackage === 'function') {
      cb = loadAsFilePackage;
      loadAsFilePackage = undefined;
    }

    var exts = [''].concat(extensions);
    load(exts, x, loadAsFilePackage);

    function load(exts, x, loadPackage) {
      if (exts.length === 0) return cb(null, undefined, loadPackage);
      var file = x + exts[0];
      var pkg = loadPackage;
      if (pkg) onpkg(null, pkg);else loadpkg(path__default['default'].dirname(file), onpkg);

      function onpkg(err, pkg_, dir) {
        pkg = pkg_;
        if (err) return cb(err);

        if (dir && pkg && opts.pathFilter) {
          var rfile = path__default['default'].relative(dir, file);
          var rel = rfile.slice(0, rfile.length - exts[0].length);
          var r = opts.pathFilter(pkg, x, rel);
          if (r) return load([''].concat(extensions.slice()), path__default['default'].resolve(dir, r), pkg);
        }

        isFile(file, onex);
      }

      function onex(err, ex) {
        if (err) return cb(err);
        if (ex) return cb(null, file, pkg);
        load(exts.slice(1), x, pkg);
      }
    }
  }

  function loadpkg(dir, cb) {
    if (dir === '' || dir === '/') return cb(null);

    if (process.platform === 'win32' && /^\w:[/\\]*$/.test(dir)) {
      return cb(null);
    }

    if (/[/\\]node_modules[/\\]*$/.test(dir)) return cb(null);
    maybeRealpath(realpath, dir, opts, function (unwrapErr, pkgdir) {
      if (unwrapErr) return loadpkg(path__default['default'].dirname(dir), cb);
      var pkgfile = path__default['default'].join(pkgdir, 'package.json');
      isFile(pkgfile, function (err, ex) {
        // on err, ex is false
        if (!ex) return loadpkg(path__default['default'].dirname(dir), cb);
        readFile(pkgfile, function (err, body) {
          if (err) cb(err);

          try {
            var pkg = JSON.parse(body);
          } catch (jsonErr) {}

          if (pkg && opts.packageFilter) {
            pkg = opts.packageFilter(pkg, pkgfile);
          }

          cb(null, pkg, dir);
        });
      });
    });
  }

  function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
    var cb = callback;
    var fpkg = loadAsDirectoryPackage;

    if (typeof fpkg === 'function') {
      cb = fpkg;
      fpkg = opts["package"];
    }

    maybeRealpath(realpath, x, opts, function (unwrapErr, pkgdir) {
      if (unwrapErr) return cb(unwrapErr);
      var pkgfile = path__default['default'].join(pkgdir, 'package.json');
      isFile(pkgfile, function (err, ex) {
        if (err) return cb(err);
        if (!ex) return loadAsFile(path__default['default'].join(x, 'index'), fpkg, cb);
        readFile(pkgfile, function (err, body) {
          if (err) return cb(err);

          try {
            var pkg = JSON.parse(body);
          } catch (jsonErr) {}

          if (pkg && opts.packageFilter) {
            pkg = opts.packageFilter(pkg, pkgfile);
          }

          if (pkg && pkg.main) {
            if (typeof pkg.main !== 'string') {
              var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
              mainError.code = 'INVALID_PACKAGE_MAIN';
              return cb(mainError);
            }

            if (pkg.main === '.' || pkg.main === './') {
              pkg.main = 'index';
            }

            loadAsFile(path__default['default'].resolve(x, pkg.main), pkg, function (err, m, pkg) {
              if (err) return cb(err);
              if (m) return cb(null, m, pkg);
              if (!pkg) return loadAsFile(path__default['default'].join(x, 'index'), pkg, cb);
              var dir = path__default['default'].resolve(x, pkg.main);
              loadAsDirectory(dir, pkg, function (err, n, pkg) {
                if (err) return cb(err);
                if (n) return cb(null, n, pkg);
                loadAsFile(path__default['default'].join(x, 'index'), pkg, cb);
              });
            });
            return;
          }

          loadAsFile(path__default['default'].join(x, '/index'), pkg, cb);
        });
      });
    });
  }

  function processDirs(cb, dirs) {
    if (dirs.length === 0) return cb(null, undefined);
    var dir = dirs[0];
    isDirectory(path__default['default'].dirname(dir), isdir);

    function isdir(err, isdir) {
      if (err) return cb(err);
      if (!isdir) return processDirs(cb, dirs.slice(1));
      loadAsFile(dir, opts["package"], onfile);
    }

    function onfile(err, m, pkg) {
      if (err) return cb(err);
      if (m) return cb(null, m, pkg);
      loadAsDirectory(dir, opts["package"], ondir);
    }

    function ondir(err, n, pkg) {
      if (err) return cb(err);
      if (n) return cb(null, n, pkg);
      processDirs(cb, dirs.slice(1));
    }
  }

  function loadNodeModules(x, start, cb) {
    var thunk = function thunk() {
      return getPackageCandidates(x, start, opts);
    };

    processDirs(cb, packageIterator ? packageIterator(x, start, thunk, opts) : thunk());
  }
};

var assert$1 = true;
var async_hooks$1 = ">= 8";
var buffer_ieee754$1 = "< 0.9.7";
var buffer$1 = true;
var child_process$1 = true;
var cluster$1 = true;
var console$2 = true;
var constants$1 = true;
var crypto$1 = true;
var _debug_agent$1 = ">= 1 && < 8";
var _debugger$1 = "< 8";
var dgram$1 = true;
var diagnostics_channel$1 = ">= 15.1";
var dns$1 = true;
var domain$1 = ">= 0.7.12";
var events$1 = true;
var freelist$1 = "< 6";
var fs$1 = true;
var _http_agent$1 = ">= 0.11.1";
var _http_client$1 = ">= 0.11.1";
var _http_common$1 = ">= 0.11.1";
var _http_incoming$1 = ">= 0.11.1";
var _http_outgoing$1 = ">= 0.11.1";
var _http_server$1 = ">= 0.11.1";
var http$1 = true;
var http2$1 = ">= 8.8";
var https$1 = true;
var inspector$1 = ">= 8.0.0";
var _linklist$1 = "< 8";
var module$2 = true;
var net$1 = true;
var os$1 = true;
var path$1 = true;
var perf_hooks$1 = ">= 8.5";
var process$2 = ">= 1";
var punycode$1 = true;
var querystring$1 = true;
var readline$1 = true;
var repl$1 = true;
var smalloc$1 = ">= 0.11.5 && < 3";
var _stream_duplex$1 = ">= 0.9.4";
var _stream_transform$1 = ">= 0.9.4";
var _stream_wrap$1 = ">= 1.4.1";
var _stream_passthrough$1 = ">= 0.9.4";
var _stream_readable$1 = ">= 0.9.4";
var _stream_writable$1 = ">= 0.9.4";
var stream$1 = true;
var string_decoder$1 = true;
var sys$1 = [
	">= 0.6 && < 0.7",
	">= 0.8"
];
var timers$1 = true;
var _tls_common$1 = ">= 0.11.13";
var _tls_legacy$1 = ">= 0.11.3 && < 10";
var _tls_wrap$1 = ">= 0.11.3";
var tls$1 = true;
var trace_events$1 = ">= 10";
var tty$1 = true;
var url$1 = true;
var util$1 = true;
var v8$1 = ">= 1";
var vm$1 = true;
var wasi$1 = ">= 13.4 && < 13.5";
var worker_threads$1 = ">= 11.7";
var zlib$1 = true;
var data$1 = {
	assert: assert$1,
	"assert/strict": ">= 15",
	async_hooks: async_hooks$1,
	buffer_ieee754: buffer_ieee754$1,
	buffer: buffer$1,
	child_process: child_process$1,
	cluster: cluster$1,
	console: console$2,
	constants: constants$1,
	crypto: crypto$1,
	_debug_agent: _debug_agent$1,
	_debugger: _debugger$1,
	dgram: dgram$1,
	diagnostics_channel: diagnostics_channel$1,
	dns: dns$1,
	"dns/promises": ">= 15",
	domain: domain$1,
	events: events$1,
	freelist: freelist$1,
	fs: fs$1,
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	_http_agent: _http_agent$1,
	_http_client: _http_client$1,
	_http_common: _http_common$1,
	_http_incoming: _http_incoming$1,
	_http_outgoing: _http_outgoing$1,
	_http_server: _http_server$1,
	http: http$1,
	http2: http2$1,
	https: https$1,
	inspector: inspector$1,
	_linklist: _linklist$1,
	module: module$2,
	net: net$1,
	"node-inspect/lib/_inspect": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6.0 && < 12",
	os: os$1,
	path: path$1,
	perf_hooks: perf_hooks$1,
	process: process$2,
	punycode: punycode$1,
	querystring: querystring$1,
	readline: readline$1,
	repl: repl$1,
	smalloc: smalloc$1,
	_stream_duplex: _stream_duplex$1,
	_stream_transform: _stream_transform$1,
	_stream_wrap: _stream_wrap$1,
	_stream_passthrough: _stream_passthrough$1,
	_stream_readable: _stream_readable$1,
	_stream_writable: _stream_writable$1,
	stream: stream$1,
	"stream/promises": ">= 15",
	string_decoder: string_decoder$1,
	sys: sys$1,
	timers: timers$1,
	"timers/promises": ">= 15",
	_tls_common: _tls_common$1,
	_tls_legacy: _tls_legacy$1,
	_tls_wrap: _tls_wrap$1,
	tls: tls$1,
	trace_events: trace_events$1,
	tty: tty$1,
	url: url$1,
	util: util$1,
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	v8: v8$1,
	vm: vm$1,
	wasi: wasi$1,
	worker_threads: worker_threads$1,
	zlib: zlib$1
};

var current = process.versions && process.versions.node && process.versions.node.split('.') || [];

function specifierIncluded$1(specifier) {
  var parts = specifier.split(' ');
  var op = parts.length > 1 ? parts[0] : '=';
  var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

  for (var i = 0; i < 3; ++i) {
    var cur = parseInt(current[i] || 0, 10);
    var ver = parseInt(versionParts[i] || 0, 10);

    if (cur === ver) {
      continue; // eslint-disable-line no-restricted-syntax, no-continue
    }

    if (op === '<') {
      return cur < ver;
    } else if (op === '>=') {
      return cur >= ver;
    } else {
      return false;
    }
  }

  return op === '>=';
}

function matchesRange$1(range) {
  var specifiers = range.split(/ ?&& ?/);

  if (specifiers.length === 0) {
    return false;
  }

  for (var i = 0; i < specifiers.length; ++i) {
    if (!specifierIncluded$1(specifiers[i])) {
      return false;
    }
  }

  return true;
}

function versionIncluded$1(specifierValue) {
  if (typeof specifierValue === 'boolean') {
    return specifierValue;
  }

  if (specifierValue && _typeof_1(specifierValue) === 'object') {
    for (var i = 0; i < specifierValue.length; ++i) {
      if (matchesRange$1(specifierValue[i])) {
        return true;
      }
    }

    return false;
  }

  return matchesRange$1(specifierValue);
}

var core = {};

for (var mod in data$1) {
  // eslint-disable-line no-restricted-syntax
  if (Object.prototype.hasOwnProperty.call(data$1, mod)) {
    core[mod] = versionIncluded$1(data$1[mod]);
  }
}

var core_1 = core;

var isCore = function isCore(x) {
  return isCoreModule(x);
};

var realpathFS$1 = fs__default['default'].realpathSync && typeof fs__default['default'].realpathSync["native"] === 'function' ? fs__default['default'].realpathSync["native"] : fs__default['default'].realpathSync;

var defaultIsFile$1 = function isFile(file) {
  try {
    var stat = fs__default['default'].statSync(file);
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
    throw e;
  }

  return stat.isFile() || stat.isFIFO();
};

var defaultIsDir$1 = function isDirectory(dir) {
  try {
    var stat = fs__default['default'].statSync(dir);
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
    throw e;
  }

  return stat.isDirectory();
};

var defaultRealpathSync = function realpathSync(x) {
  try {
    return realpathFS$1(x);
  } catch (realpathErr) {
    if (realpathErr.code !== 'ENOENT') {
      throw realpathErr;
    }
  }

  return x;
};

var maybeRealpathSync = function maybeRealpathSync(realpathSync, x, opts) {
  if (opts && opts.preserveSymlinks === false) {
    return realpathSync(x);
  }

  return x;
};

var getPackageCandidates$1 = function getPackageCandidates(x, start, opts) {
  var dirs = nodeModulesPaths(start, opts, x);

  for (var i = 0; i < dirs.length; i++) {
    dirs[i] = path__default['default'].join(dirs[i], x);
  }

  return dirs;
};

var sync = function resolveSync(x, options) {
  if (typeof x !== 'string') {
    throw new TypeError('Path must be a string.');
  }

  var opts = normalizeOptions(x, options);
  var isFile = opts.isFile || defaultIsFile$1;
  var readFileSync = opts.readFileSync || fs__default['default'].readFileSync;
  var isDirectory = opts.isDirectory || defaultIsDir$1;
  var realpathSync = opts.realpathSync || defaultRealpathSync;
  var packageIterator = opts.packageIterator;
  var extensions = opts.extensions || ['.js'];
  var includeCoreModules = opts.includeCoreModules !== false;
  var basedir = opts.basedir || path__default['default'].dirname(caller());
  var parent = opts.filename || basedir;
  opts.paths = opts.paths || []; // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory

  var absoluteStart = maybeRealpathSync(realpathSync, path__default['default'].resolve(basedir), opts);

  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
    var res = path__default['default'].resolve(absoluteStart, x);
    if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
    var m = loadAsFileSync(res) || loadAsDirectorySync(res);
    if (m) return maybeRealpathSync(realpathSync, m, opts);
  } else if (includeCoreModules && isCoreModule(x)) {
    return x;
  } else {
    var n = loadNodeModulesSync(x, absoluteStart);
    if (n) return maybeRealpathSync(realpathSync, n, opts);
  }

  var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  function loadAsFileSync(x) {
    var pkg = loadpkg(path__default['default'].dirname(x));

    if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
      var rfile = path__default['default'].relative(pkg.dir, x);
      var r = opts.pathFilter(pkg.pkg, x, rfile);

      if (r) {
        x = path__default['default'].resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
      }
    }

    if (isFile(x)) {
      return x;
    }

    for (var i = 0; i < extensions.length; i++) {
      var file = x + extensions[i];

      if (isFile(file)) {
        return file;
      }
    }
  }

  function loadpkg(dir) {
    if (dir === '' || dir === '/') return;

    if (process.platform === 'win32' && /^\w:[/\\]*$/.test(dir)) {
      return;
    }

    if (/[/\\]node_modules[/\\]*$/.test(dir)) return;
    var pkgfile = path__default['default'].join(maybeRealpathSync(realpathSync, dir, opts), 'package.json');

    if (!isFile(pkgfile)) {
      return loadpkg(path__default['default'].dirname(dir));
    }

    var body = readFileSync(pkgfile);

    try {
      var pkg = JSON.parse(body);
    } catch (jsonErr) {}

    if (pkg && opts.packageFilter) {
      // v2 will pass pkgfile
      pkg = opts.packageFilter(pkg,
      /*pkgfile,*/
      dir); // eslint-disable-line spaced-comment
    }

    return {
      pkg: pkg,
      dir: dir
    };
  }

  function loadAsDirectorySync(x) {
    var pkgfile = path__default['default'].join(maybeRealpathSync(realpathSync, x, opts), '/package.json');

    if (isFile(pkgfile)) {
      try {
        var body = readFileSync(pkgfile, 'UTF8');
        var pkg = JSON.parse(body);
      } catch (e) {}

      if (pkg && opts.packageFilter) {
        // v2 will pass pkgfile
        pkg = opts.packageFilter(pkg,
        /*pkgfile,*/
        x); // eslint-disable-line spaced-comment
      }

      if (pkg && pkg.main) {
        if (typeof pkg.main !== 'string') {
          var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
          mainError.code = 'INVALID_PACKAGE_MAIN';
          throw mainError;
        }

        if (pkg.main === '.' || pkg.main === './') {
          pkg.main = 'index';
        }

        try {
          var m = loadAsFileSync(path__default['default'].resolve(x, pkg.main));
          if (m) return m;
          var n = loadAsDirectorySync(path__default['default'].resolve(x, pkg.main));
          if (n) return n;
        } catch (e) {}
      }
    }

    return loadAsFileSync(path__default['default'].join(x, '/index'));
  }

  function loadNodeModulesSync(x, start) {
    var thunk = function thunk() {
      return getPackageCandidates$1(x, start, opts);
    };

    var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();

    for (var i = 0; i < dirs.length; i++) {
      var dir = dirs[i];

      if (isDirectory(path__default['default'].dirname(dir))) {
        var m = loadAsFileSync(dir);
        if (m) return m;
        var n = loadAsDirectorySync(dir);
        if (n) return n;
      }
    }
  }
};

async.core = core_1;
async.isCore = isCore;
async.sync = sync;
var resolve = async;

var dirname = path__default['default'].dirname;

var requireLike = function requireLike(path, uncached) {
  var parentModule = new Module__default['default'](path);
  parentModule.filename = path;
  parentModule.paths = Module__default['default']._nodeModulePaths(dirname(path));

  function requireLike(file) {
    var cache = Module__default['default']._cache;

    if (uncached) {
      Module__default['default']._cache = {};
    }

    var exports = Module__default['default']._load(file, parentModule);

    Module__default['default']._cache = cache;
    return exports;
  }

  requireLike.resolve = function (request) {
    var resolved = Module__default['default']._resolveFilename(request, parentModule); // Module._resolveFilename returns a string since node v0.6.10,
    // it used to return an array prior to that


    return resolved instanceof Array ? resolved[1] : resolved;
  };

  try {
    requireLike.paths = commonjsRequire.paths;
  } catch (e) {//require.paths was deprecated in node v0.5.x
    //it now throws an exception when called
  }

  requireLike.main = process.mainModule;
  requireLike.extensions = commonjsRequire.extensions;
  requireLike.cache = require.cache;
  return requireLike;
};

var _eval = createCommonjsModule(function (module) {
  var isBuffer = Buffer.isBuffer;

  function merge(a, b) {
    if (!a || !b) return a;
    var keys = Object.keys(b);

    for (var k, i = 0, n = keys.length; i < n; i++) {
      k = keys[i];
      a[k] = b[k];
    }

    return a;
  } // Return the exports/module.exports variable set in the content
  // content (String|VmScript): required


  module.exports = function (content, filename, scope, includeGlobals) {
    if (typeof filename !== 'string') {
      if (_typeof_1(filename) === 'object') {
        includeGlobals = scope;
        scope = filename;
        filename = '';
      } else if (typeof filename === 'boolean') {
        includeGlobals = filename;
        scope = {};
        filename = '';
      }
    } // Expose standard Node globals


    var sandbox = {};
    var exports = {};

    var _filename = filename || module.parent.filename;

    if (includeGlobals) {
      merge(sandbox, commonjsGlobal); // console is non-enumerable in node v10 and above

      sandbox.console = commonjsGlobal.console; // process is non-enumerable in node v12 and above

      sandbox.process = commonjsGlobal.process;
      sandbox.require = requireLike(_filename);
    }

    if (_typeof_1(scope) === 'object') {
      merge(sandbox, scope);
    }

    sandbox.exports = exports;
    sandbox.module = {
      exports: exports,
      filename: _filename,
      id: _filename,
      parent: module.parent,
      require: sandbox.require || requireLike(_filename)
    };
    sandbox.global = sandbox;
    var options = {
      filename: filename,
      displayErrors: false
    };

    if (isBuffer(content)) {
      content = content.toString();
    } // Evalutate the content with the given scope


    if (typeof content === 'string') {
      var stringScript = content.replace(/^\#\!.*/, '');
      var script = new vm__default['default'].Script(stringScript, options);
      script.runInNewContext(sandbox, options);
    } else {
      content.runInNewContext(sandbox, options);
    }

    return sandbox.module.exports;
  };
});

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defineProperty = _defineProperty;

var fromCallback = function fromCallback(fn) {
  return Object.defineProperty(function () {
    var _this = this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof args[args.length - 1] === 'function') fn.apply(this, args);else {
      return new Promise(function (resolve, reject) {
        fn.apply(_this, args.concat([function (err, res) {
          return err ? reject(err) : resolve(res);
        }]));
      });
    }
  }, 'name', {
    value: fn.name
  });
};

var fromPromise = function fromPromise(fn) {
  return Object.defineProperty(function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var cb = args[args.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, args);else fn.apply(this, args.slice(0, -1)).then(function (r) {
      return cb(null, r);
    }, cb);
  }, 'name', {
    value: fn.name
  });
};

var universalify = {
  fromCallback: fromCallback,
  fromPromise: fromPromise
};

var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function () {
  if (!cwd) cwd = origCwd.call(process);
  return cwd;
};

try {
  process.cwd();
} catch (er) {}

var chdir = process.chdir;

process.chdir = function (d) {
  cwd = null;
  chdir.call(process, d);
};

var polyfills = patch;

function patch(fs) {
  // (re-)implement some things that are known busted or missing.
  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants__default['default'].hasOwnProperty('O_SYMLINK') && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  } // lutimes implementation, or no-op


  if (!fs.lutimes) {
    patchLutimes(fs);
  } // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.


  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);
  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);
  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);
  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);
  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);
  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync); // if lchmod/lchown do not exist, then make them no-ops

  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };

    fs.lchmodSync = function () {};
  }

  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };

    fs.lchownSync = function () {};
  } // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.
  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.


  if (platform === "win32") {
    fs.rename = function (fs$rename) {
      return function (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM") && Date.now() - start < 60000) {
            setTimeout(function () {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);else cb(er);
              });
            }, backoff);
            if (backoff < 100) backoff += 10;
            return;
          }

          if (cb) cb(er);
        });
      };
    }(fs.rename);
  } // if read() returns EAGAIN, then just try it again.


  fs.read = function (fs$read) {
    function read(fd, buffer, offset, length, position, callback_) {
      var _callback;

      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;

        _callback = function callback(er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
          }

          callback_.apply(this, arguments);
        };
      }

      return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
    } // This ensures `util.promisify` works as it does for native `fs.read`.


    read.__proto__ = fs$read;
    return read;
  }(fs.read);

  fs.readSync = function (fs$readSync) {
    return function (fd, buffer, offset, length, position) {
      var eagCounter = 0;

      while (true) {
        try {
          return fs$readSync.call(fs, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            continue;
          }

          throw er;
        }
      }
    };
  }(fs.readSync);

  function patchLchmod(fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open(path, constants__default['default'].O_WRONLY | constants__default['default'].O_SYMLINK, mode, function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return;
        } // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.


        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function (err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants__default['default'].O_WRONLY | constants__default['default'].O_SYMLINK, mode); // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.

      var threw = true;
      var ret;

      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }

      return ret;
    };
  }

  function patchLutimes(fs) {
    if (constants__default['default'].hasOwnProperty("O_SYMLINK")) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants__default['default'].O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return;
          }

          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants__default['default'].O_SYMLINK);
        var ret;
        var threw = true;

        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }

        return ret;
      };
    } else {
      fs.lutimes = function (_a, _b, _c, cb) {
        if (cb) process.nextTick(cb);
      };

      fs.lutimesSync = function () {};
    }
  }

  function chmodFix(orig) {
    if (!orig) return orig;
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }

  function chmodFixSync(orig) {
    if (!orig) return orig;
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }

  function chownFix(orig) {
    if (!orig) return orig;
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }

  function chownFixSync(orig) {
    if (!orig) return orig;
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }

  function statFix(orig) {
    if (!orig) return orig; // Older versions of Node erroneously returned signed integers for
    // uid + gid.

    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }

      function callback(er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }

        if (cb) cb.apply(this, arguments);
      }

      return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
    };
  }

  function statFixSync(orig) {
    if (!orig) return orig; // Older versions of Node erroneously returned signed integers for
    // uid + gid.

    return function (target, options) {
      var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      return stats;
    };
  } // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.


  function chownErOk(er) {
    if (!er) return true;
    if (er.code === "ENOSYS") return true;
    var nonroot = !process.getuid || process.getuid() !== 0;

    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM") return true;
    }

    return false;
  }
}

var Stream = require$$0__default['default'].Stream;
var legacyStreams = legacy;

function legacy(fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  };

  function ReadStream(path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);
    Stream.call(this);
    var self = this;
    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;
    this.flags = 'r';
    this.mode = 438;
    /*=0666*/

    this.bufferSize = 64 * 1024;
    options = options || {}; // Mixin options into this

    var keys = Object.keys(options);

    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }

      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function () {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);

      self._read();
    });
  }

  function WriteStream(path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);
    Stream.call(this);
    this.path = path;
    this.fd = null;
    this.writable = true;
    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438;
    /*=0666*/

    this.bytesWritten = 0;
    options = options || {}; // Mixin options into this

    var keys = Object.keys(options);

    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }

      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;

      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);

      this.flush();
    }
  }
}

var clone_1 = clone;

function clone(obj) {
  if (obj === null || _typeof_1(obj) !== 'object') return obj;
  if (obj instanceof Object) var copy = {
    __proto__: obj.__proto__
  };else var copy = Object.create(null);
  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });
  return copy;
}

var gracefulFs = createCommonjsModule(function (module) {
  /* istanbul ignore next - node 0.x polyfill */
  var gracefulQueue;
  var previousSymbol;
  /* istanbul ignore else - node 0.x polyfill */

  if (typeof Symbol === 'function' && typeof Symbol["for"] === 'function') {
    gracefulQueue = Symbol["for"]('graceful-fs.queue'); // This is used in testing by future versions

    previousSymbol = Symbol["for"]('graceful-fs.previous');
  } else {
    gracefulQueue = '___graceful-fs.queue';
    previousSymbol = '___graceful-fs.previous';
  }

  function noop() {}

  function publishQueue(context, queue) {
    Object.defineProperty(context, gracefulQueue, {
      get: function get() {
        return queue;
      }
    });
  }

  var debug = noop;
  if (util__default['default'].debuglog) debug = util__default['default'].debuglog('gfs4');else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) debug = function debug() {
    var m = util__default['default'].format.apply(util__default['default'], arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  }; // Once time initialization

  if (!fs__default['default'][gracefulQueue]) {
    // This queue can be shared by multiple loaded instances
    var queue = commonjsGlobal[gracefulQueue] || [];
    publishQueue(fs__default['default'], queue); // Patch fs.close/closeSync to shared queue version, because we need
    // to retry() whenever a close happens *anywhere* in the program.
    // This is essential when multiple graceful-fs instances are
    // in play at the same time.

    fs__default['default'].close = function (fs$close) {
      function close(fd, cb) {
        return fs$close.call(fs__default['default'], fd, function (err) {
          // This function uses the graceful-fs shared queue
          if (!err) {
            retry();
          }

          if (typeof cb === 'function') cb.apply(this, arguments);
        });
      }

      Object.defineProperty(close, previousSymbol, {
        value: fs$close
      });
      return close;
    }(fs__default['default'].close);

    fs__default['default'].closeSync = function (fs$closeSync) {
      function closeSync(fd) {
        // This function uses the graceful-fs shared queue
        fs$closeSync.apply(fs__default['default'], arguments);
        retry();
      }

      Object.defineProperty(closeSync, previousSymbol, {
        value: fs$closeSync
      });
      return closeSync;
    }(fs__default['default'].closeSync);

    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
      process.on('exit', function () {
        debug(fs__default['default'][gracefulQueue]);
        assert__default['default'].equal(fs__default['default'][gracefulQueue].length, 0);
      });
    }
  }

  if (!commonjsGlobal[gracefulQueue]) {
    publishQueue(commonjsGlobal, fs__default['default'][gracefulQueue]);
  }

  module.exports = patch(clone_1(fs__default['default']));

  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs__default['default'].__patched) {
    module.exports = patch(fs__default['default']);
    fs__default['default'].__patched = true;
  }

  function patch(fs) {
    // Everything that references the open() function needs to be in here
    polyfills(fs);
    fs.gracefulify = patch;
    fs.createReadStream = createReadStream;
    fs.createWriteStream = createWriteStream;
    var fs$readFile = fs.readFile;
    fs.readFile = readFile;

    function readFile(path, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$readFile(path, options, cb);

      function go$readFile(path, options, cb) {
        return fs$readFile(path, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readFile, [path, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }

    var fs$writeFile = fs.writeFile;
    fs.writeFile = writeFile;

    function writeFile(path, data, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$writeFile(path, data, options, cb);

      function go$writeFile(path, data, options, cb) {
        return fs$writeFile(path, data, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$writeFile, [path, data, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }

    var fs$appendFile = fs.appendFile;
    if (fs$appendFile) fs.appendFile = appendFile;

    function appendFile(path, data, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$appendFile(path, data, options, cb);

      function go$appendFile(path, data, options, cb) {
        return fs$appendFile(path, data, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$appendFile, [path, data, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }

    var fs$readdir = fs.readdir;
    fs.readdir = readdir;

    function readdir(path, options, cb) {
      var args = [path];

      if (typeof options !== 'function') {
        args.push(options);
      } else {
        cb = options;
      }

      args.push(go$readdir$cb);
      return go$readdir(args);

      function go$readdir$cb(err, files) {
        if (files && files.sort) files.sort();
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readdir, [args]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      }
    }

    function go$readdir(args) {
      return fs$readdir.apply(fs, args);
    }

    if (process.version.substr(0, 4) === 'v0.8') {
      var legStreams = legacyStreams(fs);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }

    var fs$ReadStream = fs.ReadStream;

    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }

    var fs$WriteStream = fs.WriteStream;

    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }

    Object.defineProperty(fs, 'ReadStream', {
      get: function get() {
        return ReadStream;
      },
      set: function set(val) {
        ReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(fs, 'WriteStream', {
      get: function get() {
        return WriteStream;
      },
      set: function set(val) {
        WriteStream = val;
      },
      enumerable: true,
      configurable: true
    }); // legacy names

    var FileReadStream = ReadStream;
    Object.defineProperty(fs, 'FileReadStream', {
      get: function get() {
        return FileReadStream;
      },
      set: function set(val) {
        FileReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs, 'FileWriteStream', {
      get: function get() {
        return FileWriteStream;
      },
      set: function set(val) {
        FileWriteStream = val;
      },
      enumerable: true,
      configurable: true
    });

    function ReadStream(path, options) {
      if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }

    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function (err, fd) {
        if (err) {
          if (that.autoClose) that.destroy();
          that.emit('error', err);
        } else {
          that.fd = fd;
          that.emit('open', fd);
          that.read();
        }
      });
    }

    function WriteStream(path, options) {
      if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }

    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function (err, fd) {
        if (err) {
          that.destroy();
          that.emit('error', err);
        } else {
          that.fd = fd;
          that.emit('open', fd);
        }
      });
    }

    function createReadStream(path, options) {
      return new fs.ReadStream(path, options);
    }

    function createWriteStream(path, options) {
      return new fs.WriteStream(path, options);
    }

    var fs$open = fs.open;
    fs.open = open;

    function open(path, flags, mode, cb) {
      if (typeof mode === 'function') cb = mode, mode = null;
      return go$open(path, flags, mode, cb);

      function go$open(path, flags, mode, cb) {
        return fs$open(path, flags, mode, function (err, fd) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$open, [path, flags, mode, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }

    return fs;
  }

  function enqueue(elem) {
    debug('ENQUEUE', elem[0].name, elem[1]);
    fs__default['default'][gracefulQueue].push(elem);
  }

  function retry() {
    var elem = fs__default['default'][gracefulQueue].shift();

    if (elem) {
      debug('RETRY', elem[0].name, elem[1]);
      elem[0].apply(null, elem[1]);
    }
  }
});

var fs_1 = createCommonjsModule(function (module, exports) {
  // Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors

  var u = universalify.fromCallback;
  var api = ['access', 'appendFile', 'chmod', 'chown', 'close', 'copyFile', 'fchmod', 'fchown', 'fdatasync', 'fstat', 'fsync', 'ftruncate', 'futimes', 'lchmod', 'lchown', 'link', 'lstat', 'mkdir', 'mkdtemp', 'open', 'opendir', 'readdir', 'readFile', 'readlink', 'realpath', 'rename', 'rmdir', 'stat', 'symlink', 'truncate', 'unlink', 'utimes', 'writeFile'].filter(function (key) {
    // Some commands are not available on some systems. Ex:
    // fs.opendir was added in Node.js v12.12.0
    // fs.lchown is not available on at least some Linux
    return typeof gracefulFs[key] === 'function';
  }); // Export all keys:

  Object.keys(gracefulFs).forEach(function (key) {
    if (key === 'promises') {
      // fs.promises is a getter property that triggers ExperimentalWarning
      // Don't re-export it here, the getter is defined in "lib/index.js"
      return;
    }

    exports[key] = gracefulFs[key];
  }); // Universalify async methods:

  api.forEach(function (method) {
    exports[method] = u(gracefulFs[method]);
  }); // We differ from mz/fs in that we still ship the old, broken, fs.exists()
  // since we are a drop-in replacement for the native module

  exports.exists = function (filename, callback) {
    if (typeof callback === 'function') {
      return gracefulFs.exists(filename, callback);
    }

    return new Promise(function (resolve) {
      return gracefulFs.exists(filename, resolve);
    });
  }; // fs.read(), fs.write(), & fs.writev() need special treatment due to multiple callback args


  exports.read = function (fd, buffer, offset, length, position, callback) {
    if (typeof callback === 'function') {
      return gracefulFs.read(fd, buffer, offset, length, position, callback);
    }

    return new Promise(function (resolve, reject) {
      gracefulFs.read(fd, buffer, offset, length, position, function (err, bytesRead, buffer) {
        if (err) return reject(err);
        resolve({
          bytesRead: bytesRead,
          buffer: buffer
        });
      });
    });
  }; // Function signature can be
  // fs.write(fd, buffer[, offset[, length[, position]]], callback)
  // OR
  // fs.write(fd, string[, position[, encoding]], callback)
  // We need to handle both cases, so we use ...args


  exports.write = function (fd, buffer) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    if (typeof args[args.length - 1] === 'function') {
      return gracefulFs.write.apply(gracefulFs, [fd, buffer].concat(args));
    }

    return new Promise(function (resolve, reject) {
      gracefulFs.write.apply(gracefulFs, [fd, buffer].concat(args, [function (err, bytesWritten, buffer) {
        if (err) return reject(err);
        resolve({
          bytesWritten: bytesWritten,
          buffer: buffer
        });
      }]));
    });
  }; // fs.writev only available in Node v12.9.0+


  if (typeof gracefulFs.writev === 'function') {
    // Function signature is
    // s.writev(fd, buffers[, position], callback)
    // We need to handle the optional arg, so we use ...args
    exports.writev = function (fd, buffers) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      if (typeof args[args.length - 1] === 'function') {
        return gracefulFs.writev.apply(gracefulFs, [fd, buffers].concat(args));
      }

      return new Promise(function (resolve, reject) {
        gracefulFs.writev.apply(gracefulFs, [fd, buffers].concat(args, [function (err, bytesWritten, buffers) {
          if (err) return reject(err);
          resolve({
            bytesWritten: bytesWritten,
            buffers: buffers
          });
        }]));
      });
    };
  } // fs.realpath.native only available in Node v9.2+


  if (typeof gracefulFs.realpath["native"] === 'function') {
    exports.realpath["native"] = u(gracefulFs.realpath["native"]);
  }
});

var runtime_1 = createCommonjsModule(function (module) {
  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var runtime = function (exports) {

    var Op = Object.prototype;
    var hasOwn = Op.hasOwnProperty;
    var undefined$1; // More compressible than void 0.

    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    function define(obj, key, value) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
      return obj[key];
    }

    try {
      // IE 8 has a broken Object.defineProperty that only works on DOM objects.
      define({}, "");
    } catch (err) {
      define = function define(obj, key, value) {
        return obj[key] = value;
      };
    }

    function wrap(innerFn, outerFn, self, tryLocsList) {
      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
      var generator = Object.create(protoGenerator.prototype);
      var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
      // .throw, and .return methods.

      generator._invoke = makeInvokeMethod(innerFn, self, context);
      return generator;
    }

    exports.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
    // record like context.tryEntries[i].completion. This interface could
    // have been (and was previously) designed to take a closure to be
    // invoked without arguments, but in all the cases we care about we
    // already have an existing method we want to call, so there's no need
    // to create a new function object. We can even get away with assuming
    // the method takes exactly one argument, since that happens to be true
    // in every case, so we don't have to touch the arguments object. The
    // only additional allocation required is the completion record, which
    // has a stable shape and so hopefully should be cheap to allocate.

    function tryCatch(fn, obj, arg) {
      try {
        return {
          type: "normal",
          arg: fn.call(obj, arg)
        };
      } catch (err) {
        return {
          type: "throw",
          arg: err
        };
      }
    }

    var GenStateSuspendedStart = "suspendedStart";
    var GenStateSuspendedYield = "suspendedYield";
    var GenStateExecuting = "executing";
    var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
    // breaking out of the dispatch switch statement.

    var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
    // .constructor.prototype properties for functions that return Generator
    // objects. For full spec compliance, you may wish to configure your
    // minifier not to mangle the names of these two functions.

    function Generator() {}

    function GeneratorFunction() {}

    function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
    // don't natively support it.


    var IteratorPrototype = {};

    IteratorPrototype[iteratorSymbol] = function () {
      return this;
    };

    var getProto = Object.getPrototypeOf;
    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

    if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
      // This environment has a native %IteratorPrototype%; use it instead
      // of the polyfill.
      IteratorPrototype = NativeIteratorPrototype;
    }

    var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
    GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
    GeneratorFunctionPrototype.constructor = GeneratorFunction;
    GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"); // Helper for defining the .next, .throw, and .return methods of the
    // Iterator interface in terms of a single ._invoke method.

    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function (method) {
        define(prototype, method, function (arg) {
          return this._invoke(method, arg);
        });
      });
    }

    exports.isGeneratorFunction = function (genFun) {
      var ctor = typeof genFun === "function" && genFun.constructor;
      return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
    };

    exports.mark = function (genFun) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
      } else {
        genFun.__proto__ = GeneratorFunctionPrototype;
        define(genFun, toStringTagSymbol, "GeneratorFunction");
      }

      genFun.prototype = Object.create(Gp);
      return genFun;
    }; // Within the body of any async function, `await x` is transformed to
    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    // meant to be awaited.


    exports.awrap = function (arg) {
      return {
        __await: arg
      };
    };

    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);

        if (record.type === "throw") {
          reject(record.arg);
        } else {
          var result = record.arg;
          var value = result.value;

          if (value && _typeof_1(value) === "object" && hasOwn.call(value, "__await")) {
            return PromiseImpl.resolve(value.__await).then(function (value) {
              invoke("next", value, resolve, reject);
            }, function (err) {
              invoke("throw", err, resolve, reject);
            });
          }

          return PromiseImpl.resolve(value).then(function (unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration.
            result.value = unwrapped;
            resolve(result);
          }, function (error) {
            // If a rejected Promise was yielded, throw the rejection back
            // into the async generator function so it can be handled there.
            return invoke("throw", error, resolve, reject);
          });
        }
      }

      var previousPromise;

      function enqueue(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function (resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }

        return previousPromise = // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
        // invocations of the iterator.
        callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      } // Define the unified helper method that is used to implement .next,
      // .throw, and .return (see defineIteratorMethods).


      this._invoke = enqueue;
    }

    defineIteratorMethods(AsyncIterator.prototype);

    AsyncIterator.prototype[asyncIteratorSymbol] = function () {
      return this;
    };

    exports.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
    // AsyncIterator objects; they just return a Promise for the value of
    // the final result produced by the iterator.

    exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      if (PromiseImpl === void 0) PromiseImpl = Promise;
      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
      return exports.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function (result) {
        return result.done ? result.value : iter.next();
      });
    };

    function makeInvokeMethod(innerFn, self, context) {
      var state = GenStateSuspendedStart;
      return function invoke(method, arg) {
        if (state === GenStateExecuting) {
          throw new Error("Generator is already running");
        }

        if (state === GenStateCompleted) {
          if (method === "throw") {
            throw arg;
          } // Be forgiving, per 25.3.3.3.3 of the spec:
          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


          return doneResult();
        }

        context.method = method;
        context.arg = arg;

        while (true) {
          var delegate = context.delegate;

          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);

            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }

          if (context.method === "next") {
            // Setting context._sent for legacy support of Babel's
            // function.sent implementation.
            context.sent = context._sent = context.arg;
          } else if (context.method === "throw") {
            if (state === GenStateSuspendedStart) {
              state = GenStateCompleted;
              throw context.arg;
            }

            context.dispatchException(context.arg);
          } else if (context.method === "return") {
            context.abrupt("return", context.arg);
          }

          state = GenStateExecuting;
          var record = tryCatch(innerFn, self, context);

          if (record.type === "normal") {
            // If an exception is thrown from innerFn, we leave state ===
            // GenStateExecuting and loop back for another invocation.
            state = context.done ? GenStateCompleted : GenStateSuspendedYield;

            if (record.arg === ContinueSentinel) {
              continue;
            }

            return {
              value: record.arg,
              done: context.done
            };
          } else if (record.type === "throw") {
            state = GenStateCompleted; // Dispatch the exception by looping back around to the
            // context.dispatchException(context.arg) call above.

            context.method = "throw";
            context.arg = record.arg;
          }
        }
      };
    } // Call delegate.iterator[context.method](context.arg) and handle the
    // result, either by returning a { value, done } result from the
    // delegate iterator, or by modifying context.method and context.arg,
    // setting context.delegate to null, and returning the ContinueSentinel.


    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];

      if (method === undefined$1) {
        // A .throw or .return when the delegate iterator has no .throw
        // method always terminates the yield* loop.
        context.delegate = null;

        if (context.method === "throw") {
          // Note: ["return"] must be used for ES3 parsing compatibility.
          if (delegate.iterator["return"]) {
            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            context.method = "return";
            context.arg = undefined$1;
            maybeInvokeDelegate(delegate, context);

            if (context.method === "throw") {
              // If maybeInvokeDelegate(context) changed context.method from
              // "return" to "throw", let that override the TypeError below.
              return ContinueSentinel;
            }
          }

          context.method = "throw";
          context.arg = new TypeError("The iterator does not provide a 'throw' method");
        }

        return ContinueSentinel;
      }

      var record = tryCatch(method, delegate.iterator, context.arg);

      if (record.type === "throw") {
        context.method = "throw";
        context.arg = record.arg;
        context.delegate = null;
        return ContinueSentinel;
      }

      var info = record.arg;

      if (!info) {
        context.method = "throw";
        context.arg = new TypeError("iterator result is not an object");
        context.delegate = null;
        return ContinueSentinel;
      }

      if (info.done) {
        // Assign the result of the finished delegate to the temporary
        // variable specified by delegate.resultName (see delegateYield).
        context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

        context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
        // exception, let the outer generator proceed normally. If
        // context.method was "next", forget context.arg since it has been
        // "consumed" by the delegate iterator. If context.method was
        // "return", allow the original .return call to continue in the
        // outer generator.

        if (context.method !== "return") {
          context.method = "next";
          context.arg = undefined$1;
        }
      } else {
        // Re-yield the result returned by the delegate method.
        return info;
      } // The delegate iterator is finished, so forget it and continue with
      // the outer generator.


      context.delegate = null;
      return ContinueSentinel;
    } // Define Generator.prototype.{next,throw,return} in terms of the
    // unified ._invoke helper method.


    defineIteratorMethods(Gp);
    define(Gp, toStringTagSymbol, "Generator"); // A Generator should always return itself as the iterator object when the
    // @@iterator function is called on it. Some browsers' implementations of the
    // iterator prototype chain incorrectly implement this, causing the Generator
    // object to not be returned from this call. This ensures that doesn't happen.
    // See https://github.com/facebook/regenerator/issues/274 for more details.

    Gp[iteratorSymbol] = function () {
      return this;
    };

    Gp.toString = function () {
      return "[object Generator]";
    };

    function pushTryEntry(locs) {
      var entry = {
        tryLoc: locs[0]
      };

      if (1 in locs) {
        entry.catchLoc = locs[1];
      }

      if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

      this.tryEntries.push(entry);
    }

    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal";
      delete record.arg;
      entry.completion = record;
    }

    function Context(tryLocsList) {
      // The root entry object (effectively a try statement without a catch
      // or a finally block) gives us a place to store values thrown from
      // locations where there is no enclosing try statement.
      this.tryEntries = [{
        tryLoc: "root"
      }];
      tryLocsList.forEach(pushTryEntry, this);
      this.reset(true);
    }

    exports.keys = function (object) {
      var keys = [];

      for (var key in object) {
        keys.push(key);
      }

      keys.reverse(); // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.

      return function next() {
        while (keys.length) {
          var key = keys.pop();

          if (key in object) {
            next.value = key;
            next.done = false;
            return next;
          }
        } // To avoid creating an additional object, we just hang the .value
        // and .done properties off the next function object itself. This
        // also ensures that the minifier will not anonymize the function.


        next.done = true;
        return next;
      };
    };

    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];

        if (iteratorMethod) {
          return iteratorMethod.call(iterable);
        }

        if (typeof iterable.next === "function") {
          return iterable;
        }

        if (!isNaN(iterable.length)) {
          var i = -1,
              next = function next() {
            while (++i < iterable.length) {
              if (hasOwn.call(iterable, i)) {
                next.value = iterable[i];
                next.done = false;
                return next;
              }
            }

            next.value = undefined$1;
            next.done = true;
            return next;
          };

          return next.next = next;
        }
      } // Return an iterator with no values.


      return {
        next: doneResult
      };
    }

    exports.values = values;

    function doneResult() {
      return {
        value: undefined$1,
        done: true
      };
    }

    Context.prototype = {
      constructor: Context,
      reset: function reset(skipTempReset) {
        this.prev = 0;
        this.next = 0; // Resetting context._sent for legacy support of Babel's
        // function.sent implementation.

        this.sent = this._sent = undefined$1;
        this.done = false;
        this.delegate = null;
        this.method = "next";
        this.arg = undefined$1;
        this.tryEntries.forEach(resetTryEntry);

        if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
              this[name] = undefined$1;
            }
          }
        }
      },
      stop: function stop() {
        this.done = true;
        var rootEntry = this.tryEntries[0];
        var rootRecord = rootEntry.completion;

        if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

        return this.rval;
      },
      dispatchException: function dispatchException(exception) {
        if (this.done) {
          throw exception;
        }

        var context = this;

        function handle(loc, caught) {
          record.type = "throw";
          record.arg = exception;
          context.next = loc;

          if (caught) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            context.method = "next";
            context.arg = undefined$1;
          }

          return !!caught;
        }

        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          var record = entry.completion;

          if (entry.tryLoc === "root") {
            // Exception thrown outside of any try block that could handle
            // it, so set the completion value of the entire function to
            // throw the exception.
            return handle("end");
          }

          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc");
            var hasFinally = hasOwn.call(entry, "finallyLoc");

            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              } else if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }
            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              }
            } else if (hasFinally) {
              if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }
            } else {
              throw new Error("try statement without catch or finally");
            }
          }
        }
      },
      abrupt: function abrupt(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];

          if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }

        if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
          // Ignore the finally entry if control is not jumping to a
          // location outside the try/catch block.
          finallyEntry = null;
        }

        var record = finallyEntry ? finallyEntry.completion : {};
        record.type = type;
        record.arg = arg;

        if (finallyEntry) {
          this.method = "next";
          this.next = finallyEntry.finallyLoc;
          return ContinueSentinel;
        }

        return this.complete(record);
      },
      complete: function complete(record, afterLoc) {
        if (record.type === "throw") {
          throw record.arg;
        }

        if (record.type === "break" || record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = this.arg = record.arg;
          this.method = "return";
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }

        return ContinueSentinel;
      },
      finish: function finish(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];

          if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
        }
      },
      "catch": function _catch(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];

          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;

            if (record.type === "throw") {
              var thrown = record.arg;
              resetTryEntry(entry);
            }

            return thrown;
          }
        } // The context.catch method must only be called with a location
        // argument that corresponds to a known catch block.


        throw new Error("illegal catch attempt");
      },
      delegateYield: function delegateYield(iterable, resultName, nextLoc) {
        this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        };

        if (this.method === "next") {
          // Deliberately forget the last sent value so that we don't
          // accidentally pass it on to the delegate.
          this.arg = undefined$1;
        }

        return ContinueSentinel;
      }
    }; // Regardless of whether this script is executing as a CommonJS module
    // or not, return the runtime object so that we can declare the variable
    // regeneratorRuntime in the outer scope, which allows this module to be
    // injected easily by `bin/regenerator --include-runtime script.js`.

    return exports;
  }( // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports );

  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    // This module should not be running in strict mode, so the above
    // assignment should always work unless something is misconfigured. Just
    // in case runtime.js accidentally runs in strict mode, we can escape
    // strict mode using a global Function call. This could conceivably fail
    // if a Content Security Policy forbids using Function, but in that case
    // the proper solution is to fix the accidental strict mode problem. If
    // you've misconfigured your bundler to force strict mode and applied a
    // CSP to forbid Function, and you're not willing to fix either of those
    // problems, please detail your unique predicament in a GitHub issue.
    Function("r", "regeneratorRuntime = r")(runtime);
  }
});

var regenerator = runtime_1;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

var asyncToGenerator = _asyncToGenerator;

var atLeastNode = function atLeastNode(r) {
  var n = process.versions.node.split('.').map(function (x) {
    return parseInt(x, 10);
  });
  r = r.split('.').map(function (x) {
    return parseInt(x, 10);
  });
  return n[0] > r[0] || n[0] === r[0] && (n[1] > r[1] || n[1] === r[1] && n[2] >= r[2]);
};

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var useNativeRecursiveOption = atLeastNode('10.12.0'); // https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088

var checkPath = function checkPath(pth) {
  if (process.platform === 'win32') {
    var pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path__default['default'].parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      var error = new Error("Path contains invalid characters: ".concat(pth));
      error.code = 'EINVAL';
      throw error;
    }
  }
};

var processOptions = function processOptions(options) {
  var defaults = {
    mode: 511
  };
  if (typeof options === 'number') options = {
    mode: options
  };
  return _objectSpread(_objectSpread({}, defaults), options);
};

var permissionError = function permissionError(pth) {
  // This replicates the exception of `fs.mkdir` with native the
  // `recusive` option when run on an invalid drive under Windows.
  var error = new Error("operation not permitted, mkdir '".concat(pth, "'"));
  error.code = 'EPERM';
  error.errno = -4048;
  error.path = pth;
  error.syscall = 'mkdir';
  return error;
};

var makeDir_1 = /*#__PURE__*/function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(input, options) {
    var pth, make;
    return regenerator.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            checkPath(input);
            options = processOptions(options);

            if (!useNativeRecursiveOption) {
              _context2.next = 5;
              break;
            }

            pth = path__default['default'].resolve(input);
            return _context2.abrupt("return", fs_1.mkdir(pth, {
              mode: options.mode,
              recursive: true
            }));

          case 5:
            make = /*#__PURE__*/function () {
              var _ref2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(pth) {
                var stats;
                return regenerator.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.prev = 0;
                        _context.next = 3;
                        return fs_1.mkdir(pth, options.mode);

                      case 3:
                        _context.next = 28;
                        break;

                      case 5:
                        _context.prev = 5;
                        _context.t0 = _context["catch"](0);

                        if (!(_context.t0.code === 'EPERM')) {
                          _context.next = 9;
                          break;
                        }

                        throw _context.t0;

                      case 9:
                        if (!(_context.t0.code === 'ENOENT')) {
                          _context.next = 17;
                          break;
                        }

                        if (!(path__default['default'].dirname(pth) === pth)) {
                          _context.next = 12;
                          break;
                        }

                        throw permissionError(pth);

                      case 12:
                        if (!_context.t0.message.includes('null bytes')) {
                          _context.next = 14;
                          break;
                        }

                        throw _context.t0;

                      case 14:
                        _context.next = 16;
                        return make(path__default['default'].dirname(pth));

                      case 16:
                        return _context.abrupt("return", make(pth));

                      case 17:
                        _context.prev = 17;
                        _context.next = 20;
                        return fs_1.stat(pth);

                      case 20:
                        stats = _context.sent;

                        if (stats.isDirectory()) {
                          _context.next = 23;
                          break;
                        }

                        throw new Error('The path is not a directory');

                      case 23:
                        _context.next = 28;
                        break;

                      case 25:
                        _context.prev = 25;
                        _context.t1 = _context["catch"](17);
                        throw _context.t0;

                      case 28:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[0, 5], [17, 25]]);
              }));

              return function make(_x3) {
                return _ref2.apply(this, arguments);
              };
            }();

            return _context2.abrupt("return", make(path__default['default'].resolve(input)));

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function makeDir_1(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var makeDirSync = function makeDirSync(input, options) {
  checkPath(input);
  options = processOptions(options);

  if (useNativeRecursiveOption) {
    var pth = path__default['default'].resolve(input);
    return fs_1.mkdirSync(pth, {
      mode: options.mode,
      recursive: true
    });
  }

  var make = function make(pth) {
    try {
      fs_1.mkdirSync(pth, options.mode);
    } catch (error) {
      if (error.code === 'EPERM') {
        throw error;
      }

      if (error.code === 'ENOENT') {
        if (path__default['default'].dirname(pth) === pth) {
          throw permissionError(pth);
        }

        if (error.message.includes('null bytes')) {
          throw error;
        }

        make(path__default['default'].dirname(pth));
        return make(pth);
      }

      try {
        if (!fs_1.statSync(pth).isDirectory()) {
          // This error is never exposed to the user
          // it is caught below, and the original error is thrown
          throw new Error('The path is not a directory');
        }
      } catch (_unused2) {
        throw error;
      }
    }
  };

  return make(path__default['default'].resolve(input));
};

var makeDir = {
  makeDir: makeDir_1,
  makeDirSync: makeDirSync
};

var u = universalify.fromPromise;
var _makeDir = makeDir.makeDir,
    makeDirSync$1 = makeDir.makeDirSync;
var makeDir$1 = u(_makeDir);
var mkdirs = {
  mkdirs: makeDir$1,
  mkdirsSync: makeDirSync$1,
  // alias
  mkdirp: makeDir$1,
  mkdirpSync: makeDirSync$1,
  ensureDir: makeDir$1,
  ensureDirSync: makeDirSync$1
};

function utimesMillis(path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  gracefulFs.open(path, 'r+', function (err, fd) {
    if (err) return callback(err);
    gracefulFs.futimes(fd, atime, mtime, function (futimesErr) {
      gracefulFs.close(fd, function (closeErr) {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}

function utimesMillisSync(path, atime, mtime) {
  var fd = gracefulFs.openSync(path, 'r+');
  gracefulFs.futimesSync(fd, atime, mtime);
  return gracefulFs.closeSync(fd);
}

var utimes = {
  utimesMillis: utimesMillis,
  utimesMillisSync: utimesMillisSync
};

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

var arrayWithHoles = _arrayWithHoles;

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

var iterableToArrayLimit = _iterableToArrayLimit;

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

var arrayLikeToArray = _arrayLikeToArray;

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

var unsupportedIterableToArray = _unsupportedIterableToArray;

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var nonIterableRest = _nonIterableRest;

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}

var slicedToArray = _slicedToArray;

var nodeSupportsBigInt = atLeastNode('10.5.0');

var stat = function stat(file) {
  return nodeSupportsBigInt ? fs_1.stat(file, {
    bigint: true
  }) : fs_1.stat(file);
};

var statSync = function statSync(file) {
  return nodeSupportsBigInt ? fs_1.statSync(file, {
    bigint: true
  }) : fs_1.statSync(file);
};

function getStats(src, dest) {
  return Promise.all([stat(src), stat(dest)["catch"](function (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  })]).then(function (_ref) {
    var _ref2 = slicedToArray(_ref, 2),
        srcStat = _ref2[0],
        destStat = _ref2[1];

    return {
      srcStat: srcStat,
      destStat: destStat
    };
  });
}

function getStatsSync(src, dest) {
  var destStat;
  var srcStat = statSync(src);

  try {
    destStat = statSync(dest);
  } catch (err) {
    if (err.code === 'ENOENT') return {
      srcStat: srcStat,
      destStat: null
    };
    throw err;
  }

  return {
    srcStat: srcStat,
    destStat: destStat
  };
}

function checkPaths(src, dest, funcName, cb) {
  util__default['default'].callbackify(getStats)(src, dest, function (err, stats) {
    if (err) return cb(err);
    var srcStat = stats.srcStat,
        destStat = stats.destStat;

    if (destStat && areIdentical(srcStat, destStat)) {
      return cb(new Error('Source and destination must not be the same.'));
    }

    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      return cb(new Error(errMsg(src, dest, funcName)));
    }

    return cb(null, {
      srcStat: srcStat,
      destStat: destStat
    });
  });
}

function checkPathsSync(src, dest, funcName) {
  var _getStatsSync = getStatsSync(src, dest),
      srcStat = _getStatsSync.srcStat,
      destStat = _getStatsSync.destStat;

  if (destStat && areIdentical(srcStat, destStat)) {
    throw new Error('Source and destination must not be the same.');
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName));
  }

  return {
    srcStat: srcStat,
    destStat: destStat
  };
} // recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.


function checkParentPaths(src, srcStat, dest, funcName, cb) {
  var srcParent = path__default['default'].resolve(path__default['default'].dirname(src));
  var destParent = path__default['default'].resolve(path__default['default'].dirname(dest));
  if (destParent === srcParent || destParent === path__default['default'].parse(destParent).root) return cb();

  var callback = function callback(err, destStat) {
    if (err) {
      if (err.code === 'ENOENT') return cb();
      return cb(err);
    }

    if (areIdentical(srcStat, destStat)) {
      return cb(new Error(errMsg(src, dest, funcName)));
    }

    return checkParentPaths(src, srcStat, destParent, funcName, cb);
  };

  if (nodeSupportsBigInt) fs_1.stat(destParent, {
    bigint: true
  }, callback);else fs_1.stat(destParent, callback);
}

function checkParentPathsSync(src, srcStat, dest, funcName) {
  var srcParent = path__default['default'].resolve(path__default['default'].dirname(src));
  var destParent = path__default['default'].resolve(path__default['default'].dirname(dest));
  if (destParent === srcParent || destParent === path__default['default'].parse(destParent).root) return;
  var destStat;

  try {
    destStat = statSync(destParent);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }

  if (areIdentical(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName));
  }

  return checkParentPathsSync(src, srcStat, destParent, funcName);
}

function areIdentical(srcStat, destStat) {
  if (destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev) {
    if (nodeSupportsBigInt || destStat.ino < Number.MAX_SAFE_INTEGER) {
      // definitive answer
      return true;
    } // Use additional heuristics if we can't use 'bigint'.
    // Different 'ino' could be represented the same if they are >= Number.MAX_SAFE_INTEGER
    // See issue 657


    if (destStat.size === srcStat.size && destStat.mode === srcStat.mode && destStat.nlink === srcStat.nlink && destStat.atimeMs === srcStat.atimeMs && destStat.mtimeMs === srcStat.mtimeMs && destStat.ctimeMs === srcStat.ctimeMs && destStat.birthtimeMs === srcStat.birthtimeMs) {
      // heuristic answer
      return true;
    }
  }

  return false;
} // return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.


function isSrcSubdir(src, dest) {
  var srcArr = path__default['default'].resolve(src).split(path__default['default'].sep).filter(function (i) {
    return i;
  });
  var destArr = path__default['default'].resolve(dest).split(path__default['default'].sep).filter(function (i) {
    return i;
  });
  return srcArr.reduce(function (acc, cur, i) {
    return acc && destArr[i] === cur;
  }, true);
}

function errMsg(src, dest, funcName) {
  return "Cannot ".concat(funcName, " '").concat(src, "' to a subdirectory of itself, '").concat(dest, "'.");
}

var stat_1 = {
  checkPaths: checkPaths,
  checkPathsSync: checkPathsSync,
  checkParentPaths: checkParentPaths,
  checkParentPathsSync: checkParentPathsSync,
  isSrcSubdir: isSrcSubdir
};

var mkdirsSync = mkdirs.mkdirsSync;
var utimesMillisSync$1 = utimes.utimesMillisSync;

function copySync(src, dest, opts) {
  if (typeof opts === 'function') {
    opts = {
      filter: opts
    };
  }

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now

  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber
  // Warn about using preserveTimestamps on 32-bit node

  if (opts.preserveTimestamps && process.arch === 'ia32') {
    console.warn("fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n\n    see https://github.com/jprichardson/node-fs-extra/issues/269");
  }

  var _stat$checkPathsSync = stat_1.checkPathsSync(src, dest, 'copy'),
      srcStat = _stat$checkPathsSync.srcStat,
      destStat = _stat$checkPathsSync.destStat;

  stat_1.checkParentPathsSync(src, srcStat, dest, 'copy');
  return handleFilterAndCopy(destStat, src, dest, opts);
}

function handleFilterAndCopy(destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return;
  var destParent = path__default['default'].dirname(dest);
  if (!gracefulFs.existsSync(destParent)) mkdirsSync(destParent);
  return startCopy(destStat, src, dest, opts);
}

function startCopy(destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return;
  return getStats$1(destStat, src, dest, opts);
}

function getStats$1(destStat, src, dest, opts) {
  var statSync = opts.dereference ? gracefulFs.statSync : gracefulFs.lstatSync;
  var srcStat = statSync(src);
  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
}

function onFile(srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts);
  return mayCopyFile(srcStat, src, dest, opts);
}

function mayCopyFile(srcStat, src, dest, opts) {
  if (opts.overwrite) {
    gracefulFs.unlinkSync(dest);
    return copyFile(srcStat, src, dest, opts);
  } else if (opts.errorOnExist) {
    throw new Error("'".concat(dest, "' already exists"));
  }
}

function copyFile(srcStat, src, dest, opts) {
  gracefulFs.copyFileSync(src, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
  return setDestMode(dest, srcStat.mode);
}

function handleTimestamps(srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src, dest);
}

function fileIsNotWritable(srcMode) {
  return (srcMode & 128) === 0;
}

function makeFileWritable(dest, srcMode) {
  return setDestMode(dest, srcMode | 128);
}

function setDestMode(dest, srcMode) {
  return gracefulFs.chmodSync(dest, srcMode);
}

function setDestTimestamps(src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  var updatedSrcStat = gracefulFs.statSync(src);
  return utimesMillisSync$1(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
}

function onDir(srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);

  if (destStat && !destStat.isDirectory()) {
    throw new Error("Cannot overwrite non-directory '".concat(dest, "' with directory '").concat(src, "'."));
  }

  return copyDir(src, dest, opts);
}

function mkDirAndCopy(srcMode, src, dest, opts) {
  gracefulFs.mkdirSync(dest);
  copyDir(src, dest, opts);
  return setDestMode(dest, srcMode);
}

function copyDir(src, dest, opts) {
  gracefulFs.readdirSync(src).forEach(function (item) {
    return copyDirItem(item, src, dest, opts);
  });
}

function copyDirItem(item, src, dest, opts) {
  var srcItem = path__default['default'].join(src, item);
  var destItem = path__default['default'].join(dest, item);

  var _stat$checkPathsSync2 = stat_1.checkPathsSync(srcItem, destItem, 'copy'),
      destStat = _stat$checkPathsSync2.destStat;

  return startCopy(destStat, srcItem, destItem, opts);
}

function onLink(destStat, src, dest, opts) {
  var resolvedSrc = gracefulFs.readlinkSync(src);

  if (opts.dereference) {
    resolvedSrc = path__default['default'].resolve(process.cwd(), resolvedSrc);
  }

  if (!destStat) {
    return gracefulFs.symlinkSync(resolvedSrc, dest);
  } else {
    var resolvedDest;

    try {
      resolvedDest = gracefulFs.readlinkSync(dest);
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return gracefulFs.symlinkSync(resolvedSrc, dest);
      throw err;
    }

    if (opts.dereference) {
      resolvedDest = path__default['default'].resolve(process.cwd(), resolvedDest);
    }

    if (stat_1.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error("Cannot copy '".concat(resolvedSrc, "' to a subdirectory of itself, '").concat(resolvedDest, "'."));
    } // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.


    if (gracefulFs.statSync(dest).isDirectory() && stat_1.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error("Cannot overwrite '".concat(resolvedDest, "' with '").concat(resolvedSrc, "'."));
    }

    return copyLink(resolvedSrc, dest);
  }
}

function copyLink(resolvedSrc, dest) {
  gracefulFs.unlinkSync(dest);
  return gracefulFs.symlinkSync(resolvedSrc, dest);
}

var copySync_1 = copySync;

var copySync$1 = {
  copySync: copySync_1
};

var u$1 = universalify.fromPromise;

function pathExists(path) {
  return fs_1.access(path).then(function () {
    return true;
  })["catch"](function () {
    return false;
  });
}

var pathExists_1 = {
  pathExists: u$1(pathExists),
  pathExistsSync: fs_1.existsSync
};

var mkdirs$1 = mkdirs.mkdirs;
var pathExists$1 = pathExists_1.pathExists;
var utimesMillis$1 = utimes.utimesMillis;

function copy(src, dest, opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === 'function') {
    opts = {
      filter: opts
    };
  }

  cb = cb || function () {};

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now

  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber
  // Warn about using preserveTimestamps on 32-bit node

  if (opts.preserveTimestamps && process.arch === 'ia32') {
    console.warn("fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n\n    see https://github.com/jprichardson/node-fs-extra/issues/269");
  }

  stat_1.checkPaths(src, dest, 'copy', function (err, stats) {
    if (err) return cb(err);
    var srcStat = stats.srcStat,
        destStat = stats.destStat;
    stat_1.checkParentPaths(src, srcStat, dest, 'copy', function (err) {
      if (err) return cb(err);
      if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb);
      return checkParentDir(destStat, src, dest, opts, cb);
    });
  });
}

function checkParentDir(destStat, src, dest, opts, cb) {
  var destParent = path__default['default'].dirname(dest);
  pathExists$1(destParent, function (err, dirExists) {
    if (err) return cb(err);
    if (dirExists) return startCopy$1(destStat, src, dest, opts, cb);
    mkdirs$1(destParent, function (err) {
      if (err) return cb(err);
      return startCopy$1(destStat, src, dest, opts, cb);
    });
  });
}

function handleFilter(onInclude, destStat, src, dest, opts, cb) {
  Promise.resolve(opts.filter(src, dest)).then(function (include) {
    if (include) return onInclude(destStat, src, dest, opts, cb);
    return cb();
  }, function (error) {
    return cb(error);
  });
}

function startCopy$1(destStat, src, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$2, destStat, src, dest, opts, cb);
  return getStats$2(destStat, src, dest, opts, cb);
}

function getStats$2(destStat, src, dest, opts, cb) {
  var stat = opts.dereference ? gracefulFs.stat : gracefulFs.lstat;
  stat(src, function (err, srcStat) {
    if (err) return cb(err);
    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src, dest, opts, cb);else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src, dest, opts, cb);else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src, dest, opts, cb);
  });
}

function onFile$1(srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return copyFile$1(srcStat, src, dest, opts, cb);
  return mayCopyFile$1(srcStat, src, dest, opts, cb);
}

function mayCopyFile$1(srcStat, src, dest, opts, cb) {
  if (opts.overwrite) {
    gracefulFs.unlink(dest, function (err) {
      if (err) return cb(err);
      return copyFile$1(srcStat, src, dest, opts, cb);
    });
  } else if (opts.errorOnExist) {
    return cb(new Error("'".concat(dest, "' already exists")));
  } else return cb();
}

function copyFile$1(srcStat, src, dest, opts, cb) {
  gracefulFs.copyFile(src, dest, function (err) {
    if (err) return cb(err);
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb);
    return setDestMode$1(dest, srcStat.mode, cb);
  });
}

function handleTimestampsAndMode(srcMode, src, dest, cb) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable$1(srcMode)) {
    return makeFileWritable$1(dest, srcMode, function (err) {
      if (err) return cb(err);
      return setDestTimestampsAndMode(srcMode, src, dest, cb);
    });
  }

  return setDestTimestampsAndMode(srcMode, src, dest, cb);
}

function fileIsNotWritable$1(srcMode) {
  return (srcMode & 128) === 0;
}

function makeFileWritable$1(dest, srcMode, cb) {
  return setDestMode$1(dest, srcMode | 128, cb);
}

function setDestTimestampsAndMode(srcMode, src, dest, cb) {
  setDestTimestamps$1(src, dest, function (err) {
    if (err) return cb(err);
    return setDestMode$1(dest, srcMode, cb);
  });
}

function setDestMode$1(dest, srcMode, cb) {
  return gracefulFs.chmod(dest, srcMode, cb);
}

function setDestTimestamps$1(src, dest, cb) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  gracefulFs.stat(src, function (err, updatedSrcStat) {
    if (err) return cb(err);
    return utimesMillis$1(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
  });
}

function onDir$1(srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy$1(srcStat.mode, src, dest, opts, cb);

  if (destStat && !destStat.isDirectory()) {
    return cb(new Error("Cannot overwrite non-directory '".concat(dest, "' with directory '").concat(src, "'.")));
  }

  return copyDir$1(src, dest, opts, cb);
}

function mkDirAndCopy$1(srcMode, src, dest, opts, cb) {
  gracefulFs.mkdir(dest, function (err) {
    if (err) return cb(err);
    copyDir$1(src, dest, opts, function (err) {
      if (err) return cb(err);
      return setDestMode$1(dest, srcMode, cb);
    });
  });
}

function copyDir$1(src, dest, opts, cb) {
  gracefulFs.readdir(src, function (err, items) {
    if (err) return cb(err);
    return copyDirItems(items, src, dest, opts, cb);
  });
}

function copyDirItems(items, src, dest, opts, cb) {
  var item = items.pop();
  if (!item) return cb();
  return copyDirItem$1(items, item, src, dest, opts, cb);
}

function copyDirItem$1(items, item, src, dest, opts, cb) {
  var srcItem = path__default['default'].join(src, item);
  var destItem = path__default['default'].join(dest, item);
  stat_1.checkPaths(srcItem, destItem, 'copy', function (err, stats) {
    if (err) return cb(err);
    var destStat = stats.destStat;
    startCopy$1(destStat, srcItem, destItem, opts, function (err) {
      if (err) return cb(err);
      return copyDirItems(items, src, dest, opts, cb);
    });
  });
}

function onLink$1(destStat, src, dest, opts, cb) {
  gracefulFs.readlink(src, function (err, resolvedSrc) {
    if (err) return cb(err);

    if (opts.dereference) {
      resolvedSrc = path__default['default'].resolve(process.cwd(), resolvedSrc);
    }

    if (!destStat) {
      return gracefulFs.symlink(resolvedSrc, dest, cb);
    } else {
      gracefulFs.readlink(dest, function (err, resolvedDest) {
        if (err) {
          // dest exists and is a regular file or directory,
          // Windows may throw UNKNOWN error. If dest already exists,
          // fs throws error anyway, so no need to guard against it here.
          if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return gracefulFs.symlink(resolvedSrc, dest, cb);
          return cb(err);
        }

        if (opts.dereference) {
          resolvedDest = path__default['default'].resolve(process.cwd(), resolvedDest);
        }

        if (stat_1.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error("Cannot copy '".concat(resolvedSrc, "' to a subdirectory of itself, '").concat(resolvedDest, "'.")));
        } // do not copy if src is a subdir of dest since unlinking
        // dest in this case would result in removing src contents
        // and therefore a broken symlink would be created.


        if (destStat.isDirectory() && stat_1.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error("Cannot overwrite '".concat(resolvedDest, "' with '").concat(resolvedSrc, "'.")));
        }

        return copyLink$1(resolvedSrc, dest, cb);
      });
    }
  });
}

function copyLink$1(resolvedSrc, dest, cb) {
  gracefulFs.unlink(dest, function (err) {
    if (err) return cb(err);
    return gracefulFs.symlink(resolvedSrc, dest, cb);
  });
}

var copy_1 = copy;

var u$2 = universalify.fromCallback;
var copy$1 = {
  copy: u$2(copy_1)
};

var isWindows = process.platform === 'win32';

function defaults(options) {
  var methods = ['unlink', 'chmod', 'stat', 'lstat', 'rmdir', 'readdir'];
  methods.forEach(function (m) {
    options[m] = options[m] || gracefulFs[m];
    m = m + 'Sync';
    options[m] = options[m] || gracefulFs[m];
  });
  options.maxBusyTries = options.maxBusyTries || 3;
}

function rimraf(p, options, cb) {
  var busyTries = 0;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert__default['default'](p, 'rimraf: missing path');
  assert__default['default'].strictEqual(_typeof_1(p), 'string', 'rimraf: path should be a string');
  assert__default['default'].strictEqual(_typeof_1(cb), 'function', 'rimraf: callback function required');
  assert__default['default'](options, 'rimraf: invalid options argument provided');
  assert__default['default'].strictEqual(_typeof_1(options), 'object', 'rimraf: options should be object');
  defaults(options);
  rimraf_(p, options, function CB(er) {
    if (er) {
      if ((er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') && busyTries < options.maxBusyTries) {
        busyTries++;
        var time = busyTries * 100; // try again, with the same exact callback as this one.

        return setTimeout(function () {
          return rimraf_(p, options, CB);
        }, time);
      } // already gone


      if (er.code === 'ENOENT') er = null;
    }

    cb(er);
  });
} // Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.


function rimraf_(p, options, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function'); // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.

  options.lstat(p, function (er, st) {
    if (er && er.code === 'ENOENT') {
      return cb(null);
    } // Windows can EPERM on stat.  Life is suffering.


    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb);
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb);
    }

    options.unlink(p, function (er) {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null);
        }

        if (er.code === 'EPERM') {
          return isWindows ? fixWinEPERM(p, options, er, cb) : rmdir(p, options, er, cb);
        }

        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb);
        }
      }

      return cb(er);
    });
  });
}

function fixWinEPERM(p, options, er, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function');
  options.chmod(p, 438, function (er2) {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er);
    } else {
      options.stat(p, function (er3, stats) {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}

function fixWinEPERMSync(p, options, er) {
  var stats;
  assert__default['default'](p);
  assert__default['default'](options);

  try {
    options.chmodSync(p, 438);
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return;
    } else {
      throw er;
    }
  }

  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return;
    } else {
      throw er;
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}

function rmdir(p, options, originalEr, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function'); // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.

  options.rmdir(p, function (er) {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb);
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}

function rmkids(p, options, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function');
  options.readdir(p, function (er, files) {
    if (er) return cb(er);
    var n = files.length;
    var errState;
    if (n === 0) return options.rmdir(p, cb);
    files.forEach(function (f) {
      rimraf(path__default['default'].join(p, f), options, function (er) {
        if (errState) {
          return;
        }

        if (er) return cb(errState = er);

        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
} // this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.


function rimrafSync(p, options) {
  var st;
  options = options || {};
  defaults(options);
  assert__default['default'](p, 'rimraf: missing path');
  assert__default['default'].strictEqual(_typeof_1(p), 'string', 'rimraf: path should be a string');
  assert__default['default'](options, 'rimraf: missing options');
  assert__default['default'].strictEqual(_typeof_1(options), 'object', 'rimraf: options should be object');

  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === 'ENOENT') {
      return;
    } // Windows can EPERM on stat.  Life is suffering.


    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return;
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
    } else if (er.code !== 'EISDIR') {
      throw er;
    }

    rmdirSync(p, options, er);
  }
}

function rmdirSync(p, options, originalEr) {
  assert__default['default'](p);
  assert__default['default'](options);

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr;
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options);
    } else if (er.code !== 'ENOENT') {
      throw er;
    }
  }
}

function rmkidsSync(p, options) {
  assert__default['default'](p);
  assert__default['default'](options);
  options.readdirSync(p).forEach(function (f) {
    return rimrafSync(path__default['default'].join(p, f), options);
  });

  if (isWindows) {
    // We only end up here once we got ENOTEMPTY at least once, and
    // at this point, we are guaranteed to have removed all the kids.
    // So, we know that it won't be ENOENT or ENOTDIR or anything else.
    // try really hard to delete stuff on windows, because it has a
    // PROFOUNDLY annoying habit of not closing handles promptly when
    // files are deleted, resulting in spurious ENOTEMPTY errors.
    var startTime = Date.now();

    do {
      try {
        var ret = options.rmdirSync(p, options);
        return ret;
      } catch (_unused) {}
    } while (Date.now() - startTime < 500); // give up after 500ms

  } else {
    var _ret = options.rmdirSync(p, options);

    return _ret;
  }
}

var rimraf_1 = rimraf;
rimraf.sync = rimrafSync;

var u$3 = universalify.fromCallback;
var remove = {
  remove: u$3(rimraf_1),
  removeSync: rimraf_1.sync
};

var u$4 = universalify.fromCallback;
var emptyDir = u$4(function emptyDir(dir, callback) {
  callback = callback || function () {};

  gracefulFs.readdir(dir, function (err, items) {
    if (err) return mkdirs.mkdirs(dir, callback);
    items = items.map(function (item) {
      return path__default['default'].join(dir, item);
    });
    deleteItem();

    function deleteItem() {
      var item = items.pop();
      if (!item) return callback();
      remove.remove(item, function (err) {
        if (err) return callback(err);
        deleteItem();
      });
    }
  });
});

function emptyDirSync(dir) {
  var items;

  try {
    items = gracefulFs.readdirSync(dir);
  } catch (_unused) {
    return mkdirs.mkdirsSync(dir);
  }

  items.forEach(function (item) {
    item = path__default['default'].join(dir, item);
    remove.removeSync(item);
  });
}

var empty = {
  emptyDirSync: emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir: emptyDir,
  emptydir: emptyDir
};

var u$5 = universalify.fromCallback;

function createFile(file, callback) {
  function makeFile() {
    gracefulFs.writeFile(file, '', function (err) {
      if (err) return callback(err);
      callback();
    });
  }

  gracefulFs.stat(file, function (err, stats) {
    // eslint-disable-line handle-callback-err
    if (!err && stats.isFile()) return callback();
    var dir = path__default['default'].dirname(file);
    gracefulFs.stat(dir, function (err, stats) {
      if (err) {
        // if the directory doesn't exist, make it
        if (err.code === 'ENOENT') {
          return mkdirs.mkdirs(dir, function (err) {
            if (err) return callback(err);
            makeFile();
          });
        }

        return callback(err);
      }

      if (stats.isDirectory()) makeFile();else {
        // parent is not a directory
        // This is just to cause an internal ENOTDIR error to be thrown
        gracefulFs.readdir(dir, function (err) {
          if (err) return callback(err);
        });
      }
    });
  });
}

function createFileSync(file) {
  var stats;

  try {
    stats = gracefulFs.statSync(file);
  } catch (_unused) {}

  if (stats && stats.isFile()) return;
  var dir = path__default['default'].dirname(file);

  try {
    if (!gracefulFs.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      gracefulFs.readdirSync(dir);
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdirs.mkdirsSync(dir);else throw err;
  }

  gracefulFs.writeFileSync(file, '');
}

var file = {
  createFile: u$5(createFile),
  createFileSync: createFileSync
};

var u$6 = universalify.fromCallback;
var pathExists$2 = pathExists_1.pathExists;

function createLink(srcpath, dstpath, callback) {
  function makeLink(srcpath, dstpath) {
    gracefulFs.link(srcpath, dstpath, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  }

  pathExists$2(dstpath, function (err, destinationExists) {
    if (err) return callback(err);
    if (destinationExists) return callback(null);
    gracefulFs.lstat(srcpath, function (err) {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink');
        return callback(err);
      }

      var dir = path__default['default'].dirname(dstpath);
      pathExists$2(dir, function (err, dirExists) {
        if (err) return callback(err);
        if (dirExists) return makeLink(srcpath, dstpath);
        mkdirs.mkdirs(dir, function (err) {
          if (err) return callback(err);
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}

function createLinkSync(srcpath, dstpath) {
  var destinationExists = gracefulFs.existsSync(dstpath);
  if (destinationExists) return undefined;

  try {
    gracefulFs.lstatSync(srcpath);
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err;
  }

  var dir = path__default['default'].dirname(dstpath);
  var dirExists = gracefulFs.existsSync(dir);
  if (dirExists) return gracefulFs.linkSync(srcpath, dstpath);
  mkdirs.mkdirsSync(dir);
  return gracefulFs.linkSync(srcpath, dstpath);
}

var link = {
  createLink: u$6(createLink),
  createLinkSync: createLinkSync
};

var pathExists$3 = pathExists_1.pathExists;
/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths(srcpath, dstpath, callback) {
  if (path__default['default'].isAbsolute(srcpath)) {
    return gracefulFs.lstat(srcpath, function (err) {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink');
        return callback(err);
      }

      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      });
    });
  } else {
    var dstdir = path__default['default'].dirname(dstpath);
    var relativeToDst = path__default['default'].join(dstdir, srcpath);
    return pathExists$3(relativeToDst, function (err, exists) {
      if (err) return callback(err);

      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        });
      } else {
        return gracefulFs.lstat(srcpath, function (err) {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink');
            return callback(err);
          }

          return callback(null, {
            toCwd: srcpath,
            toDst: path__default['default'].relative(dstdir, srcpath)
          });
        });
      }
    });
  }
}

function symlinkPathsSync(srcpath, dstpath) {
  var exists;

  if (path__default['default'].isAbsolute(srcpath)) {
    exists = gracefulFs.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist');
    return {
      toCwd: srcpath,
      toDst: srcpath
    };
  } else {
    var dstdir = path__default['default'].dirname(dstpath);
    var relativeToDst = path__default['default'].join(dstdir, srcpath);
    exists = gracefulFs.existsSync(relativeToDst);

    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    } else {
      exists = gracefulFs.existsSync(srcpath);
      if (!exists) throw new Error('relative srcpath does not exist');
      return {
        toCwd: srcpath,
        toDst: path__default['default'].relative(dstdir, srcpath)
      };
    }
  }
}

var symlinkPaths_1 = {
  symlinkPaths: symlinkPaths,
  symlinkPathsSync: symlinkPathsSync
};

function symlinkType(srcpath, type, callback) {
  callback = typeof type === 'function' ? type : callback;
  type = typeof type === 'function' ? false : type;
  if (type) return callback(null, type);
  gracefulFs.lstat(srcpath, function (err, stats) {
    if (err) return callback(null, 'file');
    type = stats && stats.isDirectory() ? 'dir' : 'file';
    callback(null, type);
  });
}

function symlinkTypeSync(srcpath, type) {
  var stats;
  if (type) return type;

  try {
    stats = gracefulFs.lstatSync(srcpath);
  } catch (_unused) {
    return 'file';
  }

  return stats && stats.isDirectory() ? 'dir' : 'file';
}

var symlinkType_1 = {
  symlinkType: symlinkType,
  symlinkTypeSync: symlinkTypeSync
};

var u$7 = universalify.fromCallback;
var mkdirs$2 = mkdirs.mkdirs;
var mkdirsSync$1 = mkdirs.mkdirsSync;
var symlinkPaths$1 = symlinkPaths_1.symlinkPaths;
var symlinkPathsSync$1 = symlinkPaths_1.symlinkPathsSync;
var symlinkType$1 = symlinkType_1.symlinkType;
var symlinkTypeSync$1 = symlinkType_1.symlinkTypeSync;
var pathExists$4 = pathExists_1.pathExists;

function createSymlink(srcpath, dstpath, type, callback) {
  callback = typeof type === 'function' ? type : callback;
  type = typeof type === 'function' ? false : type;
  pathExists$4(dstpath, function (err, destinationExists) {
    if (err) return callback(err);
    if (destinationExists) return callback(null);
    symlinkPaths$1(srcpath, dstpath, function (err, relative) {
      if (err) return callback(err);
      srcpath = relative.toDst;
      symlinkType$1(relative.toCwd, type, function (err, type) {
        if (err) return callback(err);
        var dir = path__default['default'].dirname(dstpath);
        pathExists$4(dir, function (err, dirExists) {
          if (err) return callback(err);
          if (dirExists) return gracefulFs.symlink(srcpath, dstpath, type, callback);
          mkdirs$2(dir, function (err) {
            if (err) return callback(err);
            gracefulFs.symlink(srcpath, dstpath, type, callback);
          });
        });
      });
    });
  });
}

function createSymlinkSync(srcpath, dstpath, type) {
  var destinationExists = gracefulFs.existsSync(dstpath);
  if (destinationExists) return undefined;
  var relative = symlinkPathsSync$1(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync$1(relative.toCwd, type);
  var dir = path__default['default'].dirname(dstpath);
  var exists = gracefulFs.existsSync(dir);
  if (exists) return gracefulFs.symlinkSync(srcpath, dstpath, type);
  mkdirsSync$1(dir);
  return gracefulFs.symlinkSync(srcpath, dstpath, type);
}

var symlink = {
  createSymlink: u$7(createSymlink),
  createSymlinkSync: createSymlinkSync
};

var ensure = {
  // file
  createFile: file.createFile,
  createFileSync: file.createFileSync,
  ensureFile: file.createFile,
  ensureFileSync: file.createFileSync,
  // link
  createLink: link.createLink,
  createLinkSync: link.createLinkSync,
  ensureLink: link.createLink,
  ensureLinkSync: link.createLinkSync,
  // symlink
  createSymlink: symlink.createSymlink,
  createSymlinkSync: symlink.createSymlinkSync,
  ensureSymlink: symlink.createSymlink,
  ensureSymlinkSync: symlink.createSymlinkSync
};

var fromCallback$1 = function fromCallback(fn) {
  return Object.defineProperty(function () {
    var _this = this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof args[args.length - 1] === 'function') fn.apply(this, args);else {
      return new Promise(function (resolve, reject) {
        fn.call.apply(fn, [_this].concat(args, [function (err, res) {
          return err != null ? reject(err) : resolve(res);
        }]));
      });
    }
  }, 'name', {
    value: fn.name
  });
};

var fromPromise$1 = function fromPromise(fn) {
  return Object.defineProperty(function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var cb = args[args.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, args);else fn.apply(this, args.slice(0, -1)).then(function (r) {
      return cb(null, r);
    }, cb);
  }, 'name', {
    value: fn.name
  });
};

var universalify$1 = {
  fromCallback: fromCallback$1,
  fromPromise: fromPromise$1
};

function stringify(obj) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$EOL = _ref.EOL,
      EOL = _ref$EOL === void 0 ? '\n' : _ref$EOL,
      _ref$finalEOL = _ref.finalEOL,
      finalEOL = _ref$finalEOL === void 0 ? true : _ref$finalEOL,
      _ref$replacer = _ref.replacer,
      replacer = _ref$replacer === void 0 ? null : _ref$replacer,
      spaces = _ref.spaces;

  var EOF = finalEOL ? EOL : '';
  var str = JSON.stringify(obj, replacer, spaces);
  return str.replace(/\n/g, EOL) + EOF;
}

function stripBom(content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  return content.replace(/^\uFEFF/, '');
}

var utils = {
  stringify: stringify,
  stripBom: stripBom
};

var _fs;

try {
  _fs = gracefulFs;
} catch (_) {
  _fs = fs__default['default'];
}

var stringify$1 = utils.stringify,
    stripBom$1 = utils.stripBom;

function _readFile(_x) {
  return _readFile2.apply(this, arguments);
}

function _readFile2() {
  _readFile2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(file) {
    var options,
        fs,
        shouldThrow,
        data,
        obj,
        _args = arguments;
    return regenerator.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};

            if (typeof options === 'string') {
              options = {
                encoding: options
              };
            }

            fs = options.fs || _fs;
            shouldThrow = 'throws' in options ? options["throws"] : true;
            _context.next = 6;
            return universalify$1.fromCallback(fs.readFile)(file, options);

          case 6:
            data = _context.sent;
            data = stripBom$1(data);
            _context.prev = 8;
            obj = JSON.parse(data, options ? options.reviver : null);
            _context.next = 20;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](8);

            if (!shouldThrow) {
              _context.next = 19;
              break;
            }

            _context.t0.message = "".concat(file, ": ").concat(_context.t0.message);
            throw _context.t0;

          case 19:
            return _context.abrupt("return", null);

          case 20:
            return _context.abrupt("return", obj);

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[8, 12]]);
  }));
  return _readFile2.apply(this, arguments);
}

var readFile = universalify$1.fromPromise(_readFile);

function readFileSync(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (typeof options === 'string') {
    options = {
      encoding: options
    };
  }

  var fs = options.fs || _fs;
  var shouldThrow = 'throws' in options ? options["throws"] : true;

  try {
    var content = fs.readFileSync(file, options);
    content = stripBom$1(content);
    return JSON.parse(content, options.reviver);
  } catch (err) {
    if (shouldThrow) {
      err.message = "".concat(file, ": ").concat(err.message);
      throw err;
    } else {
      return null;
    }
  }
}

function _writeFile(_x2, _x3) {
  return _writeFile2.apply(this, arguments);
}

function _writeFile2() {
  _writeFile2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(file, obj) {
    var options,
        fs,
        str,
        _args2 = arguments;
    return regenerator.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            options = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};
            fs = options.fs || _fs;
            str = stringify$1(obj, options);
            _context2.next = 5;
            return universalify$1.fromCallback(fs.writeFile)(file, str, options);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _writeFile2.apply(this, arguments);
}

var writeFile = universalify$1.fromPromise(_writeFile);

function writeFileSync(file, obj) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var fs = options.fs || _fs;
  var str = stringify$1(obj, options); // not sure if fs.writeFileSync returns anything, but just in case

  return fs.writeFileSync(file, str, options);
}

var jsonfile = {
  readFile: readFile,
  readFileSync: readFileSync,
  writeFile: writeFile,
  writeFileSync: writeFileSync
};
var jsonfile_1 = jsonfile;

var jsonfile$1 = {
  // jsonfile exports
  readJson: jsonfile_1.readFile,
  readJsonSync: jsonfile_1.readFileSync,
  writeJson: jsonfile_1.writeFile,
  writeJsonSync: jsonfile_1.writeFileSync
};

var u$8 = universalify.fromCallback;
var pathExists$5 = pathExists_1.pathExists;

function outputFile(file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = 'utf8';
  }

  var dir = path__default['default'].dirname(file);
  pathExists$5(dir, function (err, itDoes) {
    if (err) return callback(err);
    if (itDoes) return gracefulFs.writeFile(file, data, encoding, callback);
    mkdirs.mkdirs(dir, function (err) {
      if (err) return callback(err);
      gracefulFs.writeFile(file, data, encoding, callback);
    });
  });
}

function outputFileSync(file) {
  var dir = path__default['default'].dirname(file);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (gracefulFs.existsSync(dir)) {
    return gracefulFs.writeFileSync.apply(gracefulFs, [file].concat(args));
  }

  mkdirs.mkdirsSync(dir);
  gracefulFs.writeFileSync.apply(gracefulFs, [file].concat(args));
}

var output = {
  outputFile: u$8(outputFile),
  outputFileSync: outputFileSync
};

var stringify$2 = utils.stringify;
var outputFile$1 = output.outputFile;

function outputJson(_x, _x2) {
  return _outputJson.apply(this, arguments);
}

function _outputJson() {
  _outputJson = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(file, data) {
    var options,
        str,
        _args = arguments;
    return regenerator.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};
            str = stringify$2(data, options);
            _context.next = 4;
            return outputFile$1(file, str, options);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _outputJson.apply(this, arguments);
}

var outputJson_1 = outputJson;

var stringify$3 = utils.stringify;
var outputFileSync$1 = output.outputFileSync;

function outputJsonSync(file, data, options) {
  var str = stringify$3(data, options);
  outputFileSync$1(file, str, options);
}

var outputJsonSync_1 = outputJsonSync;

var u$9 = universalify.fromPromise;
jsonfile$1.outputJson = u$9(outputJson_1);
jsonfile$1.outputJsonSync = outputJsonSync_1; // aliases

jsonfile$1.outputJSON = jsonfile$1.outputJson;
jsonfile$1.outputJSONSync = jsonfile$1.outputJsonSync;
jsonfile$1.writeJSON = jsonfile$1.writeJson;
jsonfile$1.writeJSONSync = jsonfile$1.writeJsonSync;
jsonfile$1.readJSON = jsonfile$1.readJson;
jsonfile$1.readJSONSync = jsonfile$1.readJsonSync;
var json = jsonfile$1;

var copySync$2 = copySync$1.copySync;
var removeSync = remove.removeSync;
var mkdirpSync = mkdirs.mkdirpSync;

function moveSync(src, dest, opts) {
  opts = opts || {};
  var overwrite = opts.overwrite || opts.clobber || false;

  var _stat$checkPathsSync = stat_1.checkPathsSync(src, dest, 'move'),
      srcStat = _stat$checkPathsSync.srcStat;

  stat_1.checkParentPathsSync(src, srcStat, dest, 'move');
  mkdirpSync(path__default['default'].dirname(dest));
  return doRename(src, dest, overwrite);
}

function doRename(src, dest, overwrite) {
  if (overwrite) {
    removeSync(dest);
    return rename(src, dest, overwrite);
  }

  if (gracefulFs.existsSync(dest)) throw new Error('dest already exists.');
  return rename(src, dest, overwrite);
}

function rename(src, dest, overwrite) {
  try {
    gracefulFs.renameSync(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    return moveAcrossDevice(src, dest, overwrite);
  }
}

function moveAcrossDevice(src, dest, overwrite) {
  var opts = {
    overwrite: overwrite,
    errorOnExist: true
  };
  copySync$2(src, dest, opts);
  return removeSync(src);
}

var moveSync_1 = moveSync;

var moveSync$1 = {
  moveSync: moveSync_1
};

var copy$2 = copy$1.copy;
var remove$1 = remove.remove;
var mkdirp = mkdirs.mkdirp;
var pathExists$6 = pathExists_1.pathExists;

function move(src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  var overwrite = opts.overwrite || opts.clobber || false;
  stat_1.checkPaths(src, dest, 'move', function (err, stats) {
    if (err) return cb(err);
    var srcStat = stats.srcStat;
    stat_1.checkParentPaths(src, srcStat, dest, 'move', function (err) {
      if (err) return cb(err);
      mkdirp(path__default['default'].dirname(dest), function (err) {
        if (err) return cb(err);
        return doRename$1(src, dest, overwrite, cb);
      });
    });
  });
}

function doRename$1(src, dest, overwrite, cb) {
  if (overwrite) {
    return remove$1(dest, function (err) {
      if (err) return cb(err);
      return rename$1(src, dest, overwrite, cb);
    });
  }

  pathExists$6(dest, function (err, destExists) {
    if (err) return cb(err);
    if (destExists) return cb(new Error('dest already exists.'));
    return rename$1(src, dest, overwrite, cb);
  });
}

function rename$1(src, dest, overwrite, cb) {
  gracefulFs.rename(src, dest, function (err) {
    if (!err) return cb();
    if (err.code !== 'EXDEV') return cb(err);
    return moveAcrossDevice$1(src, dest, overwrite, cb);
  });
}

function moveAcrossDevice$1(src, dest, overwrite, cb) {
  var opts = {
    overwrite: overwrite,
    errorOnExist: true
  };
  copy$2(src, dest, opts, function (err) {
    if (err) return cb(err);
    return remove$1(src, cb);
  });
}

var move_1 = move;

var u$a = universalify.fromCallback;
var move$1 = {
  move: u$a(move_1)
};

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var lib = createCommonjsModule(function (module) {

  module.exports = _objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1({}, fs_1), copySync$1), copy$1), empty), ensure), json), mkdirs), moveSync$1), move$1), output), pathExists_1), remove); // Export fs.promises as a getter property so that we don't trigger
  // ExperimentalWarning before fs.promises is actually accessed.

  if (Object.getOwnPropertyDescriptor(fs__default['default'], 'promises')) {
    Object.defineProperty(module.exports, 'promises', {
      get: function get() {
        return fs__default['default'].promises;
      }
    });
  }
});

var FileUtil = /** @class */ (function () {
    function FileUtil() {
    }
    FileUtil.handle = function (messages) {
        var _this = this;
        var langs = Object.keys(messages);
        // const cnMessages = messages['cn']
        langs.forEach(function (lang) {
            _this.writeJSONSync(lang, messages[lang], { dirName: 'langs' });
        });
    };
    FileUtil.writeJSONSync = function (fileName, object, option) {
        var filePath = path__default['default'].resolve(__dirname, "output/" + (option && option.dirName || 'options') + "/" + fileName + ".json");
        lib.removeSync(filePath);
        lib.ensureFileSync(filePath);
        return lib.writeJsonSync(filePath, object, { spaces: 2 });
    };
    FileUtil.writeFileSync = function (filePath, data) {
        filePath = path__default['default'].resolve(__dirname, "output/langs/" + filePath);
        lib.removeSync(filePath);
        lib.ensureFileSync(filePath);
        return lib.writeFileSync(filePath, data);
    };
    return FileUtil;
}());

var Finder = /** @class */ (function () {
    function Finder(messages, cnRegExp) {
        this.messages = messages;
        this.cnRegExp = cnRegExp;
    }
    Finder.prototype.handle = function () {
        var _this = this;
        var messages = this.messages;
        var keys = Object.keys(messages);
        var localMessageObj = messages['cn'];
        var flattenCNObj = this.flatten(localMessageObj);
        var findKeys = this.findKeys(flattenCNObj, this.cnRegExp);
        return keys.reduce(function (obj, key) {
            var localMessageObj = messages[key];
            var flattenObj = _this.flatten(localMessageObj);
            obj[key] = _this.filterValues(flattenObj, findKeys);
            return obj;
        }, {});
    };
    // Object平铺
    Finder.prototype.flatten = function (localMessageObj, prefixKey, obj) {
        var _this = this;
        if (prefixKey === void 0) {
            prefixKey = '';
        }
        if (obj === void 0) {
            obj = {};
        }
        var keys = Object.keys(localMessageObj);
        return keys.reduce(function (obj, key) {
            var value = localMessageObj[key];
            var k = prefixKey + (prefixKey === '' ? '' : '.') + key;
            if (typeof value === 'function') {
                throw new Error('该工具不支持Function转换');
            }
            if (typeof value !== 'object') {
                obj[k] = value;
            }
            else {
                _this.flatten(value, k, obj);
            }
            return obj;
        }, obj);
    };
    // 检索符合条件的key
    Finder.prototype.findKeys = function (localMessageObj, regExp) {
        var keys = Object.keys(localMessageObj);
        var result = [];
        return keys.reduce(function (arr, key) {
            var value = localMessageObj[key];
            if (regExp.test(value)) {
                arr.push(key);
            }
            return arr;
        }, result);
    };
    // 查找匹配keys的value，组成新的object
    Finder.prototype.filterValues = function (localMessageObj, keys) {
        return keys.reduce(function (obj, key) {
            obj[key] = localMessageObj[key];
            return obj;
        }, {});
    };
    return Finder;
}());

var VueI18nReplacer = /** @class */ (function () {
    function VueI18nReplacer(langs, cnKeywords, cnReplacer) {
        this.langs = langs;
        this.keywords = cnKeywords;
        this.replacer = cnReplacer;
    }
    VueI18nReplacer.prototype.eval = function (filePath) {
        var _this = this;
        // json文件不需要编译
        if (filePath.endsWith('.json')) {
            return { default: require(filePath) };
        }
        var result = babel__default['default'].transformFileSync(filePath, {
            configFile: path__default['default'].resolve(__dirname, 'babel.config.js')
        });
        return _eval(result.code, filePath, {
            require: function (p) {
                var res = resolve.sync(p, { basedir: path__default['default'].dirname(filePath) });
                return _this.eval(res);
            }
        });
    };
    VueI18nReplacer.prototype.generateDir = function () {
        var _this = this;
        var configPath = path__default['default'].resolve(__dirname, './locale.config.js');
        var config = require(configPath);
        var projectNames = Object.keys(config);
        var output = this.langs.reduce(function (obj, lang) {
            obj[lang] = {};
            return obj;
        }, {});
        projectNames.forEach(function (projectName) {
            var locales = config[projectName];
            var languages = Object.keys(locales);
            // 查找
            var localeMessages = languages.reduce(function (obj, lang) {
                var messages = _this.eval(path__default['default'].resolve(__dirname, locales[lang])).default;
                obj[lang] = messages;
                return obj;
            }, {});
            var finder = new Finder(localeMessages, _this.keywords);
            var findMessages = finder.handle();
            Object.keys(findMessages).forEach(function (lang) {
                var _a;
                output[lang] = Object.assign({}, output[lang], (_a = {},
                    _a[projectName] = findMessages[lang],
                    _a));
            });
        });
        // 生成文件
        return FileUtil.handle(this.filterSameValues(output));
    };
    VueI18nReplacer.prototype.filterSameValues = function (output) {
        var _this = this;
        var sameValueItems = [];
        for (var lang in output) {
            var projects = output[lang];
            for (var projectName in projects) {
                var messages = projects[projectName];
                var _loop_1 = function (key) {
                    var v = messages[key];
                    if (v) {
                        var value_1 = v.toString();
                        var findItem = sameValueItems.find(function (item) { return item.value === value_1; });
                        if (!findItem) {
                            sameValueItems.push({ value: value_1, keys: [{ projectName: projectName, lang: lang, key: key }] });
                        }
                        else {
                            findItem.keys.push({ projectName: projectName, lang: lang, key: key });
                        }
                    }
                };
                for (var key in messages) {
                    _loop_1(key);
                }
            }
        }
        sameValueItems = sameValueItems.filter(function (item) { return item.keys.length > 1; });
        FileUtil.writeJSONSync('equalValues', sameValueItems);
        //
        var output2 = {};
        var _loop_2 = function (lang) {
            var projects = output[lang];
            var _loop_3 = function (projectName) {
                var messages = projects[projectName];
                var _loop_4 = function (key) {
                    var v = messages[key];
                    // cn是用来参考的，因此不合并同值项
                    if (lang !== 'cn' && sameValueItems.find(function (item) {
                        return item.value === v && !_this.isSameKey({
                            key: key,
                            projectName: projectName,
                            lang: lang
                        }, item.keys[0]);
                    })) {
                        return "continue";
                    }
                    if (lang === 'cn') {
                        v = this_1.replacer(v.toString(), this_1.keywords);
                    }
                    this_1.assignKey(output2, lang, projectName)[key] = v;
                };
                for (var key in messages) {
                    _loop_4(key);
                }
            };
            for (var projectName in projects) {
                _loop_3(projectName);
            }
        };
        var this_1 = this;
        for (var lang in output) {
            _loop_2(lang);
        }
        return output2;
    };
    VueI18nReplacer.prototype.isSameKey = function (key1, key2) {
        return key1.projectName === key2.projectName && key1.key === key2.key && key1.lang === key2.lang;
    };
    VueI18nReplacer.prototype.assignKey = function (obj) {
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        return keys.reduce(function (obj, key) {
            if (obj[key] === undefined) {
                obj[key] = {};
            }
            return obj[key];
        }, obj);
    };
    return VueI18nReplacer;
}());
// const replacer = new VueI18nReplacer(['cn', 'en', 'ja', 'ru', 'ko'], /(充值|提现)/, (v) => {
//     v = v.toString().replace(/充值/g, '充币')
//     v = v.toString().replace(/提现/g, '提币')
//     return v
// })
var replacer = new VueI18nReplacer(['cn', 'en', 'ja', 'ru', 'ko'], /(请输入|广告)/, function (v) {
    v = v.toString().replace(/请输入/g, '敬请输入');
    v = v.toString().replace(/广告/g, '洗脑广告');
    return v;
});
replacer.generateDir();
var info = "\u7FFB\u8BD1\u9700\u6C42\uFF1A\u539F\u6765cn.json\u6587\u4EF6\u4E2D\u7684\u3010\u5145\u503C\u3011\u5168\u90E8\u6539\u6210\u3010\u5145\u5E01\u3011\uFF0C\u3010\u63D0\u73B0\u3011\u5168\u90E8\u6539\u6210\u3010\u63D0\u5E01\u3011,\u5404\u4E2A\u8BED\u8A00\u7248\u672C\u8FDB\u884C\u5404\u81EA\u7684\u4FEE\u6539\u548C\u6821\u5BF9\u3002\n\u7FFB\u8BD1\u8BF4\u660E\uFF1A\n1. langs\u76EE\u5F55\u91CC\u7684\u6BCF\u4E2A\u8BED\u8A00\u6587\u4EF6\u5BF9\u5E94\u5404\u81EA\u7684\u7FFB\u8BD1\uFF0C\u5B83\u662F\u4E00\u4E2Ajson\u952E\u503C\u6587\u4EF6\uFF0C\u53EA\u9700\u8981\u6839\u636E\u9700\u6C42\u4FEE\u6539\u503C\u5373\u53EF\uFF0C\u5343\u4E07\u4E0D\u8981\u66F4\u6539\u952E\u540D\u3002\n\u5982 \u3010\"depositStatus.successed\": \"Successful\"\u3011 \u53EA\u9700\u8981\u4FEE\u6539\u91CC\u9762\u7684\u503C\u3010Successful\u3011\u3002\n2. \u4E0D\u8981\u4FEE\u6539json\u6587\u4EF6\u4E2D\u7684\u53CC\u5F15\u53F7\uFF0C\u5B83\u662Fjson\u683C\u5F0F\u672C\u8EAB\u7684\u4E00\u90E8\u5206\u3002\n3. \u5982\u679C\u81EA\u5DF1\u7684\u8BED\u8A00\u6587\u4EF6\u4E0D\u6E05\u695A\u65B0\u7684\u4E2D\u6587\u7FFB\u8BD1\uFF0C\u53EF\u53C2\u8003cn.json\u4E2D\u540C\u540D\u952E\u540D\u5BF9\u5E94\u7684\u4E2D\u6587\u503C\uFF08cn.json\u5DF2\u7ECF\u662F\u7ECF\u8FC7\u4FEE\u6539\u5B8C\u6210\u540E\u7684\u6587\u4EF6)\u3002\n4. \u5404\u81EA\u7684\u8BED\u8A00.json\u6587\u4EF6\u5DF2\u7ECF\u8FDB\u884C\u4E86\u76F8\u540C\u7FFB\u8BD1\u8BED\u53E5\u7684\u5408\u5E76\uFF0C\u4EE5\u4FBF\u51CF\u8F7B\u60A8\u7684\u5DE5\u4F5C\u91CF\u3002\n5. \u7FFB\u8BD1\u5B8C\u6BD5\uFF0C\u8BF7\u60A8\u628A\u7FFB\u8BD1\u540E\u7684.json\u6587\u4EF6\u4F20\u7ED9\u539F\u5F00\u53D1\u8005\u5373\u53EF\u3002\n\u6700\u540E\uFF0C\u611F\u8C22\u60A8\u7684\u8F9B\u52E4\u4ED8\u51FA~";
FileUtil.writeFileSync('翻译说明.txt', info);
console.log('查找的文件夹已经生成');

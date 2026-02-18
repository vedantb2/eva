"use strict";
const electron = require("electron");
const require$$2 = require("path");
const require$$0 = require("events");
const require$$0$2 = require("fs");
const require$$1 = require("os");
const require$$3 = require("child_process");
const require$$4 = require("net");
const require$$0$1 = require("worker_threads");
const require$$2$1 = require("tty");
const util = require("util");
const IPC_CHANNELS = {
  // PTY / Terminal
  PTY_SPAWN: "pty:spawn",
  PTY_INPUT: "pty:input",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_DATA: "pty:data",
  PTY_EXIT: "pty:exit",
  // Agent lifecycle
  AGENT_SPAWN: "agent:spawn",
  AGENT_KILL: "agent:kill",
  AGENT_LIST: "agent:list",
  AGENT_STATUS: "agent:status",
  // Git
  GIT_WORKTREE_ADD: "git:worktree:add",
  GIT_WORKTREE_REMOVE: "git:worktree:remove",
  GIT_DIFF: "git:diff",
  GIT_BRANCHES: "git:branches",
  // Dialog
  DIALOG_OPEN_DIRECTORY: "dialog:openDirectory",
  // Shell
  OPEN_IN_FINDER: "shell:openInFinder",
  OPEN_EXTERNAL: "shell:openExternal",
};
var lib = {};
function commonjsRequire(path) {
  throw new Error(
    'Could not dynamically require "' +
      path +
      '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.',
  );
}
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  Object.defineProperty(utils, "__esModule", { value: true });
  utils.loadNativeModule = utils.assign = void 0;
  function assign(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      sources[_i - 1] = arguments[_i];
    }
    sources.forEach(function (source) {
      return Object.keys(source).forEach(function (key) {
        return (target[key] = source[key]);
      });
    });
    return target;
  }
  utils.assign = assign;
  function loadNativeModule(name) {
    var dirs = [
      "build/Release",
      "build/Debug",
      "prebuilds/" + process.platform + "-" + process.arch,
    ];
    var relative = ["..", "."];
    var lastError;
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
      var d = dirs_1[_i];
      for (var _a = 0, relative_1 = relative; _a < relative_1.length; _a++) {
        var r = relative_1[_a];
        var dir = r + "/" + d + "/";
        try {
          return { dir, module: commonjsRequire(dir + "/" + name + ".node") };
        } catch (e) {
          lastError = e;
        }
      }
    }
    throw new Error(
      "Failed to load native module: " +
        name +
        ".node, checked: " +
        dirs.join(", ") +
        ": " +
        lastError,
    );
  }
  utils.loadNativeModule = loadNativeModule;
  return utils;
}
var windowsTerminal = {};
var terminal = {};
var eventEmitter2 = {};
var hasRequiredEventEmitter2;
function requireEventEmitter2() {
  if (hasRequiredEventEmitter2) return eventEmitter2;
  hasRequiredEventEmitter2 = 1;
  Object.defineProperty(eventEmitter2, "__esModule", { value: true });
  eventEmitter2.EventEmitter2 = void 0;
  var EventEmitter2 =
    /** @class */
    (function () {
      function EventEmitter22() {
        this._listeners = [];
      }
      Object.defineProperty(EventEmitter22.prototype, "event", {
        get: function () {
          var _this = this;
          if (!this._event) {
            this._event = function (listener) {
              _this._listeners.push(listener);
              var disposable = {
                dispose: function () {
                  for (var i = 0; i < _this._listeners.length; i++) {
                    if (_this._listeners[i] === listener) {
                      _this._listeners.splice(i, 1);
                      return;
                    }
                  }
                },
              };
              return disposable;
            };
          }
          return this._event;
        },
        enumerable: false,
        configurable: true,
      });
      EventEmitter22.prototype.fire = function (data) {
        var queue = [];
        for (var i = 0; i < this._listeners.length; i++) {
          queue.push(this._listeners[i]);
        }
        for (var i = 0; i < queue.length; i++) {
          queue[i].call(void 0, data);
        }
      };
      return EventEmitter22;
    })();
  eventEmitter2.EventEmitter2 = EventEmitter2;
  return eventEmitter2;
}
var hasRequiredTerminal;
function requireTerminal() {
  if (hasRequiredTerminal) return terminal;
  hasRequiredTerminal = 1;
  Object.defineProperty(terminal, "__esModule", { value: true });
  terminal.Terminal = terminal.DEFAULT_ROWS = terminal.DEFAULT_COLS = void 0;
  var events_1 = require$$0;
  var eventEmitter2_1 = requireEventEmitter2();
  terminal.DEFAULT_COLS = 80;
  terminal.DEFAULT_ROWS = 24;
  var FLOW_CONTROL_PAUSE = "";
  var FLOW_CONTROL_RESUME = "";
  var Terminal =
    /** @class */
    (function () {
      function Terminal2(opt) {
        this._pid = 0;
        this._fd = 0;
        this._cols = 0;
        this._rows = 0;
        this._readable = false;
        this._writable = false;
        this._onData = new eventEmitter2_1.EventEmitter2();
        this._onExit = new eventEmitter2_1.EventEmitter2();
        this._internalee = new events_1.EventEmitter();
        this.handleFlowControl = !!(opt === null || opt === void 0
          ? void 0
          : opt.handleFlowControl);
        this._flowControlPause =
          (opt === null || opt === void 0 ? void 0 : opt.flowControlPause) ||
          FLOW_CONTROL_PAUSE;
        this._flowControlResume =
          (opt === null || opt === void 0 ? void 0 : opt.flowControlResume) ||
          FLOW_CONTROL_RESUME;
        if (!opt) {
          return;
        }
        this._checkType("name", opt.name ? opt.name : void 0, "string");
        this._checkType("cols", opt.cols ? opt.cols : void 0, "number");
        this._checkType("rows", opt.rows ? opt.rows : void 0, "number");
        this._checkType("cwd", opt.cwd ? opt.cwd : void 0, "string");
        this._checkType("env", opt.env ? opt.env : void 0, "object");
        this._checkType("uid", opt.uid ? opt.uid : void 0, "number");
        this._checkType("gid", opt.gid ? opt.gid : void 0, "number");
        this._checkType(
          "encoding",
          opt.encoding ? opt.encoding : void 0,
          "string",
        );
      }
      Object.defineProperty(Terminal2.prototype, "onData", {
        get: function () {
          return this._onData.event;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(Terminal2.prototype, "onExit", {
        get: function () {
          return this._onExit.event;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(Terminal2.prototype, "pid", {
        get: function () {
          return this._pid;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(Terminal2.prototype, "cols", {
        get: function () {
          return this._cols;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(Terminal2.prototype, "rows", {
        get: function () {
          return this._rows;
        },
        enumerable: false,
        configurable: true,
      });
      Terminal2.prototype.write = function (data) {
        if (this.handleFlowControl) {
          if (data === this._flowControlPause) {
            this.pause();
            return;
          }
          if (data === this._flowControlResume) {
            this.resume();
            return;
          }
        }
        this._write(data);
      };
      Terminal2.prototype._forwardEvents = function () {
        var _this = this;
        this.on("data", function (e) {
          return _this._onData.fire(e);
        });
        this.on("exit", function (exitCode, signal) {
          return _this._onExit.fire({ exitCode, signal });
        });
      };
      Terminal2.prototype._checkType = function (
        name,
        value,
        type,
        allowArray,
      ) {
        if (allowArray === void 0) {
          allowArray = false;
        }
        if (value === void 0) {
          return;
        }
        if (allowArray) {
          if (Array.isArray(value)) {
            value.forEach(function (v, i) {
              if (typeof v !== type) {
                throw new Error(
                  name +
                    "[" +
                    i +
                    "] must be a " +
                    type +
                    " (not a " +
                    typeof v[i] +
                    ")",
                );
              }
            });
            return;
          }
        }
        if (typeof value !== type) {
          throw new Error(
            name + " must be a " + type + " (not a " + typeof value + ")",
          );
        }
      };
      Terminal2.prototype.end = function (data) {
        this._socket.end(data);
      };
      Terminal2.prototype.pipe = function (dest, options) {
        return this._socket.pipe(dest, options);
      };
      Terminal2.prototype.pause = function () {
        return this._socket.pause();
      };
      Terminal2.prototype.resume = function () {
        return this._socket.resume();
      };
      Terminal2.prototype.setEncoding = function (encoding) {
        if (this._socket._decoder) {
          delete this._socket._decoder;
        }
        if (encoding) {
          this._socket.setEncoding(encoding);
        }
      };
      Terminal2.prototype.addListener = function (eventName, listener) {
        this.on(eventName, listener);
      };
      Terminal2.prototype.on = function (eventName, listener) {
        if (eventName === "close") {
          this._internalee.on("close", listener);
          return;
        }
        this._socket.on(eventName, listener);
      };
      Terminal2.prototype.emit = function (eventName) {
        if (eventName === "close") {
          return this._internalee.emit.apply(this._internalee, arguments);
        }
        return this._socket.emit.apply(this._socket, arguments);
      };
      Terminal2.prototype.listeners = function (eventName) {
        return this._socket.listeners(eventName);
      };
      Terminal2.prototype.removeListener = function (eventName, listener) {
        this._socket.removeListener(eventName, listener);
      };
      Terminal2.prototype.removeAllListeners = function (eventName) {
        this._socket.removeAllListeners(eventName);
      };
      Terminal2.prototype.once = function (eventName, listener) {
        this._socket.once(eventName, listener);
      };
      Terminal2.prototype._close = function () {
        this._socket.readable = false;
        this.write = function () {};
        this.end = function () {};
        this._writable = false;
        this._readable = false;
      };
      Terminal2.prototype._parseEnv = function (env) {
        var keys = Object.keys(env || {});
        var pairs = [];
        for (var i = 0; i < keys.length; i++) {
          if (keys[i] === void 0) {
            continue;
          }
          pairs.push(keys[i] + "=" + env[keys[i]]);
        }
        return pairs;
      };
      return Terminal2;
    })();
  terminal.Terminal = Terminal;
  return terminal;
}
var windowsPtyAgent = {};
var windowsConoutConnection = {};
var conout = {};
var hasRequiredConout;
function requireConout() {
  if (hasRequiredConout) return conout;
  hasRequiredConout = 1;
  Object.defineProperty(conout, "__esModule", { value: true });
  conout.getWorkerPipeName = void 0;
  function getWorkerPipeName(conoutPipeName) {
    return conoutPipeName + "-worker";
  }
  conout.getWorkerPipeName = getWorkerPipeName;
  return conout;
}
var hasRequiredWindowsConoutConnection;
function requireWindowsConoutConnection() {
  if (hasRequiredWindowsConoutConnection) return windowsConoutConnection;
  hasRequiredWindowsConoutConnection = 1;
  var __awaiter =
    (windowsConoutConnection && windowsConoutConnection.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P
          ? value
          : new P(function (resolve) {
              resolve(value);
            });
      }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done
            ? resolve(result.value)
            : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
  var __generator =
    (windowsConoutConnection && windowsConoutConnection.__generator) ||
    function (thisArg, body) {
      var _ = {
          label: 0,
          sent: function () {
            if (t[0] & 1) throw t[1];
            return t[1];
          },
          trys: [],
          ops: [],
        },
        f,
        y,
        t,
        g;
      return (
        (g = { next: verb(0), throw: verb(1), return: verb(2) }),
        typeof Symbol === "function" &&
          (g[Symbol.iterator] = function () {
            return this;
          }),
        g
      );
      function verb(n) {
        return function (v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_)
          try {
            if (
              ((f = 1),
              y &&
                (t =
                  op[0] & 2
                    ? y["return"]
                    : op[0]
                      ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                      : y.next) &&
                !(t = t.call(y, op[1])).done)
            )
              return t;
            if (((y = 0), t)) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (
                  !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                  (op[0] === 6 || op[0] === 2)
                ) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
  Object.defineProperty(windowsConoutConnection, "__esModule", { value: true });
  windowsConoutConnection.ConoutConnection = void 0;
  var worker_threads_1 = require$$0$1;
  var conout_1 = requireConout();
  var path_1 = require$$2;
  var eventEmitter2_1 = requireEventEmitter2();
  var FLUSH_DATA_INTERVAL = 1e3;
  var ConoutConnection =
    /** @class */
    (function () {
      function ConoutConnection2(_conoutPipeName, _useConptyDll) {
        var _this = this;
        this._conoutPipeName = _conoutPipeName;
        this._useConptyDll = _useConptyDll;
        this._isDisposed = false;
        this._onReady = new eventEmitter2_1.EventEmitter2();
        var workerData = {
          conoutPipeName: _conoutPipeName,
        };
        var scriptPath = __dirname.replace(
          "node_modules.asar",
          "node_modules.asar.unpacked",
        );
        this._worker = new worker_threads_1.Worker(
          path_1.join(scriptPath, "worker/conoutSocketWorker.js"),
          { workerData },
        );
        this._worker.on("message", function (message) {
          switch (message) {
            case 1:
              _this._onReady.fire();
              return;
            default:
              console.warn("Unexpected ConoutWorkerMessage", message);
          }
        });
      }
      Object.defineProperty(ConoutConnection2.prototype, "onReady", {
        get: function () {
          return this._onReady.event;
        },
        enumerable: false,
        configurable: true,
      });
      ConoutConnection2.prototype.dispose = function () {
        if (!this._useConptyDll && this._isDisposed) {
          return;
        }
        this._isDisposed = true;
        this._drainDataAndClose();
      };
      ConoutConnection2.prototype.connectSocket = function (socket) {
        socket.connect(conout_1.getWorkerPipeName(this._conoutPipeName));
      };
      ConoutConnection2.prototype._drainDataAndClose = function () {
        var _this = this;
        if (this._drainTimeout) {
          clearTimeout(this._drainTimeout);
        }
        this._drainTimeout = setTimeout(function () {
          return _this._destroySocket();
        }, FLUSH_DATA_INTERVAL);
      };
      ConoutConnection2.prototype._destroySocket = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4, this._worker.terminate()];
              case 1:
                _a.sent();
                return [
                  2,
                  /*return*/
                ];
            }
          });
        });
      };
      return ConoutConnection2;
    })();
  windowsConoutConnection.ConoutConnection = ConoutConnection;
  return windowsConoutConnection;
}
var hasRequiredWindowsPtyAgent;
function requireWindowsPtyAgent() {
  if (hasRequiredWindowsPtyAgent) return windowsPtyAgent;
  hasRequiredWindowsPtyAgent = 1;
  Object.defineProperty(windowsPtyAgent, "__esModule", { value: true });
  windowsPtyAgent.argsToCommandLine = windowsPtyAgent.WindowsPtyAgent = void 0;
  var fs = require$$0$2;
  var os = require$$1;
  var path = require$$2;
  var child_process_1 = require$$3;
  var net_1 = require$$4;
  var windowsConoutConnection_1 = requireWindowsConoutConnection();
  var utils_1 = requireUtils();
  var conptyNative;
  var winptyNative;
  var FLUSH_DATA_INTERVAL = 1e3;
  var WindowsPtyAgent =
    /** @class */
    (function () {
      function WindowsPtyAgent2(
        file,
        args,
        env,
        cwd,
        cols,
        rows,
        debug,
        _useConpty,
        _useConptyDll,
        conptyInheritCursor,
      ) {
        var _this = this;
        if (_useConptyDll === void 0) {
          _useConptyDll = false;
        }
        if (conptyInheritCursor === void 0) {
          conptyInheritCursor = false;
        }
        this._useConpty = _useConpty;
        this._useConptyDll = _useConptyDll;
        this._pid = 0;
        this._innerPid = 0;
        if (this._useConpty === void 0 || this._useConpty === true) {
          this._useConpty = this._getWindowsBuildNumber() >= 18309;
        }
        if (this._useConpty) {
          if (!conptyNative) {
            conptyNative = utils_1.loadNativeModule("conpty").module;
          }
        } else {
          if (!winptyNative) {
            winptyNative = utils_1.loadNativeModule("pty").module;
          }
        }
        this._ptyNative = this._useConpty ? conptyNative : winptyNative;
        cwd = path.resolve(cwd);
        var commandLine = argsToCommandLine(file, args);
        var term;
        if (this._useConpty) {
          term = this._ptyNative.startProcess(
            file,
            cols,
            rows,
            debug,
            this._generatePipeName(),
            conptyInheritCursor,
            this._useConptyDll,
          );
        } else {
          term = this._ptyNative.startProcess(
            file,
            commandLine,
            env,
            cwd,
            cols,
            rows,
            debug,
          );
          this._pid = term.pid;
          this._innerPid = term.innerPid;
        }
        this._fd = term.fd;
        this._pty = term.pty;
        this._outSocket = new net_1.Socket();
        this._outSocket.setEncoding("utf8");
        this._conoutSocketWorker =
          new windowsConoutConnection_1.ConoutConnection(
            term.conout,
            this._useConptyDll,
          );
        this._conoutSocketWorker.onReady(function () {
          _this._conoutSocketWorker.connectSocket(_this._outSocket);
        });
        this._outSocket.on("connect", function () {
          _this._outSocket.emit("ready_datapipe");
        });
        var inSocketFD = fs.openSync(term.conin, "w");
        this._inSocket = new net_1.Socket({
          fd: inSocketFD,
          readable: false,
          writable: true,
        });
        this._inSocket.setEncoding("utf8");
        if (this._useConpty) {
          var connect = this._ptyNative.connect(
            this._pty,
            commandLine,
            cwd,
            env,
            this._useConptyDll,
            function (c) {
              return _this._$onProcessExit(c);
            },
          );
          this._innerPid = connect.pid;
        }
      }
      Object.defineProperty(WindowsPtyAgent2.prototype, "inSocket", {
        get: function () {
          return this._inSocket;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsPtyAgent2.prototype, "outSocket", {
        get: function () {
          return this._outSocket;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsPtyAgent2.prototype, "fd", {
        get: function () {
          return this._fd;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsPtyAgent2.prototype, "innerPid", {
        get: function () {
          return this._innerPid;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsPtyAgent2.prototype, "pty", {
        get: function () {
          return this._pty;
        },
        enumerable: false,
        configurable: true,
      });
      WindowsPtyAgent2.prototype.resize = function (cols, rows) {
        if (this._useConpty) {
          if (this._exitCode !== void 0) {
            throw new Error("Cannot resize a pty that has already exited");
          }
          this._ptyNative.resize(this._pty, cols, rows, this._useConptyDll);
          return;
        }
        this._ptyNative.resize(this._pid, cols, rows);
      };
      WindowsPtyAgent2.prototype.clear = function () {
        if (this._useConpty) {
          this._ptyNative.clear(this._pty, this._useConptyDll);
        }
      };
      WindowsPtyAgent2.prototype.kill = function () {
        var _this = this;
        if (this._useConpty) {
          if (!this._useConptyDll) {
            this._inSocket.readable = false;
            this._outSocket.readable = false;
            this._getConsoleProcessList().then(function (consoleProcessList) {
              consoleProcessList.forEach(function (pid) {
                try {
                  process.kill(pid);
                } catch (e) {}
              });
            });
            this._ptyNative.kill(this._pty, this._useConptyDll);
            this._conoutSocketWorker.dispose();
          } else {
            this._inSocket.destroy();
            this._ptyNative.kill(this._pty, this._useConptyDll);
            this._outSocket.on("data", function () {
              _this._conoutSocketWorker.dispose();
            });
          }
        } else {
          var processList = this._ptyNative.getProcessList(this._pid);
          this._ptyNative.kill(this._pid, this._innerPid);
          processList.forEach(function (pid) {
            try {
              process.kill(pid);
            } catch (e) {}
          });
        }
      };
      WindowsPtyAgent2.prototype._getConsoleProcessList = function () {
        var _this = this;
        return new Promise(function (resolve) {
          var agent = child_process_1.fork(
            path.join(__dirname, "conpty_console_list_agent"),
            [_this._innerPid.toString()],
          );
          agent.on("message", function (message) {
            clearTimeout(timeout);
            resolve(message.consoleProcessList);
          });
          var timeout = setTimeout(function () {
            agent.kill();
            resolve([_this._innerPid]);
          }, 5e3);
        });
      };
      Object.defineProperty(WindowsPtyAgent2.prototype, "exitCode", {
        get: function () {
          if (this._useConpty) {
            return this._exitCode;
          }
          var winptyExitCode = this._ptyNative.getExitCode(this._innerPid);
          return winptyExitCode === -1 ? void 0 : winptyExitCode;
        },
        enumerable: false,
        configurable: true,
      });
      WindowsPtyAgent2.prototype._getWindowsBuildNumber = function () {
        var osVersion = /(\d+)\.(\d+)\.(\d+)/g.exec(os.release());
        var buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
          buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
      };
      WindowsPtyAgent2.prototype._generatePipeName = function () {
        return "conpty-" + Math.random() * 1e7;
      };
      WindowsPtyAgent2.prototype._$onProcessExit = function (exitCode) {
        var _this = this;
        this._exitCode = exitCode;
        if (!this._useConptyDll) {
          this._flushDataAndCleanUp();
          this._outSocket.on("data", function () {
            return _this._flushDataAndCleanUp();
          });
        }
      };
      WindowsPtyAgent2.prototype._flushDataAndCleanUp = function () {
        var _this = this;
        if (this._useConptyDll) {
          return;
        }
        if (this._closeTimeout) {
          clearTimeout(this._closeTimeout);
        }
        this._closeTimeout = setTimeout(function () {
          return _this._cleanUpProcess();
        }, FLUSH_DATA_INTERVAL);
      };
      WindowsPtyAgent2.prototype._cleanUpProcess = function () {
        if (this._useConptyDll) {
          return;
        }
        this._inSocket.readable = false;
        this._outSocket.readable = false;
        this._outSocket.destroy();
      };
      return WindowsPtyAgent2;
    })();
  windowsPtyAgent.WindowsPtyAgent = WindowsPtyAgent;
  function argsToCommandLine(file, args) {
    if (isCommandLine(args)) {
      if (args.length === 0) {
        return file;
      }
      return argsToCommandLine(file, []) + " " + args;
    }
    var argv = [file];
    Array.prototype.push.apply(argv, args);
    var result = "";
    for (var argIndex = 0; argIndex < argv.length; argIndex++) {
      if (argIndex > 0) {
        result += " ";
      }
      var arg = argv[argIndex];
      var hasLopsidedEnclosingQuote = xOr(
        arg[0] !== '"',
        arg[arg.length - 1] !== '"',
      );
      var hasNoEnclosingQuotes = arg[0] !== '"' && arg[arg.length - 1] !== '"';
      var quote =
        arg === "" ||
        ((arg.indexOf(" ") !== -1 || arg.indexOf("	") !== -1) &&
          arg.length > 1 &&
          (hasLopsidedEnclosingQuote || hasNoEnclosingQuotes));
      if (quote) {
        result += '"';
      }
      var bsCount = 0;
      for (var i = 0; i < arg.length; i++) {
        var p = arg[i];
        if (p === "\\") {
          bsCount++;
        } else if (p === '"') {
          result += repeatText("\\", bsCount * 2 + 1);
          result += '"';
          bsCount = 0;
        } else {
          result += repeatText("\\", bsCount);
          bsCount = 0;
          result += p;
        }
      }
      if (quote) {
        result += repeatText("\\", bsCount * 2);
        result += '"';
      } else {
        result += repeatText("\\", bsCount);
      }
    }
    return result;
  }
  windowsPtyAgent.argsToCommandLine = argsToCommandLine;
  function isCommandLine(args) {
    return typeof args === "string";
  }
  function repeatText(text, count) {
    var result = "";
    for (var i = 0; i < count; i++) {
      result += text;
    }
    return result;
  }
  function xOr(arg1, arg2) {
    return (arg1 && !arg2) || (!arg1 && arg2);
  }
  return windowsPtyAgent;
}
var hasRequiredWindowsTerminal;
function requireWindowsTerminal() {
  if (hasRequiredWindowsTerminal) return windowsTerminal;
  hasRequiredWindowsTerminal = 1;
  var __extends =
    (windowsTerminal && windowsTerminal.__extends) ||
    /* @__PURE__ */ (function () {
      var extendStatics = function (d, b) {
        extendStatics =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            function (d2, b2) {
              d2.__proto__ = b2;
            }) ||
          function (d2, b2) {
            for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
          };
        return extendStatics(d, b);
      };
      return function (d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype =
          b === null
            ? Object.create(b)
            : ((__.prototype = b.prototype), new __());
      };
    })();
  Object.defineProperty(windowsTerminal, "__esModule", { value: true });
  windowsTerminal.WindowsTerminal = void 0;
  var terminal_1 = requireTerminal();
  var windowsPtyAgent_1 = requireWindowsPtyAgent();
  var utils_1 = requireUtils();
  var DEFAULT_FILE = "cmd.exe";
  var DEFAULT_NAME = "Windows Shell";
  var WindowsTerminal =
    /** @class */
    (function (_super) {
      __extends(WindowsTerminal2, _super);
      function WindowsTerminal2(file, args, opt) {
        var _this = _super.call(this, opt) || this;
        _this._checkType("args", args, "string", true);
        args = args || [];
        file = file || DEFAULT_FILE;
        opt = opt || {};
        opt.env = opt.env || process.env;
        if (opt.encoding) {
          console.warn("Setting encoding on Windows is not supported");
        }
        var env = utils_1.assign({}, opt.env);
        _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
        _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var cwd = opt.cwd || process.cwd();
        var name = opt.name || env.TERM || DEFAULT_NAME;
        var parsedEnv = _this._parseEnv(env);
        _this._isReady = false;
        _this._deferreds = [];
        _this._agent = new windowsPtyAgent_1.WindowsPtyAgent(
          file,
          args,
          parsedEnv,
          cwd,
          _this._cols,
          _this._rows,
          false,
          opt.useConpty,
          opt.useConptyDll,
          opt.conptyInheritCursor,
        );
        _this._socket = _this._agent.outSocket;
        _this._pid = _this._agent.innerPid;
        _this._fd = _this._agent.fd;
        _this._pty = _this._agent.pty;
        _this._socket.on("ready_datapipe", function () {
          _this._socket.once("data", function () {
            if (!_this._isReady) {
              _this._isReady = true;
              _this._deferreds.forEach(function (fn) {
                fn.run();
              });
              _this._deferreds = [];
            }
          });
          _this._socket.on("error", function (err) {
            _this._close();
            if (err.code) {
              if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO"))
                return;
            }
            if (_this.listeners("error").length < 2) {
              throw err;
            }
          });
          _this._socket.on("close", function () {
            _this.emit("exit", _this._agent.exitCode);
            _this._close();
          });
        });
        _this._file = file;
        _this._name = name;
        _this._readable = true;
        _this._writable = true;
        _this._forwardEvents();
        return _this;
      }
      WindowsTerminal2.prototype._write = function (data) {
        this._defer(this._doWrite, data);
      };
      WindowsTerminal2.prototype._doWrite = function (data) {
        this._agent.inSocket.write(data);
      };
      WindowsTerminal2.open = function (options) {
        throw new Error("open() not supported on windows, use Fork() instead.");
      };
      WindowsTerminal2.prototype.resize = function (cols, rows) {
        var _this = this;
        if (
          cols <= 0 ||
          rows <= 0 ||
          isNaN(cols) ||
          isNaN(rows) ||
          cols === Infinity ||
          rows === Infinity
        ) {
          throw new Error("resizing must be done using positive cols and rows");
        }
        this._deferNoArgs(function () {
          _this._agent.resize(cols, rows);
          _this._cols = cols;
          _this._rows = rows;
        });
      };
      WindowsTerminal2.prototype.clear = function () {
        var _this = this;
        this._deferNoArgs(function () {
          _this._agent.clear();
        });
      };
      WindowsTerminal2.prototype.destroy = function () {
        var _this = this;
        this._deferNoArgs(function () {
          _this.kill();
        });
      };
      WindowsTerminal2.prototype.kill = function (signal) {
        var _this = this;
        this._deferNoArgs(function () {
          if (signal) {
            throw new Error("Signals not supported on windows.");
          }
          _this._close();
          _this._agent.kill();
        });
      };
      WindowsTerminal2.prototype._deferNoArgs = function (deferredFn) {
        var _this = this;
        if (this._isReady) {
          deferredFn.call(this);
          return;
        }
        this._deferreds.push({
          run: function () {
            return deferredFn.call(_this);
          },
        });
      };
      WindowsTerminal2.prototype._defer = function (deferredFn, arg) {
        var _this = this;
        if (this._isReady) {
          deferredFn.call(this, arg);
          return;
        }
        this._deferreds.push({
          run: function () {
            return deferredFn.call(_this, arg);
          },
        });
      };
      Object.defineProperty(WindowsTerminal2.prototype, "process", {
        get: function () {
          return this._name;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsTerminal2.prototype, "master", {
        get: function () {
          throw new Error("master is not supported on Windows");
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(WindowsTerminal2.prototype, "slave", {
        get: function () {
          throw new Error("slave is not supported on Windows");
        },
        enumerable: false,
        configurable: true,
      });
      return WindowsTerminal2;
    })(terminal_1.Terminal);
  windowsTerminal.WindowsTerminal = WindowsTerminal;
  return windowsTerminal;
}
var unixTerminal = {};
var hasRequiredUnixTerminal;
function requireUnixTerminal() {
  if (hasRequiredUnixTerminal) return unixTerminal;
  hasRequiredUnixTerminal = 1;
  var __extends =
    (unixTerminal && unixTerminal.__extends) ||
    /* @__PURE__ */ (function () {
      var extendStatics = function (d, b) {
        extendStatics =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            function (d2, b2) {
              d2.__proto__ = b2;
            }) ||
          function (d2, b2) {
            for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
          };
        return extendStatics(d, b);
      };
      return function (d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype =
          b === null
            ? Object.create(b)
            : ((__.prototype = b.prototype), new __());
      };
    })();
  Object.defineProperty(unixTerminal, "__esModule", { value: true });
  unixTerminal.UnixTerminal = void 0;
  var fs = require$$0$2;
  var path = require$$2;
  var tty = require$$2$1;
  var terminal_1 = requireTerminal();
  var utils_1 = requireUtils();
  var native = utils_1.loadNativeModule("pty");
  var pty = native.module;
  var helperPath = native.dir + "/spawn-helper";
  helperPath = path.resolve(__dirname, helperPath);
  helperPath = helperPath.replace("app.asar", "app.asar.unpacked");
  helperPath = helperPath.replace(
    "node_modules.asar",
    "node_modules.asar.unpacked",
  );
  var DEFAULT_FILE = "sh";
  var DEFAULT_NAME = "xterm";
  var DESTROY_SOCKET_TIMEOUT_MS = 200;
  var UnixTerminal =
    /** @class */
    (function (_super) {
      __extends(UnixTerminal2, _super);
      function UnixTerminal2(file, args, opt) {
        var _a, _b;
        var _this = _super.call(this, opt) || this;
        _this._boundClose = false;
        _this._emittedClose = false;
        if (typeof args === "string") {
          throw new Error("args as a string is not supported on unix.");
        }
        args = args || [];
        file = file || DEFAULT_FILE;
        opt = opt || {};
        opt.env = opt.env || process.env;
        _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
        _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var uid = (_a = opt.uid) !== null && _a !== void 0 ? _a : -1;
        var gid = (_b = opt.gid) !== null && _b !== void 0 ? _b : -1;
        var env = utils_1.assign({}, opt.env);
        if (opt.env === process.env) {
          _this._sanitizeEnv(env);
        }
        var cwd = opt.cwd || process.cwd();
        env.PWD = cwd;
        var name = opt.name || env.TERM || DEFAULT_NAME;
        env.TERM = name;
        var parsedEnv = _this._parseEnv(env);
        var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
        var onexit = function (code, signal) {
          if (!_this._emittedClose) {
            if (_this._boundClose) {
              return;
            }
            _this._boundClose = true;
            var timeout_1 = setTimeout(function () {
              timeout_1 = null;
              _this._socket.destroy();
            }, DESTROY_SOCKET_TIMEOUT_MS);
            _this.once("close", function () {
              if (timeout_1 !== null) {
                clearTimeout(timeout_1);
              }
              _this.emit("exit", code, signal);
            });
            return;
          }
          _this.emit("exit", code, signal);
        };
        var term = pty.fork(
          file,
          args,
          parsedEnv,
          cwd,
          _this._cols,
          _this._rows,
          uid,
          gid,
          encoding === "utf8",
          helperPath,
          onexit,
        );
        _this._socket = new tty.ReadStream(term.fd);
        if (encoding !== null) {
          _this._socket.setEncoding(encoding);
        }
        _this._writeStream = new CustomWriteStream(term.fd, encoding || void 0);
        _this._socket.on("error", function (err) {
          if (err.code) {
            if (~err.code.indexOf("EAGAIN")) {
              return;
            }
          }
          _this._close();
          if (!_this._emittedClose) {
            _this._emittedClose = true;
            _this.emit("close");
          }
          if (err.code) {
            if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO")) {
              return;
            }
          }
          if (_this.listeners("error").length < 2) {
            throw err;
          }
        });
        _this._pid = term.pid;
        _this._fd = term.fd;
        _this._pty = term.pty;
        _this._file = file;
        _this._name = name;
        _this._readable = true;
        _this._writable = true;
        _this._socket.on("close", function () {
          if (_this._emittedClose) {
            return;
          }
          _this._emittedClose = true;
          _this._close();
          _this.emit("close");
        });
        _this._forwardEvents();
        return _this;
      }
      Object.defineProperty(UnixTerminal2.prototype, "master", {
        get: function () {
          return this._master;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(UnixTerminal2.prototype, "slave", {
        get: function () {
          return this._slave;
        },
        enumerable: false,
        configurable: true,
      });
      UnixTerminal2.prototype._write = function (data) {
        this._writeStream.write(data);
      };
      Object.defineProperty(UnixTerminal2.prototype, "fd", {
        /* Accessors */
        get: function () {
          return this._fd;
        },
        enumerable: false,
        configurable: true,
      });
      Object.defineProperty(UnixTerminal2.prototype, "ptsName", {
        get: function () {
          return this._pty;
        },
        enumerable: false,
        configurable: true,
      });
      UnixTerminal2.open = function (opt) {
        var self = Object.create(UnixTerminal2.prototype);
        opt = opt || {};
        if (arguments.length > 1) {
          opt = {
            cols: arguments[1],
            rows: arguments[2],
          };
        }
        var cols = opt.cols || terminal_1.DEFAULT_COLS;
        var rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
        var term = pty.open(cols, rows);
        self._master = new tty.ReadStream(term.master);
        if (encoding !== null) {
          self._master.setEncoding(encoding);
        }
        self._master.resume();
        self._slave = new tty.ReadStream(term.slave);
        if (encoding !== null) {
          self._slave.setEncoding(encoding);
        }
        self._slave.resume();
        self._socket = self._master;
        self._pid = -1;
        self._fd = term.master;
        self._pty = term.pty;
        self._file = process.argv[0] || "node";
        self._name = process.env.TERM || "";
        self._readable = true;
        self._writable = true;
        self._socket.on("error", function (err) {
          self._close();
          if (self.listeners("error").length < 2) {
            throw err;
          }
        });
        self._socket.on("close", function () {
          self._close();
        });
        return self;
      };
      UnixTerminal2.prototype.destroy = function () {
        var _this = this;
        this._close();
        this._socket.once("close", function () {
          _this.kill("SIGHUP");
        });
        this._socket.destroy();
        this._writeStream.dispose();
      };
      UnixTerminal2.prototype.kill = function (signal) {
        try {
          process.kill(this.pid, signal || "SIGHUP");
        } catch (e) {}
      };
      Object.defineProperty(UnixTerminal2.prototype, "process", {
        /**
         * Gets the name of the process.
         */
        get: function () {
          if (process.platform === "darwin") {
            var title = pty.process(this._fd);
            return title !== "kernel_task" ? title : this._file;
          }
          return pty.process(this._fd, this._pty) || this._file;
        },
        enumerable: false,
        configurable: true,
      });
      UnixTerminal2.prototype.resize = function (cols, rows) {
        if (
          cols <= 0 ||
          rows <= 0 ||
          isNaN(cols) ||
          isNaN(rows) ||
          cols === Infinity ||
          rows === Infinity
        ) {
          throw new Error("resizing must be done using positive cols and rows");
        }
        pty.resize(this._fd, cols, rows);
        this._cols = cols;
        this._rows = rows;
      };
      UnixTerminal2.prototype.clear = function () {};
      UnixTerminal2.prototype._sanitizeEnv = function (env) {
        delete env["TMUX"];
        delete env["TMUX_PANE"];
        delete env["STY"];
        delete env["WINDOW"];
        delete env["WINDOWID"];
        delete env["TERMCAP"];
        delete env["COLUMNS"];
        delete env["LINES"];
      };
      return UnixTerminal2;
    })(terminal_1.Terminal);
  unixTerminal.UnixTerminal = UnixTerminal;
  var CustomWriteStream =
    /** @class */
    (function () {
      function CustomWriteStream2(_fd, _encoding) {
        this._fd = _fd;
        this._encoding = _encoding;
        this._writeQueue = [];
      }
      CustomWriteStream2.prototype.dispose = function () {
        clearImmediate(this._writeImmediate);
        this._writeImmediate = void 0;
      };
      CustomWriteStream2.prototype.write = function (data) {
        var buffer =
          typeof data === "string"
            ? Buffer.from(data, this._encoding)
            : Buffer.from(data);
        if (buffer.byteLength !== 0) {
          this._writeQueue.push({ buffer, offset: 0 });
          if (this._writeQueue.length === 1) {
            this._processWriteQueue();
          }
        }
      };
      CustomWriteStream2.prototype._processWriteQueue = function () {
        var _this = this;
        this._writeImmediate = void 0;
        if (this._writeQueue.length === 0) {
          return;
        }
        var task = this._writeQueue[0];
        fs.write(this._fd, task.buffer, task.offset, function (err, written) {
          if (err) {
            if ("code" in err && err.code === "EAGAIN") {
              _this._writeImmediate = setImmediate(function () {
                return _this._processWriteQueue();
              });
            } else {
              _this._writeQueue.length = 0;
              console.error("Unhandled pty write error", err);
            }
            return;
          }
          task.offset += written;
          if (task.offset >= task.buffer.byteLength) {
            _this._writeQueue.shift();
          }
          _this._processWriteQueue();
        });
      };
      return CustomWriteStream2;
    })();
  return unixTerminal;
}
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  Object.defineProperty(lib, "__esModule", { value: true });
  lib.native = lib.open = lib.createTerminal = lib.fork = lib.spawn = void 0;
  var utils_1 = requireUtils();
  var terminalCtor;
  if (process.platform === "win32") {
    terminalCtor = requireWindowsTerminal().WindowsTerminal;
  } else {
    terminalCtor = requireUnixTerminal().UnixTerminal;
  }
  function spawn(file, args, opt) {
    return new terminalCtor(file, args, opt);
  }
  lib.spawn = spawn;
  function fork(file, args, opt) {
    return new terminalCtor(file, args, opt);
  }
  lib.fork = fork;
  function createTerminal(file, args, opt) {
    return new terminalCtor(file, args, opt);
  }
  lib.createTerminal = createTerminal;
  function open(options) {
    return terminalCtor.open(options);
  }
  lib.open = open;
  lib.native =
    process.platform !== "win32"
      ? utils_1.loadNativeModule("pty").module
      : null;
  return lib;
}
var libExports = requireLib();
const ptyMap = /* @__PURE__ */ new Map();
function spawnPty(ptyId, cwd, cols, rows, env, win) {
  if (ptyMap.has(ptyId)) return;
  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : (process.env["SHELL"] ?? "/bin/bash");
  const ptyProcess = libExports.spawn(shell, [], {
    name: "xterm-256color",
    cwd,
    cols,
    rows,
    env: { ...process.env, ...env },
  });
  ptyProcess.onData((data) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_DATA, ptyId, data);
    }
  });
  ptyProcess.onExit(({ exitCode }) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_EXIT, ptyId, exitCode);
    }
    ptyMap.delete(ptyId);
  });
  ptyMap.set(ptyId, { process: ptyProcess, ptyId });
}
function writePty(ptyId, data) {
  ptyMap.get(ptyId)?.process.write(data);
}
function resizePty(ptyId, cols, rows) {
  ptyMap.get(ptyId)?.process.resize(cols, rows);
}
function killPty(ptyId) {
  const record = ptyMap.get(ptyId);
  if (record) {
    record.process.kill();
    ptyMap.delete(ptyId);
  }
}
function killAllPtys() {
  for (const record of ptyMap.values()) {
    record.process.kill();
  }
  ptyMap.clear();
}
const execFileAsync$1 = util.promisify(require$$3.execFile);
function getWorktreePath(repoPath, agentId) {
  return require$$2.join(repoPath, ".worktrees", agentId);
}
async function addWorktree(repoPath, agentId, branchName, baseBranch) {
  const worktreePath = getWorktreePath(repoPath, agentId);
  require$$0$2.mkdirSync(require$$2.join(repoPath, ".worktrees"), {
    recursive: true,
  });
  await execFileAsync$1(
    "git",
    ["worktree", "add", "-b", branchName, worktreePath, baseBranch],
    { cwd: repoPath },
  );
  return worktreePath;
}
async function removeWorktree(worktreePath) {
  await execFileAsync$1("git", ["worktree", "remove", "--force", worktreePath]);
}
const execFileAsync = util.promisify(require$$3.execFile);
async function getDiff(repoPath, branch) {
  const args = branch
    ? ["diff", `main...${branch}`, "--unified=3"]
    : ["diff", "--unified=3"];
  const { stdout } = await execFileAsync("git", args, { cwd: repoPath });
  return parseDiff(stdout);
}
async function getBranches(repoPath) {
  const { stdout } = await execFileAsync(
    "git",
    ["branch", "--format=%(refname:short)"],
    { cwd: repoPath },
  );
  return stdout
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}
function parseDiff(raw) {
  const files = [];
  const fileBlocks = raw.split(/^diff --git /m).filter(Boolean);
  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0] ?? "";
    const pathMatch = /b\/(.+)$/.exec(headerLine);
    const path = pathMatch?.[1] ?? headerLine;
    let status = "modified";
    if (block.includes("\nnew file mode")) status = "added";
    else if (block.includes("\ndeleted file mode")) status = "deleted";
    else if (block.includes("\nrename to ")) status = "renamed";
    const hunks = parseHunks(lines.slice(4));
    files.push({ path, status, hunks });
  }
  return files;
}
function parseHunks(lines) {
  const hunks = [];
  let current = null;
  let oldLine = 0;
  let newLine = 0;
  for (const line of lines) {
    const hunkHeader = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkHeader) {
      current = { header: line, lines: [] };
      hunks.push(current);
      oldLine = parseInt(hunkHeader[1] ?? "0", 10);
      newLine = parseInt(hunkHeader[2] ?? "0", 10);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+")) {
      const diffLine = {
        type: "addition",
        content: line.slice(1),
        oldLineNo: null,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith("-")) {
      const diffLine = {
        type: "deletion",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: null,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith(" ")) {
      const diffLine = {
        type: "context",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    }
  }
  return hunks;
}
const agentMap = /* @__PURE__ */ new Map();
function emitStatus(win, agentId, status) {
  if (!win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.AGENT_STATUS, agentId, status);
  }
  const record = agentMap.get(agentId);
  if (record) {
    record.status = status;
  }
}
async function spawnAgent(
  win,
  agentId,
  repoPath,
  branchName,
  baseBranch,
  prompt,
  model = "claude-sonnet-4-5",
  useWorktree = true,
) {
  let cwd;
  let worktreePath;
  if (useWorktree) {
    worktreePath = await addWorktree(repoPath, agentId, branchName, baseBranch);
    cwd = worktreePath;
  } else {
    worktreePath = "";
    cwd = repoPath;
  }
  const ptyId = `agent-pty-${agentId}`;
  spawnPty(ptyId, cwd, 220, 50, {}, win);
  agentMap.set(agentId, {
    agentId,
    repoPath,
    branchName,
    worktreePath,
    ptyId,
    status: "running",
    startedAt: Date.now(),
    prompt,
  });
  emitStatus(win, agentId, "running");
  setTimeout(() => {
    const escapedPrompt = prompt.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    writePty(ptyId, `claude --model ${model} --print "${escapedPrompt}"\r`);
  }, 500);
  return cwd;
}
async function killAgent(win, agentId) {
  const record = agentMap.get(agentId);
  if (!record) return;
  killPty(record.ptyId);
  if (record.worktreePath) {
    try {
      await removeWorktree(record.worktreePath);
    } catch {}
  }
  emitStatus(win, agentId, "killed");
  agentMap.delete(agentId);
}
function listAgents() {
  return Array.from(agentMap.values());
}
function registerHandlers(win) {
  electron.ipcMain.handle(IPC_CHANNELS.PTY_SPAWN, (_event, opts) => {
    spawnPty(opts.ptyId, opts.cwd, opts.cols, opts.rows, opts.env ?? {}, win);
  });
  electron.ipcMain.on(IPC_CHANNELS.PTY_INPUT, (_event, ptyId, data) => {
    writePty(ptyId, data);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.PTY_RESIZE,
    (_event, ptyId, cols, rows) => {
      resizePty(ptyId, cols, rows);
    },
  );
  electron.ipcMain.handle(IPC_CHANNELS.PTY_KILL, (_event, ptyId) => {
    killPty(ptyId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_SPAWN, async (_event, opts) => {
    return spawnAgent(
      win,
      opts.agentId,
      opts.repoPath,
      opts.branchName,
      opts.baseBranch,
      opts.prompt,
      opts.model,
      opts.useWorktree,
    );
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_KILL, async (_event, agentId) => {
    await killAgent(win, agentId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_LIST, () => listAgents());
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_ADD,
    async (_event, opts) => {
      return addWorktree(
        opts.repoPath,
        opts.agentId,
        opts.branchName,
        opts.baseBranch,
      );
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_REMOVE,
    async (_event, worktreePath) => {
      await removeWorktree(worktreePath);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF,
    async (_event, repoPath, branch) => {
      return getDiff(repoPath, branch);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_BRANCHES,
    async (_event, repoPath) => {
      return getBranches(repoPath);
    },
  );
  electron.ipcMain.on(IPC_CHANNELS.OPEN_IN_FINDER, (_event, path) => {
    electron.shell.showItemInFolder(path);
  });
  electron.ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, (_event, url) => {
    electron.shell.openExternal(url);
  });
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    icon: require$$2.join(__dirname, "../../build/icon.png"),
    webPreferences: {
      preload: require$$2.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  registerHandlers(win);
  win.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(require$$2.join(__dirname, "../renderer/index.html"));
  }
  return win;
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", async () => {
  const agents = listAgents();
  await Promise.allSettled(
    agents.map((a) => {
      const win = electron.BrowserWindow.getAllWindows()[0];
      if (win) return killAgent(win, a.agentId);
      return Promise.resolve();
    }),
  );
  killAllPtys();
});

"use strict";
const electron = require("electron");
const path = require("path");
const pty = require("node-pty");
const node_crypto = require("node:crypto");
const simpleGit = require("simple-git");
const node_events = require("node:events");
const node_fs = require("node:fs");
const promises = require("node:fs/promises");
const sp = require("node:path");
const node_stream = require("node:stream");
const node_os = require("node:os");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: () => e[k],
              },
        );
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const pty__namespace = /* @__PURE__ */ _interopNamespaceDefault(pty);
const sp__namespace = /* @__PURE__ */ _interopNamespaceDefault(sp);
const IPC_CHANNELS = {
  PTY_SPAWN: "pty:spawn",
  PTY_INPUT: "pty:input",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_DATA: "pty:data",
  PTY_EXIT: "pty:exit",
  SESSION_CREATE: "session:create",
  SESSION_LIST: "session:list",
  SESSION_DELETE: "session:delete",
  SESSION_GET: "session:get",
  TAB_CREATE: "tab:create",
  TAB_CLOSE: "tab:close",
  TAB_SEND_MESSAGE: "tab:sendMessage",
  GIT_STATUS: "git:status",
  GIT_STAGE: "git:stage",
  GIT_UNSTAGE: "git:unstage",
  GIT_COMMIT: "git:commit",
  GIT_DIFF_STAGED: "git:diffStaged",
  GIT_DIFF_UNSTAGED: "git:diffUnstaged",
  GIT_WATCH_START: "git:watchStart",
  GIT_WATCH_STOP: "git:watchStop",
  GIT_WATCH_CHANGED: "git:watchChanged",
  DIALOG_OPEN_DIRECTORY: "dialog:openDirectory",
  OPEN_IN_FINDER: "shell:openInFinder",
  OPEN_EXTERNAL: "shell:openExternal",
};
const ptyMap = /* @__PURE__ */ new Map();
function spawnPty(ptyId, cwd, cols, rows, env, win) {
  if (ptyMap.has(ptyId)) return;
  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : (process.env["SHELL"] ?? "/bin/bash");
  const ptyProcess = pty__namespace.spawn(shell, [], {
    name: "xterm-256color",
    cwd,
    cols,
    rows,
    env: Object.fromEntries(
      Object.entries({ ...process.env, ...env }).filter(
        (entry) => entry[1] !== void 0,
      ),
    ),
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
const urlAlphabet =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    node_crypto.webcrypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    node_crypto.webcrypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool((size |= 0));
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}
const sessions = /* @__PURE__ */ new Map();
const TOOL_LABELS = {
  claude: "Claude Code",
  opencode: "OpenCode",
  codex: "Codex",
  shell: "Shell",
};
function createSession(repoPath) {
  const sessionId = nanoid();
  const session = {
    sessionId,
    repoPath,
    name: path.basename(repoPath),
    createdAt: Date.now(),
    tabs: [],
    activeTabId: "",
  };
  sessions.set(sessionId, session);
  return session;
}
function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}
function listSessions() {
  return Array.from(sessions.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}
function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  sessions.delete(sessionId);
  return session;
}
function addTab(sessionId, tool) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const tabId = nanoid();
  const tab = {
    tabId,
    sessionId,
    ptyId: `tab-pty-${tabId}`,
    tool,
    label: TOOL_LABELS[tool],
    createdAt: Date.now(),
  };
  session.tabs.push(tab);
  session.activeTabId = tabId;
  return tab;
}
function removeTab(sessionId, tabId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const tab = session.tabs.find((t) => t.tabId === tabId);
  if (!tab) return null;
  session.tabs = session.tabs.filter((t) => t.tabId !== tabId);
  if (session.activeTabId === tabId && session.tabs.length > 0) {
    session.activeTabId = session.tabs[session.tabs.length - 1].tabId;
  }
  return tab.ptyId;
}
const TOOL_COMMANDS = {
  claude: "claude",
  opencode: "opencode",
  codex: "codex",
  shell: null,
};
function spawnTab(win, sessionId, repoPath, tool, initialMessage) {
  const tab = addTab(sessionId, tool);
  if (!tab) return null;
  spawnPty(tab.ptyId, repoPath, 120, 40, {}, win);
  const command = TOOL_COMMANDS[tool];
  if (command) {
    setTimeout(() => {
      writePty(tab.ptyId, `${command}\r`);
      if (initialMessage) {
        setTimeout(() => {
          writePty(tab.ptyId, `${initialMessage}\r`);
        }, 1500);
      }
    }, 300);
  }
  return tab;
}
function parseDiff(raw) {
  const files = [];
  const fileBlocks = raw.split(/^diff --git /m).filter(Boolean);
  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0] ?? "";
    const pathMatch = /b\/(.+)$/.exec(headerLine);
    const path2 = pathMatch?.[1] ?? headerLine;
    let status = "modified";
    if (block.includes("\nnew file mode")) status = "added";
    else if (block.includes("\ndeleted file mode")) status = "deleted";
    else if (block.includes("\nrename to ")) status = "renamed";
    const hunks = parseHunks(lines.slice(4));
    files.push({ path: path2, status, hunks });
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
async function getStatus(repoPath) {
  const git = simpleGit.simpleGit(repoPath);
  const status = await git.status();
  const files = status.files.map((f) => ({
    path: f.path,
    indexStatus: f.index ?? " ",
    workTreeStatus: f.working_dir ?? " ",
    staged: f.index !== " " && f.index !== "?",
  }));
  return {
    files,
    branch: status.current ?? "",
    ahead: status.ahead,
    behind: status.behind,
  };
}
async function stageFiles(repoPath, files) {
  const git = simpleGit.simpleGit(repoPath);
  await git.add(files);
}
async function unstageFiles(repoPath, files) {
  const git = simpleGit.simpleGit(repoPath);
  await git.reset(["HEAD", "--", ...files]);
}
async function commit(repoPath, message) {
  const git = simpleGit.simpleGit(repoPath);
  await git.commit(message);
}
async function getStagedDiff(repoPath) {
  const git = simpleGit.simpleGit(repoPath);
  const raw = await git.diff(["--cached", "--unified=3"]);
  return parseDiff(raw);
}
async function getUnstagedDiff(repoPath) {
  const git = simpleGit.simpleGit(repoPath);
  const raw = await git.diff(["--unified=3"]);
  return parseDiff(raw);
}
const EntryTypes = {
  FILE_TYPE: "files",
  DIR_TYPE: "directories",
  FILE_DIR_TYPE: "files_directories",
  EVERYTHING_TYPE: "all",
};
const defaultOptions = {
  root: ".",
  fileFilter: (_entryInfo) => true,
  directoryFilter: (_entryInfo) => true,
  type: EntryTypes.FILE_TYPE,
  lstat: false,
  depth: 2147483648,
  alwaysStat: false,
  highWaterMark: 4096,
};
Object.freeze(defaultOptions);
const RECURSIVE_ERROR_CODE = "READDIRP_RECURSIVE_ERROR";
const NORMAL_FLOW_ERRORS = /* @__PURE__ */ new Set([
  "ENOENT",
  "EPERM",
  "EACCES",
  "ELOOP",
  RECURSIVE_ERROR_CODE,
]);
const ALL_TYPES = [
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE,
];
const DIR_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
]);
const FILE_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE,
]);
const isNormalFlowError = (error) => NORMAL_FLOW_ERRORS.has(error.code);
const wantBigintFsStats = process.platform === "win32";
const emptyFn = (_entryInfo) => true;
const normalizeFilter = (filter) => {
  if (filter === void 0) return emptyFn;
  if (typeof filter === "function") return filter;
  if (typeof filter === "string") {
    const fl = filter.trim();
    return (entry) => entry.basename === fl;
  }
  if (Array.isArray(filter)) {
    const trItems = filter.map((item) => item.trim());
    return (entry) => trItems.some((f) => entry.basename === f);
  }
  return emptyFn;
};
class ReaddirpStream extends node_stream.Readable {
  parents;
  reading;
  parent;
  _stat;
  _maxDepth;
  _wantsDir;
  _wantsFile;
  _wantsEverything;
  _root;
  _isDirent;
  _statsProp;
  _rdOptions;
  _fileFilter;
  _directoryFilter;
  constructor(options = {}) {
    super({
      objectMode: true,
      autoDestroy: true,
      highWaterMark: options.highWaterMark,
    });
    const opts = { ...defaultOptions, ...options };
    const { root, type } = opts;
    this._fileFilter = normalizeFilter(opts.fileFilter);
    this._directoryFilter = normalizeFilter(opts.directoryFilter);
    const statMethod = opts.lstat ? promises.lstat : promises.stat;
    if (wantBigintFsStats) {
      this._stat = (path2) => statMethod(path2, { bigint: true });
    } else {
      this._stat = statMethod;
    }
    this._maxDepth =
      opts.depth != null && Number.isSafeInteger(opts.depth)
        ? opts.depth
        : defaultOptions.depth;
    this._wantsDir = type ? DIR_TYPES.has(type) : false;
    this._wantsFile = type ? FILE_TYPES.has(type) : false;
    this._wantsEverything = type === EntryTypes.EVERYTHING_TYPE;
    this._root = sp.resolve(root);
    this._isDirent = !opts.alwaysStat;
    this._statsProp = this._isDirent ? "dirent" : "stats";
    this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent };
    this.parents = [this._exploreDir(root, 1)];
    this.reading = false;
    this.parent = void 0;
  }
  async _read(batch) {
    if (this.reading) return;
    this.reading = true;
    try {
      while (!this.destroyed && batch > 0) {
        const par = this.parent;
        const fil = par && par.files;
        if (fil && fil.length > 0) {
          const { path: path2, depth } = par;
          const slice = fil
            .splice(0, batch)
            .map((dirent) => this._formatEntry(dirent, path2));
          const awaited = await Promise.all(slice);
          for (const entry of awaited) {
            if (!entry) continue;
            if (this.destroyed) return;
            const entryType = await this._getEntryType(entry);
            if (entryType === "directory" && this._directoryFilter(entry)) {
              if (depth <= this._maxDepth) {
                this.parents.push(this._exploreDir(entry.fullPath, depth + 1));
              }
              if (this._wantsDir) {
                this.push(entry);
                batch--;
              }
            } else if (
              (entryType === "file" || this._includeAsFile(entry)) &&
              this._fileFilter(entry)
            ) {
              if (this._wantsFile) {
                this.push(entry);
                batch--;
              }
            }
          }
        } else {
          const parent = this.parents.pop();
          if (!parent) {
            this.push(null);
            break;
          }
          this.parent = await parent;
          if (this.destroyed) return;
        }
      }
    } catch (error) {
      this.destroy(error);
    } finally {
      this.reading = false;
    }
  }
  async _exploreDir(path2, depth) {
    let files;
    try {
      files = await promises.readdir(path2, this._rdOptions);
    } catch (error) {
      this._onError(error);
    }
    return { files, depth, path: path2 };
  }
  async _formatEntry(dirent, path2) {
    let entry;
    const basename = this._isDirent ? dirent.name : dirent;
    try {
      const fullPath = sp.resolve(sp.join(path2, basename));
      entry = { path: sp.relative(this._root, fullPath), fullPath, basename };
      entry[this._statsProp] = this._isDirent
        ? dirent
        : await this._stat(fullPath);
    } catch (err) {
      this._onError(err);
      return;
    }
    return entry;
  }
  _onError(err) {
    if (isNormalFlowError(err) && !this.destroyed) {
      this.emit("warn", err);
    } else {
      this.destroy(err);
    }
  }
  async _getEntryType(entry) {
    if (!entry && this._statsProp in entry) {
      return "";
    }
    const stats = entry[this._statsProp];
    if (stats.isFile()) return "file";
    if (stats.isDirectory()) return "directory";
    if (stats && stats.isSymbolicLink()) {
      const full = entry.fullPath;
      try {
        const entryRealPath = await promises.realpath(full);
        const entryRealPathStats = await promises.lstat(entryRealPath);
        if (entryRealPathStats.isFile()) {
          return "file";
        }
        if (entryRealPathStats.isDirectory()) {
          const len = entryRealPath.length;
          if (
            full.startsWith(entryRealPath) &&
            full.substr(len, 1) === sp.sep
          ) {
            const recursiveError = new Error(
              `Circular symlink detected: "${full}" points to "${entryRealPath}"`,
            );
            recursiveError.code = RECURSIVE_ERROR_CODE;
            return this._onError(recursiveError);
          }
          return "directory";
        }
      } catch (error) {
        this._onError(error);
        return "";
      }
    }
  }
  _includeAsFile(entry) {
    const stats = entry && entry[this._statsProp];
    return stats && this._wantsEverything && !stats.isDirectory();
  }
}
function readdirp(root, options = {}) {
  let type = options.entryType || options.type;
  if (type === "both") type = EntryTypes.FILE_DIR_TYPE;
  if (type) options.type = type;
  if (!root) {
    throw new Error(
      "readdirp: root argument is required. Usage: readdirp(root, options)",
    );
  } else if (typeof root !== "string") {
    throw new TypeError(
      "readdirp: root argument must be a string. Usage: readdirp(root, options)",
    );
  } else if (type && !ALL_TYPES.includes(type)) {
    throw new Error(
      `readdirp: Invalid type passed. Use one of ${ALL_TYPES.join(", ")}`,
    );
  }
  options.root = root;
  return new ReaddirpStream(options);
}
const STR_DATA = "data";
const STR_END = "end";
const STR_CLOSE = "close";
const EMPTY_FN = () => {};
const pl = process.platform;
const isWindows = pl === "win32";
const isMacos = pl === "darwin";
const isLinux = pl === "linux";
const isFreeBSD = pl === "freebsd";
const isIBMi = node_os.type() === "OS400";
const EVENTS = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error",
};
const EV = EVENTS;
const THROTTLE_MODE_WATCH = "watch";
const statMethods = { lstat: promises.lstat, stat: promises.stat };
const KEY_LISTENERS = "listeners";
const KEY_ERR = "errHandlers";
const KEY_RAW = "rawEmitters";
const HANDLER_KEYS = [KEY_LISTENERS, KEY_ERR, KEY_RAW];
const binaryExtensions = /* @__PURE__ */ new Set([
  "3dm",
  "3ds",
  "3g2",
  "3gp",
  "7z",
  "a",
  "aac",
  "adp",
  "afdesign",
  "afphoto",
  "afpub",
  "ai",
  "aif",
  "aiff",
  "alz",
  "ape",
  "apk",
  "appimage",
  "ar",
  "arj",
  "asf",
  "au",
  "avi",
  "bak",
  "baml",
  "bh",
  "bin",
  "bk",
  "bmp",
  "btif",
  "bz2",
  "bzip2",
  "cab",
  "caf",
  "cgm",
  "class",
  "cmx",
  "cpio",
  "cr2",
  "cur",
  "dat",
  "dcm",
  "deb",
  "dex",
  "djvu",
  "dll",
  "dmg",
  "dng",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dra",
  "DS_Store",
  "dsk",
  "dts",
  "dtshd",
  "dvb",
  "dwg",
  "dxf",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "egg",
  "eol",
  "eot",
  "epub",
  "exe",
  "f4v",
  "fbs",
  "fh",
  "fla",
  "flac",
  "flatpak",
  "fli",
  "flv",
  "fpx",
  "fst",
  "fvt",
  "g3",
  "gh",
  "gif",
  "graffle",
  "gz",
  "gzip",
  "h261",
  "h263",
  "h264",
  "icns",
  "ico",
  "ief",
  "img",
  "ipa",
  "iso",
  "jar",
  "jpeg",
  "jpg",
  "jpgv",
  "jpm",
  "jxr",
  "key",
  "ktx",
  "lha",
  "lib",
  "lvp",
  "lz",
  "lzh",
  "lzma",
  "lzo",
  "m3u",
  "m4a",
  "m4v",
  "mar",
  "mdi",
  "mht",
  "mid",
  "midi",
  "mj2",
  "mka",
  "mkv",
  "mmr",
  "mng",
  "mobi",
  "mov",
  "movie",
  "mp3",
  "mp4",
  "mp4a",
  "mpeg",
  "mpg",
  "mpga",
  "mxu",
  "nef",
  "npx",
  "numbers",
  "nupkg",
  "o",
  "odp",
  "ods",
  "odt",
  "oga",
  "ogg",
  "ogv",
  "otf",
  "ott",
  "pages",
  "pbm",
  "pcx",
  "pdb",
  "pdf",
  "pea",
  "pgm",
  "pic",
  "png",
  "pnm",
  "pot",
  "potm",
  "potx",
  "ppa",
  "ppam",
  "ppm",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "psd",
  "pya",
  "pyc",
  "pyo",
  "pyv",
  "qt",
  "rar",
  "ras",
  "raw",
  "resources",
  "rgb",
  "rip",
  "rlc",
  "rmf",
  "rmvb",
  "rpm",
  "rtf",
  "rz",
  "s3m",
  "s7z",
  "scpt",
  "sgi",
  "shar",
  "snap",
  "sil",
  "sketch",
  "slk",
  "smv",
  "snk",
  "so",
  "stl",
  "suo",
  "sub",
  "swf",
  "tar",
  "tbz",
  "tbz2",
  "tga",
  "tgz",
  "thmx",
  "tif",
  "tiff",
  "tlz",
  "ttc",
  "ttf",
  "txz",
  "udf",
  "uvh",
  "uvi",
  "uvm",
  "uvp",
  "uvs",
  "uvu",
  "viv",
  "vob",
  "war",
  "wav",
  "wax",
  "wbmp",
  "wdp",
  "weba",
  "webm",
  "webp",
  "whl",
  "wim",
  "wm",
  "wma",
  "wmv",
  "wmx",
  "woff",
  "woff2",
  "wrm",
  "wvx",
  "xbm",
  "xif",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xm",
  "xmind",
  "xpi",
  "xpm",
  "xwd",
  "xz",
  "z",
  "zip",
  "zipx",
]);
const isBinaryPath = (filePath) =>
  binaryExtensions.has(sp__namespace.extname(filePath).slice(1).toLowerCase());
const foreach = (val, fn) => {
  if (val instanceof Set) {
    val.forEach(fn);
  } else {
    fn(val);
  }
};
const addAndConvert = (main, prop, item) => {
  let container = main[prop];
  if (!(container instanceof Set)) {
    main[prop] = container = /* @__PURE__ */ new Set([container]);
  }
  container.add(item);
};
const clearItem = (cont) => (key) => {
  const set = cont[key];
  if (set instanceof Set) {
    set.clear();
  } else {
    delete cont[key];
  }
};
const delFromSet = (main, prop, item) => {
  const container = main[prop];
  if (container instanceof Set) {
    container.delete(item);
  } else if (container === item) {
    delete main[prop];
  }
};
const isEmptySet = (val) => (val instanceof Set ? val.size === 0 : !val);
const FsWatchInstances = /* @__PURE__ */ new Map();
function createFsWatchInstance(path2, options, listener, errHandler, emitRaw) {
  const handleEvent = (rawEvent, evPath) => {
    listener(path2);
    emitRaw(rawEvent, evPath, { watchedPath: path2 });
    if (evPath && path2 !== evPath) {
      fsWatchBroadcast(
        sp__namespace.resolve(path2, evPath),
        KEY_LISTENERS,
        sp__namespace.join(path2, evPath),
      );
    }
  };
  try {
    return node_fs.watch(
      path2,
      {
        persistent: options.persistent,
      },
      handleEvent,
    );
  } catch (error) {
    errHandler(error);
    return void 0;
  }
}
const fsWatchBroadcast = (fullPath, listenerType, val1, val2, val3) => {
  const cont = FsWatchInstances.get(fullPath);
  if (!cont) return;
  foreach(cont[listenerType], (listener) => {
    listener(val1, val2, val3);
  });
};
const setFsWatchListener = (path2, fullPath, options, handlers) => {
  const { listener, errHandler, rawEmitter } = handlers;
  let cont = FsWatchInstances.get(fullPath);
  let watcher;
  if (!options.persistent) {
    watcher = createFsWatchInstance(
      path2,
      options,
      listener,
      errHandler,
      rawEmitter,
    );
    if (!watcher) return;
    return watcher.close.bind(watcher);
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_ERR, errHandler);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    watcher = createFsWatchInstance(
      path2,
      options,
      fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS),
      errHandler,
      // no need to use broadcast here
      fsWatchBroadcast.bind(null, fullPath, KEY_RAW),
    );
    if (!watcher) return;
    watcher.on(EV.ERROR, async (error) => {
      const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);
      if (cont) cont.watcherUnusable = true;
      if (isWindows && error.code === "EPERM") {
        try {
          const fd = await promises.open(path2, "r");
          await fd.close();
          broadcastErr(error);
        } catch (err) {}
      } else {
        broadcastErr(error);
      }
    });
    cont = {
      listeners: listener,
      errHandlers: errHandler,
      rawEmitters: rawEmitter,
      watcher,
    };
    FsWatchInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_ERR, errHandler);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      cont.watcher.close();
      FsWatchInstances.delete(fullPath);
      HANDLER_KEYS.forEach(clearItem(cont));
      cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
const FsWatchFileInstances = /* @__PURE__ */ new Map();
const setFsWatchFileListener = (path2, fullPath, options, handlers) => {
  const { listener, rawEmitter } = handlers;
  let cont = FsWatchFileInstances.get(fullPath);
  const copts = cont && cont.options;
  if (
    copts &&
    (copts.persistent < options.persistent || copts.interval > options.interval)
  ) {
    node_fs.unwatchFile(fullPath);
    cont = void 0;
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    cont = {
      listeners: listener,
      rawEmitters: rawEmitter,
      options,
      watcher: node_fs.watchFile(fullPath, options, (curr, prev) => {
        foreach(cont.rawEmitters, (rawEmitter2) => {
          rawEmitter2(EV.CHANGE, fullPath, { curr, prev });
        });
        const currmtime = curr.mtimeMs;
        if (
          curr.size !== prev.size ||
          currmtime > prev.mtimeMs ||
          currmtime === 0
        ) {
          foreach(cont.listeners, (listener2) => listener2(path2, curr));
        }
      }),
    };
    FsWatchFileInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      FsWatchFileInstances.delete(fullPath);
      node_fs.unwatchFile(fullPath);
      cont.options = cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
class NodeFsHandler {
  fsw;
  _boundHandleError;
  constructor(fsW) {
    this.fsw = fsW;
    this._boundHandleError = (error) => fsW._handleError(error);
  }
  /**
   * Watch file for changes with fs_watchFile or fs_watch.
   * @param path to file or dir
   * @param listener on fs change
   * @returns closer for the watcher instance
   */
  _watchWithNodeFs(path2, listener) {
    const opts = this.fsw.options;
    const directory = sp__namespace.dirname(path2);
    const basename = sp__namespace.basename(path2);
    const parent = this.fsw._getWatchedDir(directory);
    parent.add(basename);
    const absolutePath = sp__namespace.resolve(path2);
    const options = {
      persistent: opts.persistent,
    };
    if (!listener) listener = EMPTY_FN;
    let closer;
    if (opts.usePolling) {
      const enableBin = opts.interval !== opts.binaryInterval;
      options.interval =
        enableBin && isBinaryPath(basename)
          ? opts.binaryInterval
          : opts.interval;
      closer = setFsWatchFileListener(path2, absolutePath, options, {
        listener,
        rawEmitter: this.fsw._emitRaw,
      });
    } else {
      closer = setFsWatchListener(path2, absolutePath, options, {
        listener,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw,
      });
    }
    return closer;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(file, stats, initialAdd) {
    if (this.fsw.closed) {
      return;
    }
    const dirname = sp__namespace.dirname(file);
    const basename = sp__namespace.basename(file);
    const parent = this.fsw._getWatchedDir(dirname);
    let prevStats = stats;
    if (parent.has(basename)) return;
    const listener = async (path2, newStats) => {
      if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5)) return;
      if (!newStats || newStats.mtimeMs === 0) {
        try {
          const newStats2 = await promises.stat(file);
          if (this.fsw.closed) return;
          const at = newStats2.atimeMs;
          const mt = newStats2.mtimeMs;
          if (!at || at <= mt || mt !== prevStats.mtimeMs) {
            this.fsw._emit(EV.CHANGE, file, newStats2);
          }
          if (
            (isMacos || isLinux || isFreeBSD) &&
            prevStats.ino !== newStats2.ino
          ) {
            this.fsw._closeFile(path2);
            prevStats = newStats2;
            const closer2 = this._watchWithNodeFs(file, listener);
            if (closer2) this.fsw._addPathCloser(path2, closer2);
          } else {
            prevStats = newStats2;
          }
        } catch (error) {
          this.fsw._remove(dirname, basename);
        }
      } else if (parent.has(basename)) {
        const at = newStats.atimeMs;
        const mt = newStats.mtimeMs;
        if (!at || at <= mt || mt !== prevStats.mtimeMs) {
          this.fsw._emit(EV.CHANGE, file, newStats);
        }
        prevStats = newStats;
      }
    };
    const closer = this._watchWithNodeFs(file, listener);
    if (
      !(initialAdd && this.fsw.options.ignoreInitial) &&
      this.fsw._isntIgnored(file)
    ) {
      if (!this.fsw._throttle(EV.ADD, file, 0)) return;
      this.fsw._emit(EV.ADD, file, stats);
    }
    return closer;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(entry, directory, path2, item) {
    if (this.fsw.closed) {
      return;
    }
    const full = entry.fullPath;
    const dir = this.fsw._getWatchedDir(directory);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let linkPath;
      try {
        linkPath = await promises.realpath(path2);
      } catch (e) {
        this.fsw._emitReady();
        return true;
      }
      if (this.fsw.closed) return;
      if (dir.has(item)) {
        if (this.fsw._symlinkPaths.get(full) !== linkPath) {
          this.fsw._symlinkPaths.set(full, linkPath);
          this.fsw._emit(EV.CHANGE, path2, entry.stats);
        }
      } else {
        dir.add(item);
        this.fsw._symlinkPaths.set(full, linkPath);
        this.fsw._emit(EV.ADD, path2, entry.stats);
      }
      this.fsw._emitReady();
      return true;
    }
    if (this.fsw._symlinkPaths.has(full)) {
      return true;
    }
    this.fsw._symlinkPaths.set(full, true);
  }
  _handleRead(directory, initialAdd, wh, target, dir, depth, throttler) {
    directory = sp__namespace.join(directory, "");
    const throttleKey = target ? `${directory}:${target}` : directory;
    throttler = this.fsw._throttle("readdir", throttleKey, 1e3);
    if (!throttler) return;
    const previous = this.fsw._getWatchedDir(wh.path);
    const current = /* @__PURE__ */ new Set();
    let stream = this.fsw._readdirp(directory, {
      fileFilter: (entry) => wh.filterPath(entry),
      directoryFilter: (entry) => wh.filterDir(entry),
    });
    if (!stream) return;
    stream
      .on(STR_DATA, async (entry) => {
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        const item = entry.path;
        let path2 = sp__namespace.join(directory, item);
        current.add(item);
        if (
          entry.stats.isSymbolicLink() &&
          (await this._handleSymlink(entry, directory, path2, item))
        ) {
          return;
        }
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        if (item === target || (!target && !previous.has(item))) {
          this.fsw._incrReadyCount();
          path2 = sp__namespace.join(dir, sp__namespace.relative(dir, path2));
          this._addToNodeFs(path2, initialAdd, wh, depth + 1);
        }
      })
      .on(EV.ERROR, this._boundHandleError);
    return new Promise((resolve, reject) => {
      if (!stream) return reject();
      stream.once(STR_END, () => {
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        const wasThrottled = throttler ? throttler.clear() : false;
        resolve(void 0);
        previous
          .getChildren()
          .filter((item) => {
            return item !== directory && !current.has(item);
          })
          .forEach((item) => {
            this.fsw._remove(directory, item);
          });
        stream = void 0;
        if (wasThrottled)
          this._handleRead(directory, false, wh, target, dir, depth, throttler);
      });
    });
  }
  /**
   * Read directory to add / remove files from `@watched` list and re-read it on change.
   * @param dir fs path
   * @param stats
   * @param initialAdd
   * @param depth relative to user-supplied path
   * @param target child path targeted for watch
   * @param wh Common watch helpers for this path
   * @param realpath
   * @returns closer for the watcher instance.
   */
  async _handleDir(dir, stats, initialAdd, depth, target, wh, realpath) {
    const parentDir = this.fsw._getWatchedDir(sp__namespace.dirname(dir));
    const tracked = parentDir.has(sp__namespace.basename(dir));
    if (
      !(initialAdd && this.fsw.options.ignoreInitial) &&
      !target &&
      !tracked
    ) {
      this.fsw._emit(EV.ADD_DIR, dir, stats);
    }
    parentDir.add(sp__namespace.basename(dir));
    this.fsw._getWatchedDir(dir);
    let throttler;
    let closer;
    const oDepth = this.fsw.options.depth;
    if (
      (oDepth == null || depth <= oDepth) &&
      !this.fsw._symlinkPaths.has(realpath)
    ) {
      if (!target) {
        await this._handleRead(
          dir,
          initialAdd,
          wh,
          target,
          dir,
          depth,
          throttler,
        );
        if (this.fsw.closed) return;
      }
      closer = this._watchWithNodeFs(dir, (dirPath, stats2) => {
        if (stats2 && stats2.mtimeMs === 0) return;
        this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
      });
    }
    return closer;
  }
  /**
   * Handle added file, directory, or glob pattern.
   * Delegates call to _handleFile / _handleDir after checks.
   * @param path to file or ir
   * @param initialAdd was the file added at watch instantiation?
   * @param priorWh depth relative to user-supplied path
   * @param depth Child path actually targeted for watch
   * @param target Child path actually targeted for watch
   */
  async _addToNodeFs(path2, initialAdd, priorWh, depth, target) {
    const ready = this.fsw._emitReady;
    if (this.fsw._isIgnored(path2) || this.fsw.closed) {
      ready();
      return false;
    }
    const wh = this.fsw._getWatchHelpers(path2);
    if (priorWh) {
      wh.filterPath = (entry) => priorWh.filterPath(entry);
      wh.filterDir = (entry) => priorWh.filterDir(entry);
    }
    try {
      const stats = await statMethods[wh.statMethod](wh.watchPath);
      if (this.fsw.closed) return;
      if (this.fsw._isIgnored(wh.watchPath, stats)) {
        ready();
        return false;
      }
      const follow = this.fsw.options.followSymlinks;
      let closer;
      if (stats.isDirectory()) {
        const absPath = sp__namespace.resolve(path2);
        const targetPath = follow ? await promises.realpath(path2) : path2;
        if (this.fsw.closed) return;
        closer = await this._handleDir(
          wh.watchPath,
          stats,
          initialAdd,
          depth,
          target,
          wh,
          targetPath,
        );
        if (this.fsw.closed) return;
        if (absPath !== targetPath && targetPath !== void 0) {
          this.fsw._symlinkPaths.set(absPath, targetPath);
        }
      } else if (stats.isSymbolicLink()) {
        const targetPath = follow ? await promises.realpath(path2) : path2;
        if (this.fsw.closed) return;
        const parent = sp__namespace.dirname(wh.watchPath);
        this.fsw._getWatchedDir(parent).add(wh.watchPath);
        this.fsw._emit(EV.ADD, wh.watchPath, stats);
        closer = await this._handleDir(
          parent,
          stats,
          initialAdd,
          depth,
          path2,
          wh,
          targetPath,
        );
        if (this.fsw.closed) return;
        if (targetPath !== void 0) {
          this.fsw._symlinkPaths.set(sp__namespace.resolve(path2), targetPath);
        }
      } else {
        closer = this._handleFile(wh.watchPath, stats, initialAdd);
      }
      ready();
      if (closer) this.fsw._addPathCloser(path2, closer);
      return false;
    } catch (error) {
      if (this.fsw._handleError(error)) {
        ready();
        return path2;
      }
    }
  }
}
/*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) */
const SLASH = "/";
const SLASH_SLASH = "//";
const ONE_DOT = ".";
const TWO_DOTS = "..";
const STRING_TYPE = "string";
const BACK_SLASH_RE = /\\/g;
const DOUBLE_SLASH_RE = /\/\//g;
const DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
const REPLACER_RE = /^\.[/\\]/;
function arrify(item) {
  return Array.isArray(item) ? item : [item];
}
const isMatcherObject = (matcher) =>
  typeof matcher === "object" &&
  matcher !== null &&
  !(matcher instanceof RegExp);
function createPattern(matcher) {
  if (typeof matcher === "function") return matcher;
  if (typeof matcher === "string") return (string) => matcher === string;
  if (matcher instanceof RegExp) return (string) => matcher.test(string);
  if (typeof matcher === "object" && matcher !== null) {
    return (string) => {
      if (matcher.path === string) return true;
      if (matcher.recursive) {
        const relative = sp__namespace.relative(matcher.path, string);
        if (!relative) {
          return false;
        }
        return (
          !relative.startsWith("..") && !sp__namespace.isAbsolute(relative)
        );
      }
      return false;
    };
  }
  return () => false;
}
function normalizePath(path2) {
  if (typeof path2 !== "string") throw new Error("string expected");
  path2 = sp__namespace.normalize(path2);
  path2 = path2.replace(/\\/g, "/");
  let prepend = false;
  if (path2.startsWith("//")) prepend = true;
  path2 = path2.replace(DOUBLE_SLASH_RE, "/");
  if (prepend) path2 = "/" + path2;
  return path2;
}
function matchPatterns(patterns, testString, stats) {
  const path2 = normalizePath(testString);
  for (let index = 0; index < patterns.length; index++) {
    const pattern = patterns[index];
    if (pattern(path2, stats)) {
      return true;
    }
  }
  return false;
}
function anymatch(matchers, testString) {
  if (matchers == null) {
    throw new TypeError("anymatch: specify first argument");
  }
  const matchersArray = arrify(matchers);
  const patterns = matchersArray.map((matcher) => createPattern(matcher));
  {
    return (testString2, stats) => {
      return matchPatterns(patterns, testString2, stats);
    };
  }
}
const unifyPaths = (paths_) => {
  const paths = arrify(paths_).flat();
  if (!paths.every((p) => typeof p === STRING_TYPE)) {
    throw new TypeError(`Non-string provided as watch path: ${paths}`);
  }
  return paths.map(normalizePathToUnix);
};
const toUnix = (string) => {
  let str = string.replace(BACK_SLASH_RE, SLASH);
  let prepend = false;
  if (str.startsWith(SLASH_SLASH)) {
    prepend = true;
  }
  str = str.replace(DOUBLE_SLASH_RE, SLASH);
  if (prepend) {
    str = SLASH + str;
  }
  return str;
};
const normalizePathToUnix = (path2) =>
  toUnix(sp__namespace.normalize(toUnix(path2)));
const normalizeIgnored =
  (cwd = "") =>
  (path2) => {
    if (typeof path2 === "string") {
      return normalizePathToUnix(
        sp__namespace.isAbsolute(path2)
          ? path2
          : sp__namespace.join(cwd, path2),
      );
    } else {
      return path2;
    }
  };
const getAbsolutePath = (path2, cwd) => {
  if (sp__namespace.isAbsolute(path2)) {
    return path2;
  }
  return sp__namespace.join(cwd, path2);
};
const EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
class DirEntry {
  path;
  _removeWatcher;
  items;
  constructor(dir, removeWatcher) {
    this.path = dir;
    this._removeWatcher = removeWatcher;
    this.items = /* @__PURE__ */ new Set();
  }
  add(item) {
    const { items } = this;
    if (!items) return;
    if (item !== ONE_DOT && item !== TWO_DOTS) items.add(item);
  }
  async remove(item) {
    const { items } = this;
    if (!items) return;
    items.delete(item);
    if (items.size > 0) return;
    const dir = this.path;
    try {
      await promises.readdir(dir);
    } catch (err) {
      if (this._removeWatcher) {
        this._removeWatcher(
          sp__namespace.dirname(dir),
          sp__namespace.basename(dir),
        );
      }
    }
  }
  has(item) {
    const { items } = this;
    if (!items) return;
    return items.has(item);
  }
  getChildren() {
    const { items } = this;
    if (!items) return [];
    return [...items.values()];
  }
  dispose() {
    this.items.clear();
    this.path = "";
    this._removeWatcher = EMPTY_FN;
    this.items = EMPTY_SET;
    Object.freeze(this);
  }
}
const STAT_METHOD_F = "stat";
const STAT_METHOD_L = "lstat";
class WatchHelper {
  fsw;
  path;
  watchPath;
  fullWatchPath;
  dirParts;
  followSymlinks;
  statMethod;
  constructor(path2, follow, fsw) {
    this.fsw = fsw;
    const watchPath = path2;
    this.path = path2 = path2.replace(REPLACER_RE, "");
    this.watchPath = watchPath;
    this.fullWatchPath = sp__namespace.resolve(watchPath);
    this.dirParts = [];
    this.dirParts.forEach((parts) => {
      if (parts.length > 1) parts.pop();
    });
    this.followSymlinks = follow;
    this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
  }
  entryPath(entry) {
    return sp__namespace.join(
      this.watchPath,
      sp__namespace.relative(this.watchPath, entry.fullPath),
    );
  }
  filterPath(entry) {
    const { stats } = entry;
    if (stats && stats.isSymbolicLink()) return this.filterDir(entry);
    const resolvedPath = this.entryPath(entry);
    return (
      this.fsw._isntIgnored(resolvedPath, stats) &&
      this.fsw._hasReadPermissions(stats)
    );
  }
  filterDir(entry) {
    return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
  }
}
class FSWatcher extends node_events.EventEmitter {
  closed;
  options;
  _closers;
  _ignoredPaths;
  _throttled;
  _streams;
  _symlinkPaths;
  _watched;
  _pendingWrites;
  _pendingUnlinks;
  _readyCount;
  _emitReady;
  _closePromise;
  _userIgnored;
  _readyEmitted;
  _emitRaw;
  _boundRemove;
  _nodeFsHandler;
  // Not indenting methods for history sake; for now.
  constructor(_opts = {}) {
    super();
    this.closed = false;
    this._closers = /* @__PURE__ */ new Map();
    this._ignoredPaths = /* @__PURE__ */ new Set();
    this._throttled = /* @__PURE__ */ new Map();
    this._streams = /* @__PURE__ */ new Set();
    this._symlinkPaths = /* @__PURE__ */ new Map();
    this._watched = /* @__PURE__ */ new Map();
    this._pendingWrites = /* @__PURE__ */ new Map();
    this._pendingUnlinks = /* @__PURE__ */ new Map();
    this._readyCount = 0;
    this._readyEmitted = false;
    const awf = _opts.awaitWriteFinish;
    const DEF_AWF = { stabilityThreshold: 2e3, pollInterval: 100 };
    const opts = {
      // Defaults
      persistent: true,
      ignoreInitial: false,
      ignorePermissionErrors: false,
      interval: 100,
      binaryInterval: 300,
      followSymlinks: true,
      usePolling: false,
      // useAsync: false,
      atomic: true,
      // NOTE: overwritten later (depends on usePolling)
      ..._opts,
      // Change format
      ignored: _opts.ignored ? arrify(_opts.ignored) : arrify([]),
      awaitWriteFinish:
        awf === true
          ? DEF_AWF
          : typeof awf === "object"
            ? { ...DEF_AWF, ...awf }
            : false,
    };
    if (isIBMi) opts.usePolling = true;
    if (opts.atomic === void 0) opts.atomic = !opts.usePolling;
    const envPoll = process.env.CHOKIDAR_USEPOLLING;
    if (envPoll !== void 0) {
      const envLower = envPoll.toLowerCase();
      if (envLower === "false" || envLower === "0") opts.usePolling = false;
      else if (envLower === "true" || envLower === "1") opts.usePolling = true;
      else opts.usePolling = !!envLower;
    }
    const envInterval = process.env.CHOKIDAR_INTERVAL;
    if (envInterval) opts.interval = Number.parseInt(envInterval, 10);
    let readyCalls = 0;
    this._emitReady = () => {
      readyCalls++;
      if (readyCalls >= this._readyCount) {
        this._emitReady = EMPTY_FN;
        this._readyEmitted = true;
        process.nextTick(() => this.emit(EVENTS.READY));
      }
    };
    this._emitRaw = (...args) => this.emit(EVENTS.RAW, ...args);
    this._boundRemove = this._remove.bind(this);
    this.options = opts;
    this._nodeFsHandler = new NodeFsHandler(this);
    Object.freeze(opts);
  }
  _addIgnoredPath(matcher) {
    if (isMatcherObject(matcher)) {
      for (const ignored of this._ignoredPaths) {
        if (
          isMatcherObject(ignored) &&
          ignored.path === matcher.path &&
          ignored.recursive === matcher.recursive
        ) {
          return;
        }
      }
    }
    this._ignoredPaths.add(matcher);
  }
  _removeIgnoredPath(matcher) {
    this._ignoredPaths.delete(matcher);
    if (typeof matcher === "string") {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher) {
          this._ignoredPaths.delete(ignored);
        }
      }
    }
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(paths_, _origAdd, _internal) {
    const { cwd } = this.options;
    this.closed = false;
    this._closePromise = void 0;
    let paths = unifyPaths(paths_);
    if (cwd) {
      paths = paths.map((path2) => {
        const absPath = getAbsolutePath(path2, cwd);
        return absPath;
      });
    }
    paths.forEach((path2) => {
      this._removeIgnoredPath(path2);
    });
    this._userIgnored = void 0;
    if (!this._readyCount) this._readyCount = 0;
    this._readyCount += paths.length;
    Promise.all(
      paths.map(async (path2) => {
        const res = await this._nodeFsHandler._addToNodeFs(
          path2,
          !_internal,
          void 0,
          0,
          _origAdd,
        );
        if (res) this._emitReady();
        return res;
      }),
    ).then((results) => {
      if (this.closed) return;
      results.forEach((item) => {
        if (item)
          this.add(
            sp__namespace.dirname(item),
            sp__namespace.basename(_origAdd || item),
          );
      });
    });
    return this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(paths_) {
    if (this.closed) return this;
    const paths = unifyPaths(paths_);
    const { cwd } = this.options;
    paths.forEach((path2) => {
      if (!sp__namespace.isAbsolute(path2) && !this._closers.has(path2)) {
        if (cwd) path2 = sp__namespace.join(cwd, path2);
        path2 = sp__namespace.resolve(path2);
      }
      this._closePath(path2);
      this._addIgnoredPath(path2);
      if (this._watched.has(path2)) {
        this._addIgnoredPath({
          path: path2,
          recursive: true,
        });
      }
      this._userIgnored = void 0;
    });
    return this;
  }
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close() {
    if (this._closePromise) {
      return this._closePromise;
    }
    this.closed = true;
    this.removeAllListeners();
    const closers = [];
    this._closers.forEach((closerList) =>
      closerList.forEach((closer) => {
        const promise = closer();
        if (promise instanceof Promise) closers.push(promise);
      }),
    );
    this._streams.forEach((stream) => stream.destroy());
    this._userIgnored = void 0;
    this._readyCount = 0;
    this._readyEmitted = false;
    this._watched.forEach((dirent) => dirent.dispose());
    this._closers.clear();
    this._watched.clear();
    this._streams.clear();
    this._symlinkPaths.clear();
    this._throttled.clear();
    this._closePromise = closers.length
      ? Promise.all(closers).then(() => void 0)
      : Promise.resolve();
    return this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const watchList = {};
    this._watched.forEach((entry, dir) => {
      const key = this.options.cwd
        ? sp__namespace.relative(this.options.cwd, dir)
        : dir;
      const index = key || ONE_DOT;
      watchList[index] = entry.getChildren().sort();
    });
    return watchList;
  }
  emitWithAll(event, args) {
    this.emit(event, ...args);
    if (event !== EVENTS.ERROR) this.emit(EVENTS.ALL, event, ...args);
  }
  // Common helpers
  // --------------
  /**
   * Normalize and emit events.
   * Calling _emit DOES NOT MEAN emit() would be called!
   * @param event Type of event
   * @param path File or directory path
   * @param stats arguments to be passed with event
   * @returns the error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  async _emit(event, path2, stats) {
    if (this.closed) return;
    const opts = this.options;
    if (isWindows) path2 = sp__namespace.normalize(path2);
    if (opts.cwd) path2 = sp__namespace.relative(opts.cwd, path2);
    const args = [path2];
    if (stats != null) args.push(stats);
    const awf = opts.awaitWriteFinish;
    let pw;
    if (awf && (pw = this._pendingWrites.get(path2))) {
      pw.lastChange = /* @__PURE__ */ new Date();
      return this;
    }
    if (opts.atomic) {
      if (event === EVENTS.UNLINK) {
        this._pendingUnlinks.set(path2, [event, ...args]);
        setTimeout(
          () => {
            this._pendingUnlinks.forEach((entry, path22) => {
              this.emit(...entry);
              this.emit(EVENTS.ALL, ...entry);
              this._pendingUnlinks.delete(path22);
            });
          },
          typeof opts.atomic === "number" ? opts.atomic : 100,
        );
        return this;
      }
      if (event === EVENTS.ADD && this._pendingUnlinks.has(path2)) {
        event = EVENTS.CHANGE;
        this._pendingUnlinks.delete(path2);
      }
    }
    if (
      awf &&
      (event === EVENTS.ADD || event === EVENTS.CHANGE) &&
      this._readyEmitted
    ) {
      const awfEmit = (err, stats2) => {
        if (err) {
          event = EVENTS.ERROR;
          args[0] = err;
          this.emitWithAll(event, args);
        } else if (stats2) {
          if (args.length > 1) {
            args[1] = stats2;
          } else {
            args.push(stats2);
          }
          this.emitWithAll(event, args);
        }
      };
      this._awaitWriteFinish(path2, awf.stabilityThreshold, event, awfEmit);
      return this;
    }
    if (event === EVENTS.CHANGE) {
      const isThrottled = !this._throttle(EVENTS.CHANGE, path2, 50);
      if (isThrottled) return this;
    }
    if (
      opts.alwaysStat &&
      stats === void 0 &&
      (event === EVENTS.ADD ||
        event === EVENTS.ADD_DIR ||
        event === EVENTS.CHANGE)
    ) {
      const fullPath = opts.cwd ? sp__namespace.join(opts.cwd, path2) : path2;
      let stats2;
      try {
        stats2 = await promises.stat(fullPath);
      } catch (err) {}
      if (!stats2 || this.closed) return;
      args.push(stats2);
    }
    this.emitWithAll(event, args);
    return this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(error) {
    const code = error && error.code;
    if (
      error &&
      code !== "ENOENT" &&
      code !== "ENOTDIR" &&
      (!this.options.ignorePermissionErrors ||
        (code !== "EPERM" && code !== "EACCES"))
    ) {
      this.emit(EVENTS.ERROR, error);
    }
    return error || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(actionType, path2, timeout) {
    if (!this._throttled.has(actionType)) {
      this._throttled.set(actionType, /* @__PURE__ */ new Map());
    }
    const action = this._throttled.get(actionType);
    if (!action) throw new Error("invalid throttle");
    const actionPath = action.get(path2);
    if (actionPath) {
      actionPath.count++;
      return false;
    }
    let timeoutObject;
    const clear = () => {
      const item = action.get(path2);
      const count = item ? item.count : 0;
      action.delete(path2);
      clearTimeout(timeoutObject);
      if (item) clearTimeout(item.timeoutObject);
      return count;
    };
    timeoutObject = setTimeout(clear, timeout);
    const thr = { timeoutObject, clear, count: 0 };
    action.set(path2, thr);
    return thr;
  }
  _incrReadyCount() {
    return this._readyCount++;
  }
  /**
   * Awaits write operation to finish.
   * Polls a newly created file for size variations. When files size does not change for 'threshold' milliseconds calls callback.
   * @param path being acted upon
   * @param threshold Time in milliseconds a file size must be fixed before acknowledging write OP is finished
   * @param event
   * @param awfEmit Callback to be called when ready for event to be emitted.
   */
  _awaitWriteFinish(path2, threshold, event, awfEmit) {
    const awf = this.options.awaitWriteFinish;
    if (typeof awf !== "object") return;
    const pollInterval = awf.pollInterval;
    let timeoutHandler;
    let fullPath = path2;
    if (this.options.cwd && !sp__namespace.isAbsolute(path2)) {
      fullPath = sp__namespace.join(this.options.cwd, path2);
    }
    const now = /* @__PURE__ */ new Date();
    const writes = this._pendingWrites;
    function awaitWriteFinishFn(prevStat) {
      node_fs.stat(fullPath, (err, curStat) => {
        if (err || !writes.has(path2)) {
          if (err && err.code !== "ENOENT") awfEmit(err);
          return;
        }
        const now2 = Number(/* @__PURE__ */ new Date());
        if (prevStat && curStat.size !== prevStat.size) {
          writes.get(path2).lastChange = now2;
        }
        const pw = writes.get(path2);
        const df = now2 - pw.lastChange;
        if (df >= threshold) {
          writes.delete(path2);
          awfEmit(void 0, curStat);
        } else {
          timeoutHandler = setTimeout(
            awaitWriteFinishFn,
            pollInterval,
            curStat,
          );
        }
      });
    }
    if (!writes.has(path2)) {
      writes.set(path2, {
        lastChange: now,
        cancelWait: () => {
          writes.delete(path2);
          clearTimeout(timeoutHandler);
          return event;
        },
      });
      timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
    }
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(path2, stats) {
    if (this.options.atomic && DOT_RE.test(path2)) return true;
    if (!this._userIgnored) {
      const { cwd } = this.options;
      const ign = this.options.ignored;
      const ignored = (ign || []).map(normalizeIgnored(cwd));
      const ignoredPaths = [...this._ignoredPaths];
      const list = [...ignoredPaths.map(normalizeIgnored(cwd)), ...ignored];
      this._userIgnored = anymatch(list);
    }
    return this._userIgnored(path2, stats);
  }
  _isntIgnored(path2, stat2) {
    return !this._isIgnored(path2, stat2);
  }
  /**
   * Provides a set of common helpers and properties relating to symlink handling.
   * @param path file or directory pattern being watched
   */
  _getWatchHelpers(path2) {
    return new WatchHelper(path2, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(directory) {
    const dir = sp__namespace.resolve(directory);
    if (!this._watched.has(dir))
      this._watched.set(dir, new DirEntry(dir, this._boundRemove));
    return this._watched.get(dir);
  }
  // File helpers
  // ------------
  /**
   * Check for read permissions: https://stackoverflow.com/a/11781404/1358405
   */
  _hasReadPermissions(stats) {
    if (this.options.ignorePermissionErrors) return true;
    return Boolean(Number(stats.mode) & 256);
  }
  /**
   * Handles emitting unlink events for
   * files and directories, and via recursion, for
   * files and directories within directories that are unlinked
   * @param directory within which the following item is located
   * @param item      base path of item/directory
   */
  _remove(directory, item, isDirectory) {
    const path2 = sp__namespace.join(directory, item);
    const fullPath = sp__namespace.resolve(path2);
    isDirectory =
      isDirectory != null
        ? isDirectory
        : this._watched.has(path2) || this._watched.has(fullPath);
    if (!this._throttle("remove", path2, 100)) return;
    if (!isDirectory && this._watched.size === 1) {
      this.add(directory, item, true);
    }
    const wp = this._getWatchedDir(path2);
    const nestedDirectoryChildren = wp.getChildren();
    nestedDirectoryChildren.forEach((nested) => this._remove(path2, nested));
    const parent = this._getWatchedDir(directory);
    const wasTracked = parent.has(item);
    parent.remove(item);
    if (this._symlinkPaths.has(fullPath)) {
      this._symlinkPaths.delete(fullPath);
    }
    let relPath = path2;
    if (this.options.cwd)
      relPath = sp__namespace.relative(this.options.cwd, path2);
    if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
      const event = this._pendingWrites.get(relPath).cancelWait();
      if (event === EVENTS.ADD) return;
    }
    this._watched.delete(path2);
    this._watched.delete(fullPath);
    const eventName = isDirectory ? EVENTS.UNLINK_DIR : EVENTS.UNLINK;
    if (wasTracked && !this._isIgnored(path2)) this._emit(eventName, path2);
    this._closePath(path2);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(path2) {
    this._closeFile(path2);
    const dir = sp__namespace.dirname(path2);
    this._getWatchedDir(dir).remove(sp__namespace.basename(path2));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(path2) {
    const closers = this._closers.get(path2);
    if (!closers) return;
    closers.forEach((closer) => closer());
    this._closers.delete(path2);
  }
  _addPathCloser(path2, closer) {
    if (!closer) return;
    let list = this._closers.get(path2);
    if (!list) {
      list = [];
      this._closers.set(path2, list);
    }
    list.push(closer);
  }
  _readdirp(root, opts) {
    if (this.closed) return;
    const options = {
      type: EVENTS.ALL,
      alwaysStat: true,
      lstat: true,
      ...opts,
      depth: 0,
    };
    let stream = readdirp(root, options);
    this._streams.add(stream);
    stream.once(STR_CLOSE, () => {
      stream = void 0;
    });
    stream.once(STR_END, () => {
      if (stream) {
        this._streams.delete(stream);
        stream = void 0;
      }
    });
    return stream;
  }
}
function watch(paths, options = {}) {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}
const watchers = /* @__PURE__ */ new Map();
function startWatching(repoPath, win) {
  if (watchers.has(repoPath)) return;
  const watcher = watch(repoPath, {
    ignored: [
      /(^|[/\\])\../,
      // dotfiles
      "**/node_modules/**",
      "**/.git/**",
    ],
    persistent: true,
    ignoreInitial: true,
    depth: 10,
  });
  const record = { watcher, debounceTimer: null };
  function notifyChange() {
    if (record.debounceTimer) clearTimeout(record.debounceTimer);
    record.debounceTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.GIT_WATCH_CHANGED, repoPath);
      }
    }, 500);
  }
  watcher.on("add", notifyChange);
  watcher.on("change", notifyChange);
  watcher.on("unlink", notifyChange);
  watcher.on("addDir", notifyChange);
  watcher.on("unlinkDir", notifyChange);
  watchers.set(repoPath, record);
}
function stopWatching(repoPath) {
  const record = watchers.get(repoPath);
  if (!record) return;
  if (record.debounceTimer) clearTimeout(record.debounceTimer);
  record.watcher.close();
  watchers.delete(repoPath);
}
function stopAllWatchers() {
  for (const [, record] of watchers) {
    if (record.debounceTimer) clearTimeout(record.debounceTimer);
    record.watcher.close();
  }
  watchers.clear();
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
  electron.ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, (_event, opts) => {
    const session = createSession(opts.repoPath);
    spawnTab(
      win,
      session.sessionId,
      opts.repoPath,
      opts.tool,
      opts.initialMessage,
    );
    startWatching(opts.repoPath, win);
    return getSession(session.sessionId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.SESSION_LIST, () => {
    return listSessions();
  });
  electron.ipcMain.handle(IPC_CHANNELS.SESSION_GET, (_event, sessionId) => {
    return getSession(sessionId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, (_event, sessionId) => {
    const session = getSession(sessionId);
    if (session) {
      for (const tab of session.tabs) {
        killPty(tab.ptyId);
      }
      stopWatching(session.repoPath);
    }
    deleteSession(sessionId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, opts) => {
    const session = getSession(opts.sessionId);
    if (!session) return null;
    return spawnTab(win, opts.sessionId, session.repoPath, opts.tool);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.TAB_CLOSE,
    (_event, sessionId, tabId) => {
      const ptyId = removeTab(sessionId, tabId);
      if (ptyId) killPty(ptyId);
    },
  );
  electron.ipcMain.on(
    IPC_CHANNELS.TAB_SEND_MESSAGE,
    (_event, _sessionId, tabId, message) => {
      writePty(`tab-pty-${tabId}`, `${message}\r`);
    },
  );
  electron.ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, repoPath) => {
    return getStatus(repoPath);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_STAGE,
    async (_event, repoPath, files) => {
      await stageFiles(repoPath, files);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_UNSTAGE,
    async (_event, repoPath, files) => {
      await unstageFiles(repoPath, files);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_COMMIT,
    async (_event, repoPath, message) => {
      await commit(repoPath, message);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_STAGED,
    async (_event, repoPath) => {
      return getStagedDiff(repoPath);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_UNSTAGED,
    async (_event, repoPath) => {
      return getUnstagedDiff(repoPath);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WATCH_START,
    async (_event, repoPath) => {
      startWatching(repoPath, win);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WATCH_STOP,
    async (_event, repoPath) => {
      stopWatching(repoPath);
    },
  );
  electron.ipcMain.on(IPC_CHANNELS.OPEN_IN_FINDER, (_event, path2) => {
    electron.shell.showItemInFolder(path2);
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
    icon: path.join(__dirname, "../../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
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
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
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
electron.app.on("before-quit", () => {
  const sessions2 = listSessions();
  for (const session of sessions2) {
    deleteSession(session.sessionId);
  }
  stopAllWatchers();
  killAllPtys();
});

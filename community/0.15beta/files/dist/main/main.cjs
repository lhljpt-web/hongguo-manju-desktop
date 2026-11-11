"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/sm-crypto/src/sm2/sm3.js
var require_sm3 = __commonJS({
  "node_modules/sm-crypto/src/sm2/sm3.js"(exports2, module2) {
    var W = new Uint32Array(68);
    var M = new Uint32Array(64);
    function rotl(x, n) {
      const s = n & 31;
      return x << s | x >>> 32 - s;
    }
    function xor(x, y) {
      const result = [];
      for (let i = x.length - 1; i >= 0; i--) result[i] = (x[i] ^ y[i]) & 255;
      return result;
    }
    function P0(X) {
      return X ^ rotl(X, 9) ^ rotl(X, 17);
    }
    function P1(X) {
      return X ^ rotl(X, 15) ^ rotl(X, 23);
    }
    function sm32(array) {
      let len = array.length * 8;
      let k = len % 512;
      k = k >= 448 ? 512 - k % 448 - 1 : 448 - k - 1;
      const kArr = new Array((k - 7) / 8);
      const lenArr = new Array(8);
      for (let i = 0, len2 = kArr.length; i < len2; i++) kArr[i] = 0;
      for (let i = 0, len2 = lenArr.length; i < len2; i++) lenArr[i] = 0;
      len = len.toString(2);
      for (let i = 7; i >= 0; i--) {
        if (len.length > 8) {
          const start = len.length - 8;
          lenArr[i] = parseInt(len.substr(start), 2);
          len = len.substr(0, start);
        } else if (len.length > 0) {
          lenArr[i] = parseInt(len, 2);
          len = "";
        }
      }
      const m = new Uint8Array([...array, 128, ...kArr, ...lenArr]);
      const dataView = new DataView(m.buffer, 0);
      const n = m.length / 64;
      const V = new Uint32Array([1937774191, 1226093241, 388252375, 3666478592, 2842636476, 372324522, 3817729613, 2969243214]);
      for (let i = 0; i < n; i++) {
        W.fill(0);
        M.fill(0);
        const start = 16 * i;
        for (let j = 0; j < 16; j++) {
          W[j] = dataView.getUint32((start + j) * 4, false);
        }
        for (let j = 16; j < 68; j++) {
          W[j] = P1(W[j - 16] ^ W[j - 9] ^ rotl(W[j - 3], 15)) ^ rotl(W[j - 13], 7) ^ W[j - 6];
        }
        for (let j = 0; j < 64; j++) {
          M[j] = W[j] ^ W[j + 4];
        }
        const T1 = 2043430169;
        const T2 = 2055708042;
        let A = V[0];
        let B = V[1];
        let C = V[2];
        let D = V[3];
        let E = V[4];
        let F = V[5];
        let G = V[6];
        let H = V[7];
        let SS1;
        let SS2;
        let TT1;
        let TT2;
        let T;
        for (let j = 0; j < 64; j++) {
          T = j >= 0 && j <= 15 ? T1 : T2;
          SS1 = rotl(rotl(A, 12) + E + rotl(T, j), 7);
          SS2 = SS1 ^ rotl(A, 12);
          TT1 = (j >= 0 && j <= 15 ? A ^ B ^ C : A & B | A & C | B & C) + D + SS2 + M[j];
          TT2 = (j >= 0 && j <= 15 ? E ^ F ^ G : E & F | ~E & G) + H + SS1 + W[j];
          D = C;
          C = rotl(B, 9);
          B = A;
          A = TT1;
          H = G;
          G = rotl(F, 19);
          F = E;
          E = P0(TT2);
        }
        V[0] ^= A;
        V[1] ^= B;
        V[2] ^= C;
        V[3] ^= D;
        V[4] ^= E;
        V[5] ^= F;
        V[6] ^= G;
        V[7] ^= H;
      }
      const result = [];
      for (let i = 0, len2 = V.length; i < len2; i++) {
        const word = V[i];
        result.push((word & 4278190080) >>> 24, (word & 16711680) >>> 16, (word & 65280) >>> 8, word & 255);
      }
      return result;
    }
    var blockLen = 64;
    var iPad = new Uint8Array(blockLen);
    var oPad = new Uint8Array(blockLen);
    for (let i = 0; i < blockLen; i++) {
      iPad[i] = 54;
      oPad[i] = 92;
    }
    function hmac(input, key) {
      if (key.length > blockLen) key = sm32(key);
      while (key.length < blockLen) key.push(0);
      const iPadKey = xor(key, iPad);
      const oPadKey = xor(key, oPad);
      const hash2 = sm32([...iPadKey, ...input]);
      return sm32([...oPadKey, ...hash2]);
    }
    module2.exports = {
      sm3: sm32,
      hmac
    };
  }
});

// node_modules/sm-crypto/src/sm3/index.js
var require_sm32 = __commonJS({
  "node_modules/sm-crypto/src/sm3/index.js"(exports2, module2) {
    var { sm3: sm32, hmac } = require_sm3();
    function leftPad(input, num) {
      if (input.length >= num) return input;
      return new Array(num - input.length + 1).join("0") + input;
    }
    function ArrayToHex(arr) {
      return arr.map((item) => {
        item = item.toString(16);
        return item.length === 1 ? "0" + item : item;
      }).join("");
    }
    function hexToArray(hexStr) {
      const words = [];
      let hexStrLength = hexStr.length;
      if (hexStrLength % 2 !== 0) {
        hexStr = leftPad(hexStr, hexStrLength + 1);
      }
      hexStrLength = hexStr.length;
      for (let i = 0; i < hexStrLength; i += 2) {
        words.push(parseInt(hexStr.substr(i, 2), 16));
      }
      return words;
    }
    function utf8ToArray(str) {
      const arr = [];
      for (let i = 0, len = str.length; i < len; i++) {
        const point = str.codePointAt(i);
        if (point <= 127) {
          arr.push(point);
        } else if (point <= 2047) {
          arr.push(192 | point >>> 6);
          arr.push(128 | point & 63);
        } else if (point <= 55295 || point >= 57344 && point <= 65535) {
          arr.push(224 | point >>> 12);
          arr.push(128 | point >>> 6 & 63);
          arr.push(128 | point & 63);
        } else if (point >= 65536 && point <= 1114111) {
          i++;
          arr.push(240 | point >>> 18 & 28);
          arr.push(128 | point >>> 12 & 63);
          arr.push(128 | point >>> 6 & 63);
          arr.push(128 | point & 63);
        } else {
          arr.push(point);
          throw new Error("input is not supported");
        }
      }
      return arr;
    }
    module2.exports = function(input, options) {
      input = typeof input === "string" ? utf8ToArray(input) : Array.prototype.slice.call(input);
      if (options) {
        const mode = options.mode || "hmac";
        if (mode !== "hmac") throw new Error("invalid mode");
        let key = options.key;
        if (!key) throw new Error("invalid key");
        key = typeof key === "string" ? hexToArray(key) : Array.prototype.slice.call(key);
        return ArrayToHex(hmac(input, key));
      }
      return ArrayToHex(sm32(input));
    };
  }
});

// node_modules/universalify/index.js
var require_universalify = __commonJS({
  "node_modules/universalify/index.js"(exports2) {
    "use strict";
    exports2.fromCallback = function(fn) {
      return Object.defineProperty(function(...args) {
        if (typeof args[args.length - 1] === "function") fn.apply(this, args);
        else {
          return new Promise((resolve, reject) => {
            args.push((err, res) => err != null ? reject(err) : resolve(res));
            fn.apply(this, args);
          });
        }
      }, "name", { value: fn.name });
    };
    exports2.fromPromise = function(fn) {
      return Object.defineProperty(function(...args) {
        const cb = args[args.length - 1];
        if (typeof cb !== "function") return fn.apply(this, args);
        else {
          args.pop();
          fn.apply(this, args).then((r) => cb(null, r), cb);
        }
      }, "name", { value: fn.name });
    };
  }
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/graceful-fs/polyfills.js"(exports2, module2) {
    var constants4 = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs) {
      if (constants4.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
      }
      if (!fs.lutimes) {
        patchLutimes(fs);
      }
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
      fs.lstatSync = statFixSync(fs.lstatSync);
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path6, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchmodSync = function() {
        };
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = function(path6, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs.rename = typeof fs.rename !== "function" ? fs.rename : (function(fs$rename) {
          function rename5(from, to, cb) {
            var start = Date.now();
            var backoff2 = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff2);
                if (backoff2 < 100)
                  backoff2 += 10;
                return;
              }
              if (cb) cb(er);
            });
          }
          if (Object.setPrototypeOf) Object.setPrototypeOf(rename5, fs$rename);
          return rename5;
        })(fs.rename);
      }
      fs.read = typeof fs.read !== "function" ? fs.read : (function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
      })(fs.read);
      fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : /* @__PURE__ */ (function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      })(fs.readSync);
      function patchLchmod(fs2) {
        fs2.lchmod = function(path6, mode, callback) {
          fs2.open(
            path6,
            constants4.O_WRONLY | constants4.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback) callback(err);
                return;
              }
              fs2.fchmod(fd, mode, function(err2) {
                fs2.close(fd, function(err22) {
                  if (callback) callback(err2 || err22);
                });
              });
            }
          );
        };
        fs2.lchmodSync = function(path6, mode) {
          var fd = fs2.openSync(path6, constants4.O_WRONLY | constants4.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs2.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs2) {
        if (constants4.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
          fs2.lutimes = function(path6, at, mt, cb) {
            fs2.open(path6, constants4.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs2.futimes(fd, at, mt, function(er2) {
                fs2.close(fd, function(er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs2.lutimesSync = function(path6, at, mt) {
            var fd = fs2.openSync(path6, constants4.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs2.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs2.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs2.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs2.futimes) {
          fs2.lutimes = function(_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs2.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
          return orig.call(fs, target, mode, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs, target, uid, gid, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "node_modules/graceful-fs/legacy-streams.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path6, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path6, options);
        Stream.call(this);
        var self2 = this;
        this.path = path6;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self2._read();
          });
          return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self2.emit("error", err);
            self2.readable = false;
            return;
          }
          self2.fd = fd;
          self2.emit("open", fd);
          self2._read();
        });
      }
      function WriteStream(path6, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path6, options);
        Stream.call(this);
        this.path = path6;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "node_modules/graceful-fs/clone.js"(exports2, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "node_modules/graceful-fs/graceful-fs.js"(exports2, module2) {
    var fs = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = /* @__PURE__ */ Symbol.for("graceful-fs.queue");
      previousSymbol = /* @__PURE__ */ Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);
      fs.close = (function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      })(fs.close);
      fs.closeSync = (function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      })(fs.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs[gracefulQueue]);
          require("assert").equal(fs[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }
    module2.exports = patch(clone(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module2.exports = patch(fs);
      fs.__patched = true;
    }
    function patch(fs2) {
      polyfills(fs2);
      fs2.gracefulify = patch;
      fs2.createReadStream = createReadStream2;
      fs2.createWriteStream = createWriteStream;
      var fs$readFile = fs2.readFile;
      fs2.readFile = readFile6;
      function readFile6(path6, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path6, options, cb);
        function go$readFile(path7, options2, cb2, startTime) {
          return fs$readFile(path7, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path7, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs2.writeFile;
      fs2.writeFile = writeFile7;
      function writeFile7(path6, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path6, data, options, cb);
        function go$writeFile(path7, data2, options2, cb2, startTime) {
          return fs$writeFile(path7, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path7, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs2.appendFile;
      if (fs$appendFile)
        fs2.appendFile = appendFile;
      function appendFile(path6, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path6, data, options, cb);
        function go$appendFile(path7, data2, options2, cb2, startTime) {
          return fs$appendFile(path7, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path7, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs2.copyFile;
      if (fs$copyFile)
        fs2.copyFile = copyFile4;
      function copyFile4(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs2.readdir;
      fs2.readdir = readdir2;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir2(path6, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path7, options2, cb2, startTime) {
          return fs$readdir(path7, fs$readdirCallback(
            path7,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path7, options2, cb2, startTime) {
          return fs$readdir(path7, options2, fs$readdirCallback(
            path7,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path6, options, cb);
        function fs$readdirCallback(path7, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path7, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs2);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs2.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs2.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs2, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs2, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs2, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs2, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path6, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open4(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path6, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open4(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream2(path6, options) {
        return new fs2.ReadStream(path6, options);
      }
      function createWriteStream(path6, options) {
        return new fs2.WriteStream(path6, options);
      }
      var fs$open = fs2.open;
      fs2.open = open4;
      function open4(path6, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path6, flags, mode, cb);
        function go$open(path7, flags2, mode2, cb2, startTime) {
          return fs$open(path7, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path7, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs2;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now;
          fs[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs[gracefulQueue].length === 0)
        return;
      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "node_modules/fs-extra/lib/fs/index.js"(exports2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs[key] === "function";
    });
    Object.assign(exports2, fs);
    api.forEach((method) => {
      exports2[method] = u(fs[method]);
    });
    exports2.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs.exists(filename, resolve);
      });
    };
    exports2.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports2.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    if (typeof fs.writev === "function") {
      exports2.writev = function(fd, buffers, ...args) {
        if (typeof args[args.length - 1] === "function") {
          return fs.writev(fd, buffers, ...args);
        }
        return new Promise((resolve, reject) => {
          fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
            if (err) return reject(err);
            resolve({ bytesWritten, buffers: buffers2 });
          });
        });
      };
    }
    if (typeof fs.realpath.native === "function") {
      exports2.realpath.native = u(fs.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/utils.js"(exports2, module2) {
    "use strict";
    var path6 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path6.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number") return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      // alias
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "node_modules/fs-extra/lib/path-exists/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    function pathExists(path6) {
      return fs.access(path6).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u(pathExists),
      pathExistsSync: fs.existsSync
    };
  }
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "node_modules/fs-extra/lib/util/utimes.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    function utimesMillis(path6, atime, mtime, callback) {
      fs.open(path6, "r+", (err, fd) => {
        if (err) return callback(err);
        fs.futimes(fd, atime, mtime, (futimesErr) => {
          fs.close(fd, (closeErr) => {
            if (callback) callback(futimesErr || closeErr);
          });
        });
      });
    }
    function utimesMillisSync(path6, atime, mtime) {
      const fd = fs.openSync(path6, "r+");
      fs.futimesSync(fd, atime, mtime);
      return fs.closeSync(fd);
    }
    module2.exports = {
      utimesMillis,
      utimesMillisSync
    };
  }
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "node_modules/fs-extra/lib/util/stat.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var path6 = require("path");
    var util = require("util");
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT") return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT") return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    function checkPaths(src, dest, funcName, opts, cb) {
      util.callbackify(getStats)(src, dest, opts, (err, stats) => {
        if (err) return cb(err);
        const { srcStat, destStat } = stats;
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            const srcBaseName = path6.basename(src);
            const destBaseName = path6.basename(dest);
            if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
              return cb(null, { srcStat, destStat, isChangingCase: true });
            }
            return cb(new Error("Source and destination must not be the same."));
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`));
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`));
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return cb(null, { srcStat, destStat });
      });
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path6.basename(src);
          const destBaseName = path6.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkParentPaths(src, srcStat, dest, funcName, cb) {
      const srcParent = path6.resolve(path6.dirname(src));
      const destParent = path6.resolve(path6.dirname(dest));
      if (destParent === srcParent || destParent === path6.parse(destParent).root) return cb();
      fs.stat(destParent, { bigint: true }, (err, destStat) => {
        if (err) {
          if (err.code === "ENOENT") return cb();
          return cb(err);
        }
        if (areIdentical(srcStat, destStat)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return checkParentPaths(src, srcStat, destParent, funcName, cb);
      });
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path6.resolve(path6.dirname(src));
      const destParent = path6.resolve(path6.dirname(dest));
      if (destParent === srcParent || destParent === path6.parse(destParent).root) return;
      let destStat;
      try {
        destStat = fs.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path6.resolve(src).split(path6.sep).filter((i) => i);
      const destArr = path6.resolve(dest).split(path6.sep).filter((i) => i);
      return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      checkPaths,
      checkPathsSync,
      checkParentPaths,
      checkParentPathsSync,
      isSrcSubdir,
      areIdentical
    };
  }
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "node_modules/fs-extra/lib/copy/copy.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path6 = require("path");
    var mkdirs = require_mkdirs().mkdirs;
    var pathExists = require_path_exists().pathExists;
    var utimesMillis = require_utimes().utimesMillis;
    var stat3 = require_stat();
    function copy(src, dest, opts, cb) {
      if (typeof opts === "function" && !cb) {
        cb = opts;
        opts = {};
      } else if (typeof opts === "function") {
        opts = { filter: opts };
      }
      cb = cb || function() {
      };
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      stat3.checkPaths(src, dest, "copy", opts, (err, stats) => {
        if (err) return cb(err);
        const { srcStat, destStat } = stats;
        stat3.checkParentPaths(src, srcStat, dest, "copy", (err2) => {
          if (err2) return cb(err2);
          if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb);
          return checkParentDir(destStat, src, dest, opts, cb);
        });
      });
    }
    function checkParentDir(destStat, src, dest, opts, cb) {
      const destParent = path6.dirname(dest);
      pathExists(destParent, (err, dirExists) => {
        if (err) return cb(err);
        if (dirExists) return getStats(destStat, src, dest, opts, cb);
        mkdirs(destParent, (err2) => {
          if (err2) return cb(err2);
          return getStats(destStat, src, dest, opts, cb);
        });
      });
    }
    function handleFilter(onInclude, destStat, src, dest, opts, cb) {
      Promise.resolve(opts.filter(src, dest)).then((include) => {
        if (include) return onInclude(destStat, src, dest, opts, cb);
        return cb();
      }, (error) => cb(error));
    }
    function startCopy(destStat, src, dest, opts, cb) {
      if (opts.filter) return handleFilter(getStats, destStat, src, dest, opts, cb);
      return getStats(destStat, src, dest, opts, cb);
    }
    function getStats(destStat, src, dest, opts, cb) {
      const stat4 = opts.dereference ? fs.stat : fs.lstat;
      stat4(src, (err, srcStat) => {
        if (err) return cb(err);
        if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts, cb);
        else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src}`));
        else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src}`));
        return cb(new Error(`Unknown file: ${src}`));
      });
    }
    function onFile(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat) return copyFile4(srcStat, src, dest, opts, cb);
      return mayCopyFile(srcStat, src, dest, opts, cb);
    }
    function mayCopyFile(srcStat, src, dest, opts, cb) {
      if (opts.overwrite) {
        fs.unlink(dest, (err) => {
          if (err) return cb(err);
          return copyFile4(srcStat, src, dest, opts, cb);
        });
      } else if (opts.errorOnExist) {
        return cb(new Error(`'${dest}' already exists`));
      } else return cb();
    }
    function copyFile4(srcStat, src, dest, opts, cb) {
      fs.copyFile(src, dest, (err) => {
        if (err) return cb(err);
        if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb);
        return setDestMode(dest, srcStat.mode, cb);
      });
    }
    function handleTimestampsAndMode(srcMode, src, dest, cb) {
      if (fileIsNotWritable(srcMode)) {
        return makeFileWritable(dest, srcMode, (err) => {
          if (err) return cb(err);
          return setDestTimestampsAndMode(srcMode, src, dest, cb);
        });
      }
      return setDestTimestampsAndMode(srcMode, src, dest, cb);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode, cb) {
      return setDestMode(dest, srcMode | 128, cb);
    }
    function setDestTimestampsAndMode(srcMode, src, dest, cb) {
      setDestTimestamps(src, dest, (err) => {
        if (err) return cb(err);
        return setDestMode(dest, srcMode, cb);
      });
    }
    function setDestMode(dest, srcMode, cb) {
      return fs.chmod(dest, srcMode, cb);
    }
    function setDestTimestamps(src, dest, cb) {
      fs.stat(src, (err, updatedSrcStat) => {
        if (err) return cb(err);
        return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
      });
    }
    function onDir(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts, cb);
      return copyDir(src, dest, opts, cb);
    }
    function mkDirAndCopy(srcMode, src, dest, opts, cb) {
      fs.mkdir(dest, (err) => {
        if (err) return cb(err);
        copyDir(src, dest, opts, (err2) => {
          if (err2) return cb(err2);
          return setDestMode(dest, srcMode, cb);
        });
      });
    }
    function copyDir(src, dest, opts, cb) {
      fs.readdir(src, (err, items) => {
        if (err) return cb(err);
        return copyDirItems(items, src, dest, opts, cb);
      });
    }
    function copyDirItems(items, src, dest, opts, cb) {
      const item = items.pop();
      if (!item) return cb();
      return copyDirItem(items, item, src, dest, opts, cb);
    }
    function copyDirItem(items, item, src, dest, opts, cb) {
      const srcItem = path6.join(src, item);
      const destItem = path6.join(dest, item);
      stat3.checkPaths(srcItem, destItem, "copy", opts, (err, stats) => {
        if (err) return cb(err);
        const { destStat } = stats;
        startCopy(destStat, srcItem, destItem, opts, (err2) => {
          if (err2) return cb(err2);
          return copyDirItems(items, src, dest, opts, cb);
        });
      });
    }
    function onLink(destStat, src, dest, opts, cb) {
      fs.readlink(src, (err, resolvedSrc) => {
        if (err) return cb(err);
        if (opts.dereference) {
          resolvedSrc = path6.resolve(process.cwd(), resolvedSrc);
        }
        if (!destStat) {
          return fs.symlink(resolvedSrc, dest, cb);
        } else {
          fs.readlink(dest, (err2, resolvedDest) => {
            if (err2) {
              if (err2.code === "EINVAL" || err2.code === "UNKNOWN") return fs.symlink(resolvedSrc, dest, cb);
              return cb(err2);
            }
            if (opts.dereference) {
              resolvedDest = path6.resolve(process.cwd(), resolvedDest);
            }
            if (stat3.isSrcSubdir(resolvedSrc, resolvedDest)) {
              return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
            }
            if (destStat.isDirectory() && stat3.isSrcSubdir(resolvedDest, resolvedSrc)) {
              return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
            }
            return copyLink(resolvedSrc, dest, cb);
          });
        }
      });
    }
    function copyLink(resolvedSrc, dest, cb) {
      fs.unlink(dest, (err) => {
        if (err) return cb(err);
        return fs.symlink(resolvedSrc, dest, cb);
      });
    }
    module2.exports = copy;
  }
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "node_modules/fs-extra/lib/copy/copy-sync.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path6 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat3 = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat3.checkPathsSync(src, dest, "copy", opts);
      stat3.checkParentPathsSync(src, srcStat, dest, "copy");
      return handleFilterAndCopy(destStat, src, dest, opts);
    }
    function handleFilterAndCopy(destStat, src, dest, opts) {
      if (opts.filter && !opts.filter(src, dest)) return;
      const destParent = path6.dirname(dest);
      if (!fs.existsSync(destParent)) mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function startCopy(destStat, src, dest, opts) {
      if (opts.filter && !opts.filter(src, dest)) return;
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile4(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs.unlinkSync(dest);
        return copyFile4(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile4(srcStat, src, dest, opts) {
      fs.copyFileSync(src, dest);
      if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
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
      return fs.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      fs.readdirSync(src).forEach((item) => copyDirItem(item, src, dest, opts));
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path6.join(src, item);
      const destItem = path6.join(dest, item);
      const { destStat } = stat3.checkPathsSync(srcItem, destItem, "copy", opts);
      return startCopy(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path6.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path6.resolve(process.cwd(), resolvedDest);
        }
        if (stat3.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (fs.statSync(dest).isDirectory() && stat3.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs.unlinkSync(dest);
      return fs.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "node_modules/fs-extra/lib/copy/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    module2.exports = {
      copy: u(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// node_modules/fs-extra/lib/remove/rimraf.js
var require_rimraf = __commonJS({
  "node_modules/fs-extra/lib/remove/rimraf.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path6 = require("path");
    var assert = require("assert");
    var isWindows = process.platform === "win32";
    function defaults(options) {
      const methods = [
        "unlink",
        "chmod",
        "stat",
        "lstat",
        "rmdir",
        "readdir"
      ];
      methods.forEach((m) => {
        options[m] = options[m] || fs[m];
        m = m + "Sync";
        options[m] = options[m] || fs[m];
      });
      options.maxBusyTries = options.maxBusyTries || 3;
    }
    function rimraf(p, options, cb) {
      let busyTries = 0;
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      assert(p, "rimraf: missing path");
      assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
      assert.strictEqual(typeof cb, "function", "rimraf: callback function required");
      assert(options, "rimraf: invalid options argument provided");
      assert.strictEqual(typeof options, "object", "rimraf: options should be object");
      defaults(options);
      rimraf_(p, options, function CB(er) {
        if (er) {
          if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") && busyTries < options.maxBusyTries) {
            busyTries++;
            const time = busyTries * 100;
            return setTimeout(() => rimraf_(p, options, CB), time);
          }
          if (er.code === "ENOENT") er = null;
        }
        cb(er);
      });
    }
    function rimraf_(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.lstat(p, (er, st) => {
        if (er && er.code === "ENOENT") {
          return cb(null);
        }
        if (er && er.code === "EPERM" && isWindows) {
          return fixWinEPERM(p, options, er, cb);
        }
        if (st && st.isDirectory()) {
          return rmdir(p, options, er, cb);
        }
        options.unlink(p, (er2) => {
          if (er2) {
            if (er2.code === "ENOENT") {
              return cb(null);
            }
            if (er2.code === "EPERM") {
              return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
            }
            if (er2.code === "EISDIR") {
              return rmdir(p, options, er2, cb);
            }
          }
          return cb(er2);
        });
      });
    }
    function fixWinEPERM(p, options, er, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.chmod(p, 438, (er2) => {
        if (er2) {
          cb(er2.code === "ENOENT" ? null : er);
        } else {
          options.stat(p, (er3, stats) => {
            if (er3) {
              cb(er3.code === "ENOENT" ? null : er);
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
      let stats;
      assert(p);
      assert(options);
      try {
        options.chmodSync(p, 438);
      } catch (er2) {
        if (er2.code === "ENOENT") {
          return;
        } else {
          throw er;
        }
      }
      try {
        stats = options.statSync(p);
      } catch (er3) {
        if (er3.code === "ENOENT") {
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
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.rmdir(p, (er) => {
        if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) {
          rmkids(p, options, cb);
        } else if (er && er.code === "ENOTDIR") {
          cb(originalEr);
        } else {
          cb(er);
        }
      });
    }
    function rmkids(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.readdir(p, (er, files) => {
        if (er) return cb(er);
        let n = files.length;
        let errState;
        if (n === 0) return options.rmdir(p, cb);
        files.forEach((f) => {
          rimraf(path6.join(p, f), options, (er2) => {
            if (errState) {
              return;
            }
            if (er2) return cb(errState = er2);
            if (--n === 0) {
              options.rmdir(p, cb);
            }
          });
        });
      });
    }
    function rimrafSync(p, options) {
      let st;
      options = options || {};
      defaults(options);
      assert(p, "rimraf: missing path");
      assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
      assert(options, "rimraf: missing options");
      assert.strictEqual(typeof options, "object", "rimraf: options should be object");
      try {
        st = options.lstatSync(p);
      } catch (er) {
        if (er.code === "ENOENT") {
          return;
        }
        if (er.code === "EPERM" && isWindows) {
          fixWinEPERMSync(p, options, er);
        }
      }
      try {
        if (st && st.isDirectory()) {
          rmdirSync(p, options, null);
        } else {
          options.unlinkSync(p);
        }
      } catch (er) {
        if (er.code === "ENOENT") {
          return;
        } else if (er.code === "EPERM") {
          return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
        } else if (er.code !== "EISDIR") {
          throw er;
        }
        rmdirSync(p, options, er);
      }
    }
    function rmdirSync(p, options, originalEr) {
      assert(p);
      assert(options);
      try {
        options.rmdirSync(p);
      } catch (er) {
        if (er.code === "ENOTDIR") {
          throw originalEr;
        } else if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") {
          rmkidsSync(p, options);
        } else if (er.code !== "ENOENT") {
          throw er;
        }
      }
    }
    function rmkidsSync(p, options) {
      assert(p);
      assert(options);
      options.readdirSync(p).forEach((f) => rimrafSync(path6.join(p, f), options));
      if (isWindows) {
        const startTime = Date.now();
        do {
          try {
            const ret = options.rmdirSync(p, options);
            return ret;
          } catch {
          }
        } while (Date.now() - startTime < 500);
      } else {
        const ret = options.rmdirSync(p, options);
        return ret;
      }
    }
    module2.exports = rimraf;
    rimraf.sync = rimrafSync;
  }
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "node_modules/fs-extra/lib/remove/index.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var u = require_universalify().fromCallback;
    var rimraf = require_rimraf();
    function remove(path6, callback) {
      if (fs.rm) return fs.rm(path6, { recursive: true, force: true }, callback);
      rimraf(path6, callback);
    }
    function removeSync(path6) {
      if (fs.rmSync) return fs.rmSync(path6, { recursive: true, force: true });
      rimraf.sync(path6);
    }
    module2.exports = {
      remove: u(remove),
      removeSync
    };
  }
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "node_modules/fs-extra/lib/empty/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    var path6 = require("path");
    var mkdir5 = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs.readdir(dir);
      } catch {
        return mkdir5.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path6.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs.readdirSync(dir);
      } catch {
        return mkdir5.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path6.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "node_modules/fs-extra/lib/ensure/file.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path6 = require("path");
    var fs = require_graceful_fs();
    var mkdir5 = require_mkdirs();
    function createFile(file, callback) {
      function makeFile() {
        fs.writeFile(file, "", (err) => {
          if (err) return callback(err);
          callback();
        });
      }
      fs.stat(file, (err, stats) => {
        if (!err && stats.isFile()) return callback();
        const dir = path6.dirname(file);
        fs.stat(dir, (err2, stats2) => {
          if (err2) {
            if (err2.code === "ENOENT") {
              return mkdir5.mkdirs(dir, (err3) => {
                if (err3) return callback(err3);
                makeFile();
              });
            }
            return callback(err2);
          }
          if (stats2.isDirectory()) makeFile();
          else {
            fs.readdir(dir, (err3) => {
              if (err3) return callback(err3);
            });
          }
        });
      });
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs.statSync(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path6.dirname(file);
      try {
        if (!fs.statSync(dir).isDirectory()) {
          fs.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT") mkdir5.mkdirsSync(dir);
        else throw err;
      }
      fs.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u(createFile),
      createFileSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "node_modules/fs-extra/lib/ensure/link.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path6 = require("path");
    var fs = require_graceful_fs();
    var mkdir5 = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createLink(srcpath, dstpath, callback) {
      function makeLink(srcpath2, dstpath2) {
        fs.link(srcpath2, dstpath2, (err) => {
          if (err) return callback(err);
          callback(null);
        });
      }
      fs.lstat(dstpath, (_, dstStat) => {
        fs.lstat(srcpath, (err, srcStat) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureLink");
            return callback(err);
          }
          if (dstStat && areIdentical(srcStat, dstStat)) return callback(null);
          const dir = path6.dirname(dstpath);
          pathExists(dir, (err2, dirExists) => {
            if (err2) return callback(err2);
            if (dirExists) return makeLink(srcpath, dstpath);
            mkdir5.mkdirs(dir, (err3) => {
              if (err3) return callback(err3);
              makeLink(srcpath, dstpath);
            });
          });
        });
      });
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat)) return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path6.dirname(dstpath);
      const dirExists = fs.existsSync(dir);
      if (dirExists) return fs.linkSync(srcpath, dstpath);
      mkdir5.mkdirsSync(dir);
      return fs.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u(createLink),
      createLinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports2, module2) {
    "use strict";
    var path6 = require("path");
    var fs = require_graceful_fs();
    var pathExists = require_path_exists().pathExists;
    function symlinkPaths(srcpath, dstpath, callback) {
      if (path6.isAbsolute(srcpath)) {
        return fs.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureSymlink");
            return callback(err);
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: srcpath
          });
        });
      } else {
        const dstdir = path6.dirname(dstpath);
        const relativeToDst = path6.join(dstdir, srcpath);
        return pathExists(relativeToDst, (err, exists) => {
          if (err) return callback(err);
          if (exists) {
            return callback(null, {
              toCwd: relativeToDst,
              toDst: srcpath
            });
          } else {
            return fs.lstat(srcpath, (err2) => {
              if (err2) {
                err2.message = err2.message.replace("lstat", "ensureSymlink");
                return callback(err2);
              }
              return callback(null, {
                toCwd: srcpath,
                toDst: path6.relative(dstdir, srcpath)
              });
            });
          }
        });
      }
    }
    function symlinkPathsSync(srcpath, dstpath) {
      let exists;
      if (path6.isAbsolute(srcpath)) {
        exists = fs.existsSync(srcpath);
        if (!exists) throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      } else {
        const dstdir = path6.dirname(dstpath);
        const relativeToDst = path6.join(dstdir, srcpath);
        exists = fs.existsSync(relativeToDst);
        if (exists) {
          return {
            toCwd: relativeToDst,
            toDst: srcpath
          };
        } else {
          exists = fs.existsSync(srcpath);
          if (!exists) throw new Error("relative srcpath does not exist");
          return {
            toCwd: srcpath,
            toDst: path6.relative(dstdir, srcpath)
          };
        }
      }
    }
    module2.exports = {
      symlinkPaths,
      symlinkPathsSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-type.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    function symlinkType(srcpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      if (type) return callback(null, type);
      fs.lstat(srcpath, (err, stats) => {
        if (err) return callback(null, "file");
        type = stats && stats.isDirectory() ? "dir" : "file";
        callback(null, type);
      });
    }
    function symlinkTypeSync(srcpath, type) {
      let stats;
      if (type) return type;
      try {
        stats = fs.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType,
      symlinkTypeSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path6 = require("path");
    var fs = require_fs();
    var _mkdirs = require_mkdirs();
    var mkdirs = _mkdirs.mkdirs;
    var mkdirsSync = _mkdirs.mkdirsSync;
    var _symlinkPaths = require_symlink_paths();
    var symlinkPaths = _symlinkPaths.symlinkPaths;
    var symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
    var _symlinkType = require_symlink_type();
    var symlinkType = _symlinkType.symlinkType;
    var symlinkTypeSync = _symlinkType.symlinkTypeSync;
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createSymlink(srcpath, dstpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      fs.lstat(dstpath, (err, stats) => {
        if (!err && stats.isSymbolicLink()) {
          Promise.all([
            fs.stat(srcpath),
            fs.stat(dstpath)
          ]).then(([srcStat, dstStat]) => {
            if (areIdentical(srcStat, dstStat)) return callback(null);
            _createSymlink(srcpath, dstpath, type, callback);
          });
        } else _createSymlink(srcpath, dstpath, type, callback);
      });
    }
    function _createSymlink(srcpath, dstpath, type, callback) {
      symlinkPaths(srcpath, dstpath, (err, relative) => {
        if (err) return callback(err);
        srcpath = relative.toDst;
        symlinkType(relative.toCwd, type, (err2, type2) => {
          if (err2) return callback(err2);
          const dir = path6.dirname(dstpath);
          pathExists(dir, (err3, dirExists) => {
            if (err3) return callback(err3);
            if (dirExists) return fs.symlink(srcpath, dstpath, type2, callback);
            mkdirs(dir, (err4) => {
              if (err4) return callback(err4);
              fs.symlink(srcpath, dstpath, type2, callback);
            });
          });
        });
      });
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const srcStat = fs.statSync(srcpath);
        const dstStat = fs.statSync(dstpath);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path6.dirname(dstpath);
      const exists = fs.existsSync(dir);
      if (exists) return fs.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u(createSymlink),
      createSymlinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "node_modules/fs-extra/lib/ensure/index.js"(exports2, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      // file
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      // link
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      // symlink
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "node_modules/jsonfile/utils.js"(exports2, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      if (str === void 0) {
        throw new TypeError(`Converting ${typeof obj} value to JSON is not supported`);
      }
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content)) content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "node_modules/jsonfile/index.js"(exports2, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile6 = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs.writeFile)(file, str, options);
    }
    var writeFile7 = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      return fs.writeFileSync(file, str, options);
    }
    module2.exports = {
      readFile: readFile6,
      readFileSync,
      writeFile: writeFile7,
      writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "node_modules/fs-extra/lib/json/jsonfile.js"(exports2, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      // jsonfile exports
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "node_modules/fs-extra/lib/output-file/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs = require_graceful_fs();
    var path6 = require("path");
    var mkdir5 = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    function outputFile(file, data, encoding, callback) {
      if (typeof encoding === "function") {
        callback = encoding;
        encoding = "utf8";
      }
      const dir = path6.dirname(file);
      pathExists(dir, (err, itDoes) => {
        if (err) return callback(err);
        if (itDoes) return fs.writeFile(file, data, encoding, callback);
        mkdir5.mkdirs(dir, (err2) => {
          if (err2) return callback(err2);
          fs.writeFile(file, data, encoding, callback);
        });
      });
    }
    function outputFileSync(file, ...args) {
      const dir = path6.dirname(file);
      if (fs.existsSync(dir)) {
        return fs.writeFileSync(file, ...args);
      }
      mkdir5.mkdirsSync(dir);
      fs.writeFileSync(file, ...args);
    }
    module2.exports = {
      outputFile: u(outputFile),
      outputFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "node_modules/fs-extra/lib/json/output-json.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "node_modules/fs-extra/lib/json/output-json-sync.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "node_modules/fs-extra/lib/json/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "node_modules/fs-extra/lib/move/move.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path6 = require("path");
    var copy = require_copy2().copy;
    var remove = require_remove().remove;
    var mkdirp = require_mkdirs().mkdirp;
    var pathExists = require_path_exists().pathExists;
    var stat3 = require_stat();
    function move(src, dest, opts, cb) {
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      stat3.checkPaths(src, dest, "move", opts, (err, stats) => {
        if (err) return cb(err);
        const { srcStat, isChangingCase = false } = stats;
        stat3.checkParentPaths(src, srcStat, dest, "move", (err2) => {
          if (err2) return cb(err2);
          if (isParentRoot(dest)) return doRename(src, dest, overwrite, isChangingCase, cb);
          mkdirp(path6.dirname(dest), (err3) => {
            if (err3) return cb(err3);
            return doRename(src, dest, overwrite, isChangingCase, cb);
          });
        });
      });
    }
    function isParentRoot(dest) {
      const parent = path6.dirname(dest);
      const parsedPath = path6.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase, cb) {
      if (isChangingCase) return rename5(src, dest, overwrite, cb);
      if (overwrite) {
        return remove(dest, (err) => {
          if (err) return cb(err);
          return rename5(src, dest, overwrite, cb);
        });
      }
      pathExists(dest, (err, destExists) => {
        if (err) return cb(err);
        if (destExists) return cb(new Error("dest already exists."));
        return rename5(src, dest, overwrite, cb);
      });
    }
    function rename5(src, dest, overwrite, cb) {
      fs.rename(src, dest, (err) => {
        if (!err) return cb();
        if (err.code !== "EXDEV") return cb(err);
        return moveAcrossDevice(src, dest, overwrite, cb);
      });
    }
    function moveAcrossDevice(src, dest, overwrite, cb) {
      const opts = {
        overwrite,
        errorOnExist: true
      };
      copy(src, dest, opts, (err) => {
        if (err) return cb(err);
        return remove(src, cb);
      });
    }
    module2.exports = move;
  }
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "node_modules/fs-extra/lib/move/move-sync.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path6 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat3 = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat3.checkPathsSync(src, dest, "move", opts);
      stat3.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest)) mkdirpSync(path6.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent = path6.dirname(dest);
      const parsedPath = path6.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase) return rename5(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename5(src, dest, overwrite);
      }
      if (fs.existsSync(dest)) throw new Error("dest already exists.");
      return rename5(src, dest, overwrite);
    }
    function rename5(src, dest, overwrite) {
      try {
        fs.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "node_modules/fs-extra/lib/move/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    module2.exports = {
      move: u(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS({
  "node_modules/fs-extra/lib/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // Export promiseified graceful-fs:
      ...require_fs(),
      // Export extra methods:
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// node_modules/builder-util-runtime/out/CancellationToken.js
var require_CancellationToken = __commonJS({
  "node_modules/builder-util-runtime/out/CancellationToken.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CancellationError = exports2.CancellationToken = void 0;
    var events_1 = require("events");
    var CancellationToken = class extends events_1.EventEmitter {
      get cancelled() {
        return this._cancelled || this._parent != null && this._parent.cancelled;
      }
      set parent(value) {
        this.removeParentCancelHandler();
        this._parent = value;
        this.parentCancelHandler = () => this.cancel();
        this._parent.onCancel(this.parentCancelHandler);
      }
      // babel cannot compile ... correctly for super calls
      constructor(parent) {
        super();
        this.parentCancelHandler = null;
        this._parent = null;
        this._cancelled = false;
        if (parent != null) {
          this.parent = parent;
        }
      }
      cancel() {
        this._cancelled = true;
        this.emit("cancel");
      }
      onCancel(handler) {
        if (this.cancelled) {
          handler();
        } else {
          this.once("cancel", handler);
        }
      }
      createPromise(callback) {
        if (this.cancelled) {
          return Promise.reject(new CancellationError());
        }
        const finallyHandler = () => {
          if (cancelHandler != null) {
            try {
              this.removeListener("cancel", cancelHandler);
              cancelHandler = null;
            } catch (_ignore) {
            }
          }
        };
        let cancelHandler = null;
        return new Promise((resolve, reject) => {
          let addedCancelHandler = null;
          cancelHandler = () => {
            try {
              if (addedCancelHandler != null) {
                addedCancelHandler();
                addedCancelHandler = null;
              }
            } finally {
              reject(new CancellationError());
            }
          };
          if (this.cancelled) {
            cancelHandler();
            return;
          }
          this.onCancel(cancelHandler);
          callback(resolve, reject, (callback2) => {
            addedCancelHandler = callback2;
          });
        }).then((it) => {
          finallyHandler();
          return it;
        }).catch((e) => {
          finallyHandler();
          throw e;
        });
      }
      removeParentCancelHandler() {
        const parent = this._parent;
        if (parent != null && this.parentCancelHandler != null) {
          parent.removeListener("cancel", this.parentCancelHandler);
          this.parentCancelHandler = null;
        }
      }
      dispose() {
        try {
          this.removeParentCancelHandler();
        } finally {
          this.removeAllListeners();
          this._parent = null;
        }
      }
    };
    exports2.CancellationToken = CancellationToken;
    var CancellationError = class extends Error {
      constructor() {
        super("cancelled");
      }
    };
    exports2.CancellationError = CancellationError;
  }
});

// node_modules/builder-util-runtime/out/error.js
var require_error = __commonJS({
  "node_modules/builder-util-runtime/out/error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.newError = newError;
    function newError(message, code) {
      const error = new Error(message);
      error.code = code;
      return error;
    }
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse2(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse2(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash2 = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash2 = (hash2 << 5) - hash2 + namespace.charCodeAt(i);
          hash2 |= 0;
        }
        return createDebug.colors[Math.abs(hash2) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self2 = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self2, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self2, args);
          const logFn = self2.log || createDebug.log;
          logFn.apply(self2, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var tty = require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// node_modules/builder-util-runtime/out/ProgressCallbackTransform.js
var require_ProgressCallbackTransform = __commonJS({
  "node_modules/builder-util-runtime/out/ProgressCallbackTransform.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProgressCallbackTransform = void 0;
    var stream_1 = require("stream");
    var ProgressCallbackTransform = class extends stream_1.Transform {
      constructor(total, cancellationToken, onProgress) {
        super();
        this.total = total;
        this.cancellationToken = cancellationToken;
        this.onProgress = onProgress;
        this.start = Date.now();
        this.transferred = 0;
        this.delta = 0;
        this.nextUpdate = this.start + 1e3;
      }
      _transform(chunk, encoding, callback) {
        if (this.cancellationToken.cancelled) {
          callback(new Error("cancelled"), null);
          return;
        }
        this.transferred += chunk.length;
        this.delta += chunk.length;
        const now = Date.now();
        if (now >= this.nextUpdate && this.transferred !== this.total) {
          this.nextUpdate = now + 1e3;
          this.onProgress({
            total: this.total,
            delta: this.delta,
            transferred: this.transferred,
            percent: this.transferred / this.total * 100,
            bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
          });
          this.delta = 0;
        }
        callback(null, chunk);
      }
      _flush(callback) {
        if (this.cancellationToken.cancelled) {
          callback(new Error("cancelled"));
          return;
        }
        this.onProgress({
          total: this.total,
          delta: this.delta,
          transferred: this.total,
          percent: 100,
          bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
        });
        this.delta = 0;
        callback(null);
      }
    };
    exports2.ProgressCallbackTransform = ProgressCallbackTransform;
  }
});

// node_modules/builder-util-runtime/out/httpExecutor.js
var require_httpExecutor = __commonJS({
  "node_modules/builder-util-runtime/out/httpExecutor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DigestTransform = exports2.HttpExecutor = exports2.HttpError = void 0;
    exports2.addSensitiveRedirectHeader = addSensitiveRedirectHeader;
    exports2.addSensitiveFieldPattern = addSensitiveFieldPattern;
    exports2.createHttpError = createHttpError;
    exports2.parseJson = parseJson;
    exports2.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
    exports2.configureRequestUrl = configureRequestUrl;
    exports2.safeGetHeader = safeGetHeader;
    exports2.configureRequestOptions = configureRequestOptions;
    exports2.isSensitiveFieldName = isSensitiveFieldName;
    exports2.hashSensitiveValue = hashSensitiveValue;
    exports2.safeStringifyJson = safeStringifyJson;
    var crypto_1 = require("crypto");
    var debug_1 = require_src();
    var fs_1 = require("fs");
    var stream_1 = require("stream");
    var url_1 = require("url");
    var CancellationToken_1 = require_CancellationToken();
    var error_1 = require_error();
    var ProgressCallbackTransform_1 = require_ProgressCallbackTransform();
    var debug = (0, debug_1.default)("electron-builder");
    var normalizeName = (name) => name.toLowerCase().replace(/[-_]/g, "");
    var SENSITIVE_REDIRECT_HEADERS = /* @__PURE__ */ new Set(["authorization", "proxyauthorization", "privatetoken", "xapikey", "xauthtoken", "xaccesstoken", "xgitlabtoken", "cookie", "xcsrftoken"]);
    var SENSITIVE_FIELD_PATTERNS = ["token", "password", "secret", "authorization", "credential", "apikey", "passphrase", "auth"];
    var SENSITIVE_FIELD_SUFFIXES = ["key"];
    function addSensitiveRedirectHeader(header) {
      SENSITIVE_REDIRECT_HEADERS.add(normalizeName(header));
    }
    function addSensitiveFieldPattern(pattern) {
      SENSITIVE_FIELD_PATTERNS.push(pattern.toLowerCase().replace(/[-_]/g, ""));
    }
    function createHttpError(response, description = null) {
      return new HttpError(response.statusCode || -1, `${response.statusCode} ${response.statusMessage}` + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + safeStringifyJson(response.headers), description);
    }
    var HTTP_STATUS_CODES = /* @__PURE__ */ new Map([
      [429, "Too many requests"],
      [400, "Bad request"],
      [403, "Forbidden"],
      [404, "Not found"],
      [405, "Method not allowed"],
      [406, "Not acceptable"],
      [408, "Request timeout"],
      [413, "Request entity too large"],
      [500, "Internal server error"],
      [502, "Bad gateway"],
      [503, "Service unavailable"],
      [504, "Gateway timeout"],
      [505, "HTTP version not supported"]
    ]);
    var HttpError = class extends Error {
      constructor(statusCode, message = `HTTP error: ${HTTP_STATUS_CODES.get(statusCode) || statusCode}`, description = null) {
        super(message);
        this.statusCode = statusCode;
        this.description = description;
        this.name = "HttpError";
        this.code = `HTTP_ERROR_${statusCode}`;
      }
      isServerError() {
        return this.statusCode >= 500 && this.statusCode <= 599;
      }
    };
    exports2.HttpError = HttpError;
    function parseJson(result) {
      return result.then((it) => it == null || it.length === 0 ? null : JSON.parse(it));
    }
    var HttpExecutor = class _HttpExecutor {
      constructor() {
        this.maxRedirects = 10;
      }
      request(options, cancellationToken = new CancellationToken_1.CancellationToken(), data) {
        configureRequestOptions(options);
        const json = data == null ? void 0 : JSON.stringify(data);
        const encodedData = json ? Buffer.from(json) : void 0;
        if (encodedData != null) {
          if (debug.enabled) {
            debug(safeStringifyJson(data));
          }
          const { headers, ...opts } = options;
          options = {
            method: "post",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": encodedData.length,
              ...headers
            },
            ...opts
          };
        }
        return this.doApiRequest(options, cancellationToken, (it) => it.end(encodedData));
      }
      doApiRequest(options, cancellationToken, requestProcessor, redirectCount = 0) {
        if (debug.enabled) {
          const { headers: _headers, auth: _auth, ...safeOptions } = options;
          debug(`Request: ${safeStringifyJson(safeOptions)}`);
        }
        return cancellationToken.createPromise((resolve, reject, onCancel) => {
          const request = this.createRequest(options, (response) => {
            try {
              this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
            } catch (e) {
              reject(e);
            }
          });
          this.addErrorAndTimeoutHandlers(request, reject, options.timeout);
          this.addRedirectHandlers(request, options, reject, redirectCount, (options2) => {
            this.doApiRequest(options2, cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
          });
          requestProcessor(request, reject);
          onCancel(() => request.abort());
        });
      }
      // noinspection JSUnusedLocalSymbols
      // eslint-disable-next-line
      addRedirectHandlers(request, options, reject, redirectCount, handler) {
      }
      addErrorAndTimeoutHandlers(request, reject, timeout = 60 * 1e3) {
        this.addTimeOutHandler(request, reject, timeout);
        request.on("error", reject);
        request.on("aborted", () => {
          reject(new Error("Request has been aborted by the server"));
        });
      }
      handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
        var _a;
        if (debug.enabled) {
          const { headers: _headers, auth: _auth, ...safeOptions } = options;
          debug(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(safeOptions)}`);
        }
        if (response.statusCode === 404) {
          reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
          return;
        } else if (response.statusCode === 204) {
          resolve();
          return;
        }
        const code = (_a = response.statusCode) !== null && _a !== void 0 ? _a : 0;
        const shouldRedirect = code >= 300 && code < 400;
        const redirectUrl = safeGetHeader(response, "location");
        if (shouldRedirect && redirectUrl != null) {
          if (redirectCount > this.maxRedirects) {
            reject(this.createMaxRedirectError());
            return;
          }
          this.doApiRequest(_HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
          return;
        }
        response.setEncoding("utf8");
        let data = "";
        response.on("error", reject);
        response.on("data", (chunk) => data += chunk);
        response.on("end", () => {
          try {
            if (response.statusCode != null && response.statusCode >= 400) {
              const contentType = safeGetHeader(response, "content-type");
              const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find((it) => it.includes("json")) != null : contentType.includes("json"));
              reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

          Data:
          ${isJson ? safeStringifyJson(JSON.parse(data)) : data}
          `));
            } else {
              resolve(data.length === 0 ? null : data);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
      async downloadToBuffer(url, options) {
        return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
          const responseChunks = [];
          const requestOptions = {
            headers: options.headers || void 0,
            // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
            redirect: "manual"
          };
          configureRequestUrl(url, requestOptions);
          configureRequestOptions(requestOptions);
          this.doDownload(requestOptions, {
            destination: null,
            options,
            onCancel,
            callback: (error) => {
              if (error == null) {
                resolve(Buffer.concat(responseChunks));
              } else {
                reject(error);
              }
            },
            responseHandler: (response, callback) => {
              let receivedLength = 0;
              response.on("data", (chunk) => {
                receivedLength += chunk.length;
                if (receivedLength > 524288e3) {
                  callback(new Error("Maximum allowed size is 500 MB"));
                  return;
                }
                responseChunks.push(chunk);
              });
              response.on("end", () => {
                callback(null);
              });
            }
          }, 0);
        });
      }
      doDownload(requestOptions, options, redirectCount) {
        const request = this.createRequest(requestOptions, (response) => {
          if (response.statusCode >= 400) {
            options.callback(new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
            return;
          }
          response.on("error", options.callback);
          const redirectUrl = safeGetHeader(response, "location");
          if (redirectUrl != null) {
            if (redirectCount < this.maxRedirects) {
              this.doDownload(_HttpExecutor.prepareRedirectUrlOptions(redirectUrl, requestOptions), options, redirectCount++);
            } else {
              options.callback(this.createMaxRedirectError());
            }
            return;
          }
          if (options.responseHandler == null) {
            configurePipes(options, response);
          } else {
            options.responseHandler(response, options.callback);
          }
        });
        this.addErrorAndTimeoutHandlers(request, options.callback, requestOptions.timeout);
        this.addRedirectHandlers(request, requestOptions, options.callback, redirectCount, (requestOptions2) => {
          this.doDownload(requestOptions2, options, redirectCount++);
        });
        request.end();
      }
      createMaxRedirectError() {
        return new Error(`Too many redirects (> ${this.maxRedirects})`);
      }
      addTimeOutHandler(request, callback, timeout) {
        request.on("socket", (socket) => {
          socket.setTimeout(timeout, () => {
            request.abort();
            callback(new Error("Request timed out"));
          });
        });
      }
      static prepareRedirectUrlOptions(redirectUrl, options) {
        const newOptions = configureRequestOptionsFromUrl(redirectUrl, { ...options });
        const headers = newOptions.headers;
        if (headers == null) {
          return newOptions;
        }
        const originalUrl = _HttpExecutor.reconstructOriginalUrl(options);
        const parsedRedirectUrl = parseUrl(redirectUrl, options);
        if (_HttpExecutor.isCrossOriginRedirect(originalUrl, parsedRedirectUrl)) {
          if (debug.enabled) {
            debug(`Cross-origin redirect (${originalUrl.host} \u2192 ${parsedRedirectUrl.host}): stripping sensitive headers`);
          }
          for (const key of Object.keys(headers)) {
            if (SENSITIVE_REDIRECT_HEADERS.has(normalizeName(key))) {
              delete headers[key];
            }
          }
        }
        return newOptions;
      }
      static reconstructOriginalUrl(options) {
        const protocol2 = options.protocol || "https:";
        if (!options.hostname) {
          throw new Error("Missing hostname in request options");
        }
        const hostname = options.hostname;
        const port = options.port ? `:${options.port}` : "";
        const path6 = options.path || "/";
        return new url_1.URL(`${protocol2}//${hostname}${port}${path6}`);
      }
      static isCrossOriginRedirect(originalUrl, redirectUrl) {
        if (originalUrl.hostname.toLowerCase() !== redirectUrl.hostname.toLowerCase()) {
          return true;
        }
        if (originalUrl.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
        ["80", ""].includes(originalUrl.port) && redirectUrl.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
        ["443", ""].includes(redirectUrl.port)) {
          return false;
        }
        if (originalUrl.protocol !== redirectUrl.protocol) {
          return true;
        }
        const originalPort = originalUrl.port;
        const redirectPort = redirectUrl.port;
        return originalPort !== redirectPort;
      }
      static async retryOnServerError(task, maxRetries = 3) {
        for (let attemptNumber = 0; ; attemptNumber++) {
          try {
            return await task();
          } catch (e) {
            if (attemptNumber < maxRetries && (e instanceof HttpError && e.isServerError() || e.code === "EPIPE")) {
              await new Promise((r) => setTimeout(r, 1e3 * (attemptNumber + 1)));
              continue;
            }
            throw e;
          }
        }
      }
    };
    exports2.HttpExecutor = HttpExecutor;
    function parseUrl(url, options) {
      try {
        return new url_1.URL(url);
      } catch {
        const hostname = options.hostname;
        const protocol2 = options.protocol || "https:";
        const port = options.port ? `:${options.port}` : "";
        const baseUrl = `${protocol2}//${hostname}${port}`;
        return new url_1.URL(url, baseUrl);
      }
    }
    function configureRequestOptionsFromUrl(url, options) {
      const result = configureRequestOptions(options);
      const parsedUrl = parseUrl(url, options);
      configureRequestUrl(parsedUrl, result);
      return result;
    }
    function configureRequestUrl(url, options) {
      options.protocol = url.protocol;
      options.hostname = url.hostname;
      if (url.port) {
        options.port = url.port;
      } else if (options.port) {
        delete options.port;
      }
      options.path = url.pathname + url.search;
    }
    var DigestTransform = class extends stream_1.Transform {
      // noinspection JSUnusedGlobalSymbols
      get actual() {
        return this._actual;
      }
      constructor(expected, algorithm = "sha512", encoding = "base64") {
        super();
        this.expected = expected;
        this.algorithm = algorithm;
        this.encoding = encoding;
        this._actual = null;
        this.isValidateOnEnd = true;
        this.digester = (0, crypto_1.createHash)(algorithm);
      }
      // noinspection JSUnusedGlobalSymbols
      _transform(chunk, encoding, callback) {
        this.digester.update(chunk);
        callback(null, chunk);
      }
      // noinspection JSUnusedGlobalSymbols
      _flush(callback) {
        this._actual = this.digester.digest(this.encoding);
        if (this.isValidateOnEnd) {
          try {
            this.validate();
          } catch (e) {
            callback(e);
            return;
          }
        }
        callback(null);
      }
      validate() {
        if (this._actual == null) {
          throw (0, error_1.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
        }
        if (this._actual !== this.expected) {
          throw (0, error_1.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
        }
        return null;
      }
    };
    exports2.DigestTransform = DigestTransform;
    function checkSha2(sha2Header, sha2, callback) {
      if (sha2Header != null && sha2 != null && sha2Header !== sha2) {
        callback(new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
        return false;
      }
      return true;
    }
    function safeGetHeader(response, headerKey) {
      const value = response.headers[headerKey];
      if (value == null) {
        return null;
      } else if (Array.isArray(value)) {
        return value.length === 0 ? null : value[value.length - 1];
      } else {
        return value;
      }
    }
    function configurePipes(options, response) {
      if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.options.sha2, options.callback)) {
        return;
      }
      const streams = [];
      if (options.options.onProgress != null) {
        const contentLength = safeGetHeader(response, "content-length");
        if (contentLength != null) {
          streams.push(new ProgressCallbackTransform_1.ProgressCallbackTransform(parseInt(contentLength, 10), options.options.cancellationToken, options.options.onProgress));
        }
      }
      const sha512 = options.options.sha512;
      if (sha512 != null) {
        streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !sha512.includes("+") && !sha512.includes("Z") && !sha512.includes("=") ? "hex" : "base64"));
      } else if (options.options.sha2 != null) {
        streams.push(new DigestTransform(options.options.sha2, "sha256", "hex"));
      }
      const fileOut = (0, fs_1.createWriteStream)(options.destination);
      streams.push(fileOut);
      let lastStream = response;
      for (const stream of streams) {
        stream.on("error", (error) => {
          fileOut.close();
          if (!options.options.cancellationToken.cancelled) {
            options.callback(error);
          }
        });
        lastStream = lastStream.pipe(stream);
      }
      fileOut.on("finish", () => {
        ;
        fileOut.close(options.callback);
      });
    }
    function configureRequestOptions(options, token, method) {
      if (method != null) {
        options.method = method;
      }
      options.headers = { ...options.headers };
      const headers = options.headers;
      if (token != null) {
        ;
        headers.authorization = token.startsWith("Basic") || token.startsWith("Bearer") ? token : `token ${token}`;
      }
      if (headers["User-Agent"] == null) {
        headers["User-Agent"] = "electron-builder";
      }
      if (method == null || method === "GET" || headers["Cache-Control"] == null) {
        headers["Cache-Control"] = "no-cache";
      }
      if (options.protocol == null && process.versions.electron != null) {
        options.protocol = "https:";
      }
      return options;
    }
    function isSensitiveFieldName(name) {
      const normalized = normalizeName(name);
      return SENSITIVE_FIELD_PATTERNS.some((p) => normalized.includes(p)) || SENSITIVE_FIELD_SUFFIXES.some((s) => normalized.endsWith(s));
    }
    function hashSensitiveValue(value) {
      return `${(0, crypto_1.createHash)("sha256").update(value).digest("hex")} (sha256 hash)`;
    }
    function safeStringifyJson(data, skippedNames) {
      return JSON.stringify(data, (name, value) => {
        if (isSensitiveFieldName(name) || skippedNames != null && skippedNames.has(name)) {
          return typeof value === "string" ? hashSensitiveValue(value) : "<stripped sensitive data>";
        }
        return value;
      }, 2);
    }
  }
});

// node_modules/builder-util-runtime/out/MemoLazy.js
var require_MemoLazy = __commonJS({
  "node_modules/builder-util-runtime/out/MemoLazy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MemoLazy = void 0;
    var MemoLazy = class {
      constructor(selector, creator) {
        this.selector = selector;
        this.creator = creator;
        this.selected = void 0;
        this._value = void 0;
      }
      get hasValue() {
        return this._value !== void 0;
      }
      get value() {
        const selected = this.selector();
        if (this._value !== void 0 && equals(this.selected, selected)) {
          return this._value;
        }
        this.selected = selected;
        const result = this.creator(selected);
        this.value = result;
        return result;
      }
      set value(value) {
        this._value = value;
      }
    };
    exports2.MemoLazy = MemoLazy;
    function equals(firstValue, secondValue) {
      const isFirstObject = typeof firstValue === "object" && firstValue !== null;
      const isSecondObject = typeof secondValue === "object" && secondValue !== null;
      if (isFirstObject && isSecondObject) {
        const keys1 = Object.keys(firstValue);
        const keys2 = Object.keys(secondValue);
        return keys1.length === keys2.length && keys1.every((key) => equals(firstValue[key], secondValue[key]));
      }
      return firstValue === secondValue;
    }
  }
});

// node_modules/builder-util-runtime/out/publishOptions.js
var require_publishOptions = __commonJS({
  "node_modules/builder-util-runtime/out/publishOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.githubUrl = githubUrl;
    exports2.githubTagPrefix = githubTagPrefix;
    exports2.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
    function githubUrl(options, defaultHost = "github.com") {
      return `${options.protocol || "https"}://${options.host || defaultHost}`;
    }
    function githubTagPrefix(options) {
      var _a;
      if (options.tagNamePrefix) {
        return options.tagNamePrefix;
      }
      if ((_a = options.vPrefixedTagName) !== null && _a !== void 0 ? _a : true) {
        return "v";
      }
      return "";
    }
    function getS3LikeProviderBaseUrl(configuration) {
      const provider = configuration.provider;
      if (provider === "s3") {
        return s3Url(configuration);
      }
      if (provider === "spaces") {
        return spacesUrl(configuration);
      }
      throw new Error(`Not supported provider: ${provider}`);
    }
    function s3Url(options) {
      let url;
      if (options.accelerate == true) {
        url = `https://${options.bucket}.s3-accelerate.amazonaws.com`;
      } else if (options.endpoint != null) {
        url = `${options.endpoint}/${options.bucket}`;
      } else if (options.bucket.includes(".")) {
        if (options.region == null) {
          throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
        }
        if (options.region === "us-east-1") {
          url = `https://s3.amazonaws.com/${options.bucket}`;
        } else {
          url = `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
        }
      } else if (options.region === "cn-north-1") {
        url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
      } else {
        url = `https://${options.bucket}.s3.amazonaws.com`;
      }
      return appendPath(url, options.path);
    }
    function appendPath(url, p) {
      if (p != null && p.length > 0) {
        if (!p.startsWith("/")) {
          url += "/";
        }
        url += p;
      }
      return url;
    }
    function spacesUrl(options) {
      if (options.name == null) {
        throw new Error(`name is missing`);
      }
      if (options.region == null) {
        throw new Error(`region is missing`);
      }
      return appendPath(`https://${options.name}.${options.region}.digitaloceanspaces.com`, options.path);
    }
  }
});

// node_modules/builder-util-runtime/out/retry.js
var require_retry = __commonJS({
  "node_modules/builder-util-runtime/out/retry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.retry = retry;
    var CancellationToken_1 = require_CancellationToken();
    async function retry(task, options) {
      var _a;
      const { retries: retryCount, interval, backoff: backoff2 = 0, attempt = 0, shouldRetry, cancellationToken = new CancellationToken_1.CancellationToken() } = options;
      try {
        return await task();
      } catch (error) {
        if (await Promise.resolve((_a = shouldRetry === null || shouldRetry === void 0 ? void 0 : shouldRetry(error)) !== null && _a !== void 0 ? _a : true) && retryCount > 0 && !cancellationToken.cancelled) {
          await new Promise((resolve) => setTimeout(resolve, interval + backoff2 * attempt));
          return await retry(task, { ...options, retries: retryCount - 1, attempt: attempt + 1 });
        } else {
          throw error;
        }
      }
    }
  }
});

// node_modules/builder-util-runtime/out/rfc2253Parser.js
var require_rfc2253Parser = __commonJS({
  "node_modules/builder-util-runtime/out/rfc2253Parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseDn = parseDn;
    function parseDn(seq) {
      let quoted = false;
      let key = null;
      let token = "";
      let nextNonSpace = 0;
      seq = seq.trim();
      const result = /* @__PURE__ */ new Map();
      for (let i = 0; i <= seq.length; i++) {
        if (i === seq.length) {
          if (key !== null) {
            result.set(key, token);
          }
          break;
        }
        const ch = seq[i];
        if (quoted) {
          if (ch === '"') {
            quoted = false;
            continue;
          }
        } else {
          if (ch === '"') {
            quoted = true;
            continue;
          }
          if (ch === "\\") {
            i++;
            const ord = parseInt(seq.slice(i, i + 2), 16);
            if (Number.isNaN(ord)) {
              token += seq[i];
            } else {
              i++;
              token += String.fromCharCode(ord);
            }
            continue;
          }
          if (key === null && ch === "=") {
            key = token;
            token = "";
            continue;
          }
          if (ch === "," || ch === ";" || ch === "+") {
            if (key !== null) {
              result.set(key, token);
            }
            key = null;
            token = "";
            continue;
          }
        }
        if (ch === " " && !quoted) {
          if (token.length === 0) {
            continue;
          }
          if (i > nextNonSpace) {
            let j = i;
            while (seq[j] === " ") {
              j++;
            }
            nextNonSpace = j;
          }
          if (nextNonSpace >= seq.length || seq[nextNonSpace] === "," || seq[nextNonSpace] === ";" || key === null && seq[nextNonSpace] === "=" || key !== null && seq[nextNonSpace] === "+") {
            i = nextNonSpace - 1;
            continue;
          }
        }
        token += ch;
      }
      return result;
    }
  }
});

// node_modules/builder-util-runtime/out/uuid.js
var require_uuid = __commonJS({
  "node_modules/builder-util-runtime/out/uuid.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.nil = exports2.UUID = void 0;
    var crypto_1 = require("crypto");
    var error_1 = require_error();
    var invalidName = "options.name must be either a string or a Buffer";
    var randomHost = (0, crypto_1.randomBytes)(16);
    randomHost[0] = randomHost[0] | 1;
    var hex2byte = {};
    var byte2hex = [];
    for (let i = 0; i < 256; i++) {
      const hex = (i + 256).toString(16).substr(1);
      hex2byte[hex] = i;
      byte2hex[i] = hex;
    }
    var UUID = class _UUID {
      constructor(uuid) {
        this.ascii = null;
        this.binary = null;
        const check3 = _UUID.check(uuid);
        if (!check3) {
          throw new Error("not a UUID");
        }
        this.version = check3.version;
        if (check3.format === "ascii") {
          this.ascii = uuid;
        } else {
          this.binary = uuid;
        }
      }
      static v5(name, namespace) {
        return uuidNamed(name, "sha1", 80, namespace);
      }
      toString() {
        if (this.ascii == null) {
          this.ascii = stringify(this.binary);
        }
        return this.ascii;
      }
      inspect() {
        return `UUID v${this.version} ${this.toString()}`;
      }
      static check(uuid, offset = 0) {
        if (typeof uuid === "string") {
          uuid = uuid.toLowerCase();
          if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(uuid)) {
            return false;
          }
          if (uuid === "00000000-0000-0000-0000-000000000000") {
            return { version: void 0, variant: "nil", format: "ascii" };
          }
          return {
            version: (hex2byte[uuid[14] + uuid[15]] & 240) >> 4,
            variant: getVariant((hex2byte[uuid[19] + uuid[20]] & 224) >> 5),
            format: "ascii"
          };
        }
        if (Buffer.isBuffer(uuid)) {
          if (uuid.length < offset + 16) {
            return false;
          }
          let i = 0;
          for (; i < 16; i++) {
            if (uuid[offset + i] !== 0) {
              break;
            }
          }
          if (i === 16) {
            return { version: void 0, variant: "nil", format: "binary" };
          }
          return {
            version: (uuid[offset + 6] & 240) >> 4,
            variant: getVariant((uuid[offset + 8] & 224) >> 5),
            format: "binary"
          };
        }
        throw (0, error_1.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
      }
      // read stringified uuid into a Buffer
      static parse(input) {
        const buffer = Buffer.allocUnsafe(16);
        let j = 0;
        for (let i = 0; i < 16; i++) {
          buffer[i] = hex2byte[input[j++] + input[j++]];
          if (i === 3 || i === 5 || i === 7 || i === 9) {
            j += 1;
          }
        }
        return buffer;
      }
    };
    exports2.UUID = UUID;
    UUID.OID = UUID.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
    function getVariant(bits) {
      switch (bits) {
        case 0:
        case 1:
        case 3:
          return "ncs";
        case 4:
        case 5:
          return "rfc4122";
        case 6:
          return "microsoft";
        default:
          return "future";
      }
    }
    var UuidEncoding;
    (function(UuidEncoding2) {
      UuidEncoding2[UuidEncoding2["ASCII"] = 0] = "ASCII";
      UuidEncoding2[UuidEncoding2["BINARY"] = 1] = "BINARY";
      UuidEncoding2[UuidEncoding2["OBJECT"] = 2] = "OBJECT";
    })(UuidEncoding || (UuidEncoding = {}));
    function uuidNamed(name, hashMethod, version, namespace, encoding = UuidEncoding.ASCII) {
      const hash2 = (0, crypto_1.createHash)(hashMethod);
      const nameIsNotAString = typeof name !== "string";
      if (nameIsNotAString && !Buffer.isBuffer(name)) {
        throw (0, error_1.newError)(invalidName, "ERR_INVALID_UUID_NAME");
      }
      hash2.update(namespace);
      hash2.update(name);
      const buffer = hash2.digest();
      let result;
      switch (encoding) {
        case UuidEncoding.BINARY:
          buffer[6] = buffer[6] & 15 | version;
          buffer[8] = buffer[8] & 63 | 128;
          result = buffer;
          break;
        case UuidEncoding.OBJECT:
          buffer[6] = buffer[6] & 15 | version;
          buffer[8] = buffer[8] & 63 | 128;
          result = new UUID(buffer);
          break;
        default:
          result = byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6] & 15 | version] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8] & 63 | 128] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
          break;
      }
      return result;
    }
    function stringify(buffer) {
      return byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6]] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8]] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
    }
    exports2.nil = new UUID("00000000-0000-0000-0000-000000000000");
  }
});

// node_modules/sax/lib/sax.js
var require_sax = __commonJS({
  "node_modules/sax/lib/sax.js"(exports2) {
    (function(sax) {
      sax.parser = function(strict, opt) {
        return new SAXParser(strict, opt);
      };
      sax.SAXParser = SAXParser;
      sax.SAXStream = SAXStream;
      sax.createStream = createStream;
      sax.MAX_BUFFER_LENGTH = 64 * 1024;
      var buffers = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      sax.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function SAXParser(strict, opt) {
        if (!(this instanceof SAXParser)) {
          return new SAXParser(strict, opt);
        }
        var parser = this;
        clearBuffers(parser);
        parser.q = parser.c = "";
        parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
        parser.encoding = null;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
        parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512;
        parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4;
        parser.entityCount = parser.entityDepth = 0;
        parser.tags = [];
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.strict = !!strict;
        parser.noscript = !!(strict || parser.opt.noscript);
        parser.state = S.BEGIN;
        parser.strictEntities = parser.opt.strictEntities;
        parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
        parser.attribList = [];
        if (parser.opt.xmlns) {
          parser.ns = Object.create(rootNS);
        }
        if (parser.opt.unquotedAttributeValues === void 0) {
          parser.opt.unquotedAttributeValues = !strict;
        }
        parser.trackPosition = parser.opt.position !== false;
        if (parser.trackPosition) {
          parser.position = parser.line = parser.column = 0;
        }
        emit(parser, "onready");
      }
      if (!Object.create) {
        Object.create = function(o) {
          function F() {
          }
          F.prototype = o;
          var newf = new F();
          return newf;
        };
      }
      if (!Object.keys) {
        Object.keys = function(o) {
          var a = [];
          for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
          return a;
        };
      }
      function checkBufferLength(parser) {
        var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
        var maxActual = 0;
        for (var i = 0, l = buffers.length; i < l; i++) {
          var len = parser[buffers[i]].length;
          if (len > maxAllowed) {
            switch (buffers[i]) {
              case "textNode":
                closeText(parser);
                break;
              case "cdata":
                emitNode(parser, "oncdata", parser.cdata);
                parser.cdata = "";
                break;
              case "script":
                emitNode(parser, "onscript", parser.script);
                parser.script = "";
                break;
              default:
                error(parser, "Max buffer length exceeded: " + buffers[i]);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        var m = sax.MAX_BUFFER_LENGTH - maxActual;
        parser.bufferCheckPosition = m + parser.position;
      }
      function clearBuffers(parser) {
        for (var i = 0, l = buffers.length; i < l; i++) {
          parser[buffers[i]] = "";
        }
      }
      function flushBuffers(parser) {
        closeText(parser);
        if (parser.cdata !== "") {
          emitNode(parser, "oncdata", parser.cdata);
          parser.cdata = "";
        }
        if (parser.script !== "") {
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
      }
      SAXParser.prototype = {
        end: function() {
          end(this);
        },
        write,
        resume: function() {
          this.error = null;
          return this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          flushBuffers(this);
        }
      };
      var Stream;
      try {
        Stream = require("stream").Stream;
      } catch (ex) {
        Stream = function() {
        };
      }
      if (!Stream) Stream = function() {
      };
      var streamWraps = sax.EVENTS.filter(function(ev) {
        return ev !== "error" && ev !== "end";
      });
      function createStream(strict, opt) {
        return new SAXStream(strict, opt);
      }
      function determineBufferEncoding(data, isEnd) {
        if (data.length >= 2) {
          if (data[0] === 255 && data[1] === 254) {
            return "utf-16le";
          }
          if (data[0] === 254 && data[1] === 255) {
            return "utf-16be";
          }
        }
        if (data.length >= 3 && data[0] === 239 && data[1] === 187 && data[2] === 191) {
          return "utf8";
        }
        if (data.length >= 4) {
          if (data[0] === 60 && data[1] === 0 && data[2] === 63 && data[3] === 0) {
            return "utf-16le";
          }
          if (data[0] === 0 && data[1] === 60 && data[2] === 0 && data[3] === 63) {
            return "utf-16be";
          }
          return "utf8";
        }
        return isEnd ? "utf8" : null;
      }
      function SAXStream(strict, opt) {
        if (!(this instanceof SAXStream)) {
          return new SAXStream(strict, opt);
        }
        Stream.apply(this);
        this._parser = new SAXParser(strict, opt);
        this.writable = true;
        this.readable = true;
        var me = this;
        this._parser.onend = function() {
          me.emit("end");
        };
        this._parser.onerror = function(er) {
          me.emit("error", er);
          me._parser.error = null;
        };
        this._decoder = null;
        this._decoderBuffer = null;
        streamWraps.forEach(function(ev) {
          Object.defineProperty(me, "on" + ev, {
            get: function() {
              return me._parser["on" + ev];
            },
            set: function(h) {
              if (!h) {
                me.removeAllListeners(ev);
                me._parser["on" + ev] = h;
                return h;
              }
              me.on(ev, h);
            },
            enumerable: true,
            configurable: false
          });
        });
      }
      SAXStream.prototype = Object.create(Stream.prototype, {
        constructor: {
          value: SAXStream
        }
      });
      SAXStream.prototype._decodeBuffer = function(data, isEnd) {
        if (this._decoderBuffer) {
          data = Buffer.concat([this._decoderBuffer, data]);
          this._decoderBuffer = null;
        }
        if (!this._decoder) {
          var encoding = determineBufferEncoding(data, isEnd);
          if (!encoding) {
            this._decoderBuffer = data;
            return "";
          }
          this._parser.encoding = encoding;
          this._decoder = new TextDecoder(encoding);
        }
        return this._decoder.decode(data, { stream: !isEnd });
      };
      SAXStream.prototype.write = function(data) {
        if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
          data = this._decodeBuffer(data, false);
        } else if (this._decoderBuffer) {
          var remaining = this._decodeBuffer(Buffer.alloc(0), true);
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
        }
        this._parser.write(data.toString());
        this.emit("data", data);
        return true;
      };
      SAXStream.prototype.end = function(chunk) {
        if (chunk && chunk.length) {
          this.write(chunk);
        }
        if (this._decoderBuffer) {
          var finalChunk = this._decodeBuffer(Buffer.alloc(0), true);
          if (finalChunk) {
            this._parser.write(finalChunk);
            this.emit("data", finalChunk);
          }
        } else if (this._decoder) {
          var remaining = this._decoder.decode();
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
        }
        this._parser.end();
        return true;
      };
      SAXStream.prototype.on = function(ev, handler) {
        var me = this;
        if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser["on" + ev] = function() {
            var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }
        return Stream.prototype.on.call(me, ev, handler);
      };
      var CDATAre = /^\[CDATA\[$/i;
      var DOCTYPEre = /^DOCTYPE$/i;
      var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
      var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
      var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };
      var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function isWhitespace(c) {
        return c === " " || c === "\n" || c === "\r" || c === "	";
      }
      function isQuote(c) {
        return c === '"' || c === "'";
      }
      function isAttribEnd(c) {
        return c === ">" || isWhitespace(c);
      }
      function isMatch(regex, c) {
        return regex.test(c);
      }
      function notMatch(regex, c) {
        return !isMatch(regex, c);
      }
      var S = 0;
      sax.STATE = {
        BEGIN: S++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: S++,
        // leading whitespace
        TEXT: S++,
        // general stuff
        TEXT_ENTITY: S++,
        // &amp and such.
        OPEN_WAKA: S++,
        // <
        SGML_DECL: S++,
        // <!BLARG
        SGML_DECL_QUOTED: S++,
        // <!BLARG foo "bar
        DOCTYPE: S++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: S++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: S++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: S++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: S++,
        // <!-
        COMMENT: S++,
        // <!--
        COMMENT_ENDING: S++,
        // <!-- blah -
        COMMENT_ENDED: S++,
        // <!-- blah --
        CDATA: S++,
        // <![CDATA[ something
        CDATA_ENDING: S++,
        // ]
        CDATA_ENDING_2: S++,
        // ]]
        PROC_INST: S++,
        // <?hi
        PROC_INST_BODY: S++,
        // <?hi there
        PROC_INST_ENDING: S++,
        // <?hi "there" ?
        OPEN_TAG: S++,
        // <strong
        OPEN_TAG_SLASH: S++,
        // <strong /
        ATTRIB: S++,
        // <a
        ATTRIB_NAME: S++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: S++,
        // <a foo _
        ATTRIB_VALUE: S++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: S++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: S++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: S++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: S++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: S++,
        // <foo bar=&quot
        CLOSE_TAG: S++,
        // </a
        CLOSE_TAG_SAW_WHITE: S++,
        // </a   >
        SCRIPT: S++,
        // <script> ...
        SCRIPT_ENDING: S++
        // <script> ... <
      };
      sax.XML_ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      });
      sax.ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      });
      Object.keys(sax.ENTITIES).forEach(function(key) {
        var e = sax.ENTITIES[key];
        var s2 = typeof e === "number" ? String.fromCharCode(e) : e;
        sax.ENTITIES[key] = s2;
      });
      for (var s in sax.STATE) {
        sax.STATE[sax.STATE[s]] = s;
      }
      S = sax.STATE;
      function emit(parser, event, data) {
        parser[event] && parser[event](data);
      }
      function getDeclaredEncoding(body) {
        var match = body && body.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
        return match ? match[2] : null;
      }
      function normalizeEncodingName(encoding) {
        if (!encoding) {
          return null;
        }
        return encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
      }
      function encodingsMatch(detectedEncoding, declaredEncoding) {
        const detected = normalizeEncodingName(detectedEncoding);
        const declared = normalizeEncodingName(declaredEncoding);
        if (!detected || !declared) {
          return true;
        }
        if (declared === "utf16") {
          return detected === "utf16le" || detected === "utf16be";
        }
        return detected === declared;
      }
      function validateXmlDeclarationEncoding(parser, data) {
        if (!parser.strict || !parser.encoding || !data || data.name !== "xml") {
          return;
        }
        var declaredEncoding = getDeclaredEncoding(data.body);
        if (declaredEncoding && !encodingsMatch(parser.encoding, declaredEncoding)) {
          strictFail(
            parser,
            "XML declaration encoding " + declaredEncoding + " does not match detected stream encoding " + parser.encoding.toUpperCase()
          );
        }
      }
      function emitNode(parser, nodeType, data) {
        if (parser.textNode) closeText(parser);
        emit(parser, nodeType, data);
      }
      function closeText(parser) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode) emit(parser, "ontext", parser.textNode);
        parser.textNode = "";
      }
      function textopts(opt, text2) {
        if (opt.trim) text2 = text2.trim();
        if (opt.normalize) text2 = text2.replace(/\s+/g, " ");
        return text2;
      }
      function error(parser, er) {
        closeText(parser);
        if (parser.trackPosition) {
          er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
        }
        er = new Error(er);
        parser.error = er;
        emit(parser, "onerror", er);
        return parser;
      }
      function end(parser) {
        if (parser.sawRoot && !parser.closedRoot)
          strictFail(parser, "Unclosed root tag");
        if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
          error(parser, "Unexpected end");
        }
        closeText(parser);
        parser.c = "";
        parser.closed = true;
        emit(parser, "onend");
        SAXParser.call(parser, parser.strict, parser.opt);
        return parser;
      }
      function strictFail(parser, message) {
        if (typeof parser !== "object" || !(parser instanceof SAXParser)) {
          throw new Error("bad call to strictFail");
        }
        if (parser.strict) {
          error(parser, message);
        }
      }
      function newTag(parser) {
        if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
        var parent = parser.tags[parser.tags.length - 1] || parser;
        var tag = parser.tag = { name: parser.tagName, attributes: {} };
        if (parser.opt.xmlns) {
          tag.ns = parent.ns;
        }
        parser.attribList.length = 0;
        emitNode(parser, "onopentagstart", tag);
      }
      function qname(name, attribute) {
        var i = name.indexOf(":");
        var qualName = i < 0 ? ["", name] : name.split(":");
        var prefix = qualName[0];
        var local = qualName[1];
        if (attribute && name === "xmlns") {
          prefix = "xmlns";
          local = "";
        }
        return { prefix, local };
      }
      function attrib(parser) {
        if (!parser.strict) {
          parser.attribName = parser.attribName[parser.looseCase]();
        }
        if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
          parser.attribName = parser.attribValue = "";
          return;
        }
        if (parser.opt.xmlns) {
          var qn = qname(parser.attribName, true);
          var prefix = qn.prefix;
          var local = qn.local;
          if (prefix === "xmlns") {
            if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
              strictFail(
                parser,
                "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
              strictFail(
                parser,
                "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else {
              var tag = parser.tag;
              var parent = parser.tags[parser.tags.length - 1] || parser;
              if (tag.ns === parent.ns) {
                tag.ns = Object.create(parent.ns);
              }
              tag.ns[local] = parser.attribValue;
            }
          }
          parser.attribList.push([parser.attribName, parser.attribValue]);
        } else {
          parser.tag.attributes[parser.attribName] = parser.attribValue;
          emitNode(parser, "onattribute", {
            name: parser.attribName,
            value: parser.attribValue
          });
        }
        parser.attribName = parser.attribValue = "";
      }
      function openTag(parser, selfClosing) {
        if (parser.opt.xmlns) {
          var tag = parser.tag;
          var qn = qname(parser.tagName);
          tag.prefix = qn.prefix;
          tag.local = qn.local;
          tag.uri = tag.ns[qn.prefix] || "";
          if (tag.prefix && !tag.uri) {
            strictFail(
              parser,
              "Unbound namespace prefix: " + JSON.stringify(parser.tagName)
            );
            tag.uri = qn.prefix;
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns && parent.ns !== tag.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              emitNode(parser, "onopennamespace", {
                prefix: p,
                uri: tag.ns[p]
              });
            });
          }
          for (var i = 0, l = parser.attribList.length; i < l; i++) {
            var nv = parser.attribList[i];
            var name = nv[0];
            var value = nv[1];
            var qualName = qname(name, true);
            var prefix = qualName.prefix;
            var local = qualName.local;
            var uri = prefix === "" ? "" : tag.ns[prefix] || "";
            var a = {
              name,
              value,
              prefix,
              local,
              uri
            };
            if (prefix && prefix !== "xmlns" && !uri) {
              strictFail(
                parser,
                "Unbound namespace prefix: " + JSON.stringify(prefix)
              );
              a.uri = prefix;
            }
            parser.tag.attributes[name] = a;
            emitNode(parser, "onattribute", a);
          }
          parser.attribList.length = 0;
        }
        parser.tag.isSelfClosing = !!selfClosing;
        parser.sawRoot = true;
        parser.tags.push(parser.tag);
        emitNode(parser, "onopentag", parser.tag);
        if (!selfClosing) {
          if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
            parser.state = S.SCRIPT;
          } else {
            parser.state = S.TEXT;
          }
          parser.tag = null;
          parser.tagName = "";
        }
        parser.attribName = parser.attribValue = "";
        parser.attribList.length = 0;
      }
      function closeTag(parser) {
        if (!parser.tagName) {
          strictFail(parser, "Weird empty close tag.");
          parser.textNode += "</>";
          parser.state = S.TEXT;
          return;
        }
        if (parser.script) {
          if (parser.tagName !== "script") {
            parser.script += "</" + parser.tagName + ">";
            parser.tagName = "";
            parser.state = S.SCRIPT;
            return;
          }
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
        var t = parser.tags.length;
        var tagName = parser.tagName;
        if (!parser.strict) {
          tagName = tagName[parser.looseCase]();
        }
        var closeTo = tagName;
        while (t--) {
          var close = parser.tags[t];
          if (close.name !== closeTo) {
            strictFail(parser, "Unexpected close tag");
          } else {
            break;
          }
        }
        if (t < 0) {
          strictFail(parser, "Unmatched closing tag: " + parser.tagName);
          parser.textNode += "</" + parser.tagName + ">";
          parser.state = S.TEXT;
          return;
        }
        parser.tagName = tagName;
        var s2 = parser.tags.length;
        while (s2-- > t) {
          var tag = parser.tag = parser.tags.pop();
          parser.tagName = parser.tag.name;
          emitNode(parser, "onclosetag", parser.tagName);
          var x = {};
          for (var i in tag.ns) {
            x[i] = tag.ns[i];
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (parser.opt.xmlns && tag.ns !== parent.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              var n = tag.ns[p];
              emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
            });
          }
        }
        if (t === 0) parser.closedRoot = true;
        parser.tagName = parser.attribValue = parser.attribName = "";
        parser.attribList.length = 0;
        parser.state = S.TEXT;
      }
      function parseEntity(parser) {
        var entity = parser.entity;
        var entityLC = entity.toLowerCase();
        var num;
        var numStr = "";
        if (parser.ENTITIES[entity]) {
          return parser.ENTITIES[entity];
        }
        if (parser.ENTITIES[entityLC]) {
          return parser.ENTITIES[entityLC];
        }
        entity = entityLC;
        if (entity.charAt(0) === "#") {
          if (entity.charAt(1) === "x") {
            entity = entity.slice(2);
            num = parseInt(entity, 16);
            numStr = num.toString(16);
          } else {
            entity = entity.slice(1);
            num = parseInt(entity, 10);
            numStr = num.toString(10);
          }
        }
        entity = entity.replace(/^0+/, "");
        if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111 || !isXmlChar(num)) {
          strictFail(parser, "Invalid character entity");
          return "&" + parser.entity + ";";
        }
        return String.fromCodePoint(num);
      }
      function isXmlChar(num) {
        return num === 9 || num === 10 || num === 13 || num >= 32 && num <= 55295 || num >= 57344 && num <= 65533 || num >= 65536 && num <= 1114111;
      }
      function beginWhiteSpace(parser, c) {
        if (c === "<") {
          parser.state = S.OPEN_WAKA;
          parser.startTagPosition = parser.position;
        } else if (!isWhitespace(c)) {
          strictFail(parser, "Non-whitespace before first tag.");
          parser.textNode = c;
          parser.state = S.TEXT;
        }
      }
      function charAt(chunk, i) {
        var result = "";
        if (i < chunk.length) {
          result = chunk.charAt(i);
        }
        return result;
      }
      function write(chunk) {
        var parser = this;
        if (this.error) {
          throw this.error;
        }
        if (parser.closed) {
          return error(
            parser,
            "Cannot write after close. Assign an onready handler."
          );
        }
        if (chunk === null) {
          return end(parser);
        }
        if (typeof chunk === "object") {
          chunk = chunk.toString();
        }
        var i = 0;
        var c = "";
        while (true) {
          c = charAt(chunk, i++);
          parser.c = c;
          if (!c) {
            break;
          }
          if (parser.trackPosition) {
            parser.position++;
            if (c === "\n") {
              parser.line++;
              parser.column = 0;
            } else {
              parser.column++;
            }
          }
          switch (parser.state) {
            case S.BEGIN:
              parser.state = S.BEGIN_WHITESPACE;
              if (c === "\uFEFF") {
                continue;
              }
              beginWhiteSpace(parser, c);
              continue;
            case S.BEGIN_WHITESPACE:
              beginWhiteSpace(parser, c);
              continue;
            case S.TEXT:
              if (parser.sawRoot && !parser.closedRoot) {
                var starti = i - 1;
                while (c && c !== "<" && c !== "&") {
                  c = charAt(chunk, i++);
                  if (c && parser.trackPosition) {
                    parser.position++;
                    if (c === "\n") {
                      parser.line++;
                      parser.column = 0;
                    } else {
                      parser.column++;
                    }
                  }
                }
                parser.textNode += chunk.substring(starti, i - 1);
              }
              if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else {
                if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
                  strictFail(parser, "Text data outside of root node.");
                }
                if (c === "&") {
                  parser.state = S.TEXT_ENTITY;
                } else {
                  parser.textNode += c;
                }
              }
              continue;
            case S.SCRIPT:
              if (c === "<") {
                parser.state = S.SCRIPT_ENDING;
              } else {
                parser.script += c;
              }
              continue;
            case S.SCRIPT_ENDING:
              if (c === "/") {
                parser.state = S.CLOSE_TAG;
              } else {
                parser.script += "<" + c;
                parser.state = S.SCRIPT;
              }
              continue;
            case S.OPEN_WAKA:
              if (c === "!") {
                parser.state = S.SGML_DECL;
                parser.sgmlDecl = "";
              } else if (isWhitespace(c)) {
              } else if (isMatch(nameStart, c)) {
                parser.state = S.OPEN_TAG;
                parser.tagName = c;
              } else if (c === "/") {
                parser.state = S.CLOSE_TAG;
                parser.tagName = "";
              } else if (c === "?") {
                parser.state = S.PROC_INST;
                parser.procInstName = parser.procInstBody = "";
              } else {
                strictFail(parser, "Unencoded <");
                if (parser.startTagPosition + 1 < parser.position) {
                  var pad = parser.position - parser.startTagPosition;
                  c = new Array(pad).join(" ") + c;
                }
                parser.textNode += "<" + c;
                parser.state = S.TEXT;
              }
              continue;
            case S.SGML_DECL:
              if (parser.sgmlDecl + c === "--") {
                parser.state = S.COMMENT;
                parser.comment = "";
                parser.sgmlDecl = "";
                continue;
              }
              if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
                parser.state = S.DOCTYPE_DTD;
                parser.doctype += "<!" + parser.sgmlDecl + c;
                parser.sgmlDecl = "";
              } else if (CDATAre.test(parser.sgmlDecl + c)) {
                emitNode(parser, "onopencdata");
                parser.state = S.CDATA;
                parser.sgmlDecl = "";
                parser.cdata = "";
              } else if (DOCTYPEre.test(parser.sgmlDecl + c)) {
                parser.state = S.DOCTYPE;
                if (parser.doctype || parser.sawRoot) {
                  strictFail(
                    parser,
                    "Inappropriately located doctype declaration"
                  );
                }
                parser.doctype = "";
                parser.sgmlDecl = "";
              } else if (c === ">") {
                emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
                parser.sgmlDecl = "";
                parser.state = S.TEXT;
              } else if (isQuote(c)) {
                parser.state = S.SGML_DECL_QUOTED;
                parser.sgmlDecl += c;
              } else {
                parser.sgmlDecl += c;
              }
              continue;
            case S.SGML_DECL_QUOTED:
              if (c === parser.q) {
                parser.state = S.SGML_DECL;
                parser.q = "";
              }
              parser.sgmlDecl += c;
              continue;
            case S.DOCTYPE:
              if (c === ">") {
                parser.state = S.TEXT;
                emitNode(parser, "ondoctype", parser.doctype);
                parser.doctype = true;
              } else {
                parser.doctype += c;
                if (c === "[") {
                  parser.state = S.DOCTYPE_DTD;
                } else if (isQuote(c)) {
                  parser.state = S.DOCTYPE_QUOTED;
                  parser.q = c;
                }
              }
              continue;
            case S.DOCTYPE_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.q = "";
                parser.state = S.DOCTYPE;
              }
              continue;
            case S.DOCTYPE_DTD:
              if (c === "]") {
                parser.doctype += c;
                parser.state = S.DOCTYPE;
              } else if (c === "<") {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else if (isQuote(c)) {
                parser.doctype += c;
                parser.state = S.DOCTYPE_DTD_QUOTED;
                parser.q = c;
              } else {
                parser.doctype += c;
              }
              continue;
            case S.DOCTYPE_DTD_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.state = S.DOCTYPE_DTD;
                parser.q = "";
              }
              continue;
            case S.COMMENT:
              if (c === "-") {
                parser.state = S.COMMENT_ENDING;
              } else {
                parser.comment += c;
              }
              continue;
            case S.COMMENT_ENDING:
              if (c === "-") {
                parser.state = S.COMMENT_ENDED;
                parser.comment = textopts(parser.opt, parser.comment);
                if (parser.comment) {
                  emitNode(parser, "oncomment", parser.comment);
                }
                parser.comment = "";
              } else {
                parser.comment += "-" + c;
                parser.state = S.COMMENT;
              }
              continue;
            case S.COMMENT_ENDED:
              if (c !== ">") {
                strictFail(parser, "Malformed comment");
                parser.comment += "--" + c;
                parser.state = S.COMMENT;
              } else if (parser.doctype && parser.doctype !== true) {
                parser.state = S.DOCTYPE_DTD;
              } else {
                parser.state = S.TEXT;
              }
              continue;
            case S.CDATA:
              var starti = i - 1;
              while (c && c !== "]") {
                c = charAt(chunk, i++);
                if (c && parser.trackPosition) {
                  parser.position++;
                  if (c === "\n") {
                    parser.line++;
                    parser.column = 0;
                  } else {
                    parser.column++;
                  }
                }
              }
              parser.cdata += chunk.substring(starti, i - 1);
              if (c === "]") {
                parser.state = S.CDATA_ENDING;
              }
              continue;
            case S.CDATA_ENDING:
              if (c === "]") {
                parser.state = S.CDATA_ENDING_2;
              } else {
                parser.cdata += "]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.CDATA_ENDING_2:
              if (c === ">") {
                if (parser.cdata) {
                  emitNode(parser, "oncdata", parser.cdata);
                }
                emitNode(parser, "onclosecdata");
                parser.cdata = "";
                parser.state = S.TEXT;
              } else if (c === "]") {
                parser.cdata += "]";
              } else {
                parser.cdata += "]]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.PROC_INST:
              if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else if (isWhitespace(c)) {
                parser.state = S.PROC_INST_BODY;
              } else {
                parser.procInstName += c;
              }
              continue;
            case S.PROC_INST_BODY:
              if (!parser.procInstBody && isWhitespace(c)) {
                continue;
              } else if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else {
                parser.procInstBody += c;
              }
              continue;
            case S.PROC_INST_ENDING:
              if (c === ">") {
                const procInstEndData = {
                  name: parser.procInstName,
                  body: parser.procInstBody
                };
                validateXmlDeclarationEncoding(parser, procInstEndData);
                emitNode(parser, "onprocessinginstruction", procInstEndData);
                parser.procInstName = parser.procInstBody = "";
                parser.state = S.TEXT;
              } else {
                parser.procInstBody += "?" + c;
                parser.state = S.PROC_INST_BODY;
              }
              continue;
            case S.OPEN_TAG:
              if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else {
                newTag(parser);
                if (c === ">") {
                  openTag(parser);
                } else if (c === "/") {
                  parser.state = S.OPEN_TAG_SLASH;
                } else {
                  if (!isWhitespace(c)) {
                    strictFail(parser, "Invalid character in tag name");
                  }
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.OPEN_TAG_SLASH:
              if (c === ">") {
                openTag(parser, true);
                closeTag(parser);
              } else {
                strictFail(
                  parser,
                  "Forward-slash in opening tag not followed by >"
                );
                parser.state = S.ATTRIB;
              }
              continue;
            case S.ATTRIB:
              if (isWhitespace(c)) {
                continue;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (c === ">") {
                strictFail(parser, "Attribute without value");
                parser.attribValue = parser.attribName;
                attrib(parser);
                openTag(parser);
              } else if (isWhitespace(c)) {
                parser.state = S.ATTRIB_NAME_SAW_WHITE;
              } else if (isMatch(nameBody, c)) {
                parser.attribName += c;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME_SAW_WHITE:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (isWhitespace(c)) {
                continue;
              } else {
                strictFail(parser, "Attribute without value");
                parser.tag.attributes[parser.attribName] = "";
                parser.attribValue = "";
                emitNode(parser, "onattribute", {
                  name: parser.attribName,
                  value: ""
                });
                parser.attribName = "";
                if (c === ">") {
                  openTag(parser);
                } else if (isMatch(nameStart, c)) {
                  parser.attribName = c;
                  parser.state = S.ATTRIB_NAME;
                } else {
                  strictFail(parser, "Invalid attribute name");
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.ATTRIB_VALUE:
              if (isWhitespace(c)) {
                continue;
              } else if (isQuote(c)) {
                parser.q = c;
                parser.state = S.ATTRIB_VALUE_QUOTED;
              } else {
                if (!parser.opt.unquotedAttributeValues) {
                  error(parser, "Unquoted attribute value");
                }
                parser.state = S.ATTRIB_VALUE_UNQUOTED;
                parser.attribValue = c;
              }
              continue;
            case S.ATTRIB_VALUE_QUOTED:
              if (c !== parser.q) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_Q;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              parser.q = "";
              parser.state = S.ATTRIB_VALUE_CLOSED;
              continue;
            case S.ATTRIB_VALUE_CLOSED:
              if (isWhitespace(c)) {
                parser.state = S.ATTRIB;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                strictFail(parser, "No whitespace between attributes");
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_VALUE_UNQUOTED:
              if (!isAttribEnd(c)) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_U;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              if (c === ">") {
                openTag(parser);
              } else {
                parser.state = S.ATTRIB;
              }
              continue;
            case S.CLOSE_TAG:
              if (!parser.tagName) {
                if (isWhitespace(c)) {
                  continue;
                } else if (notMatch(nameStart, c)) {
                  if (parser.script) {
                    parser.script += "</" + c;
                    parser.state = S.SCRIPT;
                  } else {
                    strictFail(parser, "Invalid tagname in closing tag.");
                  }
                } else {
                  parser.tagName = c;
                }
              } else if (c === ">") {
                closeTag(parser);
              } else if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else if (parser.script) {
                parser.script += "</" + parser.tagName + c;
                parser.tagName = "";
                parser.state = S.SCRIPT;
              } else {
                if (!isWhitespace(c)) {
                  strictFail(parser, "Invalid tagname in closing tag");
                }
                parser.state = S.CLOSE_TAG_SAW_WHITE;
              }
              continue;
            case S.CLOSE_TAG_SAW_WHITE:
              if (isWhitespace(c)) {
                continue;
              }
              if (c === ">") {
                closeTag(parser);
              } else {
                strictFail(parser, "Invalid characters in closing tag");
              }
              continue;
            case S.TEXT_ENTITY:
            case S.ATTRIB_VALUE_ENTITY_Q:
            case S.ATTRIB_VALUE_ENTITY_U:
              var returnState;
              var buffer;
              switch (parser.state) {
                case S.TEXT_ENTITY:
                  returnState = S.TEXT;
                  buffer = "textNode";
                  break;
                case S.ATTRIB_VALUE_ENTITY_Q:
                  returnState = S.ATTRIB_VALUE_QUOTED;
                  buffer = "attribValue";
                  break;
                case S.ATTRIB_VALUE_ENTITY_U:
                  returnState = S.ATTRIB_VALUE_UNQUOTED;
                  buffer = "attribValue";
                  break;
              }
              if (c === ";") {
                var parsedEntity = parseEntity(parser);
                if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
                  if ((parser.entityCount += 1) > parser.opt.maxEntityCount) {
                    error(
                      parser,
                      "Parsed entity count exceeds max entity count"
                    );
                  }
                  if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) {
                    error(
                      parser,
                      "Parsed entity depth exceeds max entity depth"
                    );
                  }
                  parser.entity = "";
                  parser.state = returnState;
                  parser.write(parsedEntity);
                  parser.entityDepth -= 1;
                } else {
                  parser[buffer] += parsedEntity;
                  parser.entity = "";
                  parser.state = returnState;
                }
              } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
                parser.entity += c;
              } else {
                strictFail(parser, "Invalid character in entity name");
                parser[buffer] += "&" + parser.entity + c;
                parser.entity = "";
                parser.state = returnState;
              }
              continue;
            default: {
              throw new Error(parser, "Unknown state: " + parser.state);
            }
          }
        }
        if (parser.position >= parser.bufferCheckPosition) {
          checkBufferLength(parser);
        }
        return parser;
      }
      if (!String.fromCodePoint) {
        ;
        (function() {
          var stringFromCharCode = String.fromCharCode;
          var floor = Math.floor;
          var fromCodePoint = function() {
            var MAX_SIZE = 16384;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
              return "";
            }
            var result = "";
            while (++index < length) {
              var codePoint = Number(arguments[index]);
              if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
              codePoint < 0 || // not a valid Unicode code point
              codePoint > 1114111 || // not a valid Unicode code point
              floor(codePoint) !== codePoint) {
                throw RangeError("Invalid code point: " + codePoint);
              }
              if (codePoint <= 65535) {
                codeUnits.push(codePoint);
              } else {
                codePoint -= 65536;
                highSurrogate = (codePoint >> 10) + 55296;
                lowSurrogate = codePoint % 1024 + 56320;
                codeUnits.push(highSurrogate, lowSurrogate);
              }
              if (index + 1 === length || codeUnits.length > MAX_SIZE) {
                result += stringFromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
              }
            }
            return result;
          };
          if (Object.defineProperty) {
            Object.defineProperty(String, "fromCodePoint", {
              value: fromCodePoint,
              configurable: true,
              writable: true
            });
          } else {
            String.fromCodePoint = fromCodePoint;
          }
        })();
      }
    })(typeof exports2 === "undefined" ? exports2.sax = {} : exports2);
  }
});

// node_modules/builder-util-runtime/out/xml.js
var require_xml = __commonJS({
  "node_modules/builder-util-runtime/out/xml.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.XElement = void 0;
    exports2.parseXml = parseXml;
    var sax = require_sax();
    var error_1 = require_error();
    var XElement = class {
      constructor(name) {
        this.name = name;
        this.value = "";
        this.attributes = null;
        this.isCData = false;
        this.elements = null;
        if (!name) {
          throw (0, error_1.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
        }
        if (!isValidName(name)) {
          throw (0, error_1.newError)(`Invalid element name: ${name}`, "ERR_XML_ELEMENT_INVALID_NAME");
        }
      }
      attribute(name) {
        const result = this.attributes === null ? null : this.attributes[name];
        if (result == null) {
          throw (0, error_1.newError)(`No attribute "${name}"`, "ERR_XML_MISSED_ATTRIBUTE");
        }
        return result;
      }
      removeAttribute(name) {
        if (this.attributes !== null) {
          delete this.attributes[name];
        }
      }
      element(name, ignoreCase = false, errorIfMissed = null) {
        const result = this.elementOrNull(name, ignoreCase);
        if (result === null) {
          throw (0, error_1.newError)(errorIfMissed || `No element "${name}"`, "ERR_XML_MISSED_ELEMENT");
        }
        return result;
      }
      elementOrNull(name, ignoreCase = false) {
        if (this.elements === null) {
          return null;
        }
        for (const element of this.elements) {
          if (isNameEquals(element, name, ignoreCase)) {
            return element;
          }
        }
        return null;
      }
      getElements(name, ignoreCase = false) {
        if (this.elements === null) {
          return [];
        }
        return this.elements.filter((it) => isNameEquals(it, name, ignoreCase));
      }
      elementValueOrEmpty(name, ignoreCase = false) {
        const element = this.elementOrNull(name, ignoreCase);
        return element === null ? "" : element.value;
      }
    };
    exports2.XElement = XElement;
    var NAME_REG_EXP = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
    function isValidName(name) {
      return NAME_REG_EXP.test(name);
    }
    function isNameEquals(element, name, ignoreCase) {
      const elementName = element.name;
      return elementName === name || ignoreCase === true && elementName.length === name.length && elementName.toLowerCase() === name.toLowerCase();
    }
    function parseXml(data) {
      let rootElement = null;
      const parser = sax.parser(true, {});
      const elements = [];
      parser.onopentag = (saxElement) => {
        const element = new XElement(saxElement.name);
        element.attributes = saxElement.attributes;
        if (rootElement === null) {
          rootElement = element;
        } else {
          const parent = elements[elements.length - 1];
          if (parent.elements == null) {
            parent.elements = [];
          }
          parent.elements.push(element);
        }
        elements.push(element);
      };
      parser.onclosetag = () => {
        elements.pop();
      };
      parser.ontext = (text2) => {
        if (elements.length > 0) {
          elements[elements.length - 1].value = text2;
        }
      };
      parser.oncdata = (cdata) => {
        const element = elements[elements.length - 1];
        element.value = cdata;
        element.isCData = true;
      };
      parser.onerror = (err) => {
        throw err;
      };
      parser.write(data);
      return rootElement;
    }
  }
});

// node_modules/builder-util-runtime/out/objects.js
var require_objects = __commonJS({
  "node_modules/builder-util-runtime/out/objects.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mapToObject = mapToObject;
    exports2.isValidKey = isValidKey;
    exports2.asArray = asArray;
    exports2.deepAssign = deepAssign;
    exports2.objectToArgs = objectToArgs;
    function mapToObject(map) {
      const obj = {};
      for (const [key, value] of map) {
        if (!isValidKey(key)) {
          continue;
        }
        if (value instanceof Map) {
          obj[key] = mapToObject(value);
        } else {
          obj[key] = value;
        }
      }
      return obj;
    }
    function isValidKey(key) {
      const protectedProperties = ["__proto__", "prototype", "constructor"];
      if (protectedProperties.includes(key)) {
        return false;
      }
      return ["string", "number", "symbol", "boolean"].includes(typeof key) || key === null;
    }
    function asArray(v) {
      if (v == null) {
        return [];
      } else if (Array.isArray(v)) {
        return v;
      } else {
        return [v];
      }
    }
    function isObject(x) {
      if (Array.isArray(x)) {
        return false;
      }
      const type = typeof x;
      return type === "object" || type === "function";
    }
    function assignKey(target, from, key) {
      const value = from[key];
      if (value === void 0) {
        return;
      }
      const prevValue = target[key];
      if (prevValue == null || value == null || !isObject(prevValue) || !isObject(value)) {
        if (Array.isArray(prevValue) && Array.isArray(value)) {
          target[key] = Array.from(new Set(prevValue.concat(value)));
        } else {
          target[key] = value;
        }
      } else {
        target[key] = assign(prevValue, value);
      }
    }
    function assign(to, from) {
      if (to !== from) {
        for (const key of Object.getOwnPropertyNames(from)) {
          if (isValidKey(key)) {
            assignKey(to, from, key);
          }
        }
      }
      return to;
    }
    function deepAssign(target, ...objects) {
      for (const o of objects) {
        if (o != null) {
          assign(target, o);
        }
      }
      return target;
    }
    var SAFE_FLAG_NAME_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/;
    var UNSAFE_VALUE_RE = /[\0\r\n]/;
    function objectToArgs(obj) {
      const args = Object.entries(obj).reduce((args2, [name, value]) => {
        if (!isValidKey(name) || value == null) {
          return args2;
        }
        if (!SAFE_FLAG_NAME_RE.test(name)) {
          throw new Error(`objectToArgs: unsafe flag name rejected: ${JSON.stringify(name)}`);
        }
        if (UNSAFE_VALUE_RE.test(value)) {
          throw new Error(`objectToArgs: value for --${name} contains a null byte or newline`);
        }
        return args2.concat([`--${name}`, value]);
      }, []);
      return Object.freeze(args);
    }
  }
});

// node_modules/builder-util-runtime/out/index.js
var require_out = __commonJS({
  "node_modules/builder-util-runtime/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CURRENT_APP_PACKAGE_FILE_NAME = exports2.CURRENT_APP_INSTALLER_FILE_NAME = exports2.objectToArgs = exports2.deepAssign = exports2.asArray = exports2.mapToObject = exports2.isValidKey = exports2.XElement = exports2.parseXml = exports2.UUID = exports2.parseDn = exports2.retry = exports2.githubTagPrefix = exports2.githubUrl = exports2.getS3LikeProviderBaseUrl = exports2.ProgressCallbackTransform = exports2.MemoLazy = exports2.safeStringifyJson = exports2.safeGetHeader = exports2.parseJson = exports2.isSensitiveFieldName = exports2.HttpExecutor = exports2.hashSensitiveValue = exports2.HttpError = exports2.DigestTransform = exports2.createHttpError = exports2.configureRequestUrl = exports2.configureRequestOptionsFromUrl = exports2.configureRequestOptions = exports2.newError = exports2.CancellationToken = exports2.CancellationError = void 0;
    var CancellationToken_1 = require_CancellationToken();
    Object.defineProperty(exports2, "CancellationError", { enumerable: true, get: function() {
      return CancellationToken_1.CancellationError;
    } });
    Object.defineProperty(exports2, "CancellationToken", { enumerable: true, get: function() {
      return CancellationToken_1.CancellationToken;
    } });
    var error_1 = require_error();
    Object.defineProperty(exports2, "newError", { enumerable: true, get: function() {
      return error_1.newError;
    } });
    var httpExecutor_1 = require_httpExecutor();
    Object.defineProperty(exports2, "configureRequestOptions", { enumerable: true, get: function() {
      return httpExecutor_1.configureRequestOptions;
    } });
    Object.defineProperty(exports2, "configureRequestOptionsFromUrl", { enumerable: true, get: function() {
      return httpExecutor_1.configureRequestOptionsFromUrl;
    } });
    Object.defineProperty(exports2, "configureRequestUrl", { enumerable: true, get: function() {
      return httpExecutor_1.configureRequestUrl;
    } });
    Object.defineProperty(exports2, "createHttpError", { enumerable: true, get: function() {
      return httpExecutor_1.createHttpError;
    } });
    Object.defineProperty(exports2, "DigestTransform", { enumerable: true, get: function() {
      return httpExecutor_1.DigestTransform;
    } });
    Object.defineProperty(exports2, "HttpError", { enumerable: true, get: function() {
      return httpExecutor_1.HttpError;
    } });
    Object.defineProperty(exports2, "hashSensitiveValue", { enumerable: true, get: function() {
      return httpExecutor_1.hashSensitiveValue;
    } });
    Object.defineProperty(exports2, "HttpExecutor", { enumerable: true, get: function() {
      return httpExecutor_1.HttpExecutor;
    } });
    Object.defineProperty(exports2, "isSensitiveFieldName", { enumerable: true, get: function() {
      return httpExecutor_1.isSensitiveFieldName;
    } });
    Object.defineProperty(exports2, "parseJson", { enumerable: true, get: function() {
      return httpExecutor_1.parseJson;
    } });
    Object.defineProperty(exports2, "safeGetHeader", { enumerable: true, get: function() {
      return httpExecutor_1.safeGetHeader;
    } });
    Object.defineProperty(exports2, "safeStringifyJson", { enumerable: true, get: function() {
      return httpExecutor_1.safeStringifyJson;
    } });
    var MemoLazy_1 = require_MemoLazy();
    Object.defineProperty(exports2, "MemoLazy", { enumerable: true, get: function() {
      return MemoLazy_1.MemoLazy;
    } });
    var ProgressCallbackTransform_1 = require_ProgressCallbackTransform();
    Object.defineProperty(exports2, "ProgressCallbackTransform", { enumerable: true, get: function() {
      return ProgressCallbackTransform_1.ProgressCallbackTransform;
    } });
    var publishOptions_1 = require_publishOptions();
    Object.defineProperty(exports2, "getS3LikeProviderBaseUrl", { enumerable: true, get: function() {
      return publishOptions_1.getS3LikeProviderBaseUrl;
    } });
    Object.defineProperty(exports2, "githubUrl", { enumerable: true, get: function() {
      return publishOptions_1.githubUrl;
    } });
    Object.defineProperty(exports2, "githubTagPrefix", { enumerable: true, get: function() {
      return publishOptions_1.githubTagPrefix;
    } });
    var retry_1 = require_retry();
    Object.defineProperty(exports2, "retry", { enumerable: true, get: function() {
      return retry_1.retry;
    } });
    var rfc2253Parser_1 = require_rfc2253Parser();
    Object.defineProperty(exports2, "parseDn", { enumerable: true, get: function() {
      return rfc2253Parser_1.parseDn;
    } });
    var uuid_1 = require_uuid();
    Object.defineProperty(exports2, "UUID", { enumerable: true, get: function() {
      return uuid_1.UUID;
    } });
    var xml_1 = require_xml();
    Object.defineProperty(exports2, "parseXml", { enumerable: true, get: function() {
      return xml_1.parseXml;
    } });
    Object.defineProperty(exports2, "XElement", { enumerable: true, get: function() {
      return xml_1.XElement;
    } });
    var objects_1 = require_objects();
    Object.defineProperty(exports2, "isValidKey", { enumerable: true, get: function() {
      return objects_1.isValidKey;
    } });
    Object.defineProperty(exports2, "mapToObject", { enumerable: true, get: function() {
      return objects_1.mapToObject;
    } });
    Object.defineProperty(exports2, "asArray", { enumerable: true, get: function() {
      return objects_1.asArray;
    } });
    Object.defineProperty(exports2, "deepAssign", { enumerable: true, get: function() {
      return objects_1.deepAssign;
    } });
    Object.defineProperty(exports2, "objectToArgs", { enumerable: true, get: function() {
      return objects_1.objectToArgs;
    } });
    exports2.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe";
    exports2.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  }
});

// node_modules/js-yaml/lib/common.js
var require_common2 = __commonJS({
  "node_modules/js-yaml/lib/common.js"(exports2, module2) {
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence)) return sequence;
      else if (isNothing(sequence)) return [];
      return [sequence];
    }
    function extend(target, source) {
      if (source) {
        const sourceKeys = Object.keys(source);
        for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
          const key = sourceKeys[index];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count2) {
      let result = "";
      for (let cycle = 0; cycle < count2; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module2.exports.isNothing = isNothing;
    module2.exports.isObject = isObject;
    module2.exports.toArray = toArray;
    module2.exports.repeat = repeat;
    module2.exports.isNegativeZero = isNegativeZero;
    module2.exports.extend = extend;
  }
});

// node_modules/js-yaml/lib/exception.js
var require_exception = __commonJS({
  "node_modules/js-yaml/lib/exception.js"(exports2, module2) {
    "use strict";
    function formatError(exception, compact) {
      let where = "";
      const message = exception.reason || "(unknown reason)";
      if (!exception.mark) return message;
      if (exception.mark.name) {
        where += 'in "' + exception.mark.name + '" ';
      }
      where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
      if (!compact && exception.mark.snippet) {
        where += "\n\n" + exception.mark.snippet;
      }
      return message + " " + where;
    }
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = formatError(this, false);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      return this.name + ": " + formatError(this, compact);
    };
    module2.exports = YAMLException;
  }
});

// node_modules/js-yaml/lib/snippet.js
var require_snippet = __commonJS({
  "node_modules/js-yaml/lib/snippet.js"(exports2, module2) {
    "use strict";
    var common = require_common2();
    function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
      let head = "";
      let tail = "";
      const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
      if (position - lineStart > maxHalfLength) {
        head = " ... ";
        lineStart = position - maxHalfLength + head.length;
      }
      if (lineEnd - position > maxHalfLength) {
        tail = " ...";
        lineEnd = position + maxHalfLength - tail.length;
      }
      return {
        str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
        pos: position - lineStart + head.length
        // relative position
      };
    }
    function padStart(string, max) {
      return common.repeat(" ", max - string.length) + string;
    }
    function makeSnippet(mark, options) {
      options = Object.create(options || null);
      if (!mark.buffer) return null;
      if (!options.maxLength) options.maxLength = 79;
      if (typeof options.indent !== "number") options.indent = 1;
      if (typeof options.linesBefore !== "number") options.linesBefore = 3;
      if (typeof options.linesAfter !== "number") options.linesAfter = 2;
      const re = /\r?\n|\r|\0/g;
      const lineStarts = [0];
      const lineEnds = [];
      let match;
      let foundLineNo = -1;
      while (match = re.exec(mark.buffer)) {
        lineEnds.push(match.index);
        lineStarts.push(match.index + match[0].length);
        if (mark.position <= match.index && foundLineNo < 0) {
          foundLineNo = lineStarts.length - 2;
        }
      }
      if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
      let result = "";
      const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
      const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
      for (let i = 1; i <= options.linesBefore; i++) {
        if (foundLineNo - i < 0) break;
        const line2 = getLine(
          mark.buffer,
          lineStarts[foundLineNo - i],
          lineEnds[foundLineNo - i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
          maxLineLength
        );
        result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
      }
      const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
      result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
      result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
      for (let i = 1; i <= options.linesAfter; i++) {
        if (foundLineNo + i >= lineEnds.length) break;
        const line2 = getLine(
          mark.buffer,
          lineStarts[foundLineNo + i],
          lineEnds[foundLineNo + i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
          maxLineLength
        );
        result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
      }
      return result.replace(/\n$/, "");
    }
    module2.exports = makeSnippet;
  }
});

// node_modules/js-yaml/lib/type.js
var require_type = __commonJS({
  "node_modules/js-yaml/lib/type.js"(exports2, module2) {
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "multi",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "representName",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      const result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options) {
      options = options || {};
      Object.keys(options).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.options = options;
      this.tag = tag;
      this.kind = options["kind"] || null;
      this.resolve = options["resolve"] || function() {
        return true;
      };
      this.construct = options["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options["instanceOf"] || null;
      this.predicate = options["predicate"] || null;
      this.represent = options["represent"] || null;
      this.representName = options["representName"] || null;
      this.defaultStyle = options["defaultStyle"] || null;
      this.multi = options["multi"] || false;
      this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module2.exports = Type;
  }
});

// node_modules/js-yaml/lib/schema.js
var require_schema = __commonJS({
  "node_modules/js-yaml/lib/schema.js"(exports2, module2) {
    "use strict";
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name) {
      const result = [];
      schema[name].forEach(function(currentType) {
        let newIndex = result.length;
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
            newIndex = previousIndex;
          }
        });
        result[newIndex] = currentType;
      });
      return result;
    }
    function compileMap() {
      const result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      };
      function collectType(type) {
        if (type.multi) {
          result.multi[type.kind].push(type);
          result.multi["fallback"].push(type);
        } else {
          result[type.kind][type.tag] = result["fallback"][type.tag] = type;
        }
      }
      for (let index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      return this.extend(definition);
    }
    Schema.prototype.extend = function extend(definition) {
      let implicit = [];
      let explicit = [];
      if (definition instanceof Type) {
        explicit.push(definition);
      } else if (Array.isArray(definition)) {
        explicit = explicit.concat(definition);
      } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
        if (definition.implicit) implicit = implicit.concat(definition.implicit);
        if (definition.explicit) explicit = explicit.concat(definition.explicit);
      } else {
        throw new YAMLException("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
      }
      implicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
        if (type.multi) {
          throw new YAMLException("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
        }
      });
      explicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
      });
      const result = Object.create(Schema.prototype);
      result.implicit = (this.implicit || []).concat(implicit);
      result.explicit = (this.explicit || []).concat(explicit);
      result.compiledImplicit = compileList(result, "implicit");
      result.compiledExplicit = compileList(result, "explicit");
      result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
      return result;
    };
    module2.exports = Schema;
  }
});

// node_modules/js-yaml/lib/type/str.js
var require_str = __commonJS({
  "node_modules/js-yaml/lib/type/str.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// node_modules/js-yaml/lib/type/seq.js
var require_seq = __commonJS({
  "node_modules/js-yaml/lib/type/seq.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// node_modules/js-yaml/lib/type/map.js
var require_map = __commonJS({
  "node_modules/js-yaml/lib/type/map.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// node_modules/js-yaml/lib/schema/failsafe.js
var require_failsafe = __commonJS({
  "node_modules/js-yaml/lib/schema/failsafe.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// node_modules/js-yaml/lib/type/null.js
var require_null = __commonJS({
  "node_modules/js-yaml/lib/type/null.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null) return true;
      const max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        },
        empty: function() {
          return "";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/type/bool.js
var require_bool = __commonJS({
  "node_modules/js-yaml/lib/type/bool.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null) return false;
      const max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module2.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/type/int.js
var require_int = __commonJS({
  "node_modules/js-yaml/lib/type/int.js"(exports2, module2) {
    "use strict";
    var common = require_common2();
    var Type = require_type();
    function isHexCode(c) {
      return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
    }
    function isOctCode(c) {
      return c >= 48 && c <= 55;
    }
    function isDecCode(c) {
      return c >= 48 && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null) return false;
      const max = data.length;
      let index = 0;
      let hasDigits = false;
      if (!max) return false;
      let ch = data[index];
      if (ch === "-" || ch === "+") {
        ch = data[++index];
      }
      if (ch === "0") {
        if (index + 1 === max) return true;
        ch = data[++index];
        if (ch === "b") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch !== "0" && ch !== "1") return false;
            hasDigits = true;
          }
          return hasDigits && isFinite(parseYamlInteger(data));
        }
        if (ch === "x") {
          index++;
          for (; index < max; index++) {
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && isFinite(parseYamlInteger(data));
        }
        if (ch === "o") {
          index++;
          for (; index < max; index++) {
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && isFinite(parseYamlInteger(data));
        }
      }
      for (; index < max; index++) {
        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits) return false;
      return isFinite(parseYamlInteger(data));
    }
    function parseYamlInteger(data) {
      let value = data;
      let sign = 1;
      let ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0") return 0;
      if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
        if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
      }
      return sign * parseInt(value, 10);
    }
    function constructYamlInteger(data) {
      return parseYamlInteger(data);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// node_modules/js-yaml/lib/type/float.js
var require_float = __commonJS({
  "node_modules/js-yaml/lib/type/float.js"(exports2, module2) {
    "use strict";
    var common = require_common2();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    var YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
      "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    function resolveYamlFloat(data) {
      if (data === null) return false;
      if (!YAML_FLOAT_PATTERN.test(data)) {
        return false;
      }
      if (isFinite(parseFloat(data, 10))) {
        return true;
      }
      return YAML_FLOAT_SPECIAL_PATTERN.test(data);
    }
    function constructYamlFloat(data) {
      let value = data.toLowerCase();
      const sign = value[0] === "-" ? -1 : 1;
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common.isNegativeZero(object)) {
        return "-0.0";
      }
      const res = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/schema/json.js
var require_json2 = __commonJS({
  "node_modules/js-yaml/lib/schema/json.js"(exports2, module2) {
    "use strict";
    module2.exports = require_failsafe().extend({
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// node_modules/js-yaml/lib/schema/core.js
var require_core = __commonJS({
  "node_modules/js-yaml/lib/schema/core.js"(exports2, module2) {
    "use strict";
    module2.exports = require_json2();
  }
});

// node_modules/js-yaml/lib/type/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/js-yaml/lib/type/timestamp.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
    );
    var YAML_TIMESTAMP_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
    );
    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      let fraction = 0;
      let delta = null;
      let match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null) throw new Error("Date resolve error");
      const year = +match[1];
      const month = +match[2] - 1;
      const day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      const hour = +match[4];
      const minute = +match[5];
      const second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        const tzHour = +match[10];
        const tzMinute = +(match[11] || 0);
        delta = (tzHour * 60 + tzMinute) * 6e4;
        if (match[9] === "-") delta = -delta;
      }
      const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta) date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module2.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// node_modules/js-yaml/lib/type/merge.js
var require_merge = __commonJS({
  "node_modules/js-yaml/lib/type/merge.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// node_modules/js-yaml/lib/type/binary.js
var require_binary = __commonJS({
  "node_modules/js-yaml/lib/type/binary.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null) return false;
      let bitlen = 0;
      const max = data.length;
      const map = BASE64_MAP;
      for (let idx = 0; idx < max; idx++) {
        const code = map.indexOf(data.charAt(idx));
        if (code > 64) continue;
        if (code < 0) return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      const input = data.replace(/[\r\n=]/g, "");
      const max = input.length;
      const map = BASE64_MAP;
      let bits = 0;
      const result = [];
      for (let idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      const tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      return new Uint8Array(result);
    }
    function representYamlBinary(object) {
      let result = "";
      let bits = 0;
      const max = object.length;
      const map = BASE64_MAP;
      for (let idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      const tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(obj) {
      return Object.prototype.toString.call(obj) === "[object Uint8Array]";
    }
    module2.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// node_modules/js-yaml/lib/type/omap.js
var require_omap = __commonJS({
  "node_modules/js-yaml/lib/type/omap.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null) return true;
      const objectKeys = {};
      const object = data;
      for (let index = 0, length = object.length; index < length; index += 1) {
        const pair = object[index];
        let pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]") return false;
        let pairKey;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
          }
        }
        if (!pairHasKey) return false;
        if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
        Object.defineProperty(objectKeys, pairKey, { value: true });
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module2.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// node_modules/js-yaml/lib/type/pairs.js
var require_pairs = __commonJS({
  "node_modules/js-yaml/lib/type/pairs.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null) return true;
      const object = data;
      const result = new Array(object.length);
      for (let index = 0, length = object.length; index < length; index += 1) {
        const pair = object[index];
        if (_toString.call(pair) !== "[object Object]") return false;
        const keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null) return [];
      const object = data;
      const result = new Array(object.length);
      for (let index = 0, length = object.length; index < length; index += 1) {
        const pair = object[index];
        const keys = Object.keys(pair);
        result[index] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module2.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// node_modules/js-yaml/lib/type/set.js
var require_set = __commonJS({
  "node_modules/js-yaml/lib/type/set.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null) return true;
      const object = data;
      for (const key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module2.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// node_modules/js-yaml/lib/schema/default.js
var require_default = __commonJS({
  "node_modules/js-yaml/lib/schema/default.js"(exports2, module2) {
    "use strict";
    module2.exports = require_core().extend({
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// node_modules/js-yaml/lib/loader.js
var require_loader = __commonJS({
  "node_modules/js-yaml/lib/loader.js"(exports2, module2) {
    "use strict";
    var common = require_common2();
    var YAMLException = require_exception();
    var makeSnippet = require_snippet();
    var DEFAULT_SCHEMA = require_default();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function isEol(c) {
      return c === 10 || c === 13;
    }
    function isWhiteSpace(c) {
      return c === 9 || c === 32;
    }
    function isWsOrEol(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function isFlowIndicator(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      if (c >= 48 && c <= 57) {
        return c - 48;
      }
      const lc = c | 32;
      if (lc >= 97 && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (c >= 48 && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      switch (c) {
        case 48:
          return "\0";
        case 97:
          return "\x07";
        case 98:
          return "\b";
        case 116:
          return "	";
        case 9:
          return "	";
        case 110:
          return "\n";
        case 118:
          return "\v";
        case 102:
          return "\f";
        case 114:
          return "\r";
        case 101:
          return "\x1B";
        case 32:
          return " ";
        case 34:
          return '"';
        case 47:
          return "/";
        case 92:
          return "\\";
        case 78:
          return "\x85";
        case 95:
          return "\xA0";
        case 76:
          return "\u2028";
        case 80:
          return "\u2029";
        default:
          return "";
      }
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode(
        (c - 65536 >> 10) + 55296,
        (c - 65536 & 1023) + 56320
      );
    }
    function setProperty(object, key, value) {
      if (key === "__proto__") {
        Object.defineProperty(object, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value
        });
      } else {
        object[key] = value;
      }
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (let i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    function State(input, options) {
      this.input = input;
      this.filename = options["filename"] || null;
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.onWarning = options["onWarning"] || null;
      this.legacy = options["legacy"] || false;
      this.json = options["json"] || false;
      this.listener = options["listener"] || null;
      this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
      this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.depth = 0;
      this.totalMergeKeys = 0;
      this.firstTabInLine = -1;
      this.documents = [];
      this.anchorMapTransactions = [];
    }
    function generateError(state, message) {
      const mark = {
        name: state.filename,
        buffer: state.input.slice(0, -1),
        // omit trailing \0
        position: state.position,
        line: state.line,
        column: state.position - state.lineStart
      };
      mark.snippet = makeSnippet(mark);
      return new YAMLException(message, mark);
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    function storeAnchor(state, name, value) {
      const transactions = state.anchorMapTransactions;
      if (transactions.length !== 0) {
        const transaction = transactions[transactions.length - 1];
        if (!_hasOwnProperty.call(transaction, name)) {
          transaction[name] = {
            existed: _hasOwnProperty.call(state.anchorMap, name),
            value: state.anchorMap[name]
          };
        }
      }
      state.anchorMap[name] = value;
    }
    function beginAnchorTransaction(state) {
      state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
    }
    function commitAnchorTransaction(state) {
      const transaction = state.anchorMapTransactions.pop();
      const transactions = state.anchorMapTransactions;
      if (transactions.length === 0) return;
      const parent = transactions[transactions.length - 1];
      const names = Object.keys(transaction);
      for (let index = 0, length = names.length; index < length; index += 1) {
        const name = names[index];
        if (!_hasOwnProperty.call(parent, name)) {
          parent[name] = transaction[name];
        }
      }
    }
    function rollbackAnchorTransaction(state) {
      const transaction = state.anchorMapTransactions.pop();
      const names = Object.keys(transaction);
      for (let index = names.length - 1; index >= 0; index -= 1) {
        const entry = transaction[names[index]];
        if (entry.existed) {
          state.anchorMap[names[index]] = entry.value;
        } else {
          delete state.anchorMap[names[index]];
        }
      }
    }
    function snapshotState(state) {
      return {
        position: state.position,
        line: state.line,
        lineStart: state.lineStart,
        lineIndent: state.lineIndent,
        firstTabInLine: state.firstTabInLine,
        tag: state.tag,
        anchor: state.anchor,
        kind: state.kind,
        result: state.result
      };
    }
    function restoreState(state, snapshot) {
      state.position = snapshot.position;
      state.line = snapshot.line;
      state.lineStart = snapshot.lineStart;
      state.lineIndent = snapshot.lineIndent;
      state.firstTabInLine = snapshot.firstTabInLine;
      state.tag = snapshot.tag;
      state.anchor = snapshot.anchor;
      state.kind = snapshot.kind;
      state.result = snapshot.result;
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        let prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        const handle2 = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle2)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle2)) {
          throwError(state, 'there is a previously declared suffix for "' + handle2 + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        try {
          prefix = decodeURIComponent(prefix);
        } catch (err) {
          throwError(state, "tag prefix is malformed: " + prefix);
        }
        state.tagMap[handle2] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      if (start < end) {
        const _result = state.input.slice(start, end);
        if (checkJson) {
          for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
            const _character = _result.charCodeAt(_position);
            if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function chargeMergeWork(state) {
      state.totalMergeKeys++;
      if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
        throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      if (!common.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      chargeMergeWork(state);
      const sourceKeys = Object.keys(source);
      for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        const key = sourceKeys[index];
        chargeMergeWork(state);
        if (!_hasOwnProperty.call(destination, key)) {
          setProperty(destination, key, source[key]);
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
            keyNode[index] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          if (valueNode.length > 100) {
            throwError(state, "abnormal merge sequence size");
          }
          for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.lineStart = startLineStart || state.lineStart;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        setProperty(_result, keyNode, valueNode);
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      const ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
      state.firstTabInLine = -1;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      let lineBreaks = 0;
      let ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          if (ch === 9 && state.firstTabInLine === -1) {
            state.firstTabInLine = state.position;
          }
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (isEol(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      let _position = state.position;
      let ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || isWsOrEol(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count2) {
      if (count2 === 1) {
        state.result += " ";
      } else if (count2 > 1) {
        state.result += common.repeat("\n", count2 - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      let captureStart;
      let captureEnd;
      let hasPendingContent;
      let _line;
      let _lineStart;
      let _lineIndent;
      const _kind = state.kind;
      const _result = state.result;
      let ch = state.input.charCodeAt(state.position);
      if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          const following = state.input.charCodeAt(state.position + 1);
          if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
            break;
          }
        } else if (ch === 35) {
          const preceding = state.input.charCodeAt(state.position - 1);
          if (isWsOrEol(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
          break;
        } else if (isEol(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      let captureStart;
      let captureEnd;
      let ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (isEol(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          if (!isWhiteSpace(ch)) {
            captureEnd = state.position;
          }
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      let captureStart;
      let captureEnd;
      let tmp;
      let ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (isEol(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            let hexLength = tmp;
            let hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (isEol(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          if (!isWhiteSpace(ch)) {
            captureEnd = state.position;
          }
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      let readNext = true;
      let _line;
      let _lineStart;
      let _pos;
      const _tag = state.tag;
      let _result;
      const _anchor = state.anchor;
      let terminator;
      let isPair;
      let isExplicitPair;
      let isMapping;
      const overridableKeys = /* @__PURE__ */ Object.create(null);
      let keyNode;
      let keyTag;
      let valueNode;
      let ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, _result);
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        } else if (ch === 44) {
          throwError(state, "expected the node content, but found ','");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          const following = state.input.charCodeAt(state.position + 1);
          if (isWsOrEol(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        _lineStart = state.lineStart;
        _pos = state.position;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      let folding;
      let chomping = CHOMPING_CLIP;
      let didReadContent = false;
      let detectedIndent = false;
      let textIndent = nodeIndent;
      let emptyLines = 0;
      let atMoreIndented = false;
      let tmp;
      let ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (isWhiteSpace(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (isWhiteSpace(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!isEol(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (isEol(ch)) {
          emptyLines++;
          continue;
        }
        if (!detectedIndent && textIndent === 0) {
          throwError(state, "missing indentation for block scalar");
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (isWhiteSpace(ch)) {
            atMoreIndented = true;
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common.repeat("\n", emptyLines);
          }
        } else {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        const captureStart = state.position;
        while (!isEol(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      const _tag = state.tag;
      const _anchor = state.anchor;
      const _result = [];
      let detected = false;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, _result);
      }
      let ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        if (ch !== 45) {
          break;
        }
        const following = state.input.charCodeAt(state.position + 1);
        if (!isWsOrEol(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        const _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      let allowCompact;
      let _keyLine;
      let _keyLineStart;
      let _keyPos;
      const _tag = state.tag;
      const _anchor = state.anchor;
      const _result = {};
      const overridableKeys = /* @__PURE__ */ Object.create(null);
      let keyTag = null;
      let keyNode = null;
      let valueNode = null;
      let atExplicitKey = false;
      let detected = false;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, _result);
      }
      let ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (!atExplicitKey && state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        const following = state.input.charCodeAt(state.position + 1);
        const _line = state.line;
        if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
          if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
            break;
          }
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (isWhiteSpace(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!isWsOrEol(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (atExplicitKey) {
            _keyLine = state.line;
            _keyLineStart = state.lineStart;
            _keyPos = state.position;
          }
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      let isVerbatim = false;
      let isNamed = false;
      let tagHandle;
      let tagName;
      let ch = state.input.charCodeAt(state.position);
      if (ch !== 33) return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      let _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !isWsOrEol(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      try {
        tagName = decodeURIComponent(tagName);
      } catch (err) {
        throwError(state, "tag name is malformed: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      let ch = state.input.charCodeAt(state.position);
      if (ch !== 38) return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      const _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      let ch = state.input.charCodeAt(state.position);
      if (ch !== 42) return false;
      ch = state.input.charCodeAt(++state.position);
      const _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      const alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
      const fallbackState = snapshotState(state);
      beginAnchorTransaction(state);
      restoreState(state, propertyStart);
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
        commitAnchorTransaction(state);
        return true;
      }
      rollbackAnchorTransaction(state);
      restoreState(state, fallbackState);
      return false;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      let allowBlockScalars;
      let allowBlockCollections;
      let indentStatus = 1;
      let atNewLine = false;
      let hasContent = false;
      let propertyStart = null;
      let type;
      let flowIndent;
      let blockIndent;
      if (state.depth >= state.maxDepth) {
        throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
      }
      state.depth += 1;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (true) {
          const ch = state.input.charCodeAt(state.position);
          const propertyState = snapshotState(state);
          if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
            break;
          }
          if (!readTagProperty(state) && !readAnchorProperty(state)) {
            break;
          }
          if (propertyStart === null) {
            propertyStart = propertyState;
          }
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            const ch = state.input.charCodeAt(state.position);
            if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(
              state,
              propertyStart,
              propertyStart.position - propertyStart.lineStart,
              flowIndent
            )) {
              hasContent = true;
            } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              storeAnchor(state, state.anchor, state.result);
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag === null) {
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      } else if (state.tag === "?") {
        if (state.result !== null && state.kind !== "scalar") {
          throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
        }
        for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];
          if (type.resolve(state.result)) {
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              storeAnchor(state, state.anchor, state.result);
            }
            break;
          }
        }
      } else if (state.tag !== "!") {
        if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
        } else {
          type = null;
          const typeList = state.typeMap.multi[state.kind || "fallback"];
          for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
            if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
              type = typeList[typeIndex];
              break;
            }
          }
        }
        if (!type) {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }
        if (!type.resolve(state.result, state.tag)) {
          throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
        } else {
          state.result = type.construct(state.result, state.tag);
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      state.depth -= 1;
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      const documentStart = state.position;
      let hasDirectives = false;
      let ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = /* @__PURE__ */ Object.create(null);
      state.anchorMap = /* @__PURE__ */ Object.create(null);
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        let _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        const directiveName = state.input.slice(_position, state.position);
        const directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !isEol(ch));
            break;
          }
          if (isEol(ch)) break;
          _position = state.position;
          while (ch !== 0 && !isWsOrEol(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0) readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      }
    }
    function loadDocuments(input, options) {
      input = String(input);
      options = options || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      const state = new State(input, options);
      const nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options) {
      if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
        options = iterator;
        iterator = null;
      }
      const documents = loadDocuments(input, options);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (let index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }
    function load(input, options) {
      const documents = loadDocuments(input, options);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    module2.exports.loadAll = loadAll;
    module2.exports.load = load;
  }
});

// node_modules/js-yaml/lib/dumper.js
var require_dumper = __commonJS({
  "node_modules/js-yaml/lib/dumper.js"(exports2, module2) {
    "use strict";
    var common = require_common2();
    var YAMLException = require_exception();
    var DEFAULT_SCHEMA = require_default();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_BOM = 65279;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
    function compileStyleMap(schema, map) {
      if (map === null) return {};
      const result = {};
      const keys = Object.keys(map);
      for (let index = 0, length = keys.length; index < length; index += 1) {
        let tag = keys[index];
        let style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        const type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      let handle2;
      let length;
      const string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle2 = "x";
        length = 2;
      } else if (character <= 65535) {
        handle2 = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle2 = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle2 + common.repeat("0", length - string.length) + string;
    }
    var QUOTING_TYPE_SINGLE = 1;
    var QUOTING_TYPE_DOUBLE = 2;
    function State(options) {
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.indent = Math.max(1, options["indent"] || 2);
      this.noArrayIndent = options["noArrayIndent"] || false;
      this.skipInvalid = options["skipInvalid"] || false;
      this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
      this.sortKeys = options["sortKeys"] || false;
      this.lineWidth = options["lineWidth"] || 80;
      this.noRefs = options["noRefs"] || false;
      this.noCompatMode = options["noCompatMode"] || false;
      this.condenseFlow = options["condenseFlow"] || false;
      this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
      this.forceQuotes = options["forceQuotes"] || false;
      this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      const ind = common.repeat(" ", spaces);
      let position = 0;
      let result = "";
      const length = string.length;
      while (position < length) {
        let line;
        const next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str) {
      for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        const type = state.implicitTypes[index];
        if (type.resolve(str)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
    }
    function isNsCharOrWhitespace(c) {
      return isPrintable(c) && c !== CHAR_BOM && // - b-char
      c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev, inblock) {
      const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
      const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
      return (
        // ns-plain-safe
        (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && // - c-flow-indicator
        c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && // ns-plain-char
        c !== CHAR_SHARP && // false on '#'
        !(prev === CHAR_COLON && !cIsNsChar) || // false on ': '
        isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || // change to true on '[^ ]#'
        prev === CHAR_COLON && cIsNsChar
      );
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && // - s-white
      // - (c-indicator ::=
      // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
      c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
      c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
      c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function isPlainSafeLast(c) {
      return !isWhitespace(c) && c !== CHAR_COLON;
    }
    function codePointAt(string, pos) {
      const first = string.charCodeAt(pos);
      let second;
      if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
        second = string.charCodeAt(pos + 1);
        if (second >= 56320 && second <= 57343) {
          return (first - 55296) * 1024 + second - 56320 + 65536;
        }
      }
      return first;
    }
    function needIndentIndicator(string) {
      const leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
      let i;
      let char = 0;
      let prevChar = null;
      let hasLineBreak = false;
      let hasFoldableLine = false;
      const shouldTrackWidth = lineWidth !== -1;
      let previousLineBreak = -1;
      let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
      if (singleLineOnly || forceQuotes) {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
      } else {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
              i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        if (plain && !forceQuotes && !testAmbiguousType(string)) {
          return STYLE_PLAIN;
        }
        return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      if (!forceQuotes) {
        return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    function writeScalar(state, string, level, iskey, inblock) {
      state.dump = (function() {
        if (string.length === 0) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
        }
        if (!state.noCompatMode) {
          if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
            return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
          }
        }
        const indent = state.indent * Math.max(1, level);
        const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        const singleLineOnly = iskey || // No block styles in flow mode.
        state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(
          string,
          singleLineOnly,
          state.indent,
          lineWidth,
          testAmbiguity,
          state.quotingType,
          state.forceQuotes && !iskey,
          inblock
        )) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      })();
    }
    function blockHeader(string, indentPerLevel) {
      const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      const clip = string[string.length - 1] === "\n";
      const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      const chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      const lineRe = /(\n+)([^\n]*)/g;
      let result = (function() {
        let nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      })();
      let prevMoreIndented = string[0] === "\n" || string[0] === " ";
      let moreIndented;
      let match;
      while (match = lineRe.exec(string)) {
        const prefix = match[1];
        const line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ") return line;
      const breakRe = / [^ ]/g;
      let match;
      let start = 0;
      let end;
      let curr = 0;
      let next = 0;
      let result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      let result = "";
      let char = 0;
      for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        const escapeSeq = ESCAPE_SEQUENCES[char];
        if (!escapeSeq && isPrintable(char)) {
          result += string[i];
          if (char >= 65536) result += string[i + 1];
        } else {
          result += escapeSeq || encodeHex(char);
        }
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      let _result = "";
      const _tag = state.tag;
      for (let index = 0, length = object.length; index < length; index += 1) {
        let value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
          if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      let _result = "";
      const _tag = state.tag;
      for (let index = 0, length = object.length; index < length; index += 1) {
        let value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
          if (!compact || _result !== "") {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      let _result = "";
      const _tag = state.tag;
      const objectKeyList = Object.keys(object);
      for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
        let pairBuffer = "";
        if (_result !== "") pairBuffer += ", ";
        if (state.condenseFlow) pairBuffer += '"';
        const objectKey = objectKeyList[index];
        let objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      let _result = "";
      const _tag = state.tag;
      const objectKeyList = Object.keys(object);
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
        let pairBuffer = "";
        if (!compact || _result !== "") {
          pairBuffer += generateNextLine(state, level);
        }
        const objectKey = objectKeyList[index];
        let objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      const typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (let index = 0, length = typeList.length; index < length; index += 1) {
        const type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          if (explicit) {
            if (type.multi && type.representName) {
              state.tag = type.representName(object);
            } else {
              state.tag = type.tag;
            }
          } else {
            state.tag = "?";
          }
          if (type.represent) {
            const style = state.styleMap[type.tag] || type.defaultStyle;
            let _result;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey, isblockseq) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      const type = _toString.call(state.dump);
      const inblock = block;
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      const objectOrArray = type === "[object Object]" || type === "[object Array]";
      let duplicateIndex;
      let duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          if (block && state.dump.length !== 0) {
            if (state.noArrayIndent && !isblockseq && level > 0) {
              writeBlockSequence(state, level - 1, state.dump, compact);
            } else {
              writeBlockSequence(state, level, state.dump, compact);
            }
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey, inblock);
          }
        } else if (type === "[object Undefined]") {
          return false;
        } else {
          if (state.skipInvalid) return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          let tagStr = encodeURI(
            state.tag[0] === "!" ? state.tag.slice(1) : state.tag
          ).replace(/!/g, "%21");
          if (state.tag[0] === "!") {
            tagStr = "!" + tagStr;
          } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
            tagStr = "!!" + tagStr.slice(18);
          } else {
            tagStr = "!<" + tagStr + ">";
          }
          state.dump = tagStr + " " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      const objects = [];
      const duplicatesIndexes = [];
      inspectNode(object, objects, duplicatesIndexes);
      const length = duplicatesIndexes.length;
      for (let index = 0; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      if (object !== null && typeof object === "object") {
        const index = objects.indexOf(object);
        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (let i = 0, length = object.length; i < length; i += 1) {
              inspectNode(object[i], objects, duplicatesIndexes);
            }
          } else {
            const objectKeyList = Object.keys(object);
            for (let i = 0, length = objectKeyList.length; i < length; i += 1) {
              inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options) {
      options = options || {};
      const state = new State(options);
      if (!state.noRefs) getDuplicateReferences(input, state);
      let value = input;
      if (state.replacer) {
        value = state.replacer.call({ "": value }, "", value);
      }
      if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
      return "";
    }
    module2.exports.dump = dump;
  }
});

// node_modules/js-yaml/index.js
var require_js_yaml = __commonJS({
  "node_modules/js-yaml/index.js"(exports2, module2) {
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function renamed(from, to) {
      return function() {
        throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
      };
    }
    module2.exports.Type = require_type();
    module2.exports.Schema = require_schema();
    module2.exports.FAILSAFE_SCHEMA = require_failsafe();
    module2.exports.JSON_SCHEMA = require_json2();
    module2.exports.CORE_SCHEMA = require_core();
    module2.exports.DEFAULT_SCHEMA = require_default();
    module2.exports.load = loader.load;
    module2.exports.loadAll = loader.loadAll;
    module2.exports.dump = dumper.dump;
    module2.exports.YAMLException = require_exception();
    module2.exports.types = {
      binary: require_binary(),
      float: require_float(),
      map: require_map(),
      null: require_null(),
      pairs: require_pairs(),
      set: require_set(),
      timestamp: require_timestamp(),
      bool: require_bool(),
      int: require_int(),
      merge: require_merge(),
      omap: require_omap(),
      seq: require_seq(),
      str: require_str()
    };
    module2.exports.safeLoad = renamed("safeLoad", "load");
    module2.exports.safeLoadAll = renamed("safeLoadAll", "loadAll");
    module2.exports.safeDump = renamed("safeDump", "dump");
  }
});

// node_modules/lazy-val/out/main.js
var require_main = __commonJS({
  "node_modules/lazy-val/out/main.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Lazy = void 0;
    var Lazy = class {
      constructor(creator) {
        this._value = null;
        this.creator = creator;
      }
      get hasValue() {
        return this.creator == null;
      }
      get value() {
        if (this.creator == null) {
          return this._value;
        }
        const result = this.creator();
        this.value = result;
        return result;
      }
      set value(value) {
        this._value = value;
        this.creator = null;
      }
    };
    exports2.Lazy = Lazy;
  }
});

// node_modules/electron-updater/node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/electron-updater/node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/electron-updater/node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/electron-updater/node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/electron-updater/node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/electron-updater/node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/electron-updater/node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier2, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier2 && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier2) {
            const match = `-${identifier2}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier2) {
              throw new Error(`invalid identifier: ${identifier2}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier2, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier2, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier2, identifierBase);
            this.inc("pre", identifier2, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier2, identifierBase);
            }
            this.inc("pre", identifier2, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier2 === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier2) {
              let prerelease = [identifier2, base];
              if (identifierBase === false) {
                prerelease = [identifier2];
              }
              if (compareIdentifiers(this.prerelease[0], identifier2) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse2 = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse2;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/valid.js"(exports2, module2) {
    "use strict";
    var parse2 = require_parse();
    var valid = (version, options) => {
      const v = parse2(version, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/clean.js"(exports2, module2) {
    "use strict";
    var parse2 = require_parse();
    var clean = (version, options) => {
      const s = parse2(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/inc.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier2, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier2;
        identifier2 = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier2, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/diff.js"(exports2, module2) {
    "use strict";
    var parse2 = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse2(version1, null, true);
      const v2 = parse2(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/major.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/minor.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/patch.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/prerelease.js"(exports2, module2) {
    "use strict";
    var parse2 = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse2(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/rcompare.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/compare-build.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/sort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/rsort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/electron-updater/node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse2 = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse2(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/electron-updater/node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/electron-updater/node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/electron-updater/node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/electron-updater/node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/electron-updater/node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/electron-updater/node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/electron-updater/node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/electron-updater/node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/min-version.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/valid.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/outside.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/gtr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module2.exports = gtr;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/ltr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module2.exports = ltr;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/intersects.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/simplify.js"(exports2, module2) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/electron-updater/node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/electron-updater/node_modules/semver/ranges/subset.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// node_modules/electron-updater/node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/electron-updater/node_modules/semver/index.js"(exports2, module2) {
    "use strict";
    var internalRe = require_re();
    var constants4 = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse2 = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse: parse2,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants4.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants4.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/lodash.isequal/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.isequal/index.js"(exports2, module2) {
    var LARGE_ARRAY_SIZE = 200;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var asyncTag = "[object AsyncFunction]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var nullTag = "[object Null]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var proxyTag = "[object Proxy]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var undefinedTag = "[object Undefined]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    })();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    function mapToArray(map) {
      var index = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }
    var arrayProto = Array.prototype;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var coreJsData = root["__core-js_shared__"];
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    var nativeObjectToString = objectProto.toString;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    var Buffer2 = moduleExports ? root.Buffer : void 0;
    var Symbol2 = root.Symbol;
    var Uint8Array2 = root.Uint8Array;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var splice = arrayProto.splice;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
    var nativeKeys = overArg(Object.keys, Object);
    var DataView2 = getNative(root, "DataView");
    var Map2 = getNative(root, "Map");
    var Promise2 = getNative(root, "Promise");
    var Set2 = getNative(root, "Set");
    var WeakMap = getNative(root, "WeakMap");
    var nativeCreate = getNative(Object, "create");
    var dataViewCtorString = toSource(DataView2);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set2);
    var weakMapCtorString = toSource(WeakMap);
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function Hash(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    function ListCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    function listCacheDelete(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }
    function listCacheGet(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      return index < 0 ? void 0 : data[index][1];
    }
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    function listCacheSet(key, value) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    function MapCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    function SetCache(values) {
      var index = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index < length) {
        this.add(values[index]);
      }
    }
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    function stackGet(key) {
      return this.__data__.get(key);
    }
    function stackHas(key) {
      return this.__data__.has(key);
    }
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var stacked = stack.get(array);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array, other);
      stack.set(other, array);
      while (++index < arrLength) {
        var arrValue = array[index], othValue = other[index];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array);
      stack["delete"](other);
      return result;
    }
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object, +other);
        case errorTag:
          return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
          return object == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);
          if (object.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var stacked = stack.get(object);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);
      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };
    var getTag = baseGetTag;
    if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto2 = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto2;
    }
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    var isBuffer = nativeIsBuffer || stubFalse;
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    function stubArray() {
      return [];
    }
    function stubFalse() {
      return false;
    }
    module2.exports = isEqual;
  }
});

// node_modules/electron-updater/out/DownloadedUpdateHelper.js
var require_DownloadedUpdateHelper = __commonJS({
  "node_modules/electron-updater/out/DownloadedUpdateHelper.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DownloadedUpdateHelper = void 0;
    exports2.createTempUpdateFile = createTempUpdateFile;
    var crypto_1 = require("crypto");
    var fs_1 = require("fs");
    var isEqual = require_lodash();
    var fs_extra_1 = require_lib();
    var path6 = require("path");
    var DownloadedUpdateHelper = class {
      constructor(cacheDir) {
        this.cacheDir = cacheDir;
        this._file = null;
        this._packageFile = null;
        this.versionInfo = null;
        this.fileInfo = null;
        this._downloadedFileInfo = null;
      }
      get downloadedFileInfo() {
        return this._downloadedFileInfo;
      }
      get file() {
        return this._file;
      }
      get packageFile() {
        return this._packageFile;
      }
      get cacheDirForPendingUpdate() {
        return path6.join(this.cacheDir, "pending");
      }
      async validateDownloadedPath(updateFile, updateInfo, fileInfo, logger) {
        if (this.versionInfo != null && this.file === updateFile && this.fileInfo != null) {
          if (isEqual(this.versionInfo, updateInfo) && isEqual(this.fileInfo.info, fileInfo.info) && await (0, fs_extra_1.pathExists)(updateFile)) {
            return updateFile;
          } else {
            return null;
          }
        }
        const cachedUpdateFile = await this.getValidCachedUpdateFile(fileInfo, logger);
        if (cachedUpdateFile === null) {
          return null;
        }
        logger.info(`Update has already been downloaded to ${updateFile}).`);
        this._file = cachedUpdateFile;
        return cachedUpdateFile;
      }
      async setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo, updateFileName, isSaveCache) {
        this._file = downloadedFile;
        this._packageFile = packageFile;
        this.versionInfo = versionInfo;
        this.fileInfo = fileInfo;
        this._downloadedFileInfo = {
          fileName: updateFileName,
          sha512: fileInfo.info.sha512,
          isAdminRightsRequired: fileInfo.info.isAdminRightsRequired === true
        };
        if (isSaveCache) {
          await (0, fs_extra_1.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
        }
      }
      async clear() {
        this._file = null;
        this._packageFile = null;
        this.versionInfo = null;
        this.fileInfo = null;
        await this.cleanCacheDirForPendingUpdate();
      }
      async cleanCacheDirForPendingUpdate() {
        try {
          await (0, fs_extra_1.emptyDir)(this.cacheDirForPendingUpdate);
        } catch (_ignore) {
        }
      }
      /**
       * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
       * @param fileInfo
       * @param logger
       */
      async getValidCachedUpdateFile(fileInfo, logger) {
        const updateInfoFilePath = this.getUpdateInfoFile();
        const doesUpdateInfoFileExist = await (0, fs_extra_1.pathExists)(updateInfoFilePath);
        if (!doesUpdateInfoFileExist) {
          return null;
        }
        let cachedInfo;
        try {
          cachedInfo = await (0, fs_extra_1.readJson)(updateInfoFilePath);
        } catch (error) {
          let message = `No cached update info available`;
          if (error.code !== "ENOENT") {
            await this.cleanCacheDirForPendingUpdate();
            message += ` (error on read: ${error.message})`;
          }
          logger.info(message);
          return null;
        }
        const isCachedInfoFileNameValid = (cachedInfo === null || cachedInfo === void 0 ? void 0 : cachedInfo.fileName) !== null;
        if (!isCachedInfoFileNameValid) {
          logger.warn(`Cached update info is corrupted: no fileName, directory for cached update will be cleaned`);
          await this.cleanCacheDirForPendingUpdate();
          return null;
        }
        if (fileInfo.info.sha512 !== cachedInfo.sha512) {
          logger.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${cachedInfo.sha512}, expected: ${fileInfo.info.sha512}. Directory for cached update will be cleaned`);
          await this.cleanCacheDirForPendingUpdate();
          return null;
        }
        const updateFile = path6.join(this.cacheDirForPendingUpdate, cachedInfo.fileName);
        if (!await (0, fs_extra_1.pathExists)(updateFile)) {
          logger.info("Cached update file doesn't exist");
          return null;
        }
        const sha512 = await hashFile(updateFile);
        if (fileInfo.info.sha512 !== sha512) {
          logger.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
          await this.cleanCacheDirForPendingUpdate();
          return null;
        }
        this._downloadedFileInfo = cachedInfo;
        return updateFile;
      }
      getUpdateInfoFile() {
        return path6.join(this.cacheDirForPendingUpdate, "update-info.json");
      }
    };
    exports2.DownloadedUpdateHelper = DownloadedUpdateHelper;
    function hashFile(file, algorithm = "sha512", encoding = "base64", options) {
      return new Promise((resolve, reject) => {
        const hash2 = (0, crypto_1.createHash)(algorithm);
        hash2.on("error", reject).setEncoding(encoding);
        (0, fs_1.createReadStream)(file, {
          ...options,
          highWaterMark: 1024 * 1024
          /* better to use more memory but hash faster */
        }).on("error", reject).on("end", () => {
          hash2.end();
          resolve(hash2.read());
        }).pipe(hash2, { end: false });
      });
    }
    async function createTempUpdateFile(name, cacheDir, log) {
      let nameCounter = 0;
      let result = path6.join(cacheDir, name);
      for (let i = 0; i < 3; i++) {
        try {
          await (0, fs_extra_1.unlink)(result);
          return result;
        } catch (e) {
          if (e.code === "ENOENT") {
            return result;
          }
          log.warn(`Error on remove temp update file: ${e}`);
          result = path6.join(cacheDir, `${nameCounter++}-${name}`);
        }
      }
      return result;
    }
  }
});

// node_modules/electron-updater/out/AppAdapter.js
var require_AppAdapter = __commonJS({
  "node_modules/electron-updater/out/AppAdapter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAppCacheDir = getAppCacheDir;
    var path6 = require("path");
    var os_1 = require("os");
    function getAppCacheDir() {
      const homedir = (0, os_1.homedir)();
      let result;
      if (process.platform === "win32") {
        result = process.env["LOCALAPPDATA"] || path6.join(homedir, "AppData", "Local");
      } else if (process.platform === "darwin") {
        result = path6.join(homedir, "Library", "Caches");
      } else {
        result = process.env["XDG_CACHE_HOME"] || path6.join(homedir, ".cache");
      }
      return result;
    }
  }
});

// node_modules/electron-updater/out/ElectronAppAdapter.js
var require_ElectronAppAdapter = __commonJS({
  "node_modules/electron-updater/out/ElectronAppAdapter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ElectronAppAdapter = void 0;
    var path6 = require("path");
    var AppAdapter_1 = require_AppAdapter();
    var ElectronAppAdapter = class {
      constructor(app2 = require("electron").app) {
        this.app = app2;
      }
      whenReady() {
        return this.app.whenReady();
      }
      get version() {
        return this.app.getVersion();
      }
      get name() {
        return this.app.getName();
      }
      get isPackaged() {
        return this.app.isPackaged === true;
      }
      get appUpdateConfigPath() {
        return this.isPackaged ? path6.join(process.resourcesPath, "app-update.yml") : path6.join(this.app.getAppPath(), "dev-app-update.yml");
      }
      get userDataPath() {
        return this.app.getPath("userData");
      }
      get baseCachePath() {
        return (0, AppAdapter_1.getAppCacheDir)();
      }
      quit() {
        this.app.quit();
      }
      relaunch() {
        this.app.relaunch();
      }
      onQuit(handler) {
        this.app.once("quit", (_, exitCode) => handler(exitCode));
      }
    };
    exports2.ElectronAppAdapter = ElectronAppAdapter;
  }
});

// node_modules/electron-updater/out/electronHttpExecutor.js
var require_electronHttpExecutor = __commonJS({
  "node_modules/electron-updater/out/electronHttpExecutor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ElectronHttpExecutor = exports2.NET_SESSION_NAME = void 0;
    exports2.getNetSession = getNetSession;
    var builder_util_runtime_1 = require_out();
    exports2.NET_SESSION_NAME = "electron-updater";
    function getNetSession() {
      return require("electron").session.fromPartition(exports2.NET_SESSION_NAME, {
        cache: false
      });
    }
    var ElectronHttpExecutor = class extends builder_util_runtime_1.HttpExecutor {
      constructor(proxyLoginCallback) {
        super();
        this.proxyLoginCallback = proxyLoginCallback;
        this.cachedSession = null;
      }
      async download(url, destination, options) {
        return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
          const requestOptions = {
            headers: options.headers || void 0,
            redirect: "manual"
          };
          (0, builder_util_runtime_1.configureRequestUrl)(url, requestOptions);
          (0, builder_util_runtime_1.configureRequestOptions)(requestOptions);
          this.doDownload(requestOptions, {
            destination,
            options,
            onCancel,
            callback: (error) => {
              if (error == null) {
                resolve(destination);
              } else {
                reject(error);
              }
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(options, callback) {
        if (options.headers && options.headers.Host) {
          options.host = options.headers.Host;
          delete options.headers.Host;
        }
        if (this.cachedSession == null) {
          this.cachedSession = getNetSession();
        }
        const request = require("electron").net.request({
          ...options,
          session: this.cachedSession
        });
        request.on("response", callback);
        if (this.proxyLoginCallback != null) {
          request.on("login", this.proxyLoginCallback);
        }
        return request;
      }
      addRedirectHandlers(request, options, reject, redirectCount, handler) {
        request.on("redirect", (statusCode, method, redirectUrl) => {
          request.abort();
          if (redirectCount > this.maxRedirects) {
            reject(this.createMaxRedirectError());
          } else {
            handler(builder_util_runtime_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options));
          }
        });
      }
    };
    exports2.ElectronHttpExecutor = ElectronHttpExecutor;
  }
});

// node_modules/electron-updater/out/util.js
var require_util = __commonJS({
  "node_modules/electron-updater/out/util.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.newBaseUrl = newBaseUrl;
    exports2.newUrlFromBase = newUrlFromBase;
    exports2.getChannelFilename = getChannelFilename;
    var url_1 = require("url");
    function newBaseUrl(url) {
      const result = new url_1.URL(url);
      if (!result.pathname.endsWith("/")) {
        result.pathname += "/";
      }
      return result;
    }
    function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
      const result = new url_1.URL(pathname, baseUrl);
      const search = baseUrl.search;
      if (search != null && search.length !== 0) {
        result.search = search;
      } else if (addRandomQueryToAvoidCaching) {
        result.search = `noCache=${Date.now().toString(32)}`;
      }
      return result;
    }
    function getChannelFilename(channel) {
      return `${channel}.yml`;
    }
  }
});

// node_modules/lodash.escaperegexp/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.escaperegexp/index.js"(exports2, module2) {
    var INFINITY = 1 / 0;
    var symbolTag = "[object Symbol]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reHasRegExpChar = RegExp(reRegExpChar.source);
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var Symbol2 = root.Symbol;
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    function escapeRegExp(string) {
      string = toString(string);
      return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
    }
    module2.exports = escapeRegExp;
  }
});

// node_modules/electron-updater/out/providers/Provider.js
var require_Provider = __commonJS({
  "node_modules/electron-updater/out/providers/Provider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Provider = void 0;
    exports2.findFile = findFile;
    exports2.parseUpdateInfo = parseUpdateInfo;
    exports2.getFileList = getFileList;
    exports2.resolveFiles = resolveFiles;
    var builder_util_runtime_1 = require_out();
    var js_yaml_1 = require_js_yaml();
    var url_1 = require("url");
    var util_1 = require_util();
    var escapeRegExp = require_lodash2();
    var Provider = class {
      constructor(runtimeOptions) {
        this.runtimeOptions = runtimeOptions;
        this.requestHeaders = null;
        this.executor = runtimeOptions.executor;
      }
      // By default, the blockmap file is in the same directory as the main file
      // But some providers may have a different blockmap file, so we need to override this method
      getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
        const newBlockMapUrl = (0, util_1.newUrlFromBase)(`${baseUrl.pathname}.blockmap`, baseUrl);
        const oldBlockMapUrl = (0, util_1.newUrlFromBase)(`${baseUrl.pathname.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion)}.blockmap`, oldBlockMapFileBaseUrl ? new url_1.URL(oldBlockMapFileBaseUrl) : baseUrl);
        return [oldBlockMapUrl, newBlockMapUrl];
      }
      get isUseMultipleRangeRequest() {
        return this.runtimeOptions.isUseMultipleRangeRequest !== false;
      }
      getChannelFilePrefix() {
        if (this.runtimeOptions.platform === "linux") {
          const arch = process.env["TEST_UPDATER_ARCH"] || process.arch;
          const archSuffix = arch === "x64" ? "" : `-${arch}`;
          return "-linux" + archSuffix;
        } else {
          return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
        }
      }
      // due to historical reasons for windows we use channel name without platform specifier
      getDefaultChannelName() {
        return this.getCustomChannelName("latest");
      }
      getCustomChannelName(channel) {
        return `${channel}${this.getChannelFilePrefix()}`;
      }
      get fileExtraDownloadHeaders() {
        return null;
      }
      setRequestHeaders(value) {
        this.requestHeaders = value;
      }
      /**
       * Method to perform API request only to resolve update info, but not to download update.
       */
      httpRequest(url, headers, cancellationToken) {
        return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
      }
      createRequestOptions(url, headers) {
        const result = {};
        if (this.requestHeaders == null) {
          if (headers != null) {
            result.headers = headers;
          }
        } else {
          result.headers = headers == null ? this.requestHeaders : { ...this.requestHeaders, ...headers };
        }
        (0, builder_util_runtime_1.configureRequestUrl)(url, result);
        return result;
      }
    };
    exports2.Provider = Provider;
    function findFile(files, extension, not) {
      var _a;
      if (files.length === 0) {
        throw (0, builder_util_runtime_1.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
      }
      const filteredFiles = files.filter((it) => it.url.pathname.toLowerCase().endsWith(`.${extension.toLowerCase()}`));
      const result = (_a = filteredFiles.find((it) => [it.url.pathname, it.info.url].some((n) => n.includes(process.arch)))) !== null && _a !== void 0 ? _a : filteredFiles.shift();
      if (result) {
        return result;
      } else if (not == null) {
        return files[0];
      } else {
        return files.find((fileInfo) => !not.some((ext) => fileInfo.url.pathname.toLowerCase().endsWith(`.${ext.toLowerCase()}`)));
      }
    }
    function parseUpdateInfo(rawData, channelFile, channelFileUrl) {
      if (rawData == null) {
        throw (0, builder_util_runtime_1.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
      }
      let result;
      try {
        result = (0, js_yaml_1.load)(rawData);
      } catch (e) {
        throw (0, builder_util_runtime_1.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
      }
      return result;
    }
    function getFileList(updateInfo) {
      const files = updateInfo.files;
      if (files != null && files.length > 0) {
        return files;
      }
      if (updateInfo.path != null) {
        return [
          {
            url: updateInfo.path,
            sha2: updateInfo.sha2,
            sha512: updateInfo.sha512
          }
        ];
      } else {
        throw (0, builder_util_runtime_1.newError)(`No files provided: ${(0, builder_util_runtime_1.safeStringifyJson)(updateInfo)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
      }
    }
    function resolveFiles(updateInfo, baseUrl, pathTransformer = (p) => p) {
      const files = getFileList(updateInfo);
      const result = files.map((fileInfo) => {
        if (fileInfo.sha2 == null && fileInfo.sha512 == null) {
          throw (0, builder_util_runtime_1.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, builder_util_runtime_1.safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
        }
        return {
          url: (0, util_1.newUrlFromBase)(pathTransformer(fileInfo.url), baseUrl),
          info: fileInfo
        };
      });
      const packages = updateInfo.packages;
      const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
      if (packageInfo != null) {
        ;
        result[0].packageInfo = {
          ...packageInfo,
          path: (0, util_1.newUrlFromBase)(pathTransformer(packageInfo.path), baseUrl).href
        };
      }
      return result;
    }
  }
});

// node_modules/electron-updater/out/providers/GenericProvider.js
var require_GenericProvider = __commonJS({
  "node_modules/electron-updater/out/providers/GenericProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.GenericProvider = void 0;
    var builder_util_runtime_1 = require_out();
    var util_1 = require_util();
    var Provider_1 = require_Provider();
    var GenericProvider = class extends Provider_1.Provider {
      constructor(configuration, updater, runtimeOptions) {
        super(runtimeOptions);
        this.configuration = configuration;
        this.updater = updater;
        this.baseUrl = (0, util_1.newBaseUrl)(this.configuration.url);
      }
      get channel() {
        const result = this.updater.channel || this.configuration.channel;
        return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
      }
      async getLatestVersion() {
        const channelFile = (0, util_1.getChannelFilename)(this.channel);
        const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        for (let attemptNumber = 0; ; attemptNumber++) {
          try {
            return (0, Provider_1.parseUpdateInfo)(await this.httpRequest(channelUrl), channelFile, channelUrl);
          } catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
              throw (0, builder_util_runtime_1.newError)(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
            } else if (e.code === "ECONNREFUSED") {
              if (attemptNumber < 3) {
                await new Promise((resolve, reject) => {
                  try {
                    setTimeout(resolve, 1e3 * attemptNumber);
                  } catch (e2) {
                    reject(e2);
                  }
                });
                continue;
              }
            }
            throw e;
          }
        }
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
      }
    };
    exports2.GenericProvider = GenericProvider;
  }
});

// node_modules/electron-updater/out/providers/BitbucketProvider.js
var require_BitbucketProvider = __commonJS({
  "node_modules/electron-updater/out/providers/BitbucketProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BitbucketProvider = void 0;
    var builder_util_runtime_1 = require_out();
    var util_1 = require_util();
    var Provider_1 = require_Provider();
    var BitbucketProvider = class extends Provider_1.Provider {
      constructor(configuration, updater, runtimeOptions) {
        super({
          ...runtimeOptions,
          isUseMultipleRangeRequest: false
        });
        this.configuration = configuration;
        this.updater = updater;
        const { owner, slug } = configuration;
        this.baseUrl = (0, util_1.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${owner}/${slug}/downloads`);
      }
      get channel() {
        return this.updater.channel || this.configuration.channel || "latest";
      }
      async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const channelFile = (0, util_1.getChannelFilename)(this.getCustomChannelName(this.channel));
        const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        try {
          const updateInfo = await this.httpRequest(channelUrl, void 0, cancellationToken);
          return (0, Provider_1.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
      }
      toString() {
        const { owner, slug } = this.configuration;
        return `Bitbucket (owner: ${owner}, slug: ${slug}, channel: ${this.channel})`;
      }
    };
    exports2.BitbucketProvider = BitbucketProvider;
  }
});

// node_modules/electron-updater/out/providers/GitHubProvider.js
var require_GitHubProvider = __commonJS({
  "node_modules/electron-updater/out/providers/GitHubProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.GitHubProvider = exports2.BaseGitHubProvider = void 0;
    exports2.computeReleaseNotes = computeReleaseNotes;
    var builder_util_runtime_1 = require_out();
    var semver = require_semver2();
    var url_1 = require("url");
    var util_1 = require_util();
    var Provider_1 = require_Provider();
    var hrefRegExp = /\/tag\/(v?[^/]+)$/;
    var BaseGitHubProvider = class extends Provider_1.Provider {
      constructor(options, defaultHost, runtimeOptions) {
        super({
          ...runtimeOptions,
          /* because GitHib uses S3 */
          isUseMultipleRangeRequest: false
        });
        this.options = options;
        this.baseUrl = (0, util_1.newBaseUrl)((0, builder_util_runtime_1.githubUrl)(options, defaultHost));
        const apiHost = defaultHost === "github.com" ? "api.github.com" : defaultHost;
        this.baseApiUrl = (0, util_1.newBaseUrl)((0, builder_util_runtime_1.githubUrl)(options, apiHost));
      }
      computeGithubBasePath(result) {
        const host = this.options.host;
        return host && !["github.com", "api.github.com"].includes(host) ? `/api/v3${result}` : result;
      }
    };
    exports2.BaseGitHubProvider = BaseGitHubProvider;
    var GitHubProvider = class extends BaseGitHubProvider {
      constructor(options, updater, runtimeOptions) {
        super(options, "github.com", runtimeOptions);
        this.options = options;
        this.updater = updater;
      }
      get channel() {
        const result = this.updater.channel || this.options.channel;
        return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
      }
      async getLatestVersion() {
        var _a, _b, _c, _d, _e;
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const feedXml = await this.httpRequest((0, util_1.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
          accept: "application/xml, application/atom+xml, text/xml, */*"
        }, cancellationToken);
        const feed = (0, builder_util_runtime_1.parseXml)(feedXml);
        let latestRelease = feed.element("entry", false, `No published versions on GitHub`);
        let tag = null;
        try {
          if (this.updater.allowPrerelease) {
            const currentChannel = ((_a = this.updater) === null || _a === void 0 ? void 0 : _a.channel) || ((_b = semver.prerelease(this.updater.currentVersion)) === null || _b === void 0 ? void 0 : _b[0]) || null;
            if (currentChannel === null) {
              tag = hrefRegExp.exec(latestRelease.element("link").attribute("href"))[1];
            } else {
              for (const element of feed.getElements("entry")) {
                const hrefElement = hrefRegExp.exec(element.element("link").attribute("href"));
                if (hrefElement === null) {
                  continue;
                }
                const hrefTag = hrefElement[1];
                if (!semver.valid(hrefTag)) {
                  continue;
                }
                const hrefChannel = ((_c = semver.prerelease(hrefTag)) === null || _c === void 0 ? void 0 : _c[0]) || null;
                const shouldFetchVersion = !currentChannel || ["alpha", "beta"].includes(currentChannel);
                const isCustomChannel = hrefChannel !== null && !["alpha", "beta"].includes(String(hrefChannel));
                const channelMismatch = currentChannel === "beta" && hrefChannel === "alpha";
                if (shouldFetchVersion && !isCustomChannel && !channelMismatch) {
                  tag = hrefTag;
                  latestRelease = element;
                  break;
                }
                const isNextPreRelease = hrefChannel && hrefChannel === currentChannel;
                if (isNextPreRelease) {
                  tag = hrefTag;
                  latestRelease = element;
                  break;
                }
              }
            }
          } else {
            tag = await this.getLatestTagName(cancellationToken);
            for (const element of feed.getElements("entry")) {
              const hrefMatch = hrefRegExp.exec(element.element("link").attribute("href"));
              if (hrefMatch == null) {
                continue;
              }
              if (hrefMatch[1] === tag) {
                latestRelease = element;
                break;
              }
            }
          }
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Cannot parse releases feed: ${e.stack || e.message},
XML:
${feedXml}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
        }
        if (tag == null) {
          throw (0, builder_util_runtime_1.newError)(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
        }
        let rawData;
        let channelFile = "";
        let channelFileUrl = "";
        const fetchData = async (channelName) => {
          channelFile = (0, util_1.getChannelFilename)(channelName);
          channelFileUrl = (0, util_1.newUrlFromBase)(this.getBaseDownloadPath(String(tag), channelFile), this.baseUrl);
          const requestOptions = this.createRequestOptions(channelFileUrl);
          try {
            return await this.executor.request(requestOptions, cancellationToken);
          } catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
              throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
            }
            throw e;
          }
        };
        try {
          let channel = this.channel;
          if (this.updater.allowPrerelease && ((_d = semver.prerelease(tag)) === null || _d === void 0 ? void 0 : _d[0])) {
            channel = this.getCustomChannelName(String((_e = semver.prerelease(tag)) === null || _e === void 0 ? void 0 : _e[0]));
          }
          rawData = await fetchData(channel);
        } catch (e) {
          if (this.updater.allowPrerelease) {
            rawData = await fetchData(this.getDefaultChannelName());
          } else {
            throw e;
          }
        }
        const result = (0, Provider_1.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
        if (result.releaseName == null) {
          result.releaseName = latestRelease.elementValueOrEmpty("title");
        }
        if (result.releaseNotes == null) {
          result.releaseNotes = computeReleaseNotes(this.updater.currentVersion, this.updater.fullChangelog, feed, latestRelease);
        }
        return {
          tag,
          ...result
        };
      }
      async getLatestTagName(cancellationToken) {
        const options = this.options;
        const url = options.host == null || options.host === "github.com" ? (0, util_1.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new url_1.URL(`${this.computeGithubBasePath(`/repos/${options.owner}/${options.repo}/releases`)}/latest`, this.baseApiUrl);
        try {
          const rawData = await this.httpRequest(url, { Accept: "application/json" }, cancellationToken);
          if (rawData == null) {
            return null;
          }
          const releaseInfo = JSON.parse(rawData);
          return releaseInfo.tag_name;
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
      }
      get basePath() {
        return `/${this.options.owner}/${this.options.repo}/releases`;
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl, (p) => this.getBaseDownloadPath(updateInfo.tag, p.replace(/ /g, "-")));
      }
      getBaseDownloadPath(tag, fileName) {
        return `${this.basePath}/download/${tag}/${fileName}`;
      }
    };
    exports2.GitHubProvider = GitHubProvider;
    function getNoteValue(parent) {
      const result = parent.elementValueOrEmpty("content");
      return result === "No content." ? "" : result;
    }
    function computeReleaseNotes(currentVersion, isFullChangelog, feed, latestRelease) {
      if (!isFullChangelog) {
        return getNoteValue(latestRelease);
      }
      const releaseVersionRegExp = /\/tag\/v?([^/]+)$/;
      let latestVersion = void 0;
      try {
        latestVersion = releaseVersionRegExp.exec(latestRelease.element("link").attribute("href"))[1];
        latestVersion = semver.valid(latestVersion) ? latestVersion : void 0;
      } catch {
      }
      if (latestVersion == null) {
        return null;
      }
      const releaseNotes = [];
      for (const release of feed.getElements("entry")) {
        let versionRelease;
        try {
          const match = releaseVersionRegExp.exec(release.element("link").attribute("href"));
          if (!match) {
            continue;
          }
          versionRelease = match[1];
        } catch {
          continue;
        }
        if (!semver.valid(versionRelease)) {
          continue;
        }
        const isGreaterThanCurrent = semver.gt(versionRelease, currentVersion.raw);
        const isLessOrEqualThanLatest = semver.lte(versionRelease, latestVersion);
        if (isGreaterThanCurrent && isLessOrEqualThanLatest) {
          releaseNotes.push({
            version: versionRelease,
            note: getNoteValue(release)
          });
        }
      }
      return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version));
    }
  }
});

// node_modules/electron-updater/out/providers/GitLabProvider.js
var require_GitLabProvider = __commonJS({
  "node_modules/electron-updater/out/providers/GitLabProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.GitLabProvider = void 0;
    var builder_util_runtime_1 = require_out();
    var url_1 = require("url");
    var escapeRegExp = require_lodash2();
    var util_1 = require_util();
    var Provider_1 = require_Provider();
    var GitLabProvider = class extends Provider_1.Provider {
      /**
       * Normalizes filenames by replacing spaces and underscores with dashes.
       *
       * This is a workaround to handle filename formatting differences between tools:
       * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
       * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
       *
       * Because of this mismatch, we can't reliably extract the correct filename from
       * the asset path without normalization. This function ensures consistent matching
       * across different filename formats by converting all spaces and underscores to dashes.
       *
       * @param filename The filename to normalize
       * @returns The normalized filename with spaces and underscores replaced by dashes
       */
      normalizeFilename(filename) {
        return filename.replace(/ |_/g, "-");
      }
      constructor(options, updater, runtimeOptions) {
        super({
          ...runtimeOptions,
          // GitLab might not support multiple range requests efficiently
          isUseMultipleRangeRequest: false
        });
        this.options = options;
        this.updater = updater;
        this.cachedLatestVersion = null;
        const defaultHost = "gitlab.com";
        const host = options.host || defaultHost;
        this.baseApiUrl = (0, util_1.newBaseUrl)(`https://${host}/api/v4`);
      }
      createRequestOptions(url, headers) {
        const result = super.createRequestOptions(url, headers);
        result.redirect = "manual";
        return result;
      }
      get channel() {
        const result = this.updater.channel || this.options.channel;
        return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
      }
      async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const latestReleaseUrl = (0, util_1.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl);
        const header = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
        let releaseResponse;
        try {
          releaseResponse = await this.httpRequest(latestReleaseUrl, header, cancellationToken);
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to find latest release on GitLab (${latestReleaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
        if (!releaseResponse) {
          throw (0, builder_util_runtime_1.newError)("No published releases on GitLab", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
        }
        let latestRelease;
        try {
          latestRelease = JSON.parse(releaseResponse);
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to parse latest release response from GitLab (${latestReleaseUrl}): response was not valid JSON: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
        if (latestRelease.upcoming_release) {
          throw (0, builder_util_runtime_1.newError)("Latest GitLab release is scheduled but not yet published", "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
        const tag = latestRelease.tag_name;
        let rawData = null;
        let channelFile = "";
        let channelFileUrl = null;
        const fetchChannelData = async (channelName) => {
          channelFile = (0, util_1.getChannelFilename)(channelName);
          const channelAsset = latestRelease.assets.links.find((asset) => asset.name === channelFile);
          if (!channelAsset) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          }
          channelFileUrl = new url_1.URL(channelAsset.direct_asset_url);
          const authHeaders = this.setAuthHeaderForToken(this.options.token || null);
          const headers = Object.keys(authHeaders).length ? authHeaders : void 0;
          try {
            const result2 = await this.httpRequest(channelFileUrl, headers, cancellationToken);
            if (!result2) {
              throw (0, builder_util_runtime_1.newError)(`Empty response from ${channelFileUrl}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
            }
            return result2;
          } catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
              throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
            }
            throw e;
          }
        };
        try {
          rawData = await fetchChannelData(this.channel);
        } catch (e) {
          if (this.channel !== this.getDefaultChannelName()) {
            rawData = await fetchChannelData(this.getDefaultChannelName());
          } else {
            throw e;
          }
        }
        if (!rawData) {
          throw (0, builder_util_runtime_1.newError)(`Unable to parse channel data from ${channelFile}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
        }
        const result = (0, Provider_1.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
        if (result.releaseName == null) {
          result.releaseName = latestRelease.name;
        }
        if (result.releaseNotes == null) {
          result.releaseNotes = latestRelease.description || null;
        }
        const gitlabUpdateInfo = {
          tag,
          assets: this.convertAssetsToMap(latestRelease.assets),
          ...result
        };
        this.cachedLatestVersion = gitlabUpdateInfo;
        return gitlabUpdateInfo;
      }
      /**
       * Utility function to convert GitlabReleaseAsset to Map<string, string>
       * Maps asset names to their download URLs
       */
      convertAssetsToMap(assets) {
        const assetsMap = /* @__PURE__ */ new Map();
        for (const asset of assets.links) {
          assetsMap.set(this.normalizeFilename(asset.name), asset.direct_asset_url);
        }
        return assetsMap;
      }
      /**
       * Find blockmap file URL in assets map for a specific filename
       */
      findBlockMapInAssets(assets, filename) {
        const possibleBlockMapNames = [`${filename}.blockmap`, `${this.normalizeFilename(filename)}.blockmap`];
        for (const blockMapName of possibleBlockMapNames) {
          const assetUrl = assets.get(blockMapName);
          if (assetUrl) {
            return new url_1.URL(assetUrl);
          }
        }
        return null;
      }
      async fetchReleaseInfoByVersion(version) {
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const possibleReleaseIds = [`v${version}`, version];
        for (const releaseId of possibleReleaseIds) {
          const releaseUrl = (0, util_1.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(releaseId)}`, this.baseApiUrl);
          try {
            const header = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
            const releaseResponse = await this.httpRequest(releaseUrl, header, cancellationToken);
            if (releaseResponse) {
              const release = JSON.parse(releaseResponse);
              return release;
            }
          } catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
              continue;
            }
            throw (0, builder_util_runtime_1.newError)(`Unable to find release ${releaseId} on GitLab (${releaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
          }
        }
        throw (0, builder_util_runtime_1.newError)(`Unable to find release with version ${version} (tried: ${possibleReleaseIds.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
      setAuthHeaderForToken(token) {
        const headers = {};
        if (token != null) {
          if (token.startsWith("Bearer")) {
            headers.authorization = token;
          } else {
            headers["PRIVATE-TOKEN"] = token;
          }
        }
        return headers;
      }
      /**
       * Get version info for blockmap files, using cache when possible
       */
      async getVersionInfoForBlockMap(version) {
        if (this.cachedLatestVersion && this.cachedLatestVersion.version === version) {
          return this.cachedLatestVersion.assets;
        }
        const versionInfo = await this.fetchReleaseInfoByVersion(version);
        if (versionInfo && versionInfo.assets) {
          return this.convertAssetsToMap(versionInfo.assets);
        }
        return null;
      }
      /**
       * Find blockmap URLs from version assets
       */
      async findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename) {
        let newBlockMapUrl = null;
        let oldBlockMapUrl = null;
        const newVersionAssets = await this.getVersionInfoForBlockMap(newVersion);
        if (newVersionAssets) {
          newBlockMapUrl = this.findBlockMapInAssets(newVersionAssets, baseFilename);
        }
        const oldVersionAssets = await this.getVersionInfoForBlockMap(oldVersion);
        if (oldVersionAssets) {
          const oldFilename = baseFilename.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion);
          oldBlockMapUrl = this.findBlockMapInAssets(oldVersionAssets, oldFilename);
        }
        return [oldBlockMapUrl, newBlockMapUrl];
      }
      async getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
        if (this.options.uploadTarget === "project_upload") {
          const baseFilename = baseUrl.pathname.split("/").pop() || "";
          const [oldBlockMapUrl, newBlockMapUrl] = await this.findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename);
          if (!newBlockMapUrl) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find blockmap file for ${newVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
          }
          if (!oldBlockMapUrl) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find blockmap file for ${oldVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
          }
          return [oldBlockMapUrl, newBlockMapUrl];
        } else {
          return super.getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl);
        }
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.getFileList)(updateInfo).map((fileInfo) => {
          const possibleNames = [
            fileInfo.url,
            // Original filename
            this.normalizeFilename(fileInfo.url)
            // Normalized filename (spaces/underscores → dashes)
          ];
          const matchingAssetName = possibleNames.find((name) => updateInfo.assets.has(name));
          const assetUrl = matchingAssetName ? updateInfo.assets.get(matchingAssetName) : void 0;
          if (!assetUrl) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find asset "${fileInfo.url}" in GitLab release assets. Available assets: ${Array.from(updateInfo.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
          }
          return {
            url: new url_1.URL(assetUrl),
            info: fileInfo
          };
        });
      }
      toString() {
        return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
      }
    };
    exports2.GitLabProvider = GitLabProvider;
  }
});

// node_modules/electron-updater/out/providers/KeygenProvider.js
var require_KeygenProvider = __commonJS({
  "node_modules/electron-updater/out/providers/KeygenProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.KeygenProvider = void 0;
    var builder_util_runtime_1 = require_out();
    var util_1 = require_util();
    var Provider_1 = require_Provider();
    var KeygenProvider = class extends Provider_1.Provider {
      constructor(configuration, updater, runtimeOptions) {
        super({
          ...runtimeOptions,
          isUseMultipleRangeRequest: false
        });
        this.configuration = configuration;
        this.updater = updater;
        this.defaultHostname = "api.keygen.sh";
        const host = this.configuration.host || this.defaultHostname;
        this.baseUrl = (0, util_1.newBaseUrl)(`https://${host}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
      }
      get channel() {
        return this.updater.channel || this.configuration.channel || "stable";
      }
      async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const channelFile = (0, util_1.getChannelFilename)(this.getCustomChannelName(this.channel));
        const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        try {
          const updateInfo = await this.httpRequest(channelUrl, {
            Accept: "application/vnd.api+json",
            "Keygen-Version": "1.1"
          }, cancellationToken);
          return (0, Provider_1.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
      }
      toString() {
        const { account, product, platform } = this.configuration;
        return `Keygen (account: ${account}, product: ${product}, platform: ${platform}, channel: ${this.channel})`;
      }
    };
    exports2.KeygenProvider = KeygenProvider;
  }
});

// node_modules/electron-updater/out/providers/PrivateGitHubProvider.js
var require_PrivateGitHubProvider = __commonJS({
  "node_modules/electron-updater/out/providers/PrivateGitHubProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PrivateGitHubProvider = void 0;
    var builder_util_runtime_1 = require_out();
    var js_yaml_1 = require_js_yaml();
    var path6 = require("path");
    var url_1 = require("url");
    var util_1 = require_util();
    var GitHubProvider_1 = require_GitHubProvider();
    var Provider_1 = require_Provider();
    var PrivateGitHubProvider = class extends GitHubProvider_1.BaseGitHubProvider {
      constructor(options, updater, token, runtimeOptions) {
        super(options, "api.github.com", runtimeOptions);
        this.updater = updater;
        this.token = token;
      }
      createRequestOptions(url, headers) {
        const result = super.createRequestOptions(url, headers);
        result.redirect = "manual";
        return result;
      }
      async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        const channelFile = (0, util_1.getChannelFilename)(this.getDefaultChannelName());
        const releaseInfo = await this.getLatestVersionInfo(cancellationToken);
        const asset = releaseInfo.assets.find((it) => it.name === channelFile);
        if (asset == null) {
          throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        const url = new url_1.URL(asset.url);
        let result;
        try {
          result = (0, js_yaml_1.load)(await this.httpRequest(url, this.configureHeaders("application/octet-stream"), cancellationToken));
        } catch (e) {
          if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          }
          throw e;
        }
        ;
        result.assets = releaseInfo.assets;
        return result;
      }
      get fileExtraDownloadHeaders() {
        return this.configureHeaders("application/octet-stream");
      }
      configureHeaders(accept) {
        return {
          accept,
          authorization: `token ${this.token}`
        };
      }
      async getLatestVersionInfo(cancellationToken) {
        const allowPrerelease = this.updater.allowPrerelease;
        let basePath = this.basePath;
        if (!allowPrerelease) {
          basePath = `${basePath}/latest`;
        }
        const url = (0, util_1.newUrlFromBase)(basePath, this.baseUrl);
        try {
          const version = JSON.parse(await this.httpRequest(url, this.configureHeaders("application/vnd.github.v3+json"), cancellationToken));
          if (allowPrerelease) {
            const candidates = version.filter((it) => !it.draft);
            return candidates.find((it) => it.prerelease) || candidates[0];
          } else {
            return version;
          }
        } catch (e) {
          throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
      }
      get basePath() {
        return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
      }
      resolveFiles(updateInfo) {
        return (0, Provider_1.getFileList)(updateInfo).map((it) => {
          const name = path6.posix.basename(it.url).replace(/ /g, "-");
          const asset = updateInfo.assets.find((it2) => it2 != null && it2.name === name);
          if (asset == null) {
            throw (0, builder_util_runtime_1.newError)(`Cannot find asset "${name}" in: ${JSON.stringify(updateInfo.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
          }
          return {
            url: new url_1.URL(asset.url),
            info: it
          };
        });
      }
    };
    exports2.PrivateGitHubProvider = PrivateGitHubProvider;
  }
});

// node_modules/electron-updater/out/providerFactory.js
var require_providerFactory = __commonJS({
  "node_modules/electron-updater/out/providerFactory.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isUrlProbablySupportMultiRangeRequests = isUrlProbablySupportMultiRangeRequests;
    exports2.createClient = createClient;
    var builder_util_runtime_1 = require_out();
    var BitbucketProvider_1 = require_BitbucketProvider();
    var GenericProvider_1 = require_GenericProvider();
    var GitHubProvider_1 = require_GitHubProvider();
    var GitLabProvider_1 = require_GitLabProvider();
    var KeygenProvider_1 = require_KeygenProvider();
    var PrivateGitHubProvider_1 = require_PrivateGitHubProvider();
    function isUrlProbablySupportMultiRangeRequests(url) {
      return !url.includes("s3.amazonaws.com");
    }
    function createClient(data, updater, runtimeOptions) {
      if (typeof data === "string") {
        throw (0, builder_util_runtime_1.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      }
      const provider = data.provider;
      switch (provider) {
        case "github": {
          const githubOptions = data;
          const token = (githubOptions.private ? process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"] : null) || githubOptions.token;
          if (token == null) {
            return new GitHubProvider_1.GitHubProvider(githubOptions, updater, runtimeOptions);
          } else {
            return new PrivateGitHubProvider_1.PrivateGitHubProvider(githubOptions, updater, token, runtimeOptions);
          }
        }
        case "bitbucket":
          return new BitbucketProvider_1.BitbucketProvider(data, updater, runtimeOptions);
        case "gitlab":
          return new GitLabProvider_1.GitLabProvider(data, updater, runtimeOptions);
        case "keygen":
          return new KeygenProvider_1.KeygenProvider(data, updater, runtimeOptions);
        case "s3":
        case "spaces":
          return new GenericProvider_1.GenericProvider({
            provider: "generic",
            url: (0, builder_util_runtime_1.getS3LikeProviderBaseUrl)(data),
            channel: data.channel || null
          }, updater, {
            ...runtimeOptions,
            // https://github.com/minio/minio/issues/5285#issuecomment-350428955
            isUseMultipleRangeRequest: false
          });
        case "generic": {
          const options = data;
          return new GenericProvider_1.GenericProvider(options, updater, {
            ...runtimeOptions,
            isUseMultipleRangeRequest: options.useMultipleRangeRequest !== false && isUrlProbablySupportMultiRangeRequests(options.url)
          });
        }
        case "custom": {
          const options = data;
          const constructor = options.updateProvider;
          if (!constructor) {
            throw (0, builder_util_runtime_1.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
          }
          return new constructor(options, updater, runtimeOptions);
        }
        default:
          throw (0, builder_util_runtime_1.newError)(`Unsupported provider: ${provider}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
      }
    }
  }
});

// node_modules/electron-updater/out/differentialDownloader/downloadPlanBuilder.js
var require_downloadPlanBuilder = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/downloadPlanBuilder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.OperationKind = void 0;
    exports2.computeOperations = computeOperations;
    var OperationKind;
    (function(OperationKind2) {
      OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
      OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
    })(OperationKind || (exports2.OperationKind = OperationKind = {}));
    function computeOperations(oldBlockMap, newBlockMap, logger) {
      const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
      const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
      let lastOperation = null;
      const blockMapFile = newBlockMap.files[0];
      const operations = [];
      const name = blockMapFile.name;
      const oldEntry = nameToOldBlocks.get(name);
      if (oldEntry == null) {
        throw new Error(`no file ${name} in old blockmap`);
      }
      const newFile = nameToNewBlocks.get(name);
      let changedBlockCount = 0;
      const { checksumToOffset: checksumToOldOffset, checksumToOldSize } = buildChecksumMap(nameToOldBlocks.get(name), oldEntry.offset, logger);
      let newOffset = blockMapFile.offset;
      for (let i = 0; i < newFile.checksums.length; newOffset += newFile.sizes[i], i++) {
        const blockSize = newFile.sizes[i];
        const checksum = newFile.checksums[i];
        let oldOffset = checksumToOldOffset.get(checksum);
        if (oldOffset != null && checksumToOldSize.get(checksum) !== blockSize) {
          logger.warn(`Checksum ("${checksum}") matches, but size differs (old: ${checksumToOldSize.get(checksum)}, new: ${blockSize})`);
          oldOffset = void 0;
        }
        if (oldOffset === void 0) {
          changedBlockCount++;
          if (lastOperation != null && lastOperation.kind === OperationKind.DOWNLOAD && lastOperation.end === newOffset) {
            lastOperation.end += blockSize;
          } else {
            lastOperation = {
              kind: OperationKind.DOWNLOAD,
              start: newOffset,
              end: newOffset + blockSize
              // oldBlocks: null,
            };
            validateAndAdd(lastOperation, operations, checksum, i);
          }
        } else {
          if (lastOperation != null && lastOperation.kind === OperationKind.COPY && lastOperation.end === oldOffset) {
            lastOperation.end += blockSize;
          } else {
            lastOperation = {
              kind: OperationKind.COPY,
              start: oldOffset,
              end: oldOffset + blockSize
              // oldBlocks: [checksum]
            };
            validateAndAdd(lastOperation, operations, checksum, i);
          }
        }
      }
      if (changedBlockCount > 0) {
        logger.info(`File${blockMapFile.name === "file" ? "" : " " + blockMapFile.name} has ${changedBlockCount} changed blocks`);
      }
      return operations;
    }
    var isValidateOperationRange = process.env["DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES"] === "true";
    function validateAndAdd(operation, operations, checksum, index) {
      if (isValidateOperationRange && operations.length !== 0) {
        const lastOperation = operations[operations.length - 1];
        if (lastOperation.kind === operation.kind && operation.start < lastOperation.end && operation.start > lastOperation.start) {
          const min = [lastOperation.start, lastOperation.end, operation.start, operation.end].reduce((p, v) => p < v ? p : v);
          throw new Error(`operation (block index: ${index}, checksum: ${checksum}, kind: ${OperationKind[operation.kind]}) overlaps previous operation (checksum: ${checksum}):
abs: ${lastOperation.start} until ${lastOperation.end} and ${operation.start} until ${operation.end}
rel: ${lastOperation.start - min} until ${lastOperation.end - min} and ${operation.start - min} until ${operation.end - min}`);
        }
      }
      operations.push(operation);
    }
    function buildChecksumMap(file, fileOffset, logger) {
      const checksumToOffset = /* @__PURE__ */ new Map();
      const checksumToSize = /* @__PURE__ */ new Map();
      let offset = fileOffset;
      for (let i = 0; i < file.checksums.length; i++) {
        const checksum = file.checksums[i];
        const size = file.sizes[i];
        const existing = checksumToSize.get(checksum);
        if (existing === void 0) {
          checksumToOffset.set(checksum, offset);
          checksumToSize.set(checksum, size);
        } else if (logger.debug != null) {
          const sizeExplanation = existing === size ? "(same size)" : `(size: ${existing}, this size: ${size})`;
          logger.debug(`${checksum} duplicated in blockmap ${sizeExplanation}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
        }
        offset += size;
      }
      return { checksumToOffset, checksumToOldSize: checksumToSize };
    }
    function buildBlockFileMap(list) {
      const result = /* @__PURE__ */ new Map();
      for (const item of list) {
        result.set(item.name, item);
      }
      return result;
    }
  }
});

// node_modules/electron-updater/out/differentialDownloader/DataSplitter.js
var require_DataSplitter = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/DataSplitter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DataSplitter = void 0;
    exports2.copyData = copyData;
    var builder_util_runtime_1 = require_out();
    var fs_1 = require("fs");
    var stream_1 = require("stream");
    var downloadPlanBuilder_1 = require_downloadPlanBuilder();
    var DOUBLE_CRLF = Buffer.from("\r\n\r\n");
    var ReadState;
    (function(ReadState2) {
      ReadState2[ReadState2["INIT"] = 0] = "INIT";
      ReadState2[ReadState2["HEADER"] = 1] = "HEADER";
      ReadState2[ReadState2["BODY"] = 2] = "BODY";
    })(ReadState || (ReadState = {}));
    function copyData(task, out, oldFileFd, reject, resolve) {
      const readStream = (0, fs_1.createReadStream)("", {
        fd: oldFileFd,
        autoClose: false,
        start: task.start,
        // end is inclusive
        end: task.end - 1
      });
      readStream.on("error", reject);
      readStream.once("end", resolve);
      readStream.pipe(out, {
        end: false
      });
    }
    var DataSplitter = class extends stream_1.Writable {
      constructor(out, options, partIndexToTaskIndex, boundary, partIndexToLength, finishHandler, grandTotalBytes, onProgress) {
        super();
        this.out = out;
        this.options = options;
        this.partIndexToTaskIndex = partIndexToTaskIndex;
        this.partIndexToLength = partIndexToLength;
        this.finishHandler = finishHandler;
        this.grandTotalBytes = grandTotalBytes;
        this.onProgress = onProgress;
        this.start = Date.now();
        this.nextUpdate = this.start + 1e3;
        this.transferred = 0;
        this.delta = 0;
        this.partIndex = -1;
        this.headerListBuffer = null;
        this.readState = ReadState.INIT;
        this.ignoreByteCount = 0;
        this.remainingPartDataCount = 0;
        this.actualPartLength = 0;
        this.boundaryLength = boundary.length + 4;
        this.ignoreByteCount = this.boundaryLength - 2;
      }
      get isFinished() {
        return this.partIndex === this.partIndexToLength.length;
      }
      // noinspection JSUnusedGlobalSymbols
      _write(data, encoding, callback) {
        if (this.isFinished) {
          console.error(`Trailing ignored data: ${data.length} bytes`);
          return;
        }
        this.handleData(data).then(() => {
          if (this.onProgress) {
            const now = Date.now();
            if ((now >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (now - this.start) / 1e3) {
              this.nextUpdate = now + 1e3;
              this.onProgress({
                total: this.grandTotalBytes,
                delta: this.delta,
                transferred: this.transferred,
                percent: this.transferred / this.grandTotalBytes * 100,
                bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
              });
              this.delta = 0;
            }
          }
          callback();
        }).catch(callback);
      }
      async handleData(chunk) {
        let start = 0;
        if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0) {
          throw (0, builder_util_runtime_1.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
        }
        if (this.ignoreByteCount > 0) {
          const toIgnore = Math.min(this.ignoreByteCount, chunk.length);
          this.ignoreByteCount -= toIgnore;
          start = toIgnore;
        } else if (this.remainingPartDataCount > 0) {
          const toRead = Math.min(this.remainingPartDataCount, chunk.length);
          this.remainingPartDataCount -= toRead;
          await this.processPartData(chunk, 0, toRead);
          start = toRead;
        }
        if (start === chunk.length) {
          return;
        }
        if (this.readState === ReadState.HEADER) {
          const headerListEnd = this.searchHeaderListEnd(chunk, start);
          if (headerListEnd === -1) {
            return;
          }
          start = headerListEnd;
          this.readState = ReadState.BODY;
          this.headerListBuffer = null;
        }
        while (true) {
          if (this.readState === ReadState.BODY) {
            this.readState = ReadState.INIT;
          } else {
            this.partIndex++;
            let taskIndex = this.partIndexToTaskIndex.get(this.partIndex);
            if (taskIndex == null) {
              if (this.isFinished) {
                taskIndex = this.options.end;
              } else {
                throw (0, builder_util_runtime_1.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
              }
            }
            const prevTaskIndex = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (prevTaskIndex < taskIndex) {
              await this.copyExistingData(prevTaskIndex, taskIndex);
            } else if (prevTaskIndex > taskIndex) {
              throw (0, builder_util_runtime_1.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            }
            if (this.isFinished) {
              this.onPartEnd();
              this.finishHandler();
              return;
            }
            start = this.searchHeaderListEnd(chunk, start);
            if (start === -1) {
              this.readState = ReadState.HEADER;
              return;
            }
          }
          const partLength = this.partIndexToLength[this.partIndex];
          const end = start + partLength;
          const effectiveEnd = Math.min(end, chunk.length);
          await this.processPartStarted(chunk, start, effectiveEnd);
          this.remainingPartDataCount = partLength - (effectiveEnd - start);
          if (this.remainingPartDataCount > 0) {
            return;
          }
          start = end + this.boundaryLength;
          if (start >= chunk.length) {
            this.ignoreByteCount = this.boundaryLength - (chunk.length - end);
            return;
          }
        }
      }
      copyExistingData(index, end) {
        return new Promise((resolve, reject) => {
          const w = () => {
            if (index === end) {
              resolve();
              return;
            }
            const task = this.options.tasks[index];
            if (task.kind !== downloadPlanBuilder_1.OperationKind.COPY) {
              reject(new Error("Task kind must be COPY"));
              return;
            }
            copyData(task, this.out, this.options.oldFileFd, reject, () => {
              index++;
              w();
            });
          };
          w();
        });
      }
      searchHeaderListEnd(chunk, readOffset) {
        const headerListEnd = chunk.indexOf(DOUBLE_CRLF, readOffset);
        if (headerListEnd !== -1) {
          return headerListEnd + DOUBLE_CRLF.length;
        }
        const partialChunk = readOffset === 0 ? chunk : chunk.slice(readOffset);
        if (this.headerListBuffer == null) {
          this.headerListBuffer = partialChunk;
        } else {
          this.headerListBuffer = Buffer.concat([this.headerListBuffer, partialChunk]);
        }
        return -1;
      }
      onPartEnd() {
        const expectedLength = this.partIndexToLength[this.partIndex - 1];
        if (this.actualPartLength !== expectedLength) {
          throw (0, builder_util_runtime_1.newError)(`Expected length: ${expectedLength} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
        }
        this.actualPartLength = 0;
      }
      processPartStarted(data, start, end) {
        if (this.partIndex !== 0) {
          this.onPartEnd();
        }
        return this.processPartData(data, start, end);
      }
      processPartData(data, start, end) {
        this.actualPartLength += end - start;
        this.transferred += end - start;
        this.delta += end - start;
        const out = this.out;
        if (out.write(start === 0 && data.length === end ? data : data.slice(start, end))) {
          return Promise.resolve();
        } else {
          return new Promise((resolve, reject) => {
            out.on("error", reject);
            out.once("drain", () => {
              out.removeListener("error", reject);
              resolve();
            });
          });
        }
      }
    };
    exports2.DataSplitter = DataSplitter;
  }
});

// node_modules/electron-updater/out/differentialDownloader/multipleRangeDownloader.js
var require_multipleRangeDownloader = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/multipleRangeDownloader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.executeTasksUsingMultipleRangeRequests = executeTasksUsingMultipleRangeRequests;
    exports2.checkIsRangesSupported = checkIsRangesSupported;
    var builder_util_runtime_1 = require_out();
    var DataSplitter_1 = require_DataSplitter();
    var downloadPlanBuilder_1 = require_downloadPlanBuilder();
    function executeTasksUsingMultipleRangeRequests(differentialDownloader, tasks, out, oldFileFd, reject) {
      const w = (taskOffset) => {
        if (taskOffset >= tasks.length) {
          if (differentialDownloader.fileMetadataBuffer != null) {
            out.write(differentialDownloader.fileMetadataBuffer);
          }
          out.end();
          return;
        }
        const nextOffset = taskOffset + 1e3;
        doExecuteTasks(differentialDownloader, {
          tasks,
          start: taskOffset,
          end: Math.min(tasks.length, nextOffset),
          oldFileFd
        }, out, () => w(nextOffset), reject);
      };
      return w;
    }
    function doExecuteTasks(differentialDownloader, options, out, resolve, reject) {
      let ranges = "bytes=";
      let partCount = 0;
      let grandTotalBytes = 0;
      const partIndexToTaskIndex = /* @__PURE__ */ new Map();
      const partIndexToLength = [];
      for (let i = options.start; i < options.end; i++) {
        const task = options.tasks[i];
        if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
          ranges += `${task.start}-${task.end - 1}, `;
          partIndexToTaskIndex.set(partCount, i);
          partCount++;
          partIndexToLength.push(task.end - task.start);
          grandTotalBytes += task.end - task.start;
        }
      }
      if (partCount <= 1) {
        const w = (index) => {
          if (index >= options.end) {
            resolve();
            return;
          }
          const task = options.tasks[index++];
          if (task.kind === downloadPlanBuilder_1.OperationKind.COPY) {
            (0, DataSplitter_1.copyData)(task, out, options.oldFileFd, reject, () => w(index));
          } else {
            const requestOptions2 = differentialDownloader.createRequestOptions();
            requestOptions2.headers.Range = `bytes=${task.start}-${task.end - 1}`;
            const request2 = differentialDownloader.httpExecutor.createRequest(requestOptions2, (response) => {
              response.on("error", reject);
              if (!checkIsRangesSupported(response, reject)) {
                return;
              }
              response.pipe(out, {
                end: false
              });
              response.once("end", () => w(index));
            });
            differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request2, reject);
            request2.end();
          }
        };
        w(options.start);
        return;
      }
      const requestOptions = differentialDownloader.createRequestOptions();
      requestOptions.headers.Range = ranges.substring(0, ranges.length - 2);
      const request = differentialDownloader.httpExecutor.createRequest(requestOptions, (response) => {
        if (!checkIsRangesSupported(response, reject)) {
          return;
        }
        const contentType = (0, builder_util_runtime_1.safeGetHeader)(response, "content-type");
        const m = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(contentType);
        if (m == null) {
          reject(new Error(`Content-Type "multipart/byteranges" is expected, but got "${contentType}"`));
          return;
        }
        const dicer = new DataSplitter_1.DataSplitter(out, options, partIndexToTaskIndex, m[1] || m[2], partIndexToLength, resolve, grandTotalBytes, differentialDownloader.options.onProgress);
        dicer.on("error", reject);
        response.pipe(dicer);
        response.on("end", () => {
          setTimeout(() => {
            request.abort();
            reject(new Error("Response ends without calling any handlers"));
          }, 1e4);
        });
      });
      differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
      request.end();
    }
    function checkIsRangesSupported(response, reject) {
      if (response.statusCode >= 400) {
        reject((0, builder_util_runtime_1.createHttpError)(response));
        return false;
      }
      if (response.statusCode !== 206) {
        const acceptRanges = (0, builder_util_runtime_1.safeGetHeader)(response, "accept-ranges");
        if (acceptRanges == null || acceptRanges === "none") {
          reject(new Error(`Server doesn't support Accept-Ranges (response code ${response.statusCode})`));
          return false;
        }
      }
      return true;
    }
  }
});

// node_modules/electron-updater/out/differentialDownloader/ProgressDifferentialDownloadCallbackTransform.js
var require_ProgressDifferentialDownloadCallbackTransform = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/ProgressDifferentialDownloadCallbackTransform.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProgressDifferentialDownloadCallbackTransform = void 0;
    var stream_1 = require("stream");
    var OperationKind;
    (function(OperationKind2) {
      OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
      OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
    })(OperationKind || (OperationKind = {}));
    var ProgressDifferentialDownloadCallbackTransform = class extends stream_1.Transform {
      constructor(progressDifferentialDownloadInfo, cancellationToken, onProgress) {
        super();
        this.progressDifferentialDownloadInfo = progressDifferentialDownloadInfo;
        this.cancellationToken = cancellationToken;
        this.onProgress = onProgress;
        this.start = Date.now();
        this.transferred = 0;
        this.delta = 0;
        this.expectedBytes = 0;
        this.index = 0;
        this.operationType = OperationKind.COPY;
        this.nextUpdate = this.start + 1e3;
      }
      _transform(chunk, encoding, callback) {
        if (this.cancellationToken.cancelled) {
          callback(new Error("cancelled"), null);
          return;
        }
        if (this.operationType == OperationKind.COPY) {
          callback(null, chunk);
          return;
        }
        this.transferred += chunk.length;
        this.delta += chunk.length;
        const now = Date.now();
        if (now >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
          this.nextUpdate = now + 1e3;
          this.onProgress({
            total: this.progressDifferentialDownloadInfo.grandTotal,
            delta: this.delta,
            transferred: this.transferred,
            percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
            bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
          });
          this.delta = 0;
        }
        callback(null, chunk);
      }
      beginFileCopy() {
        this.operationType = OperationKind.COPY;
      }
      beginRangeDownload() {
        this.operationType = OperationKind.DOWNLOAD;
        this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
      }
      endRangeDownload() {
        if (this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
          this.onProgress({
            total: this.progressDifferentialDownloadInfo.grandTotal,
            delta: this.delta,
            transferred: this.transferred,
            percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
            bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
          });
        }
      }
      // Called when we are 100% done with the connection/download
      _flush(callback) {
        if (this.cancellationToken.cancelled) {
          callback(new Error("cancelled"));
          return;
        }
        this.onProgress({
          total: this.progressDifferentialDownloadInfo.grandTotal,
          delta: this.delta,
          transferred: this.transferred,
          percent: 100,
          bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
        });
        this.delta = 0;
        this.transferred = 0;
        callback(null);
      }
    };
    exports2.ProgressDifferentialDownloadCallbackTransform = ProgressDifferentialDownloadCallbackTransform;
  }
});

// node_modules/electron-updater/out/differentialDownloader/DifferentialDownloader.js
var require_DifferentialDownloader = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/DifferentialDownloader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DifferentialDownloader = void 0;
    var builder_util_runtime_1 = require_out();
    var fs_extra_1 = require_lib();
    var fs_1 = require("fs");
    var DataSplitter_1 = require_DataSplitter();
    var url_1 = require("url");
    var downloadPlanBuilder_1 = require_downloadPlanBuilder();
    var multipleRangeDownloader_1 = require_multipleRangeDownloader();
    var ProgressDifferentialDownloadCallbackTransform_1 = require_ProgressDifferentialDownloadCallbackTransform();
    var DifferentialDownloader = class {
      // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
      constructor(blockAwareFileInfo, httpExecutor, options) {
        this.blockAwareFileInfo = blockAwareFileInfo;
        this.httpExecutor = httpExecutor;
        this.options = options;
        this.fileMetadataBuffer = null;
        this.logger = options.logger;
      }
      createRequestOptions() {
        const result = {
          headers: {
            ...this.options.requestHeaders,
            accept: "*/*"
          }
        };
        (0, builder_util_runtime_1.configureRequestUrl)(this.options.newUrl, result);
        (0, builder_util_runtime_1.configureRequestOptions)(result);
        return result;
      }
      doDownload(oldBlockMap, newBlockMap) {
        if (oldBlockMap.version !== newBlockMap.version) {
          throw new Error(`version is different (${oldBlockMap.version} - ${newBlockMap.version}), full download is required`);
        }
        const logger = this.logger;
        const operations = (0, downloadPlanBuilder_1.computeOperations)(oldBlockMap, newBlockMap, logger);
        if (logger.debug != null) {
          logger.debug(JSON.stringify(operations, null, 2));
        }
        let downloadSize = 0;
        let copySize = 0;
        for (const operation of operations) {
          const length = operation.end - operation.start;
          if (operation.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
            downloadSize += length;
          } else {
            copySize += length;
          }
        }
        const newSize = this.blockAwareFileInfo.size;
        if (downloadSize + copySize + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== newSize) {
          throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newSize: ${newSize}`);
        }
        logger.info(`Full: ${formatBytes(newSize)}, To download: ${formatBytes(downloadSize)} (${Math.round(downloadSize / (newSize / 100))}%)`);
        return this.downloadFile(operations);
      }
      downloadFile(tasks) {
        const fdList = [];
        const closeFiles = () => {
          return Promise.all(fdList.map((openedFile) => {
            return (0, fs_extra_1.close)(openedFile.descriptor).catch((e) => {
              this.logger.error(`cannot close file "${openedFile.path}": ${e}`);
            });
          }));
        };
        return this.doDownloadFile(tasks, fdList).then(closeFiles).catch((e) => {
          return closeFiles().catch((closeFilesError) => {
            try {
              this.logger.error(`cannot close files: ${closeFilesError}`);
            } catch (errorOnLog) {
              try {
                console.error(errorOnLog);
              } catch (_ignored) {
              }
            }
            throw e;
          }).then(() => {
            throw e;
          });
        });
      }
      async doDownloadFile(tasks, fdList) {
        const oldFileFd = await (0, fs_extra_1.open)(this.options.oldFile, "r");
        fdList.push({ descriptor: oldFileFd, path: this.options.oldFile });
        const newFileFd = await (0, fs_extra_1.open)(this.options.newFile, "w");
        fdList.push({ descriptor: newFileFd, path: this.options.newFile });
        const fileOut = (0, fs_1.createWriteStream)(this.options.newFile, { fd: newFileFd });
        await new Promise((resolve, reject) => {
          const streams = [];
          let downloadInfoTransform = void 0;
          if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
            const expectedByteCounts = [];
            let grandTotalBytes = 0;
            for (const task of tasks) {
              if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
                expectedByteCounts.push(task.end - task.start);
                grandTotalBytes += task.end - task.start;
              }
            }
            const progressDifferentialDownloadInfo = {
              expectedByteCounts,
              grandTotal: grandTotalBytes
            };
            downloadInfoTransform = new ProgressDifferentialDownloadCallbackTransform_1.ProgressDifferentialDownloadCallbackTransform(progressDifferentialDownloadInfo, this.options.cancellationToken, this.options.onProgress);
            streams.push(downloadInfoTransform);
          }
          const digestTransform = new builder_util_runtime_1.DigestTransform(this.blockAwareFileInfo.sha512);
          digestTransform.isValidateOnEnd = false;
          streams.push(digestTransform);
          fileOut.on("finish", () => {
            ;
            fileOut.close(() => {
              fdList.splice(1, 1);
              try {
                digestTransform.validate();
              } catch (e) {
                reject(e);
                return;
              }
              resolve(void 0);
            });
          });
          streams.push(fileOut);
          let lastStream = null;
          for (const stream of streams) {
            stream.on("error", reject);
            if (lastStream == null) {
              lastStream = stream;
            } else {
              lastStream = lastStream.pipe(stream);
            }
          }
          const firstStream = streams[0];
          let w;
          if (this.options.isUseMultipleRangeRequest) {
            w = (0, multipleRangeDownloader_1.executeTasksUsingMultipleRangeRequests)(this, tasks, firstStream, oldFileFd, reject);
            w(0);
            return;
          }
          let downloadOperationCount = 0;
          let actualUrl = null;
          this.logger.info(`Differential download: ${this.options.newUrl}`);
          const requestOptions = this.createRequestOptions();
          requestOptions.redirect = "manual";
          w = (index) => {
            var _a, _b;
            if (index >= tasks.length) {
              if (this.fileMetadataBuffer != null) {
                firstStream.write(this.fileMetadataBuffer);
              }
              firstStream.end();
              return;
            }
            const operation = tasks[index++];
            if (operation.kind === downloadPlanBuilder_1.OperationKind.COPY) {
              if (downloadInfoTransform) {
                downloadInfoTransform.beginFileCopy();
              }
              (0, DataSplitter_1.copyData)(operation, firstStream, oldFileFd, reject, () => w(index));
              return;
            }
            const range = `bytes=${operation.start}-${operation.end - 1}`;
            requestOptions.headers.range = range;
            (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, `download range: ${range}`);
            if (downloadInfoTransform) {
              downloadInfoTransform.beginRangeDownload();
            }
            const request = this.httpExecutor.createRequest(requestOptions, (response) => {
              response.on("error", reject);
              response.on("aborted", () => {
                reject(new Error("response has been aborted by the server"));
              });
              if (response.statusCode >= 400) {
                reject((0, builder_util_runtime_1.createHttpError)(response));
              }
              response.pipe(firstStream, {
                end: false
              });
              response.once("end", () => {
                if (downloadInfoTransform) {
                  downloadInfoTransform.endRangeDownload();
                }
                if (++downloadOperationCount === 100) {
                  downloadOperationCount = 0;
                  setTimeout(() => w(index), 1e3);
                } else {
                  w(index);
                }
              });
            });
            request.on("redirect", (statusCode, method, redirectUrl) => {
              this.logger.info(`Redirect to ${removeQuery(redirectUrl)}`);
              actualUrl = redirectUrl;
              (0, builder_util_runtime_1.configureRequestUrl)(new url_1.URL(actualUrl), requestOptions);
              request.followRedirect();
            });
            this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
            request.end();
          };
          w(0);
        });
      }
      async readRemoteBytes(start, endInclusive) {
        const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
        const requestOptions = this.createRequestOptions();
        requestOptions.headers.range = `bytes=${start}-${endInclusive}`;
        let position = 0;
        await this.request(requestOptions, (chunk) => {
          chunk.copy(buffer, position);
          position += chunk.length;
        });
        if (position !== buffer.length) {
          throw new Error(`Received data length ${position} is not equal to expected ${buffer.length}`);
        }
        return buffer;
      }
      request(requestOptions, dataHandler) {
        return new Promise((resolve, reject) => {
          const request = this.httpExecutor.createRequest(requestOptions, (response) => {
            if (!(0, multipleRangeDownloader_1.checkIsRangesSupported)(response, reject)) {
              return;
            }
            response.on("error", reject);
            response.on("aborted", () => {
              reject(new Error("response has been aborted by the server"));
            });
            response.on("data", dataHandler);
            response.on("end", () => resolve());
          });
          this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
          request.end();
        });
      }
    };
    exports2.DifferentialDownloader = DifferentialDownloader;
    function formatBytes(value, symbol = " KB") {
      return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
    }
    function removeQuery(url) {
      const index = url.indexOf("?");
      return index < 0 ? url : url.substring(0, index);
    }
  }
});

// node_modules/electron-updater/out/differentialDownloader/GenericDifferentialDownloader.js
var require_GenericDifferentialDownloader = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/GenericDifferentialDownloader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.GenericDifferentialDownloader = void 0;
    var DifferentialDownloader_1 = require_DifferentialDownloader();
    var GenericDifferentialDownloader = class extends DifferentialDownloader_1.DifferentialDownloader {
      download(oldBlockMap, newBlockMap) {
        return this.doDownload(oldBlockMap, newBlockMap);
      }
    };
    exports2.GenericDifferentialDownloader = GenericDifferentialDownloader;
  }
});

// node_modules/electron-updater/out/types.js
var require_types = __commonJS({
  "node_modules/electron-updater/out/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.UpdaterSignal = exports2.UPDATE_DOWNLOADED = exports2.DOWNLOAD_PROGRESS = exports2.CancellationToken = void 0;
    exports2.addHandler = addHandler;
    var builder_util_runtime_1 = require_out();
    Object.defineProperty(exports2, "CancellationToken", { enumerable: true, get: function() {
      return builder_util_runtime_1.CancellationToken;
    } });
    exports2.DOWNLOAD_PROGRESS = "download-progress";
    exports2.UPDATE_DOWNLOADED = "update-downloaded";
    var UpdaterSignal = class {
      constructor(emitter) {
        this.emitter = emitter;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(handler) {
        addHandler(this.emitter, "login", handler);
      }
      progress(handler) {
        addHandler(this.emitter, exports2.DOWNLOAD_PROGRESS, handler);
      }
      updateDownloaded(handler) {
        addHandler(this.emitter, exports2.UPDATE_DOWNLOADED, handler);
      }
      updateCancelled(handler) {
        addHandler(this.emitter, "update-cancelled", handler);
      }
    };
    exports2.UpdaterSignal = UpdaterSignal;
    var isLogEvent = false;
    function addHandler(emitter, event, handler) {
      if (isLogEvent) {
        emitter.on(event, (...args) => {
          console.log("%s %s", event, args);
          handler(...args);
        });
      } else {
        emitter.on(event, handler);
      }
    }
  }
});

// node_modules/electron-updater/out/AppUpdater.js
var require_AppUpdater = __commonJS({
  "node_modules/electron-updater/out/AppUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NoOpLogger = exports2.AppUpdater = void 0;
    var builder_util_runtime_1 = require_out();
    var crypto_1 = require("crypto");
    var os_1 = require("os");
    var events_1 = require("events");
    var fs_extra_1 = require_lib();
    var js_yaml_1 = require_js_yaml();
    var lazy_val_1 = require_main();
    var path6 = require("path");
    var semver_1 = require_semver2();
    var DownloadedUpdateHelper_1 = require_DownloadedUpdateHelper();
    var ElectronAppAdapter_1 = require_ElectronAppAdapter();
    var electronHttpExecutor_1 = require_electronHttpExecutor();
    var GenericProvider_1 = require_GenericProvider();
    var providerFactory_1 = require_providerFactory();
    var zlib_1 = require("zlib");
    var GenericDifferentialDownloader_1 = require_GenericDifferentialDownloader();
    var types_1 = require_types();
    var AppUpdater = class _AppUpdater extends events_1.EventEmitter {
      /**
       * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
       */
      get channel() {
        return this._channel;
      }
      /**
       * Set the update channel. Overrides `channel` in the update configuration.
       *
       * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
       */
      set channel(value) {
        if (this._channel != null) {
          if (typeof value !== "string") {
            throw (0, builder_util_runtime_1.newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
          } else if (value.length === 0) {
            throw (0, builder_util_runtime_1.newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
          }
        }
        this._channel = value;
        this.allowDowngrade = true;
      }
      /**
       *  Shortcut for explicitly adding auth tokens to request headers
       */
      addAuthHeader(token) {
        this.requestHeaders = Object.assign({}, this.requestHeaders, {
          authorization: token
        });
      }
      // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
      get netSession() {
        return (0, electronHttpExecutor_1.getNetSession)();
      }
      /**
       * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
       * Set it to `null` if you would like to disable a logging feature.
       */
      get logger() {
        return this._logger;
      }
      set logger(value) {
        this._logger = value == null ? new NoOpLogger() : value;
      }
      // noinspection JSUnusedGlobalSymbols
      /**
       * test only
       * @private
       */
      set updateConfigPath(value) {
        this.clientPromise = null;
        this._appUpdateConfigPath = value;
        this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
      }
      /**
       * Allows developer to override default logic for determining if an update is supported.
       * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
       */
      get isUpdateSupported() {
        return this._isUpdateSupported;
      }
      set isUpdateSupported(value) {
        if (value) {
          this._isUpdateSupported = value;
        }
      }
      /**
       * Allows developer to override default logic for determining if the user is below the rollout threshold.
       * The default logic compares the staging percentage with numerical representation of user ID.
       * An override can define custom logic, or bypass it if needed.
       */
      get isUserWithinRollout() {
        return this._isUserWithinRollout;
      }
      set isUserWithinRollout(value) {
        if (value) {
          this._isUserWithinRollout = value;
        }
      }
      constructor(options, app2) {
        super();
        this.autoDownload = true;
        this.autoInstallOnAppQuit = true;
        this.autoRunAppAfterInstall = true;
        this.allowPrerelease = false;
        this.fullChangelog = false;
        this.allowDowngrade = false;
        this.disableWebInstaller = false;
        this.disableDifferentialDownload = false;
        this.forceDevUpdateConfig = false;
        this.previousBlockmapBaseUrlOverride = null;
        this._channel = null;
        this.downloadedUpdateHelper = null;
        this.requestHeaders = null;
        this._logger = console;
        this.signals = new types_1.UpdaterSignal(this);
        this._appUpdateConfigPath = null;
        this._isUpdateSupported = (updateInfo) => this.checkIfUpdateSupported(updateInfo);
        this._isUserWithinRollout = (updateInfo) => this.isStagingMatch(updateInfo);
        this.clientPromise = null;
        this.stagingUserIdPromise = new lazy_val_1.Lazy(() => this.getOrCreateStagingUserId());
        this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
        this.checkForUpdatesPromise = null;
        this.downloadPromise = null;
        this.updateInfoAndProvider = null;
        this._testOnlyOptions = null;
        this.on("error", (error) => {
          this._logger.error(`Error: ${error.stack || error.message}`);
        });
        if (app2 == null) {
          this.app = new ElectronAppAdapter_1.ElectronAppAdapter();
          this.httpExecutor = new electronHttpExecutor_1.ElectronHttpExecutor((authInfo, callback) => this.emit("login", authInfo, callback));
        } else {
          this.app = app2;
          this.httpExecutor = null;
        }
        const currentVersionString = this.app.version;
        const currentVersion = (0, semver_1.parse)(currentVersionString);
        if (currentVersion == null) {
          throw (0, builder_util_runtime_1.newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
        }
        this.currentVersion = currentVersion;
        this.allowPrerelease = hasPrereleaseComponents(currentVersion);
        if (options != null) {
          this.setFeedURL(options);
          if (typeof options !== "string" && options.requestHeaders) {
            this.requestHeaders = options.requestHeaders;
          }
        }
      }
      //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
      getFeedURL() {
        return "Deprecated. Do not use it.";
      }
      /**
       * Configure update provider. If value is `string`, [GenericServerOptions](https://www.electron.build/publish#genericserveroptions) will be set with value as `url`.
       * @param options If you want to override configuration in the `app-update.yml`.
       */
      setFeedURL(options) {
        const runtimeOptions = this.createProviderRuntimeOptions();
        let provider;
        if (typeof options === "string") {
          provider = new GenericProvider_1.GenericProvider({ provider: "generic", url: options }, this, {
            ...runtimeOptions,
            isUseMultipleRangeRequest: (0, providerFactory_1.isUrlProbablySupportMultiRangeRequests)(options)
          });
        } else {
          provider = (0, providerFactory_1.createClient)(options, this, runtimeOptions);
        }
        this.clientPromise = Promise.resolve(provider);
      }
      /**
       * Asks the server whether there is an update.
       * @returns null if the updater is disabled, otherwise info about the latest version
       */
      checkForUpdates() {
        if (!this.isUpdaterActive()) {
          return Promise.resolve(null);
        }
        let checkForUpdatesPromise = this.checkForUpdatesPromise;
        if (checkForUpdatesPromise != null) {
          this._logger.info("Checking for update (already in progress)");
          return checkForUpdatesPromise;
        }
        const nullizePromise = () => this.checkForUpdatesPromise = null;
        this._logger.info("Checking for update");
        checkForUpdatesPromise = this.doCheckForUpdates().then((it) => {
          nullizePromise();
          return it;
        }).catch((e) => {
          nullizePromise();
          this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
          throw e;
        });
        this.checkForUpdatesPromise = checkForUpdatesPromise;
        return checkForUpdatesPromise;
      }
      isUpdaterActive() {
        const isEnabled = this.app.isPackaged || this.forceDevUpdateConfig;
        if (!isEnabled) {
          this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
          return false;
        }
        return true;
      }
      // noinspection JSUnusedGlobalSymbols
      checkForUpdatesAndNotify(downloadNotification) {
        return this.checkForUpdates().then((it) => {
          if (!(it === null || it === void 0 ? void 0 : it.downloadPromise)) {
            if (this._logger.debug != null) {
              this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null");
            }
            return it;
          }
          void it.downloadPromise.then(() => {
            const notificationContent = _AppUpdater.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
            new (require("electron")).Notification(notificationContent).show();
          });
          return it;
        });
      }
      static formatDownloadNotification(version, appName, downloadNotification) {
        if (downloadNotification == null) {
          downloadNotification = {
            title: "A new update is ready to install",
            body: `{appName} version {version} has been downloaded and will be automatically installed on exit`
          };
        }
        downloadNotification = {
          title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
          body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version)
        };
        return downloadNotification;
      }
      async isStagingMatch(updateInfo) {
        const rawStagingPercentage = updateInfo.stagingPercentage;
        let stagingPercentage = rawStagingPercentage;
        if (stagingPercentage == null) {
          return true;
        }
        stagingPercentage = parseInt(stagingPercentage, 10);
        if (isNaN(stagingPercentage)) {
          this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);
          return true;
        }
        stagingPercentage = stagingPercentage / 100;
        const stagingUserId = await this.stagingUserIdPromise.value;
        const val = builder_util_runtime_1.UUID.parse(stagingUserId).readUInt32BE(12);
        const percentage = val / 4294967295;
        this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);
        return percentage < stagingPercentage;
      }
      computeFinalHeaders(headers) {
        if (this.requestHeaders != null) {
          Object.assign(headers, this.requestHeaders);
        }
        return headers;
      }
      async isUpdateAvailable(updateInfo) {
        const latestVersion = (0, semver_1.parse)(updateInfo.version);
        if (latestVersion == null) {
          throw (0, builder_util_runtime_1.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
        }
        const currentVersion = this.currentVersion;
        if ((0, semver_1.eq)(latestVersion, currentVersion)) {
          return false;
        }
        if (!await Promise.resolve(this.isUpdateSupported(updateInfo))) {
          return false;
        }
        const isUserWithinRollout = await Promise.resolve(this.isUserWithinRollout(updateInfo));
        if (!isUserWithinRollout) {
          return false;
        }
        const isLatestVersionNewer = (0, semver_1.gt)(latestVersion, currentVersion);
        const isLatestVersionOlder = (0, semver_1.lt)(latestVersion, currentVersion);
        if (isLatestVersionNewer) {
          return true;
        }
        return this.allowDowngrade && isLatestVersionOlder;
      }
      checkIfUpdateSupported(updateInfo) {
        const minimumSystemVersion = updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.minimumSystemVersion;
        const currentOSVersion = (0, os_1.release)();
        if (minimumSystemVersion) {
          try {
            if ((0, semver_1.lt)(currentOSVersion, minimumSystemVersion)) {
              this._logger.info(`Current OS version ${currentOSVersion} is less than the minimum OS version required ${minimumSystemVersion} for version ${currentOSVersion}`);
              return false;
            }
          } catch (e) {
            this._logger.warn(`Failed to compare current OS version(${currentOSVersion}) with minimum OS version(${minimumSystemVersion}): ${(e.message || e).toString()}`);
          }
        }
        return true;
      }
      async getUpdateInfoAndProvider() {
        await this.app.whenReady();
        if (this.clientPromise == null) {
          this.clientPromise = this.configOnDisk.value.then((it) => (0, providerFactory_1.createClient)(it, this, this.createProviderRuntimeOptions()));
        }
        const client = await this.clientPromise;
        const stagingUserId = await this.stagingUserIdPromise.value;
        client.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": stagingUserId }));
        return {
          info: await client.getLatestVersion(),
          provider: client
        };
      }
      createProviderRuntimeOptions() {
        return {
          isUseMultipleRangeRequest: true,
          platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
          executor: this.httpExecutor
        };
      }
      async doCheckForUpdates() {
        this.emit("checking-for-update");
        const result = await this.getUpdateInfoAndProvider();
        const updateInfo = result.info;
        if (!await this.isUpdateAvailable(updateInfo)) {
          this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);
          this.emit("update-not-available", updateInfo);
          return {
            isUpdateAvailable: false,
            versionInfo: updateInfo,
            updateInfo
          };
        }
        this.updateInfoAndProvider = result;
        this.onUpdateAvailable(updateInfo);
        const cancellationToken = new builder_util_runtime_1.CancellationToken();
        return {
          isUpdateAvailable: true,
          versionInfo: updateInfo,
          updateInfo,
          cancellationToken,
          downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null
        };
      }
      onUpdateAvailable(updateInfo) {
        this._logger.info(`Found version ${updateInfo.version} (url: ${(0, builder_util_runtime_1.asArray)(updateInfo.files).map((it) => it.url).join(", ")})`);
        this.emit("update-available", updateInfo);
      }
      /**
       * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
       * @returns {Promise<Array<string>>} Paths to downloaded files.
       */
      downloadUpdate(cancellationToken = new builder_util_runtime_1.CancellationToken()) {
        const updateInfoAndProvider = this.updateInfoAndProvider;
        if (updateInfoAndProvider == null) {
          const error = new Error("Please check update first");
          this.dispatchError(error);
          return Promise.reject(error);
        }
        if (this.downloadPromise != null) {
          this._logger.info("Downloading update (already in progress)");
          return this.downloadPromise;
        }
        this._logger.info(`Downloading update from ${(0, builder_util_runtime_1.asArray)(updateInfoAndProvider.info.files).map((it) => it.url).join(", ")}`);
        const errorHandler = (e) => {
          if (!(e instanceof builder_util_runtime_1.CancellationError)) {
            try {
              this.dispatchError(e);
            } catch (nestedError) {
              this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
            }
          }
          return e;
        };
        this.downloadPromise = this.doDownloadUpdate({
          updateInfoAndProvider,
          requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
          cancellationToken,
          disableWebInstaller: this.disableWebInstaller,
          disableDifferentialDownload: this.disableDifferentialDownload
        }).catch((e) => {
          throw errorHandler(e);
        }).finally(() => {
          this.downloadPromise = null;
        });
        return this.downloadPromise;
      }
      dispatchError(e) {
        this.emit("error", e, (e.stack || e).toString());
      }
      dispatchUpdateDownloaded(event) {
        this.emit(types_1.UPDATE_DOWNLOADED, event);
      }
      async loadUpdateConfig() {
        if (this._appUpdateConfigPath == null) {
          this._appUpdateConfigPath = this.app.appUpdateConfigPath;
        }
        return (0, js_yaml_1.load)(await (0, fs_extra_1.readFile)(this._appUpdateConfigPath, "utf-8"));
      }
      computeRequestHeaders(provider) {
        const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;
        if (fileExtraDownloadHeaders != null) {
          const requestHeaders = this.requestHeaders;
          return requestHeaders == null ? fileExtraDownloadHeaders : {
            ...fileExtraDownloadHeaders,
            ...requestHeaders
          };
        }
        return this.computeFinalHeaders({ accept: "*/*" });
      }
      async getOrCreateStagingUserId() {
        const file = path6.join(this.app.userDataPath, ".updaterId");
        try {
          const id2 = await (0, fs_extra_1.readFile)(file, "utf-8");
          if (builder_util_runtime_1.UUID.check(id2)) {
            return id2;
          } else {
            this._logger.warn(`Staging user id file exists, but content was invalid: ${id2}`);
          }
        } catch (e) {
          if (e.code !== "ENOENT") {
            this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
          }
        }
        const id = builder_util_runtime_1.UUID.v5((0, crypto_1.randomBytes)(4096), builder_util_runtime_1.UUID.OID);
        this._logger.info(`Generated new staging user ID: ${id}`);
        try {
          await (0, fs_extra_1.outputFile)(file, id);
        } catch (e) {
          this._logger.warn(`Couldn't write out staging user ID: ${e}`);
        }
        return id;
      }
      /** @internal */
      get isAddNoCacheQuery() {
        const headers = this.requestHeaders;
        if (headers == null) {
          return true;
        }
        for (const headerName of Object.keys(headers)) {
          const s = headerName.toLowerCase();
          if (s === "authorization" || s === "private-token") {
            return false;
          }
        }
        return true;
      }
      async getOrCreateDownloadHelper() {
        let result = this.downloadedUpdateHelper;
        if (result == null) {
          const dirName = (await this.configOnDisk.value).updaterCacheDirName;
          const logger = this._logger;
          if (dirName == null) {
            logger.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
          }
          const cacheDir = path6.join(this.app.baseCachePath, dirName || this.app.name);
          if (logger.debug != null) {
            logger.debug(`updater cache dir: ${cacheDir}`);
          }
          result = new DownloadedUpdateHelper_1.DownloadedUpdateHelper(cacheDir);
          this.downloadedUpdateHelper = result;
        }
        return result;
      }
      async executeDownload(taskOptions) {
        const fileInfo = taskOptions.fileInfo;
        const downloadOptions = {
          headers: taskOptions.downloadUpdateOptions.requestHeaders,
          cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
          sha2: fileInfo.info.sha2,
          sha512: fileInfo.info.sha512
        };
        if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
        }
        const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
        const version = updateInfo.version;
        const packageInfo = fileInfo.packageInfo;
        function getCacheUpdateFileName() {
          const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);
          if (urlPath.toLowerCase().endsWith(`.${taskOptions.fileExtension.toLowerCase()}`)) {
            return path6.basename(urlPath);
          } else {
            return path6.basename(taskOptions.fileInfo.info.url);
          }
        }
        const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
        const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
        await (0, fs_extra_1.mkdir)(cacheDir, { recursive: true });
        const updateFileName = getCacheUpdateFileName();
        let updateFile = path6.join(cacheDir, updateFileName);
        const packageFile = packageInfo == null ? null : path6.join(cacheDir, `package-${version}${path6.extname(packageInfo.path) || ".7z"}`);
        const done = async (isSaveCache) => {
          await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
          await taskOptions.done({
            ...updateInfo,
            downloadedFile: updateFile
          });
          const currentBlockMapFile = path6.join(cacheDir, "current.blockmap");
          if (await (0, fs_extra_1.pathExists)(currentBlockMapFile)) {
            await (0, fs_extra_1.copyFile)(currentBlockMapFile, path6.join(downloadedUpdateHelper.cacheDir, "current.blockmap"));
          }
          return packageFile == null ? [updateFile] : [updateFile, packageFile];
        };
        const log = this._logger;
        const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);
        if (cachedUpdateFile != null) {
          updateFile = cachedUpdateFile;
          return await done(false);
        }
        const removeFileIfAny = async () => {
          await downloadedUpdateHelper.clear().catch(() => {
          });
          return await (0, fs_extra_1.unlink)(updateFile).catch(() => {
          });
        };
        const tempUpdateFile = await (0, DownloadedUpdateHelper_1.createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);
        try {
          await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
          await (0, builder_util_runtime_1.retry)(() => (0, fs_extra_1.rename)(tempUpdateFile, updateFile), {
            retries: 60,
            interval: 500,
            shouldRetry: (error) => {
              if (error instanceof Error && /^EBUSY:/.test(error.message)) {
                return true;
              }
              log.warn(`Cannot rename temp file to final file: ${error.message || error.stack}`);
              return false;
            }
          });
        } catch (e) {
          await removeFileIfAny();
          if (e instanceof builder_util_runtime_1.CancellationError) {
            log.info("cancelled");
            this.emit("update-cancelled", updateInfo);
          }
          throw e;
        }
        log.info(`New version ${version} has been downloaded to ${updateFile}`);
        return await done(true);
      }
      async differentialDownloadInstaller(fileInfo, downloadUpdateOptions, installerPath, provider, oldInstallerFileName) {
        try {
          if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload) {
            return true;
          }
          const provider2 = downloadUpdateOptions.updateInfoAndProvider.provider;
          const blockmapFileUrls = await provider2.getBlockMapFiles(fileInfo.url, this.app.version, downloadUpdateOptions.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
          this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`);
          const downloadBlockMap = async (url) => {
            const data = await this.httpExecutor.downloadToBuffer(url, {
              headers: downloadUpdateOptions.requestHeaders,
              cancellationToken: downloadUpdateOptions.cancellationToken
            });
            if (data == null || data.length === 0) {
              throw new Error(`Blockmap "${url.href}" is empty`);
            }
            try {
              return JSON.parse((0, zlib_1.gunzipSync)(data).toString());
            } catch (e) {
              throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`);
            }
          };
          const downloadOptions = {
            newUrl: fileInfo.url,
            oldFile: path6.join(this.downloadedUpdateHelper.cacheDir, oldInstallerFileName),
            logger: this._logger,
            newFile: installerPath,
            isUseMultipleRangeRequest: provider2.isUseMultipleRangeRequest,
            requestHeaders: downloadUpdateOptions.requestHeaders,
            cancellationToken: downloadUpdateOptions.cancellationToken
          };
          if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
            downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
          }
          const saveBlockMapToCacheDir = async (blockMapData, cacheDir) => {
            const blockMapFile = path6.join(cacheDir, "current.blockmap");
            await (0, fs_extra_1.outputFile)(blockMapFile, (0, zlib_1.gzipSync)(JSON.stringify(blockMapData)));
          };
          const getBlockMapFromCacheDir = async (cacheDir) => {
            const blockMapFile = path6.join(cacheDir, "current.blockmap");
            try {
              if (await (0, fs_extra_1.pathExists)(blockMapFile)) {
                return JSON.parse((0, zlib_1.gunzipSync)(await (0, fs_extra_1.readFile)(blockMapFile)).toString());
              }
            } catch (e) {
              this._logger.warn(`Cannot parse blockmap "${blockMapFile}", error: ${e}`);
            }
            return null;
          };
          const newBlockMapData = await downloadBlockMap(blockmapFileUrls[1]);
          await saveBlockMapToCacheDir(newBlockMapData, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
          let oldBlockMapData = await getBlockMapFromCacheDir(this.downloadedUpdateHelper.cacheDir);
          if (oldBlockMapData == null) {
            oldBlockMapData = await downloadBlockMap(blockmapFileUrls[0]);
          }
          await new GenericDifferentialDownloader_1.GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(oldBlockMapData, newBlockMapData);
          return false;
        } catch (e) {
          this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
          if (this._testOnlyOptions != null) {
            throw e;
          }
          return true;
        }
      }
    };
    exports2.AppUpdater = AppUpdater;
    function hasPrereleaseComponents(version) {
      const versionPrereleaseComponent = (0, semver_1.prerelease)(version);
      return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
    }
    var NoOpLogger = class {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      info(message) {
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      warn(message) {
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error(message) {
      }
    };
    exports2.NoOpLogger = NoOpLogger;
  }
});

// node_modules/electron-updater/out/BaseUpdater.js
var require_BaseUpdater = __commonJS({
  "node_modules/electron-updater/out/BaseUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BaseUpdater = void 0;
    var child_process_1 = require("child_process");
    var path6 = require("path");
    var AppUpdater_1 = require_AppUpdater();
    var BaseUpdater = class extends AppUpdater_1.AppUpdater {
      constructor(options, app2) {
        super(options, app2);
        this.quitAndInstallCalled = false;
        this.quitHandlerAdded = false;
      }
      quitAndInstall(isSilent = false, isForceRunAfter = false) {
        this._logger.info(`Install on explicit quitAndInstall`);
        const isInstalled = this.install(isSilent, isSilent ? isForceRunAfter : this.autoRunAppAfterInstall);
        if (isInstalled) {
          setImmediate(() => {
            require("electron").autoUpdater.emit("before-quit-for-update");
            this.app.quit();
          });
        } else {
          this.quitAndInstallCalled = false;
        }
      }
      executeDownload(taskOptions) {
        return super.executeDownload({
          ...taskOptions,
          done: (event) => {
            this.dispatchUpdateDownloaded(event);
            this.addQuitHandler();
            return Promise.resolve();
          }
        });
      }
      get installerPath() {
        return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
      }
      // must be sync (because quit even handler is not async)
      install(isSilent = false, isForceRunAfter = false) {
        if (this.quitAndInstallCalled) {
          this._logger.warn("install call ignored: quitAndInstallCalled is set to true");
          return false;
        }
        const downloadedUpdateHelper = this.downloadedUpdateHelper;
        const installerPath = this.installerPath;
        const downloadedFileInfo = downloadedUpdateHelper == null ? null : downloadedUpdateHelper.downloadedFileInfo;
        if (installerPath == null || downloadedFileInfo == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        this.quitAndInstallCalled = true;
        try {
          this._logger.info(`Install: isSilent: ${isSilent}, isForceRunAfter: ${isForceRunAfter}`);
          return this.doInstall({
            isSilent,
            isForceRunAfter,
            isAdminRightsRequired: downloadedFileInfo.isAdminRightsRequired
          });
        } catch (e) {
          this.dispatchError(e);
          return false;
        }
      }
      addQuitHandler() {
        if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) {
          return;
        }
        this.quitHandlerAdded = true;
        this.app.onQuit((exitCode) => {
          if (this.quitAndInstallCalled) {
            this._logger.info("Update installer has already been triggered. Quitting application.");
            return;
          }
          if (!this.autoInstallOnAppQuit) {
            this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
            return;
          }
          if (exitCode !== 0) {
            this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${exitCode}`);
            return;
          }
          this._logger.info("Auto install update on quit");
          this.install(true, false);
        });
      }
      /**
       * Strips relative-path entries from a PATH string.
       * Prevents PATH-poisoning where a writable directory earlier in PATH shadows
       * a trusted package manager binary.
       */
      sanitizeEnvPath(envPath) {
        return envPath.split(path6.delimiter).filter((dir) => path6.isAbsolute(dir)).join(path6.delimiter);
      }
      spawnSyncLog(cmd, args = [], env = {}) {
        var _a;
        this._logger.info(`Executing: ${cmd} with args: ${args}`);
        const mergedEnv = { ...process.env, ...env };
        const response = (0, child_process_1.spawnSync)(cmd, args, {
          env: { ...mergedEnv, PATH: this.sanitizeEnvPath((_a = mergedEnv.PATH) !== null && _a !== void 0 ? _a : "") },
          encoding: "utf-8",
          shell: true
        });
        const { error, status, stdout, stderr } = response;
        if (error != null) {
          this._logger.error(stderr);
          throw error;
        } else if (status != null && status !== 0) {
          this._logger.error(stderr);
          throw new Error(`Command ${cmd} exited with code ${status}`);
        }
        return stdout.trim();
      }
      /**
       * This handles both node 8 and node 10 way of emitting error when spawning a process
       *   - node 8: Throws the error
       *   - node 10: Emit the error(Need to listen with on)
       */
      // https://github.com/electron-userland/electron-builder/issues/1129
      // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
      async spawnLog(cmd, args = [], env = void 0, stdio = "ignore") {
        this._logger.info(`Executing: ${cmd} with args: ${args}`);
        return new Promise((resolve, reject) => {
          try {
            const params = { stdio, env, detached: true };
            const p = (0, child_process_1.spawn)(cmd, args, params);
            p.on("error", (error) => {
              reject(error);
            });
            p.unref();
            if (p.pid !== void 0) {
              resolve(true);
            }
          } catch (error) {
            reject(error);
          }
        });
      }
    };
    exports2.BaseUpdater = BaseUpdater;
  }
});

// node_modules/electron-updater/out/differentialDownloader/FileWithEmbeddedBlockMapDifferentialDownloader.js
var require_FileWithEmbeddedBlockMapDifferentialDownloader = __commonJS({
  "node_modules/electron-updater/out/differentialDownloader/FileWithEmbeddedBlockMapDifferentialDownloader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
    var fs_extra_1 = require_lib();
    var DifferentialDownloader_1 = require_DifferentialDownloader();
    var zlib_1 = require("zlib");
    var FileWithEmbeddedBlockMapDifferentialDownloader = class extends DifferentialDownloader_1.DifferentialDownloader {
      async download() {
        const packageInfo = this.blockAwareFileInfo;
        const fileSize = packageInfo.size;
        const offset = fileSize - (packageInfo.blockMapSize + 4);
        this.fileMetadataBuffer = await this.readRemoteBytes(offset, fileSize - 1);
        const newBlockMap = readBlockMap(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
        await this.doDownload(await readEmbeddedBlockMapData(this.options.oldFile), newBlockMap);
      }
    };
    exports2.FileWithEmbeddedBlockMapDifferentialDownloader = FileWithEmbeddedBlockMapDifferentialDownloader;
    function readBlockMap(data) {
      return JSON.parse((0, zlib_1.inflateRawSync)(data).toString());
    }
    async function readEmbeddedBlockMapData(file) {
      const fd = await (0, fs_extra_1.open)(file, "r");
      try {
        const fileSize = (await (0, fs_extra_1.fstat)(fd)).size;
        const sizeBuffer = Buffer.allocUnsafe(4);
        await (0, fs_extra_1.read)(fd, sizeBuffer, 0, sizeBuffer.length, fileSize - sizeBuffer.length);
        const dataBuffer = Buffer.allocUnsafe(sizeBuffer.readUInt32BE(0));
        await (0, fs_extra_1.read)(fd, dataBuffer, 0, dataBuffer.length, fileSize - sizeBuffer.length - dataBuffer.length);
        await (0, fs_extra_1.close)(fd);
        return readBlockMap(dataBuffer);
      } catch (e) {
        await (0, fs_extra_1.close)(fd);
        throw e;
      }
    }
  }
});

// node_modules/electron-updater/out/AppImageUpdater.js
var require_AppImageUpdater = __commonJS({
  "node_modules/electron-updater/out/AppImageUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AppImageUpdater = void 0;
    var builder_util_runtime_1 = require_out();
    var child_process_1 = require("child_process");
    var fs_extra_1 = require_lib();
    var fs_1 = require("fs");
    var path6 = require("path");
    var BaseUpdater_1 = require_BaseUpdater();
    var FileWithEmbeddedBlockMapDifferentialDownloader_1 = require_FileWithEmbeddedBlockMapDifferentialDownloader();
    var Provider_1 = require_Provider();
    var types_1 = require_types();
    var AppImageUpdater = class extends BaseUpdater_1.BaseUpdater {
      constructor(options, app2) {
        super(options, app2);
      }
      isUpdaterActive() {
        if (process.env["APPIMAGE"] == null && !this.forceDevUpdateConfig) {
          if (process.env["SNAP"] == null) {
            this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
          } else {
            this._logger.info("SNAP env is defined, updater is disabled");
          }
          return false;
        }
        return super.isUpdaterActive();
      }
      /*** @private */
      doDownloadUpdate(downloadUpdateOptions) {
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
        return this.executeDownload({
          fileExtension: "AppImage",
          fileInfo,
          downloadUpdateOptions,
          task: async (updateFile, downloadOptions) => {
            const oldFile = process.env["APPIMAGE"];
            if (oldFile == null) {
              throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
            }
            if (downloadUpdateOptions.disableDifferentialDownload || await this.downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions)) {
              await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
            }
            await (0, fs_extra_1.chmod)(updateFile, 493);
          }
        });
      }
      async downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions) {
        try {
          const downloadOptions = {
            newUrl: fileInfo.url,
            oldFile,
            logger: this._logger,
            newFile: updateFile,
            isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
            requestHeaders: downloadUpdateOptions.requestHeaders,
            cancellationToken: downloadUpdateOptions.cancellationToken
          };
          if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
            downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
          }
          await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download();
          return false;
        } catch (e) {
          this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
          return process.platform === "linux";
        }
      }
      doInstall(options) {
        const appImageFile = process.env["APPIMAGE"];
        if (appImageFile == null) {
          throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        }
        if (!path6.isAbsolute(appImageFile) || appImageFile.includes("\0")) {
          throw (0, builder_util_runtime_1.newError)(`APPIMAGE env is not a valid absolute path: "${appImageFile}"`, "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        }
        (0, fs_1.unlinkSync)(appImageFile);
        let destination;
        const existingBaseName = path6.basename(appImageFile);
        const installerPath = this.installerPath;
        if (installerPath == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        if (path6.basename(installerPath) === existingBaseName || !/\d+\.\d+\.\d+/.test(existingBaseName)) {
          destination = appImageFile;
        } else {
          destination = path6.join(path6.dirname(appImageFile), path6.basename(installerPath));
        }
        (0, child_process_1.execFileSync)("mv", ["-f", installerPath, destination]);
        if (destination !== appImageFile) {
          this.emit("appimage-filename-updated", destination);
        }
        const env = {
          ...process.env,
          APPIMAGE_SILENT_INSTALL: "true"
        };
        if (options.isForceRunAfter) {
          this.spawnLog(destination, [], env);
        } else {
          env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
          (0, child_process_1.execFileSync)(destination, [], { env });
        }
        return true;
      }
    };
    exports2.AppImageUpdater = AppImageUpdater;
  }
});

// node_modules/electron-updater/out/LinuxUpdater.js
var require_LinuxUpdater = __commonJS({
  "node_modules/electron-updater/out/LinuxUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LinuxUpdater = void 0;
    var BaseUpdater_1 = require_BaseUpdater();
    var SAFE_PM_REGEX = /^[a-zA-Z0-9_-]+$/;
    var LinuxUpdater = class extends BaseUpdater_1.BaseUpdater {
      constructor(options, app2) {
        super(options, app2);
      }
      /**
       * Returns true if the current process is running as root.
       */
      isRunningAsRoot() {
        var _a;
        return ((_a = process.getuid) === null || _a === void 0 ? void 0 : _a.call(process)) === 0;
      }
      /**
       * Sanitizes the installer path for use with shell:true spawn calls.
       * Backslash-escapes metacharacters that have special meaning in POSIX shell.
       * Note: paths containing single-quotes (') are not supported.
       */
      get installerPath() {
        const raw = super.installerPath;
        if (raw == null) {
          return null;
        }
        return raw.replace(/\\/g, "\\\\").replace(/([`$!" ;|&()<>])/g, "\\$1").replace(/[\n\r]/g, "");
      }
      runCommandWithSudoIfNeeded(commandWithArgs) {
        if (this.isRunningAsRoot()) {
          this._logger.info("Running as root, no need to use sudo");
          return this.spawnSyncLog(commandWithArgs[0], commandWithArgs.slice(1));
        }
        const { name } = this.app;
        const safeName = name.replace(/["`$\\!\n\r;|&<>(){}*?[\]#~]/g, "");
        const installComment = `"${safeName} would like to update"`;
        const sudo = this.sudoWithArgs(installComment);
        this._logger.info(`Running as non-root user, using sudo to install: ${sudo}`);
        let wrapper = `"`;
        if (/pkexec/i.test(sudo[0]) || sudo[0] === "sudo") {
          wrapper = "";
        }
        return this.spawnSyncLog(sudo[0], [...sudo.length > 1 ? sudo.slice(1) : [], `${wrapper}/bin/bash`, "-c", `'${commandWithArgs.join(" ")}'${wrapper}`]);
      }
      sudoWithArgs(installComment) {
        const sudo = this.determineSudoCommand();
        const command = [sudo];
        if (/kdesudo/i.test(sudo)) {
          command.push("--comment", installComment);
          command.push("-c");
        } else if (/gksudo/i.test(sudo)) {
          command.push("--message", installComment);
        } else if (/pkexec/i.test(sudo)) {
          command.push("--disable-internal-agent");
        }
        return command;
      }
      hasCommand(cmd) {
        try {
          this.spawnSyncLog(`command`, ["-v", cmd]);
          return true;
        } catch {
          return false;
        }
      }
      determineSudoCommand() {
        const sudos = ["gksudo", "kdesudo", "pkexec", "beesu"];
        for (const sudo of sudos) {
          if (this.hasCommand(sudo)) {
            return sudo;
          }
        }
        return "sudo";
      }
      /**
       * Detects the package manager to use based on the available commands.
       * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
       * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
       * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
       * @param pms - An array of package manager commands to check for, in priority order.
       * @returns The detected package manager command or "unknown" if none are found.
       */
      detectPackageManager(pms) {
        var _a;
        let availablePMs = pms;
        const pmOverride = (_a = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || _a === void 0 ? void 0 : _a.trim();
        if (pmOverride) {
          if (!SAFE_PM_REGEX.test(pmOverride)) {
            this._logger.warn(`ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER "${pmOverride}" contains unsafe characters. Ignoring override.`);
          } else {
            availablePMs = [pmOverride];
          }
        }
        for (const pm of availablePMs) {
          if (this.hasCommand(pm)) {
            return pm;
          }
        }
        const searchList = pmOverride ? `ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER override "${pmOverride}", ` : "";
        const defaultPM = pms[0];
        this._logger.warn(`No package manager found in the list: ${searchList}${pms.join(", ")}. Utilizing default: ${defaultPM}`);
        return defaultPM;
      }
    };
    exports2.LinuxUpdater = LinuxUpdater;
  }
});

// node_modules/electron-updater/out/DebUpdater.js
var require_DebUpdater = __commonJS({
  "node_modules/electron-updater/out/DebUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DebUpdater = void 0;
    var Provider_1 = require_Provider();
    var types_1 = require_types();
    var LinuxUpdater_1 = require_LinuxUpdater();
    var DebUpdater = class _DebUpdater extends LinuxUpdater_1.LinuxUpdater {
      constructor(options, app2) {
        super(options, app2);
      }
      /*** @private */
      doDownloadUpdate(downloadUpdateOptions) {
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
        return this.executeDownload({
          fileExtension: "deb",
          fileInfo,
          downloadUpdateOptions,
          task: async (updateFile, downloadOptions) => {
            if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
              downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
            }
            await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
          }
        });
      }
      doInstall(options) {
        const installerPath = this.installerPath;
        if (installerPath == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        if (!this.hasCommand("dpkg") && !this.hasCommand("apt")) {
          this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package."));
          return false;
        }
        const priorityList = ["dpkg", "apt"];
        const packageManager = this.detectPackageManager(priorityList);
        try {
          _DebUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
        } catch (error) {
          this.dispatchError(error);
          return false;
        }
        if (options.isForceRunAfter) {
          this.app.relaunch();
        }
        return true;
      }
      static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
        var _a;
        if (packageManager === "dpkg") {
          try {
            commandRunner(["dpkg", "-i", installerPath]);
          } catch (error) {
            logger.warn((_a = error.message) !== null && _a !== void 0 ? _a : error);
            logger.warn("dpkg installation failed, trying to fix broken dependencies with apt-get");
            commandRunner(["apt-get", "install", "-f", "-y"]);
          }
        } else if (packageManager === "apt") {
          logger.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured.");
          commandRunner([
            "apt",
            "install",
            "-y",
            "--allow-unauthenticated",
            // needed for unsigned .debs
            "--allow-downgrades",
            // allow lower version installs
            "--allow-change-held-packages",
            installerPath
          ]);
        } else {
          throw new Error(`Package manager ${packageManager} not supported`);
        }
      }
    };
    exports2.DebUpdater = DebUpdater;
  }
});

// node_modules/electron-updater/out/PacmanUpdater.js
var require_PacmanUpdater = __commonJS({
  "node_modules/electron-updater/out/PacmanUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PacmanUpdater = void 0;
    var types_1 = require_types();
    var Provider_1 = require_Provider();
    var LinuxUpdater_1 = require_LinuxUpdater();
    var PacmanUpdater = class _PacmanUpdater extends LinuxUpdater_1.LinuxUpdater {
      constructor(options, app2) {
        super(options, app2);
      }
      /*** @private */
      doDownloadUpdate(downloadUpdateOptions) {
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
        return this.executeDownload({
          fileExtension: "pacman",
          fileInfo,
          downloadUpdateOptions,
          task: async (updateFile, downloadOptions) => {
            if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
              downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
            }
            await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
          }
        });
      }
      doInstall(options) {
        const installerPath = this.installerPath;
        if (installerPath == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        try {
          _PacmanUpdater.installWithCommandRunner(installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
        } catch (error) {
          this.dispatchError(error);
          return false;
        }
        if (options.isForceRunAfter) {
          this.app.relaunch();
        }
        return true;
      }
      static installWithCommandRunner(installerPath, commandRunner, logger) {
        var _a;
        try {
          commandRunner(["pacman", "-U", "--noconfirm", installerPath]);
        } catch (error) {
          logger.warn((_a = error.message) !== null && _a !== void 0 ? _a : error);
          logger.warn("pacman installation failed, attempting to update package database and retry");
          try {
            commandRunner(["pacman", "-Sy", "--noconfirm"]);
            commandRunner(["pacman", "-U", "--noconfirm", installerPath]);
          } catch (retryError) {
            logger.error("Retry after pacman -Sy failed");
            throw retryError;
          }
        }
      }
    };
    exports2.PacmanUpdater = PacmanUpdater;
  }
});

// node_modules/electron-updater/out/RpmUpdater.js
var require_RpmUpdater = __commonJS({
  "node_modules/electron-updater/out/RpmUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.RpmUpdater = void 0;
    var types_1 = require_types();
    var Provider_1 = require_Provider();
    var LinuxUpdater_1 = require_LinuxUpdater();
    var RpmUpdater = class _RpmUpdater extends LinuxUpdater_1.LinuxUpdater {
      constructor(options, app2) {
        super(options, app2);
      }
      /*** @private */
      doDownloadUpdate(downloadUpdateOptions) {
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
        return this.executeDownload({
          fileExtension: "rpm",
          fileInfo,
          downloadUpdateOptions,
          task: async (updateFile, downloadOptions) => {
            if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
              downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
            }
            await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
          }
        });
      }
      doInstall(options) {
        const installerPath = this.installerPath;
        if (installerPath == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        const priorityList = ["zypper", "dnf", "yum", "rpm"];
        const packageManager = this.detectPackageManager(priorityList);
        try {
          _RpmUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
        } catch (error) {
          this.dispatchError(error);
          return false;
        }
        if (options.isForceRunAfter) {
          this.app.relaunch();
        }
        return true;
      }
      static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
        if (packageManager === "zypper") {
          return commandRunner(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", installerPath]);
        }
        if (packageManager === "dnf") {
          return commandRunner(["dnf", "install", "--nogpgcheck", "-y", installerPath]);
        }
        if (packageManager === "yum") {
          return commandRunner(["yum", "install", "--nogpgcheck", "-y", installerPath]);
        }
        if (packageManager === "rpm") {
          logger.warn("Installing with rpm only (no dependency resolution).");
          return commandRunner(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", installerPath]);
        }
        throw new Error(`Package manager ${packageManager} not supported`);
      }
    };
    exports2.RpmUpdater = RpmUpdater;
  }
});

// node_modules/electron-updater/out/MacUpdater.js
var require_MacUpdater = __commonJS({
  "node_modules/electron-updater/out/MacUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MacUpdater = void 0;
    var builder_util_runtime_1 = require_out();
    var fs_extra_1 = require_lib();
    var fs_1 = require("fs");
    var path6 = require("path");
    var http_1 = require("http");
    var AppUpdater_1 = require_AppUpdater();
    var Provider_1 = require_Provider();
    var child_process_1 = require("child_process");
    var crypto_1 = require("crypto");
    var MacUpdater = class _MacUpdater extends AppUpdater_1.AppUpdater {
      constructor(options, app2) {
        super(options, app2);
        this.nativeUpdater = require("electron").autoUpdater;
        this.squirrelDownloadedUpdate = false;
        this.nativeUpdater.on("error", (it) => {
          this._logger.warn(it);
          this.emit("error", it);
        });
        this.nativeUpdater.on("update-downloaded", () => {
          this.squirrelDownloadedUpdate = true;
          this.debug("nativeUpdater.update-downloaded");
        });
      }
      /** Filters update files to the appropriate architecture.
       * On arm64 Macs (including Rosetta), arm64 files are preferred when available.
       * On x64 Macs, arm64 files are excluded. */
      static filterFilesForArch(files, isArm64Mac) {
        const isArm64File = (file) => {
          var _a;
          return file.url.pathname.includes("arm64") || ((_a = file.info.url) === null || _a === void 0 ? void 0 : _a.includes("arm64"));
        };
        if (isArm64Mac && files.some(isArm64File)) {
          return files.filter((file) => isArm64Mac === isArm64File(file));
        }
        return files.filter((file) => !isArm64File(file));
      }
      debug(message) {
        if (this._logger.debug != null) {
          this._logger.debug(message);
        }
      }
      closeServerIfExists() {
        if (this.server) {
          this.debug("Closing proxy server");
          this.server.close((err) => {
            if (err) {
              this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
            }
          });
        }
      }
      async doDownloadUpdate(downloadUpdateOptions) {
        let files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info);
        const log = this._logger;
        const sysctlRosettaInfoKey = "sysctl.proc_translated";
        let isRosetta = false;
        try {
          this.debug("Checking for macOS Rosetta environment");
          const result = (0, child_process_1.execFileSync)("sysctl", [sysctlRosettaInfoKey], { encoding: "utf8" });
          isRosetta = result.includes(`${sysctlRosettaInfoKey}: 1`);
          log.info(`Checked for macOS Rosetta environment (isRosetta=${isRosetta})`);
        } catch (e) {
          log.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${e}`);
        }
        let isArm64Mac = false;
        try {
          this.debug("Checking for arm64 in uname");
          const result = (0, child_process_1.execFileSync)("uname", ["-a"], { encoding: "utf8" });
          const isArm = result.includes("ARM");
          log.info(`Checked 'uname -a': arm64=${isArm}`);
          isArm64Mac = isArm64Mac || isArm;
        } catch (e) {
          log.warn(`uname shell command to check for arm64 failed: ${e}`);
        }
        isArm64Mac = isArm64Mac || process.arch === "arm64" || isRosetta;
        files = _MacUpdater.filterFilesForArch(files, isArm64Mac);
        const zipFileInfo = (0, Provider_1.findFile)(files, "zip", ["pkg", "dmg"]);
        if (zipFileInfo == null) {
          throw (0, builder_util_runtime_1.newError)(`ZIP file not provided: ${(0, builder_util_runtime_1.safeStringifyJson)(files)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
        }
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const CURRENT_MAC_APP_ZIP_FILE_NAME = "update.zip";
        return this.executeDownload({
          fileExtension: "zip",
          fileInfo: zipFileInfo,
          downloadUpdateOptions,
          task: async (destinationFile, downloadOptions) => {
            const cachedUpdateFilePath = path6.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
            const canDifferentialDownload = () => {
              if (!(0, fs_extra_1.pathExistsSync)(cachedUpdateFilePath)) {
                log.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download");
                return false;
              }
              return !downloadUpdateOptions.disableDifferentialDownload;
            };
            let differentialDownloadFailed = true;
            if (canDifferentialDownload()) {
              differentialDownloadFailed = await this.differentialDownloadInstaller(zipFileInfo, downloadUpdateOptions, destinationFile, provider, CURRENT_MAC_APP_ZIP_FILE_NAME);
            }
            if (differentialDownloadFailed) {
              await this.httpExecutor.download(zipFileInfo.url, destinationFile, downloadOptions);
            }
          },
          done: async (event) => {
            if (!downloadUpdateOptions.disableDifferentialDownload) {
              try {
                const cachedUpdateFilePath = path6.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
                await (0, fs_extra_1.copyFile)(event.downloadedFile, cachedUpdateFilePath);
              } catch (error) {
                this._logger.warn(`Unable to copy file for caching for future differential downloads: ${error.message}`);
              }
            }
            return this.updateDownloaded(zipFileInfo, event);
          }
        });
      }
      async updateDownloaded(zipFileInfo, event) {
        var _a;
        const downloadedFile = event.downloadedFile;
        const updateFileSize = (_a = zipFileInfo.info.size) !== null && _a !== void 0 ? _a : (await (0, fs_extra_1.stat)(downloadedFile)).size;
        const log = this._logger;
        const logContext = `fileToProxy=${zipFileInfo.url.href}`;
        this.closeServerIfExists();
        this.debug(`Creating proxy server for native Squirrel.Mac (${logContext})`);
        this.server = (0, http_1.createServer)();
        this.debug(`Proxy server for native Squirrel.Mac is created (${logContext})`);
        this.server.on("close", () => {
          log.info(`Proxy server for native Squirrel.Mac is closed (${logContext})`);
        });
        const getServerUrl = (s) => {
          const address = s.address();
          if (typeof address === "string") {
            return address;
          }
          return `http://127.0.0.1:${address === null || address === void 0 ? void 0 : address.port}`;
        };
        return await new Promise((resolve, reject) => {
          const pass = (0, crypto_1.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
          const authInfo = Buffer.from(`autoupdater:${pass}`, "ascii");
          const fileUrl = `/${(0, crypto_1.randomBytes)(64).toString("hex")}.zip`;
          this.server.on("request", (request, response) => {
            const requestUrl = request.url;
            log.info(`${requestUrl} requested`);
            if (requestUrl === "/") {
              if (!request.headers.authorization || request.headers.authorization.indexOf("Basic ") === -1) {
                response.statusCode = 401;
                response.statusMessage = "Invalid Authentication Credentials";
                response.end();
                log.warn("No authenthication info");
                return;
              }
              const base64Credentials = request.headers.authorization.split(" ")[1];
              const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
              const [username, password] = credentials.split(":");
              if (username !== "autoupdater" || password !== pass) {
                response.statusCode = 401;
                response.statusMessage = "Invalid Authentication Credentials";
                response.end();
                log.warn("Invalid authenthication credentials");
                return;
              }
              const data = Buffer.from(`{ "url": "${getServerUrl(this.server)}${fileUrl}" }`);
              response.writeHead(200, { "Content-Type": "application/json", "Content-Length": data.length });
              response.end(data);
              return;
            }
            if (!requestUrl.startsWith(fileUrl)) {
              log.warn(`${requestUrl} requested, but not supported`);
              response.writeHead(404);
              response.end();
              return;
            }
            log.info(`${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`);
            let errorOccurred = false;
            response.on("finish", () => {
              if (!errorOccurred) {
                this.nativeUpdater.removeListener("error", reject);
                resolve([]);
              }
            });
            const readStream = (0, fs_1.createReadStream)(downloadedFile);
            readStream.on("error", (error) => {
              try {
                response.end();
              } catch (e) {
                log.warn(`cannot end response: ${e}`);
              }
              errorOccurred = true;
              this.nativeUpdater.removeListener("error", reject);
              reject(new Error(`Cannot pipe "${downloadedFile}": ${error}`));
            });
            response.writeHead(200, {
              "Content-Type": "application/zip",
              "Content-Length": updateFileSize
            });
            readStream.pipe(response);
          });
          this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${logContext})`);
          this.server.listen(0, "127.0.0.1", () => {
            this.debug(`Proxy server for native Squirrel.Mac is listening (address=${getServerUrl(this.server)}, ${logContext})`);
            this.nativeUpdater.setFeedURL({
              url: getServerUrl(this.server),
              headers: {
                "Cache-Control": "no-cache",
                Authorization: `Basic ${authInfo.toString("base64")}`
              }
            });
            this.dispatchUpdateDownloaded(event);
            if (this.autoInstallOnAppQuit) {
              this.nativeUpdater.once("error", reject);
              this.nativeUpdater.checkForUpdates();
            } else {
              resolve([]);
            }
          });
        });
      }
      handleUpdateDownloaded() {
        if (this.autoRunAppAfterInstall) {
          this.nativeUpdater.quitAndInstall();
        } else {
          this.app.quit();
        }
        this.closeServerIfExists();
      }
      quitAndInstall() {
        if (this.squirrelDownloadedUpdate) {
          this.handleUpdateDownloaded();
        } else {
          this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded());
          if (!this.autoInstallOnAppQuit) {
            this.nativeUpdater.checkForUpdates();
          }
        }
      }
    };
    exports2.MacUpdater = MacUpdater;
  }
});

// node_modules/electron-updater/out/windowsExecutableCodeSignatureVerifier.js
var require_windowsExecutableCodeSignatureVerifier = __commonJS({
  "node_modules/electron-updater/out/windowsExecutableCodeSignatureVerifier.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.verifySignature = verifySignature;
    var builder_util_runtime_1 = require_out();
    var child_process_1 = require("child_process");
    var os = require("os");
    var path6 = require("path");
    function preparePowerShellExec(command, timeout) {
      const executable = `set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`;
      const args = ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", command];
      const options = {
        shell: true,
        timeout
      };
      return [executable, args, options];
    }
    function verifySignature(publisherNames, unescapedTempUpdateFile, logger) {
      return new Promise((resolve, reject) => {
        const tempUpdateFile = unescapedTempUpdateFile.replace(/'/g, "''");
        logger.info(`Verifying signature ${tempUpdateFile}`);
        (0, child_process_1.execFile)(...preparePowerShellExec(`"Get-AuthenticodeSignature -LiteralPath '${tempUpdateFile}' | ConvertTo-Json -Compress"`, 20 * 1e3), (error, stdout, stderr) => {
          var _a;
          try {
            if (error != null || stderr) {
              handleError(logger, error, stderr, reject);
              resolve(null);
              return;
            }
            const data = parseOut(stdout);
            if (data.Status === 0) {
              try {
                const normlaizedUpdateFilePath = path6.normalize(data.Path);
                const normalizedTempUpdateFile = path6.normalize(unescapedTempUpdateFile);
                logger.info(`LiteralPath: ${normlaizedUpdateFilePath}. Update Path: ${normalizedTempUpdateFile}`);
                if (normlaizedUpdateFilePath !== normalizedTempUpdateFile) {
                  handleError(logger, new Error(`LiteralPath of ${normlaizedUpdateFilePath} is different than ${normalizedTempUpdateFile}`), stderr, reject);
                  resolve(null);
                  return;
                }
              } catch (error2) {
                logger.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(_a = error2.message) !== null && _a !== void 0 ? _a : error2.stack}`);
              }
              const subject = (0, builder_util_runtime_1.parseDn)(data.SignerCertificate.Subject);
              let match = false;
              for (const name of publisherNames) {
                const dn = (0, builder_util_runtime_1.parseDn)(name);
                if (dn.size) {
                  const allKeys = Array.from(dn.keys());
                  match = allKeys.every((key) => {
                    return dn.get(key) === subject.get(key);
                  });
                } else if (name === subject.get("CN")) {
                  logger.warn(`Signature validated using only CN ${name}. Please add your full Distinguished Name (DN) to publisherNames configuration`);
                  match = true;
                }
                if (match) {
                  resolve(null);
                  return;
                }
              }
            }
            const result = `publisherNames: ${publisherNames.join(" | ")}, raw info: ` + JSON.stringify(data, (name, value) => name === "RawData" ? void 0 : value, 2);
            logger.warn(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
            resolve(result);
          } catch (e) {
            handleError(logger, e, null, reject);
            resolve(null);
            return;
          }
        });
      });
    }
    function parseOut(out) {
      const data = JSON.parse(out);
      delete data.PrivateKey;
      delete data.IsOSBinary;
      delete data.SignatureType;
      const signerCertificate = data.SignerCertificate;
      if (signerCertificate != null) {
        delete signerCertificate.Archived;
        delete signerCertificate.Extensions;
        delete signerCertificate.Handle;
        delete signerCertificate.HasPrivateKey;
        delete signerCertificate.SubjectName;
      }
      return data;
    }
    function handleError(logger, error, stderr, reject) {
      if (isOldWin6()) {
        logger.warn(`Cannot execute Get-AuthenticodeSignature: ${error || stderr}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
        return;
      }
      try {
        (0, child_process_1.execFileSync)(...preparePowerShellExec("ConvertTo-Json test", 10 * 1e3));
      } catch (testError) {
        logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
        return;
      }
      if (error != null) {
        reject(error);
      }
      if (stderr) {
        reject(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${stderr}. Failing signature validation due to unknown stderr.`));
      }
    }
    function isOldWin6() {
      const winVersion = os.release();
      return winVersion.startsWith("6.") && !winVersion.startsWith("6.3");
    }
  }
});

// node_modules/electron-updater/out/NsisUpdater.js
var require_NsisUpdater = __commonJS({
  "node_modules/electron-updater/out/NsisUpdater.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NsisUpdater = void 0;
    var builder_util_runtime_1 = require_out();
    var path6 = require("path");
    var BaseUpdater_1 = require_BaseUpdater();
    var FileWithEmbeddedBlockMapDifferentialDownloader_1 = require_FileWithEmbeddedBlockMapDifferentialDownloader();
    var types_1 = require_types();
    var Provider_1 = require_Provider();
    var fs_extra_1 = require_lib();
    var windowsExecutableCodeSignatureVerifier_1 = require_windowsExecutableCodeSignatureVerifier();
    var url_1 = require("url");
    var NsisUpdater = class extends BaseUpdater_1.BaseUpdater {
      constructor(options, app2) {
        super(options, app2);
        this._verifyUpdateCodeSignature = (publisherNames, unescapedTempUpdateFile) => (0, windowsExecutableCodeSignatureVerifier_1.verifySignature)(publisherNames, unescapedTempUpdateFile, this._logger);
      }
      /**
       * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
       * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
       */
      get verifyUpdateCodeSignature() {
        return this._verifyUpdateCodeSignature;
      }
      set verifyUpdateCodeSignature(value) {
        if (value) {
          this._verifyUpdateCodeSignature = value;
        }
      }
      /*** @private */
      doDownloadUpdate(downloadUpdateOptions) {
        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "exe");
        return this.executeDownload({
          fileExtension: "exe",
          downloadUpdateOptions,
          fileInfo,
          task: async (destinationFile, downloadOptions, packageFile, removeTempDirIfAny) => {
            const packageInfo = fileInfo.packageInfo;
            const isWebInstaller = packageInfo != null && packageFile != null;
            if (isWebInstaller && downloadUpdateOptions.disableWebInstaller) {
              throw (0, builder_util_runtime_1.newError)(`Unable to download new version ${downloadUpdateOptions.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
            }
            if (!isWebInstaller && !downloadUpdateOptions.disableWebInstaller) {
              this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version.");
            }
            if (isWebInstaller || downloadUpdateOptions.disableDifferentialDownload || await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider, builder_util_runtime_1.CURRENT_APP_INSTALLER_FILE_NAME)) {
              await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions);
            }
            const signatureVerificationStatus = await this.verifySignature(destinationFile);
            if (signatureVerificationStatus != null) {
              await removeTempDirIfAny();
              throw (0, builder_util_runtime_1.newError)(`New version ${downloadUpdateOptions.updateInfoAndProvider.info.version} is not signed by the application owner: ${signatureVerificationStatus}`, "ERR_UPDATER_INVALID_SIGNATURE");
            }
            if (isWebInstaller) {
              if (await this.differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packageFile, provider)) {
                try {
                  await this.httpExecutor.download(new url_1.URL(packageInfo.path), packageFile, {
                    headers: downloadUpdateOptions.requestHeaders,
                    cancellationToken: downloadUpdateOptions.cancellationToken,
                    sha512: packageInfo.sha512
                  });
                } catch (e) {
                  try {
                    await (0, fs_extra_1.unlink)(packageFile);
                  } catch (_ignored) {
                  }
                  throw e;
                }
              }
            }
          }
        });
      }
      // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
      // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
      // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
      async verifySignature(tempUpdateFile) {
        let publisherName;
        try {
          publisherName = (await this.configOnDisk.value).publisherName;
          if (publisherName == null) {
            return null;
          }
        } catch (e) {
          if (e.code === "ENOENT") {
            return null;
          }
          throw e;
        }
        return await this._verifyUpdateCodeSignature(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile);
      }
      doInstall(options) {
        const installerPath = this.installerPath;
        if (installerPath == null) {
          this.dispatchError(new Error("No update filepath provided, can't quit and install"));
          return false;
        }
        const args = ["--updated"];
        if (options.isSilent) {
          args.push("/S");
        }
        if (options.isForceRunAfter) {
          args.push("--force-run");
        }
        if (this.installDirectory) {
          args.push(`/D=${this.installDirectory}`);
        }
        const packagePath = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
        if (packagePath != null) {
          args.push(`--package-file=${packagePath}`);
        }
        const callUsingElevation = () => {
          this.spawnLog(path6.join(process.resourcesPath, "elevate.exe"), [installerPath].concat(args)).catch((e) => this.dispatchError(e));
        };
        if (options.isAdminRightsRequired) {
          this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe");
          callUsingElevation();
          return true;
        }
        this.spawnLog(installerPath, args).catch((e) => {
          const errorCode = e.code;
          this._logger.info(`Cannot run installer: error code: ${errorCode}, error message: "${e.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`);
          if (errorCode === "UNKNOWN" || errorCode === "EACCES") {
            callUsingElevation();
          } else if (errorCode === "ENOENT") {
            require("electron").shell.openPath(installerPath).catch((err) => this.dispatchError(err));
          } else {
            this.dispatchError(e);
          }
        });
        return true;
      }
      async differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packagePath, provider) {
        if (packageInfo.blockMapSize == null) {
          return true;
        }
        try {
          const downloadOptions = {
            newUrl: new url_1.URL(packageInfo.path),
            oldFile: path6.join(this.downloadedUpdateHelper.cacheDir, builder_util_runtime_1.CURRENT_APP_PACKAGE_FILE_NAME),
            logger: this._logger,
            newFile: packagePath,
            requestHeaders: this.requestHeaders,
            isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
            cancellationToken: downloadUpdateOptions.cancellationToken
          };
          if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
            downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
          }
          await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(packageInfo, this.httpExecutor, downloadOptions).download();
        } catch (e) {
          this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
          return process.platform === "win32";
        }
        return false;
      }
    };
    exports2.NsisUpdater = NsisUpdater;
  }
});

// node_modules/electron-updater/out/main.js
var require_main2 = __commonJS({
  "node_modules/electron-updater/out/main.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NsisUpdater = exports2.MacUpdater = exports2.RpmUpdater = exports2.PacmanUpdater = exports2.DebUpdater = exports2.AppImageUpdater = exports2.Provider = exports2.NoOpLogger = exports2.AppUpdater = exports2.BaseUpdater = void 0;
    var fs_extra_1 = require_lib();
    var path6 = require("path");
    var BaseUpdater_1 = require_BaseUpdater();
    Object.defineProperty(exports2, "BaseUpdater", { enumerable: true, get: function() {
      return BaseUpdater_1.BaseUpdater;
    } });
    var AppUpdater_1 = require_AppUpdater();
    Object.defineProperty(exports2, "AppUpdater", { enumerable: true, get: function() {
      return AppUpdater_1.AppUpdater;
    } });
    Object.defineProperty(exports2, "NoOpLogger", { enumerable: true, get: function() {
      return AppUpdater_1.NoOpLogger;
    } });
    var Provider_1 = require_Provider();
    Object.defineProperty(exports2, "Provider", { enumerable: true, get: function() {
      return Provider_1.Provider;
    } });
    var AppImageUpdater_1 = require_AppImageUpdater();
    Object.defineProperty(exports2, "AppImageUpdater", { enumerable: true, get: function() {
      return AppImageUpdater_1.AppImageUpdater;
    } });
    var DebUpdater_1 = require_DebUpdater();
    Object.defineProperty(exports2, "DebUpdater", { enumerable: true, get: function() {
      return DebUpdater_1.DebUpdater;
    } });
    var PacmanUpdater_1 = require_PacmanUpdater();
    Object.defineProperty(exports2, "PacmanUpdater", { enumerable: true, get: function() {
      return PacmanUpdater_1.PacmanUpdater;
    } });
    var RpmUpdater_1 = require_RpmUpdater();
    Object.defineProperty(exports2, "RpmUpdater", { enumerable: true, get: function() {
      return RpmUpdater_1.RpmUpdater;
    } });
    var MacUpdater_1 = require_MacUpdater();
    Object.defineProperty(exports2, "MacUpdater", { enumerable: true, get: function() {
      return MacUpdater_1.MacUpdater;
    } });
    var NsisUpdater_1 = require_NsisUpdater();
    Object.defineProperty(exports2, "NsisUpdater", { enumerable: true, get: function() {
      return NsisUpdater_1.NsisUpdater;
    } });
    __exportStar(require_types(), exports2);
    var _autoUpdater;
    function doLoadAutoUpdater() {
      if (process.platform === "win32") {
        _autoUpdater = new (require_NsisUpdater()).NsisUpdater();
      } else if (process.platform === "darwin") {
        _autoUpdater = new (require_MacUpdater()).MacUpdater();
      } else {
        _autoUpdater = new (require_AppImageUpdater()).AppImageUpdater();
        try {
          const identity = path6.join(process.resourcesPath, "package-type");
          if (!(0, fs_extra_1.existsSync)(identity)) {
            return _autoUpdater;
          }
          const fileType = (0, fs_extra_1.readFileSync)(identity).toString().trim();
          switch (fileType) {
            case "deb":
              _autoUpdater = new (require_DebUpdater()).DebUpdater();
              break;
            case "rpm":
              _autoUpdater = new (require_RpmUpdater()).RpmUpdater();
              break;
            case "pacman":
              _autoUpdater = new (require_PacmanUpdater()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (error) {
          console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", error.message);
        }
      }
      return _autoUpdater;
    }
    Object.defineProperty(exports2, "autoUpdater", {
      enumerable: true,
      get: () => {
        return _autoUpdater || doLoadAutoUpdater();
      }
    });
  }
});

// src/main/search-browser.ts
var import_electron = require("electron");

// src/main/errors.ts
var AppError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
  code;
};

// src/main/search-browser.ts
var ORIGIN = "https://hongguoduanju.com";
var SearchBrowser = class {
  pending = Promise.resolve();
  active;
  stopped = false;
  read(url) {
    const operation = this.pending.then(() => this.load(url));
    this.pending = operation.catch(() => {
    });
    return operation;
  }
  close() {
    this.stopped = true;
    this.active?.destroy();
  }
  load(url) {
    if (this.stopped) return Promise.reject(new AppError("CANCELLED", "\u641C\u7D22\u5DF2\u505C\u6B62"));
    const page = new URL("/search/" + encodeURIComponent(url.searchParams.get("query")), ORIGIN);
    if (url.searchParams.has("page")) page.searchParams.set("page", url.searchParams.get("page"));
    const browserSession = import_electron.session.fromPartition("persist:official-search");
    browserSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    const window2 = new import_electron.BrowserWindow({ show: false, webPreferences: { session: browserSession, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    this.active = window2;
    window2.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window2.webContents.on("will-navigate", (event, address) => {
      if (new URL(address).origin !== ORIGIN) event.preventDefault();
    });
    return new Promise((resolve, reject) => {
      const network2 = window2.webContents.debugger;
      let requestId, settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        network2.removeListener("message", message);
        if (this.active === window2) this.active = void 0;
        if (!window2.isDestroyed()) window2.destroy();
        if (error) reject(error);
        else resolve(value);
      };
      const message = (_event, method, params) => {
        if (method === "Network.responseReceived") {
          const responseUrl = new URL(params.response.url);
          if (responseUrl.origin !== ORIGIN || responseUrl.pathname !== url.pathname || responseUrl.searchParams.get("query") !== url.searchParams.get("query") || (responseUrl.searchParams.get("page") || "1") !== (url.searchParams.get("page") || "1")) return;
          if (params.response.status !== 200) {
            finish(new AppError("SEARCH_UNAVAILABLE", params.response.status === 403 ? "\u5B98\u7F51\u641C\u7D22\u6682\u65F6\u62D2\u7EDD\u8BF7\u6C42\u6216\u9700\u8981\u4EBA\u5DE5\u9A8C\u8BC1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `\u5B98\u7F51\u641C\u7D22\u6682\u4E0D\u53EF\u7528\uFF08HTTP ${params.response.status}\uFF09`));
            return;
          }
          requestId = params.requestId;
        }
        if (method === "Network.loadingFinished" && requestId && params.requestId === requestId) {
          void network2.sendCommand("Network.getResponseBody", { requestId }).then((result) => {
            const text2 = result.base64Encoded ? Buffer.from(result.body, "base64").toString("utf8") : result.body;
            if (text2.length > 8 * 1024 * 1024) throw new AppError("PAGE_TOO_LARGE", "\u641C\u7D22\u8FD4\u56DE\u5185\u5BB9\u8FC7\u5927");
            finish(void 0, text2);
          }).catch(() => finish(new AppError("SEARCH_RESPONSE", "\u641C\u7D22\u7ED3\u679C\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5")));
        }
      };
      const timer = setTimeout(() => finish(new AppError("SEARCH_TIMEOUT", "\u5B98\u7F51\u641C\u7D22\u51C6\u5907\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5")), 3e4);
      window2.once("closed", () => finish(new AppError("CANCELLED", "\u641C\u7D22\u5DF2\u505C\u6B62")));
      try {
        network2.attach("1.3");
        network2.on("message", message);
        void window2.loadURL("about:blank").then(() => network2.sendCommand("Network.enable")).then(() => window2.loadURL(page.href)).catch(() => finish(new AppError("SEARCH_NETWORK", "\u5B98\u7F51\u641C\u7D22\u9875\u9762\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5")));
      } catch {
        finish(new AppError("SEARCH_BROWSER", "\u641C\u7D22\u73AF\u5883\u65E0\u6CD5\u542F\u52A8\uFF0C\u8BF7\u91CD\u8BD5"));
      }
    });
  }
};

// src/main/main.ts
var import_electron2 = require("electron");
var import_node_path5 = __toESM(require("node:path"), 1);

// src/main/library.ts
var import_promises = require("node:fs/promises");
var import_node_fs = require("node:fs");
var import_node_crypto = require("node:crypto");
var import_node_path = __toESM(require("node:path"), 1);
var validId = (value) => typeof value === "string" && /^[0-9]{8,24}$/.test(value);
function safeWork(input) {
  if (!input || !validId(input.id) || typeof input.title !== "string") throw new AppError("INVALID_INPUT", "\u4F5C\u54C1\u4FE1\u606F\u65E0\u6548");
  return { id: input.id, title: input.title.slice(0, 200), cover: typeof input.cover === "string" && /^https?:\/\//.test(input.cover) ? input.cover.slice(0, 2048) : "", description: String(input.description || "").slice(0, 6e3), total: Number.isInteger(input.total) && input.total >= 0 ? input.total : 0, categories: Array.isArray(input.categories) ? input.categories.filter((c) => typeof c === "string").slice(0, 12) : [] };
}
var LibraryStore = class {
  constructor(dir) {
    this.dir = dir;
  }
  dir;
  value = { favorites: [], history: [] };
  pending = Promise.resolve();
  initialized = false;
  async init() {
    this.initialized = false;
    const file = import_node_path.default.join(this.dir, "library.json");
    let source;
    try {
      await (0, import_promises.mkdir)(this.dir, { recursive: true });
      source = await (0, import_promises.readFile)(file, "utf8");
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        this.value = { favorites: [], history: [] };
        this.initialized = true;
        return;
      }
      throw new AppError("LIBRARY_READ", "\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u539F\u6587\u4EF6\uFF0C\u8BF7\u68C0\u67E5\u5E94\u7528\u6570\u636E\u76EE\u5F55\u6743\u9650\u540E\u91CD\u8BD5");
    }
    let raw;
    try {
      raw = JSON.parse(source);
      if (!raw || typeof raw !== "object" || !Array.isArray(raw.favorites) || !Array.isArray(raw.history)) throw new Error("INVALID_LIBRARY");
    } catch {
      try {
        await (0, import_promises.copyFile)(file, file + ".corrupt-" + Date.now() + "-" + (0, import_node_crypto.randomUUID)(), import_node_fs.constants.COPYFILE_EXCL);
      } catch {
        throw new AppError("LIBRARY_BACKUP", "\u8BB0\u5F55\u6587\u4EF6\u5DF2\u635F\u574F\uFF0C\u4F46\u5907\u4EFD\u5931\u8D25\uFF1B\u5DF2\u505C\u6B62\u5199\u5165\u4EE5\u4FDD\u62A4\u539F\u6587\u4EF6");
      }
      this.value = { favorites: [], history: [] };
      this.initialized = true;
      return;
    }
    const favorites = [], history = [];
    for (const item of raw.favorites) {
      try {
        favorites.push(safeWork(item));
      } catch {
      }
    }
    for (const item of raw.history) {
      try {
        if (!item || !validId(item.seriesId) || !validId(item.episodeId) || !Number.isInteger(item.order) || item.order < 1 || !Number.isFinite(item.time) || item.time < 0 || !Number.isFinite(item.duration) || item.duration <= 0 || item.time > item.duration + 2 || !Number.isFinite(item.updatedAt)) continue;
        const work2 = safeWork(item.work);
        if (work2.id !== item.seriesId) continue;
        history.push({ seriesId: item.seriesId, episodeId: item.episodeId, order: item.order, time: Math.min(item.time, item.duration), duration: item.duration, updatedAt: item.updatedAt, work: work2 });
      } catch {
      }
    }
    this.value = { favorites: favorites.slice(0, 500), history: history.slice(0, 200) };
    this.initialized = true;
  }
  snapshot() {
    return structuredClone(this.value);
  }
  mutate(action) {
    const operation = this.pending.then(async () => {
      if (!this.initialized) throw new AppError("LIBRARY_NOT_READY", "\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u5C1A\u672A\u5B89\u5168\u52A0\u8F7D\uFF0C\u5DF2\u505C\u6B62\u5199\u5165");
      const draft = structuredClone(this.value);
      action(draft);
      const file = import_node_path.default.join(this.dir, "library.json");
      try {
        await (0, import_promises.writeFile)(file + ".tmp", JSON.stringify(draft), "utf8");
        await (0, import_promises.rename)(file + ".tmp", file);
      } catch {
        throw new AppError("LIBRARY_WRITE", "\u6536\u85CF\u6216\u89C2\u770B\u8BB0\u5F55\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u7A7A\u95F4\u548C\u5E94\u7528\u6570\u636E\u76EE\u5F55\u6743\u9650");
      }
      this.value = draft;
      return this.snapshot();
    });
    this.pending = operation.catch(() => {
    });
    return operation;
  }
  favorite(work2, enabled) {
    const clean = safeWork(work2);
    return this.mutate((draft) => {
      draft.favorites = draft.favorites.filter((w) => w.id !== clean.id);
      if (enabled) draft.favorites.unshift(clean);
      draft.favorites = draft.favorites.slice(0, 500);
    });
  }
  async progress(input) {
    if (!validId(input?.seriesId) || !validId(input?.episodeId) || !Number.isInteger(input.order) || input.order < 1 || !Number.isFinite(input.time) || input.time < 0 || !Number.isFinite(input.duration) || input.duration <= 0 || input.time > input.duration + 2) throw new AppError("INVALID_INPUT", "\u89C2\u770B\u8FDB\u5EA6\u65E0\u6548");
    const work2 = safeWork(input.work);
    if (work2.id !== input.seriesId) throw new AppError("INVALID_INPUT", "\u89C2\u770B\u8FDB\u5EA6\u4E0E\u4F5C\u54C1\u4E0D\u4E00\u81F4");
    const progress = { seriesId: input.seriesId, episodeId: input.episodeId, order: input.order, time: Math.min(input.time, input.duration), duration: input.duration, work: work2, updatedAt: Date.now() };
    return this.mutate((draft) => {
      draft.history = draft.history.filter((p) => p.seriesId !== progress.seriesId);
      draft.history.unshift(progress);
      draft.history = draft.history.slice(0, 200);
    });
  }
  async flush() {
    await this.pending;
  }
};

// src/main/media.ts
var import_node_crypto3 = require("node:crypto");
var import_node_child_process2 = require("node:child_process");
var import_promises4 = require("node:fs/promises");
var import_node_fs2 = require("node:fs");
var import_node_stream = require("node:stream");
var import_node_path2 = __toESM(require("node:path"), 1);

// src/main/resumable-download.ts
var import_promises2 = require("node:fs/promises");
var import_node_crypto2 = require("node:crypto");
var cancelled = () => new AppError("CANCELLED", "\u64AD\u653E\u51C6\u5907\u5DF2\u53D6\u6D88");
var incomplete = () => new AppError("INCOMPLETE_RESOURCE", "\u89C6\u9891\u8D44\u6E90\u5927\u5C0F\u6216\u7EED\u4F20\u54CD\u5E94\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u8BD5");
var network = () => new AppError("NETWORK", "\u89C6\u9891\u8FDE\u63A5\u4E2D\u65AD\u6216\u8BFB\u53D6\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5");
var check = (signal) => {
  if (signal.aborted) throw cancelled();
};
var strongEtag = (value) => typeof value === "string" && /^"[\x21\x23-\x7e\x80-\xff]*"$/.test(value);
async function persist(file, metadata) {
  const temporary = `${file}.${(0, import_node_crypto2.randomUUID)()}.tmp`;
  try {
    await (0, import_promises2.writeFile)(temporary, JSON.stringify({
      version: metadata.segments ? 2 : 1,
      size: metadata.size,
      fingerprint: metadata.fingerprint,
      ...metadata.etag ? { etag: metadata.etag } : {},
      ...metadata.lastModified ? { lastModified: metadata.lastModified } : {},
      bytes: metadata.bytes,
      ...metadata.segments ? { segments: metadata.segments } : {}
    }));
    for (let attempt = 0; ; attempt++) {
      try {
        await (0, import_promises2.rename)(temporary, file);
        return;
      } catch (error) {
        if (!["EPERM", "EBUSY", "EACCES"].includes(error.code) || attempt >= 4) throw error;
        await new Promise((r) => setTimeout(r, 60 * (attempt + 1)));
      }
    }
  } finally {
    await (0, import_promises2.unlink)(temporary).catch(() => {
    });
  }
}
async function writeAll(handle2, chunk, position, signal) {
  let written = 0;
  while (written < chunk.length) {
    check(signal);
    const result = await handle2.write(chunk, written, chunk.length - written, position + written);
    if (!result.bytesWritten) throw new AppError("MEDIA_CACHE", "\u78C1\u76D8\u5199\u5165\u672A\u5B8C\u6210");
    written += result.bytesWritten;
  }
}
function backoff(ms, signal) {
  check(signal);
  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", abort);
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      cleanup();
      reject(cancelled());
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
var __hgHwPromise = null;
function __hgProbeEncoder(ffmpeg, args) {
  return new Promise((resolve) => {
    const child = (0, import_node_child_process2.spawn)(ffmpeg, ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=duration=0.3:size=320x180:rate=10", ...args, "-an", "-f", "null", "-"], { windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
      }
      resolve(false);
    }, 15000);
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    child.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}
async function __hgDetectHw(ffmpeg) {
  const candidates = [
    { name: "h264_nvenc", args: ["-c:v", "h264_nvenc", "-preset", "p4", "-rc", "vbr", "-cq", "23", "-b:v", "0"] },
    { name: "h264_qsv", args: ["-c:v", "h264_qsv", "-global_quality", "23", "-b:v", "0"] },
    { name: "h264_amf", args: ["-c:v", "h264_amf", "-quality", "speed", "-rc", "cqp", "-qp_i", "23", "-qp_p", "23", "-b:v", "0"] }
  ];
  for (const candidate of candidates) {
    if (await __hgProbeEncoder(ffmpeg, candidate.args)) {
      __hgDbg("hw encoder: " + candidate.name);
      return candidate;
    }
  }
  __hgDbg("hw encoder: none (libx264)");
  return null;
}
async function downloadSegmented(options) {
  const { url, path: path6, metadataPath, size, fingerprint, signal, onProgress, throttle } = options;
  const idleTimeoutMs = options.idleTimeoutMs ?? 45e3;
  const maxSegments = Math.max(2, Math.min(32, Math.trunc(options.segments || 8)));
  check(signal);
  if (!Number.isSafeInteger(size) || size <= 0 || !fingerprint || path6 === metadataPath) throw new AppError("INVALID_INPUT", "\u89C6\u9891\u4E0B\u8F7D\u53C2\u6570\u65E0\u6548");
  let probe;
  try {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), idleTimeoutMs);
    try {
      probe = await fetch(url, { signal: controller.signal, headers: { "Accept-Encoding": "identity", Range: "bytes=0-0" } });
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    }
  } catch {
    check(signal);
    return downloadMedia({ ...options, segments: 1 });
  }
  check(signal);
  const etag = probe.headers.get("etag");
  const range = /^bytes 0-0\/(\d+)$/.exec(probe.headers.get("content-range") || "");
  await probe.body?.cancel().catch(() => {
  });
  if (probe.status !== 206 || !range || Number(range[1]) !== size || !strongEtag(etag)) return downloadMedia({ ...options, segments: 1 });
  let handle2, completed = false, meta;
  const downloaded = () => meta.segments.reduce((sum, seg) => sum + seg.bytes, 0);
  const progress = () => {
    try {
      onProgress?.(downloaded(), size);
    } catch {
      check(signal);
      throw new AppError("MEDIA_STREAM", "\u89C6\u9891\u8FDB\u5EA6\u5904\u7406\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
    check(signal);
  };
  try {
    handle2 = await (0, import_promises2.open)(path6, "r+").catch(async (error) => {
      if (error.code === "ENOENT") return (0, import_promises2.open)(path6, "w+");
      throw error;
    });
    let saved;
    try {
      saved = JSON.parse(await (0, import_promises2.readFile)(metadataPath, "utf8"));
    } catch {
    }
    if (saved && saved.version === 2 && saved.size === size && saved.fingerprint === fingerprint && saved.etag === etag && Array.isArray(saved.segments)) {
      const segs = saved.segments.map((seg) => ({
        start: Number(seg.start),
        end: Number(seg.end),
        bytes: Math.max(0, Math.min(Number(seg.end) - Number(seg.start) + 1, Math.trunc(Number(seg.bytes) || 0)))
      })).sort((a, b) => a.start - b.start);
      let cursor = 0, valid = segs.length > 0;
      for (const seg of segs) {
        if (!Number.isSafeInteger(seg.start) || !Number.isSafeInteger(seg.end) || seg.start !== cursor || seg.end < seg.start) {
          valid = false;
          break;
        }
        cursor = seg.end + 1;
      }
      if (valid && cursor === size) meta = { version: 2, size, fingerprint, etag, segments: segs };
    }
    if (!meta) {
      await handle2.truncate(0);
      meta = { version: 2, size, fingerprint, etag, segments: [] };
      const chunk = Math.ceil(size / maxSegments);
      for (let start = 0; start < size; start += chunk) meta.segments.push({ start, end: Math.min(size - 1, start + chunk - 1), bytes: 0 });
      try {
        await persist(metadataPath, { ...meta, bytes: 0 });
      } catch (error) {
        __hgDbg("init checkpoint skip: " + (error && error.code || "") + " " + (error && error.message || error));
      }
    } else {
      await handle2.truncate(size);
      try {
        await persist(metadataPath, { ...meta, bytes: downloaded() });
      } catch (error) {
        __hgDbg("resume checkpoint skip: " + (error && error.code || "") + " " + (error && error.message || error));
      }
    }
    progress();
    const controllers = /* @__PURE__ */ new Set();
    const abortAll = () => {
      for (const controller of controllers) controller.abort();
    };
    signal.addEventListener("abort", abortAll, { once: true });
    if (signal.aborted) abortAll();
    let lastSave = 0;
    const saveProgress = async (seg, force) => {
      const now = Date.now();
      if (!force && now - lastSave < 3000) return;
      lastSave = now;
      try {
        await persist(metadataPath, { ...meta, bytes: downloaded() });
      } catch (error) {
        __hgDbg("checkpoint skip: " + (error && error.code || "") + " " + (error && error.message || error));
      }
    };
    const runSegment = async (seg) => {
      const total = seg.end - seg.start + 1;
      for (let attempt = 0; attempt < 3; attempt++) {
        check(signal);
        if (seg.bytes >= total) return;
        const from = seg.start + seg.bytes;
        const controller = new AbortController();
        controllers.add(controller);
        const abort = () => controller.abort();
        signal.addEventListener("abort", abort, { once: true });
        let reader;
        try {
          const timer = setTimeout(() => controller.abort(), idleTimeoutMs);
          let response;
          try {
            response = await fetch(url, { signal: controller.signal, headers: { "Accept-Encoding": "identity", Range: `bytes=${from}-${seg.end}`, "If-Range": etag } });
          } catch {
            check(signal);
            throw network();
          } finally {
            clearTimeout(timer);
          }
          check(signal);
          if (response.status !== 206) {
            await response.body?.cancel().catch(() => {
            });
            if (response.status === 408 || response.status === 429 || response.status >= 500) throw network();
            throw new AppError("RESOURCE_EXPIRED", "\u89C6\u9891\u8D44\u6E90\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6");
          }
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") || "");
          if (!match || Number(match[1]) !== from || Number(match[3]) !== size) throw incomplete();
          const responseEtag = response.headers.get("etag");
          if (responseEtag && responseEtag !== etag) throw new AppError("RESOURCE_EXPIRED", "\u89C6\u9891\u8D44\u6E90\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6");
          const encoding = response.headers.get("content-encoding");
          if (encoding && encoding.toLowerCase() !== "identity") throw incomplete();
          reader = response.body.getReader();
          while (true) {
            check(signal);
            let next;
            try {
              next = await reader.read();
            } catch {
              check(signal);
              throw network();
            }
            if (next.done) break;
            const value = next.value;
            if (!value || !value.length) continue;
            const offset = seg.start + seg.bytes;
            if (offset + value.length > seg.end + 1) throw incomplete();
            if (throttle) {
              try {
                await throttle(value.length, signal);
              } catch {
                check(signal);
                throw new AppError("MEDIA_STREAM", "\u89C6\u9891\u4E0B\u8F7D\u8C03\u5EA6\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
              }
            }
            await writeAll(handle2, value, offset, signal);
            seg.bytes += value.length;
            await saveProgress(seg, false);
            progress();
          }
          if (seg.bytes !== total) throw incomplete();
          await saveProgress(seg, true);
          return;
        } catch (error) {
          check(signal);
          if (!(error instanceof AppError) || !["NETWORK", "INCOMPLETE_RESOURCE"].includes(error.code)) throw error;
        } finally {
          signal.removeEventListener("abort", abort);
          controllers.delete(controller);
          if (reader) {
            await reader.cancel().catch(() => {
            });
            reader.releaseLock();
          }
        }
        await backoff(300 * 2 ** attempt, signal);
      }
      throw network();
    };
    const queue = meta.segments.filter((seg) => seg.bytes < seg.end - seg.start + 1);
    await Promise.all(Array.from({ length: Math.min(maxSegments, queue.length) }, async () => {
      while (queue.length) {
        check(signal);
        const seg = queue.shift();
        await runSegment(seg);
      }
    }));
    if (downloaded() !== size) throw incomplete();
    try {
      await persist(metadataPath, { ...meta, bytes: size });
    } catch (error) {
      __hgDbg("final checkpoint skip: " + (error && error.code || "") + " " + (error && error.message || error));
    }
    completed = true;
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (error instanceof AppError) throw error;
    __hgDbg("seg download error: " + (error && error.code || "") + " " + (error && error.message || error));
    throw new AppError("MEDIA_CACHE", "\u65E0\u6CD5\u8BFB\u5199\u89C6\u9891\u7F13\u5B58\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5");
  } finally {
    if (handle2) {
      let failed = false;
      try {
        if (meta) await handle2.truncate(completed ? size : Math.max(0, ...meta.segments.map((seg) => seg.start + seg.bytes)));
      } catch (error) {
        __hgDbg("seg truncate failed: " + (error && error.code || "") + " " + (error && error.message || error));
        failed = true;
      }
      try {
        await handle2.close();
      } catch {
        failed = true;
      }
      if (failed) throw new AppError("MEDIA_CACHE", "\u65E0\u6CD5\u4FDD\u5B58\u89C6\u9891\u7F13\u5B58\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5");
    }
  }
}
async function downloadMedia(options) {
  const { url, path: path6, metadataPath, size, fingerprint, signal, onChunk, onProgress, throttle } = options;
  const idleTimeoutMs = options.idleTimeoutMs ?? 45e3;
  check(signal);
  if (!Number.isSafeInteger(size) || size <= 0 || !fingerprint || !Number.isFinite(idleTimeoutMs) || idleTimeoutMs <= 0 || path6 === metadataPath)
    throw new AppError("INVALID_INPUT", "\u89C6\u9891\u4E0B\u8F7D\u53C2\u6570\u65E0\u6548");
  const segments = Math.max(1, Math.min(32, Math.trunc(options.segments || 1)));
  if (!onChunk && segments > 1) return downloadSegmented({ ...options, segments });
  let handle2;
  let metadata = { version: 1, size, fingerprint, bytes: 0 };
  let delivered = false;
  const progress = () => {
    try {
      onProgress?.(metadata.bytes, size);
    } catch {
      check(signal);
      throw new AppError("MEDIA_STREAM", "\u89C6\u9891\u8FDB\u5EA6\u5904\u7406\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
    check(signal);
  };
  const emit = async (chunk, offset) => {
    check(signal);
    if (!onChunk) return;
    delivered = true;
    try {
      await onChunk(chunk, offset);
    } catch {
      check(signal);
      throw new AppError("MEDIA_STREAM", "\u89C6\u9891\u6D41\u5904\u7406\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
    check(signal);
  };
  try {
    handle2 = await (0, import_promises2.open)(path6, "r+").catch(async (error) => {
      if (error.code === "ENOENT") return (0, import_promises2.open)(path6, "w+");
      throw error;
    });
    const length = (await handle2.stat()).size;
    let saved;
    try {
      saved = JSON.parse(await (0, import_promises2.readFile)(metadataPath, "utf8"));
    } catch {
    }
    if (saved && saved.version === 1 && saved.size === size && saved.fingerprint === fingerprint && Number.isSafeInteger(saved.bytes) && saved.bytes >= 0 && saved.bytes < size && saved.bytes <= length && strongEtag(saved.etag)) {
      metadata = {
        version: 1,
        size,
        fingerprint,
        bytes: saved.bytes,
        etag: saved.etag,
        ...typeof saved.lastModified === "string" ? { lastModified: saved.lastModified } : {}
      };
    }
    await handle2.truncate(metadata.bytes);
    await persist(metadataPath, metadata);
    const reset = async () => {
      await handle2.truncate(0);
      metadata = { version: 1, size, fingerprint, bytes: 0 };
      await persist(metadataPath, metadata);
      if (delivered) throw new AppError("DOWNLOAD_RESTART_REQUIRED", "\u89C6\u9891\u8D44\u6E90\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u6D41\u5F0F\u5904\u7406\u540E\u91CD\u65B0\u51C6\u5907");
    };
    if (onChunk && metadata.bytes) {
      const buffer = Buffer.alloc(Math.min(256 * 1024, metadata.bytes));
      let offset = 0;
      while (offset < metadata.bytes) {
        check(signal);
        const { bytesRead } = await handle2.read(buffer, 0, Math.min(buffer.length, metadata.bytes - offset), offset);
        if (!bytesRead) throw incomplete();
        await emit(Buffer.from(buffer.subarray(0, bytesRead)), offset);
        offset += bytesRead;
      }
    }
    progress();
    for (let attempt = 0; attempt < 3; attempt++) {
      check(signal);
      if (metadata.bytes && (metadata.bytes === size || !strongEtag(metadata.etag))) await reset();
      const requestStart = metadata.bytes;
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      let response, reader, completed = false;
      const timed = async (operation) => {
        const timer = setTimeout(() => controller.abort(), idleTimeoutMs);
        try {
          return await operation();
        } finally {
          clearTimeout(timer);
        }
      };
      try {
        try {
          response = await timed(() => fetch(url, { signal: controller.signal, headers: {
            "Accept-Encoding": "identity",
            ...requestStart ? { "Range": `bytes=${requestStart}-`, "If-Range": metadata.etag } : {}
          } }));
        } catch {
          check(signal);
          throw network();
        }
        check(signal);
        if (response.status !== 200 && response.status !== 206) {
          if (response.status === 408 || response.status === 429 || response.status >= 500) throw network();
          throw new AppError("RESOURCE_EXPIRED", "\u89C6\u9891\u8D44\u6E90\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6");
        }
        if (!response.body) throw incomplete();
        if (requestStart && response.status === 200) await reset();
        const start = metadata.bytes;
        const etag = response.headers.get("etag");
        if (start && etag && etag !== metadata.etag) {
          await reset();
          throw network();
        }
        if (response.status === 206) {
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
          if (!match || Number(match[1]) !== start || Number(match[2]) !== size - 1 || Number(match[3]) !== size) throw incomplete();
        }
        const encoding = response.headers.get("content-encoding");
        if (encoding && encoding.toLowerCase() !== "identity") throw incomplete();
        const expected = size - start, headerLength = response.headers.get("content-length");
        if (headerLength !== null && (!/^\d+$/.test(headerLength) || Number(headerLength) !== expected)) throw incomplete();
        metadata = {
          version: 1,
          size,
          fingerprint,
          bytes: start,
          ...strongEtag(etag) ? { etag } : start && metadata.etag ? { etag: metadata.etag } : {},
          ...response.headers.get("last-modified") ? { lastModified: response.headers.get("last-modified") } : {}
        };
        await persist(metadataPath, metadata);
        reader = response.body.getReader();
        while (true) {
          check(signal);
          let next;
          try {
            next = await timed(() => reader.read());
          } catch {
            check(signal);
            throw network();
          }
          const { done, value } = next;
          check(signal);
          if (done) break;
          if (!value.length) continue;
          const offset = metadata.bytes;
          if (offset + value.length > size) throw incomplete();
          if (throttle) {
            try {
              await throttle(value.length, signal);
            } catch {
              check(signal);
              throw new AppError("MEDIA_STREAM", "\u89C6\u9891\u4E0B\u8F7D\u8C03\u5EA6\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
            }
          }
          check(signal);
          await writeAll(handle2, value, offset, signal);
          await handle2.sync();
          const checkpoint = { ...metadata, bytes: offset + value.length };
          await persist(metadataPath, checkpoint);
          metadata = checkpoint;
          await emit(value, offset);
          progress();
        }
        if (metadata.bytes !== size) throw incomplete();
        check(signal);
        completed = true;
        return;
      } catch (error) {
        check(signal);
        if (error instanceof AppError && error.code !== "NETWORK") throw error;
        if (error instanceof AppError && error.code === "NETWORK") {
          if (attempt === 2) throw network();
        } else {
          __hgDbg("dl write error: " + (error && error.code || "") + " " + (error && error.message || error));
          throw new AppError("MEDIA_CACHE", "\u65E0\u6CD5\u5199\u5165\u89C6\u9891\u7F13\u5B58\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5");
        }
      } finally {
        if (!completed) controller.abort();
        signal.removeEventListener("abort", abort);
        if (reader) {
          await reader.cancel().catch(() => {
          });
          reader.releaseLock();
        } else if (response?.body) await response.body.cancel().catch(() => {
        });
      }
      await backoff(200 * 2 ** attempt, signal);
    }
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (error instanceof AppError) throw error;
    throw new AppError("MEDIA_CACHE", "\u65E0\u6CD5\u8BFB\u5199\u89C6\u9891\u7F13\u5B58\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5");
  } finally {
    if (handle2) {
      let failed = false;
      try {
        await handle2.truncate(metadata.bytes);
      } catch {
        failed = true;
      }
      try {
        await handle2.close();
      } catch {
        failed = true;
      }
      if (failed) throw new AppError("MEDIA_CACHE", "\u65E0\u6CD5\u4FDD\u5B58\u89C6\u9891\u7F13\u5B58\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5");
    }
  }
}

// src/main/progressive.ts
var import_promises3 = require("node:fs/promises");
var import_node_child_process = require("node:child_process");
function streamableMp4(bytes) {
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    let size = bytes.readUInt32BE(offset);
    const kind = bytes.toString("ascii", offset + 4, offset + 8);
    if (size === 1) {
      if (offset + 16 > bytes.length) return;
      const large = bytes.readBigUInt64BE(offset + 8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      size = Number(large);
    }
    if (size < 8 || size > 2 * 1024 * 1024) return false;
    if (kind === "mdat") return false;
    if (offset + size > bytes.length) return;
    if (kind === "moov") return true;
    offset += size;
  }
}
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var GrowingMedia = class {
  constructor(file) {
    this.file = file;
  }
  file;
  done = false;
  error = false;
  complete(file) {
    this.file = file;
    this.done = true;
  }
  fail() {
    this.error = true;
    this.done = true;
  }
  response() {
    let offset = 0, cancelled3 = false;
    const body = new ReadableStream({
      pull: async (controller) => {
        while (!cancelled3) {
          if (this.error) {
            controller.error(new Error("\u89C6\u9891\u6D41\u51C6\u5907\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u8BD5"));
            return;
          }
          let handle2;
          try {
            handle2 = await (0, import_promises3.open)(this.file, "r");
            const info = await handle2.stat();
            if (info.size > offset) {
              const bytes = Buffer.alloc(Math.min(64 * 1024, info.size - offset));
              const part = await handle2.read(bytes, 0, bytes.length, offset);
              if (part.bytesRead) {
                offset += part.bytesRead;
                controller.enqueue(bytes.subarray(0, part.bytesRead));
                return;
              }
            }
          } catch (error) {
            if (error.code !== "ENOENT") {
              controller.error(new Error("\u672C\u5730\u89C6\u9891\u6D41\u8BFB\u53D6\u5931\u8D25"));
              return;
            }
          } finally {
            await handle2?.close();
          }
          if (this.done) {
            controller.close();
            return;
          }
          await delay(50);
        }
      },
      cancel: () => {
        cancelled3 = true;
      }
    });
    return new Response(body, { headers: { "content-type": "video/mp4", "accept-ranges": "none", "cache-control": "no-store" } });
  }
};
var ProgressiveEncoder = class {
  constructor(ffmpeg, output, key, duration, codec, signal, report, threads = 2, hwArgs = null) {
    this.output = output;
    this.ready = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    void this.ready.catch(() => {
    });
    const args = ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", ...key ? ["-decryption_key", key.toString("hex")] : [], "-i", "pipe:0", ...["h264", "avc1"].includes(codec) ? ["-c:v", "copy"] : ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", ...(hwArgs && hwArgs.length ? hwArgs : ["-c:v", "libx264", "-preset", "veryfast", "-threads", String(threads || 2), "-crf", "20"])], "-c:a", "aac", "-movflags", "+empty_moov+default_base_moof", "-frag_duration", "500000", "-flush_packets", "1", "-y", output];
    this.child = (0, import_node_child_process.spawn)(ffmpeg, args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let progress = "", actual = 0, polling = false;
    const child2 = this.child, abort = () => child2.kill();
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    const inspect = async () => {
      if (polling || this.stopped) return;
      polling = true;
      try {
        const info = await (0, import_promises3.stat)(output);
        if (info.size > 150 * 1024 * 1024) {
          child2.kill();
          return;
        }
        if (!this.readyDone && info.size > 1024) {
          const h = await (0, import_promises3.open)(output, "r");
          try {
            const buffer = Buffer.alloc(Math.min(info.size, 256 * 1024));
            await h.read(buffer, 0, buffer.length, 0);
            if (buffer.includes(Buffer.from("moof")) && buffer.includes(Buffer.from("mdat"))) {
              this.readyDone = true;
              this.readyResolve();
            }
          } finally {
            await h.close();
          }
        }
      } catch {
      } finally {
        polling = false;
      }
    };
    const poll = setInterval(() => void inspect(), 100), timeout = setTimeout(() => child2.kill(), Math.max(18e4, duration * 6e3 + 6e4));
    this.finished = new Promise((resolve, reject) => {
      const finish = (success) => {
        if (this.stopped) return;
        this.stopped = true;
        clearInterval(poll);
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
        const error = new AppError(signal.aborted ? "CANCELLED" : "MEDIA_DECODE", signal.aborted ? "\u64AD\u653E\u51C6\u5907\u5DF2\u53D6\u6D88" : "\u6E10\u8FDB\u89C6\u9891\u5904\u7406\u672A\u5B8C\u6210\uFF0C\u5C06\u4F7F\u7528\u5B8C\u6574\u51C6\u5907");
        if (!this.readyDone) this.readyReject(error);
        success ? resolve() : reject(error);
      };
      child2.stdout?.on("data", (data) => {
        progress += data;
        if (progress.length > 5e4) progress = progress.slice(-25e3);
        const time = Number([...progress.matchAll(/^out_time_us=(\d+)\r?\n/gm)].at(-1)?.[1]) / 1e6;
        if (Number.isFinite(time)) {
          actual = time;
          report(Math.min(99, Math.floor(time / duration * 100)));
        }
        void inspect();
      });
      child2.stderr?.resume();
      child2.stdin?.on("error", () => {
      });
      child2.once("error", () => finish(false));
      child2.once("close", (code) => finish(!signal.aborted && code === 0 && Math.abs(actual - duration) < 1));
    });
    void this.finished.catch(() => {
    });
  }
  output;
  ready;
  finished;
  child;
  stopped = false;
  readyDone = false;
  readyResolve;
  readyReject;
  async write(bytes) {
    if (this.stopped || !this.child.stdin) throw new AppError("MEDIA_DECODE", "\u6E10\u8FDB\u8F93\u5165\u65E0\u6CD5\u7EE7\u7EED");
    await new Promise((resolve, reject) => {
      this.child.stdin.write(bytes, (error) => error ? reject(new AppError("MEDIA_DECODE", "\u6E10\u8FDB\u8F93\u5165\u65E0\u6CD5\u7EE7\u7EED")) : resolve());
    });
  }
  end() {
    this.child.stdin?.end();
    return this.finished;
  }
  stop() {
    this.child.kill();
  }
};

// src/main/transfer-limits.ts
var TransferLimiter = class {
  rate = 0;
  tokens = 0;
  at = Date.now();
  queue = [];
  timer;
  setRate(rate) {
    if (rate === this.rate) return;
    this.refill();
    this.rate = rate;
    this.tokens = Math.min(this.tokens, Math.max(65536, rate / 4));
    if (rate > 0 && !this.tokens) this.tokens = Math.max(65536, rate / 4);
    this.pump();
  }
  refill() {
    const now = Date.now();
    if (this.rate) this.tokens = Math.min(Math.max(65536, this.rate / 4), this.tokens + (now - this.at) * this.rate / 1e3);
    this.at = now;
  }
  async consume(bytes, signal) {
    for (let left = bytes; left > 0; left -= 65536) await this.take(Math.min(65536, left), signal);
  }
  take(bytes, signal) {
    if (signal.aborted) return Promise.reject(new AppError("CANCELLED", "\u64AD\u653E\u51C6\u5907\u5DF2\u53D6\u6D88"));
    if (!this.rate) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { bytes, signal, resolve, reject, abort: () => {
        this.queue = this.queue.filter((item) => item !== waiter);
        signal.removeEventListener("abort", waiter.abort);
        reject(new AppError("CANCELLED", "\u64AD\u653E\u51C6\u5907\u5DF2\u53D6\u6D88"));
        this.pump();
      } };
      signal.addEventListener("abort", waiter.abort, { once: true });
      this.queue.push(waiter);
      this.pump();
    });
  }
  pump() {
    clearTimeout(this.timer);
    this.refill();
    while (this.queue.length && (!this.rate || this.tokens >= this.queue[0].bytes)) {
      const item = this.queue.shift();
      item.signal.removeEventListener("abort", item.abort);
      if (this.rate) this.tokens -= item.bytes;
      item.resolve();
    }
    if (this.queue.length && this.rate) this.timer = setTimeout(() => this.pump(), Math.max(1, Math.min(1e3, Math.ceil((this.queue[0].bytes - this.tokens) / this.rate * 1e3))));
  }
  close() {
    clearTimeout(this.timer);
    for (const item of [...this.queue]) item.abort();
    clearTimeout(this.timer);
  }
};

// src/main/media.ts
function parseRange(header, size) {
  if (!Number.isSafeInteger(size) || size <= 0) return null;
  if (!header) return { start: 0, end: size - 1, status: 200 };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!m || !m[1] && !m[2]) return null;
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] ? m[2] ? Math.min(size - 1, Number(m[2])) : size - 1 : size - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && start < size && end >= start ? { start, end, status: 206 } : null;
}
function decodeContentKey(encoded) {
  if (typeof encoded !== "string" || encoded.length > 4096 || !encoded.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new AppError("UNSUPPORTED_RESOURCE", "\u89C6\u9891\u5BC6\u94A5\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  const packet2 = Buffer.from(encoded, "base64");
  if (packet2.length < 5) throw new AppError("UNSUPPORTED_RESOURCE", "\u89C6\u9891\u5BC6\u94A5\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  const tagLength = (packet2[0] ^ packet2[1] ^ packet2[2]) - 48;
  const count2 = packet2.length - tagLength - 1;
  if (tagLength < 1 || tagLength > packet2.length - 3 || count2 < 3) throw new AppError("UNSUPPORTED_RESOURCE", "\u89C6\u9891\u5BC6\u94A5\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  const salt = packet2[packet2.length - tagLength - 2] ^ packet2[packet2.length - tagLength - 1];
  const tag = Buffer.from(packet2.subarray(packet2.length - tagLength).map((b) => b ^ salt)).toString("ascii");
  if (tag === "app_v2" || tag === "web_v2") throw new AppError("UNSUPPORTED_RESOURCE", "\u6B64\u4F5C\u54C1\u7684\u52A0\u5BC6\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  const original = packet2.subarray(1, count2 + 1), decoded = Buffer.alloc(count2);
  for (let i = 0; i < count2; i++) {
    let bits = 0, n = i;
    while (n) {
      bits += n & 1;
      n >>>= 1;
    }
    decoded[i] = (original[i] ^ (i < 2 ? [250, 85][i] : original[i - 2])) - 21 - bits & 255;
  }
  const prefix = String.fromCharCode(decoded[0]);
  if (!/^[0-9a-f]$/.test(prefix)) throw new AppError("UNSUPPORTED_RESOURCE", "\u89C6\u9891\u5BC6\u94A5\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  const key = decoded.subarray(1, count2 - Number.parseInt(prefix, 16)).toString("ascii");
  if (!/^[0-9a-f]{32}$/.test(key)) throw new AppError("UNSUPPORTED_RESOURCE", "\u89C6\u9891\u5BC6\u94A5\u683C\u5F0F\u6682\u4E0D\u652F\u6301");
  return Buffer.from(key, "hex");
}
var CACHE_POLICY = "highest-resolution-crf20-v1";
var CACHE_LIMIT = 1024 * 1024 * 1024;
var FILE_LIMIT = 150 * 1024 * 1024;
var SPACE_RESERVE = 1024 * 1024 * 1024;
var cancelled2 = () => new AppError("CANCELLED", "\u64AD\u653E\u51C6\u5907\u5DF2\u53D6\u6D88");
function check2(signal) {
  if (signal.aborted) throw cancelled2();
}
function abortable(task, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(cancelled2());
    signal.addEventListener("abort", abort, { once: true });
    task.then((value) => {
      signal.removeEventListener("abort", abort);
      signal.aborted ? reject(cancelled2()) : resolve(value);
    }, (error) => {
      signal.removeEventListener("abort", abort);
      reject(error);
    });
    if (signal.aborted) abort();
  });
}
var MediaCache = class {
  constructor(directory, ffmpeg, getResource, options = {}) {
    this.directory = directory;
    this.ffmpeg = ffmpeg;
    this.getResource = getResource;
    this.options = options;
  }
  directory;
  ffmpeg;
  getResource;
  options;
  entries = /* @__PURE__ */ new Map();
  jobs = /* @__PURE__ */ new Map();
  activeJobs = /* @__PURE__ */ new Set();
  groups = [];
  groupIndex = /* @__PURE__ */ new Map();
  groupCursor = 0;
  suspended = false;
  window = [];
  protectedIds = /* @__PURE__ */ new Set();
  pausedMessage = "";
  failed = /* @__PURE__ */ new Set();
  closing = false;
  processing = 0;
  processingQueue = [];
  transfers = /* @__PURE__ */ new Map();
  deletionMetadata = /* @__PURE__ */ new Map();
  transferStarted = 0;
  network = { ok: null, ms: 0, at: 0, detail: "" };
  quality = "auto";
  maxBytes = 0;
  limiter = new TransferLimiter();
  hw = null;
  hevcSupported = false;
  decodeMode = 0;
  setDecodeMode(value) {
    if (![0, 1, 2, 3].includes(value)) throw new AppError("INVALID_INPUT", "\u89E3\u7801\u65B9\u5F0F\u65E0\u6548");
    this.decodeMode = value;
    __hgDbg("decode mode: " + value);
  }
  setHevcSupported(value) {
    this.hevcSupported = !!value;
    __hgDbg("hevc supported: " + this.hevcSupported);
  }
  growing = /* @__PURE__ */ new Map();
  partialBytes = /* @__PURE__ */ new Map();
  async init() {
    await (0, import_promises4.mkdir)(this.directory, { recursive: true });
    try {
      __hgHwPromise = __hgHwPromise || __hgDetectHw(this.ffmpeg);
      this.hw = await __hgHwPromise;
    } catch {
      this.hw = null;
    }
    void this.checkNetwork();
    const __hgNetTimer = setInterval(() => void this.checkNetwork(), 30000);
    if (__hgNetTimer.unref) __hgNetTimer.unref();
    for (const name of await (0, import_promises4.readdir)(this.directory)) {
      if (/^[a-f0-9]{32}\.json$/.test(name)) {
        try {
          const e = JSON.parse(await (0, import_promises4.readFile)(import_node_path2.default.join(this.directory, name), "utf8"));
          if (e.policy === CACHE_POLICY && validId(e.episodeId) && Number.isFinite(e.duration) && e.duration > 0 && typeof e.definition === "string" && e.key === name.slice(0, 32)) {
            e.file = import_node_path2.default.join(this.directory, e.key + ".mp4");
            const info = await (0, import_promises4.stat)(e.file);
            if (info.size > 0 && info.size <= FILE_LIMIT) {
              e.bytes = info.size;
              this.entries.set(e.episodeId, e);
            }
          }
        } catch {
        }
      }
      if (/^[a-f0-9]{32}\.(?:input|working)\.mp4$/.test(name)) await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name)).catch(() => {
      });
      if (/^[a-f0-9]{32}\.partial\.mp4$/.test(name)) {
        const info = await (0, import_promises4.stat)(import_node_path2.default.join(this.directory, name));
        if (info.size <= FILE_LIMIT && Date.now() - info.mtimeMs < 7 * 864e5) this.partialBytes.set(name, info.size);
        else {
          await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name)).catch(() => {
          });
          await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name.replace(".mp4", ".json"))).catch(() => {
          });
        }
      }
    }
    const liveKeys = new Set([...this.entries.values()].map((e) => e.key));
    for (const name of await (0, import_promises4.readdir)(this.directory)) {
      if (/^[a-f0-9]{32}\.(?:mp4|json)$/.test(name) && !liveKeys.has(name.split(".")[0])) await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name)).catch(() => {
      });
    }
  }
  setBufferWindow(ids) {
    if (!Array.isArray(ids) || ids.length > 5e3 || ids.some((id) => !validId(id)) || new Set(ids).size !== ids.length) throw new AppError("INVALID_INPUT", "\u7F13\u51B2\u5267\u96C6\u5217\u8868\u65E0\u6548");
    if (this.closing) return this.bufferState();
    const sameWork = ids.length === this.protectedIds.size && ids.every((id) => this.protectedIds.has(id));
    if (ids.length) {
      this.protectedIds = new Set(ids);
      if (!sameWork) this.pausedMessage = "";
    }
    this.window = [...ids];
    this.failed = new Set([...this.failed].filter((id) => ids.includes(id) || this.groups.some((group) => group.ids.includes(id))));
    for (const job of this.jobs.values()) {
      if (job.foreground && job.id !== ids[0]) {
        if (this.inBackground(job.id) && this.activeJobs.has(job)) job.foreground = false;
        else this.cancel(job);
      } else if (!ids.includes(job.id) && !this.inBackground(job.id)) this.cancel(job);
    }
    this.pump();
    return this.bufferState();
  }
  bufferState() {
    return this.stateFor(this.window);
  }
  stateFor(ids) {
    const total = ids.length, ready = ids.filter((id) => this.cached(id)).length;
    const failed = ids.filter((id) => !this.cached(id) && this.failed.has(id)).length;
    const activities = [...this.activeJobs].filter((job) => !job.controller.signal.aborted && ids.includes(job.id)).map((job) => ({ episodeId: job.id, activity: job.progress ? { ...job.progress } : void 0 }));
    const activeId = activities[0]?.episodeId;
    const currentFailed = !this.groups.length && this.failed.has(ids[0]) && !this.cached(ids[0]);
    const status = !total ? "idle" : ready === total ? "complete" : this.pausedMessage ? "paused" : currentFailed ? "partial" : activeId || ready + failed < total ? "preparing" : "partial";
    const message = status === "paused" ? this.pausedMessage : status === "complete" ? "\u5168\u5267\u5DF2\u7F13\u5B58\uFF0C\u53EF\u76F4\u63A5\u64AD\u653E\u5DF2\u7F13\u5B58\u5267\u96C6" : status === "partial" ? "\u90E8\u5206\u5267\u96C6\u51C6\u5907\u5931\u8D25\uFF0C\u53EF\u91CD\u8BD5\u7F13\u5B58" : "";
    return { status, total, ready, failed, activeId, active: activities[0]?.activity, activities, cachedBytes: ids.reduce((sum, id) => sum + this.retainedBytes(id), 0), message };
  }
  inBackground(id) {
    return this.groups.some((group) => !group.paused && group.ids.includes(id));
  }
  setBackgroundGroups(groups) {
    if (!Array.isArray(groups) || groups.length > 100 || groups.some((group) => !validId(group.id) || !Array.isArray(group.ids) || group.ids.length > 5e3 || group.ids.some((id) => !validId(id)) || new Set(group.ids).size !== group.ids.length)) throw new AppError("INVALID_INPUT", "\u540E\u53F0\u7F13\u5B58\u961F\u5217\u65E0\u6548");
    this.groups = groups.map((group) => ({ ...group, ids: [...group.ids] }));
    this.groupIndex = /* @__PURE__ */ new Map();
    for (const group of this.groups) for (const id of group.ids) this.groupIndex.set(id, group.id);
    for (const job of this.jobs.values()) if (!job.foreground && !this.inBackground(job.id) && job.id !== this.window[0]) this.cancel(job);
    this.pump();
  }
  retryBuffer(ids) {
    if (this.closing) return this.bufferState();
    this.pausedMessage = "";
    if (ids) for (const id of ids) this.failed.delete(id);
    else this.failed.clear();
    if (!ids && this.window[0] && !this.entries.has(this.window[0]) && !this.jobs.has(this.window[0])) this.enqueue(this.window[0], false, true);
    this.pump();
    return this.bufferState();
  }
  prepare(id, force = false) {
    if (!validId(id)) return Promise.reject(new AppError("INVALID_INPUT", "\u5267\u96C6\u7F16\u53F7\u65E0\u6548"));
    if (this.closing) return Promise.reject(cancelled2());
    if (this.suspended) return Promise.reject(new AppError("CACHE_MOVING", "\u6B63\u5728\u8FC1\u79FB\u7F13\u5B58\uFF0C\u8BF7\u7A0D\u540E\u518D\u64AD\u653E"));
    const cached = this.cached(id);
    if (cached && !force) {
      cached.touched = Date.now();
      return Promise.resolve(this.result(cached));
    }
    const existing = this.jobs.get(id);
    if (existing && !existing.controller.signal.aborted) {
      if (force && existing.everReady) this.cancel(existing);
      else {
        existing.foreground = true;
        if (existing.progressivePlayback) existing.resolve(existing.progressivePlayback);
        if (existing.progress?.stage === "waiting") this.prioritizeProcessing(existing.controller.signal);
        return existing.promise;
      }
    }
    if (this.activeJobs.size >= this.concurrency) {
      const background = [...this.activeJobs].find((job2) => !job2.foreground && job2.id !== id);
      if (background) this.cancel(background);
    }
    this.failed.delete(id);
    const job = this.enqueue(id, force, true);
    this.pump();
    return job.promise;
  }
  enqueue(id, force, foreground) {
    let resolve, reject;
    const promise = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    const job = { id, force, foreground, controller: new AbortController(), promise, resolve, reject, quality: this.quality };
    this.jobs.set(id, job);
    void promise.catch(() => {
    });
    return job;
  }
  renewPlaybackWait(job) {
    job.promise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });
    void job.promise.catch(() => {
    });
  }
  cancel(job) {
    job.controller.abort();
    if (!this.activeJobs.has(job)) {
      if (this.jobs.get(job.id) === job) this.jobs.delete(job.id);
      job.reject(cancelled2());
    }
  }
  get concurrency() {
    return Math.max(1, Math.min(128, this.options.concurrency || 1));
  }
  get processingLimit() {
    const level = this.options.decodeLevel ?? 1;
    if (level === 0) return 2;
    try {
      var n = (import_node_os.cpus() || []).length || 8;
      return Math.max(2, Math.min(level === 2 ? 8 : 4, Math.floor(n / 2)));
    } catch { return level === 2 ? 4 : 2; }
  }
  get decodeThreads() {
    return [1, 2, 4][this.options.decodeLevel ?? 1] || 2;
  }
  get downloadConcurrency() {
    return this.concurrency;
  }
  cached(id) {
    const entry = this.entries.get(id);
    return entry && (entry.quality ?? "auto") === this.quality ? entry : void 0;
  }
  setQuality(value) {
    if (!["auto", "1080p", "720p", "540p", "480p", "360p"].includes(value)) throw new AppError("INVALID_INPUT", "\u753B\u8D28\u9009\u9879\u65E0\u6548");
    if (value === this.quality) return;
    this.quality = value;
    this.failed.clear();
    this.pausedMessage = "";
    for (const job of this.jobs.values()) this.cancel(job);
    this.pump();
  }
  setLimits(value) {
    if (!value || !Number.isSafeInteger(value.maxBytes) || value.maxBytes < 0 || !Number.isSafeInteger(value.bytesPerSecond) || value.bytesPerSecond < 0) throw new AppError("INVALID_INPUT", "\u7F13\u5B58\u989D\u5EA6\u6216\u9650\u901F\u65E0\u6548");
    const changed = this.maxBytes !== value.maxBytes;
    this.maxBytes = value.maxBytes;
    this.limiter.setRate(value.bytesPerSecond);
    if (changed && this.pausedMessage.includes("\u7F13\u5B58\u989D\u5EA6")) {
      this.pausedMessage = "";
      this.pump();
    }
  }
  setConcurrency(value) {
    if (!Number.isSafeInteger(value) || value < 2 || value > 128) throw new AppError("INVALID_INPUT", "\u8BF7\u9009\u62E9 2\u81F3 128 \u8DEF\u5E76\u884C\u51C6\u5907");
    this.options.concurrency = value;
    this.pump();
  }
  setSegments(value) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 128) throw new AppError("INVALID_INPUT", "\u8BF7\u9009\u62E9 1\u81F3 128 \u8DEF\u5355\u6587\u4EF6\u4E0B\u8F7D\u7EBF\u7A0B");
    this.options.segments = value;
  }
  setDecodeLevel(value) {
    if (![0, 1, 2].includes(value)) throw new AppError("INVALID_INPUT", "\u89E3\u7801\u6863\u4F4D\u65E0\u6548");
    this.options.decodeLevel = value;
  }
  async checkNetwork() {
    const started = Date.now();
    let ok = false, detail = "";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch("https://hongguoduanju.com/", { method: "HEAD", signal: controller.signal, redirect: "follow" });
        ok = response.status < 500;
        detail = "HTTP " + response.status;
        await response.body?.cancel().catch(() => {
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      detail = error && error.name === "AbortError" ? "\u8D85\u65F6" : String(error && error.message || error).slice(0, 120);
    }
    this.network = { ok, ms: Date.now() - started, at: Date.now(), detail };
    return this.network;
  }
  get downloadBytesPerSecond() {
    const now = Date.now(), bucket = Math.floor(now / 1e3);
    let bytes = 0, seconds = 0;
    for (const [second, count2] of this.transfers) {
      if (second < bucket - 3) this.transfers.delete(second);
      else {
        bytes += count2;
        seconds = Math.max(seconds, bucket - second + 1);
      }
    }
    return bytes ? Math.round(bytes / Math.max(1, Math.min(4, seconds))) : 0;
  }
  transferred(bytes) {
    const now = Date.now();
    if (!this.transferStarted) this.transferStarted = now;
    const bucket = Math.floor(now / 1e3);
    this.transfers.set(bucket, (this.transfers.get(bucket) || 0) + bytes);
    for (const key of this.transfers.keys()) if (key < bucket - 4) this.transfers.delete(key);
  }
  processor(signal) {
    return new Promise((resolve, reject) => {
      const entry = { signal, grant: (release) => {
        signal.removeEventListener("abort", abort);
        resolve(release);
      }, reject: () => {
        signal.removeEventListener("abort", abort);
        reject(cancelled2());
      } };
      const abort = () => {
        const index = this.processingQueue.indexOf(entry);
        if (index >= 0) this.processingQueue.splice(index, 1);
        entry.reject();
      };
      signal.addEventListener("abort", abort, { once: true });
      this.processingQueue.push(entry);
      if (signal.aborted) abort();
      this.prioritizeProcessing(signal);
      this.pumpProcessors();
    });
  }
  prioritizeProcessing(signal) {
    if (!signal.aborted && this.processing >= this.processingLimit && [...this.activeJobs].some((job) => job.foreground && job.controller.signal === signal)) {
      const background = [...this.activeJobs].find((job) => !job.foreground && !job.controller.signal.aborted && (job.progress?.stage === "processing" || job.processingActive));
      if (background) this.cancel(background);
    }
  }
  hasDeletionPending(ids) {
    return ids.some((id) => this.deletionMetadata.has(id));
  }
  pumpProcessors() {
    while (this.processing < this.processingLimit && this.processingQueue.length) {
      const first = this.processingQueue.findIndex((item) => [...this.activeJobs].some((job) => job.foreground && job.controller.signal === item.signal));
      const [entry] = this.processingQueue.splice(first < 0 ? 0 : first, 1);
      if (entry.signal.aborted) {
        entry.reject();
        continue;
      }
      this.processing++;
      let released = false;
      entry.grant(() => {
        if (released) return;
        released = true;
        this.processing--;
        this.pumpProcessors();
      });
    }
  }
  async deleteEpisodes(ids) {
    if (!Array.isArray(ids) || ids.length > 5e3 || ids.some((id) => !validId(id)) || new Set(ids).size !== ids.length) throw new AppError("INVALID_INPUT", "\u5220\u9664\u7F13\u5B58\u7684\u5206\u96C6\u5217\u8868\u65E0\u6548");
    if (this.suspended || this.closing) throw new AppError("CACHE_BUSY", "\u7F13\u5B58\u6B63\u5728\u8FC1\u79FB\u6216\u9000\u51FA\uFF0C\u8BF7\u7A0D\u540E\u518D\u5220\u9664");
    if (ids.some((id) => this.window.includes(id))) throw new AppError("CACHE_IN_USE", "\u4F5C\u54C1\u4ECD\u5728\u64AD\u653E\u9875\u6253\u5F00\uFF0C\u8BF7\u5148\u8FD4\u56DE\u7F13\u5B58\u4E2D\u5FC3\u518D\u5220\u9664");
    this.suspended = true;
    let freedBytes = 0, failed = false;
    try {
      const selected = new Set(ids), pending = [.../* @__PURE__ */ new Set([...this.jobs.values(), ...this.activeJobs])].filter((job) => selected.has(job.id));
      for (const job of pending) this.cancel(job);
      await Promise.allSettled(pending.map((job) => job.completion ?? job.promise));
      for (const id of ids) {
        const entry = this.entries.get(id), key = entry?.key || this.deletionMetadata.get(id);
        if (entry) {
          try {
            await (0, import_promises4.unlink)(entry.file);
          } catch (error) {
            if (error.code !== "ENOENT") {
              failed = true;
              continue;
            }
          }
          this.entries.delete(id);
          freedBytes += entry.bytes || 0;
        }
        this.failed.delete(id);
        this.protectedIds.delete(id);
        for (const quality of ["auto", "1080p", "720p", "540p", "480p", "360p"]) {
          const name = this.partialName(id, quality);
          try {
            const bytes = this.partialBytes.get(name + ".mp4") || 0;
            await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name + ".mp4"));
            this.partialBytes.delete(name + ".mp4");
            freedBytes += bytes;
          } catch (error) {
            if (error.code !== "ENOENT") failed = true;
          }
          try {
            await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, name + ".json"));
          } catch (error) {
            if (error.code !== "ENOENT") failed = true;
          }
        }
        if (key) {
          this.deletionMetadata.set(id, key);
          try {
            await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, key + ".json"));
            this.deletionMetadata.delete(id);
          } catch (error) {
            if (error.code !== "ENOENT") failed = true;
            else this.deletionMetadata.delete(id);
          }
        }
      }
      if (failed) throw new AppError("CACHE_DELETE", "\u90E8\u5206\u7F13\u5B58\u6587\u4EF6\u65E0\u6CD5\u5220\u9664\uFF0C\u4EFB\u52A1\u5DF2\u6682\u505C\uFF1B\u8BF7\u5173\u95ED\u5360\u7528\u6587\u4EF6\u7684\u7A0B\u5E8F\u6216\u68C0\u67E5\u76EE\u5F55\u6743\u9650\u540E\u91CD\u8BD5\u5220\u9664");
      return { freedBytes };
    } finally {
      this.suspended = false;
      this.pump();
    }
  }
  get location() {
    return this.directory;
  }
  get usedBytes() {
    return [...this.entries.values()].reduce((sum, entry) => sum + (entry.bytes || 0), 0) + [...this.partialBytes.values()].reduce((sum, bytes) => sum + bytes, 0);
  }
  retainedBytes(id) {
    let bytes = this.entries.get(id)?.bytes || 0;
    if (this.partialBytes.size) for (const quality of ["auto", "1080p", "720p", "540p", "480p", "360p"]) bytes += this.partialBytes.get(this.partialName(id, quality) + ".mp4") || 0;
    return bytes;
  }
  // The quota covers projected retained files. Active source/working files are
  // additional temporary disk overhead; disk headroom and processor slots still apply.
  projectedBytes() {
    let bytes = this.usedBytes;
    for (const job of this.activeJobs) {
      if (job.controller.signal.aborted || job.capacityBytes === void 0) continue;
      bytes -= this.partialBytes.get(this.partialName(job.id, job.quality) + ".mp4") || 0;
      if (!job.capacityCommitted) bytes += job.capacityBytes - (this.entries.get(job.id)?.bytes || 0);
    }
    return bytes;
  }
  checkBudget(job) {
    if (this.maxBytes && this.projectedBytes() > this.maxBytes) {
      job.capacityBytes = void 0;
      throw new AppError("CACHE_BUDGET", "\u7F13\u5B58\u989D\u5EA6\u4E0D\u8DB3\uFF0C\u5DF2\u6682\u505C\u65B0\u4EFB\u52A1\uFF1B\u8BF7\u6E05\u7406\u7F13\u5B58\u6216\u63D0\u9AD8\u7F13\u5B58\u989D\u5EA6\u540E\u91CD\u8BD5");
    }
  }
  async freeBytes() {
    const info = await (0, import_promises4.statfs)(this.directory);
    return info.bavail * info.bsize;
  }
  async relocate(destination, commit) {
    if (this.suspended || this.closing) throw new AppError("CACHE_BUSY", "\u7F13\u5B58\u6B63\u5728\u8FC1\u79FB\u6216\u9000\u51FA\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    const source = import_node_path2.default.resolve(this.directory), target = import_node_path2.default.resolve(destination);
    if (source.toLowerCase() === target.toLowerCase()) return;
    const nested = (a, b) => {
      const relative = import_node_path2.default.relative(a, b);
      return relative === "" || !relative.startsWith("..") && !import_node_path2.default.isAbsolute(relative);
    };
    if (nested(source, target) || nested(target, source)) throw new AppError("CACHE_PATH", "\u65B0\u65E7\u7F13\u5B58\u76EE\u5F55\u4E0D\u80FD\u76F8\u4E92\u5305\u542B");
    this.suspended = true;
    const copied = [];
    try {
      const pending = [.../* @__PURE__ */ new Set([...this.jobs.values(), ...this.activeJobs])];
      for (const job of pending) this.cancel(job);
      await Promise.allSettled(pending.map((job) => job.completion ?? job.promise));
      await (0, import_promises4.mkdir)(target, { recursive: true });
      if ((await (0, import_promises4.readdir)(target)).length) throw new AppError("CACHE_PATH", "\u76EE\u6807\u4E13\u7528\u7F13\u5B58\u6587\u4EF6\u5939\u4E0D\u662F\u7A7A\u6587\u4EF6\u5939\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u4F4D\u7F6E");
      const info = await (0, import_promises4.statfs)(target);
      if (info.bavail * info.bsize < this.usedBytes + SPACE_RESERVE + 2 * FILE_LIMIT * this.concurrency) throw new AppError("DISK_SPACE", "\u76EE\u6807\u78C1\u76D8\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u539F\u7F13\u5B58\u53CA\u76EE\u5F55\u8BBE\u7F6E\u672A\u66F4\u6539");
      const hash2 = async (file) => {
        const digest = (0, import_node_crypto3.createHash)("sha256");
        for await (const chunk of (0, import_node_fs2.createReadStream)(file)) digest.update(chunk);
        return digest.digest("hex");
      };
      for (const entry of this.entries.values()) for (const suffix of [".mp4", ".json"]) {
        if (this.closing) throw cancelled2();
        const from = import_node_path2.default.join(source, entry.key + suffix), to = import_node_path2.default.join(target, entry.key + suffix);
        await (0, import_promises4.copyFile)(from, to, import_node_fs2.constants.COPYFILE_EXCL);
        copied.push(to);
        if (await hash2(from) !== await hash2(to)) throw new AppError("CACHE_VERIFY", "\u8FC1\u79FB\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u539F\u7F13\u5B58");
      }
      for (const name of this.partialBytes.keys()) for (const file of [name, name.replace(".mp4", ".json")]) {
        if (this.closing) throw cancelled2();
        const from = import_node_path2.default.join(source, file), to = import_node_path2.default.join(target, file);
        const exists = await (0, import_promises4.stat)(from).catch(() => null);
        if (!exists) continue;
        await (0, import_promises4.copyFile)(from, to, import_node_fs2.constants.COPYFILE_EXCL);
        copied.push(to);
        if (await hash2(from) !== await hash2(to)) throw new AppError("CACHE_VERIFY", "\u65AD\u70B9\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF0C\u7EE7\u7EED\u4F7F\u7528\u539F\u76EE\u5F55");
      }
      if (this.closing) throw cancelled2();
      await commit();
      this.directory = target;
      for (const entry of this.entries.values()) entry.file = import_node_path2.default.join(target, entry.key + ".mp4");
    } catch (error) {
      for (const file of copied) await (0, import_promises4.unlink)(file).catch(() => {
      });
      if (error instanceof AppError) throw error;
      throw new AppError("CACHE_MOVE", "\u7F13\u5B58\u8FC1\u79FB\u5931\u8D25\uFF0C\u539F\u7F13\u5B58\u53CA\u76EE\u5F55\u8BBE\u7F6E\u672A\u66F4\u6539\uFF0C\u8BF7\u68C0\u67E5\u76EE\u6807\u76EE\u5F55\u6743\u9650\u548C\u7A7A\u95F4");
    } finally {
      this.suspended = false;
      this.pump();
    }
  }
  pump() {
    if (this.closing || this.suspended) return;
    while (this.activeJobs.size < this.concurrency) {
      let job = [...this.jobs.values()].find((job2) => job2.foreground && !job2.controller.signal.aborted && !this.activeJobs.has(job2) && ![...this.activeJobs].some((other) => other.id === job2.id));
      if (!job && this.window.length) {
        const nextId = this.window.slice(0, 4).find((id) => !this.cached(id) && !this.failed.has(id) && !this.jobs.has(id) && this.inBackground(id));
        if (nextId) {
          if (this.activeJobs.size >= this.concurrency) {
            const victim = [...this.activeJobs].find((running2) => !running2.foreground && !this.window.includes(running2.id));
            if (victim) {
              this.cancel(victim);
              return;
            }
          }
          job = this.enqueue(nextId, false, false);
        }
      }
      if (!job && !this.pausedMessage) {
        const groups = Array.from({ length: 4 }, (_, round) => this.groups.filter((group) => round < (group.priority === "high" ? 4 : group.priority === "low" ? 1 : 2))).flat();
        if (this.window[0] && (this.cached(this.window[0]) || [...this.jobs.values()].some((job2) => job2.id === this.window[0] && job2.ready)) && !groups.some((group) => group.ids.includes(this.window[0]))) groups.push({ id: "current", ids: this.window.slice(1), paused: false });
        const counts = /* @__PURE__ */ new Map();
        for (const running2 of this.activeJobs) {
          const gid = running2.foreground ? "current" : this.groupIndex.get(running2.id);
          if (gid) counts.set(gid, (counts.get(gid) || 0) + 1);
        }
        const activeGroups = groups.filter((group) => !group.paused).length || 1;
        const share = Math.max(1, Math.ceil(this.concurrency / activeGroups));
        const pick = (enforceShare) => {
          for (let n = 0; n < groups.length; n++) {
            const index = (this.groupCursor + n) % groups.length, group = groups[index];
            if (group.paused) continue;
            if (enforceShare && (counts.get(group.id) || 0) >= share) continue;
            const id = group.ids.find((id2) => !this.cached(id2) && !this.failed.has(id2) && !this.jobs.has(id2));
            if (id) {
              this.groupCursor = (index + 1) % groups.length;
              return this.enqueue(id, false, false);
            }
          }
          return null;
        };
        job = pick(true) || pick(false);
      }
      if (!job) return;
      const running = job;
      this.activeJobs.add(running);
      const finish = () => {
        if (this.jobs.get(running.id) === running) this.jobs.delete(running.id);
        this.activeJobs.delete(running);
      };
      running.completion = this.run(running).then((value) => {
        finish();
        running.resolve(value);
        this.pump();
      }, (error) => {
        if (!running.controller.signal.aborted) {
          if (error instanceof AppError && ["DISK_SPACE", "DISK_CHECK", "CACHE_BUDGET"].includes(error.code)) this.pausedMessage = error.message;
          else this.failed.add(running.id);
        }
        finish();
        running.reject(error);
        this.pump();
      });
    }
  }
  async run(job) {
    const signal = job.controller.signal;
    let last;
    for (let attempt = 0; attempt < 2; attempt++) {
      check2(signal);
      try {
        job.progress = { stage: "resolving" };
        await this.ensureSpace(signal);
        const start = Date.now(), resource = await abortable(this.getResource(job.id, job.quality), signal);
        this.options.diagnostics?.record({ stage: "resolve", code: "OK", ms: Date.now() - start });
        check2(signal);
        if (!Number.isSafeInteger(resource.size) || resource.size <= 0 || resource.size > FILE_LIMIT) throw new AppError("UNSUPPORTED_RESOURCE", "\u64AD\u653E\u8D44\u6E90\u4E0D\u5B8C\u6574\u6216\u5927\u5C0F\u6682\u4E0D\u652F\u6301");
        job.capacityBytes = resource.size;
        job.capacityCommitted = false;
        this.checkBudget(job);
        return await this.create(resource, signal, (progress) => {
          if (!signal.aborted) job.progress = progress;
        }, job, attempt === 0);
      } catch (error) {
        last = error;
        this.options.diagnostics?.record({ stage: "playback", code: error instanceof AppError ? error.code : "UNKNOWN" });
        if (signal.aborted || this.closing) throw cancelled2();
        if (error instanceof AppError && ["DISK_SPACE", "DISK_CHECK", "CACHE_BUDGET", "NETWORK"].includes(error.code)) throw error;
      }
    }
    throw last;
  }
  async ensureSpace(signal) {
    check2(signal);
    try {
      const free = async () => this.options.freeBytes ? this.options.freeBytes() : (0, import_promises4.statfs)(this.directory).then((info) => info.bavail * info.bsize);
      let available = await free();
      check2(signal);
      if (available < SPACE_RESERVE + 2 * FILE_LIMIT * this.concurrency) {
        await this.trim(true);
        available = await free();
        check2(signal);
      }
      if (!Number.isFinite(available) || available < SPACE_RESERVE + 2 * FILE_LIMIT * this.concurrency) throw new AppError("DISK_SPACE", `\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u5DF2\u6682\u505C\u51C6\u5907\u65B0\u5267\u96C6\uFF1B\u8BF7\u81F3\u5C11\u7559\u51FA ${((SPACE_RESERVE + 2 * FILE_LIMIT * this.concurrency) / 1024 ** 3).toFixed(1)} GiB \u53EF\u7528\u7A7A\u95F4\u540E\u70B9\u51FB\u91CD\u8BD5\u7F13\u5B58`);
    } catch (error) {
      check2(signal);
      if (error instanceof AppError) throw error;
      throw new AppError("DISK_CHECK", "\u65E0\u6CD5\u68C0\u67E5\u7F13\u5B58\u78C1\u76D8\u7A7A\u95F4\uFF0C\u5DF2\u6682\u505C\u51C6\u5907\u65B0\u5267\u96C6\uFF1B\u8BF7\u68C0\u67E5\u78C1\u76D8\u540E\u91CD\u8BD5\u7F13\u5B58");
    }
  }
  result(e) {
    return { url: `manju-media://local/${e.key}`, duration: e.duration, definition: e.definition, episodeId: e.episodeId, availableQualities: e.availableQualities, codec: e.codec, size: e.size };
  }
  partialName(id, quality) {
    return (0, import_node_crypto3.createHash)("sha256").update(id + ":" + quality).digest("hex").slice(0, 32) + ".partial";
  }
  async create(resource, signal, report, job, firstAttempt) {
    check2(signal);
    if (!(resource.duration > 0) || resource.duration > 1800 || !(resource.size > 0) || resource.size > FILE_LIMIT) throw new AppError("UNSUPPORTED_RESOURCE", "\u64AD\u653E\u8D44\u6E90\u4E0D\u5B8C\u6574\u6216\u5927\u5C0F\u6682\u4E0D\u652F\u6301");
    const key = (0, import_node_crypto3.randomUUID)().replaceAll("-", ""), partial = this.partialName(resource.episodeId, job.quality);
    const input = import_node_path2.default.join(this.directory, partial + ".mp4"), checkpoint = import_node_path2.default.join(this.directory, partial + ".json"), working = import_node_path2.default.join(this.directory, key + ".working.mp4"), output = import_node_path2.default.join(this.directory, key + ".mp4");
    const metadata = import_node_path2.default.join(this.directory, key + ".json");
    let committed = false, downloaded = false, encoder, release, growing, prefix = Buffer.alloc(0), decided = false, processingMs = 0;
    const contentKey = resource.encrypted ? decodeContentKey(resource.spade || "") : null;
    try {
      report({ stage: "downloading", transferred: 0, total: resource.size, percent: 0 });
      const downloadStart = Date.now(), fingerprint = (0, import_node_crypto3.createHash)("sha256").update([resource.episodeId, resource.definition, resource.codec, resource.size, resource.encrypted, resource.spade || ""].join(":")).digest("hex");
      const streamAllowed = this.options.progressive !== false && firstAttempt && !job.force && !(this.options.segments > 1);
      await downloadMedia({ url: resource.url, path: input, metadataPath: checkpoint, size: resource.size, fingerprint, segments: this.options.segments || 1, signal, throttle: async (bytes, signal2) => {
        await this.limiter.consume(bytes, signal2);
        this.transferred(bytes);
      }, onProgress: (bytes, total) => {
        this.partialBytes.set(partial + ".mp4", bytes);
        report({ stage: "downloading", transferred: bytes, total, percent: Math.floor(bytes / total * 100) });
      }, ...streamAllowed ? { onChunk: async (chunk) => {
        if (encoder) {
          await encoder.write(chunk);
          return;
        }
        if (decided) return;
        prefix = Buffer.concat([prefix, chunk]);
        const candidate = streamableMp4(prefix);
        if (candidate === false || prefix.length > 2 * 1024 * 1024) {
          decided = true;
          prefix = Buffer.alloc(0);
          return;
        }
        if (candidate !== true) return;
        decided = true;
        report({ stage: "waiting" });
        release = await this.processor(signal);
        job.processingActive = true;
        check2(signal);
        processingMs = Date.now();
        encoder = new ProgressiveEncoder(this.ffmpeg, working, contentKey, resource.duration, resource.codec, signal, () => {
        }, this.decodeThreads, this.decodeMode !== 2 && this.hw && this.hw.args ? this.hw.args : null);
        growing = new GrowingMedia(working);
        this.growing.set(key, growing);
        void encoder.ready.then(() => {
          if (signal.aborted) return;
          job.ready = true;
          job.everReady = true;
          job.progressivePlayback = { ...this.result({ key, file: working, episodeId: resource.episodeId, duration: resource.duration, definition: resource.definition, touched: Date.now(), policy: CACHE_POLICY, availableQualities: resource.availableQualities, codec: resource.codec, size: resource.size }), progressive: true };
          if (job.foreground) job.resolve(job.progressivePlayback);
          this.pump();
        }).catch(() => {
        });
        await encoder.write(prefix);
        prefix = Buffer.alloc(0);
      } } : {} });
      downloaded = true;
      this.options.diagnostics?.record({ stage: "download", code: "OK", ms: Date.now() - downloadStart });
      check2(signal);
      if (encoder) {
        report({ stage: "processing", percent: 99 });
        await encoder.end();
        this.options.diagnostics?.record({ stage: "processing", code: "OK", ms: Date.now() - processingMs });
        release?.();
        release = void 0;
        job.processingActive = false;
      } else {
        report({ stage: "waiting" });
        release = await this.processor(signal);
        job.processingActive = true;
        try {
          check2(signal);
          report({ stage: "processing", percent: 0 });
          processingMs = Date.now();
          const progress = (percent) => report({ stage: "processing", percent });
          if (["h264", "avc1"].includes(resource.codec) || this.hevcSupported && (this.decodeMode === 0 || this.decodeMode === 3) && ["bytevc1", "h265", "hevc", "hvc1", "h265_hvc1"].includes(resource.codec)) {
            try {
              await this.transcode(input, working, contentKey, resource.duration, signal, progress, true);
              if ((await (0, import_promises4.stat)(working)).size > FILE_LIMIT) throw new AppError("MEDIA_DECODE", "\u5C01\u88C5\u6587\u4EF6\u8FC7\u5927\uFF0C\u6539\u7528\u517C\u5BB9\u7F16\u7801");
            } catch (error) {
              check2(signal);
              if (!(error instanceof AppError) || error.code !== "MEDIA_DECODE") throw error;
              report({ stage: "processing", percent: 0 });
              await this.transcode(input, working, contentKey, resource.duration, signal, progress);
            }
          } else await this.transcode(input, working, contentKey, resource.duration, signal, progress);
          this.options.diagnostics?.record({ stage: "processing", code: "OK", ms: Date.now() - processingMs });
        } finally {
          release?.();
          release = void 0;
          job.processingActive = false;
        }
      }
      contentKey?.fill(0);
      check2(signal);
      report({ stage: "finalizing" });
      const info = await (0, import_promises4.stat)(working);
      if (info.size <= 0 || info.size > FILE_LIMIT) throw new AppError("MEDIA_CACHE", "\u5355\u96C6\u7F13\u5B58\u8D85\u8FC7\u5927\u5C0F\u9650\u5236");
      job.capacityBytes = info.size;
      this.checkBudget(job);
      try {
        await (0, import_promises4.unlink)(input);
      } catch (error) {
        if (error.code !== "ENOENT") throw new AppError("MEDIA_CACHE", "\u5DF2\u4E0B\u8F7D\u7684\u4E34\u65F6\u6587\u4EF6\u65E0\u6CD5\u6E05\u7406\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u5360\u7528\u540E\u91CD\u8BD5");
      }
      this.partialBytes.delete(partial + ".mp4");
      await (0, import_promises4.unlink)(checkpoint).catch(() => {
      });
      check2(signal);
      this.checkBudget(job);
      for (let attempt = 0; ; attempt++) {
        try {
          await (0, import_promises4.rename)(working, output);
          break;
        } catch (error) {
          if (!["EPERM", "EBUSY", "EACCES"].includes(error.code) || attempt >= 4) throw error;
          await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
        }
      }
      check2(signal);
      const entry = { key, file: output, episodeId: resource.episodeId, duration: resource.duration, definition: resource.definition, touched: Date.now(), policy: CACHE_POLICY, bytes: info.size, quality: job.quality, availableQualities: resource.availableQualities, codec: resource.codec, size: resource.size };
      await (0, import_promises4.writeFile)(metadata, JSON.stringify({ ...entry, file: void 0 }));
      check2(signal);
      const previous = this.entries.get(resource.episodeId);
      this.entries.set(resource.episodeId, entry);
      job.capacityCommitted = true;
      committed = true;
      growing?.complete(output);
      this.growing.delete(key);
      if (previous) {
        await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, previous.key + ".json")).catch(() => {
        });
        await (0, import_promises4.unlink)(previous.file).catch(() => {
        });
      }
      await this.trim();
      return this.result(entry);
    } catch (error) {
      check2(signal);
      if (error instanceof AppError) throw error;
      throw new AppError("MEDIA_CACHE", "\u89C6\u9891\u51C6\u5907\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u7A7A\u95F4\u540E\u91CD\u8BD5\u5F53\u524D\u96C6");
    } finally {
      encoder?.stop();
      await encoder?.finished.catch(() => {
      });
      release?.();
      if (!committed) {
        if (job.ready) this.renewPlaybackWait(job);
        growing?.fail();
        job.ready = false;
        job.progressivePlayback = void 0;
      }
      this.growing.delete(key);
      contentKey?.fill(0);
      if (downloaded) {
        await (0, import_promises4.unlink)(input).catch(() => {
        });
        await (0, import_promises4.unlink)(checkpoint).catch(() => {
        });
      }
      const retained = await (0, import_promises4.stat)(input).catch(() => null);
      if (retained?.size) this.partialBytes.set(partial + ".mp4", retained.size);
      else this.partialBytes.delete(partial + ".mp4");
      await (0, import_promises4.unlink)(working).catch(() => {
      });
      if (!committed) {
        await (0, import_promises4.unlink)(output).catch(() => {
        });
        await (0, import_promises4.unlink)(metadata).catch(() => {
        });
      }
    }
  }
  async transcode(input, output, key, duration, signal, report, copy = false) {
    try {
      return await this.transcodeOnce(input, output, key, duration, signal, report, copy, false);
    } catch (error) {
      check2(signal);
      if (!(error instanceof AppError) || error.code !== "MEDIA_DECODE" || copy) throw error;
      __hgDbg("transcode retry(fast) dur=" + duration);
      await new Promise((r) => setTimeout(r, 800));
      return this.transcodeOnce(input, output, key, duration, signal, report, copy, true);
    }
  }
  transcodeOnce(input, output, key, duration, signal, report, copy = false, fast = false) {
    check2(signal);
    return new Promise((resolve, reject) => {
      const hwArgs = !copy && !fast && this.decodeMode !== 2 && this.hw && Array.isArray(this.hw.args) && this.hw.args.length ? this.hw.args : null;
      const videoArgs = copy ? ["-c:v", "copy"] : ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", ...(hwArgs || ["-c:v", "libx264", "-preset", fast ? "ultrafast" : "veryfast", "-threads", String(fast ? 1 : this.decodeThreads), "-crf", "20"])];
      const args = ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", ...key ? ["-decryption_key", key.toString("hex")] : [], ...!copy && !fast && this.decodeMode !== 2 && this.hw ? ["-hwaccel", this.hw.name === "h264_qsv" ? "qsv" : "auto"] : [], "-i", input, ...videoArgs, "-c:a", "aac", "-movflags", "+faststart", "-fs", String(FILE_LIMIT + 1), "-y", output];
      const child2 = (0, import_node_child_process2.spawn)(this.ffmpeg, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      let progress = "";
      let __hgErr = "";
      const abort = () => {
        child2.kill();
      };
      signal.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(() => child2.kill(), Math.max(18e4, duration * 6e3 + 6e4));
      const cleanup = () => {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      };
      child2.stdout.on("data", (data) => {
        progress += data;
        if (progress.length > 5e4) progress = progress.slice(-25e3);
        const actual = Number([...progress.matchAll(/^out_time_us=(\d+)\r?\n/gm)].at(-1)?.[1]) / 1e6;
        if (Number.isFinite(actual)) report(Math.max(0, Math.min(99, Math.floor(actual / duration * 100))));
      });
      child2.stderr.on("data", (d) => { __hgErr = (__hgErr + String(d)).slice(-2000); });
      child2.once("error", () => {
        cleanup();
        reject(signal.aborted ? cancelled2() : new AppError("MEDIA_RUNTIME", "\u5A92\u4F53\u7EC4\u4EF6\u65E0\u6CD5\u542F\u52A8"));
      });
      child2.once("close", (code) => {
        cleanup();
        const actual = Number([...progress.matchAll(/^out_time_us=(\d+)$/gm)].at(-1)?.[1]) / 1e6;
        const __hgOk = code === 0 && Math.abs(actual - duration) < 1;
        if (!__hgOk) __hgDbg("ffmpeg FAIL code=" + code + " actual=" + actual + " dur=" + duration + " copy=" + copy + " err=" + __hgErr.slice(-900));
        signal.aborted ? reject(cancelled2()) : __hgOk ? resolve() : reject(new AppError("MEDIA_DECODE", "\u89C6\u9891\u5904\u7406\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6"));
      });
    });
  }
  async response(url, range) {
    const uri = new URL(url);
    if (uri.hostname !== "local" || !/^\/[a-f0-9]{32}$/.test(uri.pathname)) return new Response(null, { status: 404 });
    const growing = this.growing.get(uri.pathname.slice(1));
    if (growing) {
      if (range && !/^bytes=0-\d*$/.test(range)) return new Response(null, { status: 416 });
      return growing.response();
    }
    const entry = [...this.entries.values()].find((e) => e.key === uri.pathname.slice(1));
    if (!entry) return new Response(null, { status: 404 });
    const info = await (0, import_promises4.stat)(entry.file).catch(() => null);
    if (!info) return new Response(null, { status: 404 });
    const slice = parseRange(range, info.size);
    if (!slice) return new Response(null, { status: 416, headers: { "content-range": `bytes */${info.size}` } });
    entry.touched = Date.now();
    const stream = import_node_stream.Readable.toWeb((0, import_node_fs2.createReadStream)(entry.file, { start: slice.start, end: slice.end }));
    return new Response(stream, { status: slice.status, headers: { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": String(slice.end - slice.start + 1), ...slice.status === 206 ? { "content-range": `bytes ${slice.start}-${slice.end}/${info.size}` } : {} } });
  }
  async trim(reclaim = false) {
    const entries = [...this.entries.values()].sort((a, b) => a.touched - b.touched);
    const sizes = /* @__PURE__ */ new Map();
    let total = 0;
    for (const e of entries) {
      const info = await (0, import_promises4.stat)(e.file).catch(() => null);
      if (!info) {
        this.entries.delete(e.episodeId);
        continue;
      }
      sizes.set(e.episodeId, info.size);
      total += info.size;
    }
    for (const e of entries) {
      if (this.protectedIds.has(e.episodeId) || this.groups.some((group) => group.ids.includes(e.episodeId)) || [...this.activeJobs].some((job) => job.id === e.episodeId) || !sizes.has(e.episodeId)) continue;
      if (reclaim || total > CACHE_LIMIT || Date.now() - e.touched > 864e5) {
        try {
          await (0, import_promises4.unlink)(e.file);
          await (0, import_promises4.unlink)(import_node_path2.default.join(this.directory, e.key + ".json")).catch(() => {
          });
          this.entries.delete(e.episodeId);
          total -= sizes.get(e.episodeId);
        } catch {
        }
      }
    }
  }
  async close() {
    this.closing = true;
    this.window = [];
    const pending = [.../* @__PURE__ */ new Set([...this.jobs.values(), ...this.activeJobs])];
    for (const job of pending) this.cancel(job);
    this.limiter.close();
    await Promise.allSettled(pending.map((job) => job.completion ?? job.promise));
  }
};

// src/main/cache-manager.ts
var import_promises5 = require("node:fs/promises");
var import_node_fs3 = require("node:fs");
var import_node_path3 = __toESM(require("node:path"), 1);
var import_node_crypto4 = require("node:crypto");
var defaultLimits = () => ({ maxGiB: 20, bandwidthMiB: 0 });
function cleanLimits(value) {
  if (!value || !Number.isFinite(value.maxGiB) || value.maxGiB < 0 || value.maxGiB > 1e4 || !Number.isFinite(value.bandwidthMiB) || value.bandwidthMiB < 0 || value.bandwidthMiB > 1e3) throw new AppError("INVALID_INPUT", "\u7F13\u5B58\u603B\u989D\u5EA6\u987B\u4E3A 0\u201310000 GiB\uFF0C\u603B\u4E0B\u8F7D\u9650\u901F\u987B\u4E3A 0\u20131000 MiB/s\uFF1B0 \u8868\u793A\u4E0D\u9650\u5236");
  return { maxGiB: value.maxGiB, bandwidthMiB: value.bandwidthMiB };
}
var validPriority = (value) => value === "high" || value === "normal" || value === "low";
var toBytes = (value, unit) => value === 0 ? 0 : Math.max(1, Math.floor(value * unit));
function cleanSeries(series) {
  if (!series || !validId(series.id) || typeof series.title !== "string" || !series.title.trim() || !Array.isArray(series.episodes) || !series.episodes.length || series.episodes.length > 5e3 || series.episodes.some((e, i) => !validId(e.id) || e.order !== i + 1) || new Set(series.episodes.map((e) => e.id)).size !== series.episodes.length) throw new AppError("CACHE_SERIES", "\u7F13\u5B58\u4F5C\u54C1\u4FE1\u606F\u6216\u5267\u96C6\u5217\u8868\u65E0\u6548");
  return { id: series.id, title: series.title.slice(0, 200), cover: typeof series.cover === "string" && /^https?:\/\//.test(series.cover) ? series.cover.slice(0, 2048) : "", description: "", total: series.episodes.length, episodes: series.episodes.map((e) => ({ id: e.id, order: e.order })) };
}
function parse(source, profile) {
  const raw = JSON.parse(source);
  if (raw?.version !== 1 || typeof raw.directory !== "string" || !import_node_path3.default.isAbsolute(raw.directory) || typeof raw.closeToTray !== "boolean" || !Array.isArray(raw.tasks) || raw.tasks.length > 100) throw Error("INVALID_SETTINGS");
  const directory = import_node_path3.default.resolve(raw.directory), original = import_node_path3.default.resolve(profile, "media-cache");
  if (directory !== original && import_node_path3.default.basename(directory) !== "HongguoManjuCache") throw Error("INVALID_DIRECTORY");
  const tasks = raw.tasks.map((task) => {
    if (typeof task.paused !== "boolean" || !Number.isFinite(task.createdAt) || task.priority !== void 0 && !validPriority(task.priority)) throw Error("INVALID_TASK");
    return { series: cleanSeries(task.series), paused: task.paused, createdAt: task.createdAt, priority: task.priority ?? "normal" };
  });
  if (new Set(tasks.map((task) => task.series.id)).size !== tasks.length) throw Error("DUPLICATE_TASK");
  const concurrency = raw.concurrency ?? 4;
  if (!Number.isSafeInteger(concurrency) || concurrency < 2 || concurrency > 128) throw Error("INVALID_CONCURRENCY");
  const segments = raw.segments ?? 8;
  if (!Number.isSafeInteger(segments) || segments < 1 || segments > 128) throw Error("INVALID_SEGMENTS");
  const decodeLevel = raw.decodeLevel ?? 1;
  if (![0, 1, 2].includes(decodeLevel)) throw Error("INVALID_DECODE_LEVEL");
  const decodeMode = raw.decodeMode ?? 0;
  if (![0, 1, 2, 3].includes(decodeMode)) throw Error("INVALID_DECODE_MODE");
  if (raw.knownSeries !== void 0 && (!Array.isArray(raw.knownSeries) || raw.knownSeries.length > 100)) throw Error("INVALID_CACHE_INDEX");
  const knownSeries = (raw.knownSeries ?? []).map(cleanSeries);
  if (new Set(knownSeries.map((item) => item.id)).size !== knownSeries.length) throw Error("DUPLICATE_CACHE_INDEX");
  const limits = raw.limits === void 0 ? defaultLimits() : cleanLimits(raw.limits);
  return { version: 1, directory, closeToTray: raw.closeToTray, tasks, concurrency, segments, decodeLevel, decodeMode, knownSeries, limits };
}
var CacheManager = class {
  constructor(profile, media, history = () => []) {
    this.profile = profile;
    this.media = media;
    this.history = history;
    this.value = { version: 1, directory: media.location, closeToTray: true, tasks: [], concurrency: 4, segments: 8, decodeLevel: 1, decodeMode: 0, knownSeries: [], limits: defaultLimits() };
  }
  profile;
  media;
  history;
  value;
  pending = Promise.resolve();
  message = "";
  migrating = false;
  static async directory(profile) {
    try {
      return parse(await (0, import_promises5.readFile)(import_node_path3.default.join(profile, "cache-settings.json"), "utf8"), profile).directory;
    } catch {
      return import_node_path3.default.join(profile, "media-cache");
    }
  }
  async init() {
    const file = import_node_path3.default.join(this.profile, "cache-settings.json");
    await (0, import_promises5.mkdir)(this.profile, { recursive: true });
    try {
      this.value = parse(await (0, import_promises5.readFile)(file, "utf8"), this.profile);
    } catch (error) {
      if (error.code !== "ENOENT") {
        try {
          await (0, import_promises5.copyFile)(file, file + ".corrupt-" + (0, import_node_crypto4.randomUUID)(), import_node_fs3.constants.COPYFILE_EXCL);
          this.message = "\u7F13\u5B58\u8BBE\u7F6E\u5DF2\u635F\u574F\uFF0C\u5DF2\u5907\u4EFD\u539F\u6587\u4EF6\u3002\u8BF7\u91CD\u65B0\u6DFB\u52A0\u7F13\u5B58\u4EFB\u52A1\uFF1B\u5DF2\u5B8C\u6210\u5A92\u4F53\u4FDD\u7559\u3002";
        } catch {
          throw new AppError("CACHE_SETTINGS", "\u7F13\u5B58\u8BBE\u7F6E\u65E0\u6CD5\u8BFB\u53D6\u6216\u5907\u4EFD\uFF0C\u8BF7\u68C0\u67E5\u5E94\u7528\u6570\u636E\u76EE\u5F55\u6743\u9650");
        }
      }
    }
    this.sync();
  }
  get closeToTray() {
    return this.value.closeToTray;
  }
  sync() {
    this.media.setLimits({ maxBytes: toBytes(this.value.limits.maxGiB, 1024 ** 3), bytesPerSecond: toBytes(this.value.limits.bandwidthMiB, 1024 ** 2) });
    this.media.setBackgroundGroups(this.value.tasks.map((task) => ({ id: task.series.id, ids: task.series.episodes.map((e) => e.id), paused: task.paused, priority: task.priority })));
    this.media.setConcurrency(this.value.concurrency);
    this.media.setSegments(this.value.segments ?? 8);
    this.media.setDecodeLevel(this.value.decodeLevel ?? 1);
    this.media.setDecodeMode(this.value.decodeMode ?? 0);
  }
  async save(value) {
    const file = import_node_path3.default.join(this.profile, "cache-settings.json");
    try {
      await (0, import_promises5.writeFile)(file + ".tmp", JSON.stringify(value), "utf8");
      await (0, import_promises5.rename)(file + ".tmp", file);
    } catch {
      throw new AppError("CACHE_SETTINGS", "\u7F13\u5B58\u4EFB\u52A1\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u78C1\u76D8\u7A7A\u95F4\u53CA\u76EE\u5F55\u6743\u9650");
    }
  }
  mutate(fn) {
    const operation = this.pending.then(async () => {
      const draft = structuredClone(this.value);
      fn(draft);
      await this.save(draft);
      this.value = draft;
      this.sync();
      return this.snapshot();
    });
    this.pending = operation.catch(() => {
    });
    return operation;
  }
  async snapshot() {
    let freeBytes = 0;
    try {
      freeBytes = await this.media.freeBytes();
    } catch {
    }
    const history = new Map(this.history().map((item) => [item.seriesId, item]));
    return { directory: this.media.location, freeBytes, usedBytes: this.media.usedBytes, migrating: this.migrating, closeToTray: this.closeToTray, message: this.message, concurrency: this.value.concurrency, segments: this.value.segments ?? 8, decodeLevel: this.value.decodeLevel ?? 1, decodeMode: this.value.decodeMode ?? 0, network: this.media.network, limits: { ...this.value.limits }, bytesPerSecond: this.media.downloadBytesPerSecond, tasks: this.listedTasks().map((task) => ({ ...structuredClone(task), watched: this.watched(task, history), state: this.media.stateFor(task.series.episodes.map((e) => e.id)) })) };
  }
  listedTasks() {
    return [...this.value.tasks.map((task) => ({ ...task, registered: true })), ...this.value.knownSeries.filter((series) => {
      if (this.value.tasks.some((task) => task.series.id === series.id)) return false;
      const ids = series.episodes.map((e) => e.id), state = this.media.stateFor(ids);
      return state.ready > 0 || (state.cachedBytes || 0) > 0 || this.media.hasDeletionPending?.(ids);
    }).map((series) => ({ series, paused: true, createdAt: 0, registered: false }))];
  }
  remember(series) {
    const clean = cleanSeries(series);
    return this.mutate((draft) => {
      draft.knownSeries = [...draft.knownSeries.filter((item) => item.id !== clean.id), clean].slice(-100);
    });
  }
  add(series) {
    const clean = cleanSeries(series);
    return this.mutate((draft) => {
      const task = draft.tasks.find((task2) => task2.series.id === clean.id);
      if (task) {
        task.series = clean;
        return;
      }
      if (draft.tasks.length >= 100) throw new AppError("CACHE_LIMIT", "\u6700\u591A\u6DFB\u52A0 100 \u90E8\u7F13\u5B58\u4F5C\u54C1\uFF0C\u8BF7\u5148\u79FB\u9664\u5DF2\u4E0D\u9700\u8981\u7684\u4EFB\u52A1");
      draft.tasks.push({ series: clean, paused: false, createdAt: Date.now(), priority: "normal" });
    });
  }
  watched(task, history) {
    const last = task.series.episodes.at(-1), progress = history.get(task.series.id);
    return !!(last && progress && progress.episodeId === last.id && progress.order === last.order && progress.duration > 0 && progress.time / progress.duration >= 0.95);
  }
  async action(id, action) {
    if (!validId(id) || !["pause", "resume", "retry", "remove", "delete"].includes(action)) throw new AppError("INVALID_INPUT", "\u7F13\u5B58\u64CD\u4F5C\u65E0\u6548");
    if (action === "delete") return this.deleteTask(id);
    const result = await this.mutate((draft) => {
      let task = draft.tasks.find((task2) => task2.series.id === id);
      if (!task && action !== "remove") {
        const series = draft.knownSeries.find((item) => item.id === id);
        if (series) {
          if (draft.tasks.length >= 100) throw new AppError("CACHE_LIMIT", "\u6700\u591A\u6DFB\u52A0 100 \u90E8\u540E\u53F0\u7F13\u5B58\u4F5C\u54C1\uFF0C\u8BF7\u5148\u79FB\u9664\u4E0D\u9700\u8981\u7684\u4EFB\u52A1");
          task = { series, paused: true, createdAt: Date.now(), priority: "normal" };
          draft.tasks.push(task);
        }
      }
      if (!task) throw new AppError("CACHE_TASK", "\u7F13\u5B58\u4EFB\u52A1\u4E0D\u5B58\u5728");
      if (action === "remove") {
        draft.knownSeries = [...draft.knownSeries.filter((series) => series.id !== id), task.series].slice(-100);
        draft.tasks = draft.tasks.filter((item) => item.series.id !== id);
      } else task.paused = action === "pause";
    });
    if (action === "retry" || action === "resume") {
      const task = this.value.tasks.find((task2) => task2.series.id === id);
      this.media.retryBuffer(task?.series.episodes.map((e) => e.id));
      return this.snapshot();
    }
    return result;
  }
  deleteTask(id) {
    const operation = this.pending.then(async () => {
      if (this.migrating) throw new AppError("CACHE_BUSY", "\u7F13\u5B58\u6B63\u5728\u8FC1\u79FB\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u518D\u5220\u9664");
      const draft = structuredClone(this.value);
      let task = draft.tasks.find((item) => item.series.id === id);
      if (!task) {
        const series = draft.knownSeries.find((item) => item.id === id);
        if (series) task = { series, paused: true, createdAt: Date.now(), priority: "normal" };
      }
      if (!task) throw new AppError("CACHE_TASK", "\u7F13\u5B58\u4EFB\u52A1\u4E0D\u5B58\u5728");
      task.paused = true;
      await this.save(draft);
      this.value = draft;
      this.sync();
      const shared = new Set([...draft.tasks.filter((item) => item.series.id !== id).map((item) => item.series), ...draft.knownSeries.filter((item) => item.id !== id)].flatMap((item) => item.episodes.map((episode) => episode.id)));
      const result = await this.media.deleteEpisodes(task.series.episodes.map((episode) => episode.id).filter((id2) => !shared.has(id2)));
      const next = { ...draft, tasks: draft.tasks.filter((item) => item.series.id !== id), knownSeries: draft.knownSeries.filter((item) => item.id !== id) };
      await this.save(next);
      this.value = next;
      this.sync();
      this.message = `\u5DF2\u5220\u9664\u300A${task.series.title}\u300B\u7684\u7F13\u5B58\uFF0C\u91CA\u653E ${(result.freedBytes / 1048576).toFixed(1)} MiB\uFF1B\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u4FDD\u7559\u3002`;
      return this.snapshot();
    });
    this.pending = operation.catch(() => {
    });
    return operation;
  }
  async deleteWatched(confirmedIds) {
    const history = new Map(this.history().map((item) => [item.seriesId, item]));
    const selected = this.listedTasks().filter((task) => this.watched(task, history) && (!confirmedIds || confirmedIds.includes(task.series.id))).map((task) => task.series.id);
    let count2 = 0;
    for (const id of selected) {
      await this.action(id, "delete");
      count2++;
    }
    this.message = count2 ? `\u5DF2\u6E05\u7406 ${count2} \u90E8\u5DF2\u770B\u5B8C\u4F5C\u54C1\u7684\u7F13\u5B58\uFF0C\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u4FDD\u7559\u3002` : "\u6682\u65E0\u53EF\u6E05\u7406\u7684\u5DF2\u770B\u5B8C\u4F5C\u54C1\u7F13\u5B58\u3002";
    return this.snapshot();
  }
  async setConcurrency(value) {
    if (!Number.isSafeInteger(value) || value < 2 || value > 128) throw new AppError("INVALID_INPUT", "\u8BF7\u9009\u62E9 2\u81F3 128 \u8DEF\u5E76\u884C\u51C6\u5907");
    return this.mutate((draft) => {
      draft.concurrency = value;
    });
  }
  async setSegments(value) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 128) throw new AppError("INVALID_INPUT", "\u8BF7\u9009\u62E9 1\u81F3 128 \u8DEF\u5355\u6587\u4EF6\u4E0B\u8F7D\u7EBF\u7A0B");
    return this.mutate((draft) => {
      draft.segments = value;
    });
  }
  async setDecodeLevel(value) {
    if (![0, 1, 2].includes(value)) throw new AppError("INVALID_INPUT", "\u89E3\u7801\u6863\u4F4D\u65E0\u6548");
    return this.mutate((draft) => {
      draft.decodeLevel = value;
    });
  }
  async setDecodeMode(value) {
    if (![0, 1, 2, 3].includes(value)) throw new AppError("INVALID_INPUT", "\u89E3\u7801\u65B9\u5F0F\u65E0\u6548");
    return this.mutate((draft) => {
      draft.decodeMode = value;
    });
  }
  async setLimits(value) {
    const limits = cleanLimits(value);
    return this.mutate((draft) => {
      draft.limits = limits;
    });
  }
  async setPriority(id, priority) {
    if (!validId(id) || !validPriority(priority)) throw new AppError("INVALID_INPUT", "\u7F13\u5B58\u4EFB\u52A1\u4F18\u5148\u7EA7\u65E0\u6548");
    return this.mutate((draft) => {
      const task = draft.tasks.find((item) => item.series.id === id);
      if (!task) throw new AppError("CACHE_TASK", "\u7F13\u5B58\u4EFB\u52A1\u4E0D\u5B58\u5728");
      task.priority = priority;
    });
  }
  setCloseToTray(enabled) {
    if (typeof enabled !== "boolean") throw new AppError("INVALID_INPUT", "\u5173\u95ED\u7A97\u53E3\u8BBE\u7F6E\u65E0\u6548");
    return this.mutate((draft) => {
      draft.closeToTray = enabled;
    });
  }
  migrate(destination) {
    if (this.migrating) return Promise.reject(new AppError("CACHE_BUSY", "\u7F13\u5B58\u6B63\u5728\u8FC1\u79FB\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210"));
    this.migrating = true;
    const operation = this.pending.then(async () => {
      const draft = { ...this.value, directory: import_node_path3.default.resolve(destination) };
      if (import_node_path3.default.basename(draft.directory) !== "HongguoManjuCache") throw new AppError("CACHE_PATH", "\u8BF7\u9009\u62E9\u5E94\u7528\u4E13\u7528\u7F13\u5B58\u6587\u4EF6\u5939");
      await this.media.relocate(draft.directory, () => this.save(draft));
      this.value = draft;
      this.message = "\u7F13\u5B58\u76EE\u5F55\u5DF2\u5207\u6362\u3002\u539F\u76EE\u5F55\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF0C\u53EF\u786E\u8BA4\u65B0\u76EE\u5F55\u64AD\u653E\u6B63\u5E38\u540E\u81EA\u884C\u6E05\u7406\u3002";
      return this.snapshot();
    }).finally(() => {
      this.migrating = false;
    });
    this.pending = operation.catch(() => {
    });
    return operation;
  }
  async flush() {
    await this.pending;
  }
};

// src/main/transport.ts
var import_node_fs4 = require("node:fs");
var import_promises6 = require("node:fs/promises");
var import_node_os = require("node:os");

// src/main/json.ts
function safeJson(source) {
  let result = "", index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '"') {
      const start = index++;
      while (index < source.length) {
        if (source[index] === "\\") index += 2;
        else if (source[index++] === '"') break;
      }
      result += source.slice(start, index);
    } else if (char === "-" || /\d/.test(char)) {
      const match = source.slice(index).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (!match) {
        result += char;
        index++;
        continue;
      }
      const token = match[0];
      result += /^-?\d+$/.test(token) && !Number.isSafeInteger(Number(token)) ? `"${token}"` : token;
      index += token.length;
    } else {
      result += char;
      index++;
    }
  }
  return JSON.parse(result);
}

// src/main/transport.ts
var import_node_child_process3 = require("node:child_process");
var import_node_readline = require("node:readline");
var import_node_crypto8 = require("node:crypto");
var import_node_path4 = __toESM(require("node:path"), 1);

// src/main/registered-playback.ts
var import_node_crypto7 = require("node:crypto");

// src/main/player-registration.ts
var import_node_crypto5 = require("node:crypto");
var import_node_zlib = require("node:zlib");
var PROTOCOL_SEED = Buffer.from("4dd4c2e6b83162090e52b3c7a6733ba41cb2462b829ab58a196b39db57177524f49baf7f08e8d68d26a72e37c1a95a2f1f05a51892aef2949732b62a38aadd58", "hex");
var hash = (data) => (0, import_node_crypto5.createHash)("sha512").update(data).digest();
function packet(data) {
  const salt = (0, import_node_crypto5.randomBytes)(32), material = hash(Buffer.concat([hash(salt), PROTOCOL_SEED]));
  const cipher = (0, import_node_crypto5.createCipheriv)("aes-128-cbc", material.subarray(0, 16), material.subarray(16, 32));
  return Buffer.concat([Buffer.from([116, 99, 5, 16, 0, 0]), salt, cipher.update(Buffer.concat([hash(data), data])), cipher.final()]);
}
var __hgFs = require("node:fs");
var __hgPath = require("node:path");
function __hgDbg(msg) {
  try { __hgFs.appendFileSync("M:/hongguo-manju/play_debug.txt", new Date().toISOString() + " " + msg + "\n"); } catch {}
}
__hgDbg("=== unpacked main.cjs loaded ===");
var __hgRegCacheFile = null;
function __hgRegCachePath() {
  if (!__hgRegCacheFile) {
    var base = null;
    try { base = require("electron").app.getPath("userData"); } catch {}
    if (!base && process.env.APPDATA) base = __hgPath.join(process.env.APPDATA, "红果漫剧桌面版");
    if (!base) base = "M:/hongguo-manju";
    __hgRegCacheFile = __hgPath.join(base, "player-reg-cache.json");
  }
  return __hgRegCacheFile;
}
function __hgReadReg(maxAgeMs) {
  try {
    var v = JSON.parse(__hgFs.readFileSync(__hgRegCachePath(), "utf8"));
    if (v && /^[1-9]\d{14,19}$/.test(String(v.device_id || "")) && /^[1-9]\d{14,19}$/.test(String(v.iid || "")) && Date.now() - Number(v.at || 0) <= maxAgeMs) {
      return { device_id: String(v.device_id), iid: String(v.iid), at: Number(v.at || 0) };
    }
  } catch {}
  return null;
}
function __hgWriteReg(id) {
  try { __hgFs.writeFileSync(__hgRegCachePath(), JSON.stringify({ device_id: id.device_id, iid: id.iid, at: Date.now() })); } catch {}
}
var __hgGateLock = Promise.resolve();
var __hgGateLast = 0;
function __hgGate(ms) {
  var run = __hgGateLock.then(function () {
    var wait = ms - (Date.now() - __hgGateLast);
    return new Promise(function (r) { setTimeout(r, wait > 0 ? wait : 0); });
  }).then(function () { __hgGateLast = Date.now(); });
  __hgGateLock = run.catch(function () {});
  return run;
}
async function registerPlayer(__hgForce) {
  if (!__hgForce) {
    var __hgC = __hgReadReg(600000);
    if (__hgC) { __hgDbg("reg cache HIT " + __hgC.device_id + " age=" + Math.round((Date.now() - __hgC.at) / 1000) + "s"); return { device_id: __hgC.device_id, iid: __hgC.iid }; }
  }
  const device = { openudid: (0, import_node_crypto5.randomBytes)(8).toString("hex"), clientudid: (0, import_node_crypto5.randomUUID)(), cdid: (0, import_node_crypto5.randomUUID)() };
  const version = "73932";
  const header = {
    app_version_minor: "7.3.9.32",
    git_hash: "3a88f4e",
    release_build: "b5e187f",
    not_request_sender: 0,
    carrier: "CHINA MOBILE",
    mcc_mnc: "46000",
    rom: "eng.root.20231116.160340",
    rom_version: "W528JS release-keys",
    ipv6_list: [],
    sim_region: "cn",
    sim_serial_number: [],
    oaid_may_support: false,
    req_id: (0, import_node_crypto5.randomUUID)(),
    device_platform: "android",
    custom: {
      account_region_src: "fallback",
      host_bit: 64,
      account_region: "cn",
      dragon_device_type: "phone"
    },
    pre_installed_channel: "",
    apk_first_install_time: Date.now(),
    is_system_app: 0,
    sdk_flavor: "china",
    guest_mode: 0,
    display_name: "\u7EA2\u679C\u514D\u8D39\u77ED\u5267",
    aid: 8662,
    package: "com.phoenix.read",
    sig_hash: "56a962410c494bbaf0b58dba20cae56f",
    app_version: "7.3.9.32",
    version_code: version,
    manifest_version_code: version,
    update_version_code: version,
    channel: "update_64",
    sdk_version: "3.7.0-rc.34-fanqie-xiaoshuo",
    sdk_target_version: 29,
    os: "Android",
    os_version: "16",
    os_api: 36,
    device_model: "25053RT47C",
    device_brand: "Redmi",
    device_manufacturer: "Xiaomi",
    device_category: "phone",
    cpu_abi: "arm64-v8a",
    density_dpi: 520,
    display_density: "mdpi",
    resolution: "1280x2772",
    language: "zh",
    timezone: 8,
    access: "wifi",
    region: "CN",
    tz_name: "Asia/Shanghai",
    tz_offset: 28800,
    ...device
  };
  const url = new URL("https://log5-applog-lf.fqnovel.com/service/2/device_register/?tt_data=a&cronet_version=8d40f833_2026-03-03&ttnet_version=4.2.243.31-douyin&use_store_region_cookie=1");
  const body = packet((0, import_node_zlib.gzipSync)(Buffer.from(JSON.stringify({ magic_tag: "ss_app_log", header, _gen_time: Date.now() }))));
  const response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(2e4), headers: { "content-type": "application/octet-stream;tt-data=a", "user-agent": "com.phoenix.read/73532 (Linux; U; Android 16; zh_CN; 25053RT47C)", "log-encode-type": "gzip", "x-ss-dp": "8662", "x-ss-req-ticket": String(Date.now()), "x-vc-bdturing-sdk-version": "4.0.3.cn", lc: "101", "sdk-version": "2", "passport-sdk-version": "5051452", "x-neptune": "-8|50:51:59:30:40:47:49:39", "x-ss-stub": (0, import_node_crypto5.createHash)("md5").update(body).digest("hex").toUpperCase() }, body });
  if (!response.ok) throw new AppError("PLAYER_REGISTRATION", "\u64AD\u653E\u8BBE\u5907\u767B\u8BB0\u5931\u8D25");
  const text2 = await response.text();
  if (text2.length > 65536) throw new AppError("PLAYER_REGISTRATION", "\u64AD\u653E\u8BBE\u5907\u767B\u8BB0\u54CD\u5E94\u5F02\u5E38");
  let value;
  try {
    value = safeJson(text2);
  } catch {
    throw new AppError("PLAYER_REGISTRATION", "\u64AD\u653E\u8BBE\u5907\u767B\u8BB0\u54CD\u5E94\u5F02\u5E38");
  }
  const device_id = String(value.device_id_str || value.device_id || ""), iid = String(value.install_id_str || value.install_id || "");
  if (!/^[1-9]\d{14,19}$/.test(device_id) || !/^[1-9]\d{14,19}$/.test(iid)) {
    __hgDbg("reg RATE-LIMITED device_id=" + device_id + " iid=" + iid);
    var __hgStale = __hgReadReg(3600000);
    if (__hgStale) { __hgDbg("reg fallback to cache " + __hgStale.device_id); return { device_id: __hgStale.device_id, iid: __hgStale.iid }; }
    throw new AppError("PLAYER_REGISTRATION", "\u64AD\u653E\u8bbe\u5907\u767B\u8BB0\u672A\u8FD4\u56DE\u6709\u6548\u6807\u8BC6");
  }                                                           
  __hgWriteReg({ device_id, iid });
  __hgDbg("reg FRESH " + device_id);
  return { device_id, iid };
}

// src/main/vendor/playback-signing.js
var import_node_crypto6 = __toESM(require("node:crypto"), 1);
var import_sm3 = __toESM(require_sm32(), 1);
function sm3(value) {
  return Buffer.from((0, import_sm3.default)(value), "hex");
}
function u32(value) {
  return Number(value) >>> 0;
}
function rol32(value, count2) {
  const n = count2 & 31;
  const x = u32(value);
  return u32(x << n | x >>> 32 - n);
}
function ror32(value, count2) {
  const n = count2 & 31;
  const x = u32(value);
  return u32(x >>> n | x << 32 - n);
}
function ror64(value, count2) {
  const n = BigInt(count2) & 63n;
  const x = BigInt.asUintN(64, BigInt(value));
  return BigInt.asUintN(64, x >> n | x << 64n - n);
}
function le32(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(u32(value));
  return b;
}
function be32(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(u32(value));
  return b;
}
function zigzag(value) {
  const n = BigInt(value);
  return n < 0n ? -n * 2n - 1n : n * 2n;
}
function varint(value) {
  let n = BigInt(value);
  const out = [];
  while (n > 127n) {
    out.push(Number(n & 127n | 128n));
    n >>= 7n;
  }
  out.push(Number(n));
  return Buffer.from(out);
}
function protoField(tag, value, type = "string") {
  if (value === void 0 || value === null || value === "") return Buffer.alloc(0);
  if (type === "bytes" || type === "string" || type === "message") {
    const body = type === "bytes" ? Buffer.from(value) : type === "message" ? value : Buffer.from(String(value));
    return Buffer.concat([varint(BigInt(tag) << 3n | 2n), varint(body.length), body]);
  }
  if (type === "float") {
    const body = Buffer.alloc(4);
    body.writeFloatLE(Number(value));
    return Buffer.concat([varint(BigInt(tag) << 3n | 5n), body]);
  }
  return Buffer.concat([varint(BigInt(tag) << 3n), varint(type === "sint" ? zigzag(value) : value)]);
}
function proto(fields) {
  return Buffer.concat(fields.map(([tag, value, type]) => protoField(tag, value, type)));
}
function getIv(iv, data) {
  let value = u32(iv);
  for (let i = 0; i < data.length; i += 1) {
    if ((i & 1) === 0) value = u32(value >>> 4 ^ value ^ value << 6 ^ data[i]);
    else value = u32(~(value >>> 7 ^ value ^ (data[i] | value << 12)));
  }
  return value;
}
function sumMd5(data) {
  let check3 = 539100192;
  for (let i = 0; i < 12; i += 1) {
    const temp = (i & 1) === 0 ? check3 >>> 3 ^ check3 : check3 >>> 5 ^ check3;
    check3 = (i & 1) === 0 ? data[i] ^ check3 << 7 : data[i] | check3 << 11;
    if ((i & 1) !== 0) check3 = ~check3;
    check3 = u32(check3 ^ temp);
  }
  return u32((check3 | 4) ^ 16777216);
}
function bxor(a, b) {
  const out = Buffer.alloc(Math.min(a.length, b.length));
  for (let i = 0; i < out.length; i += 1) out[i] = a[i] ^ b[i];
  return out;
}
function hashF13(querySm3, bodyMd5, tsBytes, khronos) {
  const iv = getIv(getIv(getIv(539167016, querySm3), bodyMd5), tsBytes);
  const low = iv & 15;
  const ivV0 = low * 171 >> 9;
  const branch = low - ivV0 * 3;
  if (branch !== 0) throw Error("Unsupported signing branch");
  const ivV1List = [3299313024, 3015769401, 3314308742, 3383376807, 4121406962, 2520526545];
  const ivV1 = ivV1List[ivV0];
  const countV1 = ivV1 + khronos + 1 & 255;
  const countV2 = u32(ivV1 + khronos);
  const tt02 = [3954593711, 128638146, 3476129727, 3759225087, 1829502207, 1513137086, 3021657656, 873991864, 4063488879, 2980414668, 3435335111, 1204935505, 3579204574, 1890078625, 1464286226, 4151247496, 738688778, 3658336976, 4223168364, 4257533696, 1753874957, 3866543782, 2362848139, 440175886, 3437801579, 1792077067, 2689738519, 3698437251, 579197809, 3585400230, 1936688720, 1700802668, 1635574438, 3827515774, 172024131, 1414414386, 2296380202, 1902910176, 1279687304, 95566771, 3788552294, 3131301048, 2922607827, 3275233872, 386070363, 4268598120, 4038381384, 1309670328, 1923797261, 650459709, 4072464630, 3025499521, 1243971549, 2352054946, 2869640070, 1029569300, 1326462516, 3548074711, 1146027798, 3943314385, 1822977902, 2640807, 137919738, 1605596550];
  const tt = tt02.map((value) => ror32(value, countV1));
  const n0 = countV2 + 2 & 7;
  const seed = [250, 69, 97, 215];
  const pad = Buffer.from(seed.map((value) => (value | value << 8) >> n0 & 255));
  const data = Buffer.concat([querySm3, bodyMd5, tsBytes, pad, Buffer.from("00000000000001a0", "hex")]);
  const di = [];
  for (let i = 0; i < data.length; i += 4) di.push(data.readUInt32BE(i));
  let di0 = di[0];
  for (let i = 0; i < 112; i += 1) {
    const di1 = di[i + 1];
    const di14 = di[i + 14];
    const r1 = rol32(di1, 14) ^ rol32(di1, 25) ^ di1 >>> 3;
    const r2 = rol32(di14, 13) ^ rol32(di14, 15) ^ di14 >>> 10;
    di.push(u32(di0 + di[i + 9] + r1 + r2));
    di0 = di1;
  }
  const init = [2059030472, 1729520903, 1677982208, 873419055, 984304912, 3005047866, 2874125293, 2152413264].map((v) => ror32(v, countV2 & 31));
  const chosen = [[101, 5, 7, 6, 3, 2, 1, 0, 5, 4, 3], [96, 0, 6, 7, 5, 3, 2, 1, 5, 4, 4], [96, 7, 6, 2, 1, 4, 0, 5, 4, 3, 5], [99, 3, 6, 2, 4, 5, 1, 0, 0, 7, 6], [96, 0, 5, 6, 7, 3, 1, 2, 5, 4, 4], [100, 2, 0, 3, 5, 4, 6, 7, 2, 1, 5]][ivV0];
  let d = init.slice();
  for (let i = 0; i < chosen[0]; i += 1) {
    const base = ivV1 + i;
    const n0v = di[base & 127];
    const n1 = (d[chosen[3]] ^ d[chosen[4]]) & d[chosen[1]] ^ d[chosen[3]];
    const n2 = rol32(d[chosen[1]], 26) ^ rol32(d[chosen[1]], 21) ^ rol32(d[chosen[1]], 7);
    const n4 = u32(n0v + n1 + n2 + tt[base & 63] + d[chosen[5]]);
    const n5 = rol32(d[chosen[2]], 30) ^ rol32(d[chosen[2]], 19) ^ rol32(d[chosen[2]], 10);
    const n6 = d[chosen[2]] & d[chosen[6]] | (d[chosen[2]] | d[chosen[6]]) & d[chosen[7]];
    const n7 = u32(n5 + n6);
    const old = d[chosen[9]];
    d.unshift(d.pop());
    d[chosen[10]] = u32(n7 + n4);
    d[chosen[8]] = u32(old + n4);
  }
  const ret = Buffer.alloc(32);
  for (let i = 0; i < 8; i += 1) ret.writeUInt32BE(u32(d[i] + init[i]), i * 4);
  const folded = bxor(ret.subarray(0, 16), ret.subarray(16));
  folded.copy(ret, 0);
  return Buffer.concat([ret.subarray(0, 16), le32(sumMd5(ret.subarray(0, 16)))]);
}
function reverseBits(value) {
  let result = 0;
  for (let i = 0; i < 8; i += 1) result = result << 1 | value >> i & 1;
  return result;
}
function rc4Gorgon(data, key) {
  const s = Array.from({ length: 256 }, (_v, i2) => i2);
  let j = 0;
  for (let i2 = 0; i2 < 256; i2 += 1) {
    j = j + s[i2] + key[i2 % key.length] & 255;
    s[i2] = s[j];
  }
  let i = 0;
  j = 0;
  return Buffer.from(data.map((value) => {
    i += 1;
    const x = s[i];
    j += x;
    const y = s[j & 255];
    s[i] = y;
    return value ^ s[y + y & 255];
  }));
}
function xGorgon(query, body, timestamp, random) {
  const sdk = Buffer.alloc(4);
  sdk.writeUInt32LE(67503104);
  const input = Buffer.concat([import_node_crypto6.default.createHash("md5").update(query).digest().subarray(0, 4), body ? import_node_crypto6.default.createHash("md5").update(body).digest().subarray(0, 4) : Buffer.alloc(4), Buffer.alloc(4), sdk, be32(timestamp)]);
  const key = [74, 64, 22, random >> 8 & 255, 71, 108, 1, random & 255];
  const out = rc4Gorgon([...input], key);
  for (let i = 0; i < out.length; i += 1) {
    let value = out[i];
    value = (value >> 4 | value << 4) & 255;
    const next = i + 1 < out.length ? out[i + 1] : out[0];
    out[i] = ~(reverseBits((next ^ value) & 255) ^ 20) & 255;
  }
  return Buffer.concat([Buffer.from("8404", "hex"), Buffer.from([random & 255, random >> 8 & 255, 64, 1]), out]).toString("hex");
}
function deviceProto(deviceId, version) {
  return proto([[1, 1, "sint"], [2, 2, "sint"], [3, "8662"], [4, deviceId], [5, "Ai6svO3PyrwDOUSmO6ZcResxu"], [6, "!noperm!"], [7, -888888, "sint"], [8, -888888, "sint"], [9, 3, "sint"], [10, -888888, "sint"], [11, "!notset!"], [12, "Asia/Shanghai,8"], [13, "zh_CN"], [14, 4, "sint"], [16, 255.24993896484375, "float"], [17, 35.58599090576172, "float"], [18, 3.467449188232422, "float"], [19, 3.467449188232422, "float"], [20, 255.1754913330078, "float"], [21, 42.17544174194336, "float"], [22, "16"], [23, 41, "sint"], [24, 36, "sint"], [25, 1728388016635, "sint"], [26, 1728388016635, "sint"], [27, 1728388016635, "sint"], [28, 1728388016637, "sint"], [29, -1, "sint"], [30, "25053RT47C"], [31, "Redmi"], [32, "25053RT47C"], [33, "25053RT47C"], [34, "Xiaomi"], [35, "Redmi"], [36, "Redmi"], [38, 31, "sint"]]);
}
var SBOX = Buffer.from("+n0Ia5xZs0sEXznQOEqRmQBnpiCf9U2Ccybu3xhmgzOAAxn72f6uqqmwUsYL83klTni0NqxdGieeiNu9PGPsSRXBMB/cuFbUbM3KCUPINaPvHvSW0vwOcnuUhNHqRVpiAj/TEoE0K91+5ijypUYTATsh9mE3KSoN7Yyvv51cuyR2D3XkU4nhmI2xmmVwT1RMWKtub4sjxAcRDLrPoKSO2AU9FLLadMPX577Wf95IFj6FkKFVt3dCIsmGUC4X+WQxLJvxbRxEaOPpqJOXyzJX6+Vxaq3AzMfF/WAdoi1Hp+JRaV56zgpBtpWP97mH4DoGEIq1+FvV8LyS/3wvwugbQOwb2r26mJEMsiuDQTRn+wrYdrVGBVlhI3WQhyrjUBVMrLF5667llUcEaPCGPVGLD8qO5LlO8hKCvA7V9+8oJc9bXelqVQLhM76T5/WtnT45JKji+hdX0HoNCDDWuKON/QeaxB5uImSX0h2wv0VmP2zd2yeApxHcpsVS+MC2yFwAc2B7oBkTqsk1SEvTpM2fmfMQREBUfin0Bh+iq6EvPPavhWI2IX9e3yAas7Tm/3KEj2UmlFp36kN4x0rMLBRrxuh0U/zUHM4xcAMYjJY4MonxOl/X+alpt2M3WMI7w3HLnpIBigtNiJu7T21v4P6lSd5WFgntnMEt7oF92XzRLkJbTcGmXepE/UVOG6E/0YnhfS+q26utWcuxzpooyeD2cDlK1/8w9d28VzsRjbLuALbmGlp8+d7EzS6Au7lMpZ+ECMZvQmzwJ+eLOpxR+2chdUExp8ogQyq3v9l68rX4jCwjg0+PYKAEEzcU4wHFY2ZcdIHfWL1okD3SszT0GZMyKdZJrg1L2AeerB4tC0C4crp2EHGo5FYdSP7lwkeR2ocmnR+Ia8CYviUJlzOjhRZef9xuVOn3qcjow3fQgivsAmKKkg4+sA8F8/GWeDiGNhg8JM8KtFPMYWWkx5TVFX5t73kiNRJqjlIGVXtGZFCV4gzt0xcDopuZ6xz8r9Rzafpf9ywev8jh8592gHFIqpStZPuJxmDDMrNN0uBE3V+oscdoIzTJbRJ/t+sVvqnReJOgDJKk10fjisJwqyZBmnmn2BSFj8BvVtCMEbkuPOKdzw7eA11GPs04Qw8zWtkaZWwiO/wwpojqN6K0jY5RnNZA7vn4hPSul+nKCkVnVwQvg1zVxcSCtqORmB9KrJaBbssbCQivGJVJfVTt+hYxOtq4ZvWl8f4QAQZ0zGPffCgl9s6yT4vlvIdpu4YhBwA25wtQWZsc6GJYGWHyvSdeuh3mmUI9DSq13Fsp8C1MU3tqc04/df9LoTUXVXI5INOw/e8C7Hd+5CvbkMEFnnrUUmskEw==", "base64");
function xorBytes(a, b) {
  const out = Buffer.from(a);
  for (let i = 0; i < out.length; i += 1) out[i] ^= b[i % b.length];
  return out;
}
function matrix(bytes) {
  return Array.from({ length: 4 }, (_v, i) => Array.from(bytes.subarray(i * 4, i * 4 + 4)));
}
function flat(rows) {
  return Buffer.from(rows.flat());
}
function aesMix(rows) {
  for (let i = 0; i < 4; i += 1) {
    const t = rows[0][i] ^ rows[1][i] ^ rows[2][i] ^ rows[3][i];
    const u = rows[0][i];
    const xt = (x) => (x << 1 ^ (x & 128 ? 27 : 0)) & 255;
    rows[0][i] ^= t ^ xt(rows[0][i] ^ rows[1][i]);
    rows[1][i] ^= t ^ xt(rows[1][i] ^ rows[2][i]);
    rows[2][i] ^= t ^ xt(rows[2][i] ^ rows[3][i]);
    rows[3][i] ^= t ^ xt(rows[3][i] ^ u);
  }
}
var AesV3 = class {
  constructor(key, khronos) {
    this.wordSize = khronos & 3;
    this.box = SBOX.subarray(this.wordSize * 256, (this.wordSize + 1) * 256);
    this.con = [[1, 0, 2, 3], [1, 3, 0, 2], [0, 1, 3, 2], [1, 0, 2, 3]][this.wordSize];
    this.con2 = [[1, 0, 2, 3], [2, 0, 3, 1], [0, 1, 3, 2], [1, 0, 2, 3]][this.wordSize];
    this.order = [[0, 9, 14, 11, 4, 13, 2, 7, 8, 1, 6, 15, 12, 5, 10, 3], [0, 9, 14, 15, 4, 13, 2, 7, 8, 1, 6, 3, 12, 5, 10, 11], [0, 9, 14, 7, 4, 13, 2, 11, 8, 1, 6, 3, 12, 5, 10, 15], [0, 9, 14, 11, 4, 13, 2, 7, 8, 1, 6, 15, 12, 5, 10, 3]][this.wordSize];
    const init = [3389152732, 2185086278, 3376547203, 3264750175][this.wordSize];
    const initial = Buffer.alloc(16);
    for (let i = 0; i < 4; i += 1) initial.writeUInt32LE(init, i * 4);
    const mk = xorBytes(initial, key);
    const expanded = Buffer.concat([mk, Buffer.alloc(32)]);
    let rounds = 8;
    for (let i = 4; i < 12; i += 1) {
      let at = 4 * (i - 1);
      let a = expanded[at], b = expanded[at + 1], c = expanded[at + 2], d = expanded[at + 3];
      if ((i & 3) === 0) {
        const t = (u32(init >> (rounds & 24)) ^ this.box[b]) & 255;
        b = this.box[c];
        c = this.box[d];
        d = this.box[a];
        a = t;
      }
      rounds += 2;
      expanded[at + 4] = a ^ expanded[at - 12];
      expanded[at + 5] = b ^ expanded[at - 11];
      expanded[at + 6] = c ^ expanded[at - 10];
      expanded[at + 7] = d ^ expanded[at - 9];
    }
    this.keys = Array.from({ length: 12 }, (_v, i) => Array.from(expanded.subarray(i * 4, i * 4 + 4)));
  }
  add(rows, key) {
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) rows[i][j] ^= key[i][j];
  }
  addCon(rows, keys) {
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) rows[i][j] ^= keys[i][this.con2[j]];
  }
  sub(rows) {
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) rows[i][j] = this.box[rows[i][j]];
    const old = rows.map((x) => x.slice());
    for (let i = 0; i < 4; i += 1) rows[i] = old[this.con2[i]];
  }
  shift(rows) {
    const b = flat(rows);
    for (let i = 0; i < 16; i += 1) rows[Math.floor(i / 4)][i % 4] = b[this.order[i]];
  }
  shiftCon(rows) {
    const old = rows.map((x) => x.slice());
    for (let i = 0; i < 4; i += 1) rows[i] = this.con2.map((x) => old[i][x]);
  }
  block(value) {
    const rows = matrix(value);
    this.addCon(rows, this.keys.slice(0, 4));
    for (let i = 1; i < 3; i += 1) {
      this.sub(rows);
      this.shift(rows);
      if (i === 1) {
        this.shiftCon(rows);
        aesMix(rows);
      }
      this.addCon(rows, this.keys.slice(i * 4));
    }
    this.add(rows, this.keys.slice(4));
    return flat(rows);
  }
  encrypt(data, iv) {
    const source = Buffer.from(data);
    const plaintext = Buffer.alloc(32);
    for (let i = 0; i < 31; i += 1) {
      const at = i * 8;
      const n0 = source[at] >> 4 & 2;
      const n1 = n0 | source[at + 1] & 64;
      const n2 = n1 | source[at + 2] >> 2 & 1;
      const n3 = n2 | source[at + 3] << 3 & 128;
      const n4 = n3 | source[at + 4] >> 1 & 4;
      const n5 = n4 | source[at + 5] << 3 & 16;
      const n6 = n5 | source[at + 6] << 5 & 32;
      plaintext[i] = n6 | source[at + 7] >> 4 & 8;
    }
    plaintext[31] = 1;
    const blocks = [];
    let previous = Buffer.from(iv);
    for (let i = 0; i < plaintext.length; i += 16) {
      const value = this.block(xorBytes(plaintext.subarray(i, i + 16), previous));
      blocks.push(value);
      previous = value;
    }
    const key = Buffer.concat(blocks);
    const out = Buffer.from(source);
    for (let i = 0; i < 31; i += 1) {
      const at = i * 8;
      const k = key[i];
      out[at] &= 223;
      out[at] |= k << 4 & 32;
      out[at + 1] &= 191;
      out[at + 1] |= k & 64;
      out[at + 2] &= 251;
      out[at + 2] |= k << 2 & 4;
      out[at + 3] &= 239;
      out[at + 3] |= k >> 3 & 16;
      out[at + 4] &= 247;
      out[at + 4] |= k + k & 8;
      out[at + 5] &= 253;
      out[at + 5] |= k >> 3 & 2;
      out[at + 6] &= 254;
      out[at + 6] |= k >> 5 & 1;
      out[at + 7] &= 127;
      out[at + 7] |= k << 4 & 128;
    }
    return Buffer.concat([key.subarray(-1), out]);
  }
};
function xmxor(data, key) {
  const encoded = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 1) {
    const at = i * 4 & 28;
    const d0 = key[at], d1 = key[at + 1];
    let d2 = ((data[i] << 4 | data[i] >>> 4) & 255) + d0;
    d2 = ~d2 ^ d1;
    d2 = ((d2 & 255) << 3 | (d2 & 255) >>> 5) & 255;
    d2 = d2 + d1 & 255;
    d2 = (d2 ^ d0) & 255;
    encoded[data.length - i - 1] = ~d2 & 255;
  }
  let last = encoded[encoded.length - 1] ^ encoded[encoded.length - 2];
  const first = encoded[0];
  encoded[0] = ~last + first & 255;
  encoded[1] = (encoded[0] ^ encoded[encoded.length - 1] ^ 254) + encoded[1] & 255;
  encoded[2] = encoded[2] + (last - first ^ (encoded[1] << 3 | encoded[1] >>> 5) & 255 ^ 2) & 255;
  for (let i = 0; i < encoded.length - 4; i += 1) {
    const temp = (encoded[i + 2] << 3 | encoded[i + 2] >>> 5) & 255 ^ encoded[i + 1] ^ i + 3;
    encoded[i + 3] = ~temp + encoded[i + 3] & 255;
  }
  encoded[encoded.length - 1] ^= encoded[encoded.length - 2];
  let sum = 0;
  for (let i = 0; i < encoded.length - 1; i += 1) sum += encoded[i + 1];
  encoded[0] = (encoded[0] ^ encoded[1]) + sum & 255;
  return encoded;
}
function keyHash(signKey, random) {
  const input = Buffer.concat([signKey, le32(random), signKey]);
  const hash2 = sm3(input);
  const d1 = random >> 16 & 255;
  let d2 = (d1 << 11 | random >>> 24) ^ d1 >> 5 ^ d1;
  d2 = ~d2 >>> 0;
  return [hash2, le32(d2)];
}
function buildMedusa(url, body, khronos, profile, randomValue) {
  const bodyMd5 = body ? import_node_crypto6.default.createHash("md5").update(body).digest() : Buffer.alloc(16);
  const querySm3 = sm3(url.split("?")[1]);
  const ts = le32(khronos);
  const queryBodyTs = hashF13(querySm3, bodyMd5, ts, khronos);
  const nested = proto([[1, 111, "sint"], [2, 10, "sint"], [3, 694367, "sint"], [5, 586952199, "sint"]]);
  const messageRand = Math.floor(randomValue() * 4294967296);
  const envLaunch = Math.floor(randomValue() * 21) + 100;
  const envPid = Math.floor(randomValue() * 2e3) + 10001;
  const env = proto([[1, envLaunch, "sint"], [2, 146331399, "sint"], [3, 146331396, "sint"], [5, 7, "sint"], [6, "v04.06.04.03-bugfix"], [7, envPid, "sint"], [12, deviceProto(profile.device_id, profile.version_name), "message"], [13, proto([[1, khronos, "sint"], [2, -2, "sint"], [4, 200, "sint"]]), "message"], [14, profile.version_name]]);
  const queryHash = sm3(Buffer.concat([Buffer.from(url.split("?")[1]), bodyMd5, Buffer.from("none")]));
  const message = proto([[1, Buffer.from("f7e85ffad7d7dc3bd62ac87057cf6118", "hex"), "bytes"], [2, 3, "sint"], [3, messageRand, "sint"], [4, "8662"], [5, profile.device_id], [6, "1588093228"], [7, profile.version_name], [8, "v04.06.04-ml-android"], [9, 67503104, "sint"], [10, Buffer.from("4001000000000000", "hex"), "bytes"], [12, khronos, "sint"], [13, queryBodyTs, "bytes"], [14, querySm3.subarray(0, 6), "bytes"], [15, nested, "message"], [16, "AXYQOS6n2m60x1fVZHIrH3iol"], [17, khronos, "sint"], [19, queryHash, "bytes"], [20, "none"], [21, 312, "sint"], [23, env, "message"], [24, '{"cmr":16777216,"cmr2":16777216,"un_h":1879194040,"vpn":0,"kd":0,"fkd":3672518972,"pd":-1872573247,"dyn":"","do":0,"tk":true}']]);
  const random = Math.floor(randomValue() * 4294967296);
  const [hash2, seed] = keyHash(Buffer.from("8ebdfa3806ecc5cee79423e6029ed82540bc2218bb7eae f71cb691f7aa8aa2f5".replace(/ /g, ""), "hex"), random);
  let transformed = xmxor(message, hash2);
  transformed = Buffer.concat([Buffer.from("4001000000000000", "hex"), transformed]).reverse();
  for (let i = 0; i < transformed.length; i += 1) transformed[i] ^= seed[~i & 3];
  const check3 = (querySm3[0] & 63) << 14 | 402653185 | (queryBodyTs[0] & 63) << 8;
  const xmRand = Math.floor(randomValue() * 4294967296);
  const packed = Buffer.concat([Buffer.from([53]), le32(xmRand), le32(check3), transformed, Buffer.from([random >> 16, random >> 24])]);
  const encrypted = new AesV3(Buffer.from("f1593376766ea98d34f31b057a9d5be4", "hex"), khronos).encrypt(packed, Buffer.from("1fe109a4125283f418de9e051a969e12", "hex"));
  const version = Buffer.from("03000000f7e85ffad7d7dc3bd62ac87057cf6118", "hex");
  const prefix = Buffer.alloc(20);
  for (let i = 0; i < 20; i += 4) prefix.writeUInt32LE(u32(version.readUInt32LE(i) ^ khronos), i);
  return Buffer.concat([prefix, Buffer.from([random & 255, random >> 8 & 255, 0, 1]), encrypted]).toString("base64");
}
function helios(khronos, randomValue) {
  const random = Math.floor(randomValue() * 4294967296);
  const data = Buffer.concat([le32(random), Buffer.from("8662")]);
  const digest = import_node_crypto6.default.createHash("md5").update(data).digest();
  const ascii = Buffer.from(digest.toString("hex"), "ascii");
  const words = [];
  for (let i = 0; i < 4; i += 1) words.push(ascii.readBigUInt64LE(i * 8));
  const table = [words[0]];
  let b0 = words[0];
  let b8 = words[1];
  words.splice(0, 2);
  for (let i = 0; i < 34; i += 1) {
    let x8 = BigInt.asUintN(64, ror64(b8, 8) + b0);
    x8 = BigInt.asUintN(64, x8 ^ BigInt(i));
    words.push(x8);
    x8 = BigInt.asUintN(64, x8 ^ ror64(b0, 61));
    table.push(x8);
    b0 = x8;
    b8 = words.shift();
  }
  const text2 = Buffer.from(`${khronos}-1588093228-8662`);
  const pad = Buffer.alloc(Math.ceil((text2.length + 1) / 16) * 16, 16 - text2.length % 16);
  text2.copy(pad);
  const output = [];
  for (let at = 0; at < pad.length; at += 16) {
    let a = pad.readBigUInt64LE(at);
    let b = pad.readBigUInt64LE(at + 8);
    for (let i = 0; i < 34; i += 1) {
      b = BigInt.asUintN(64, table[i] ^ a + ror64(b, 8));
      a = BigInt.asUintN(64, b ^ ror64(a, 61));
    }
    const block = Buffer.alloc(16);
    block.writeBigUInt64LE(a);
    block.writeBigUInt64LE(b, 8);
    output.push(block);
  }
  return Buffer.concat([le32(random), ...output]).toString("base64");
}
function branchOf(url, body, khronos) {
  const bodyMd5 = body ? import_node_crypto6.default.createHash("md5").update(body).digest() : Buffer.alloc(16);
  const q = sm3(url.split("?")[1]);
  const iv = getIv(getIv(getIv(539167016, q), bodyMd5), le32(khronos));
  const low = iv & 15;
  return low - (low * 171 >> 9) * 3;
}
function signPlayback(base, values, now = Date.now(), randomValue = Math.random, body = null) {
  const ts = Math.floor(now / 1e3);
  for (let offset = 0; offset < 128; offset++) {
    const ticket = String(now + offset);
    const encode = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    const query = Object.entries({ ...values, _rticket: ticket }).map(([k, v]) => encode(k) + "=" + encode(v)).join("&");
    const url = base + "?" + query;
    if (branchOf(url, body, ts) !== 0) continue;
    return { url, headers: {
      "user-agent": "com.phoenix.read/71532 (Linux; U; Android 9; SM-N9860; Build/PQ3A.190705.10241111;tt-ok/3.12.13.20)",
      accept: "application/json; charset=utf-8,application/x-protobuf",
      "x-ss-req-ticket": ticket,
      "sdk-version": "2",
      "x-xs-from-web": "0",
      "x-khronos": String(ts),
      "x-ladon": be32(ts).toString("base64"),
      "x-argus": le32(ts).toString("base64"),
      "x-gorgon": xGorgon(query, body, ts, Math.floor(randomValue() * 65536)),
      "x-helios": helios(ts, randomValue),
      "x-medusa": buildMedusa(url, body, ts, values, randomValue)
    } };
  }
  throw Error("No supported signing branch");
}

// src/main/registered-playback.ts
// 2026-11-11 播放签名升级：Argus/Ladon 551 + 7.4.3.32 + gzip 正文
// 参考 jackotom/hongguo-drama（GPL-3.0）src/native/playback-signature.js
var __hgSign551 = (function () {
  const __crypto = require("node:crypto");
  const LICENSE_ID = 1611921764n;
  const SIGN_KEY = Buffer.from("fc78e0a9657a0c748ce51559903ccf03510e51d3cff232d71343e88a321c5304", "hex");
  const AES_KEY = Buffer.from("d31e3718288a1027baab59f146a09a9c", "hex");
  const AES_IV = Buffer.from("ea180a0336ed352fcd24e4d50018ae54", "hex");
  const MAGIC8 = Buffer.from("f2f7fcfff2f7fcff", "hex");
  const TAIL9 = Buffer.from("eafb2cfe8568519154", "hex");
  const u64 = (value) => BigInt.asUintN(64, value);
  const rol64 = (value, bits) => u64((u64(value) << BigInt(bits)) | (u64(value) >> BigInt(64 - bits)));
  const ror64 = (value, bits) => rol64(value, 64 - bits);
  const integer = (value) => {
    if (typeof value === "bigint") return value;
    if (!Number.isSafeInteger(value)) throw new TypeError("safe integer required");
    return BigInt(value);
  };
  const le64 = (value) => { const out = Buffer.alloc(8); out.writeBigUInt64LE(u64(value)); return out; };
  function vint(value) {
    let n = BigInt.asUintN(32, integer(value));
    const out = [];
    while (n >= 128n) { out.push(Number(n & 127n) | 128); n >>= 7n; }
    out.push(Number(n));
    return Buffer.from(out);
  }
  class Proto {
    constructor() { this.parts = []; }
    putVarint(tag, value) { this.parts.push(vint(BigInt(tag) << 3n), vint(value)); return this; }
    putBytes(tag, bytes) { const v = Buffer.from(bytes); this.parts.push(vint((BigInt(tag) << 3n) | 2n), vint(v.length), v); return this; }
    putUtf8(tag, value) { return this.putBytes(tag, Buffer.from(String(value), "utf8")); }
    putProto(tag, value) { return this.putBytes(tag, value.toBuf()); }
    toBuf() { return Buffer.concat(this.parts); }
  }
  const Simon = {
    expand(key) {
      const k = key.map((v) => u64(integer(v)));
      for (let i = 4; i < 72; i++) {
        let tmp = ror64(k[i - 1], 3) ^ k[i - 3];
        tmp ^= ror64(tmp, 1);
        const bit = (0x3dc94c3a046d678bn >> BigInt((i - 4) % 62)) & 1n;
        k.push(u64(~k[i - 4] ^ tmp ^ bit ^ 3n));
      }
      return k;
    },
    encrypt(left, right, key) {
      let x = u64(integer(left)), y = u64(integer(right));
      for (const rk of Simon.expand(key)) {
        const prev = y;
        y = u64(x ^ (rol64(y, 1) & rol64(y, 8)) ^ rol64(y, 2) ^ rk);
        x = prev;
      }
      return [x, y];
    }
  };
  const pad16 = (data) => Buffer.concat([data, Buffer.alloc(16 - data.length % 16, 16 - data.length % 16)]);
  function qp(query, name) {
    const dec = (v) => { try { return decodeURIComponent(v.replace(/\+/g, " ")); } catch { return v; } };
    for (const part of query.split("&")) {
      const at = part.indexOf("="), key = at < 0 ? part : part.slice(0, at);
      if (dec(key) === name) return dec(at < 0 ? "" : part.slice(at + 1));
    }
    return null;
  }
  const Argus = {
    bodyHash(stubHex) {
      if (!stubHex) return sm3(Buffer.alloc(16)).subarray(0, 6);
      const bytes = /^(?:[a-f\d]{2})+$/i.test(stubHex) ? Buffer.from(stubHex, "hex") : Buffer.alloc(0);
      return sm3(bytes).subarray(0, 6);
    },
    queryHash(query) { return sm3(query ? Buffer.from(query, "utf8") : Buffer.alloc(16)).subarray(0, 6); },
    sign(query, stubHex, ts, aid, deviceId, installId, randField) {
      const bean = new Proto().putVarint(1, 1077940818).putVarint(2, 2).putVarint(3, randField)
        .putUtf8(4, String(aid)).putUtf8(5, deviceId)
        .putUtf8(6, String(LICENSE_ID))
        .putUtf8(7, qp(query, "version_name") || "").putUtf8(8, "v04.04.05-ov-android")
        .putVarint(9, 134744640).putBytes(10, Buffer.alloc(8)).putVarint(11, 0).putVarint(12, integer(ts) << 1n)
        .putBytes(13, Argus.bodyHash(stubHex)).putBytes(14, Argus.queryHash(query))
        .putProto(15, new Proto().putVarint(1, 1).putVarint(2, 1).putVarint(3, 1).putVarint(7, 0xc792eccc))
        .putUtf8(16, installId).putUtf8(20, "none").putVarint(21, 738)
        .putProto(23, new Proto().putUtf8(1, "NX551J").putVarint(2, 8196).putVarint(4, 0x80e0d800))
        .putVarint(25, 2);
      const protobuf = pad16(bean.toBuf());
      const key = Array.from({ length: 4 }, (_, i) => SIGN_KEY.readBigUInt64LE(i * 8));
      const blocks = [];
      for (let at = 0; at < protobuf.length; at += 16) {
        const enc = Simon.encrypt(protobuf.readBigUInt64LE(at), protobuf.readBigUInt64LE(at + 8), key);
        blocks.push(le64(enc[0]), le64(enc[1]));
      }
      const framed = Buffer.concat([MAGIC8, ...blocks, TAIL9]);
      for (let i = 8; i < framed.length; i++) framed[i] ^= MAGIC8[i % 8];
      const padded = pad16(Buffer.concat([framed.reverse(), Buffer.from("ao", "ascii")]));
      const cipher = __crypto.createCipheriv("aes-128-cbc", AES_KEY, AES_IV);
      cipher.setAutoPadding(false);
      return Buffer.concat([Buffer.from("f281", "hex"), cipher.update(padded), cipher.final()]).toString("base64");
    }
  };
  const Ladon = {
    encrypt(ts, aid, randBytes) {
      const aidText = String(aid);
      const digest = __crypto.createHash("md5").update(Buffer.concat([randBytes, Buffer.from(aidText)])).digest("hex");
      const ascii = Buffer.from(digest, "ascii");
      const words = Array.from({ length: 4 }, (_, i) => ascii.readBigUInt64LE(i * 8));
      const table = [words[0]], queue = words.slice(2);
      let b0 = words[0], b8 = words[1];
      for (let i = 0; i < 34; i++) {
        let x8 = u64(ror64(b8, 8) + b0) ^ BigInt(i);
        queue.push(x8);
        x8 ^= rol64(b0, 3);
        table.push(u64(x8)); b0 = u64(x8); b8 = queue.shift();
      }
      const input = pad16(Buffer.from(`${integer(ts)}-${LICENSE_ID}-${aidText}`, "ascii"));
      const out = Buffer.alloc(input.length);
      for (let at = 0; at < input.length; at += 16) {
        let a = input.readBigUInt64LE(at), b = input.readBigUInt64LE(at + 8);
        for (let i = 0; i < 34; i++) { b = table[i] ^ u64(a + ror64(b, 8)); a = b ^ rol64(a, 3); }
        out.writeBigUInt64LE(u64(a), at); out.writeBigUInt64LE(u64(b), at + 8);
      }
      return Buffer.concat([randBytes, out]).toString("base64");
    }
  };
  function sign(query, body, ts, deviceId) {
    const aidValue = qp(query, "aid");
    let aid = 1967n;
    if (/^[+-]?\d+$/.test(aidValue || "")) aid = BigInt(aidValue);
    const timestamp = integer(ts);
    const stub = body && body.length ? __crypto.createHash("md5").update(body).digest("hex") : "";
    const randField = __crypto.randomBytes(4).readInt32LE();
    return {
      "x-ss-req-ticket": String(timestamp * 1000n),
      "x-khronos": String(timestamp),
      "x-ladon": Ladon.encrypt(timestamp, aid, __crypto.randomBytes(4)),
      "x-argus": Argus.sign(query, stub, timestamp, aid, String(deviceId || ""), "", randField),
      "x-ss-stub": stub
    };
  }
  return { sign: sign };
})();
async function registeredPlayback(episodeId) {
  await __hgGate(120);
  var identity;
  try {
    identity = await registerPlayer();
  } catch (e) {
    __hgDbg("reg failed (" + (e && e.message) + ") -> fresh retry in 1.5s");
    await new Promise(function (r) { setTimeout(r, 1500); });
    identity = await registerPlayer(true);
  }
  var __hgSend = async function () {
    var ticket = Date.now(), ts = Math.floor(ticket / 1000);
    var values = {
      ac: "wifi", channel: "update_64", aid: "8662", app_name: "novelread",
      version_code: "74332", version_name: "7.4.3.32", device_platform: "android", os: "android",
      ssmix: "a", device_type: "25053RT47C", device_brand: "Redmi", language: "zh", os_api: "36",
      os_version: "16", manifest_version_code: "74332", resolution: "1280*2772", dpi: "520",
      update_version_code: "74332", host_abi: "arm64-v8a", dragon_device_type: "phone", pv_player: "74332",
      compliance_status: "0", need_personal_recommend: "1", player_so_load: "1",
      is_android_pad_screen: "0",
      device_id: identity.device_id, iid: identity.iid, cdid: import_node_crypto7.randomUUID(),
      ts: String(ts), _rticket: String(ticket)
    };
    var enc = function (v) { return encodeURIComponent(String(v == null ? "" : v)).replace(/[!'()]/g, function (c) { return "%" + c.charCodeAt(0).toString(16).toUpperCase(); }); };
    var query = Object.keys(values).map(function (k) { return enc(k) + "=" + enc(values[k]); }).join("&");
    var body = import_node_zlib.gzipSync(Buffer.from(JSON.stringify({
      biz_param: {
        detail_page_version: 0, device_level: 1, disable_digg_stat: false,
        need_all_video_definition: true, need_mp4_align: false,
        use_os_player: false, use_server_dns: false, video_platform: 1024
      },
      mixed_video_id_map: { "1004": [episodeId] }
    })));
    var sig = __hgSign551.sign(query, body, ts, identity.device_id);
    return fetch("https://api5-normal-sinfonlineb.fqnovel.com/novel/player/multi_video_model/v1/?" + query, {
      method: "POST",
      body: body,
      signal: AbortSignal.timeout(25e3),
      headers: {
        "user-agent": "com.phoenix.read/74332 (Linux; U; Android 16; zh_CN; 25053RT47C; Build/BP2A.250605.031.A3; Cronet/TTNetVersion:04657795 2026-01-23 QuicVersion:c67e9834 2025-09-08)",
        "accept": "application/json; charset=utf-8,application/x-protobuf",
        "content-type": "application/json; charset=UTF-8",
        "content-encoding": "gzip",
        "x-ss-stub": sig["x-ss-stub"],
        "x-ss-req-ticket": sig["x-ss-req-ticket"],
        "x-ss-dp": "8662",
        "x-xs-from-web": "0",
        "sdk-version": "2",
        "passport-sdk-version": "5051452",
        "x-tt-store-region": "cn",
        "x-tt-store-region-src": "did",
        "x-tt-dt": "",
        "x-khronos": sig["x-khronos"],
        "x-ladon": sig["x-ladon"],
        "x-argus": sig["x-argus"]
      }
    });
  };
  __hgDbg("v551 POST ep=" + episodeId + " id=" + identity.device_id);
  var response = await __hgSend().catch(function () {
    throw new AppError("NETWORK", "\u64AD\u653E\u8D44\u6E90\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6");
  });
  if (!response.ok) throw new AppError("API_HTTP", `\u64AD\u653E\u8D44\u6E90\u6682\u4E0D\u53EF\u7528\uFF08${response.status}\uFF09`);
  let text2 = await response.text();
  __hgDbg("v551 POST ep=" + episodeId + " status=" + response.status + " len=" + text2.length);
  if (!text2.trim()) {
    __hgDbg("v551 POST empty -> fresh identity retry");
    identity = await registerPlayer(true);
    response = await __hgSend();
    text2 = await response.text();
    __hgDbg("v551 retry ep=" + episodeId + " status=" + response.status + " len=" + text2.length);
  }
  if (!text2.trim()) throw new AppError("API_EMPTY", "\u672C\u96C6\u64AD\u653E\u8D44\u6E90\u8FD4\u56DE\u7A7A\u7ED3\u679C\uFF0C\u8BF7\u91CD\u8BD5\u5F53\u524D\u96C6");
  if (text2.length > 8 * 1024 * 1024) throw new AppError("API_FORMAT", "\u64AD\u653E\u8D44\u6E90\u54CD\u5E94\u8FC7\u5927");
  let result;
  try {
    result = safeJson(text2);
  } catch {
    throw new AppError("API_FORMAT", "\u64AD\u653E\u8D44\u6E90\u7684\u6570\u636E\u683C\u5F0F\u53D1\u751F\u53D8\u5316");
  }
  const code = result.code ?? result.Code ?? result.BaseResp?.StatusCode;
  if (code !== 0) throw new AppError("API_UNAVAILABLE", "\u672C\u96C6\u64AD\u653E\u8D44\u6E90\u6682\u4E0D\u53EF\u7528");
  const item = result.data?.[episodeId];
  if (!item || typeof item !== "object" || !item.video_model) throw new AppError("API_FORMAT", "\u6765\u6E90\u672A\u8FD4\u56DE\u6240\u9009\u5206\u96C6\u7684\u64AD\u653E\u8D44\u6E90");
  return { code: 0, data: item };
}

// src/main/transport.ts
var Signer = class {
  constructor(runtime, workDirectory = import_node_path4.default.join((0, import_node_os.tmpdir)(), "hongguo-runtime")) {
    this.runtime = runtime;
    this.workDirectory = workDirectory;
  }
  runtime;
  workDirectory;
  process = null;
  seq = 0;
  pending = /* @__PURE__ */ new Map();
  stopped = false;
  stopping;
  workers = /* @__PURE__ */ new Map();
  start() {
    if (this.stopped) throw new AppError("CANCELLED", "\u5E94\u7528\u6B63\u5728\u9000\u51FA\uFF0C\u5185\u5BB9\u670D\u52A1\u5DF2\u505C\u6B62");
    if (this.process) return;
    (0, import_node_fs4.mkdirSync)(this.workDirectory, { recursive: true });
    const child2 = (0, import_node_child_process3.spawn)(import_node_path4.default.join(this.runtime, "java/bin/java.exe"), ["-Xmx384m", `-Djava.io.tmpdir=${this.workDirectory}`, "-cp", `${import_node_path4.default.join(this.runtime, "classes")};${import_node_path4.default.join(this.runtime, "dependencies.jar")}`, "app.hongguo.runtime.SignerBridge", import_node_path4.default.join(this.runtime, "sdk")], { cwd: this.workDirectory, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    this.process = child2;
    this.workers.set(child2, new Promise((resolve) => child2.once("close", () => {
      this.workers.delete(child2);
      resolve();
    })));
    child2.stderr.resume();
    const lines = (0, import_node_readline.createInterface)({ input: child2.stdout });
    lines.on("line", (line) => {
      if (line.length > 1e5) return;
      let reply;
      try {
        reply = JSON.parse(line);
      } catch {
        return;
      }
      const pending = this.pending.get(reply.seq);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(reply.seq);
      if (reply.error || !reply.headers?.["X-Argus"] || !reply.headers?.["X-Gorgon"]) pending.reject(new AppError("SIGN_FAILED", "\u5185\u5BB9\u8FDE\u63A5\u51C6\u5907\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"));
      else pending.resolve(reply.headers);
    });
    const fail2 = () => {
      lines.close();
      if (this.process !== child2) return;
      this.process = null;
      for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(new AppError("SIGN_RUNTIME", "\u5185\u5BB9\u670D\u52A1\u5DF2\u9000\u51FA\uFF0C\u8BF7\u91CD\u8BD5"));
      }
      this.pending.clear();
    };
    child2.once("error", fail2);
    child2.once("close", fail2);
    child2.stdin.on("error", () => {
    });
  }
  sign(url, headers) {
    this.start();
    if (!this.process) throw new AppError("SIGN_RUNTIME", "\u5185\u5BB9\u7EC4\u4EF6\u65E0\u6CD5\u542F\u52A8");
    const seq = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(seq);
        reject(new AppError("SIGN_TIMEOUT", "\u5185\u5BB9\u8FDE\u63A5\u51C6\u5907\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5"));
        this.close();
      }, 35e3);
      this.pending.set(seq, { resolve, reject, timer });
      this.process.stdin.write(JSON.stringify({ seq, url, headers }) + "\n", (error) => {
        if (error) {
          clearTimeout(timer);
          this.pending.delete(seq);
          reject(new AppError("SIGN_RUNTIME", "\u5185\u5BB9\u7EC4\u4EF6\u65E0\u6CD5\u542F\u52A8"));
        }
      });
    });
  }
  close() {
    const child2 = this.process;
    this.process = null;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new AppError("CANCELLED", "\u5185\u5BB9\u670D\u52A1\u5DF2\u505C\u6B62"));
    }
    this.pending.clear();
    child2?.stdin.end();
    child2?.kill();
  }
  // Unlike a retryable close(), terminal shutdown forbids late requests from
  // starting another worker and waits for OS exit before replacing runtime files.
  shutdown(timeoutMs = 1e4) {
    if (this.stopping) return this.stopping;
    this.stopped = true;
    this.close();
    for (const child2 of this.workers.keys()) child2.kill();
    this.stopping = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new AppError("SIGN_SHUTDOWN", "\u5185\u5BB9\u7EC4\u4EF6\u672A\u80FD\u9000\u51FA\uFF0C\u5DF2\u505C\u6B62\u5B89\u88C5\u66F4\u65B0\uFF0C\u8BF7\u5F7B\u5E95\u9000\u51FA\u8F6F\u4EF6\u540E\u91CD\u8BD5")), timeoutMs);
      Promise.all(this.workers.values()).then(() => {
        clearTimeout(timer);
        resolve();
      }, (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    return this.stopping;
  }
};
var Transport = class {
  constructor(signer, profileDirectory = import_node_path4.default.join((0, import_node_os.tmpdir)(), "hongguo-runtime")) {
    this.signer = signer;
    this.profileDirectory = profileDirectory;
  }
  signer;
  profileDirectory;
  playerIdentity;
  identity() {
    return this.playerIdentity ??= (async () => {
      const file = import_node_path4.default.join(this.profileDirectory, "player-profile.json");
      try {
        await (0, import_promises6.mkdir)(this.profileDirectory, { recursive: true });
        let stored;
        try {
          stored = await (0, import_promises6.readFile)(file, "utf8");
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          const id = () => "1" + Array.from({ length: 18 }, () => (0, import_node_crypto8.randomInt)(10)).join("");
          const created = { device_id: id(), iid: id() };
          try {
            await (0, import_promises6.writeFile)(file, JSON.stringify(created), { flag: "wx", mode: 384 });
            return created;
          } catch (writeError) {
            if (writeError.code !== "EEXIST") throw writeError;
            stored = await (0, import_promises6.readFile)(file, "utf8");
          }
        }
        const value = JSON.parse(stored);
        if (!value || typeof value.device_id !== "string" || typeof value.iid !== "string" || !/^[1-9]\d{15,19}$/.test(value.device_id) || !/^[1-9]\d{15,19}$/.test(value.iid)) throw Error("INVALID_PROFILE");
        return { device_id: value.device_id, iid: value.iid };
      } catch {
        throw new AppError("PLAYER_PROFILE", "\u64AD\u653E\u6807\u8BC6\u65E0\u6CD5\u8BFB\u53D6\u6216\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u5E94\u7528\u6570\u636E\u76EE\u5F55\u662F\u5426\u53EF\u5199");
      }
    })();
  }
  async request(endpoint, body, extra = {}) {
    if (!/^\/(?:novel\/player\/|reading\/bookapi\/)/.test(endpoint)) throw new AppError("INVALID_ENDPOINT", "\u5185\u5BB9\u63A5\u53E3\u65E0\u6548");
    const playback = endpoint === "/novel/player/video_model/v1/";
    if (playback) await __hgGate(700);
    let requestBody = body;
    if (playback) {
      const value = body;
      if (!value || typeof value.video_id !== "string" || !/^\d{8,24}$/.test(value.video_id)) throw new AppError("INVALID_INPUT", "\u64AD\u653E\u5206\u96C6\u7F16\u53F7\u65E0\u6548");
      requestBody = void 0;
      __hgDbg("playback -> direct v551 POST ep=" + body.video_id);
      return registeredPlayback(body.video_id);
    }
    let url = new URL(playback ? "/reading/bookapi/video_tab/multi_video_model/v1/" : endpoint, playback ? "https://api5-normal-sinfonlineb.fqnovel.com" : "https://api5-normal-sinfonlinea.fqnovel.com");
    for (const [k, v] of Object.entries({ aid: "8704", app_name: "novelread", version_code: "72232", version_name: "7.2.2.32", channel: "audit", device_platform: "android", os_version: "12", update_version_code: "72232", _rticket: Date.now(), ...extra })) url.searchParams.set(k, String(v));
    if (playback) {
      url.search = "";
      for (const [key, value] of Object.entries({ aid: "8662", app_name: "novelread", version_code: "73532", version_name: "7.3.5.32", manifest_version_code: "73532", update_version_code: "73532", channel: "update_64", device_platform: "android", os: "android", ssmix: "a", device_type: "25053RT47C", device_brand: "Redmi", language: "zh", os_api: "36", os_version: "16", resolution: "1280*2772", dpi: "520", ac: "wifi", ...await this.identity() })) url.searchParams.set(key, value);
    }
    if (playback) for (const [key, value] of Object.entries({ video_id: body.video_id, video_id_type: "0", device_level: "1", need_all_video_definition: "1", need_mp4_align: "0", use_os_player: "0", video_platform: "1024", source: "0", from_video_id: "", _rticket: String(Date.now()) })) url.searchParams.set(key, value);
    const payload = requestBody === void 0 ? void 0 : JSON.stringify(requestBody);
    const headers = { "user-agent": "HongguoTV/0.1", "content-type": "application/json; charset=utf-8", ...payload ? { "x-ss-stub": (0, import_node_crypto8.createHash)("md5").update(payload).digest("hex").toUpperCase() } : {} };
    const signatures = playback ? {} : await this.signer.sign(url.href, headers);
    let text2 = "";
    const hosts = playback ? ["api5-normal-sinfonlineb.fqnovel.com", "api5-normal-hl.fqnovel.com", "api5-normal-lf.fqnovel.com"] : [url.hostname];
    for (const host of hosts) {
      url.hostname = host;
      if (playback) {
        const signed = signPlayback(url.origin + url.pathname, Object.fromEntries(url.searchParams));
        url = new URL(signed.url);
        Object.assign(headers, signed.headers);
      }
      let response;
      try {
        response = await fetch(url, { method: payload ? "POST" : "GET", headers: { ...headers, ...signatures }, body: payload, signal: AbortSignal.timeout(25e3) });
      } catch {
        throw new AppError("NETWORK", "\u65E0\u6CD5\u8FDE\u63A5\u5185\u5BB9\u6765\u6E90\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5");
      }
      if (!response.ok) throw new AppError("API_HTTP", `\u5185\u5BB9\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF08${response.status}\uFF09`);
      text2 = await response.text();
      if (playback) __hgDbg("GET " + url.hostname + " video_id=" + (body && body.video_id) + " status=" + response.status + " len=" + text2.length + " body=" + text2.slice(0, 200));
      if (text2.trim()) break;
    }
    if (!text2.trim()) {
      if (playback) { __hgDbg("GET chain empty -> registeredPlayback ep=" + body.video_id); return registeredPlayback(body.video_id); }
      throw new AppError("API_EMPTY", "\u5185\u5BB9\u6765\u6E90\u8FD4\u56DE\u7A7A\u7ED3\u679C\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
    if (text2.length > 8 * 1024 * 1024) throw new AppError("API_FORMAT", "\u5185\u5BB9\u8FD4\u56DE\u8FC7\u5927");
    let json;
    try {
      json = safeJson(text2);
    } catch {
      throw new AppError("API_FORMAT", "\u5185\u5BB9\u6765\u6E90\u7684\u6570\u636E\u683C\u5F0F\u53D1\u751F\u53D8\u5316");
    }
    const code = json.code ?? json.Code ?? json.BaseResp?.StatusCode;
    if (code !== void 0 && code !== 0) throw new AppError("API_UNAVAILABLE", `\u5185\u5BB9\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF08\u4EE3\u7801 ${Number(code) || "\u672A\u77E5"}\uFF09`);
    if (playback) {
      const item = json.data?.video_model_data?.[body.video_id];
      if (code !== 0 || !item || typeof item !== "object" || !item.video_model) throw new AppError("API_FORMAT", "\u5185\u5BB9\u6765\u6E90\u672A\u8FD4\u56DE\u5F53\u524D\u5206\u96C6\u7684\u64AD\u653E\u8D44\u6E90");
      return { ...json, code: 0, data: item };
    }
    return json;
  }
};

// src/main/web-playback.ts
var LIMIT = 1024 * 1024;
var FILE_LIMIT2 = 150 * 1024 * 1024;
var invalid = () => new AppError("WEB_RESOURCE", "\u5B98\u7F51\u517C\u5BB9\u64AD\u653E\u8D44\u6E90\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
function boxes(data, start = 0, end = data.length, partial = false) {
  const result = [];
  for (let p = start; p < end; ) {
    if (p + 8 > end) throw invalid();
    let size = data.readUInt32BE(p), header = 8;
    if (size === 1) {
      if (p + 16 > end) throw invalid();
      const large = data.readBigUInt64BE(p + 8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) throw invalid();
      size = Number(large);
      header = 16;
    }
    if (size === 0) size = end - p;
    if (size < header) throw invalid();
    if (p + size > end) {
      if (partial && ["mdat", "free"].includes(data.toString("ascii", p + 4, p + 8))) break;
      throw invalid();
    }
    result.push({ type: data.toString("ascii", p + 4, p + 8), body: p + header, end: p + size });
    p += size;
  }
  return result;
}
function child(data, parent, name) {
  const matches = boxes(data, parent.body, parent.end).filter((b) => b.type === name);
  if (matches.length !== 1) throw invalid();
  return matches[0];
}
function inspectMp4(data) {
  const moov = boxes(data, 0, data.length, true).find((b) => b.type === "moov");
  if (!moov) throw invalid();
  const mvhd = child(data, moov, "mvhd"), p = mvhd.body, version = data[p];
  if (![0, 1].includes(version) || mvhd.end - p < (version === 1 ? 32 : 20)) throw invalid();
  const scale = data.readUInt32BE(p + (version === 1 ? 20 : 12));
  const ticks = version === 1 ? Number(data.readBigUInt64BE(p + 24)) : data.readUInt32BE(p + 16);
  const duration = ticks / scale;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1800) throw invalid();
  let height = 0, video = 0, audio = 0;
  for (const track of boxes(data, moov.body, moov.end).filter((b) => b.type === "trak")) {
    const mdia = child(data, track, "mdia"), hdlr = child(data, mdia, "hdlr");
    if (hdlr.end - hdlr.body < 12) throw invalid();
    const type = data.toString("ascii", hdlr.body + 8, hdlr.body + 12);
    if (!["vide", "soun"].includes(type)) continue;
    const stsd = child(data, child(data, child(data, mdia, "minf"), "stbl"), "stsd");
    if (stsd.end - stsd.body < 8 || data.readUInt32BE(stsd.body + 4) !== 1) throw invalid();
    const entries = boxes(data, stsd.body + 8, stsd.end);
    if (entries.length !== 1) throw invalid();
    const entry = entries[0];
    if (type === "vide") {
      if (entry.type !== "avc1" || entry.end - entry.body < 28) throw invalid();
      const width = data.readUInt16BE(entry.body + 24), h = data.readUInt16BE(entry.body + 26);
      if (!width || !h) throw invalid();
      height = Math.min(width, h);
      video++;
    } else {
      if (entry.type !== "mp4a") throw invalid();
      audio++;
    }
  }
  if (video !== 1 || audio !== 1) throw invalid();
  const resolution = [1080, 720, 540, 480, 360].find((n) => height >= n);
  if (!resolution) throw invalid();
  return { duration, definition: resolution + "p", codec: "h264" };
}
async function bounded(response, limit) {
  if (!response.body) throw invalid();
  const reader = response.body.getReader();
  const parts = [];
  let size = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw invalid();
      parts.push(Buffer.from(value));
    }
    return Buffer.concat(parts);
  } finally {
    await reader.cancel().catch(() => {
    });
  }
}
async function webPlayback(episodeId, fetcher = fetch) {
  if (!/^[1-9]\d{7,23}$/.test(episodeId)) throw invalid();
  try {
    const response = await fetcher("https://hongguoduanju.com/api/video/protected/fallback-play-info", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(2e4),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ item_id: episodeId })
    });
    if (!response.ok) {
      __hgDbg("webFallback ep=" + episodeId + " http=" + response.status);
      await response.body?.cancel().catch(() => {
      });
      if (response.status === 403) throw new AppError("WEB_PUBLIC_UNAVAILABLE", "\u5B98\u7F51\u6682\u672A\u5411\u5F53\u524D\u8BBF\u5BA2\u63D0\u4F9B\u6B64\u96C6\u64AD\u653E\u8D44\u6E90\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u4F7F\u7528\u5B98\u65B9 APP \u67E5\u770B\u3002");
      throw invalid();
    }
    const info = safeJson((await bounded(response, 64 * 1024)).toString("utf8"));
    __hgDbg("webFallback ep=" + episodeId + " status=200 main_url OK");
    if (info?.base_resp?.StatusCode !== 0 || typeof info.main_url !== "string" || !Number.isFinite(Number(info.url_expire)) || Number(info.url_expire) <= Date.now() / 1e3 + 10) throw invalid();
    const url = new URL(info.main_url);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !/^v\d+-(hgweb|reading)\.qznovelvod\.com$/.test(url.hostname)) throw invalid();
    const media = await fetcher(url.href, { redirect: "error", signal: AbortSignal.timeout(25e3), headers: { Range: "bytes=0-1048575" } });
    try {
      let size, expected;
      if (media.status === 206) {
        const match = /^bytes 0-(\d+)\/(\d+)$/.exec(media.headers.get("content-range") || "");
        if (!match) throw invalid();
        size = Number(match[2]);
        expected = Number(match[1]) + 1;
        if (expected !== Math.min(size, LIMIT)) throw invalid();
      } else if (media.status === 200) {
        size = Number(media.headers.get("content-length"));
        expected = size;
        if (size > LIMIT) throw invalid();
      } else throw invalid();
      if (!Number.isSafeInteger(size) || size <= 0 || size > FILE_LIMIT2) throw invalid();
      const prefix = await bounded(media, LIMIT);
      if (prefix.length !== expected) throw invalid();
      const metadata = inspectMp4(prefix);
      return { episodeId, ...metadata, size, url: url.href, encrypted: false, availableQualities: [metadata.definition] };
    } finally {
      await media.body?.cancel().catch(() => {
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw invalid();
  }
}

// src/main/provider.ts
var import_node_crypto9 = require("node:crypto");
var ID = /^[1-9]\d{7,23}$/;
var BOARDS = {
  recommend: { id: "comic_series_hot_rank", label: "\u63A8\u8350\u699C" },
  hot: { id: "comic_series_hot_play", label: "\u70ED\u64AD\u699C" },
  new: { id: "comic_series_new_rank", label: "\u65B0\u5267\u699C" }
};
var SHARE_HOSTS = /* @__PURE__ */ new Set(["kylin.hainanyuyue.com", "hainanyuyue.com"]);
var WEB_ORIGIN = "https://hongguoduanju.com";
var QUALITY_ORDER = ["1080p", "720p", "540p", "480p", "360p"];
var SUPPORTED_CODECS = /* @__PURE__ */ new Set(["bytevc1", "bytevc2", "h264", "h265", "avc1", "hvc1", "hevc", "h265_hvc1", "av1"]);
var ProviderError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
};
function fail(code, message) {
  throw new ProviderError(code, message);
}
function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function identifier(value, kind) {
  if (typeof value !== "string" || !ID.test(value)) fail(`INVALID_${kind}_ID`, "\u4F5C\u54C1\u6216\u5206\u96C6\u7F16\u53F7\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u53D6\u5F97\u539F\u59CB\u94FE\u63A5\u3002");
  return value;
}
function offsetValue(offset) {
  if (!Number.isSafeInteger(offset) || offset < 0) fail("INVALID_OFFSET", "\u5206\u9875\u4F4D\u7F6E\u65E0\u6548\u3002");
  return offset;
}
function count(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}
function text(value) {
  return typeof value === "string" ? value : "";
}
function routerData(html) {
  const block = html.match(/(?:window\.)?_ROUTER_DATA\s*=\s*([\s\S]*?)<\/script>/);
  if (!block) fail("PAGE_DATA_MISSING", "\u7F51\u9875\u6CA1\u6709\u53EF\u6838\u5BF9\u7684\u4F5C\u54C1\u6570\u636E\u3002");
  const source = block[1].trim();
  if (source[0] !== "{") fail("INVALID_PAGE_DATA", "\u7F51\u9875\u6570\u636E\u4E0D\u662F\u5408\u6CD5 JSON\u3002");
  let depth = 0, inString = false, escaped = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") {
      if (--depth === 0) {
        try {
          return safeJson(source.slice(0, index + 1));
        } catch {
          fail("INVALID_PAGE_DATA", "\u7F51\u9875\u6570\u636E\u4E0D\u662F\u5408\u6CD5 JSON\u3002");
        }
      }
    }
  }
  fail("INVALID_PAGE_DATA", "\u7F51\u9875\u4F5C\u54C1\u6570\u636E\u4E0D\u5B8C\u6574\u3002");
}
function work(value, knownId) {
  const id = identifier(knownId ?? value.series_id, "SERIES");
  const title = text(value.series_title || value.series_name || value.title);
  if (!title.trim()) fail("INVALID_WORK", "\u63A5\u53E3\u8FD4\u56DE\u7684\u4F5C\u54C1\u7F3A\u5C11\u6807\u9898\u3002");
  const categories2 = Array.isArray(value.category_list) ? value.category_list.filter((item) => typeof item === "string") : void 0;
  return {
    id,
    title,
    cover: text(value.series_cover || value.cover),
    description: text(value.series_intro || value.video_desc || value.description),
    total: count(value.episode_cnt ?? value.serial_count),
    ...categories2?.length ? { categories: categories2 } : {}
  };
}
function selectedItems(selector) {
  const items = [];
  function visit(value, depth = 0) {
    if (depth > 16 || !value || typeof value !== "object") return;
    if (record(value) && (value.is_selected === true || value.is_selected === 1)) items.push(value);
    for (const child2 of Object.values(value)) visit(child2, depth + 1);
  }
  visit(selector);
  return items;
}
var ContentProvider = class {
  transport;
  fetcher;
  searchPage;
  constructor(transport, options = {}) {
    this.transport = transport;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.searchPage = options.searchPage;
  }
  async api(path6, body, extra) {
    let response;
    try {
      response = await this.transport.request(path6, body, extra);
    } catch (error) {
      if (error instanceof Error && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]{1,50}$/.test(error.code)) throw error;
      fail("NETWORK_ERROR", "\u5185\u5BB9\u63A5\u53E3\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    }
    if (!record(response)) fail("EMPTY_RESPONSE", "\u5185\u5BB9\u63A5\u53E3\u672A\u8FD4\u56DE\u6709\u6548\u6570\u636E\u3002");
    const code = response.code ?? response.BaseResp?.StatusCode ?? response.base_resp?.StatusCode;
    if (code == null) fail("INVALID_RESPONSE", "\u5185\u5BB9\u63A5\u53E3\u7F3A\u5C11\u72B6\u6001\u7801\u3002");
    if (Number(code) !== 0) {
      const suffix = /^[A-Za-z0-9_-]{1,30}$/.test(String(code)) ? String(code) : "ERROR";
      fail(`API_${suffix}`, `\u5185\u5BB9\u63A5\u53E3\u8FD4\u56DE\u9519\u8BEF\uFF08${suffix}\uFF09\u3002`);
    }
    if (!record(response.data)) fail("EMPTY_RESPONSE", "\u5185\u5BB9\u63A5\u53E3\u672A\u8FD4\u56DE\u4F5C\u54C1\u6570\u636E\u3002");
    return response.data;
  }
  async catalog(board, offset = 0) {
    if (!Object.hasOwn(BOARDS, board)) fail("INVALID_BOARD", "\u699C\u5355\u7C7B\u578B\u65E0\u6548\u3002");
    offsetValue(offset);
    const requested = BOARDS[board];
    const data = await this.api("/reading/bookapi/bookmall/cell/change/v", void 0, {
      cell_id: "7470092475068071998",
      tab_type: 26,
      client_req_type: 2,
      client_template: 2,
      screen_width_px: 1350,
      selected_items: "comic_series_rank",
      sub_selected_items: requested.id,
      session_id: (0, import_node_crypto9.randomUUID)(),
      offset
    });
    const cell = data.cell_view;
    if (!record(cell) || !Array.isArray(cell.cell_data)) fail("INVALID_CATALOG", "\u699C\u5355\u6570\u636E\u7ED3\u6784\u65E0\u6548\u3002");
    const selected = selectedItems(cell.cell_selector);
    const match = selected.find((item) => (item.selector_item_id ?? item.id) === requested.id);
    const outer = selected.find((item) => (item.selector_item_id ?? item.id) === "comic_series_rank");
    if (!match || text(match.show_name) !== requested.label || outer && text(outer.show_name) !== "\u6F2B\u5267") {
      fail("BOARD_MISMATCH", "\u63A5\u53E3\u8FD4\u56DE\u7684\u699C\u5355\u4E0E\u8BF7\u6C42\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    }
    const items = [];
    for (const entry of cell.cell_data) {
      const videos = Array.isArray(entry?.video_data) ? entry.video_data : [entry?.video_data];
      for (const video of videos) if (record(video)) items.push(work(video));
    }
    const hasMore = (data.has_more ?? cell.has_more) === true;
    const rawOffset = data.next_offset ?? cell.next_offset;
    const nextOffset = rawOffset == null ? offset + items.length : count(rawOffset);
    if (hasMore && (nextOffset <= offset || items.length === 0)) fail("INVALID_PAGINATION", "\u699C\u5355\u8FD4\u56DE\u7684\u5206\u9875\u4F4D\u7F6E\u65E0\u6548\u3002");
    return {
      items: [...new Map(items.map((item) => [item.id, item])).values()],
      hasMore,
      nextOffset,
      label: requested.label,
      source: "\u539F\u751F\u6F2B\u5267\u699C\u5355"
    };
  }
  validatePageUrl(url, share) {
    if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443" || (share ? !SHARE_HOSTS.has(url.hostname) : url.origin !== WEB_ORIGIN)) {
      fail(share ? "UNSAFE_SHARE_URL" : "UNSAFE_WEB_URL", "\u94FE\u63A5\u4E0D\u662F\u53D7\u652F\u6301\u7684\u5B98\u65B9\u5185\u5BB9\u9875\u9762\u3002");
    }
  }
  async page(url, share, accept = "text/html") {
    const visited = /* @__PURE__ */ new Set();
    for (let hop = 0; hop < 6; hop++) {
      this.validatePageUrl(url, share);
      if (visited.has(url.href)) fail("REDIRECT_LOOP", "\u5206\u4EAB\u94FE\u63A5\u53D1\u751F\u5FAA\u73AF\u8DF3\u8F6C\u3002");
      visited.add(url.href);
      let response;
      try {
        response = await this.fetcher(url.href, { redirect: "manual", signal: AbortSignal.timeout(2e4), headers: { Accept: accept } });
      } catch {
        fail("NETWORK_ERROR", "\u7F51\u9875\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
      }
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        try {
          response = await this.fetcher(url.href, { redirect: "manual", signal: AbortSignal.timeout(2e4), headers: { Accept: accept } });
        } catch {
          fail("NETWORK_ERROR", "\u7F51\u9875\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
        }
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) fail("INVALID_REDIRECT", "\u5206\u4EAB\u94FE\u63A5\u8DF3\u8F6C\u7F3A\u5C11\u76EE\u6807\u5730\u5740\u3002");
        try {
          url = new URL(location, url);
        } catch {
          fail("INVALID_REDIRECT", "\u5206\u4EAB\u94FE\u63A5\u8DF3\u8F6C\u5730\u5740\u65E0\u6548\u3002");
        }
        continue;
      }
      if (!response.ok) fail(`HTTP_${response.status}`, `\u7F51\u9875\u52A0\u8F7D\u5931\u8D25\uFF08HTTP ${response.status}\uFF09\u3002`);
      const limit = 8 * 1024 * 1024;
      if (Number(response.headers.get("content-length")) > limit) {
        await response.body?.cancel();
        fail("PAGE_TOO_LARGE", "\u7F51\u9875\u5185\u5BB9\u8FC7\u5927\u3002");
      }
      const reader = response.body?.getReader();
      if (!reader) fail("EMPTY_RESPONSE", "\u7F51\u9875\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9\u3002");
      const chunks = [];
      let bytes = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > limit) {
            await reader.cancel();
            fail("PAGE_TOO_LARGE", "\u7F51\u9875\u5185\u5BB9\u8FC7\u5927\u3002");
          }
          chunks.push(part.value);
        }
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        fail("NETWORK_ERROR", "\u7F51\u9875\u5185\u5BB9\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
      } finally {
        reader.releaseLock();
      }
      return Buffer.concat(chunks).toString("utf8");
    }
    fail("TOO_MANY_REDIRECTS", "\u5206\u4EAB\u94FE\u63A5\u8DF3\u8F6C\u6B21\u6570\u8FC7\u591A\u3002");
  }
  async search(query, offset = 0) {
    if (typeof query !== "string" || !query.trim() || Array.from(query.trim()).length > 30) fail("INVALID_QUERY", "\u8BF7\u8F93\u5165\u4E0D\u8D85\u8FC7 30 \u5B57\u7684\u641C\u7D22\u5173\u952E\u8BCD\u3002");
    offsetValue(offset);
    if (offset % 10 !== 0 || offset > 2147483647) fail("INVALID_OFFSET", "\u641C\u7D22\u5206\u9875\u4F4D\u7F6E\u65E0\u6548\u3002");
    const label = `\u641C\u7D22\uFF1A${query.trim()}`;
    const pageNum = offset / 10 + 1, url = new URL("/api/search/result", WEB_ORIGIN);
    url.searchParams.set("query", query.trim());
    if (pageNum > 1) url.searchParams.set("page", String(pageNum));
    let model;
    const source = await (this.searchPage ? this.searchPage(url) : this.page(url, false, "application/json"));
    try {
      model = safeJson(source);
    } catch {
      fail("INVALID_SEARCH_DATA", "\u641C\u7D22\u6765\u6E90\u8FD4\u56DE\u7684\u6570\u636E\u683C\u5F0F\u65E0\u6548\u3002");
    }
    if (!record(model) || !Array.isArray(model.searchList) || model.code != null || model.isSuccess === false) fail("INVALID_SEARCH_DATA", "\u641C\u7D22\u6765\u6E90\u6CA1\u6709\u8FD4\u56DE\u6709\u6548\u4F5C\u54C1\u5217\u8868\u3002");
    if (model.pageNum !== pageNum || !Number.isSafeInteger(model.totalPages) || model.totalPages < 0 || typeof model.hasMore !== "boolean" || model.hasMore !== pageNum < model.totalPages || model.totalPages === 0 && (pageNum !== 1 || model.searchList.length !== 0) || model.totalPages > 0 && pageNum > model.totalPages) fail("INVALID_PAGINATION", "\u641C\u7D22\u6765\u6E90\u8FD4\u56DE\u7684\u5206\u9875\u4FE1\u606F\u65E0\u6548\u3002");
    const items = [];
    for (const entry of model.searchList) {
      if (!record(entry)) continue;
      if (!record(entry.video_data)) continue;
      const video = entry.video_data;
      const candidate = video.series_id ?? entry.keyword;
      if (candidate == null || typeof candidate === "string" && !ID.test(candidate)) continue;
      items.push(work({ ...video, series_id: candidate, series_title: entry.name || video.series_title || video.series_name }));
    }
    const unique = [...new Map(items.map((item) => [item.id, item])).values()];
    return { items: unique, hasMore: model.hasMore, nextOffset: offset + 10, label, source: "\u5B98\u65B9\u7F51\u9875\u641C\u7D22\u63A5\u53E3" };
  }
  async resolveShare(input) {
    if (typeof input !== "string" || input.length > 16384) fail("INVALID_SHARE", "\u5206\u4EAB\u5185\u5BB9\u65E0\u6548\u3002");
    const candidate = input.match(/https?:\/\/[^\s<>"'\u3000-\u303f\uff00-\uffef]+/i)?.[0]?.replace(/[),.;!?]+$/, "");
    if (!candidate) fail("INVALID_SHARE", "\u5206\u4EAB\u5185\u5BB9\u4E2D\u6CA1\u6709\u6709\u6548\u94FE\u63A5\u3002");
    let url;
    try {
      url = new URL(candidate);
    } catch {
      fail("INVALID_SHARE", "\u5206\u4EAB\u94FE\u63A5\u683C\u5F0F\u65E0\u6548\u3002");
    }
    let router;
    try {
      router = routerData(await this.page(url, true));
    } catch (error) {
      if (!(error instanceof ProviderError) || error.code !== "PAGE_DATA_MISSING") throw error;
      router = routerData(await this.page(url, true));
    }
    const model = router.loaderData?.["video-animation-share_page"];
    const data = model?.pageData;
    if (!record(data?.series_data) || !Array.isArray(data.chapter_ids) || !data.chapter_ids.length) fail("INVALID_SHARE_DATA", "\u5206\u4EAB\u9875\u9762\u6CA1\u6709\u5B8C\u6574\u7684\u4F5C\u54C1\u4FE1\u606F\u3002");
    const id = identifier(model.linkParams?.schemeParams?.video_id || model.params?.series_id, "SERIES");
    const ids = data.chapter_ids.map((value) => identifier(value, "EPISODE"));
    const series = await this.getSeries(id);
    if (series.title !== text(data.series_data.title) || series.episodes.length !== ids.length || series.episodes.some((episode, index) => episode.id !== ids[index]) || data.series_data.serial_count != null && series.total !== count(data.series_data.serial_count)) {
      fail("SHARE_MISMATCH", "\u5206\u4EAB\u9875\u9762\u4E0E\u5185\u5BB9\u63A5\u53E3\u7684\u6807\u9898\u6216\u5206\u96C6\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u5BFC\u5165\u3002");
    }
    return series;
  }
  async getSeries(id) {
    identifier(id, "SERIES");
    const data = await this.api("/novel/player/multi_video_detail/v1/", { series_id: id, biz_param: {
      detail_page_version: 0,
      disable_digg_stat: false,
      disable_video_relate_book: false,
      need_all_video_definition: false,
      need_mp4_align: false,
      screen_width_px: "900",
      source: 7,
      use_os_player: false,
      use_server_dns: false
    } });
    const video = data[id]?.video_data;
    if (!record(video) || !Array.isArray(video.video_list) || !video.video_list.length) fail("SERIES_NOT_FOUND", "\u63A5\u53E3\u6CA1\u6709\u8FD4\u56DE\u6B64\u4F5C\u54C1\u7684\u5206\u96C6\u3002");
    const base = work(video, id);
    const episodes = video.video_list.map((entry) => {
      if (!record(entry)) fail("INVALID_EPISODE", "\u5206\u96C6\u6570\u636E\u7ED3\u6784\u65E0\u6548\u3002");
      const episodeId = identifier(entry.vid, "EPISODE");
      if (!Number.isInteger(entry.vid_index) || entry.vid_index < 1) fail("INVALID_EPISODE_ORDER", "\u5206\u96C6\u987A\u5E8F\u65E0\u6548\u3002");
      const duration = Number(entry.duration);
      return {
        id: episodeId,
        order: entry.vid_index,
        ...Number.isFinite(duration) && duration > 0 ? { duration } : {},
        ...text(entry.title) ? { title: text(entry.title) } : {}
      };
    }).sort((left, right) => left.order - right.order);
    if (new Set(episodes.map((episode) => episode.id)).size !== episodes.length || episodes.some((episode, index) => episode.order !== index + 1) || base.total !== episodes.length) {
      fail("INCOMPLETE_SERIES", "\u63A5\u53E3\u8FD4\u56DE\u7684\u5206\u96C6\u4E0D\u5B8C\u6574\u6216\u987A\u5E8F\u5F02\u5E38\u3002");
    }
    return { ...base, episodes };
  }
  // Internal main-process API. Never forward this object to the renderer or persist it in history.
  async getResource(episodeId, quality = "auto") {
    identifier(episodeId, "EPISODE");
    if (quality !== "auto" && !QUALITY_ORDER.includes(quality)) fail("INVALID_QUALITY", "\u753B\u8D28\u9009\u9879\u65E0\u6548\u3002");
    let data;
    try {
      data = await this.api("/novel/player/video_model/v1/", {
        video_id: episodeId,
        content_type: 1,
        biz_param: { need_all_video_definition: true, video_platform: 3 }
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "API_EMPTY") { __hgDbg("api EMPTY ep=" + episodeId + " -> webFallback"); return webPlayback(episodeId, this.fetcher); }
      __hgDbg("getResource ep=" + episodeId + " error code=" + (error && error.code) + " msg=" + (error && error.message));
      throw error;
    }
    let model = data.video_model;
    if (typeof model === "string") {
      try {
        model = safeJson(model);
      } catch {
        fail("INVALID_RESOURCE_MODEL", "\u64AD\u653E\u8D44\u6E90\u6A21\u578B\u65E0\u6548\u3002");
      }
    }
    if (!record(model) || !Array.isArray(model.video_list) && !record(model.video_list)) fail("INVALID_RESOURCE_MODEL", "\u64AD\u653E\u8D44\u6E90\u6A21\u578B\u65E0\u6548\u3002");
    if (model.status != null && Number(model.status) !== 0 && Number(model.status) !== 10) fail("RESOURCE_UNAVAILABLE", "\u6B64\u5206\u96C6\u7684\u64AD\u653E\u8D44\u6E90\u6682\u4E0D\u53EF\u7528\u3002");
    const available = Object.values(model.video_list).filter(record).map((track2) => record(track2.video_meta) ? {
      main_url: track2.main_url,
      codec_type: track2.video_meta.codec_type,
      definition: track2.video_meta.definition,
      size: track2.video_meta.size,
      encrypt: track2.encrypt_info ? typeof track2.encrypt_info.encrypt === "boolean" ? track2.encrypt_info.encrypt : !!track2.encrypt_info.spade_a : false,
      encryption_method: track2.encrypt_info?.encryption_method,
      spade_a: track2.encrypt_info?.spade_a
    } : track2);
    if (!available.length) fail("RESOURCE_UNAVAILABLE", "\u6B64\u5206\u96C6\u6CA1\u6709\u53EF\u64AD\u653E\u7684\u89C6\u9891\u8F68\u9053\u3002");
    const compatible = available.filter((track2) => SUPPORTED_CODECS.has(text(track2.codec_type)));
    const nonVvc = compatible.filter((track2) => text(track2.codec_type) !== "bytevc2");
    const tracks = (nonVvc.length ? nonVvc : compatible).sort((left, right) => {
      const rank = (definition) => {
        const index = QUALITY_ORDER.indexOf(text(definition));
        return index < 0 ? 99 : index;
      };
      return rank(left.definition) - rank(right.definition);
    });
    if (!tracks.length) fail("UNSUPPORTED_CODEC", "\u6B64\u5206\u96C6\u6CA1\u6709\u5F53\u524D\u64AD\u653E\u5668\u652F\u6301\u7684\u89C6\u9891\u7F16\u7801\u3002");
    if (tracks.every((track2) => text(track2.codec_type) === "bytevc2")) fail("UNSUPPORTED_CODEC", "\u6B64\u5206\u96C6\u4EC5\u63D0\u4F9B VVC\uFF08bytevc2\uFF09\u7F16\u7801\uFF0C\u5F53\u524D\u64AD\u653E\u5668\u6682\u4E0D\u652F\u6301\u3002");
    const availableQualities = [...new Set(tracks.map((track2) => text(track2.definition)).filter((value) => QUALITY_ORDER.includes(value)))];
    const ceiling = quality === "auto" ? 0 : QUALITY_ORDER.indexOf(quality);
    const track = quality === "auto" ? tracks[0] : tracks.find((track2) => QUALITY_ORDER.indexOf(text(track2.definition)) >= ceiling && QUALITY_ORDER.includes(text(track2.definition))) ?? tracks.at(-1);
    if (typeof track.encrypt !== "boolean") fail("UNKNOWN_ENCRYPTION", "\u8D44\u6E90\u7F3A\u5C11\u660E\u786E\u7684\u52A0\u5BC6\u6807\u8BB0\u3002");
    if (track.encrypt && track.encryption_method !== "cenc-aes-ctr") fail("UNSUPPORTED_ENCRYPTION", "\u6682\u4E0D\u652F\u6301\u6B64\u8D44\u6E90\u7684\u52A0\u5BC6\u683C\u5F0F\u3002");
    if (track.encrypt && !text(track.spade_a)) fail("MISSING_MEDIA_KEY", "\u64AD\u653E\u8D44\u6E90\u7F3A\u5C11\u5FC5\u8981\u7684\u5A92\u4F53\u53C2\u6570\u3002");
    let url;
    try {
      url = new URL(/^https?:\/\//.test(text(track.main_url)) ? track.main_url : Buffer.from(text(track.main_url), "base64").toString("utf8"));
    } catch {
      fail("INVALID_MEDIA_URL", "\u64AD\u653E\u8D44\u6E90\u5730\u5740\u65E0\u6548\u3002");
    }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) fail("INVALID_MEDIA_URL", "\u64AD\u653E\u8D44\u6E90\u5730\u5740\u65E0\u6548\u3002");
    const duration = Number(model.video_duration), size = Number(track.size);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isSafeInteger(size) || size <= 0 || !text(track.definition) || !text(track.codec_type)) {
      fail("INVALID_RESOURCE_MODEL", "\u64AD\u653E\u8D44\u6E90\u7F3A\u5C11\u5B8C\u6574\u65F6\u957F\u6216\u6587\u4EF6\u4FE1\u606F\u3002");
    }
    return {
      episodeId,
      duration,
      definition: track.definition,
      codec: track.codec_type,
      encrypted: track.encrypt,
      availableQualities,
      ...track.encrypt ? { spade: track.spade_a } : {},
      url: url.href,
      size
    };
  }
};

// src/main/tray-icon.ts
var trayIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEFUlEQVR4nMVXfWxTVRT/vde3V9YVxnAdc0jcFqRuDDcEJA5jIiBRg9Ggxhh1xqh/TDF8/LFEonEm6sAIRhHZiCECIYuL0xqTTQwifmQi82PC6DoZlO6DsXZzbHtru9e1z9xb+/rea/vI6lp/yW3fOefee37nfpx7L4M4+GV9mYQUYM23nYxWx6TDsR4RNt3Otb7YdDvXkmDxP4PVRm8wZcG6qwE5d61PuXPim1M7N8O6uwHmktuQvfJO9B/6AFcaPw7bzHOx0taWlKPeA+/gavPRuDZOKUjBAAKjI2GBYXDTc1vBLyzA5fffVDUKiVPwXrDrOuXzbgRvyb8uOU7V8dQUemq3oXDba7A88CjV5W16DBnzc+Dc87pcLzDshn1rlW7Hi6pexKKq6pkRIJBCITj3voGgz4f8R56muvGOM5Ck6FIxFizGHSfOYTbA6c0bQiGIw24M2RrpGoggOCnAc9ym2zFZR6QkTYCgt+FdxIMhy4z8zU9hNsBpFebScty85RW4PqyDYP8zaggGIZz/Iykn4vBQQhujzAPmZStgrTtAcwFZC4OfHsLA4f2QpqeRKnBKIeQVEBhxw2AqAsOyKHjieWSvWANP6+co3B7dBcnAubcWnpbmGD2rFLzOC+isfhwj37XKOsHRiemJ8WglSaKjQ4qs0siQ/pUVOycRWK0i5Pfh4ls1dOjdXzXBtb9OZR/9+RTaN5bDsePZsK+ASGVSIkmse+dLVB452ZL8Lhg4Wo90gJtpg5zKe1RJiMngY5ISWcj/mUBZfRMmexwY+7UNhjmZ6jlOBgnaM/EuI7xlISoaT8hy985qjJ35CakAF0+ZZS2LCpKEya6zNK2W7juWlBP7y09C6Dob18bGU5JsGIG//7J6G6ZjBMwKAhPnw+nY1+fEX69uoXcEU9EtVOdp+QyjbadUbXPWroPl/s2y7O930SASgdUqyKrOWrpMlgV7B/0PChO4dvp7DDUfkW03bHgQwcmwnhSSQ3I3bJLtoucqHDUv6I4gGxN9yXKwvFFBQHEgkai/tsk5gtSz7j6I3I0PwXLfw7DuqqcBRLJq1/ZnILoHMaMpmFe+WnXu+3svgTUaacfEoSHThGttJ2EqXkqHm+iKa9RXtqkrfXDtexuMIQMZC3LpFU4SRYQCYkx6ZsiPciuWvHcYc5ffTr9JDvj7h29QtKNWNwpClOE4sMY5uvX6Du7BYNMnqhcSp600ZDsG76VumEsrMHHud3hav6CXj8zCJdFKkgSf6yLGO9ox1v4jxn47DZbnseDuezG/ch3mVaymN2wlyJnhOf5lDCkm8qH3OspeVYnsVWvhH+iljr09DgS9QsJIGYOBEjYtuRWZi4vB5+XT3TBw5CNV9CoC1yMxm1A+TmOey6kkEu95/g+P36nAU2VjoAAAAABJRU5ErkJggg==";

// src/main/recommendations.ts
var TTL = 3e5;
var CACHE_LIMIT2 = 32;
var CANDIDATE_LIMIT = 120;
var TOPICS = ["\u672B\u4E16", "\u91CD\u751F", "\u7A7F\u8D8A", "\u4FEE\u4ED9", "\u7384\u5E7B", "\u90FD\u5E02", "\u60AC\u7591", "\u79D1\u5E7B", "\u604B\u7231", "\u751C\u5BA0", "\u53E4\u88C5", "\u6B66\u4FA0", "\u7CFB\u7EDF", "\u590D\u4EC7", "\u6821\u56ED", "\u804C\u573A", "\u7075\u5F02", "\u641E\u7B11", "\u5192\u9669", "\u5386\u53F2", "\u5F02\u80FD", "\u673A\u7532", "\u4E27\u5C38", "\u63A2\u6848"];
var normalize = (value) => value.normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
var GENERIC_CATEGORIES = /* @__PURE__ */ new Set(["\u6F2B\u5267", "\u77ED\u5267", "ai\u6F2B\u5267", "ai\u77ED\u5267", "\u5168\u90E8", "\u5176\u4ED6", "\u5176\u5B83", "\u7537\u9891", "\u5973\u9891", "\u63A8\u8350", "\u70ED\u95E8", "\u70ED\u64AD", "\u7CBE\u9009", "\u52A8\u6F2B", "\u52A8\u753B"]);
function numeral(text2) {
  if (/^\d+$/.test(text2)) return Number(text2);
  const digits = { "\u96F6": 0, "\u3007": 0, "\u4E00": 1, "\u4E8C": 2, "\u4E24": 2, "\u4E09": 3, "\u56DB": 4, "\u4E94": 5, "\u516D": 6, "\u4E03": 7, "\u516B": 8, "\u4E5D": 9 };
  let result = 0, pending = 0;
  for (const char of text2) {
    if (char in digits) pending = digits[char];
    else {
      result += (pending || 1) * (char === "\u5341" ? 10 : 100);
      pending = 0;
    }
  }
  return result + pending;
}
function titleParts(title) {
  const clean = title.normalize("NFKC").trim().replace(/[\s\p{P}\p{S}]+$/gu, "");
  const match = clean.match(/^(.*?)第\s*([0-9零〇一二两三四五六七八九十百]+)\s*[季部]$/u);
  if (!match) return { base: normalize(clean) };
  const season = numeral(match[2]);
  return { base: normalize(match[1]), ...season > 0 && Number.isSafeInteger(season) ? { season } : {} };
}
function topics(work2) {
  const text2 = (work2.title + " " + work2.description).slice(0, 6e3);
  return TOPICS.filter((tag) => text2.includes(tag));
}
function categories(work2) {
  return [...new Set((work2.categories ?? []).filter((x) => typeof x === "string").slice(0, 20).map(normalize).filter((x) => !!x && !GENERIC_CATEGORIES.has(x)))];
}
var RecommendationService = class {
  constructor(source) {
    this.source = source;
  }
  source;
  cache = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Map();
  async get(id, refresh = false) {
    if (!validId(id) || typeof refresh !== "boolean") throw new AppError("INVALID_INPUT", "\u4F5C\u54C1\u7F16\u53F7\u6216\u5237\u65B0\u8BF7\u6C42\u65E0\u6548");
    if (refresh) this.cache.delete(id);
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) return structuredClone(cached.result);
    this.cache.delete(id);
    const existing = this.pending.get(id);
    if (existing) return structuredClone(await existing);
    if (this.pending.size >= CACHE_LIMIT2) throw new AppError("RECOMMENDATIONS_BUSY", "\u63A8\u8350\u67E5\u8BE2\u8F83\u591A\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    const task = this.load(id);
    this.pending.set(id, task);
    try {
      return structuredClone(await task);
    } finally {
      this.pending.delete(id);
    }
  }
  async load(id) {
    const current = await this.source.getSeries(id);
    const own = titleParts(current.title), ownTopics = topics(current), ownCategories = categories(current);
    const candidates = /* @__PURE__ */ new Map();
    let failures = 0, successes = 0;
    const add = (items) => {
      for (const work2 of items.slice(0, 40)) if (candidates.size < CANDIDATE_LIMIT && validId(work2.id) && work2.id !== id && typeof work2.title === "string" && work2.title.trim() && !candidates.has(work2.id)) candidates.set(work2.id, work2);
    };
    const fetchPage = async (query, offset = 0) => {
      try {
        const page = query === void 0 ? await this.source.catalog("recommend") : await this.source.search(query, offset);
        successes++;
        add(page.items);
        return page;
      } catch {
        failures++;
        return void 0;
      }
    };
    const baseQuery = own.base.slice(0, 30);
    if (baseQuery) {
      for (let page = 0; page < 3; page++) {
        const result2 = await fetchPage(baseQuery, page * 10);
        if (!result2?.hasMore) break;
      }
    }
    const queries = [.../* @__PURE__ */ new Set([...ownTopics, ...ownCategories])].filter((x) => x !== baseQuery).slice(0, 2);
    for (const query of queries) await fetchPage(query.slice(0, 30));
    await fetchPage();
    if (!successes) throw new AppError("RECOMMENDATIONS_UNAVAILABLE", "\u63A8\u8350\u6765\u6E90\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    const seasons = [], similar = [];
    for (const work2 of candidates.values()) {
      const parsed = titleParts(work2.title);
      if (own.base && parsed.base === own.base && parsed.season !== void 0) {
        if (parsed.season !== own.season) seasons.push({ work: work2, reason: `\u540C\u540D\u7B2C${parsed.season}\u5B63`, season: parsed.season });
        continue;
      }
      const sharedCategories = categories(work2).filter((x) => ownCategories.includes(x));
      const sharedTopics = topics(work2).filter((x) => ownTopics.includes(x));
      if (!sharedCategories.length && !sharedTopics.length) continue;
      const sharedWords = normalize(work2.title + " " + work2.description).includes(own.base) && own.base.length >= 2 ? 1 : 0;
      similar.push({ work: work2, reason: sharedCategories.length ? `\u5171\u540C\u5206\u7C7B\uFF1A${sharedCategories.join("\u3001")}` : `\u542B\u201C${sharedTopics.join("\u3001")}\u201D\u9898\u6750\u5173\u952E\u8BCD`, score: sharedCategories.length * 4 + sharedTopics.length * 2 + sharedWords });
    }
    const pivot = own.season ?? 1;
    seasons.sort((a, b) => Number(a.season <= pivot) - Number(b.season <= pivot) || a.season - b.season || a.work.id.localeCompare(b.work.id));
    similar.sort((a, b) => b.score - a.score || a.work.id.localeCompare(b.work.id));
    const result = { seasons: seasons.slice(0, 8).map(({ work: work2, reason }) => ({ work: work2, reason })), similar: similar.slice(0, 12).map(({ work: work2, reason }) => ({ work: work2, reason })), message: failures ? "\u90E8\u5206\u63A8\u8350\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u5C55\u793A\u53EF\u6838\u5BF9\u7684\u7ED3\u679C\u3002" : seasons.length || similar.length ? "\u540C\u540D\u5B63\u6570\u4F9D\u636E\u6807\u9898\u5339\u914D\uFF1B\u76F8\u4F3C\u4F5C\u54C1\u4F9D\u636E\u5206\u7C7B\u6216\u9898\u6750\u5173\u952E\u8BCD\u7B5B\u9009\u3002" : "\u6682\u672A\u627E\u5230\u53EF\u6838\u5BF9\u7684\u540C\u540D\u5B63\u6570\u6216\u76F8\u4F3C\u9898\u6750\u4F5C\u54C1\u3002" };
    if (!failures) {
      for (const [key, value] of this.cache) if (value.expires <= Date.now()) this.cache.delete(key);
      while (this.cache.size >= CACHE_LIMIT2) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(id, { expires: Date.now() + TTL, result });
    }
    return result;
  }
};

// src/main/diagnostics.ts
var STAGES = /* @__PURE__ */ new Set(["resolve", "download", "waiting", "processing", "save", "playback", "ipc"]);
var Diagnostics = class {
  events = [];
  record(value) {
    const data = value;
    if (!data || !STAGES.has(String(data.stage))) return;
    const code = typeof data.code === "string" && /^[A-Z0-9_]{1,50}$/.test(data.code) ? data.code : "UNKNOWN";
    this.events.push({ at: (/* @__PURE__ */ new Date()).toISOString(), stage: String(data.stage), code, ...typeof data.ms === "number" && Number.isFinite(data.ms) && data.ms >= 0 ? { ms: Math.round(data.ms) } : {} });
    if (this.events.length > 200) this.events.shift();
  }
  snapshot(version) {
    return { schema: 1, version: /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version) ? version : "unknown", platform: process.platform, arch: process.arch, events: structuredClone(this.events) };
  }
};

// src/main/main.ts
var import_promises7 = require("node:fs/promises");
var import_electron_updater = __toESM(require_main2(), 1);

// src/main/updater.ts
var UpdateService = class {
  constructor(engine, version, enabled, changed, shutdown) {
    this.engine = engine;
    this.enabled = enabled;
    this.changed = changed;
    this.shutdown = shutdown;
    this.state = { status: enabled ? "idle" : "unsupported", currentVersion: version, message: enabled ? "\u542F\u52A8\u540E\u4F1A\u81EA\u52A8\u68C0\u67E5\u66F4\u65B0\u3002" : "\u5F00\u53D1\u6A21\u5F0F\u4E0D\u6267\u884C\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u5DF2\u5B89\u88C5\u7684 Windows \u7248\u672C\u3002" };
    engine.autoDownload = false;
    engine.autoInstallOnAppQuit = false;
    engine.allowPrerelease = false;
    engine.allowDowngrade = false;
    engine.disableDifferentialDownload = true;
    engine.on("update-available", (info) => {
      this.set({ status: "available", nextVersion: info.version, message: `\u53D1\u73B0\u65B0\u7248\u672C ${info.version}\uFF0C\u70B9\u51FB\u201C\u7ACB\u5373\u66F4\u65B0\u201D\u5F00\u59CB\u4E0B\u8F7D\uFF1B\u6682\u4E0D\u66F4\u65B0\u53EF\u7EE7\u7EED\u4F7F\u7528\u5F53\u524D\u7248\u672C\u3002` });
    });
    engine.on("update-not-available", () => this.set({ status: "current", nextVersion: void 0, message: "\u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C\u3002" }));
    engine.on("download-progress", (progress) => this.set({ status: "downloading", percent: Math.max(0, Math.min(100, progress.percent)), transferred: progress.transferred, total: progress.total, message: "\u6B63\u5728\u4E0B\u8F7D\u66F4\u65B0\uFF0C\u4F60\u53EF\u4EE5\u7EE7\u7EED\u89C2\u770B\u3002" }));
    engine.on("update-downloaded", (info) => this.set({ status: "downloaded", nextVersion: info.version, percent: 100, message: "\u66F4\u65B0\u5DF2\u4E0B\u8F7D\u5E76\u6821\u9A8C\uFF0C\u70B9\u51FB\u91CD\u542F\u5B89\u88C5\u3002\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u4F1A\u4FDD\u7559\u3002" }));
    engine.on("error", () => {
      if (!this.checking && !this.downloading) this.failed();
    });
  }
  engine;
  enabled;
  changed;
  shutdown;
  state;
  checking;
  downloading;
  installPending = false;
  snapshot() {
    return { ...this.state };
  }
  set(change) {
    this.state = { ...this.state, ...change };
    this.changed(this.snapshot());
  }
  failed() {
    const downloading = !!this.state.nextVersion && this.state.status !== "installing";
    this.installPending = false;
    this.set({ status: "error", message: downloading ? "\u66F4\u65B0\u4E0B\u8F7D\u6216\u6821\u9A8C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u4E0E\u78C1\u76D8\u7A7A\u95F4\u540E\u91CD\u8BD5\u3002" : "\u66F4\u65B0\u68C0\u67E5\u6216\u5B89\u88C5\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5\uFF1B\u4E5F\u53EF\u4ECE\u672C\u4ED3\u5E93 Releases \u624B\u52A8\u4E0B\u8F7D\u5B89\u88C5\u3002" });
  }
  check() {
    if (!this.enabled || ["available", "downloading", "downloaded", "installing"].includes(this.state.status)) return Promise.resolve(this.snapshot());
    if (this.checking) return this.checking;
    this.set({ status: "checking", nextVersion: void 0, percent: void 0, message: "\u6B63\u5728\u68C0\u67E5\u65B0\u7248\u672C\u2026" });
    this.checking = Promise.resolve().then(() => this.engine.checkForUpdates()).catch(() => this.failed()).then(() => this.snapshot()).finally(() => {
      this.checking = void 0;
    });
    return this.checking;
  }
  download() {
    if (this.downloading) return this.downloading;
    if (!this.enabled || !this.state.nextVersion || !["available", "error"].includes(this.state.status)) return Promise.resolve(this.snapshot());
    this.set({ status: "downloading", percent: 0, transferred: 0, total: void 0, message: "\u6B63\u5728\u4E0B\u8F7D\u66F4\u65B0\uFF0C\u4F60\u53EF\u4EE5\u7EE7\u7EED\u89C2\u770B\u3002" });
    this.downloading = Promise.resolve().then(() => this.engine.downloadUpdate()).catch(() => this.failed()).then(() => this.snapshot()).finally(() => {
      this.downloading = void 0;
    });
    return this.downloading;
  }
  requestInstall() {
    if (!this.enabled || this.state.status !== "downloaded" || this.installPending) return this.snapshot();
    this.installPending = true;
    this.set({ status: "installing", message: "\u6B63\u5728\u4FDD\u5B58\u89C2\u770B\u8FDB\u5EA6\u5E76\u51C6\u5907\u91CD\u542F\u5B89\u88C5\u2026" });
    this.shutdown();
    return this.snapshot();
  }
  installAfterShutdown() {
    if (!this.installPending) return;
    this.installPending = false;
    try {
      this.engine.quitAndInstall(true, true);
    } catch {
      this.failed();
    }
  }
};

// src/main/main.ts
import_electron2.protocol.registerSchemesAsPrivileged([{ scheme: "manju-media", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);
import_electron2.app.setName("\u7EA2\u679C\u6F2B\u5267\u684C\u9762\u7248");
if (process.env.HONGGUO_TEST_DATA) import_electron2.app.setPath("userData", process.env.HONGGUO_TEST_DATA);
if (!import_electron2.app.requestSingleInstanceLock()) {
  import_electron2.app.quit();
} else {
  let handle2 = function(channel, fn) {
    import_electron2.ipcMain.handle(channel, async (event, ...args) => {
      if (!window2 || event.sender !== window2.webContents && (!swipeWindow || event.sender !== swipeWindow.webContents)) return { ok: false, error: { code: "IPC_DENIED", message: "\u8BF7\u6C42\u65E0\u6548" } };
      const response = await result(() => fn(...args));
      if (!response.ok) diagnostics.record({ stage: "ipc", code: response.error?.code });
      return response;
    });
  }, createWindow2 = function() {
    window2 = new import_electron2.BrowserWindow({ width: 1400, height: 920, minWidth: 1040, minHeight: 720, title: "\u7EA2\u679C\u6F2B\u5267\u684C\u9762\u7248", backgroundColor: "#f4f0e8", autoHideMenuBar: true, webPreferences: { preload: import_node_path5.default.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    window2.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window2.webContents.on("will-navigate", (event, url) => {
      if (url !== window2?.webContents.getURL()) event.preventDefault();
    });
    window2.loadFile(import_node_path5.default.join(__dirname, "../renderer/index.html"));
    window2.webContents.on("did-finish-load", () => {
      try {
        const watchdog = require("node:fs").readFileSync(import_node_path5.default.join(__dirname, "../renderer/watchdog.js"), "utf8");
        void window2?.webContents.executeJavaScript(watchdog, true).then(() => {
          __hgDbg("watchdog injected");
        }).catch((e) => {
          __hgDbg("watchdog inject failed: " + (e && e.message));
        });
      } catch {
      }
    });
    window2.on("show", () => window2?.webContents.send("window-background", false));
    window2.on("close", (event) => {
      if (!exiting && tray && cache?.closeToTray) {
        event.preventDefault();
        window2?.webContents.send("window-background", true);
        window2?.hide();
      }
    });
    window2.on("closed", () => {
      window2 = null;
    });
  };
  handle = handle2, createWindow = createWindow2;
  let window2 = null;
  let swipeWindow = null;
  function createSwipeWindow2() {
    if (swipeWindow && !swipeWindow.isDestroyed()) {
      swipeWindow.show();
      swipeWindow.focus();
      return;
    }
    swipeWindow = new import_electron2.BrowserWindow({ width: 480, height: 880, minWidth: 380, minHeight: 600, title: "\u5237\u5267\u6A21\u5F0F\uFF08Demo\uFF09", backgroundColor: "#000000", autoHideMenuBar: true, webPreferences: { preload: import_node_path5.default.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    swipeWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    swipeWindow.loadFile(import_node_path5.default.join(__dirname, "../renderer/swipe.html"));
    swipeWindow.on("closed", () => {
      swipeWindow = null;
    });
  }
  let signer, media, library, updates, cache;
  let quitting = false;
  let installing = false;
  let exiting = false;
  let tray = null;
  const diagnostics = new Diagnostics();
  const searchBrowser = new SearchBrowser();
  async function result(fn) {
    try {
      return { ok: true, data: await fn() };
    } catch (error) {
      if (error instanceof AppError || error instanceof ProviderError) return { ok: false, error: { code: String(error.code), message: String(error.message) } };
      return { ok: false, error: { code: "UNAVAILABLE", message: "\u64CD\u4F5C\u6682\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5" } };
    }
  }
  import_electron2.app.whenReady().then(async () => {
    const runtime = import_electron2.app.isPackaged ? import_node_path5.default.join(process.resourcesPath, "runtime-bundle") : import_node_path5.default.join(import_electron2.app.getAppPath(), "runtime-bundle");
    signer = new Signer(runtime, import_node_path5.default.join(import_electron2.app.getPath("userData"), "runtime-work"));
    const provider = new ContentProvider(new Transport(signer, import_electron2.app.getPath("userData")), { searchPage: (url) => searchBrowser.read(url) }), recommendations = new RecommendationService(provider);
    library = new LibraryStore(import_electron2.app.getPath("userData"));
    await library.init();
    media = new MediaCache(await CacheManager.directory(import_electron2.app.getPath("userData")), import_node_path5.default.join(runtime, "ffmpeg.exe"), (id, quality) => provider.getResource(id, quality), { concurrency: 4, segments: 8, diagnostics });
    await media.init();
    cache = new CacheManager(import_electron2.app.getPath("userData"), media, () => library.snapshot().history);
    await cache.init();
    var __hgPrefs = { recommend: true, autoNext: true };
    var __hgFeedCache = /* @__PURE__ */ new Map();
    const __hgPrefsPath = import_node_path5.default.join(import_electron2.app.getPath("userData"), "swipe-prefs.json");
    await (0, import_promises5.readFile)(__hgPrefsPath, "utf8").then((raw) => {
      try {
        const v = JSON.parse(raw);
        if (v && typeof v.recommend === "boolean") __hgPrefs.recommend = v.recommend;
        if (v && typeof v.autoNext === "boolean") __hgPrefs.autoNext = v.autoNext;
      } catch {
      }
    }).catch(() => {
    });
    async function __hgSwipeFeed(category, refresh) {
      const key = String(category || "\u63A8\u8350");
      const now = Date.now();
      if (refresh) __hgFeedCache.delete(key);
      const hit = __hgFeedCache.get(key);
      if (hit && hit.expires > now) return hit.value;
      const pool = [];
      for (const board of ["recommend", "hot", "new"]) {
        try {
          const page = await provider.catalog(board, 0);
          pool.push(...page.items);
        } catch {
        }
      }
      let list = [...new Map(pool.map((item) => [item.id, item])).values()];
      if (key !== "\u63A8\u8350" && key !== "\u5168\u90E8") {
        const needle = key.toLowerCase();
        list = list.filter((item) => ((item.categories || []).join(" ") + " " + item.title + " " + item.description).toLowerCase().includes(needle));
      }
      if (__hgPrefs.recommend) {
        const weights = /* @__PURE__ */ new Map(), watched = /* @__PURE__ */ new Set();
        for (const entry of library.snapshot().history || []) {
          watched.add(entry.seriesId);
          for (const c of entry.work?.categories || []) weights.set(c, (weights.get(c) || 0) + 1);
        }
        list = list.map((item, i) => {
          const score = (item.categories || []).reduce((sum, c) => sum + (weights.get(c) || 0), 0) - (watched.has(item.id) ? 1.5 : 0);
          return { item, i, score: score + Math.random() * 1.2 };
        }).sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.item);
      } else {
        list = list.map((item, i) => ({ item, i, r: Math.random() })).sort((a, b) => a.r - b.r).map((x) => x.item);
      }
      const value = { items: list, hasMore: false, nextOffset: list.length, label: key };
      __hgFeedCache.set(key, { expires: now + 3e5, value });
      return value;
    }
    import_electron2.protocol.handle("manju-media", (request) => media.response(request.url, request.headers.get("range")));
    handle2("buffer-episodes", (ids) => media.setBufferWindow(ids));
    handle2("buffer-state", () => media.bufferState());
    handle2("buffer-retry", () => media.retryBuffer());
    handle2("cache-state", () => cache.snapshot());
    handle2("cache-add", async (id) => cache.add(await provider.getSeries(id)));
    handle2("cache-action", async (id, action) => {
      if (action === "delete") {
        if (!window2) throw new AppError("CACHE_WINDOW", "\u8BF7\u5148\u6253\u5F00\u4E3B\u7A97\u53E3");
        const snapshot = await cache.snapshot(), task = snapshot.tasks.find((task2) => task2.series.id === id);
        if (!task) throw new AppError("CACHE_TASK", "\u7F13\u5B58\u4EFB\u52A1\u4E0D\u5B58\u5728");
        const answer = await import_electron2.dialog.showMessageBox(window2, { type: "warning", title: "\u5220\u9664\u4F5C\u54C1\u7F13\u5B58", message: `\u5220\u9664\u300A${task.series.title}\u300B\u7684\u7F13\u5B58\uFF1F`, detail: `\u5C06\u505C\u6B62\u6B64\u4EFB\u52A1\u5E76\u5220\u9664\u672C\u5730\u89C6\u9891\u7F13\u5B58\uFF08\u7EA6 ${((task.state.cachedBytes || 0) / 1048576).toFixed(1)} MiB\uFF09\uFF0C\u4FDD\u7559\u6536\u85CF\u548C\u89C2\u770B\u8BB0\u5F55\u3002\u518D\u6B21\u89C2\u770B\u9700\u8981\u91CD\u65B0\u7F13\u5B58\u3002`, buttons: ["\u53D6\u6D88", "\u5220\u9664\u7F13\u5B58"], defaultId: 0, cancelId: 0 });
        if (answer.response !== 1) return cache.snapshot();
      }
      return cache.action(id, action);
    });
    handle2("cache-concurrency", (value) => cache.setConcurrency(value));
    handle2("cache-segments", (value) => cache.setSegments(value));
    handle2("cache-decode-level", (value) => cache.setDecodeLevel(value));
    handle2("cache-decode-mode", (value) => cache.setDecodeMode(value));
    handle2("network-check", () => media.checkNetwork());
    handle2("swipe-feed", (category, refresh = false) => __hgSwipeFeed(category, refresh));
    handle2("swipe-prefs", async (value) => {      if (value !== void 0) {
        if (!value || typeof value !== "object" || value.recommend !== void 0 && typeof value.recommend !== "boolean" || value.autoNext !== void 0 && typeof value.autoNext !== "boolean") throw new AppError("INVALID_INPUT", "\u63A8\u8350\u8BBE\u7F6E\u65E0\u6548");
        if (typeof value.recommend === "boolean") __hgPrefs.recommend = value.recommend;
        if (typeof value.autoNext === "boolean") __hgPrefs.autoNext = value.autoNext;
        await (0, import_promises5.writeFile)(__hgPrefsPath, JSON.stringify(__hgPrefs), "utf8");
        __hgFeedCache.clear();
      }
      return { ...__hgPrefs };
    });
    handle2("capabilities", (value) => {
      media.setHevcSupported(!!(value && value.hevc));
      return { hevc: !!media.hevcSupported };
    });
    handle2("cache-limits", (value) => cache.setLimits(value));
    handle2("cache-priority", (id, priority) => cache.setPriority(id, priority));
    handle2("video-quality", (quality) => {
      media.setQuality(quality);
      return true;
    });
    handle2("diagnostics-export", async () => {
      if (!window2) throw new AppError("DIAGNOSTICS_WINDOW", "\u8BF7\u5148\u6253\u5F00\u4E3B\u7A97\u53E3");
      const selection = await import_electron2.dialog.showSaveDialog(window2, { title: "\u5BFC\u51FA\u8131\u654F\u8BCA\u65AD", defaultPath: "Hongguo-Manju-diagnostics.json", filters: [{ name: "JSON \u8BCA\u65AD\u6587\u4EF6", extensions: ["json"] }] });
      if (selection.canceled || !selection.filePath) return { saved: false };
      try {
        await (0, import_promises7.writeFile)(selection.filePath, JSON.stringify(diagnostics.snapshot(import_electron2.app.getVersion()), null, 2));
        return { saved: true };
      } catch {
        throw new AppError("DIAGNOSTICS_WRITE", "\u8BCA\u65AD\u6587\u4EF6\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u4F4D\u7F6E");
      }
    });
    handle2("cache-delete-watched", async () => {
      if (!window2) throw new AppError("CACHE_WINDOW", "\u8BF7\u5148\u6253\u5F00\u4E3B\u7A97\u53E3");
      const snapshot = await cache.snapshot(), tasks = snapshot.tasks.filter((task) => task.watched);
      if (!tasks.length) return snapshot;
      const bytes = tasks.reduce((sum, task) => sum + (task.state.cachedBytes || 0), 0), answer = await import_electron2.dialog.showMessageBox(window2, { type: "warning", title: "\u6E05\u7406\u5DF2\u770B\u5B8C\u4F5C\u54C1", message: `\u6E05\u7406 ${tasks.length} \u90E8\u5DF2\u770B\u5B8C\u4F5C\u54C1\u7684\u7F13\u5B58\uFF1F`, detail: `\u9884\u8BA1\u91CA\u653E ${(bytes / 1048576).toFixed(1)} MiB\u3002\u6309\u672B\u96C6\u89C2\u770B\u8FBE\u5230 95% \u5224\u5B9A\uFF0C\u4E0D\u4EE3\u8868\u9010\u96C6\u89C2\u770B\u6838\u9A8C\u3002\u53EA\u5220\u9664\u8FD9\u4E9B\u4F5C\u54C1\u7684\u7F13\u5B58\u548C\u4EFB\u52A1\uFF0C\u4FDD\u7559\u6536\u85CF\u3001\u5386\u53F2\u53CA\u5176\u4ED6\u4F5C\u54C1\u3002`, buttons: ["\u53D6\u6D88", "\u6E05\u7406\u7F13\u5B58"], defaultId: 0, cancelId: 0 });
      return answer.response === 1 ? cache.deleteWatched(tasks.map((task) => task.series.id)) : cache.snapshot();
    });
    handle2("cache-directory", async () => {
      if (!window2) throw new AppError("CACHE_WINDOW", "\u8BF7\u5148\u6253\u5F00\u4E3B\u7A97\u53E3");
      const selection = await import_electron2.dialog.showOpenDialog(window2, { title: "\u9009\u62E9\u7F13\u5B58\u5B58\u50A8\u4F4D\u7F6E\uFF08\u5C06\u5EFA\u7ACB\u4E13\u7528 HongguoManjuCache \u6587\u4EF6\u5939\uFF09", properties: ["openDirectory", "createDirectory"] });
      if (selection.canceled || !selection.filePaths[0]) return cache.snapshot();
      return cache.migrate(import_node_path5.default.join(selection.filePaths[0], "HongguoManjuCache"));
    });
    handle2("cache-open-directory", async () => {
      const error = await import_electron2.shell.openPath(media.location);
      if (error) throw new AppError("CACHE_PATH", "\u65E0\u6CD5\u6253\u5F00\u7F13\u5B58\u6587\u4EF6\u5939");
      return true;
    });
    handle2("cache-close-to-tray", (enabled) => cache.setCloseToTray(enabled));
    handle2("catalog", (board, offset = 0) => provider.catalog(board, offset));
    handle2("search", (query, offset = 0) => provider.search(query, offset));
    handle2("series", async (id) => {
      const series = await provider.getSeries(id);
      await cache.remember(series);
      return series;
    });
    handle2("recommendations", (id, refresh = false) => recommendations.get(id, refresh));
    handle2("share", async (text2) => {
      const series = await provider.resolveShare(text2);
      await library.favorite(series, true);
      return series;
    });
    handle2("playback", (id, force = false, quality) => {
      if (quality !== void 0) media.setQuality(quality);
      return media.prepare(id, force);
    });
    handle2("library", () => library.snapshot());
    handle2("favorite", (work2, enabled) => library.favorite(work2, enabled));
    handle2("progress", (progress) => library.progress(progress));
    updates = new UpdateService(import_electron_updater.autoUpdater, import_electron2.app.getVersion(), import_electron2.app.isPackaged && process.platform === "win32", (state) => {
      if (window2 && !window2.isDestroyed()) window2.webContents.send("update-status", state);
      if (state.status === "error" && installing && quitting) {
        import_electron2.dialog.showErrorBox("\u66F4\u65B0\u672A\u5B8C\u6210", state.message);
        import_electron2.app.quit();
      }
    }, () => {
      installing = true;
      import_electron2.app.quit();
    });
    handle2("update", () => updates.check());
    handle2("update-state", () => updates.snapshot());
    handle2("update-download", () => updates.download());
    handle2("update-install", () => updates.requestInstall());
    createWindow2();
    try {
      import_electron2.Menu.setApplicationMenu(import_electron2.Menu.buildFromTemplate([
        { label: "\u6587\u4EF6", submenu: [{ label: "\u5237\u5267\u6A21\u5F0F\uFF08Demo\uFF09", click: () => createSwipeWindow2() }, { type: "separator" }, { label: "\u9000\u51FA", role: "quit" }] },
        { label: "\u7F16\u8F91", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
        { label: "\u89C6\u56FE", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "togglefullscreen" }] }
      ]));
    } catch {
    }
    try {
      tray = new import_electron2.Tray(import_electron2.nativeImage.createFromDataURL(trayIcon));
      tray.setToolTip("\u7EA2\u679C\u6F2B\u5267 \xB7 \u540E\u53F0\u7F13\u5B58");
      const show = () => {
        if (!window2) createWindow2();
        window2?.show();
        window2?.focus();
      };
      tray.on("click", show);
      tray.on("double-click", show);
      tray.setContextMenu(import_electron2.Menu.buildFromTemplate([{ label: "\u6253\u5F00\u7EA2\u679C\u6F2B\u5267", click: show }, { label: "\u5237\u5267\u6A21\u5F0F\uFF08Demo\uFF09", click: () => createSwipeWindow2() }, { label: "\u9000\u51FA\u8F6F\u4EF6\uFF08\u505C\u6B62\u540E\u53F0\u7F13\u5B58\uFF09", click: () => {
        exiting = true;
        import_electron2.app.quit();
      } }]));
    } catch {
      tray = null;
    }
    if (import_electron2.app.isPackaged) {
      setTimeout(() => void updates.check(), 2e3).unref();
      setInterval(() => void updates.check(), 4 * 60 * 60 * 1e3).unref();
    }
  }).catch(() => {
    import_electron2.dialog.showErrorBox("\u7EA2\u679C\u6F2B\u5267\u542F\u52A8\u5931\u8D25", "\u5E94\u7528\u6570\u636E\u6216\u8FD0\u884C\u7EC4\u4EF6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u68C0\u67E5\u5B89\u88C5\u662F\u5426\u5B8C\u6574\uFF0C\u4EE5\u53CA\u5E94\u7528\u6570\u636E\u76EE\u5F55\u662F\u5426\u53EF\u5199\u3002");
    import_electron2.app.quit();
  });
  import_electron2.app.on("second-instance", () => {
    window2?.show();
    window2?.focus();
  });
  import_electron2.app.on("window-all-closed", () => import_electron2.app.quit());
  import_electron2.app.on("before-quit", (event) => {
    if (quitting) return;
    event.preventDefault();
    exiting = true;
    searchBrowser.close();
    if (window2 && !window2.isDestroyed()) {
      window2.close();
      return;
    }
    quitting = true;
    Promise.allSettled([signer?.shutdown(), media?.close(), library?.flush(), cache?.flush()]).then((results) => {
      tray?.destroy();
      if (installing && results.some((result2) => result2.status === "rejected")) {
        import_electron2.dialog.showErrorBox("\u6682\u672A\u5B89\u88C5\u66F4\u65B0", "\u540E\u53F0\u7EC4\u4EF6\u672A\u80FD\u9000\u51FA\u6216\u89C2\u770B\u8BB0\u5F55\u672A\u80FD\u4FDD\u5B58\uFF0C\u5DF2\u505C\u6B62\u5B89\u88C5\u3002\u7F13\u5B58\u4F1A\u4FDD\u7559\uFF0C\u8BF7\u5F7B\u5E95\u9000\u51FA\u8F6F\u4EF6\u540E\u91CD\u65B0\u5B89\u88C5\u3002");
        import_electron2.app.quit();
      } else if (installing) {
        updates.installAfterShutdown();
      } else import_electron2.app.quit();
    });
  });
}
var handle;
var createWindow;
/*! Bundled license information:

sax/lib/sax.js:
  (*! http://mths.be/fromcodepoint v0.1.0 by @mathias *)
*/

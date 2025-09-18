"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentService = exports.RetryService = void 0;
var RetryService = /** @class */ (function () {
    function RetryService() {
    }
    RetryService.withRetry = function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, options) {
            var opts, lastError, attempt, result, error_1, delay;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = __assign({ maxRetries: 3, baseDelay: 1000, maxDelay: 30000, backoffFactor: 2, jitter: true }, options);
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= opts.maxRetries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        // Check rate limiting
                        return [4 /*yield*/, this.enforceRateLimit()];
                    case 3:
                        // Check rate limiting
                        _a.sent();
                        return [4 /*yield*/, operation()];
                    case 4:
                        result = _a.sent();
                        // Reset rate limit tracking on success
                        if (attempt > 0) {
                            console.log("Operation succeeded on attempt ".concat(attempt + 1));
                        }
                        return [2 /*return*/, result];
                    case 5:
                        error_1 = _a.sent();
                        lastError = error_1;
                        if (attempt === opts.maxRetries) {
                            console.error("Operation failed after ".concat(opts.maxRetries + 1, " attempts:"), lastError.message);
                            throw lastError;
                        }
                        delay = this.calculateDelay(attempt, opts);
                        console.log("Attempt ".concat(attempt + 1, " failed, retrying in ").concat(delay, "ms:"), lastError.message);
                        return [4 /*yield*/, this.delay(delay)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 8: throw lastError;
                }
            });
        });
    };
    RetryService.calculateDelay = function (attempt, options) {
        var _a = options.baseDelay, baseDelay = _a === void 0 ? 1000 : _a, _b = options.maxDelay, maxDelay = _b === void 0 ? 30000 : _b, _c = options.backoffFactor, backoffFactor = _c === void 0 ? 2 : _c, _d = options.jitter, jitter = _d === void 0 ? true : _d;
        var delay = baseDelay * Math.pow(backoffFactor, attempt);
        delay = Math.min(delay, maxDelay);
        if (jitter) {
            // Add random jitter (±25%)
            var jitterRange = delay * 0.25;
            delay += (Math.random() - 0.5) * 2 * jitterRange;
        }
        return Math.max(delay, 0);
    };
    RetryService.enforceRateLimit = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var opts, now, oldestRequest, waitTime;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = __assign(__assign({}, this.DEFAULT_RATE_LIMIT), options);
                        now = Date.now();
                        // Clean old timestamps
                        this.requestTimestamps = this.requestTimestamps.filter(function (timestamp) { return now - timestamp < 60000; } // Keep last minute
                        );
                        if (!(this.requestTimestamps.length >= opts.requestsPerMinute)) return [3 /*break*/, 2];
                        oldestRequest = Math.min.apply(Math, this.requestTimestamps);
                        waitTime = 60000 - (now - oldestRequest);
                        if (!(waitTime > 0)) return [3 /*break*/, 2];
                        console.log("Rate limit reached, waiting ".concat(waitTime, "ms"));
                        return [4 /*yield*/, this.delay(waitTime)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Add current request timestamp
                        this.requestTimestamps.push(now);
                        return [2 /*return*/];
                }
            });
        });
    };
    RetryService.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    RetryService.withRateLimit = function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, rateLimitOptions) {
            if (rateLimitOptions === void 0) { rateLimitOptions = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.enforceRateLimit(rateLimitOptions)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, operation()];
                }
            });
        });
    };
    RetryService.requestTimestamps = [];
    RetryService.DEFAULT_RATE_LIMIT = {
        requestsPerMinute: 30,
        requestsPerHour: 1000
    };
    return RetryService;
}());
exports.RetryService = RetryService;
// Enhanced User-Agent rotation
var UserAgentService = /** @class */ (function () {
    function UserAgentService() {
    }
    UserAgentService.getRandomUserAgent = function () {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    };
    UserAgentService.getHeaders = function () {
        return {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        };
    };
    UserAgentService.userAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
    ];
    return UserAgentService;
}());
exports.UserAgentService = UserAgentService;

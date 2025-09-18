"use strict";
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
exports.SearchTool = void 0;
// src/tools/searchTool.ts
var zod_1 = require("zod");
var tool_js_1 = require("../core/tool.js");
var axios_1 = require("axios");
var serpapi_1 = require("serpapi");
var fs = require("fs");
var renderHtml_js_1 = require("./renderHtml.js");
var path = require("path");
var htmlParse_js_1 = require("./htmlParse.js"); // Assuming ParsedPage is exported
// Helper function to log errors to a file
function logErrorToFile(message, error) {
    var logPath = path.resolve(process.cwd(), "searchTool-errors.log");
    var timestamp = new Date().toISOString();
    var errorMsg = typeof error === "string"
        ? error
        : error instanceof Error
            ? error.stack || error.message
            : JSON.stringify(error, null, 2);
    var logEntry = "[".concat(timestamp, "] ").concat(message, "\n").concat(errorMsg, "\n\n");
    try {
        fs.appendFileSync(logPath, logEntry, "utf8");
    }
    catch (fileErr) {
        // If logging fails, at least print to console
        console.error("Failed to write to error log file:", fileErr);
    }
}
var SearchTool = /** @class */ (function () {
    function SearchTool() {
    }
    SearchTool.createTool = function () {
        var _this = this;
        return new tool_js_1.Tool({
            name: "search",
            description: "Search the web for information",
            schema: zod_1.z.object({ query: zod_1.z.string() }),
            func: function (input) { return __awaiter(_this, void 0, void 0, function () {
                var query;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            query = input.query;
                            _a = {};
                            return [4 /*yield*/, this.search(query)];
                        case 1: return [2 /*return*/, (_a.results = _b.sent(), _a)];
                    }
                });
            }); },
        });
    };
    SearchTool.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var linksResponse, organicResults, links, parsedResults, error_1, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.searchSerpApi(query)];
                    case 1:
                        linksResponse = _a.sent();
                        console.log(linksResponse);
                        organicResults = Array.isArray(linksResponse === null || linksResponse === void 0 ? void 0 : linksResponse["organic_results"])
                            ? linksResponse["organic_results"] : [];
                        if (organicResults.length === 0) {
                            throw new Error("No organic results found from search API.");
                        }
                        links = organicResults
                            // .slice(0, 2)
                            .map(function (item) {
                            if (item &&
                                typeof item === "object" &&
                                "link" in item &&
                                typeof item.link === "string") {
                                return item.link;
                            }
                            return null;
                        })
                            .filter(function (link) { return typeof link === "string"; });
                        return [4 /*yield*/, this.smartFetchAndParse(links)];
                    case 2:
                        parsedResults = _a.sent();
                        fs.writeFileSync("htmlResults_final.json", JSON.stringify(parsedResults, null, 2));
                        console.log(parsedResults);
                        return [2 /*return*/, parsedResults];
                    case 3:
                        error_1 = _a.sent();
                        msg = "Error in search:";
                        console.error(msg, error_1);
                        logErrorToFile(msg, error_1);
                        return [2 /*return*/, {
                                error: error_1.message || "Unknown error during search.",
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Implements a hybrid fetching and parsing strategy.
     * It tries a fast static fetch first, and if the content is poor,
     * it falls back to a full rendered fetch.
     */
    SearchTool.smartFetchAndParse = function (links) {
        return __awaiter(this, void 0, void 0, function () {
            var allPromises, outcomes, results, i, o, msg;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        allPromises = links.map(function (link) {
                            return (function () { return __awaiter(_this, void 0, void 0, function () {
                                var staticHtml, parsed, renderedHtml;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getStaticHtml(link)];
                                        case 1:
                                            staticHtml = _a.sent();
                                            parsed = (0, htmlParse_js_1.parseHtmlToMarkdown)(staticHtml);
                                            if (!(parsed.markdownContent.length < 250)) return [3 /*break*/, 3];
                                            console.log("[!] Static content for ".concat(link, " is too short. Falling back to rendered fetch."));
                                            return [4 /*yield*/, (0, renderHtml_js_1.fetchRenderedHtml)(link)];
                                        case 2:
                                            renderedHtml = _a.sent();
                                            parsed = (0, htmlParse_js_1.parseHtmlToMarkdown)(renderedHtml);
                                            _a.label = 3;
                                        case 3: return [2 /*return*/, parsed];
                                    }
                                });
                            }); })();
                        });
                        return [4 /*yield*/, Promise.allSettled(allPromises)];
                    case 1:
                        outcomes = _c.sent();
                        results = [];
                        for (i = 0; i < outcomes.length; i++) {
                            o = outcomes[i];
                            if (o.status === "fulfilled") {
                                results.push(o.value);
                            }
                            else {
                                msg = "Error processing link ".concat(links[i], ":");
                                console.error(msg, o.reason);
                                logErrorToFile(msg, o.reason);
                                results.push({
                                    title: "Error processing ".concat(links[i]),
                                    markdownContent: (_b = (_a = o.reason) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Unknown error",
                                });
                            }
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    SearchTool.searchSerpApi = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, serpapi_1.getJson)({
                                engine: "google_light",
                                q: query,
                                location: "India",
                                google_domain: "google.co.in",
                                hl: "en",
                                gl: "in",
                                api_key: process.env.SERPAPI_API_KEY,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        error_2 = _a.sent();
                        msg = "Error in searchSerpApi:";
                        console.error(msg, error_2);
                        logErrorToFile(msg, error_2);
                        throw new Error(error_2.message || "Failed to fetch results from SerpApi.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SearchTool.getStaticHtml = function (link) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.get(link, {
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                            },
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    return SearchTool;
}());
exports.SearchTool = SearchTool;
var searchTool = SearchTool.createTool();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, searchTool.run({ query: "Mouli actor Little Hearts 2025" })];
            case 1:
                result = _a.sent();
                console.log("Search results:", result);
                return [2 /*return*/];
        }
    });
}); })();
exports.default = searchTool;

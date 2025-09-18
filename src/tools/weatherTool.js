"use strict";
// src/tools/weatherTool.ts
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
exports.WeatherTool = void 0;
var axios_1 = require("axios");
var zod_1 = require("zod");
var tool_1 = require("../core/tool");
var path = require("path");
var fs = require("fs");
// Helper function to log errors to a file
function logErrorToFile(message, error) {
    var logPath = path.resolve(process.cwd(), "weatherTool-errors.log");
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
        console.error("Failed to write to error log file:", fileErr);
    }
}
var WeatherTool = /** @class */ (function () {
    function WeatherTool() {
    }
    WeatherTool.createTool = function () {
        var _this = this;
        return new tool_1.Tool({
            name: 'weather',
            description: 'Fetches weather information for a given location',
            schema: zod_1.z.object({ location: zod_1.z.string() }),
            func: function (input) { return __awaiter(_this, void 0, void 0, function () {
                var location;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            location = input.location;
                            return [4 /*yield*/, this.fetchWeather(location)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
        });
    };
    WeatherTool.fetchWeather = function (location) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, weatherUrl, weatherResponse, weatherData, error_1, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiKey = '91ba7caa4d14493ba46130529250709';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        weatherUrl = "http://api.weatherapi.com/v1/current.json?key=".concat(apiKey, "&q=").concat(encodeURIComponent(location), "&aqi=no");
                        return [4 /*yield*/, axios_1.default.get(weatherUrl)];
                    case 2:
                        weatherResponse = _a.sent();
                        weatherData = weatherResponse.data;
                        return [2 /*return*/, {
                                temperature: weatherData.current.temp_c,
                                description: weatherData.current.condition.text,
                                city: weatherData.location.name,
                                country: weatherData.location.country,
                                coordinates: { lat: weatherData.location.lat, lon: weatherData.location.lon },
                            }];
                    case 3:
                        error_1 = _a.sent();
                        msg = "Error fetching weather data:";
                        console.error(msg, error_1);
                        logErrorToFile(msg, error_1);
                        throw new Error('Failed to fetch weather data');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return WeatherTool;
}());
exports.WeatherTool = WeatherTool;

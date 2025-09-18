"use strict";
// src/utils/toolRegistry.ts
// Utility for registering all available tools
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
exports.ComprehensiveToolRegistry = void 0;
var toolRegistry_js_1 = require("../core/toolRegistry.js");
var tool_js_1 = require("../core/tool.js");
var enhancedSearchTool_js_1 = require("../tools/enhancedSearchTool.js");
var mathTools_js_1 = require("../tools/mathTools.js");
var weatherTool_js_1 = require("../tools/weatherTool.js");
var searchTool_js_1 = require("../tools/searchTool.js");
var ComprehensiveToolRegistry = /** @class */ (function () {
    function ComprehensiveToolRegistry() {
        this.toolRegistry = new toolRegistry_js_1.ToolRegistry();
    }
    /**
     * Register all available tools
     */
    ComprehensiveToolRegistry.prototype.registerAllTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var enhancedSearchTool, searchTool, mathTools, weatherTool, basicSearchTool;
            var _this = this;
            return __generator(this, function (_a) {
                console.log('🔧 Registering all available tools...');
                enhancedSearchTool = new enhancedSearchTool_js_1.EnhancedSearchTool();
                searchTool = new tool_js_1.Tool({
                    name: 'enhanced_search',
                    description: 'Enhanced search tool with real-time and semantic search capabilities',
                    func: function (input) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, enhancedSearchTool.search(input.query, input.depth || 'medium')];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }
                });
                this.toolRegistry.register(searchTool);
                console.log('✅ Enhanced Search Tool registered');
                mathTools = mathTools_js_1.MathTools.createTools();
                mathTools.forEach(function (tool) {
                    _this.toolRegistry.register(tool);
                });
                console.log("\u2705 ".concat(mathTools.length, " Math Tools registered"));
                weatherTool = weatherTool_js_1.WeatherTool.createTool();
                this.toolRegistry.register(weatherTool);
                console.log('✅ Weather Tool registered');
                basicSearchTool = searchTool_js_1.SearchTool.createTool();
                this.toolRegistry.register(basicSearchTool);
                console.log('✅ Basic Search Tool registered');
                console.log("\uD83C\uDF89 All tools registered successfully! Total: ".concat(this.toolRegistry.list().length, " tools"));
                return [2 /*return*/, this.toolRegistry];
            });
        });
    };
    /**
     * Register only essential tools for research
     */
    ComprehensiveToolRegistry.prototype.registerResearchTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var enhancedSearchTool, searchTool;
            var _this = this;
            return __generator(this, function (_a) {
                console.log('🔧 Registering research tools...');
                enhancedSearchTool = new enhancedSearchTool_js_1.EnhancedSearchTool();
                searchTool = new tool_js_1.Tool({
                    name: 'enhanced_search',
                    description: 'Enhanced search tool with real-time and semantic search capabilities',
                    func: function (input) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, enhancedSearchTool.search(input.query, input.depth || 'medium')];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }
                });
                this.toolRegistry.register(searchTool);
                console.log('✅ Enhanced Search Tool registered');
                console.log("\uD83C\uDF89 Research tools registered successfully! Total: ".concat(this.toolRegistry.list().length, " tools"));
                return [2 /*return*/, this.toolRegistry];
            });
        });
    };
    /**
     * Register only utility tools
     */
    ComprehensiveToolRegistry.prototype.registerUtilityTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mathTools, weatherTool;
            var _this = this;
            return __generator(this, function (_a) {
                console.log('🔧 Registering utility tools...');
                mathTools = mathTools_js_1.MathTools.createTools();
                mathTools.forEach(function (tool) {
                    _this.toolRegistry.register(tool);
                });
                console.log("\u2705 ".concat(mathTools.length, " Math Tools registered"));
                weatherTool = weatherTool_js_1.WeatherTool.createTool();
                this.toolRegistry.register(weatherTool);
                console.log('✅ Weather Tool registered');
                console.log("\uD83C\uDF89 Utility tools registered successfully! Total: ".concat(this.toolRegistry.list().length, " tools"));
                return [2 /*return*/, this.toolRegistry];
            });
        });
    };
    /**
     * Get the tool registry
     */
    ComprehensiveToolRegistry.prototype.getToolRegistry = function () {
        return this.toolRegistry;
    };
    /**
     * List all registered tools
     */
    ComprehensiveToolRegistry.prototype.listTools = function () {
        return this.toolRegistry.list().map(function (tool) { return tool.name; });
    };
    return ComprehensiveToolRegistry;
}());
exports.ComprehensiveToolRegistry = ComprehensiveToolRegistry;
exports.default = ComprehensiveToolRegistry;

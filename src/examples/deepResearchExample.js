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
exports.demonstrateDeepResearch = demonstrateDeepResearch;
exports.demonstrateResearchStrategies = demonstrateResearchStrategies;
exports.demonstrateProgressTracking = demonstrateProgressTracking;
// src/examples/deepResearchExample.ts
var researchCoordinatorAgent_js_1 = require("../agents/researchCoordinatorAgent.js");
var llm_js_1 = require("../core/llm.js");
var memory_js_1 = require("../core/memory.js");
var toolRegistry_js_1 = require("../utils/toolRegistry.js");
function demonstrateDeepResearch() {
    return __awaiter(this, void 0, void 0, function () {
        var llm, memory, toolRegistryManager, toolRegistry, coordinator, query, session, allFusedResults, avgConfidence, activeSessions, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🧠 Starting Deep Research Framework Demo\n');
                    llm = new llm_js_1.OpenAILLM({
                        model: 'gpt-4o-mini',
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    memory = new memory_js_1.InMemoryMemory();
                    toolRegistryManager = new toolRegistry_js_1.ComprehensiveToolRegistry();
                    return [4 /*yield*/, toolRegistryManager.registerResearchTools()];
                case 1:
                    toolRegistry = _b.sent();
                    coordinator = new researchCoordinatorAgent_js_1.ResearchCoordinatorAgent({
                        llm: llm,
                        memory: memory,
                        tools: toolRegistry
                    });
                    query = {
                        query: "AI agents framework implementation best practices",
                        depth: "deep",
                        strategy: "systematic",
                        focusAreas: ["architecture", "performance", "scalability", "testing"],
                        maxResults: 20,
                        context: {
                            domain: "software_development",
                            requiresFactChecking: true,
                            isAcademicResearch: false,
                            targetAudience: "developers"
                        }
                    };
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    console.log("\uD83D\uDCCB Deep Research Query: ".concat(query.query));
                    console.log("\uD83D\uDD0D Depth: ".concat(query.depth));
                    console.log("\uD83D\uDCCA Strategy: ".concat(query.strategy));
                    console.log("\uD83C\uDFAF Focus Areas: ".concat((_a = query.focusAreas) === null || _a === void 0 ? void 0 : _a.join(', ')));
                    console.log("\uD83C\uDF10 Context: ".concat(JSON.stringify(query.context), "\n"));
                    // Set up progress tracking
                    coordinator.onProgress(function (progress) {
                        console.log("\uD83D\uDCCA Progress [".concat(progress.step, "]: ").concat(progress.progress, "% - ").concat(progress.currentTask));
                        if (progress.urlsProcessed.length > 0) {
                            console.log("   \uD83D\uDCC4 URLs Processed: ".concat(progress.urlsProcessed.length, "/").concat(progress.urlsTotal));
                        }
                        if (progress.insightsFound > 0) {
                            console.log("   \uD83D\uDCA1 Insights Found: ".concat(progress.insightsFound));
                        }
                        if (progress.estimatedTimeRemaining) {
                            console.log("   \u23F1\uFE0F  Estimated Time Remaining: ".concat(Math.ceil(progress.estimatedTimeRemaining / 60), " minutes"));
                        }
                        console.log('');
                    });
                    // Conduct deep research
                    console.log('🚀 Starting Deep Research Process...\n');
                    return [4 /*yield*/, coordinator.conductDeepResearch(query)];
                case 3:
                    session = _b.sent();
                    // Display comprehensive results
                    console.log('📊 Deep Research Session Results:');
                    console.log("Session ID: ".concat(session.id));
                    console.log("Total Research Time: ".concat(session.metadata.totalSearchTime, "ms"));
                    console.log("Total Results: ".concat(session.metadata.totalResults));
                    console.log("Vector DB Documents: ".concat(session.metadata.vectorDBCount, "\n"));
                    // Display search results
                    console.log('🔗 Search Results Summary:');
                    session.results.forEach(function (result, index) {
                        console.log("Search ".concat(index + 1, ":"));
                        console.log("  Real-time Results: ".concat(result.metadata.totalRealTimeResults));
                        console.log("  Semantic Results: ".concat(result.metadata.totalSemanticResults));
                        console.log("  Search Time: ".concat(result.metadata.searchTime, "ms"));
                        console.log("  Fused Results: ".concat(result.fusedResults.length));
                        console.log('');
                    });
                    // Display top fused results
                    console.log('🔗 Top Fused Results (Top 5):');
                    allFusedResults = session.results.flatMap(function (r) { return r.fusedResults; });
                    allFusedResults
                        .sort(function (a, b) { return (b.relevanceScore || 0) - (a.relevanceScore || 0); })
                        .slice(0, 5)
                        .forEach(function (result, index) {
                        var _a, _b;
                        console.log("".concat(index + 1, ". ").concat(result.title));
                        console.log("   URL: ".concat(result.url));
                        console.log("   Source: ".concat(result.source));
                        console.log("   Quality Score: ".concat(((_a = result.qualityScore) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'N/A'));
                        console.log("   Relevance Score: ".concat(((_b = result.relevanceScore) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || 'N/A'));
                        console.log("   Content Preview: ".concat(result.content.substring(0, 150), "...\n"));
                    });
                    // Display insights
                    console.log('💡 Generated Insights:');
                    session.insights.forEach(function (insight, index) {
                        console.log("".concat(index + 1, ". [").concat(insight.type.toUpperCase(), "] ").concat(insight.content));
                        console.log("   Confidence: ".concat(insight.confidence));
                        console.log("   Tags: ".concat(insight.tags.join(', ')));
                        console.log("   Sources: ".concat(insight.sources.length, " sources"));
                        if (insight.evidence && insight.evidence.length > 0) {
                            console.log("   Evidence: ".concat(insight.evidence.length, " pieces of evidence"));
                        }
                        console.log('');
                    });
                    // Display research quality metrics
                    console.log('📈 Research Quality Metrics:');
                    avgConfidence = session.insights.reduce(function (sum, insight) { return sum + insight.confidence; }, 0) / session.insights.length;
                    console.log("Average Insight Confidence: ".concat(avgConfidence.toFixed(2)));
                    console.log("Total Insights Generated: ".concat(session.insights.length));
                    console.log("Source Diversity: ".concat(new Set(allFusedResults.map(function (r) { var _a; return (_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain; })).size, " unique domains"));
                    console.log("Content Types: ".concat(new Set(allFusedResults.map(function (r) { var _a; return (_a = r.metadata) === null || _a === void 0 ? void 0 : _a.contentType; })).size, " different types\n"));
                    // Display session metadata
                    console.log('📋 Session Metadata:');
                    console.log("Created: ".concat(session.metadata.createdAt.toISOString()));
                    console.log("Total Queries: ".concat(session.queries.length));
                    console.log("Research Depth: ".concat(query.depth));
                    console.log("Strategy Used: ".concat(query.strategy, "\n"));
                    // Demonstrate session persistence
                    console.log('💾 Testing Session Persistence...');
                    return [4 /*yield*/, coordinator.getActiveSessions()];
                case 4:
                    activeSessions = _b.sent();
                    console.log("Active Sessions: ".concat(activeSessions.length));
                    if (activeSessions.length > 0) {
                        console.log('✅ Session successfully stored in memory');
                        console.log("Session ID: ".concat(activeSessions[0].id));
                    }
                    console.log('\n🎉 Deep Research Framework Demo completed successfully!');
                    console.log('\nKey Features Demonstrated:');
                    console.log('✅ Multi-agent orchestration');
                    console.log('✅ Real-time progress tracking');
                    console.log('✅ Comprehensive data collection');
                    console.log('✅ Advanced analysis and synthesis');
                    console.log('✅ Session persistence');
                    console.log('✅ Quality metrics and validation');
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    console.error('❌ Deep Research failed:', error_1);
                    console.error('Stack trace:', error_1.stack);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Additional demonstration functions
function demonstrateResearchStrategies() {
    return __awaiter(this, void 0, void 0, function () {
        var llm, memory, toolRegistryManager, toolRegistry, coordinator, strategies, _i, strategies_1, strategy, query, session, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🔬 Demonstrating Different Research Strategies\n');
                    llm = new llm_js_1.OpenAILLM({
                        model: 'gpt-4o-mini',
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    memory = new memory_js_1.InMemoryMemory();
                    toolRegistryManager = new toolRegistry_js_1.ComprehensiveToolRegistry();
                    return [4 /*yield*/, toolRegistryManager.registerResearchTools()];
                case 1:
                    toolRegistry = _a.sent();
                    coordinator = new researchCoordinatorAgent_js_1.ResearchCoordinatorAgent({
                        llm: llm,
                        memory: memory,
                        tools: toolRegistry
                    });
                    strategies = ['exploratory', 'systematic', 'comparative', 'trend_analysis'];
                    _i = 0, strategies_1 = strategies;
                    _a.label = 2;
                case 2:
                    if (!(_i < strategies_1.length)) return [3 /*break*/, 7];
                    strategy = strategies_1[_i];
                    console.log("\uD83D\uDCCA Testing ".concat(strategy, " strategy..."));
                    query = {
                        query: "machine learning frameworks comparison",
                        depth: "medium",
                        strategy: strategy,
                        maxResults: 10
                    };
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, coordinator.conductDeepResearch(query)];
                case 4:
                    session = _a.sent();
                    console.log("\u2705 ".concat(strategy, " strategy completed: ").concat(session.insights.length, " insights generated\n"));
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error("\u274C ".concat(strategy, " strategy failed:"), error_2.message);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function demonstrateProgressTracking() {
    return __awaiter(this, void 0, void 0, function () {
        var llm, memory, toolRegistryManager, toolRegistry, coordinator, query, session, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📊 Demonstrating Real-Time Progress Tracking\n');
                    llm = new llm_js_1.OpenAILLM({
                        model: 'gpt-4o-mini',
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    memory = new memory_js_1.InMemoryMemory();
                    toolRegistryManager = new toolRegistry_js_1.ComprehensiveToolRegistry();
                    return [4 /*yield*/, toolRegistryManager.registerResearchTools()];
                case 1:
                    toolRegistry = _a.sent();
                    coordinator = new researchCoordinatorAgent_js_1.ResearchCoordinatorAgent({
                        llm: llm,
                        memory: memory,
                        tools: toolRegistry
                    });
                    // Set up detailed progress tracking
                    coordinator.onProgress(function (progress) {
                        var timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] ").concat(progress.step.toUpperCase(), ": ").concat(progress.progress, "%"));
                        console.log("  Task: ".concat(progress.currentTask));
                        console.log("  URLs: ".concat(progress.urlsProcessed.length, "/").concat(progress.urlsTotal));
                        console.log("  Insights: ".concat(progress.insightsFound));
                        if (progress.estimatedTimeRemaining) {
                            console.log("  ETA: ".concat(Math.ceil(progress.estimatedTimeRemaining / 60), " min"));
                        }
                        console.log('');
                    });
                    query = {
                        query: "artificial intelligence trends 2024",
                        depth: "deep",
                        strategy: "trend_analysis",
                        maxResults: 15
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, coordinator.conductDeepResearch(query)];
                case 3:
                    session = _a.sent();
                    console.log("\u2705 Progress tracking demo completed: ".concat(session.insights.length, " insights\n"));
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('❌ Progress tracking demo failed:', error_3.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Run the demos
if (process.argv[1] && process.argv[1].endsWith('deepResearchExample.ts')) {
    var args = process.argv.slice(2);
    if (args.includes('--strategies')) {
        demonstrateResearchStrategies()
            .then(function () { return process.exit(0); })
            .catch(function (error) {
            console.error('❌ Strategies demo failed:', error);
            process.exit(1);
        });
    }
    else if (args.includes('--progress')) {
        demonstrateProgressTracking()
            .then(function () { return process.exit(0); })
            .catch(function (error) {
            console.error('❌ Progress demo failed:', error);
            process.exit(1);
        });
    }
    else {
        demonstrateDeepResearch()
            .then(function () {
            console.log('\n🚀 Additional demos available:');
            console.log('  --strategies  : Test different research strategies');
            console.log('  --progress    : Demonstrate progress tracking');
            process.exit(0);
        })
            .catch(function (error) {
            console.error('❌ Demo failed:', error);
            process.exit(1);
        });
    }
}

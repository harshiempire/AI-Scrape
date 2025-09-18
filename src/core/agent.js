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
exports.Agent = void 0;
exports.wrapAgentAsTool = wrapAgentAsTool;
var tool_1 = require("./tool");
var Agent = /** @class */ (function () {
    function Agent(options) {
        this.llm = options.llm;
        this.memory = options.memory;
        this.tools = options.tools;
        this.system = options.system || "You are a helpful assistant.";
        this.debug = options.debug || false;
    }
    // Add event listener for agent steps
    Agent.prototype.on = function (event, callback) {
        if (event === "step") {
            this.onStep = callback;
        }
    };
    Agent.prototype.logStep = function (type, data) {
        var step = {
            type: type,
            data: data,
            timestamp: new Date(),
        };
        if (this.debug) {
            console.log("[".concat(step.type, "]"), step.data);
        }
        if (this.onStep) {
            this.onStep(step);
        }
    };
    Agent.prototype.buildPrompt = function (userMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, prompt, _i, messages_1, message, toolSpecs, _a, toolSpecs_1, tool;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.memory.load()];
                    case 1:
                        messages = _b.sent();
                        return [4 /*yield*/, this.memory.store({
                                role: "user",
                                content: userMessage,
                            })];
                    case 2:
                        _b.sent();
                        prompt = "".concat(this.system, "\n\n");
                        // Add conversation history (excluding the current user message since it's already in memory)
                        for (_i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                            message = messages_1[_i];
                            prompt += "".concat(message.role, ": ").concat(message.content, "\n");
                        }
                        toolSpecs = this.tools.toFunctionSpecs();
                        console.log("toolSpecs", toolSpecs);
                        if (toolSpecs.length > 0) {
                            prompt += "\nAvailable tools:\n";
                            for (_a = 0, toolSpecs_1 = toolSpecs; _a < toolSpecs_1.length; _a++) {
                                tool = toolSpecs_1[_a];
                                prompt += "- ".concat(tool.name, ": ").concat(tool.description, "\n");
                                if (tool.schema) {
                                    prompt += "- Parameters: ".concat(JSON.stringify(tool.schema, null, 2), "\n");
                                }
                            }
                            prompt +=
                                '\nYou can call tools by responding with: TOOL_CALL:{"tool": "tool_name", "input": {...}}\n';
                        }
                        prompt += "\nassistant:";
                        return [2 /*return*/, prompt];
                }
            });
        });
    };
    Agent.prototype.parseToolCall = function (response) {
        var toolCallMatch = response.match(/TOOL_CALL:\s*({.*})/);
        if (!toolCallMatch)
            return null;
        try {
            var parsed = JSON.parse(toolCallMatch[1]);
            return parsed;
        }
        catch (_a) {
            return null;
        }
    };
    Agent.prototype.chat = function (userMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, finalResponse, toolCall, toolResult, finalPrompt, finalLLMResponse, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Agent.chat called with message:", userMessage);
                        // Store user message
                        console.log("Message stored in memory");
                        return [4 /*yield*/, this.buildPrompt(userMessage)];
                    case 1:
                        prompt = _a.sent();
                        this.logStep("llm_request", { prompt: prompt });
                        return [4 /*yield*/, this.llm.generate({ prompt: prompt })];
                    case 2:
                        response = _a.sent();
                        this.logStep("llm_response", response);
                        finalResponse = response.text;
                        toolCall = this.parseToolCall(response.text);
                        if (!toolCall) return [3 /*break*/, 9];
                        this.logStep("tool_start", toolCall);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 8, , 9]);
                        return [4 /*yield*/, this.tools.callTool(toolCall.tool, toolCall.input)];
                    case 4:
                        toolResult = _a.sent();
                        this.logStep("tool_end", { tool: toolCall.tool, result: toolResult });
                        // Store tool result and generate final response
                        return [4 /*yield*/, this.memory.store({
                                role: "assistant",
                                content: "Tool call: ".concat(toolCall.tool, "(").concat(JSON.stringify(toolCall.input), ") = ").concat(JSON.stringify(toolResult)),
                            })];
                    case 5:
                        // Store tool result and generate final response
                        _a.sent();
                        return [4 /*yield*/, this.buildPrompt("Tool ".concat(toolCall.tool, " returned: ").concat(JSON.stringify(toolResult), ". Please provide a helpful response to the user."))];
                    case 6:
                        finalPrompt = _a.sent();
                        return [4 /*yield*/, this.llm.generate({
                                prompt: finalPrompt,
                            })];
                    case 7:
                        finalLLMResponse = _a.sent();
                        finalResponse = finalLLMResponse.text;
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                        this.logStep("tool_end", { tool: toolCall.tool, error: errorMessage });
                        finalResponse = "Error calling tool ".concat(toolCall.tool, ": ").concat(errorMessage);
                        return [3 /*break*/, 9];
                    case 9: 
                    // Store assistant response
                    return [4 /*yield*/, this.memory.store({
                            role: "assistant",
                            content: finalResponse,
                        })];
                    case 10:
                        // Store assistant response
                        _a.sent();
                        return [2 /*return*/, { text: finalResponse }];
                }
            });
        });
    };
    return Agent;
}());
exports.Agent = Agent;
// Utility function to wrap an agent as a tool
function wrapAgentAsTool(agent, options) {
    var _this = this;
    return new tool_1.Tool({
        name: options.name,
        description: options.description,
        func: function (input) { return __awaiter(_this, void 0, void 0, function () {
            var message, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = input.message || input.text || String(input);
                        return [4 /*yield*/, agent.chat(message)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.text];
                }
            });
        }); },
    });
}

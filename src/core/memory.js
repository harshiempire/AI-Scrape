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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseMemory = exports.VectorMemory = exports.InMemoryMemory = void 0;
var InMemoryMemory = /** @class */ (function () {
    function InMemoryMemory() {
        this.messages = [];
    }
    InMemoryMemory.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, __spreadArray([], this.messages, true)];
            });
        });
    };
    InMemoryMemory.prototype.store = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.messages.push(message);
                return [2 /*return*/];
            });
        });
    };
    InMemoryMemory.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.messages = [];
                return [2 /*return*/];
            });
        });
    };
    return InMemoryMemory;
}());
exports.InMemoryMemory = InMemoryMemory;
var VectorMemory = /** @class */ (function () {
    function VectorMemory() {
        this.messages = [];
    }
    // TODO: Implement vector storage for semantic search
    // This would integrate with a vector database like Pinecone, Weaviate, etc.
    VectorMemory.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, __spreadArray([], this.messages, true)];
            });
        });
    };
    VectorMemory.prototype.store = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.messages.push(message);
                return [2 /*return*/];
            });
        });
    };
    VectorMemory.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.messages = [];
                return [2 /*return*/];
            });
        });
    };
    // Additional methods for vector memory
    VectorMemory.prototype.searchSimilar = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, limit) {
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                // TODO: Implement semantic search using vector embeddings
                return [2 /*return*/, this.messages.slice(-limit)];
            });
        });
    };
    return VectorMemory;
}());
exports.VectorMemory = VectorMemory;
var DatabaseMemory = /** @class */ (function () {
    function DatabaseMemory() {
    }
    // TODO: Implement persistent database storage
    // This would integrate with Prisma/your database of choice
    DatabaseMemory.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Load messages from database
                return [2 /*return*/, []];
            });
        });
    };
    DatabaseMemory.prototype.store = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DatabaseMemory.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return DatabaseMemory;
}());
exports.DatabaseMemory = DatabaseMemory;

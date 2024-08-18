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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const redis_1 = require("redis");
const async_lock_1 = __importDefault(require("async-lock"));
const redisClient = (0, redis_1.createClient)({
    url: "redis://localhost:6379",
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const lock = new async_lock_1.default();
const requestStatusMap = new Map();
const connectToRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.connect();
        console.log("Connected to Redis");
    }
    catch (err) {
        console.error("Error connecting to Redis:", err);
        process.exit(1); // Exit the process if connection fails
    }
});
redisClient.on("error", (error) => {
    console.error("Redis client error:", error);
});
const publishMessage = (channel, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.publish(channel, message);
        console.log("Message published successfully");
    }
    catch (e) {
        console.log("Error publishing message:", e);
    }
});
const consumeMessage = (channel) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const consumerClient = (0, redis_1.createClient)({
            url: "redis://localhost:6379",
        });
        yield consumerClient.connect();
        yield consumerClient.subscribe(channel, (message) => {
            console.log("Received message for channel " + channel + ": " + message);
            const messageData = JSON.parse(message);
            lock.acquire("map", () => {
                requestStatusMap.set(messageData.requestId.toString(), "Processed");
            });
            console.log("Consumer map ", requestStatusMap);
        });
    }
    catch (e) {
        console.error("Error consuming message:", e);
    }
});
// Express Endpoints
app.get("/", (req, res) => {
    res.send("Hello world");
});
app.post("/produce", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = Date.now().toString();
    try {
        yield lock.acquire("map", () => {
            requestStatusMap.set(requestId, "Pending");
        });
        yield publishMessage("my-channel", JSON.stringify({
            name: "test",
            timestamp: new Date().toUTCString(),
            requestId: requestId.toString(),
        }));
        res.json({ requestId });
    }
    catch (err) {
        console.error("Error in /produce endpoint:", err);
        res.sendStatus(500);
    }
}));
app.get("/status/:requestId", (req, res) => {
    lock.acquire("map", () => {
        const status = requestStatusMap.get(req.params.requestId.toString()) || "Unknown";
        res.json({ status });
        if (status == "Processed") {
            requestStatusMap.delete(req.params.requestId.toString());
        }
    });
});
// Start both publisher and subscriber
app.listen(3000, () => __awaiter(void 0, void 0, void 0, function* () {
    yield connectToRedis();
    yield consumeMessage("my-channel");
}));

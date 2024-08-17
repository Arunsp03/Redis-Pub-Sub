"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaService = void 0;
const kafkajs_1 = require("kafkajs");
exports.kafkaService = new kafkajs_1.Kafka({
    clientId: "my-app",
    brokers: ["192.168.1.7:9092"],
});

import { Kafka } from "kafkajs";
export const kafkaService=new Kafka({
    clientId: "my-app",
    brokers: ["192.168.1.7:9092"],
});
import express from "express";
import cors from "cors";
import { createClient } from "redis";
import AsyncLock from "async-lock";
const redisClient = createClient({
  url: "redis://localhost:6379",
});

const app = express();
app.use(express.json());
app.use(cors());
const lock = new AsyncLock();
const requestStatusMap = new Map<string, string>();

const connectToRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
    process.exit(1); // Exit the process if connection fails
  }
};

redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

const publishMessage = async (channel: string, message: string) => {
  try {
    await redisClient.publish(channel, message);
    console.log("Message published successfully");
  } catch (e) {
    console.log("Error publishing message:", e);
  }
};

const consumeMessage = async (channel: string) => {
  try {
    const consumerClient = createClient({
      url: "redis://localhost:6379",
    });
    await consumerClient.connect();
    await consumerClient.subscribe(channel, (message) => {
    console.log("Received message for channel " + channel + ": " + message);
    const messageData = JSON.parse(message);

        lock.acquire("map", () => {
            requestStatusMap.set(messageData.requestId.toString(), "Processed");
          });
          console.log("Consumer map ", requestStatusMap);
   
   
    });
  } catch (e) {
    console.error("Error consuming message:", e);
  }
};

// Express Endpoints
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/produce", async (req, res) => {
  const requestId = Date.now().toString();
  try {
    await lock.acquire("map", () => {
        requestStatusMap.set(requestId, "Pending");
    });
    await publishMessage(
      "my-channel",
      JSON.stringify({
        name: "test",
        timestamp: new Date().toUTCString(),
        requestId: requestId.toString(),
      })
    );
   
    res.json({ requestId });
  } catch (err) {
    console.error("Error in /produce endpoint:", err);
    res.sendStatus(500);
  }
});

app.get("/status/:requestId",  (req, res) => {

    lock.acquire("map", () => {
        const status = requestStatusMap.get(req.params.requestId.toString()) || "Unknown";
        res.json({ status });
        if(status=="Processed")
        {
            requestStatusMap.delete(req.params.requestId.toString());
        }
    });
}); 
 
// Start both publisher and subscriber
app.listen(3000, async () => {
  await connectToRedis();
  await consumeMessage("my-channel");
});

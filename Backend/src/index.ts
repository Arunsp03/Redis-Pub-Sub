import express from "express";
import cors from "cors";
import { createClient } from "redis";

const redisClient = createClient({
    url: "redis://localhost:6379"
});

const app = express();
app.use(express.json());
app.use(cors());

const connectToRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis");
    } catch (err) {
        console.error("Error connecting to Redis:", err);
        process.exit(1); // Exit the process if connection fails
    }
};

redisClient.on('error', error => {
    console.error("Redis client error:", error);
});

const publishMessage=async(channel:string,message:string)=>{
    try{
        await redisClient.publish(channel,message);
        console.log("message published successfully");
        
    }
    catch(e){
        console.log("error ",e);
        
    }

}

const consumeMessage=async(channel:string)=>{
    try{
        const consumerClient=createClient({
             url: "redis://localhost:6379"
        })
        await consumerClient.connect();
        await consumerClient.subscribe(channel,(message)=>{
            console.log("received message for message "+channel+" "+message);
            
        })
    }
    catch(e){
        console.error(e);
    }
}

// Express Endpoints
app.get("/", (req, res) => {
    res.send("Hello world");
});

app.post("/produce", async (req, res) => {
    try {
        await publishMessage("my-channel",JSON.stringify({name:"test",timestamp:new Date().toUTCString()}))
        res.sendStatus(200);
    } catch (err) {
        console.error("Error in /produce endpoint:", err);
        res.sendStatus(500);
    }
});

// Start both publisher and subscriber
app.listen(3000, async () => {
    await connectToRedis();
    await consumeMessage("my-channel");
});

import { kafkaService } from "./client";
const init=async()=>{
const admin=kafkaService.admin();
try{
await admin.connect();
await admin.createTopics({
    topics: [
      {
        topic: "Users",
        numPartitions: 1,
      },
    ],
  });
admin.disconnect();
}
catch(ex){
    console.log("error occured "+ex);
    
}
}
init();
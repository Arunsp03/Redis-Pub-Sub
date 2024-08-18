let requestId="test";
const submit=async ()=>{
const response=await  fetch("http://localhost:3000/produce",{
        method:'POST',
        headers:{
            'Content-Type':"application/json"
        },
        body:JSON.stringify({name:"test"})
    });
const status=await response.json();
requestId=status.requestId;
let intervalid;
const checkStatus = async () => {
    const response = await fetch(`http://localhost:3000/status/${requestId}`);
    const data = await response.json();
    console.log("Message status:", data.status);

    if (data.status == "Processed") {
        console.log("if")
        clearInterval(intervalid)
    } else {
        
        // Continue polling or handle other states
    }
};

// Poll every 5 seconds
intervalid=setInterval(checkStatus, 2000);     
}

 
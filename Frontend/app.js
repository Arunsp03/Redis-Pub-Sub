const submit=async ()=>{
 fetch("http://localhost:3000/produce",{
        method:'POST',
        headers:{
            'Content-Type':"application/json"
        },
        body:JSON.stringify({name:"test"})
    }).then((data)=>{
        console.log(data);
        
    }).catch((ex)=>{
        console.error(ex);
    })
    
   // console.log("submitted");
    
}
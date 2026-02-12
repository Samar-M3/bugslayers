const app=require("./app")
const express=require("express")
const dotenv=require("dotenv")
dotenv.config({quiet:true})
const mongoose=require("mongoose")
port=process.env.PORT
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log('database connected');
    app.listen(port,()=>{
        console.log(`app is running on port ${port}`);
    })
}).catch((err)=>{
    console.log(err);
    
})






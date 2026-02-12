const mongoose=require("mongoose")
const ObjectId=mongoose.Schema.Types.ObjectId
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["driver","superadmin"],
        default:"driver"
    },
    photo:{
        type:String,
        default:"https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe" // Default avatar
    },
    passwordResetToken: String,
    passwordResetExpires: Date
})

const User=mongoose.model("User",userSchema)
module.exports=User


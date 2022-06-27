const mongoose = require("mongoose");
const chatSchema=mongoose.Schema({
    sender:String,//sender id
    message:{
        _id:String,//message_id
        text:String,//message_content
        createdAt:String,
    }
})
module.exports=mongoose.model("Chats",chatSchema)
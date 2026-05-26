const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://godjet97:123abc@donedeal.08o2les.mongodb.net/?appName=DoneDeal")
const db = mongoose.connection;
db.once("open", ()=>{
    console.log("Connected to DB")
})
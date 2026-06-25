require("dotenv").config();
const mongoose = require('mongoose')
const express = require("express")
const userRouter = require("./routes/userRoute")
const serviceController = require("./controllers/serviceController");
const cors = require("cors")


const app = express();
const port = process.env.PORT


mongoose.connect(process.env.MONGODB_URI)

mongoose.connection.once("open", ()=>{
    console.log("Connected to DB")
    app.listen(port, ()=>{
        console.log("Listening on port", port)
    })
})

app.use(cors({
    origin: '*',
    exposedHeaders: ['Authorization']
}))
app.use(express.json())

app.use("/users", userRouter)
app.get("/services/:serviceId/comments", serviceController.getComments)

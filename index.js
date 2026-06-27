require("dotenv").config();
const mongoose = require('mongoose')
const express = require("express")
const userRouter = require("./routes/userRoute")
const serviceRouter = require("./routes/serviceRoute")
const orderRouter = require("./routes/orderRoute")
const serviceController = require("./controllers/serviceController");
const cors = require("cors")
const userController = require("./controllers/userController");
const orderController = require("./controllers/orderController");



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
app.use("/services", serviceRouter)
app.use("/orders", orderRouter)
app.get("/dealers",userController.getAllDealers)
//ghudswxhguwsxdxshgwdu

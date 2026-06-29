require("dotenv").config();

const setupSwagger = require("./swagger.js"); 
const mongoose = require('mongoose')
const express = require("express")
const userRouter = require("./routes/userRoute")
const serviceRouter = require("./routes/serviceRoute")
const orderRouter = require("./routes/orderRoute")
const cors = require("cors")
const userController = require("./controllers/userController");



const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    exposedHeaders: ['Authorization']
}))
app.use(express.json())

setupSwagger(app);

mongoose.connect(process.env.MONGODB_URI)

mongoose.connection.once("open", ()=>{
    console.log("Connected to DB")
    app.listen(port, ()=>{
        console.log("Listening on port", port)
        console.log(`Swagger UI disponibile su http://localhost:${port}/swagger`)
    })
})

app.use("/users", userRouter)
app.use("/services", serviceRouter)
app.use("/orders", orderRouter)
app.get("/dealers",userController.getAllDealers)

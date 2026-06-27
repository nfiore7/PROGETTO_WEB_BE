const express = require("express")
const orderController = require("../controllers/orderController")
const auth = require("../controllers/authMiddleware");
const orderRouter = express.Router();

orderRouter.post("/checkout", auth, orderController.createOrder)
orderRouter.post("/:_id/pay", auth, orderController.payOrder)
orderRouter.get("/:_id", auth, orderController.getOrder)
orderRouter.patch("/:_id", auth, orderController.updateOrder)






module.exports = orderRouter
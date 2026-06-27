const express = require("express")
const orderController = require("../controllers/orderController")
const auth = require("../controllers/authMiddleware");
const orderRouter = express.Router();

orderRouter.post("/checkout", orderController.createOrder)
orderRouter.get("/:orderId", orderController.getOrder)

module.exports = orderRouter
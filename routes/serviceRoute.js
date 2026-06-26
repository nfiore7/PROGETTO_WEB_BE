const express = require("express")
const serviceController = require("../controllers/serviceController")
const auth = require("../controllers/authMiddleware");
const serviceRouter = express.Router();

serviceRouter.get("/", serviceController.getAllServices)
serviceRouter.get("/:serviceId", serviceController.getService)
serviceRouter.get("/:serviceId/comments", serviceController.getComments)


module.exports = serviceRouter
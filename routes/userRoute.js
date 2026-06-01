const express = require("express")
const userController = require("../controllers/userController");
const userRouter = express.Router()


userRouter.get("/:_id", userController.getUser)
userRouter.get("/dealers", userController.getAllDealers)
userRouter.patch("/:_id", userController.updateUser)

module.exports = userRouter;
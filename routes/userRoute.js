const express = require("express")
const userController = require("../controllers/userController");
const serviceController = require("../controllers/serviceController");
const userRouter = express.Router()

userRouter.get("/dealers",userController.getAllDealers)
userRouter.get("/allusers", userController.getAllUsers)
userRouter.get("/profession/:profession", userController.getUserByProfession)
userRouter.get("/:_id", userController.getUser)
userRouter.post("/new", userController.createUser)
userRouter.post("/:_id/service/new", serviceController.createService)
userRouter.patch("/:_id/service/:serviceId", serviceController.updateService)
userRouter.post("/:_id/service/:serviceId/comment", serviceController.addComment)
userRouter.patch("/:_id", userController.updateUser)


module.exports = userRouter;
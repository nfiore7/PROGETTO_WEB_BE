const express = require("express")
const userController = require("../controllers/userController");
const serviceController = require("../controllers/serviceController");
const userRouter = express.Router()

userRouter.get("/dealers",userController.getAllDealers)
userRouter.get("/allusers", userController.getAllUsers)
userRouter.get("/professions/:profession", userController.getUserByProfession)
userRouter.get("/:_id", userController.getUser)
userRouter.post("/new", userController.createUser)
userRouter.post("/:_id/services/new", serviceController.createService)
userRouter.patch("/:_id/services/:serviceId", serviceController.updateService)
userRouter.post("/:_id/services/:serviceId/comments/new", serviceController.addComment)
userRouter.patch("/:_id/services/:serviceId/comments/:commentId", serviceController.updateComment)
userRouter.patch("/:_id", userController.updateUser)


module.exports = userRouter;
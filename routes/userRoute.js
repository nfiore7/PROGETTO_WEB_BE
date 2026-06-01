const express = require("express")
const userController = require("../controllers/userController");
const userRouter = express.Router()


userRouter.get("/dealers",userController.getAllDealers)
userRouter.get("/allusers", userController.getAllUsers)
userRouter.get("/profession/:profession", userController.getUserByProfession)
userRouter.get("/:_id", userController.getUser)
userRouter.post("/new", userController.createUser)
userRouter.patch("/:_id", userController.updateUser)

module.exports = userRouter;
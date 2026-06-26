const express = require("express")
const userController = require("../controllers/userController");
const serviceController = require("../controllers/serviceController");
const auth = require("../controllers/authMiddleware");
const login = require("../controllers/login");
const userRouter = express.Router()

userRouter.post("/login", login)
userRouter.get("/allusers",userController.getAllUsers)
userRouter.get("/professions/:profession", userController.getUserByProfession)
userRouter.get("/:_id",userController.getUser)
userRouter.post("/new", userController.createUser)
userRouter.post("/:_id/services/new", serviceController.createService)
userRouter.get("/:userId/services", auth, serviceController.getMyServices)
userRouter.patch("/:_id/services/:serviceId", auth,serviceController.updateService)
userRouter.post("/:_id/services/:serviceId/comments/new", serviceController.addComment)
userRouter.patch("/:_id/services/:serviceId/comments/:commentId", auth,serviceController.updateComment)
userRouter.patch("/:_id", auth,userController.updateUser)
userRouter.delete("/:_id", auth, userController.deleteUser)


module.exports = userRouter;
import { Router } from "express";
import { getCurrentUser, updateUserController } from "../controllers/user.controller";
import { upload } from "../configs/cloudinary.config";

const userRoute = Router();

userRoute.get('/current' , getCurrentUser );
userRoute.put(
  "/update",
  upload.single("profilePicture"),
  updateUserController
);

export default userRoute;
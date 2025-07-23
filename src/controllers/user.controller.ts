import { Request, Response } from "express";
import { AsyncHandler } from "../middleware/AsyncHandler.middleware";
import { findByIdUserService, updateUserService } from "../services/user.service";
import { HTTPSTATUS } from "../configs/Https.config";
import { updateUserSchema } from "../validator/user.validator";

export const getCurrentUser = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = req?.user?._id;

    const user = await findByIdUserService(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "User fetched Sucessfully",
      user,
    });
  }
);


export const updateUserController = AsyncHandler(
  async (req: Request, res: Response) => {
    const body = updateUserSchema.parse(req.body);
    const userId = req.user?._id;
    const profilePic = req.file;

    const user = await updateUserService(userId, body, profilePic);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile updated successfully",
      data: user,
    });
  }
);
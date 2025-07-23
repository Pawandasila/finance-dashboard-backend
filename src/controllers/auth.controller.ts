import { NextFunction, Request, Response } from "express";
import { AsyncHandler } from "../middleware/AsyncHandler.middleware";
import { HTTPSTATUS } from "../configs/Https.config";

import { loginService, registerService } from "../services/auth.service";
import {
  UserLoginSchema,
  UserRegisterSchema,
} from "../validator/auth.validator";

export const UserRegister = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = UserRegisterSchema.parse(req.body);

    const result = await registerService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User registered successfully",
      data: result,
    });
  }
);

export const UserLogin = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = UserLoginSchema.parse(req.body);

    const { accessToken, expiresAt, reportSetting, user } =
      await loginService(body);

    return res.status(HTTPSTATUS.OK).json({
      message: "user Logged in sucessfully",
      user,
      accessToken,
      expiresAt,
      reportSetting,
    });
  }
);

import mongoose from "mongoose";
import User from "../models/user.models";
import { NotFoundException, UnauthorizedException } from "../utils/AppError";
import { LoginService, RegisterService } from "../validator/auth.validator";
import ReportSettingModel, {
  ReportFrequencyEnum,
} from "../models/Repor-setting.models";
import { calculateNextReportDate } from "../utils/helper";
import { SignJwtToken } from "../utils/jwt";

export const registerService = async (body: RegisterService) => {
  const { email } = body;

  const session = await mongoose.startSession();

  try {
    const reuslt = await session.withTransaction(async () => {
      const existingUser = await User.findOne({ email }).session(session);

      if (existingUser) {
        throw new UnauthorizedException("User with this email already exists");
      }

      const newUser = new User({
        ...body,
      });

      await newUser.save({ session });

      const reportSetting = new ReportSettingModel({
        userId: newUser?._id,
        frequency: ReportFrequencyEnum.MONTHLY,
        isEnabled: true,
        lastSentDate: null,
        nextReportDate: calculateNextReportDate(),
      });
      await reportSetting.save({ session });

      return {
        user: newUser.ommitPassword(),
      };
    });

    return reuslt;
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
};

export const loginService = async (body: LoginService) => {
  try {
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user) throw new NotFoundException("User does not exists");

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
        throw new UnauthorizedException("Invalid Access");
    }

    const { token, expiresAt } = SignJwtToken({ userId: user.id });

    const reportSetting = await ReportSettingModel.findOne(
      { userId: user.id },
      { _id: 1, frequency: 1, isEnabled: 1 }
    ).lean();

    return {
        user : user.ommitPassword(),
        accessToken : token,
        expiresAt : expiresAt,
        reportSetting
    }
  } catch (error) {
    throw error
  }
};

import User from "../models/user.models";
import { NotFoundException } from "../utils/AppError";
import { UpdateUserType } from "../validator/user.validator";

export const findByIdUserService = async (userId: string) => {
  const user = await User.findById(userId);
  return user?.ommitPassword();
};

export const updateUserService = async (
  userId: string,
  body: UpdateUserType,
  profilePic?: Express.Multer.File
) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundException("User not found");

  if (profilePic) {
    user.profilePicture = profilePic.path;
  }

  user.set({
    name: body.name,
  });

  await user.save();

  return user.ommitPassword();
};
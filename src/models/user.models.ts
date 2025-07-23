import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashPassword } from "../utils/bcrypt";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  profilePicture?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
  ommitPassword: () => Omit<UserDocument, "password">;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      select: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }
  }
  next();
});

userSchema.methods.ommitPassword = function (): Omit<UserDocument, "password"> {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return compareValue(password, this.password);
};

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
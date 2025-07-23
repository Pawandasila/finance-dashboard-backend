import { Router } from "express";
import { UserLogin, UserRegister } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post('/register' , UserRegister);
authRoutes.post('/login' , UserLogin);

export default authRoutes;
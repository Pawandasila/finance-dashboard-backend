import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import './configs/passport.config'
import { Env } from "./configs/env.config";
import cors from "cors";
import { HTTPSTATUS } from "./configs/Https.config";
import { ErrorHandler } from "./middleware/ErrorHandler.middleware";
import morgan from "morgan";
import helmet from "helmet";
import { AsyncHandler } from "./middleware/AsyncHandler.middleware";
import DatabaseConnect from "./configs/database.config";
import authRoutes from "./routes/auth.route";
import passport from "passport";
import userRoute from "./routes/user.route";
import { passportAuthenticateJwt } from "./configs/passport.config";
import transactionRouter from "./routes/transaction.route";
import { startJobs } from "./crons/scheduler";
import { initializeCrons } from "./crons";
import reportRoutes from "./routes/report.route";
import analyticsRoutes from "./routes/analytics.route";


const app = express();

const BASE_PATH = Env.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize())

app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(helmet({
    crossOriginResourcePolicy: false
}));

startJobs();

app.get(
  "/",
  AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // throw new NotFoundException();
    const date = new Date();

    res.status(HTTPSTATUS.OK).json({
      message: "Hello World",
      date
    });
  })
);

app.use(`${BASE_PATH}/auth` , authRoutes);
app.use(`${BASE_PATH}/user` , passportAuthenticateJwt ,userRoute);
app.use(`${BASE_PATH}/transaction` , passportAuthenticateJwt ,transactionRouter);
app.use(`${BASE_PATH}/report` , passportAuthenticateJwt ,reportRoutes);
app.use(`${BASE_PATH}/analytics` , passportAuthenticateJwt ,analyticsRoutes);





app.use(ErrorHandler);

app.listen(Env.PORT, async () => {
  await DatabaseConnect();
  await initializeCrons();
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userrouter from "./routes/User.routes.js";
import videorouter from "./routes/Videos.routes.js";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userrouter);
app.use("/api/v2/video", videorouter);
export default app;

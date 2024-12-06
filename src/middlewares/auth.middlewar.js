import { User } from "../models/User.models.js";
import ApiError from "../utils/apierror.js";
import asyncHanlder from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHanlder(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!accessToken) {
      throw new ApiError(401, "unauthorized request accessToken");
    }
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log("decodedtoken ==>", decodedToken);

    const user = await User.findById(decodedToken?._id).select(["_id"]);
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    const data = await user.toObject();
    console.log("data ==>", data);
    req.user = await user.toObject();
    req.tokenData = decodedToken;
    next();
  } catch (error) {
    console.log("verifyJWT:: error ==>", error.message);

    throw new ApiError(401, error?.message || "Invaild access accessToken");
  }
});

import asyncHanlder from "../utils/asyncHandler.js";
import ApiError from "../utils/apierror.js";
import { User } from "../models/User.models.js";
import uploadOnCloudinery from "../utils/cloudinary.js";
import apirespones from "../utils/apirespones.js";

const registerUser = asyncHanlder(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  // });
  try {
    const { username, email, password, fullname } = req.body;
    console.log("req.body ==>", req.body);
    if (
      [fullname, email, password, username].some(
        (filed) => filed?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fileds are  required");
    }
    const exittedUSer = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (exittedUSer) {
      throw new ApiError(409, "User with email or username is already exists");
    }
    const avatarLocalPath =
      (req.files?.avatar && req.files?.avatar[0]?.path) || null;
    const coverimagePath =
      req.files?.coverImage && req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required ");
    }

    const avatrSize = (req.files?.avatar && req.files?.avatar[0].size) || null;
    const coverSize =
      (req.files?.coverImage && req.files?.coverImage[0].size) || null;
    console.log("avatrSize ==>", avatrSize);
    if (avatrSize > 1048576 || coverSize > 1048576) {
      throw new ApiError(400, "Avatar file is too large.");
    }
    console.log("avatarLocalPath ==>", avatarLocalPath);
    console.log("coverimagePath ==>", coverimagePath);
    const avatar = await uploadOnCloudinery(avatarLocalPath);
    const coverImage = await uploadOnCloudinery(coverimagePath);

    if (!avatar && !coverImage) {
      throw new ApiError(400, "Avatar  and coverimage fileds is required");
    }
    console.log("avatar ==>", avatar);
    console.log("coverimage==>", coverImage);

    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage.url,
      email,
      password,
      username: username.toLowerCase(),
    });
    console.log("user ==>", user);
    const createduser = await User.findById(user._id).select([
      "-password",
      "-refreshToken",
    ]);
    console.log("createduser ==>", createduser);
    if (!createduser) {
      throw new ApiError(500, "somthing went wrong register ");
    }
    return res
      .status(201)
      .json(new apirespones(200, createduser, "User registered Successfully"));
  } catch (error) {
    console.log("registerUser error ==>", error);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

export default registerUser;

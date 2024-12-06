import asyncHanlder from "../utils/asyncHandler.js";
import ApiError from "../utils/apierror.js";
import { User } from "../models/User.models.js";
import uploadOnCloudinery from "../utils/cloudinary.js";
import apirespones from "../utils/apirespones.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "somthing went wrong  while generting ");
  }
};
const registerUser = asyncHanlder(async (req, res) => {
  try {
    const { username, email, password, fullname } = req.body;

    if (
      [fullname, email, password, username].some(
        (filed) => filed?.trim() === ""
      )
    ) {
      return res.status(409).json("All filed are requried");
    }
    const exittedUSer = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (exittedUSer) {
      return res
        .status(409)
        .json("User with email or username is already exists.");
    }

    const avatarLocalPath =
      (req.files?.avatar && req.files?.avatar[0]?.path) || null;
    const coverimagePath =
      req.files?.coverImage && req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
      return res.status(409).json("Avatar file is requried");
    }

    const avatrSize = (req.files?.avatar && req.files?.avatar[0].size) || null;
    const coverSize =
      (req.files?.coverImage && req.files?.coverImage[0].size) || null;

    if (avatrSize > 1048576 || coverSize > 1048576) {
      return res.status(409).json("Avatar and cover file lager");
    }

    const avatar = await uploadOnCloudinery(avatarLocalPath);
    const coverImage = await uploadOnCloudinery(coverimagePath);

    if (!avatar && !coverImage) {
      return res.status(400).json("Avatar  and coverimage fileds is required");
    }

    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage.url,
      email,
      password,
      username,
    });

    const createduser = await User.findById(user._id).select([
      "-password",
      "-refreshToken",
    ]);

    if (!createduser) {
      return res.status(409).json("Somthig went wrong");
    }
    return res
      .status(201)
      .json(new apirespones(200, createduser, "User registered Successfully"));
  } catch (error) {
    console.log("registerUser error ==>", error);
    return res.status(500).json({ error });
  }
});

const loginUser = asyncHanlder(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(409).json("email is alreay exites");
    }
    const user = await User.findOne({
      $or: [{ email }],
    });

    if (!user) {
      return res.status(409).json("user dose not exites");
    }
    const isPasswordvailed = await user.isPasswordCorrect(password);
    if (!isPasswordvailed) {
      return res.status(409).json("invaild password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findOne(user._id).select([
      "-password",
      "-refreshToken",
    ]);
    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new apirespones(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.log("registerUser error ==>", error);
    return res.status(500).json({ error });
  }
});
const logoutuser = asyncHanlder(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new apirespones(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHanlder(async (req, res) => {
  const incomingrefreshToken = req.cookies?.refreshToken;
  console.log("incomingrefreshtoekn ==>", incomingrefreshToken);
  if (!incomingrefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("decode token", decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invaild refresh token");
    }
    if (incomingrefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log("user._id ==>", user._id);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apirespones(
          200,
          { accessToken, refreshToken },
          "Access token and refresh token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHanlder(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw ApiError(400, "user not found");
  }
  const PasswordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!PasswordCorrect) {
    throw new ApiError(400, "Invalid Old password ");
  }
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apirespones(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHanlder(async (req, res) => {
  const loggedInUser = await User.findOne(req.user._id).select([
    "-password",
    "-refreshToken",
  ]);
  return res
    .status(200)
    .json(
      new apirespones(200, loggedInUser, "current user Fatched  successfully")
    );
});

const updateAccountDetails = asyncHanlder(async (req, res) => {
  console.log("req.body ==>", req.body);
  const { fullname, email, username, oldpassword, newpassword } = req.body;
  console.log("oldpassword ==>", oldpassword);
  if (!oldpassword) {
    throw new ApiError(400, "Old password is required");
  }
  if (!newpassword) {
    throw new ApiError(400, "newpassword is required");
  }
  if (!username) {
    throw new ApiError(400, "username is required");
  }
  if (!email) {
    throw new ApiError(400, "email is required");
  }
  if (!fullname) {
    throw new ApiError(400, "fullname is required");
  }
  if (!oldpassword || !newpassword || !fullname || !email || !username) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw ApiError(400, "user not found");
  }
  const PasswordCorrect = await user.isPasswordCorrect(oldpassword);

  console.log("passwordCorrect ==>", PasswordCorrect);
  if (!PasswordCorrect) {
    throw new ApiError(400, "Invalid Old password ");
  }
  if (email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ApiError(400, "Email is already in use by another account");
    }
  }
  if (username !== user.username) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ApiError(400, "Username is already taken by another account");
    }
  }
  user.password = newpassword;
  user.fullname = fullname;
  user.email = email;
  user.username = username;

  try {
    await user.save();
  } catch (error) {
    throw new ApiError(500, "Failed to update user details");
  }
  return res
    .status(200)
    .json(new apirespones(200, user, "Account  details  updated successfully"));
});
const updateUserAvatar = asyncHanlder(async (req, res) => {
  const avatarLocalpath = req.file?.path;
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinery(avatarLocalpath);
  console.log("avatar.url ==>", avatar.url);
  if (!avatar.url) {
    throw new ApiError(400, "Avatar upload failed");
  }
  console.log("updateUserAvatar:: avatar file  ==>", req.user?._id);
  const { _id } = req.user;
  const user = await User.findOneAndUpdate(
    { _id },
    { avatar: avatar.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apirespones(200, user, "Avatar image updated successfully"));
});
const updateUserCoverImage = asyncHanlder(async (req, res) => {
  const coverImageLocalpath = req.file?.path;
  if (!coverImageLocalpath) {
    throw new ApiError(400, "cover file is missing");
  }
  const coverImage = await uploadOnCloudinery(coverImageLocalpath);

  if (!coverImage.url) {
    throw new ApiError(400, "cover upload failed");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { coverImage: coverImage.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apirespones(200, user, "cover image updated successfully"));
});
const getUserChannelProfile = asyncHanlder(async (req, res) => {
  const { username } = req.query;
  console.log("username ==>", req.user._id);
  console.log("username ....==>", username);
  if (!username?.trim()) {
    throw new ApiError(400, "not valied user");
  }
  console.log("username?.toLowerCase() ==>", username?.toLowerCase());
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedto",
      },
    },
    {
      $addFields: {
        subscriptionCount: {
          $size: "$subscribers",
        },
        channelsubscribedToCount: {
          $size: "$subscribedto",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?.id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriptionCount: 1,
        channelsubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  console.log("channel  ==>", channel);
  if (!channel.length) {
    throw new ApiError(404, "channel does not exits");
  }
  return res
    .status(200)
    .json(new apirespones(200, channel[0], "user channel fetched succesfully"));
});
const getwatchHistory = asyncHanlder(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                  $addFields: {
                    owner: {
                      $arrayElemAt: ["$owner", 0],
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new apirespones(
        200,
        user[0].wathchHistory,
        "watch  history  fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutuser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getwatchHistory,
  getUserChannelProfile,
};

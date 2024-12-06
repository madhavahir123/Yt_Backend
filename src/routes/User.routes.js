import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutuser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  getUserChannelProfile,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getwatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewar.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutuser);
router.post("/refresh-token", refreshAccessToken);
router.get("/getCurrentUser", verifyJWT, getCurrentUser);
router.put("/updateprofile", verifyJWT, updateAccountDetails);
router.put("/passwordchange", verifyJWT, changeCurrentPassword);
router.get("/c/:username", verifyJWT, getUserChannelProfile);
router.put(
  "/updateavatar",
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);
router.put(
  "/updatecoverimg",
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
);
router.get("/Hisroty", verifyJWT, getwatchHistory);

export default router;

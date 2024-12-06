import { Router } from "express";
import { getvideo, videoadded } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewar.js";

const router = Router();
router.use(verifyJWT);

router.route("/videoadd").post(
  upload.fields([
    {
      name: "thumbanil",
      maxCount: 1,
    },
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  videoadded
);
router.get("/getvideo", getvideo);
export default router;

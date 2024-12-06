import Video from "../models/Video.models.js";
import asyncHanlder from "../utils/asyncHandler.js";
import uploadOnCloudinery from "../utils/cloudinary.js";
import apirespones from "../utils/apirespones.js";

const videoadded = asyncHanlder(async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    if ([title, description].some((filed) => filed?.trim() === "")) {
      return res.status(409).json("All filed are requried");
    }
    const thumbanilLocalPath =
      (req.files?.thumbanil && req.files?.thumbanil[0]?.path) || null;
    const videos = req.files?.videoFile && req.files?.videoFile[0]?.path;

    if (!videos) {
      return res.status(409).json("video file is requried");
    }
    const thumbanil = await uploadOnCloudinery(thumbanilLocalPath);
    const video = await uploadOnCloudinery(videos);
    if (!thumbanil && !video) {
      return res.status(400).json("thumbanil  and video fileds is required");
    }

    const newVideo = await Video.create({
      title,
      description,
      duration,
      thumbanil: thumbanil?.url,
      videoFile: video.url,
      owner: req.user._id,
    });

    const populatedVideo = await Video.findById(newVideo._id).populate(
      "owner",
      "username"
    );

    if (!populatedVideo) {
      return res.status(400).json("video not created");
    }
    return res
      .status(201)
      .json(new apirespones(200, populatedVideo, "video add Successfully"));
  } catch (error) {
    console.log("video add error ==>", error);
    return res.status(500).json({ error });
  }
});

const getvideo = asyncHanlder(async (req, res) => {
  try {
    const videos = await Video.find().populate("owner", "username");
    if (!videos || videos.length === 0) {
      return res
        .status(404)
        .json(new apirespones(404, null, "No videos found"));
    }
    return res
      .status(200)
      .json(new apirespones(200, videos, "Videos fetched successfully"));
  } catch (error) {
    console.error("Error fetching videos: ", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching videos" });
  }
});

export { videoadded, getvideo };

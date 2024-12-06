import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

const uploadOnCloudinery = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //console.log("local patha ==>", localFilePath);
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("respone video ==>", response);
    fs.unlinkSync(`./${localFilePath}`);
    return response;
  } catch (error) {
    console.log("uploadOnCloudinery error ==>", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export default uploadOnCloudinery;

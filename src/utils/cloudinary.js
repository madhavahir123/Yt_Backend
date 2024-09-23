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
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file is upload ion clouediney", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temproary file as the upload operation got failed
    return null;
  }
};

export default uploadOnCloudinery;

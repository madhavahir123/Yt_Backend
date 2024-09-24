import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Public/temp");
  },
  filename: function (req, file, cb) {
    // cb(null, file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Extract the original file extension (e.g., .jpg, .png)
    const ext = path.extname(file.originalname);

    // Set a new filename, e.g., 'file-1638473895930-132456789.png'
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

export const upload = multer({ storage });

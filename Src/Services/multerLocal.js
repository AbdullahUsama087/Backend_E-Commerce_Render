import multer from "multer";
import path from "path";
import fs from "fs";
import allowedExtensions from "../Utils/allowedExtensions.js";

function multerFunction(allowedExtensionsArr, customPath) {
  if (!allowedExtensionsArr) {
    allowedExtensionsArr = allowedExtensions.Image;
  }
  if (!customPath) {
    customPath = "General";
  }

  // ============== Custom Path =================
  const destinationPath = path.resolve(`Uploads/${customPath}`);

  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }
  
  // ============== Storage =================

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });

  // ============== File Filter =================

  const fileFilter = (req, file, cb) => {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid Extension File", { cause: 400 }), false);
    }
  };

  const fileUpload = multer({ fileFilter, storage }); // if no storage the file will be uploaded in memory
  return fileUpload;
}

export default multerFunction;

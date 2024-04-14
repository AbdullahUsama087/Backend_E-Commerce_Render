import multer from "multer";
import allowedExtensions from "../Utils/allowedExtensions.js";

function multerCloud(allowedExtensionsArr) {
  if (!allowedExtensionsArr) {
    allowedExtensionsArr = allowedExtensions.Image;
  }

  // ============== Storage =================
  const storage = multer.diskStorage({});

  // ============== File Filter =================

  const fileFilter = (req, file, cb) => {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file Extension", { cause: 400 }), false);
    }
  };

  // ============== File Upload =================

  const fileUpload = multer({ storage, fileFilter });
  return fileUpload;
}

export default multerCloud
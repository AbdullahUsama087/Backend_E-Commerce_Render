import cloudinary from "./cloudinaryConfigurations.js";

function asyncHandler(API) {
  return (req, res, next) => {
    API(req, res, next).catch(async (err) => {
      console.error(err);
      // ============== Delte failed Document from Cloudinary ==============
      if (req.method !== "GET") {
        if (req.imagePath) {
          console.log(req.imagePath);
          // Delete Images from All folders
          await cloudinary.api.delete_resources_by_prefix(req.imagePath);
          // Delete empty folders
          await cloudinary.api.delete_folder(req.imagePath);
        }
      }
      // ============== Delte failed Document from DataBase ==============
      if (req.failedDocument) {
        const { model, _id } = req.failedDocument;
        await model.findByIdAndDelete(_id);
      }

      return next(new Error("Error", { cause: 500 }));
    });
  };
}

const globalErrorResponse = (err, req, res, next) => {
  if (err) {
    if (req.validationErrorArr) {
      return res
        .status(err.cause || 400)
        .json({ message: req.validationErrorArr });
    }
    return res.status(err.cause || 500).json({ message: err.message });
  }
};

const globalNotFoundPageError = (req, res, next) => {
  return next(new Error("Page Not Found", { cause: 404 }));
};

export { asyncHandler, globalErrorResponse, globalNotFoundPageError };

import userModel from "../../DataBase/Models/user.model.js";
import { generateToken, verifyToken } from "../Utils/tokenFunctions.js";

function isAuth(roles) {
  return async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      // Check Authorization
      if (!authorization) {
        return next(new Error("Please SignIn", { cause: 400 }));
      }

      // Check on Authorization Perfix
      if (!authorization.startsWith(process.env.TOKEN_PERFIX)) {
        return next(new Error("Invalid Token Perfix", { cause: 400 }));
      }

      // Split Token
      const splittedToken = authorization.split(" ")[1];

      try {
        // Verify Token
        const decodedData = verifyToken({
          token: splittedToken,
          signature: process.env.SIGN_IN_TOKEN,
        });

        // Check on Decoded Token
        if (!decodedData || !decodedData.Id) {
          return next(new Error("Invalid Token", { cause: 400 }));
        }
        // Check on User SignUp
        const findUser = await userModel.findById(
          decodedData.Id,
          "email userName role"
        );
        if (!findUser) {
          return next(new Error("Please SignUp", { cause: 400 }));
        }
        // Check Authorization Condition
        if (!roles.includes(findUser.role)) {
          return next(
            new Error("UnAuthorized to access this API", { cause: 401 })
          );
        }
        req.authUser = findUser;
        next();
      } catch (error) {
        // Check on Expiration Token
        if (error == "TokenExpiredError: jwt expired") {
          // Refresh token
          const user = await userModel.findOne({ token: splittedToken });
          if (!user) {
            return next(new Error("Fail Expiration Token", { cause: 400 }));
          }

          // Generate a new token
          const userToken = generateToken({
            payload: { email: user.email, Id: user._id },
            signature: process.env.SIGN_IN_TOKEN,
            expiresIn: "1h",
          });
          if (!userToken) {
            return next(new Error("Fail to generate token", { cause: 400 }));
          }
          // Update Refreshed Token in database
          await userModel.findOneAndUpdate(
            { token: splittedToken },
            { token: userToken },
            { new: true }
          );
          res
            .status(200)
            .json({ message: "Token Refreshed Successfully", userToken });
        } else {
          next(new Error("Wrong Token"));
        }
      }
    } catch (err) {
      console.error(err);
      next(new Error("Authentication Error", { cause: 500 }));
    }
  };
}

async function isAuthGraphQL(authorization, roles) {
  try {
    // Check Authorization
    if (!authorization) {
      return new Error("Please SignIn", { cause: 400 });
    }
    // Check on Authorization Perfix
    if (!authorization.startsWith(process.env.TOKEN_PERFIX)) {
      return new Error("Invalid Token Perfix", { cause: 400 });
    }

    // Split Token
    const splittedToken = authorization.split(" ")[1];

    try {
      // Verify token
      const decodedData = verifyToken({
        token: splittedToken,
        signature: process.env.SIGN_IN_TOKEN,
      });

      // Check on Decoded Token
      if (!decodedData || !decodedData.Id) {
        return new Error("Invalid Token", { cause: 400 });
      }

      const findUser = await userModel.findById(
        decodedData.Id,
        "email userName role"
      );
      if (!findUser) {
        return new Error("Please SignUp", { cause: 400 });
      }

      // Check on Authorization Condition
      if (!roles.includes(findUser.role)) {
        return new Error("UnAuthorized User", { cause: 401 });
      }

      return {
        code: 200,
        findUser,
      };
    } catch (error) {
      // Check on Expiration Token
      if (error == "TokenExpiredError: jwt expired") {
        // Refresh Token
        const user = await userModel.findOne({ token: splittedToken });
        if (!user) {
          return new Error("Fail Expiration Token", { cause: 400 });
        }

        // Generate new Token
        const userToken = generateToken({
          payload: { email: user.email, Id: user._id },
          signature: process.env.SIGN_IN_TOKEN,
          expiresIn: "1h",
        });
        if (!userToken) {
          return new Error("Fail to Generate Token", { cause: 400 });
        }

        // Update Refreshed Token in Database
        await userModel.findOneAndUpdate(
          { token: splittedToken },
          { token: userToken },
          { new: true }
        );

        return res
          .status(200)
          .json({ message: "Token Refreshed Successfully", userToken });
      }
      new Error("Wrong Token", { cause: 500 });
    }
  } catch (err) {
    console.error(err);
    new Error("Authentication Error", { cause: 500 });
  }
}

export { isAuth, isAuthGraphQL };

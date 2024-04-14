// to load the module (jwt) only one time
import jwt from "jsonwebtoken";

// ===================== Generate Token =================

function generateToken({
  payload = {},
  signature = process.env.DEFAULT_TOKEN,
  expiresIn = "1d",
} = {}) {
  // Check if the payload is empty
  if (!Object.keys(payload).length) {
    return false;
  }
  const token = jwt.sign(payload, signature, { expiresIn });
  return token;
}

// ===================== Verify Token =================

function verifyToken({
  token = "",
  signature = process.env.DEFAULT_TOKEN,
} = {}) {
  // Check if no token is provided
  if (!token) {
    return false;
  }
  const decodedData = jwt.verify(token, signature);
  return decodedData;
}

export { generateToken, verifyToken };

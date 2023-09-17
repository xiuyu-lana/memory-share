import jwt from "jsonwebtoken";

import HttpError from "../models/http-error";

export default (req, res, next) => {
    if(req.method === "OPTIONS"){
        return next();
    }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: "bearer TOKEN"
    if (!token) {
      throw new Error("Authentication failed!");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 403));
  }
};

import express from "express";
import { check } from "express-validator";

import { getAllUsers, signUp, logIn } from "../controllers/users-controller";
import fileUpload from "../middleware/file-upload";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);

userRouter.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signUp
);

userRouter.post("/login", logIn);

export default userRouter;

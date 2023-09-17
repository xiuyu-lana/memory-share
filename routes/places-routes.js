import express from "express";
import { check } from "express-validator";
import bcrypt from "bcryptjs/dist/bcrypt";

import fileUpload from "../middleware/file-upload";
import checkAuth from "../middleware/check-auth";

import {
  getPlaceById,
  getPlacesByUserId,
  creatPlace,
  updatePlace,
  deletePlace,
} from "../controllers/places-controller";

const placeRouter = express.Router();

placeRouter.get("/:pid", getPlaceById);

placeRouter.get("/user/:uid", getPlacesByUserId);

placeRouter.use(checkAuth);

placeRouter.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  creatPlace
);

placeRouter.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
);

placeRouter.delete("/:pid", deletePlace);

export default placeRouter;

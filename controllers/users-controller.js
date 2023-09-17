import { validationResult } from "express-validator";
import User from "../models/user";
import jwt from "jsonwebtoken";

import HttpError from "../models/http-error";
import bcrypt from "bcryptjs/dist/bcrypt";

export const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // do not include the password in return values
  } catch (err) {
    return next(
      new HttpError("Failed to fetch the users, please try again later", 500)
    );
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

export const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs, please check your data", 422));
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  if (existingUser) {
    return next(new HttpError("User exists already, please log in", 422));
  } // code 422 : invalid user input

  let hashPassword;
  try {
    hashPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "30m" }
    );
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  res.status(201);
  res.json({ userId: createdUser.id, email: createdUser.email, token: token });
};

export const logIn = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later", 500)
    );
  }

  if (!existingUser) {
    return next(
      new HttpError(
        "Could not identify user, please check the e-mail address and the password",
        403
      )
    );
  }

  let isValidPassword = false;
  try {
    // console.log("pass:",password);
    // console.log()
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        "Could not log you in, please check the credentials and try again",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError(
        "Could not identify user, please check the e-mail address and the password",
        401
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "30m" }
    );
  } catch (err) {
    console.log("err:",err);
    return next(
      new HttpError("Logging in failed, please try again later", 500)
    );
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token: token });
};

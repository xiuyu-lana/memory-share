import { v4 as uuidv4 } from "uuid";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import fs from "fs";

import HttpError from "../models/http-error";
import { getCoordsForAddress } from "../utils/location";
import Place from "../models/place";
import User from "../models/user";

export const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong with the database, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find a place for the provided user id", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

export const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // {pid: p1}
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong with the database, could not find a place",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided place id", 404)
    ); // for asynchronous code
  }

  res.json({ place: place.toObject({ getters: true }) }); // {place} <==> {place:place}
};

export const creatPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs. Please check your input", 422));
  }

  const { title, description, address } = req.body;
  // const title = req.body.title, description = req.body.description ......

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title: title,
    description: description,
    location: coordinates,
    address: address,
    image: req.file.path,
    creator: req.userData.userId, // short for creator : creator
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Failed to create a new place, please try again", 422)
    );
  }

  if (!user) {
    return next(
      new HttpError("Could not find a user for the given user Id", 404)
    );
  }
  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    // the push method here is a special method provided by mongoose, it only push the properties with the same type
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Failed to creat a new place, please try again",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace.toObject({ getters: true }) }); // code 201: creat something successfully
};

export const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs. Please check your input", 422));
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong with the database, could not update the place",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError(
        "Action not allowed! You are not the creator of this place."
      ),
      401
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, the update could not be saved", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};
export const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong with the database, could not delete the place",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("Deletion failed! The place doesn't exist", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(
      new HttpError(
        "Action not allowed! You are not the creator of this place."
      ),
      401
    );
  }

  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Place.findByIdAndRemove(placeId, { session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong with the database, could not delete the place",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "A place has been deleted" });
};

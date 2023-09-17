import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import placesRoutes from "./routes/places-routes";
import usersRoutes from "./routes/users-routes";
import HttpError from "./models/http-error";

// const express = require('express');
// const bodyParser = require('body-parser');
// const placesRoutes = require('./routes/places-routes');

const server = express();

server.use(bodyParser.json());

server.use("/uploads/images", express.static(path.join("uploads", "images")));

server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

server.use("/api/places", placesRoutes); // route the paths starting with the given path
server.use("/api/users", usersRoutes);

server.use((req, res, next) => {
  throw new HttpError("Could not find this route", 404);
});

server.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (error) => {
      console.log(error);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ka6dpyv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    server.listen(process.env.PORT || 5000);
  })
  .catch((err) => console.log(err));

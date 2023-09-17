import Axios from "axios";

import HttpError from "../models/http-error";

const APT_KEY = process.env.GOOGLE_API_KEY;

export async function getCoordsForAddress(address) {
  const response = await Axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${APT_KEY}`
  );

  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError("Could not find a place for the address provided", 422);
  }

  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

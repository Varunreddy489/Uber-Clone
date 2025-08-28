import axios from "axios";
import { serverConfig } from "../config";

export const getWeather = async (latitude: number, longitude: number) => {
  try {
    const options = {
      method: "GET",
      url: "https://open-weather13.p.rapidapi.com/city",
      params: {
        latitude: latitude.toString,
        longitude: longitude.toString,
        lang: "EN",
      },
      headers: {
        "x-rapidapi-key": serverConfig.OPEN_WEATHER_KEY,
        "x-rapidapi-host": "open-weather13.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

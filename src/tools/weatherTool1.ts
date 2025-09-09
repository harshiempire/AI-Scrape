// src/tools/weatherTool.ts

import axios from 'axios';
import { z } from 'zod';
import { Tool, ToolInput, ToolOutput } from '../core/tool';
import path from 'path';
import fs from 'fs';

// Helper function to log errors to a file
function logErrorToFile(message: string, error: any) {
  const logPath = path.resolve(process.cwd(), "weatherTool-errors.log");
  const timestamp = new Date().toISOString();
  const errorMsg =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.stack || error.message
      : JSON.stringify(error, null, 2);
  const logEntry = `[${timestamp}] ${message}\n${errorMsg}\n\n`;
  try {
    fs.appendFileSync(logPath, logEntry, "utf8");
  } catch (fileErr) {
    console.error("Failed to write to error log file:", fileErr);
  }
}

export class WeatherTool {
  static createTool(): Tool {
    return new Tool({
      name: 'weather',
      description: 'Fetches weather information for a given location',
      schema: z.object({ location: z.string() }),
      func: async (input: ToolInput): Promise<ToolOutput> => {
        const { location } = input;
        return await this.fetchWeather(location);
      },
    });
  }

  private static async fetchWeather(location: string) {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    try {
      // Step 1: Get coordinates from the location name
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${'2d87cce480bdfcf06cd9e6100ff473b3'}`;
      const geoResponse = await axios.get(geoUrl);
      const geoData = geoResponse.data;

      if (!geoData || geoData.length === 0) {
        throw new Error('Location not found');
      }

      const { lat, lon } = geoData[0];

      // Step 2: Get weather data using the coordinates
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${'68cf87f14586394b8807c5f891177d2c'}&units=metric`;
      const weatherResponse = await axios.get(weatherUrl);
      const weatherData = weatherResponse.data;

      return {
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        city: weatherData.name,
        country: weatherData.sys.country,
        coordinates: { lat, lon },
      };
    } catch (error) {
      const msg = "Error fetching weather data:";
      console.error(msg, error);
      logErrorToFile(msg, error);
      throw new Error('Failed to fetch weather data');
    }
  }
}

const weatherTool = WeatherTool.createTool();
(async () => {
  const result = await weatherTool.run({ location: "Weather of hyderabad" });
  console.log("Search results:", result);
})();
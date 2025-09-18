// src/tools/weatherTool.ts

import axios from 'axios';
import { z } from 'zod';
import { Tool, ToolInput, ToolOutput } from '../core/tool';
import * as path from 'path';
import * as fs from 'fs';

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
    const apiKey = '91ba7caa4d14493ba46130529250709'; // Use your actual API key

    try {
      // Step 1: Get weather data using the location
      const weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=no`;
      const weatherResponse = await axios.get(weatherUrl);
      const weatherData = weatherResponse.data;

      return {
        temperature: weatherData.current.temp_c,
        description: weatherData.current.condition.text,
        city: weatherData.location.name,
        country: weatherData.location.country,
        coordinates: { lat: weatherData.location.lat, lon: weatherData.location.lon },
      };
    } catch (error) {
      const msg = "Error fetching weather data:";
      console.error(msg, error);
      logErrorToFile(msg, error);
      throw new Error('Failed to fetch weather data');
    }
  }}

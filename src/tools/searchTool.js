// src/tools/searchTool.ts
import { z } from "zod";
import { Tool } from "../core/tool.js";
import axios from "axios";
import { getJson } from "serpapi";
import fs from "fs";
import { fetchRenderedHtml } from "./renderHtml.js";
import path from "path";
import { parseHtmlToMarkdown } from "./htmlParse.js"; // Assuming ParsedPage is exported
// Helper function to log errors to a file
function logErrorToFile(message, error) {
    const logPath = path.resolve(process.cwd(), "searchTool-errors.log");
    const timestamp = new Date().toISOString();
    const errorMsg = typeof error === "string"
        ? error
        : error instanceof Error
            ? error.stack || error.message
            : JSON.stringify(error, null, 2);
    const logEntry = `[${timestamp}] ${message}\n${errorMsg}\n\n`;
    try {
        fs.appendFileSync(logPath, logEntry, "utf8");
    }
    catch (fileErr) {
        // If logging fails, at least print to console
        console.error("Failed to write to error log file:", fileErr);
    }
}
export class SearchTool {
    static createTool() {
        return new Tool({
            name: "search",
            description: "Search the web for information",
            schema: z.object({ query: z.string() }),
            func: async (input) => {
                const { query } = input;
                return { results: await this.search(query) };
            },
        });
    }
    static async search(query) {
        try {
            const linksResponse = await this.searchSerpApi(query);
            console.log(linksResponse);
            const organicResults = Array.isArray(linksResponse?.["organic_results"])
                ? linksResponse["organic_results"] : [];
            if (organicResults.length === 0) {
                throw new Error("No organic results found from search API.");
            }
            const links = organicResults
                // .slice(0, 2)
                .map((item) => {
                if (item &&
                    typeof item === "object" &&
                    "link" in item &&
                    typeof item.link === "string") {
                    return item.link;
                }
                return null;
            })
                .filter((link) => typeof link === "string");
            // Use the new smart fetching and parsing strategy
            const parsedResults = await this.smartFetchAndParse(links);
            fs.writeFileSync("htmlResults_final.json", JSON.stringify(parsedResults, null, 2));
            console.log(parsedResults);
            return parsedResults;
        }
        catch (error) {
            const msg = "Error in search:";
            console.error(msg, error);
            logErrorToFile(msg, error);
            return {
                error: error.message || "Unknown error during search.",
            };
        }
    }
    /**
     * Implements a hybrid fetching and parsing strategy.
     * It tries a fast static fetch first, and if the content is poor,
     * it falls back to a full rendered fetch.
     */
    static async smartFetchAndParse(links) {
        const allPromises = links.map((link) => (async () => {
            const staticHtml = await this.getStaticHtml(link);
            let parsed = parseHtmlToMarkdown(staticHtml);
            if (parsed.markdownContent.length < 250) {
                console.log(`[!] Static content for ${link} is too short. Falling back to rendered fetch.`);
                const renderedHtml = await fetchRenderedHtml(link);
                parsed = parseHtmlToMarkdown(renderedHtml);
            }
            return parsed;
        })());
        const outcomes = await Promise.allSettled(allPromises);
        const results = [];
        for (let i = 0; i < outcomes.length; i++) {
            const o = outcomes[i];
            if (o.status === "fulfilled") {
                results.push(o.value);
            }
            else {
                const msg = `Error processing link ${links[i]}:`;
                console.error(msg, o.reason);
                logErrorToFile(msg, o.reason);
                results.push({
                    title: `Error processing ${links[i]}`,
                    markdownContent: o.reason?.message ?? "Unknown error",
                });
            }
        }
        return results;
    }
    static async searchSerpApi(query) {
        try {
            const response = await getJson({
                engine: "google_light",
                q: query,
                location: "India",
                google_domain: "google.co.in",
                hl: "en",
                gl: "in",
                api_key: process.env.SERPAPI_API_KEY,
            });
            return response;
        }
        catch (error) {
            const msg = "Error in searchSerpApi:";
            console.error(msg, error);
            logErrorToFile(msg, error);
            throw new Error(error.message || "Failed to fetch results from SerpApi.");
        }
    }
    static async getStaticHtml(link) {
        const response = await axios.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            },
        });
        return response.data;
    }
}
const searchTool = SearchTool.createTool();
(async () => {
    const result = await searchTool.run({ query: "Mouli actor Little Hearts 2025" });
    console.log("Search results:", result);
})();
export default searchTool;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHtmlToMarkdown = parseHtmlToMarkdown;
var cheerio = require("cheerio");
var TurndownService = require("turndown");
// --- Turndown Configuration ---
var turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});
//💡 IMPROVEMENT #1: Remove distracting links that are just icons or empty wrappers.
turndownService.addRule("removeDistractingLinks", {
    filter: function (node, options) {
        var _a, _b;
        if (node.nodeName === "A" && node.getAttribute("href")) {
            var content = (_b = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
            var hasImg = node.querySelector("img") !== null;
            // Target links that are empty or only contain an image (likely an icon).
            return content === "" && (hasImg || node.children.length === 0);
        }
        return false;
    },
    replacement: function () { return ""; }, // Remove the link entirely from the output.
});
function parseHtmlToMarkdown(html) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var $ = cheerio.load(html);
    // --- Metadata Extraction (largely unchanged) ---
    var title = $("head > title").text().trim() || undefined;
    var description = (_b = (_a = $('meta[name="description"]').attr("content")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : undefined;
    var canonical = (_d = (_c = $('link[rel="canonical"]').attr("href")) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : undefined;
    var author = (_f = (_e = $('meta[name="author"]').attr("content")) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : undefined;
    var featuredImage = (_h = (_g = $('meta[property="og:image"]').attr("content")) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : undefined;
    var publishDate = ((_j = $('meta[property="article:published_time"]').attr("content")) === null || _j === void 0 ? void 0 : _j.trim()) ||
        ((_k = $("time").attr("datetime")) === null || _k === void 0 ? void 0 : _k.trim()) ||
        undefined;
    $('script[type="application/ld+json"]').each(function (i, el) {
        var _a;
        try {
            var jsonData = JSON.parse($(el).html() || "{}");
            publishDate = publishDate || jsonData.datePublished;
            author = author || ((_a = jsonData.author) === null || _a === void 0 ? void 0 : _a.name);
        }
        catch (e) {
            if (e instanceof Error) {
                console.warn("Skipping malformed JSON-LD: ".concat(e.message));
            }
        }
    });
    // 💡 IMPROVEMENT #2: Use a more comprehensive list of primary content selectors.
    var contentSelectors = [
        "article", ".article", ".article-content", ".article-body",
        ".post-content", ".entry-content", "[role='article']",
        "main", "#main", "#main-content", ".main-content", "#content",
    ];
    var $content = $(contentSelectors.join(", ")).first();
    // If no specific content container is found, fallback to body but clean it heavily.
    if (!$content.length || $content.text().trim().length < 200) {
        $content = $("body");
    }
    // 💡 IMPROVEMENT #3: Use a much more extensive and aggressive list of selectors to remove.
    var selectorsToRemove = [
        // Standard clutter
        "header", "footer", "nav", "aside", "form", "script", "style", "noscript",
        // Common IDs and classes for non-content sections
        "#header", "#footer", "#nav", "#sidebar", "#comments", ".header", ".footer", ".nav", ".sidebar", ".comments", ".related-posts", ".pagination",
        // Banners, popups, and ads
        ".cookie-banner", ".cookie-notice", ".popup", ".modal", ".ads", ".advertisement", ".ad-container",
        // Social sharing & interactive UI
        ".social-links", ".share-buttons", "button", '[role="button"]', '[role="navigation"]', '[role="search"]',
        // Visually hidden or irrelevant for content
        '[aria-hidden="true"]', '.sr-only', '.visually-hidden',
        // Site-specific clutter (add more as needed)
        // Wikipedia
        ".infobox", ".navbox", ".sistersitebox", ".ambox", "#catlinks", ".mw-editsection", ".reference",
        // IMDb
        '[class*="RatingBar"]', '[data-testid*="recommendations"]', '.ipc-lockup-card', '.contribution-section',
    ];
    $content.find(selectorsToRemove.join(", ")).remove();
    // 💡 IMPROVEMENT #4: Add specific pre-processing steps to clean up common issues.
    // Remove empty elements left behind after their contents are removed.
    $content.find("p, div, section, ul, li").each(function (i, el) {
        var $el = $(el);
        if ($el.text().trim() === "" && $el.children().length === 0) {
            $el.remove();
        }
    });
    // Remove elements that are often just decorative or UI-related.
    $content.find("svg, iframe").remove();
    var htmlContent = $content.html();
    var markdownContent = "";
    if (htmlContent) {
        markdownContent = turndownService.turndown(htmlContent);
        // Clean up excessive newlines and whitespace.
        markdownContent = markdownContent
            .replace(/(\n\s*){3,}/g, "\n\n")
            .replace(/!\[\]\(data:image.*?\)/g, '') // Remove base64 images
            .trim();
    }
    return {
        title: title,
        canonical: canonical,
        description: description,
        publishDate: publishDate,
        author: author,
        featuredImage: featuredImage,
        markdownContent: markdownContent,
    };
}

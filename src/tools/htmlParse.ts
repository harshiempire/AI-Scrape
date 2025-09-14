import * as cheerio from "cheerio";
import TurndownService from "turndown";

// --- Turndown Configuration ---
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

//💡 IMPROVEMENT #1: Remove distracting links that are just icons or empty wrappers.
turndownService.addRule("removeDistractingLinks", {
  filter: (node: any, options: any) => {
    if (node.nodeName === "A" && node.getAttribute("href")) {
      const content = node.textContent?.trim() ?? "";
      const hasImg = node.querySelector("img") !== null;
      // Target links that are empty or only contain an image (likely an icon).
      return content === "" && (hasImg || node.children.length === 0);
    }
    return false;
  },
  replacement: () => "", // Remove the link entirely from the output.
});

export interface ParsedPage {
  title?: string;
  canonical?: string;
  description?: string;
  publishDate?: string;
  author?: string;
  featuredImage?: string;
  markdownContent: string;
}

export function parseHtmlToMarkdown(html: string): ParsedPage {
  const $ = cheerio.load(html);

  // --- Metadata Extraction (largely unchanged) ---
  const title = $("head > title").text().trim() || undefined;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ?? undefined;
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ?? undefined;
  let author = $('meta[name="author"]').attr("content")?.trim() ?? undefined;
  const featuredImage =
    $('meta[property="og:image"]').attr("content")?.trim() ?? undefined;
  let publishDate =
    $('meta[property="article:published_time"]').attr("content")?.trim() ||
    $("time").attr("datetime")?.trim() ||
    undefined;

  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonData = JSON.parse($(el).html() || "{}");
      publishDate = publishDate || jsonData.datePublished;
      author = author || jsonData.author?.name;
    } catch (e) {
      if (e instanceof Error) {
        console.warn(`Skipping malformed JSON-LD: ${e.message}`);
      }
    }
  });

  // 💡 IMPROVEMENT #2: Use a more comprehensive list of primary content selectors.
  const contentSelectors = [
    "article", ".article", ".article-content", ".article-body",
    ".post-content", ".entry-content", "[role='article']",
    "main", "#main", "#main-content", ".main-content", "#content",
  ];
  let $content = $(contentSelectors.join(", ")).first();

  // If no specific content container is found, fallback to body but clean it heavily.
  if (!$content.length || $content.text().trim().length < 200) {
    $content = $("body");
  }

  // 💡 IMPROVEMENT #3: Use a much more extensive and aggressive list of selectors to remove.
  const selectorsToRemove = [
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
  $content.find("p, div, section, ul, li").each((i, el) => {
    const $el = $(el);
    if ($el.text().trim() === "" && $el.children().length === 0) {
      $el.remove();
    }
  });

  // Remove elements that are often just decorative or UI-related.
  $content.find("svg, iframe").remove();


  const htmlContent = $content.html();
  let markdownContent = "";

  if (htmlContent) {
    markdownContent = turndownService.turndown(htmlContent);
    // Clean up excessive newlines and whitespace.
    markdownContent = markdownContent
      .replace(/(\n\s*){3,}/g, "\n\n")
      .replace(/!\[\]\(data:image.*?\)/g, '') // Remove base64 images
      .trim();
  }

  return {
    title,
    canonical,
    description,
    publishDate,
    author,
    featuredImage,
    markdownContent,
  };
}
// ─────────────────────────────────────────────────────────────────────────────
// ELEVENTY CONFIGURATION
// This file configures how Eleventy builds your static site
// Documentation: https://www.11ty.dev/docs/config/
// ─────────────────────────────────────────────────────────────────────────────

// 📦 Plugin Imports
const pluginImages = require("@codestitchofficial/eleventy-plugin-sharp-images");
const pluginMinifier = require("@codestitchofficial/eleventy-plugin-minify");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { I18nPlugin } = require("@11ty/eleventy");

// ⚙️ Configuration Files
const configImages = require("./src/config/plugins/images");
const configI18n = require("./src/config/plugins/i18n");

// 🔧 Processing Functions
const javascript = require("./src/config/processors/javascript");

// 🛠️ Utilities
const filterPostDate = require("./src/config/filters/postDate");
const filterIsoDate = require("./src/config/filters/isoDate");
const isProduction = process.env.ELEVENTY_ENV === "PROD";


module.exports = function (eleventyConfig) {
    // ═════════════════════════════════════════════════════════════════════════
    // LANGUAGES
    // Using Eleventy's build events to process non-template languages
    // Learn more: https://www.11ty.dev/docs/events/
    // ═════════════════════════════════════════════════════════════════════════

    /*
     * JavaScript Processing
     * These processors handle bundling, transpiling, and minification
     * - JavaScript: Compiled with esbuild for modern bundling
     */
    eleventyConfig.on("eleventy.after", javascript);

    // ═════════════════════════════════════════════════════════════════════════
    // PLUGINS
    // Extend Eleventy with additional functionality
    // Learn more: https://www.11ty.dev/docs/plugins/
    // ═════════════════════════════════════════════════════════════════════════

    /*
     * 🖼️ Image Optimization
     * Resize and optimize images for better performance using {% getUrl %}
     * Documentation: https://github.com/CodeStitchOfficial/eleventy-plugin-sharp-images
     */
    eleventyConfig.addPlugin(pluginImages, configImages);

    /*
     * 🧭 Navigation Plugin
     * Enables hierarchical navigation structure via front matter
     * Documentation: https://www.11ty.dev/docs/plugins/navigation/
     */
    eleventyConfig.addPlugin(pluginNavigation);

    /*
     * 🌍 Internationalization (i18n) Plugin
     * Adds support for translating content and generating localized URLs
     * Documentation: https://www.11ty.dev/docs/plugins/i18n/
     */
    eleventyConfig.addPlugin(I18nPlugin, configI18n);

    /*
     * 📦 Production Minification
     * Minifies HTML, CSS, JSON, XML, XSL, and webmanifest files
     * Only runs during production builds (npm run build)
     * Documentation: https://github.com/CodeStitchOfficial/eleventy-plugin-minify
     */
    if (isProduction) {
        eleventyConfig.addPlugin(pluginMinifier);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PASSTHROUGH COPIES
    // Copy files directly to output without processing
    // Learn more: https://www.11ty.dev/docs/copy/
    // ═════════════════════════════════════════════════════════════════════════

    eleventyConfig.addPassthroughCopy("./src/assets"); // Static assets
    eleventyConfig.addPassthroughCopy("./src/admin"); // CMS admin files
    eleventyConfig.addPassthroughCopy("./src/_redirects"); // Redirect rules

    // ═════════════════════════════════════════════════════════════════════════
    // FILTERS
    // Transform data in templates at build time
    // Learn more: https://www.11ty.dev/docs/filters/
    // ═════════════════════════════════════════════════════════════════════════

    /*
     * 📅 Human-Readable Date Formatting Filter
     * Converts JavaScript dates to human-readable format
     * Usage: {{ "2023-12-02" | postDate }}
     * Powered by Luxon: https://moment.github.io/luxon/api-docs/
     */
    eleventyConfig.addFilter("postDate", filterPostDate);

    /*
     * 📅 ISO Date Formatting Filter
     * Converts JavaScript dates to ISO 8601 format
     * Usage: {{ "2023-12-02" | isoDate }}
     * Powered by Luxon: https://moment.github.io/luxon/api-docs/
     */
    eleventyConfig.addFilter("isoDate", filterIsoDate);

    /*
     * 🔢 Limit Filter
     * Returns a limited number of items from the beginning of an array
     * Usage: {{ collection | limit(5) }}
     * Useful for truncating lists, e.g. showing only the latest N items
     */
    eleventyConfig.addFilter("limit", function (array, limit) {
        return array.slice(0, limit);
    });

    /*
     * 🏷️ Page Language Filter
     * Filters collections by the current page language for i18n compatibility
     * Usage: {{ collections.all | pageLang | eleventyNavigation }}
     */
    eleventyConfig.addFilter("pageLang", function (value) {
        return value.filter(item => item.page.lang === this.page.lang)
    });

    /**
     * 🔍 Multi-Property Equality Filter
     * Filters a collection based on multiple property-value pairs.
     * Supports nested properties like "eleventyNavigation.parent".
     * Usage:
     *   {{ collections.all | whereAll({ category: "skola", "eleventyNavigation.parent": "Škola" }) }}
     */
    eleventyConfig.addFilter("whereAll", function (collection, conditions = {}) {
        if (!Array.isArray(collection)) return [];

        // Helper for nested props like "eleventyNavigation.parent"
        function getDeep(obj, path) {
            return path.split(".").reduce((acc, key) => acc && acc[key], obj);
        }

        return collection.filter((item) => {
            return Object.entries(conditions).every(([prop, expected]) => {
                const actual = getDeep(item.data, prop);
                return actual === expected;
            });
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SHORTCODES
    // Generate dynamic content with JavaScript
    // Learn more: https://www.11ty.dev/docs/shortcodes/
    // ═════════════════════════════════════════════════════════════════════════

    /*
     * 📆 Current Year Shortcode
     * Outputs the current year (useful for copyright notices)
     * Usage: {% year %}
     * Updates automatically with each build
     */
    eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

    // ═════════════════════════════════════════════════════════════════════════
    // BUILD CONFIGURATION
    // Define input/output directories and template engine
    // ═════════════════════════════════════════════════════════════════════════

    return {
        dir: {
            input: "src", // Source files directory
            output: "public", // Build output directory
            includes: "_includes", // Partial templates directory
            data: "_data", // Global data files directory
        },
        htmlTemplateEngine: "njk", // Nunjucks for HTML templates
    };
};

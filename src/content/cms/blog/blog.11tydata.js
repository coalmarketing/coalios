const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();

module.exports = {
	layout: "layouts/post.njk",
	tags: "blog",

	eleventyComputed: {
		preloadImg: (data) => data.image,
		permalink: (data) => `/blog/${data.url}/index.html`,
		readingTime: (data) => {
			// Average reading speed (words per minute)
			const WORDS_PER_MINUTE = 200;

			// Get raw blog post content
			const raw = data.page.rawInput;

			// Convert markdown to plain text
			const html = md.render(raw);
			const text = html.replace(/<[^>]*>/g, ""); // remove any HTML tags

			// Count words
			const wordCount = text
				.trim()
				.split(/\s+/)
				.filter(Boolean).length;

			// Calculate minutes (minimum 1)
			return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
		},
	},
};
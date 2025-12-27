const plugin = require("tailwindcss/plugin");

module.exports = plugin(function ({ addUtilities }) {
    addUtilities({
        // 0px 1px 0px rgb(0 0 0 / 0.15)
        ".text-shadow-2xs": {
            textShadow: "var(--text-shadow-2xs)",
        },

        // 0px 1px 1px rgb(0 0 0 / 0.2)
        ".text-shadow-xs": {
            textShadow: "var(--text-shadow-xs)",
        },

        // 0px 1px 0px rgb(0 0 0 / 0.075),
        // 0px 1px 1px rgb(0 0 0 / 0.075),
        // 0px 2px 2px rgb(0 0 0 / 0.075)
        ".text-shadow-sm": {
            textShadow: "var(--text-shadow-sm)",
        },

        // 0px 1px 1px rgb(0 0 0 / 0.1),
        // 0px 1px 2px rgb(0 0 0 / 0.1),
        // 0px 2px 4px rgb(0 0 0 / 0.1)
        ".text-shadow-md": {
            textShadow: "var(--text-shadow-md)",
        },

        // 0px 1px 2px rgb(0 0 0 / 0.1),
        // 0px 3px 2px rgb(0 0 0 / 0.1),
        // 0px 4px 8px rgb(0 0 0 / 0.1)
        ".text-shadow-lg": {
            textShadow: "var(--text-shadow-lg)",
        },

        // Removes text-shadow entirely
        ".text-shadow-none": {
            textShadow: "none",
        },
    });
});
const esbuild = require("esbuild");
const { glob } = require("glob");

const isProduction = process.env.ELEVENTY_ENV === "PROD";

// Files to exclude from esbuild processing - Cookie Consent by default
const excludeFiles = ["cookieconsent-config.js", "cookieconsent.umd.js"];

module.exports = async function () {
    let files = await glob("src/assets/js/**/*.js");

    // Filter out excluded files
    files = files.filter(file => {
        return !excludeFiles.some(excluded =>
            file.endsWith(`/` + excluded) || file.endsWith(`\\` + excluded) || file.endsWith(excluded)
        );
    });

    await esbuild.build({
        entryPoints: files,
        outdir: "./public/assets/js",
        write: true,
        bundle: true,
        minify: isProduction,
        sourcemap: !isProduction,
        target: isProduction ? "es6" : "esnext",
        format: "esm"
    });
};
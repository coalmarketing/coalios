# Senoweb Website Template

Tato šablona slouží jako základ pro tvorbu moderních, rychlých a plně přizpůsobitelných webových stránek. Vychází z repozitáře [CodeStitch Intermediate Website Kit (LESS)](https://github.com/CodeStitchOfficial/Intermediate-Website-Kit-LESS), ale byla upravena a rozšířena pro potřeby ručně vyvíjených webů na míru v rámci **Senoweb**.

Hlavní změny oproti původní šabloně:
- Použití **Tailwind CSS** místo LESS (včetně pluginů pro formuláře, typografii a vlastní scrollbar).
- Integrace **Decap CMS** pro správu obsahu přímo v prohlížeči.
- Podpora **automatické optimalizace obrázků** pomocí `@codestitchofficial/eleventy-plugin-sharp-images` a `codestitch-sharp-image-automation`.
- Přidány pluginy pro **sitemapu, minifikaci a cache**.
- Využití **fluid-tailwind** pro responzivní a flexibilní typografii.
- Moderní build proces postavený na **esbuild**, PostCSS a CSSNano.
- Připraveno pro nasazení na **Netlify** (včetně pluginu pro cache).


## Funkce

- ⚡ **Rychlý start** – Eleventy (11ty) jako statický generátor webu.
- 🎨 **Tailwind CSS** – utility-first přístup ke stylování.
- 🖼️ **Optimalizace obrázků** – automatické generování více formátů a velikostí.
- ✍️ **Decap CMS** – snadná správa obsahu bez nutnosti zasahovat do kódu.
- 📄 **SEO-ready** – generování sitemap, čistý kód a minifikace.
- 🔧 **Snadný vývoj** – připravené skripty pro build a lokální server.
- 🚀 **Netlify podpora** – jednoduché nasazení s využitím pluginů.


## Požadavky

- [Node.js](https://nodejs.org/) (doporučeno LTS)
- [npm](https://www.npmjs.com/)


## Instalace

1. Naklonujte repozitář:

   ```bash
   git clone https://github.com/nula1337/Senoweb-Website-Template.git
   cd Senoweb-Website-Template
   ```

2. Nainstalujte závislosti:

    ```bash
   npm install
   ```

3. Spusťte vývojový server:

    ```bash
   npm start
   ```
   To spustí Eleventy, Tailwind a Decap CMS zároveň.

## Build

Pro produkční build spusťte:

```bash
npm run build
```
- HTML soubory jsou generovány pomocí Eleventy do složky `public`.
- CSS je minifikováno a optimalizováno pomocí Tailwind + PostCSS + CSSNano.
- Obrázky jsou optimalizovány pomocí pluginů Sharp.


## Struktura projektu

```
.
├── src/ # Zdrojové soubory
│ ├── _includes/ # Šablony a partials pro Eleventy
│ ├── assets/ # CSS, JS, obrázky
│ └── content/ # Obsah spravovaný přes CMS
├── public/ # Výstupní složka (build)
├── .eleventy.js # Konfigurace Eleventy
├── tailwind.config.js # Konfigurace Tailwindu
├── package.json
└── netlify.toml # Konfigurace pro Netlify
```
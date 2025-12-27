module.exports = {
  name: "coalios s.r.o.",
  email: "info@coalios.cz",
  ico: "11998831",
  phoneForTel: "+420602326793",
  phoneFormatted: "+420 602 326 793",
  address: {
    lineOne: "U Stadionu 923",
    city: "Letohrad",
    zip: "56151",
    mapLink: "https://maps.app.goo.gl/9ohZ2t39WcibtzYNA",
  },
  socials: {
    facebook: "https://www.facebook.com/coalfamily/",
    instagram: "https://www.instagram.com/coalfamily_/",
    linkedin: "https://www.linkedin.com/company/coalios/"
  },
  //! Make sure you include the file protocol (e.g. https://) and that NO TRAILING SLASH is included
  domain: "https://coalios.cz",
  // Passing the isProduction variable for use in HTML templates
  isProduction: process.env.ELEVENTY_ENV === "PROD",
};
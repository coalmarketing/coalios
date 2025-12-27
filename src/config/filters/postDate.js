const { DateTime } = require("luxon");

module.exports = function (dateObj) {
    const date = new Date(dateObj);

    return DateTime.fromJSDate(date).setLocale("cs").toLocaleString(DateTime.DATE_MED);
};
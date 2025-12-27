import "./cookieconsent.umd.js";

CookieConsent.run({
    categories: {
        necessary: {
            enabled: true,  // this category is enabled by default
            readOnly: true  // this category cannot be disabled
        },
        analytics: {}
    },

    language: {
        default: "cs",
        translations: {
            cs: {
                consentModal: {
                    title: 'Používáme soubory cookies',
                    description: 'Náš web používá cookies pro zlepšení vašeho zážitku z prohlížení, analýzu návštěvnosti a další funkce.',
                    acceptAllBtn: 'Přijmout vše',
                    acceptNecessaryBtn: 'Odmítnout vše',
                    showPreferencesBtn: 'Spravovat individuální nastavení'
                },
                preferencesModal: {
                    title: 'Správa cookies',
                    acceptAllBtn: 'Přijmout vše',
                    acceptNecessaryBtn: 'Odmítnout vše',
                    savePreferencesBtn: 'Uložit aktuální výběr',
                    closeIconLabel: 'Zavřít okno',
                    sections: [
                        {
                            title: 'O cookies na našem webu',
                            description: 'Cookies jsou malé textové soubory, které se ukládají do vašeho prohlížeče při návštěvě webových stránek. Pomáhají nám zlepšovat funkčnost webu, pamatovat si vaše preference a poskytovat vám relevantnější obsah. Některé cookies jsou nezbytné pro správné fungování stránek, jiné nám pomáhají stránky vylepšovat.'
                        },
                        {
                            title: 'Nezbytně nutné cookies',
                            description: 'Tyto cookies jsou nezbytné pro správné fungování webových stránek a nelze je vypnout.',
                            linkedCategory: 'necessary'
                        },
                        {
                            title: 'Výkonnostní a analytické cookies',
                            description: 'Tyto cookies shromažďují informace o tom, jak používáte náš web. Všechna data jsou anonymizována a nemohou být použita k vaší identifikaci.',
                            linkedCategory: 'analytics'
                        },
                        {
                            title: 'Další informace',
                            description: 'V případě jakýchkoli dotazů ohledně našich zásad používání cookies a vašich možností nás prosím <a href="/kontakt">kontaktujte</a>'
                        }
                    ]
                }
            }
        }
    },

    guiOptions: {
        consentModal: {
            layout: 'box inline',
            position: 'bottom right',
            flipButtons: false,
            equalWeightButtons: true
        },
        preferencesModal: {
            layout: 'box',
            // position: 'left right',
            flipButtons: false,
            equalWeightButtons: true
        }
    }
});
const messages = {
    game_initialize: {
        en: 'Getting game ready.\n\n The current interval for sharing the hunted location is {interval} minutes. You can change it below.\n\n The hunted (person sharing it\'s location) can be set by pressing the button below.\n\n When you are ready, press the button below to start the game.\n\n\n Current hunted: \n {hunted}',
        nl: 'Het spel wordt klaargemaakt.\n\n Het huidige interval voor het delen van de locatie van de voorvluchtige is {interval} minuten. Je kan het hieronder aanpassen.\n\n De voortvluchtige (persoon die zijn locatie deelt) kan ingesteld worden door op de knop hieronder te drukken.\n\n Wanneer je klaar bent, druk op de knop hieronder om het spel te starten.\n\n\n Huidige voortvluchtige: \n {hunted}',
    },
    game_started: {
        en: 'Game started.\n\n The hunted will share it\'s location every {interval} minutes.\n\n Press the button stop to stop the game\n\n\n Current hunted: \n {hunted}',
        nl: 'Het spel is gestart.\n\n De voortvluchtige zal zijn locatie delen elke {interval} minuten.\n\n Druk op de knop stop om het spel te stoppen.\n\n\n Huidige voortvluchtige: \n {hunted}',
    },
    game_stopped: {
        en: 'Game stopped',
        nl: 'Spel gestopt',
    },
    keyboard_join_as_hunted: {
        en: 'Join as hunted',
        nl: 'Voeg je toe als voortvluchtige',
    },
    keyboard_start_game: {
        en: 'Start game',
        nl: 'Start spel',
    },
    keyboard_stop_game: {
        en: 'Stop game',
        nl: 'Stop spel',
    },
    error_game_exists: {
        en: 'Game in this loby already exists',
        nl: 'Er bestaat al een spel in deze lobby',
    },
    error_start_only_in_groups: {
        en: 'This command can only be used in groups',
        nl: 'Dit command kan alleen gebruikt worden in groepen',
    },
}

module.exports = messages;
const loki = require('lokijs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../databases/guild_config.db');

var guild_config = new loki(filePath, {
    autoload: true,
    autoloadCallback : configDatabaseInitialize,
    autosave: true,
    autosaveInterval: 4000
});

function configDatabaseInitialize() {
    var guilds = guild_config.getCollection("guilds");
    if (guilds === null) {
        guilds = guild_config.addCollection("guilds", {
            unique: ["guild_id"],
            autoupdate: true
        });
    }
}

module.exports = { guild_config };
const { dev } = require("../config.json");
const v = dev ? "dev_" : "live_";

class MySQL {
    /**
     * Creates a MySQL connection
     * @param {Object} login Login object in format:
     * { host, user, password, database }
     */
    constructor(login) {
        const config = login;
        config.charset = 'UTF8MB4_GENERAL_CI';
        this.con = require("mysql").createConnection(config);

        this.con.connect(err => {
            if (err) throw err;
            console.log(`Established connection to MySQL server at ${login.host}`);
            this.con.query(`SELECT COUNT(*) FROM \`${v}guilds\``, (error, result) => {
                console.log(`Number of guilds in database: ${result[0]["COUNT(*)"]}.`);
            });
        });

        this.escape = this.con.escape.bind(this.con);
    }
    /**
     * Get rows from table.
     * If this doesnt work in the future, it might be because queryLogic isn't escaped.
     * @param {String} table Table name
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @param {String} sortLogic Ordering logic, e.g. "column_name". Optionally add "DESC" to change order, e.g. "column_name DESC"
     * @param {Number} limit Max number of results
     * @returns {Promise<Array<import("../bot").DBGuildUser>>} Array of objects (found rows)
     */
    async get(table, queryLogic, sortLogic, limit) {
        return new Promise((res) => {
            const query = `SELECT * FROM \`${v+table}\`${queryLogic ? ` WHERE ( ${queryLogic} )` : ``}${sortLogic ? ` ORDER BY \`${sortLogic.split(" ")[0]}\` ${sortLogic.split(" ")[1] || ``}` : ``}${limit ? ` LIMIT ${limit}` : ``}`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                res(result);
            });
        });
    }
    /**
     * Insert data into a table as a new row(s).
     * @param {String} table Table name
     * @param {Object|Array<object>} object Inserted data where `key = collumn` and `value = value`. If an array is passed every object must contain the same keys
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    async insert(table, object) {
        return new Promise((res) => {
            const query = `INSERT INTO \`${v+table}\` (\`${Array.isArray(object) ? Object.keys(object[0]).join("`, `") : Object.keys(object).join("`, `")}\`) VALUES (${Array.isArray(object) ? object.map(element => Object.values(element).map(val => this.escape(val)).join(", ")).join("), (") : Object.values(object).map(obj => this.escape(obj)).join(", ")})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Inserted ${result.affectedRows} rows.`);
                res(result);
            });
        });
    }
    /**
     * Update existing data in a table by row.
     * @param {String} table Table name
     * @param {Object} object Updated data where `key = collumn` and `value = value`
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    async update(table, object, queryLogic) {
        return new Promise((res) => {
            const query = `UPDATE \`${v+table}\` SET ${Object.keys(object).map((key) => `\`${key}\` = ${this.escape(object[key])}`).join(", ")} WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Updated ${result.affectedRows} rows.`);
                res(result);
            });
        });
    }
    /**
     * Delete a row/rows from a table
     * @param {String} table Table name
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    async delete(table, queryLogic) {
        return new Promise((res) => {
            const query = `DELETE FROM \`${v+table}\` WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Removed ${result.affectedRows} rows`);
                res(result);
            })
        });
    }
    //  Specified functions
    /**
     * @typedef {Object} DBUser
     * @property {String}   id           - User ID
     * @property {String}   username     - Username without tag
     * @property {String}   tag          - User tag
     * @property {Boolean}  unsubscribed - Whether user is unsubscribed from DMs
     */
    /**
     * @typedef {Object} DBGuild
     * @property {String}   id         - Guild ID
     * @property {String}   name       - Guild name
     * @property {String}   prefix     - Guild prefix
     * @property {Boolean}  ignoreBots - Whether guild ignores bots
     */
    /**
     * @typedef {Object} DBGuildLevelsystem
     * @property {String}               id              - Guild id
     * @property {Boolean}              enabled         - Whether levelsystem is enabled
     * @property {Array<String>}        ignoredChannels - Stringified array of ignord channel IDs
     * @property {String|Null}          levelupChannel  - Channel ID where levelup messages are sent
     * @property {Discord.MessageEmbed} levelupMessage  - Stringified embed object for levelup
     * @property {Discord.MessageEmbed} newroleMessage  - Stringified embed object for newrole
     * @property {Boolean}              levelupImage    - Whether levelup messages contain an image
     * @property {Boolean}              rolesCumulative - Whether levelup roles are cumulative
     * @property {{Level: String}}      roles           - Stringified object of roles where `key = level` and `value = role ID`
     */
    /**
     * @typedef {Object} DBGuildUser
     * @property {String}         userid     - User ID
     * @property {String}         guildid    - Guild ID
     * @property {Number}         xp         - Total XP
     * @property {Number}         level      - Current level
     * @property {Array<String>}  levelRoles - Stringified array of role IDs of users level roles
     * @property {Array<String>}  roles      - Stringified array of role IDs of user roles
     * @property {Boolean}        inGuild    - Whether or not the user is present in the guild
     */

    /**
     * Adds user to database if they don't exist and returns the database entry
     * @param {Discord.User}  user - DiscordJS user
     * @returns {DBUser} DBUser object
     */
    async getUserInDB(user) {
        const DBUserArr = await this.get("users", `id = ${user.id}`);
        if (!DBUserArr.length) {
            await this.insert("users", {
                id: user.id,
                username: user.username,
                tag: user.tag.slice(-4),
                unsubscribed: false
            });
            return (await this.get("users", `id = ${user.id}`))[0];
        }
        return DBUserArr[0];
    }
    /**
     * Adds guild to database if it doesn't exist and returns the database entry
     * @param {Discord.Guild}  guild - DiscordJS guild
     * @returns {DBGuild} DBGuild object
     */
    async getGuildInDB(guild) {
        const DBGuildArr = await this.get("guilds", `id = ${guild.id}`);
        if (!DBGuildArr.length) {
            await this.insert("guilds", {
                id: guild.id,
                name: guild.name,
                prefix: ".",
                ignoreBots: true
            });
            return (await this.get("guilds", `id = ${guild.id}`))[0];
        }
        return DBGuildArr[0];
    }
    /**
     * Adds guild levelsystem to database if it doesn't exist and returns the database entry
     * @param {Discord.Guild}  guild - DiscordJS guild
     * @returns {DBGuildLevelsystem} DBGuild object
     */
    async getGuildLevelsystemInDB(guild) {
        const DBGuildLevelsystemArr = await this.get("guild-levelsystem", `id = ${guild.id}`);
        if (!DBGuildLevelsystemArr.length) {
            await this.insert("guild-levelsystem", {
                id: guild.id,
                enabled: false,
                ignoredChannels: JSON.stringify([]),
                levelupChannel: null,
                levelupMessage: JSON.stringify({
                    "color": 2215713,
                    "title": "Congratulations {username}, you reached level {level}!",
                    "description": ""
                }),
                newroleMessage: JSON.stringify({
                    "color": 2215713,
                    "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                }),
                levelupImage: true,
                rolesCumulative: false,
                roles: JSON.stringify({})
            });
            return (await this.get("guild-levelsystem", `id = ${guild.id}`))[0];
        }
        return DBGuildLevelsystemArr[0];
    }
    /**
     * Adds guild user to database if they don't exist and returns the database entry
     * @param {Discord.Guild}  guild - DiscordJS guild
     * @param {Discord.User}   member  - DiscordJS member
     * @returns {DBGuildUser} DBGuildUser object
     */
    async getGuildUserInDB(guild, member) {
        const DBGuildUserArr = await this.get("guild-users", `guildid = ${guild.id} AND userid = ${member.id}`);
        if (!DBGuildUserArr.length) {
            const DBGuildLevelsystem = await this.getGuildLevelsystemInDB(guild),
                levelSystemRoles = DBGuildLevelsystem.roles,
                userRoles = (await guild.members.fetch(member.id)).roles.cache.map(item => item.id),
                levelRoles = userRoles.filter(role => levelSystemRoles.includes(role));
            await this.insert("guild-users", {
                userid: member.id,
                guildid: guild.id,
                nickname: member.nickname,
                xp: 0,
                level: 0,
                levelRoles: JSON.stringify(levelRoles),
                roles: JSON.stringify(userRoles),
                inGuild: true
            });
            return (await this.get("guild-users", `guildid = ${guild.id} AND userid = ${member.id}`))[0];
        }
        return DBGuildUserArr[0];
    }
}

module.exports = MySQL;
// Start and stop MySQL server in run > services.msc > Apache2.4 + MySQL on localhost/phpmyadmin

// eslint-disable-next-line no-unused-vars
const Disord = require('discord.js');

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

        console.log("Connecting to MySQL server...");
        this.con.connect(err => {
            if (err) {
                console.error("Connection failed!");
                throw err;
            }
            console.log(`Established connection to MySQL server at ${login.host}`);
            this.con.query(`SELECT COUNT(*) FROM \`guilds\``, (error, result) => {
                if (error) throw error;
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
     * @returns {Promise<Array<import("../bot").DBGuildMember>>} Array of objects (found rows)
     */
    async get(table, queryLogic, sortLogic, limit) {
        return new Promise((res) => {
            const query = `SELECT * FROM \`${table}\`${queryLogic ? ` WHERE ( ${queryLogic} )` : ``}${sortLogic ? ` ORDER BY \`${sortLogic.split(" ")[0]}\` ${sortLogic.split(" ")[1] || ``}` : ``}${limit ? ` LIMIT ${limit}` : ``}`;
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
            const query = `INSERT INTO \`${table}\` (\`${Array.isArray(object) ? Object.keys(object[0]).join("`, `") : Object.keys(object).join("`, `")}\`) VALUES (${Array.isArray(object) ? object.map(element => Object.values(element).map(val => this.escape(val)).join(", ")).join("), (") : Object.values(object).map(obj => this.escape(obj)).join(", ")})`;
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
        if (!queryLogic) throw new Error("Failed to update database. No selector parameter passed, aborting update.");
        return new Promise((res) => {
            const query = `UPDATE \`${table}\` SET ${Object.keys(object).map((key) => `\`${key}\` = ${this.escape(object[key])}`).join(", ")} WHERE (${queryLogic})`;
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
            const query = `DELETE FROM \`${table}\` WHERE (${queryLogic})`;
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
     * @property {String}   id                   - User ID
     * @property {String}   username             - Username without tag
     * @property {String}   tag                  - User tag
     * @property {Boolean}  levelMentions        - Whether user gets mentioned when leveling up (global only)
     * @property {Boolean}  disabled             - Whether user has opted out of Global leaderboard
     * @property {Number}   xp                   - User total xp
     * @property {Number}   level                - User level
     * @property {Number}   coins                - Users coins
     * @property {Number}   badges               - Bitfield value of all unlocked badges
     * @property {Number}   profileBadges        - Bitfield value of all badges displayed on profile
     * @property {Number}   backgrounds          - Bitfield value of all unlocked backgrounds
     * @property {Number}   currentBackground    - Current selected background
     */
    /**
     * @typedef {Object} DBGuild
     * @property {String}   id         - Guild ID
     * @property {String}   name       - Guild name
     */
    /**
     * @typedef {Object} DBGuildLevelsystem
     * @property {String}           id                   - Guild id
     * @property {Boolean}          enabled              - Whether levelsystem is enabled
     * @property {Array<String>}    ignoredChannels      - Stringified array of ignord channel IDs
     * @property {String|null}      levelupChannel       - Channel ID where levelup messages are sent
     * @property {String}           levelupMessage       - Stringified embed object for levelup
     * @property {String}           newroleMessage       - Stringified embed object for newrole
     * @property {Boolean}          tagMember            - Whether to tag the member who leveled up
     * @property {Boolean}          rolesCumulative      - Whether levelup roles are cumulative
     * @property {{Level: String}}  roles                - Stringified object of roles where `key = level` and `value = role ID`
     * @property {Boolean}          publicLeaderboard    - Whether leaderboard is public
     */
    /**
     * @typedef {Object} DBGuildMember
     * @property {String}         guildid    - Guild ID
     * @property {String}         userid     - Member ID
     * @property {String}         nickname   - Member nickname
     * @property {Number}         xp         - Total XP
     * @property {Number}         level      - Current level
     * @property {String[]}       roles      - Stringified list of member roles
     */
    /**
     * @typedef {Object} DBChannel
     * @property {String}   id                   - Channel ID
     * @property {Number}   messageStreak        - Current channel message streak
     * @property {Number}   streakTimestamp      - Date when streak was last updated in millisecond format
     * @property {String}   lastMessageMember    - ID of last user to send a message in channel
     */

    /**
     * Adds user to database if they don't exist and returns the database entry
     * @param {Discord.User}  user - DiscordJS user
     * @returns {DBUser} DBUser object
     */
    async getDBUser(user) {
        const DBUserArr = await this.get("users", `id = ${user.id}`);
        if (!DBUserArr.length) {
            await this.insert("users", {
                id: user.id,
                username: user.username,
                tag: user.tag.slice(-4),
                xp: 0,
                level: 0,
                coins: 0
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
    async getDBGuild(guild) {
        const DBGuildArr = await this.get("guilds", `id = ${guild.id}`);
        if (!DBGuildArr.length) {
            await this.insert("guilds", {
                id: guild.id,
                name: guild.name,
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
    async getDBGuildLevelsystem(guild) {
        const DBGuildLevelsystemArr = await this.get("guildlevelsystem", `id = ${guild.id}`);
        if (!DBGuildLevelsystemArr.length) {
            await this.insert("guildlevelsystem", {
                id: guild.id,
                enabled: true,
                ignoredChannels: JSON.stringify([]),
                levelupChannel: null,
                levelupMessage: "Congratulations {username}, you reached level {level}!",
                newroleMessage: "Congratulations {username}, you reached level {level} and gained the role {role}!",
                tagMember: true,
                rolesCumulative: true,
                roles: JSON.stringify({})
            });
            return (await this.get("guildlevelsystem", `id = ${guild.id}`))[0];
        }
        return DBGuildLevelsystemArr[0];
    }
    /**
     * Adds guild user to database if they don't exist and returns the database entry
     * @param {Discord.GuildMember}   member  - DiscordJS member
     * @returns {DBGuildMember} DBGuildMember object
     */
    async getDBGuildMember(member) {
        const DBGuildMemberArr = await this.get("guildusers", `\`guildid\` = ${member.guild.id} AND \`userid\` = ${member.id}`);
        if (!DBGuildMemberArr.length) {
            await this.insert("guildusers", {
                guildid: member.guild.id,
                userid: member.id,
                nickname: member.nickname,
                xp: 0,
                level: 0,
                inGuild: true,
                roles: JSON.stringify(member.roles.cache.map(role => role.id))
            });
            return (await this.get("guildusers", `guildid = ${member.guild.id} AND userid = ${member.id}`))[0];
        }
        return DBGuildMemberArr[0];
    }
    /**
     * Adds a channel to the database if it doesn't exist and returns the database entry
     * @param {Discord.TextChannel} channel DiscordJS channel
     * @returns {DBChannel}
     */
    async getDBChannel(channel) {
        const DBChannelArr = await this.get("channels", `id = ${channel.id}`);
        if (!DBChannelArr.length) {
            await this.insert("channels", {
                id: channel.id,
                messageStreak: 0,
                streakTimestamp: Date.now(),
                lastMessageMember: "0"
            });
            return (await this.get("channels", `id = ${channel.id}`))[0];
        }   
        return DBChannelArr[0];
    }
    /**
     * Updates a DBUser with Discord information
     * @param {Discord.User} user - DiscordJS user
     * @returns {DBUser} DBUser object
     */
    async updateDBUser(user) {
        const DBUserArr = await this.get("users", `id = ${user.id}`);
        if (!DBUserArr.length) return;
        await this.update("users", {
            username: user.username,
            tag: user.tag.slice(-4)
        }, `id = ${user.id}`);
        return await this.getDBUser(user);
    }
    /**
     * Updates a DBGuild with information from Discord
     * @param {Discord.Guild} guild - DiscordJS guild
     * @returns {DBGuild} DBGuild object
     */
    async updateDBGuild(guild) {
        const DBGuildArr = await this.get("guilds", `id = ${guild.id}`);
        if (!DBGuildArr.length) return;
        await this.update("guilds", {
            name: guild.name
        }, `id = ${guild.id}`);
        return await this.getDBGuild(guild);
    }
    /**
     * Updates a DBGuildMember with information from Discord
     * @param {Discord.GuildMember} member DiscordJS GuildMember
     * @returns {DBGuildMember|undefined} DBGuildMember object if Discord member is found in database
     */
    async updateDBGuildMember(member) {
        const DBGuildMemberArr = await this.get("guildusers", `guildid = ${member.guild.id} AND userid = ${member.id}`);
        if (!DBGuildMemberArr.length) return;
        await this.update("guildusers", {
            nickname: member.nickname,
            inGuild: true,
            roles: JSON.stringify(member.roles.cache.map(role => role.id))
        }, `guildid = ${member.guild.id} AND userid = ${member.id}`);
        return await this.getDBGuildMember(member);
    }
}

module.exports = MySQL;
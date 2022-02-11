// Start and stop MySQL server in run > services.msc > Apache2.4 + MySQL on localhost/phpmyadmin

import { dbBadge, dbChannel, dbGuild, dbGuildLevelsystem, dbGuildMember, dbUser, Login } from "./sqlTypes";
import EventEmitter from 'events';
import { createConnection, Connection, OkPacket } from 'mysql';
import { Guild, GuildMember, TextChannel, User } from "discord.js";
import { OAuth2Guild } from "discord.js";

export default class MySQL extends EventEmitter {
    /**
     * Creates a MySQL connection
     * @param {Object} login Login object in format:
     * { host, user, password, database }
     */
    constructor(login: Login) {
        super();
        const config = login;
        config.charset = 'UTF8MB4_GENERAL_CI';

        this.connect(config);
    }
    con: Connection;
    escape: Function;
    connect(config: Login) {
        this.con = createConnection(config);

        console.log("Connecting to MySQL server...");
        this.con.connect(err => {
            if (err) {
                this.emit("connectionFailed", err);
                console.error("Connection failed!");
                throw err;
            }
            console.log(`Established connection to MySQL server at ${config.host}`);
            this.con.query(`SELECT COUNT(*) FROM \`guilds\``, (error, result) => {
                if (error) throw error;
                this.emit("connectionEstablished", result[0]["COUNT(*)"]);
                console.log(`Number of guilds in database: ${result[0]["COUNT(*)"]}.`);
            });
        });

        this.escape = this.con.escape.bind(this.con);

        this.con.on('error', (err) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                this.emit("connectionLost");
                console.warn("Lost connection to MySQL Database, attempting reconnect");
                this.connect(config);
            } else {
                this.emit("connectionError", err);
                throw err;
            }
        });
    }
    /**
     * Query MySQL directly
     * @param {String} query MySQL query
     * @returns {Promise<Object[]>} Array of objects (found rows)
     */
    async query(query: string): Promise<object[]> {
        return new Promise((res) => {
            this.con.query(query, (err, result) => {
                if (err) throw err;
                res(result);
            });
        });
    }
    // TODO: Change queryLogic to object
    /**
     * Get rows from table.
     * If this doesnt work in the future, it might be because queryLogic isn't escaped.
     * @param {String} table Table name
     * @param {String} [queryLogic] Selector logic, e.g. "id = 12345678"
     * @param {String} [sortLogic] Ordering logic, e.g. "column_name". Optionally add "DESC" to change order, e.g. "column_name DESC"
     * @param {Number} [limit] Max number of results
     * @returns {Promise<Object[]>} Array of objects (found rows)
     */
    async get(table: string, queryLogic?: string, sortLogic?: string, limit?: number): Promise<object[]> {
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
    async insert(table: string, object: object | Array<object>): Promise<OkPacket> {
        return new Promise((res) => {
            const query = `INSERT INTO \`${table}\` (\`${Array.isArray(object) ? Object.keys(object[0]).join("`, `") : Object.keys(object).join("`, `")}\`) VALUES (${Array.isArray(object) ? object.map(element => Object.values(element).map(val => this.escape(val)).join(", ")).join("), (") : Object.values(object).map(obj => this.escape(obj)).join(", ")})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                // console.log(`Inserted ${result.affectedRows} rows.`);
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
    async update(table: string, object: object, queryLogic: string): Promise<OkPacket> {
        if (!queryLogic) throw new Error("Failed to update database. No selector parameter passed, aborting update.");
        return new Promise((res) => {
            const query = `UPDATE \`${table}\` SET ${Object.keys(object).map((key) => `\`${key}\` = ${this.escape(object[key])}`).join(", ")} WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                // console.log(`Updated ${result.affectedRows} rows.`);
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
    async delete(table: string, queryLogic: string): Promise<OkPacket> {
        return new Promise((res) => {
            const query = `DELETE FROM \`${table}\` WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                // console.log(`Removed ${result.affectedRows} rows`);
                res(result);
            })
        });
    }
    //  Specified functions
    /**
     * Adds user to database if they don't exist and returns the database entry
     * @param {User}  user - DiscordJS user
     * @returns {DBUser} DBUser object
     */
    async getDBUser(user: User): Promise<dbUser> {
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
            return (await this.get("users", `id = ${user.id}`))[0] as dbUser;
        }
        return DBUserArr[0] as dbUser;
    }
    /**
     * Adds guild to database if it doesn't exist and returns the database entry
     * @param {Guild}  guild - DiscordJS guild
     * @returns {DBGuild} DBGuild object
     */
    async getDBGuild(guild: Guild | OAuth2Guild): Promise<dbGuild> {
        const DBGuildArr = await this.get("guilds", `id = ${guild.id}`);
        if (!DBGuildArr.length) {
            await this.insert("guilds", {
                id: guild.id,
                name: guild.name,
            });
            return (await this.get("guilds", `id = ${guild.id}`))[0] as dbGuild;
        }
        return DBGuildArr[0] as dbGuild;
    }
    /**
     * Adds guild levelsystem to database if it doesn't exist and returns the database entry
     * @param {Guild}  guild - DiscordJS guild
     * @returns {DBGuildLevelsystem} DBGuild object
     */
    async getDBGuildLevelsystem(guild: Guild | OAuth2Guild): Promise<dbGuildLevelsystem> {
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
            return (await this.get("guildlevelsystem", `id = ${guild.id}`))[0] as dbGuildLevelsystem;
        }
        return DBGuildLevelsystemArr[0] as dbGuildLevelsystem;
    }
    /**
     * Adds guild user to database if they don't exist and returns the database entry
     * @param {GuildMember}   member  - DiscordJS member
     * @returns {DBGuildMember} DBGuildMember object
     */
    async getDBGuildMember(member: GuildMember): Promise<dbGuildMember> {
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
            return (await this.get("guildusers", `guildid = ${member.guild.id} AND userid = ${member.id}`))[0] as dbGuildMember;
        }
        return DBGuildMemberArr[0] as dbGuildMember;
    }
    /**
     * Adds a channel to the database if it doesn't exist and returns the database entry
     * @param {TextChannel} channel DiscordJS channel
     * @returns {DBChannel}
     */
    async getDBChannel(channel: TextChannel): Promise<dbChannel> {
        const DBChannelArr = await this.get("channels", `id = ${channel.id}`);
        if (!DBChannelArr.length) {
            await this.insert("channels", {
                id: channel.id,
                messageStreak: 0,
                streakTimestamp: Date.now(),
                lastMessageMember: "0"
            });
            return (await this.get("channels", `id = ${channel.id}`))[0] as dbChannel;
        }   
        return DBChannelArr[0] as dbChannel;
    }
    /**
     * Returns list of all badges in database
     * @returns {DBBadge[]}
     */
    async getDBBadges(): Promise<dbBadge[]> {
        const DBBadgeArr = await this.get("badges");
        return DBBadgeArr as dbBadge[];
    }
    /**
     * Returns list of GuildMembers with user ID
     * @param {User} user 
     * @returns {DBGuildMember[]}
     */
    async getDBUserGuilds(user: User): Promise<dbGuildMember[]> {
        const DBUserGuildsArr = await this.get("guildusers", `userid = ${user.id}`);
        return DBUserGuildsArr as dbGuildMember[];
    }
    /**
     * Get rank of speicific user on global leaderboard
     * @param {String} id User id
     * @param {String} [guild_id] Guild id
     * @returns {Number}
     */
    async getGlobalRank(id: string, guild_id: string): Promise<number> {
        await this.query(`SET @row_number := 0;`);
        const DBMemberRank = await this.query(`
            SELECT w.\`row_number\`
            FROM (
                SELECT
                    (@row_number:=@row_number + 1) AS \`row_number\`,
                    t.*
                FROM \`${guild_id ? 'guildusers' : 'users'}\` t ${guild_id ? `WHERE \`guildid\`='${guild_id}' ` : ''}ORDER BY \`xp\` DESC
            ) w
            WHERE
                ${guild_id ? `w.\`userid\`='${id}' AND w.\`guildid\`='${guild_id}'` : `w.\`id\`='${id}'`}
        `);
        return DBMemberRank[0]["row_number"];
    }
    /**
     * Updates a DBUser with Discord information
     * @param {User} user - DiscordJS user
     * @returns {DBUser} DBUser object
     */
    async updateDBUser(user: User): Promise<dbUser> {
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
     * @param {Guild} guild - DiscordJS guild
     * @returns {DBGuild} DBGuild object
     */
    async updateDBGuild(guild: Guild): Promise<dbGuild> {
        const DBGuildArr = await this.get("guilds", `id = ${guild.id}`);
        if (!DBGuildArr.length) return;
        await this.update("guilds", {
            name: guild.name
        }, `id = ${guild.id}`);
        return await this.getDBGuild(guild);
    }
    /**
     * Updates a DBGuildMember with information from Discord
     * @param {GuildMember} member DiscordJS GuildMember
     * @returns {DBGuildMember|undefined} DBGuildMember object if Discord member is found in database
     */
    async updateDBGuildMember(member: GuildMember): Promise<dbGuildMember> | undefined {
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
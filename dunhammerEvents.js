const EventEmitter = require("events");
const DunhammerEvents = new EventEmitter();
// JSDoc definitions
    // eslint-disable-next-line no-unused-vars
const MySQL = require("./sql/sql");
    // eslint-disable-next-line no-unused-vars
const { GuildMember, User } = require("discord.js");

//#region Helpers
const getRank = async (sql, userId) => await sql.get(`users`, null, `xp DESC`).then(users => users.indexOf(users.find(user => user.id === userId)) + 1);
//#endregion

// Badge unlock conditions
const unlocked = {
    "2"({ DBGuildMember }) { // Level 40 on Server Leaderboard
        // Check for level
        return DBGuildMember.level >= 40
    },
    "3"({ DBUser }) { // Level 50 on Global Leaderboard
        // Check for level
        return DBUser.level >= 50
    },
    "4"({ DBUser }) { // Spend money on the shop
        // Check for money
        return DBUser.spentMoney > 0;
    },
    "5"({ DBUser }) { // Spend 20 USD on the shop
        // Check for money
        return DBUser.spentMoney >= 2000;
    },
    async "6"({ sql, DBUser }) { // Top 1000 on Global Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 1000;
    },
    async "7"({ sql, DBUser }) { // Top 100 on Server Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 100;
    },
    async "8"({ sql, DBUser }) { // Top 10 on Server Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 10;
    },
    async "9"({ sql, DBUser }) { // Top 3 on Global Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 3;
    },
    async "10"({ sql, DBUser }) { // Top 2 on Global Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 2;
    },
    async "11"({ sql, DBUser }) { // Top 1 on Global Leaderboard
        // Get rank
        const rank = await getRank(sql, DBUser.id);
        return rank <= 1;
    },
    "12"({ DBUser }) { // Use /ping 100 times
        // Check for ping count
        return DBUser.pingCount >= 100;
    },
    "13"({ DBUserGuilds }) { // Level 20 on 2 servers
        // Filter guilds where level 20
        const DBGuildMemberPassed = DBUserGuilds.filter(DBGuildMember => DBGuildMember.level >= 20);
        // Check if 2 or more
        return DBGuildMemberPassed.length >= 2
    },
    "14"({ DBUserGuilds} ) { // Level 20 on 3 servers
        // Filter guilds where level 20
        const DBGuildMemberPassed = DBUserGuilds.filter(DBGuildMember => DBGuildMember.level >= 20);
        // Check if 3 or more
        return DBGuildMemberPassed.length >= 3
    },
    "15"({ DBUserGuilds }) { // Level 20 on 5 servers
        // Filter guilds where level 20
        const DBGuildMemberPassed = DBUserGuilds.filter(DBGuildMember => DBGuildMember.level >= 20);
        // Check if 5 or more
        return DBGuildMemberPassed.length >= 5
    },
    "16"({ DBUser}) { // 100 commands used
        // Check for command count
        return DBUser.commandCount >= 100;
    },
    "17"({ DBUser}) { // 500 commands used
        // Check for command count
        return DBUser.commandCount >= 500;
    },
    "18"({ DBUser}) { // 1000 commands used
        // Check for command count
        return DBUser.commandCount >= 1000;
    },
    "19"({ DBUser}) { // Invite Dunhammer to 2 servers
        // Check for invite count
        return DBUser.inviteCount >= 2;
    },
    "20"() { // Submit a bug report
        return true;
    },
}

/**
 * Check for and add badges
 * @param {MySQL} sql 
 * @param {Number[]} relevantIds 
 * @param {Object} properties 
 */
const processBadges = async (sql, relevantIds, properties) => {
    const { DBUser } = properties;
    // Filter badges by related
    const badges = await sql.getDBBadges();
    const badgesRelated = badges.filter(badge => relevantIds.includes(badge.id));

    // Check if user has any of the relevant badges
    // Add badges if they don't have them and conditions are met
    const badgesToAdd = badgesRelated.filter(async badge => {
        if (DBUser.badges & badge.bitId) return false;
        // Not all unlock conditions require the same properties, so they are all sent.
        // Return true if the condition is met
        const unlock = await unlocked[badge.id](properties);
        console.log(unlock, badge.name, DBUser.username);
        return unlock;
    });

    // Add badges
    if (badgesToAdd.length > 0) {
        const badgesToAddIds = badgesToAdd.map(badge => badge.bitId);
        DBUser.badges += badgesToAddIds.reduce((a, b) => a + b);
        await sql.update('users', { badges: DBUser.badges }, `id = ${DBUser.id}`);
    }
}

DunhammerEvents.on(
    "levelupServer",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} member Discord member
     */
    async (sql, member) => {
            // Badges
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        const DBGuildMember = await sql.getDBGuildMember(member);
        const DBUserGuilds = await sql.getDBUserGuilds(member.user);

        // Add relevant badges - Server grinder, Socialite I, II, III
        processBadges(sql, [2, 13, 14, 15], { DBUser, DBGuildMember, DBUserGuilds });
    }
);
DunhammerEvents.on(
    "levelupGlobal",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {User} user Discord user
     */
    async (sql, user) => {
            // Badges
        // Get relevant database entries
        const DBUser = await sql.getDBUser(user);

        // Add relevant badges - Global grinder, Top 1000, 100, 10, 3, 2, 1
        processBadges(sql, [3, 6, 7, 8, 9, 10, 11], { DBUser, sql });
    }
);
DunhammerEvents.on(
    "payment",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {String} id Discord ID
     * @param {Number} amount Amount spent
     */
    async (sql, id, amount) => {
        // Get relevant database entries
        const DBUser = await sql.get(`users`, `id = ${id}`)[0];
        if (!DBUser) return; // This shouldnt happen, since you cant really be logged in without being in the database
        // Update database entry
        DBUser.spentMoney += amount;
        await sql.update('users', { spentMoney: DBUser.spentMoney }, `id = ${DBUser.id}`);

        // Add relevant badges - Supporter, Grand supporter
        processBadges(sql, [4, 5], { DBUser, sql });
    }
);
DunhammerEvents.on(
    "command",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} member Discord GuildMember
     * @param {String} commandName Command used
     */
    async (sql, member, commandName) => {
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        // Update database entry
        DBUser.commandCount++;
        if (commandName === "ping") { DBUser.pingCount++ }
        await sql.update('users', { commandCount: DBUser.commandCount, pingCount: DBUser.pingCount }, `id = ${DBUser.id}`);

        // Add relevant badges - The definition of insanity, Addict I, II, III
        processBadges(sql, [12, 16, 17, 18], { DBUser });
    }
);
DunhammerEvents.on( //! Requires audit log permissions to work
    "newGuild",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} [member] Discord GuildMember
     */
    async (sql, member) => {
        if (!member) return;
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        // Update database entry
        DBUser.inviteCount++;
        await sql.update('users', { inviteCount: DBUser.inviteCount }, `id = ${DBUser.id}`);

        // Add relevant badges - Invitational
        processBadges(sql, [19], { DBUser });
    }
);
// TODO: Add verification for issues
DunhammerEvents.on(
    "githubIssue",
    async (sql, user, _issue) => {
        // Get relevant database entries
        const DBUser = await sql.getDBUser(user);

        // Add relevant badges - Bug hunter
        processBadges(sql, [20], { DBUser });
    }
);

module.exports = DunhammerEvents;
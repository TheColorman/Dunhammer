const EventEmitter = require("events");
const DunhammerEvents = new EventEmitter();
// JSDoc definitions
    // eslint-disable-next-line no-unused-vars
const MySQL = require("./sql/sql");
    // eslint-disable-next-line no-unused-vars
const { GuildMember, User, Channel, TextChannel, Message } = require("discord.js");

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
    "6"({ rank }) { // Top 1000 on Global Leaderboard
        // Get rank
        return rank <= 1000;
    },
    "7"({ rank }) { // Top 100 on Server Leaderboard
        // Get rank
        return rank <= 100;
    },
    "8"({ rank }) { // Top 10 on Server Leaderboard
        // Get rank
        return rank <= 10;
    },
    "9"({ rank }) { // Top 3 on Global Leaderboard
        // Get rank
        return rank <= 3;
    },
    "10"({ rank }) { // Top 2 on Global Leaderboard
        // Get rank
        return rank <= 2;
    },
    "11"({ rank }) { // Top 1 on Global Leaderboard
        // Get rank
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
 * @returns {Promise<DBBadge[]>}
 */
const processBadges = async (sql, relevantIds, properties) => {
    const { DBUser } = properties;
    // Filter badges by related
    const badges = await sql.getDBBadges();
    const badgesRelated = badges.filter(badge => relevantIds.includes(badge.id));

    // Check if user has any of the relevant badges
    // Add badges if they don't have them and conditions are met
    const badgesToAdd = badgesRelated.filter(badge => {
        if (DBUser.badges & badge.bitId) return false;
        // Not all unlock conditions require the same properties, so they are all sent.
        // Return true if the condition is met
        const unlock = unlocked[badge.id](properties);
        return unlock;
    });
    return await new Promise((resolve, _reject) => {
        Promise.all(badgesToAdd).then(async () => {
            
            // Add badges
            if (badgesToAdd.length > 0) {
                const badgesToAddBitIds = badgesToAdd.map(badge => badge.bitId);
                DBUser.badges += badgesToAddBitIds.reduce((a, b) => a + b);
                await sql.update('users', { badges: DBUser.badges }, `id = ${DBUser.id}`);
            }
            resolve(badgesToAdd);
        });
    });
}
// Send a message saying the user has unlocked a badge
const notifyForBadge = async (channel, badges) => {
    // Select random text hint
    const textHints = [
        "/badges",
        "/badges options:set to show the badge on your profile",
        "/badges options:info for badge info",
        "/badges options:progress for badge progress"
    ];
    const textHint = textHints[Math.floor(Math.random() * textHints.length)];

    // Send message
    await channel.send({
        embeds: [{
            title: `Badges unlocked!`,
            description: badges.map(badge => `${badge.idEmoji} ${badge.name} | ${badge.description}`).join("\n"),
            color: 0x7BA043,
            footer: {
                text: `${textHint}`
            }
        }]
    });
}

DunhammerEvents.on(
    "levelupServer",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} member Discord member
     * @param {TextChannel} levelupChannel Discord channel
     */
    async (sql, member, levelupChannel) => {
            // Badges
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        const DBGuildMember = await sql.getDBGuildMember(member);
        const DBUserGuilds = await sql.getDBUserGuilds(member.user);

        // Add relevant badges - Server grinder, Socialite I, II, III
        const addedBadges = await processBadges(sql, [2, 13, 14, 15], { DBUser, DBGuildMember, DBUserGuilds });
        // Notify user
        if (addedBadges.length > 0) { await notifyForBadge(levelupChannel, addedBadges); }
    }
);
DunhammerEvents.on(
    "levelupGlobal",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {User} user Discord user
     */
    async (sql, user, levelupChannel) => {
            // Badges
        // Get relevant database entries
        const DBUser = await sql.getDBUser(user);
        const rank = await getRank(sql, user.id);

        // Add relevant badges - Global grinder, Top 1000, 100, 10, 3, 2, 1
        const addedBadges = await processBadges(sql, [3, 6, 7, 8, 9, 10, 11], { DBUser, rank });
        if (addedBadges.length > 0) { await notifyForBadge(levelupChannel, addedBadges); }
    }
);
// TODO: Automatically delete rows from `stripe_events` older than 7 days
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
        await processBadges(sql, [4, 5], { DBUser, sql });
    }
);
DunhammerEvents.on(
    "command",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} member Discord GuildMember
     * @param {String} commandName Command used
     * @param {TextChannel} channel Discord channel
     */
    async (sql, member, commandName, channel) => {
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        // Update database entry
        DBUser.commandCount++;
        if (commandName === "ping") { DBUser.pingCount++ }
        await sql.update('users', { commandCount: DBUser.commandCount, pingCount: DBUser.pingCount }, `id = ${DBUser.id}`);

        // Add relevant badges - The definition of insanity, Addict I, II, III
        const addedBadges = await processBadges(sql, [12, 16, 17, 18], { DBUser });
        if (addedBadges.length > 0) { await notifyForBadge(channel, addedBadges); }
    }
);
DunhammerEvents.on(
    "ping",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {GuildMember} member Discord GuildMember
     * @param {Boolean} button Whether ping was measured from button press
     * @param {TextChannel} channel Discord channel
     */
    async (sql, member, button, channel) => {
        // Get relevant database entries
        const DBUser = await sql.getDBUser(member.user);
        // Update database entry
        if (button) {
            DBUser.pingCount++
            await sql.update('users', { pingCount: DBUser.pingCount }, `id = ${DBUser.id}`);
        }

        // Add relevant badges - The definition of insanity
        const addedBadges = await processBadges(sql, [12], { DBUser });
        if (addedBadges.length > 0) { await notifyForBadge(channel, addedBadges); }
    }
);
DunhammerEvents.on( //! Requires audit log permissions to work (which are part of the invite link anyway)
    "newGuild",
    /**
     * @param {MySQL} sql MySQL instance
     * @param {User} [user] Discord GuildMember
     */
    async (sql, user) => {
        if (!user) return;
        // Get relevant database entries
        const DBUser = await sql.getDBUser(user);
        // Update database entry
        DBUser.inviteCount++;
        await sql.update('users', { inviteCount: DBUser.inviteCount }, `id = ${DBUser.id}`);

        // Add relevant badges - Invitational
        await processBadges(sql, [19], { DBUser });
    }
);
// TODO: Add verification for issues
DunhammerEvents.on(
    "bugReport",
    async (sql, user, _issue, channel) => {
        // Get relevant database entries
        const DBUser = await sql.getDBUser(user);

        // Add relevant badges - Bug hunter
        const addedBadges = await processBadges(sql, [20], { DBUser });
        if (addedBadges.length > 0) { await notifyForBadge(channel, addedBadges); }
    }
);
DunhammerEvents.on(
    "xpGainGlobal",
    /**
     * @param {MySQL} sql 
     * @param {Message} message 
     * @param {Number} xpGained 
     * @param {Number} xpTotal 
     */
    async (sql, message, xpGained, xpTotal) => {
        // Add entry to database.
        await sql.insert(`xptracking`, {
            userid: message.author.id,
            guildid: message.guild.id,
            username: message.author.username,
            timestamp: message.createdTimestamp,
            gained: xpGained,
            total: xpTotal
        });
    }
);

// * Temporary event handlers
// DunhammerEvents.on(
//     "command",
//     /**
//      * @param {MySQL} sql MySQL instance
//      * @param {GuildMember} member Discord GuildMember
//      * @param {String} commandName Command used
//      * @param {TextChannel} channel Discord channel
//      */
//     async (sql, member, commandName, channel) => {
//         const dbMemberList = await sql.get('newyears', `\`id\` = "${member.id}"`);
//         if (dbMemberList.length === 0) {
//             channel.send({
//                 content: `Happy new years ${member}! Here's 500 Dunhammer Coins free of charge! :tada:`,
//             });
//             sql.insert('newyears', {
//                 id: member.id,
//             });
//             const dbUser = await sql.getDBUser(member.user);
//             dbUser.coins += 500;
//             sql.update('users', {
//                 coins: dbUser.coins,
//             }, `\`id\` = "${member.id}"`);
//         }    
//     }
// );
        


module.exports = DunhammerEvents;
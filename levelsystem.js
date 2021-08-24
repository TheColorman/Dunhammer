// eslint-disable-next-line no-unused-vars
const { Message, Collection, User } = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('./sql/sql'),
    Canvas = require("canvas");

module.exports = {
    /**
     * @param {Message} message 
     * @param {MySQL} sql 
     * @param {Collection} levelTimestamps 
     * @param {Collection} minuteTimestamps 
     */
    async xpGain(message, sql, levelTimestamps, minuteTimestamps) {
        const DBChannel = await sql.getDBChannel(message.channel),
            DBGuildMember = await sql.getDBGuildMember(message.member),
            DBUser = await sql.getDBUser(message.author),
            DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.guild),
    
            basexp = 1,
            messageLengthDevisor = 5,
            maxStreak = 20,
            streakTimeout = 5,
            streakDevisor = 3,
            linkEmbedAddition = 20,
            maxxpPerMinute = 80,
        
            minutesSinceStreakTimestamp = (Date.now() - DBChannel.streakTimestamp) / 60000;
        if (minutesSinceStreakTimestamp > streakTimeout) DBChannel.messageStreak = 0;
        else DBChannel.messageStreak -= Math.floor(minutesSinceStreakTimestamp);
        const newMessage = DBChannel.lastMessageMember != message.member.id,
    
            now = Date.now(),
            cooldownAmount = 60 * 1000;
        if (!newMessage) {
            if (levelTimestamps.has(message.author.id)) {
                const expirationTime = levelTimestamps.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) return;
            }
        }
        levelTimestamps.set(message.author.id, now);
        setTimeout(() => levelTimestamps.delete(message.author.id), cooldownAmount);
    
        const gainedxp = Math.floor(
            basexp * (message.content.split(" ").length / messageLengthDevisor) +
            (newMessage ? basexp * (DBChannel.messageStreak / streakDevisor) : 0) + 
            (message.embeds.length ? linkEmbedAddition : 0)
        );
        if (minuteTimestamps.has(message.author.id)) {
            const xpThisMinute = minuteTimestamps.get(message.author.id);
            if (xpThisMinute > maxxpPerMinute) return;
            minuteTimestamps.set(message.author.id, xpThisMinute + gainedxp);
        } else minuteTimestamps.set(message.author.id, gainedxp);
    
        await sql.update("channels", {
            messageStreak: Math.min(DBChannel.messageStreak + (newMessage ? 1 : 0), maxStreak),
            streakTimestamp: Date.now(),
            lastMessageMember: message.member.id
        }, `id = ${message.channel.id}`);
    
        const newMemberxp = DBGuildMember.xp + gainedxp,
            newUserxp = DBUser.xp + gainedxp,
        
            
            calculateLevel = (xp) => {
                let lower = 0,
                    upper = 10000000000;    // max xp. equivalent to sending 500 million messages, which would take 951 years at 1 message/minute.
                while (lower + 1 < upper) {
                    const middle = Math.floor((lower + upper) / 2),
                        levelxp = 5 * (118 * middle + 2 * middle * middle * middle) / 6;
                    if (levelxp > xp) upper = middle;
                    else lower = middle;
                }
                return lower;
            },
            newMemberLevel = calculateLevel(newMemberxp),
            newUserLevel = calculateLevel(newUserxp);
        if (DBGuildLevelsystem.enabled && !DBGuildLevelsystem.ignoredChannels.includes(message.channel.id)) {
            await sql.update("guildusers", {
                xp: newMemberxp,
                level: newMemberLevel
            }, `guildid = ${message.guild.id} AND userid = ${message.member.id}`);
        }
        await sql.update("users", {
            xp: newUserxp,
            level: newUserLevel
        }, `id = ${message.member.id}`);
    
    
        if (DBGuildLevelsystem.enabled && newMemberLevel > DBGuildMember.level) this.serverLevelup(message, DBGuildMember, newMemberLevel, sql);
        if (newUserLevel > DBUser.level) this.globalLevelup(message, message.user, DBUser, newUserLevel, sql);
    },
    /**
     * Levels up a guild member
     * @param {Message} message DiscordJS message
     * @param {DBGuildMember} DBGuildMember DBGuildMember object
     * @param {Number} level New level
     */
    async serverLevelup(message, DBGuildMember, level, sql) {
        const DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.member.guild),
            levelupChannel = await message.client.channels.fetch(DBGuildLevelsystem.levelupChannel) || message.channel,
            levelupMessage = DBGuildLevelsystem.levelupMessage
                .replace("{username}", message.user.username)
                .replace("{nickname}", message.member.displayName)
                .replace("{level}", level)
                .replace("{total_xp}", DBGuildMember.xp),
        
            attachment = await this.createLevelupImageServer(message, DBGuildMember, level);

        levelupChannel.send({
            content: `${DBGuildLevelsystem.tagMember ? `${message.member}\n` : ""}${levelupMessage}`,
            files: [attachment]
        });
    },
    /**
     * @param {Message} message 
     * @param {User} user
     * @param {DBUser} DBUser
     * @param {Number} level
     * @param {MySQL} sql 
     */
    async globalLevelup(message, user, DBUser, level, sql) {
        const DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.member.guild),
            levelupChannel = await message.client.channels.fetch(DBGuildLevelsystem.levelupChannel) || await user.createDM(),
            attachment = await this.createLevelupImageGlobal();

        await sql.update("users", { coins: DBUser.coins + level * 10 }, `id = ${user.id}`);

        levelupChannel.send({
            content: `Congratulations ${user}! You reached level ${level} on the Global Dunhammer Leaderboard and gained ${level * 10} <:DunhammerCoin:878740195078463519>.`,
            files: [attachment]
        });
    },
    async createLevelupImageServer(message, DBGuildMember, level) {
        const canvas = Canvas.createCanvas(800, 270);
    },
    async createLevelupImageGlobal(message, DBGuildMember, level) {

    }

}
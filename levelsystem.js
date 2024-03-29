// eslint-disable-next-line no-unused-vars
const { Message, Collection, User, MessageAttachment } = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('./sql/sql'),
    // eslint-disable-next-line no-unused-vars
    DunhammerEvents = require('./dunhammerEvents'),
    Canvas = require("canvas");

module.exports = {
    /**
     * @param {Message} message 
     * @param {MySQL} sql 
     * @param {DunhammerEvents} events
     * @param {Collection} levelTimestamps 
     * @param {Collection} minuteTimestamps 
     */
    async xpGain(message, sql, events, levelTimestamps, minuteTimestamps) {
        const DBChannel = await sql.getDBChannel(message.channel),
            DBGuildMember = await sql.getDBGuildMember(message.member),
            DBUser = await sql.getDBUser(message.author),
            DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.guild),
    
            basexp = Math.random() * 2 + 1,
            messageLengthDevisor = 7,
            maxStreak = 100,
            streakTimeout = 5,
            streakDevisor = 10,
            linkEmbedAddition = 20,
            maxxpPerMinute = 40,

            // Check if streak should be reset/reduced
            minutesSinceStreakTimestamp = (Date.now() - DBChannel.streakTimestamp) / 60000;
        if (minutesSinceStreakTimestamp > streakTimeout) DBChannel.messageStreak = 0;
        else DBChannel.messageStreak -= Math.min(Math.floor(minutesSinceStreakTimestamp), DBChannel.messageStreak);
        const newMessage = DBChannel.lastMessageMember != message.member.id,
    
            now = Date.now(),
            cooldownAmount = 60 * 1000;
            // Check if streak should be increased (it increases when new person has sent a message)
        if (!newMessage) {
            if (levelTimestamps.has(message.author.id)) {
                const expirationTime = levelTimestamps.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) return;
            }
        }
        levelTimestamps.set(message.author.id, now);
        // Timeout for xp, only used if a user sends 2 messages after eachother
        setTimeout(() => levelTimestamps.delete(message.author.id), cooldownAmount);

        // Check for attachments / urls (aka. embeds but the message.embeds property is ass)
                       // boolean baby
        const hasEmbeds = !!(message.attachments.size || message.content.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/g));
        // calculation for xp gained for the message
        let gainedxp = Math.round(
            basexp * (message.content.replace(/\s+/g,' ').split(" ").length / messageLengthDevisor) +
            (newMessage ? basexp * (DBChannel.messageStreak / streakDevisor) : 0) + 
            (hasEmbeds ? linkEmbedAddition : 0)
        );
        // Check for max xp this minute
        if (minuteTimestamps.has(message.author.id)) {
            const xpThisMinute = minuteTimestamps.get(message.author.id);
            // Debug message to see xp gain
            //if (message.channel.id == "779374371831545906") console.log(`base: ${basexp}\nlength: value ${message.content.replace(/\s+/g,' ').split(" ").length} xp ${Math.round(basexp * (message.content.replace(/\s+/g,' ').split(" ").length / messageLengthDevisor))}\nstreak: value ${DBChannel.messageStreak} xp ${Math.round(newMessage ? basexp * (DBChannel.messageStreak / streakDevisor) : 0)}\ntotal: ${gainedxp} xp\n${xpThisMinute}/${maxxpPerMinute} xp this min\n\n`);
            //message.reply({ content: `base: ${basexp}\nlength: value ${message.content.replace(/\s+/g,' ').split(" ").length} xp ${Math.round(basexp * (message.content.replace(/\s+/g,' ').split(" ").length / messageLengthDevisor))}\nstreak: value ${DBChannel.messageStreak} xp ${Math.round(newMessage ? basexp * (DBChannel.messageStreak / streakDevisor) : 0)}\ntotal: ${gainedxp} xp\n${xpThisMinute}/${maxxpPerMinute} xp this min`, allowedMentions: { repliedUser: false } });
            //console.log(`base: ${basexp}\nlength: value ${message.content.replace(/\s+/g,' ').split(" ").length} xp ${Math.round(basexp * (message.content.replace(/\s+/g,' ').split(" ").length / messageLengthDevisor))}\nstreak: value ${DBChannel.messageStreak} xp ${Math.round(newMessage ? basexp * (DBChannel.messageStreak / streakDevisor) : 0)}\ntotal: ${gainedxp} xp\n${xpThisMinute}/${maxxpPerMinute} xp this min`);
            if (xpThisMinute > maxxpPerMinute) return;
            if (xpThisMinute + gainedxp > maxxpPerMinute) {
                gainedxp = maxxpPerMinute - xpThisMinute;
            }
            minuteTimestamps.set(message.author.id, xpThisMinute + gainedxp);
        } else minuteTimestamps.set(message.author.id, gainedxp);
    
        // Update channel streak
        await sql.update("channels", {
            messageStreak: Math.min(DBChannel.messageStreak + (newMessage ? 1 : 0), maxStreak),
            streakTimestamp: Date.now(),
            lastMessageMember: message.member.id
        }, `id = ${message.channel.id}`);
    
        const newMemberxp = DBGuildMember.xp + gainedxp;
        const newUserxp = DBUser.xp + gainedxp;
        // XP gain event
        // I dont think this works
        // events.emit("xpGainGlobal", sql, message, gainedxp, newUserxp);


            // Calculate new level for xp
        const calculateLevel = (xp) => {
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
        if (    // Add xp to Server Leaderboard if enabled and the channel isn't ignored
            DBGuildLevelsystem.enabled &&
            !DBGuildLevelsystem.ignoredChannels.includes(message.channel.id)
        ) {
            await sql.update("guildusers", {
                xp: newMemberxp,
                level: newMemberLevel
            }, `guildid = ${message.guild.id} AND userid = ${message.member.id}`);
        }   // Add xp to Global Leaderboard if user is not opted out
        if (!DBUser.disabled) {
            await sql.update("users", {
                xp: newUserxp,
                level: newUserLevel
            }, `id = ${message.member.id}`);
        }
    
        // Now cause the actual levelups
        if (DBGuildLevelsystem.enabled && newMemberLevel > DBGuildMember.level) this.serverLevelup(message, DBGuildMember, newMemberLevel, sql, events);
        if (!DBUser.disabled && newUserLevel > DBUser.level) this.globalLevelup(message, message.author, DBUser, newUserLevel, sql, events);
    },
    /**
     * Levels up a guild member
     * @param {Message} message DiscordJS message
     * @param {MySQL.DBGuildMember} DBGuildMember DBGuildMember object
     * @param {Number} level New level
     * @param {MySQL} sql
     * @param {DunhammerEvents} events
     */
    async serverLevelup(message, DBGuildMember, level, sql, events) {
        const
            DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.member.guild),
            levelupChannel = DBGuildLevelsystem.levelupChannel ? await message.client.channels.fetch(DBGuildLevelsystem.levelupChannel) : message.channel,
            // Replace all custom text ingredients
            levelupMessage = DBGuildLevelsystem.levelupMessage
                .replace("{username}", message.author.username)
                .replace("{nickname}", message.member.displayName)
                .replace("{level}", level)
                .replace("{total_xp}", DBGuildMember.xp),
            attachment = await this.createLevelupImageServer(message, level, sql),

            // Roles
            guildRoles = JSON.parse(DBGuildLevelsystem.roles);
        if (guildRoles[level]) {    // check if there is a role on new level
            const
                memberRoles = JSON.parse(DBGuildMember.roles),
                guildLevelRoles = Object.values(guildRoles),
                memberLevelRoles = memberRoles.filter(roleid => guildLevelRoles.includes(roleid)),
                member = message.member;
            // Remove all levelroles if roles aren't cumulative
            if (!DBGuildLevelsystem.rolesCumulative && memberLevelRoles.length) await member.roles.remove(memberLevelRoles, "Normal level roles.");

            // Message
            const newRoleMessage = DBGuildLevelsystem.newroleMessage
                .replace("{username}", message.author.username)
                .replace("{nickname}", member.displayName)
                .replace("{role}", await message.guild.roles.fetch(guildRoles[level]))
                .replace("{level}", level);

            await member.roles.add(guildRoles[level], "Normal level roles");
            levelupChannel.send({
                embeds: [{
                    color: 0x7BA043,
                    description: newRoleMessage
                }]
            });
        }
    
        // Send message        
        levelupChannel.send({
            content: `${DBGuildLevelsystem.tagMember ? `${message.member}\n` : ""}${levelupMessage}`,
            files: [attachment]
        });

        // Emit event
        events.emit("levelupServer", sql, message.member, levelupChannel);

    },
    /**
     * @param {Message} message 
     * @param {User} user
     * @param {DBUser} DBUser
     * @param {Number} level
     * @param {MySQL} sql 
     * @param {DunhammerEvents} events
     */
    async globalLevelup(message, user, DBUser, level, sql, events) {
        // Get levelsystem from database
        const DBGuildLevelsystem = await sql.getDBGuildLevelsystem(message.member.guild),
            // If levelsystem is disabled, send a DM, if its enabled, check if it has a levelupchannel and send accordingly
            levelupChannel = DBGuildLevelsystem.enabled ?
                DBGuildLevelsystem.levelupChannel ?
                    await message.client.channels.fetch(DBGuildLevelsystem.levelupChannel) : 
                    message.channel : 
                await user.createDM();

        // Update user
        await sql.update("users", { coins: DBUser.coins + level * 10 }, `id = ${user.id}`);
        // Decide channel
        if (levelupChannel.type == "DM" && !DBUser.levelDm) return;
        const attachment = await this.createLevelupImageGlobal(message, level, sql);

        if (DBUser.currentBackground == 0 && Math.random() < 0.2) {
            levelupChannel.send({
                content: `Congratulations ${DBUser.levelMentions ? user : user.username}! You reached level ${level} on the Global Dunhammer Leaderboard and gained ${level * 10} <:DunhammerCoin:878740195078463519>.
${DBUser.levelMentions && level < 5 ? `(**Hint:** you can disable mentions using \`/profile level_mentions:False\`)` : ``}`,
                files: [attachment],
                embeds: [{
                    author: {
                        name: "Hint: Click here to change your background on the Dunhammer website.",
                        url: "https://dunhammer.colorman.me/buy"
                    }
                }],
                title: "",
                description: ""
            });
        } else {
            levelupChannel.send({
                content: `Congratulations ${DBUser.levelMentions ? user : user.username}! You reached level ${level} on the Global Dunhammer Leaderboard and gained ${level * 10} <:DunhammerCoin:878740195078463519>.
${DBUser.levelMentions && level < 5 ? `(**Hint:** you can disable mentions using \`/profile level_mentions:False\`)` : ``}`,
                files: [attachment],
            });
        }

        // Emit event
        events.emit("levelupGlobal", sql, user, levelupChannel);
    },
    /**
     * @param {Message} message 
     * @param {Number} level 
     * @param {MySQL} sql 
     * @returns {MessageAttachment}
     */
    async createLevelupImageServer(message, level, sql) {
        const
            canvas = Canvas.createCanvas(700, 500),
            ctx = canvas.getContext("2d"),

            GuildMemberDB = await sql.get("guildusers", `guildid = ${message.guild.id} AND inGuild = 1`, "xp DESC"),
            rank = GuildMemberDB.findIndex(member => member.userid == message.author.id) + 1,
            nextDBGuildMember = GuildMemberDB.find((_member, index) => index == rank-2),
            nextMember = nextDBGuildMember ? await message.guild.members.fetch(nextDBGuildMember.userid) : undefined,
            DBGuildMember = GuildMemberDB.find((member) => member.userid == message.author.id),
            DBUser = await sql.getDBUser(message.author),
            background = await Canvas.loadImage(`./data/levelupBackgrounds/${DBUser.currentBackground}.png`),
            avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: "png" })),
            guildIcon = await Canvas.loadImage(message.guild.iconURL({ format: "png" }) || "./data/images/noicon.png"),
            badges = (await sql.getDBBadges()).filter(badge => badge.bitId & DBUser.currentBadges),
            font = 'Nyata FTR, Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif, Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace, Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif',
            // {    Discord fonts
            //     --font-primary: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-display: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-code: Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace;
            //     --font-korean: Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-japanese: Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-chinese-simplified: Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-chinese-traditional: Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
            // }
            /**
             * Draws text with a shadow
             * @param {String} text
             * @param {Number} x
             * @param {Number} y
             * @param {Number} shadowBlur
             * @param {Number} lineWidth
             */
            shadowText = (text, x, y, shadowBlur, lineWidth, shadowColor) => {
                ctx.strokeStyle = "black";
                ctx.shadowColor = shadowColor || "black";
                ctx.shadowBlur = shadowBlur;
                ctx.lineWidth = lineWidth;
                ctx.strokeText(
                    text,
                    x,
                    y
                );
                ctx.shadowBlur = 0;
                ctx.fillText(
                    text,
                    x,
                    y
                );        
            },

        //#region Background image
            cornerCropSize = 225,
            bgCropRotationOffset = 30,
            whiteBeginX = 700,
            whiteOffset = 200,
            bottomBarHeight = 125,
            bottomBarColor = "#99cc6633";
        // Image
        ctx.beginPath();
        ctx.moveTo(cornerCropSize + bgCropRotationOffset, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.lineTo(0, cornerCropSize - bgCropRotationOffset);
        ctx.closePath();

        ctx.save();
        ctx.clip();

        ctx.drawImage(background, 0, 0);
        ctx.restore();
        // Bottom right white
        const addWhiteTriangle = (offset, fillAmount) => {
            ctx.beginPath();
            ctx.moveTo(whiteBeginX + bgCropRotationOffset + offset, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(
                whiteBeginX - canvas.height - bgCropRotationOffset + offset,
                canvas.height
            );
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${fillAmount})`;
            ctx.fill();
        };
        for (let i = 0; i < 5; i++) {
            addWhiteTriangle(i * whiteOffset, 0.05 * i + 0.15);
        }
        // Bottom green
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, canvas.height - bottomBarHeight);
        ctx.lineTo(canvas.width, canvas.height - bottomBarHeight);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = bottomBarColor;
        ctx.fill();

        //#endregion

        //#region Avatar
        const avatarSize = 175,
            avatarPosition = {
                x: 115,
                y: 115,
            },
            borderWidth = 3;
        ctx.beginPath();
        ctx.arc(avatarPosition.x, avatarPosition.y, avatarSize / 2, 0, 6.28, false);
        ctx.closePath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        ctx.save();
        ctx.clip();

        ctx.drawImage(
            avatar,
            avatarPosition.x - avatarSize / 2,
            avatarPosition.y - avatarSize / 2,
            avatarSize,
            avatarSize
        );
        ctx.restore();
        //#endregion

        //#region Leaderboard
        const
            iconSize = 85,
            iconCornerOffsetY = (bottomBarHeight - iconSize) / 2,
            iconCornerOffsetX = 20,
            iconPosition = {
                x: canvas.width - iconSize / 2 - iconCornerOffsetX,
                y: canvas.height - iconSize / 2 - iconCornerOffsetY - 10
            },
            iconOutlineWidth = 3,
            leaderboardText = `${message.guild.name} Leaderboard`;
        let leaderboardFontSize = 24;
        ctx.beginPath();
        ctx.arc(
            iconPosition.x,
            iconPosition.y,
            iconSize / 2,
            0,
            6.28,
            false
        );
        ctx.closePath();
        ctx.lineWidth = iconOutlineWidth;
        ctx.stroke();
        ctx.save();
        ctx.clip();

        ctx.drawImage(
            guildIcon,
            iconPosition.x - iconSize / 2,
            iconPosition.y - iconSize / 2,
            iconSize,
            iconSize
        );
        ctx.restore();
        
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.font = `${leaderboardFontSize}px ${font}`;
        while (ctx.measureText(`${message.guild.name} Leaderboard`).width > 675) {
            ctx.font = `${leaderboardFontSize -= 2}px ${font}`;
        }
        const leaderboardTextHeight = ctx.measureText(leaderboardText).actualBoundingBoxAscent;
        shadowText(
            leaderboardText,
            iconPosition.x + iconSize / 2,
            iconPosition.y + iconSize / 2 + leaderboardTextHeight + 7
        );

        //#endregion

        //#region xp behind
        const
            firstLine = rank > 1 ?`${nextDBGuildMember.xp - DBGuildMember.xp} xp behind` : "Congratulations:",
            secondLine = rank > 1 ? nextMember.displayName : "You're 1st place!",
            xpBehindColor = "#999999";
        let xpBehindFontSize = 50;
        
        ctx.font = `${xpBehindFontSize}px ${font}`;
        while (ctx.measureText(secondLine).width > 550) {
            ctx.font = `${xpBehindFontSize -= 2}px ${font}`;
        }
        
        ctx.fillStyle = xpBehindColor;
        ctx.textAlign = "left";
        shadowText(
            secondLine,
            10, canvas.height - 40,
            2, 2
        );
        ctx.font = `35px ${font}`;
        shadowText(
            firstLine,
            10, canvas.height - 55 - ctx.measureText(secondLine).actualBoundingBoxAscent,
            2, 2
        );
        //#endregion

        //#region Nickname
        const
            nickname = message.member.displayName,
            nicknamePos = {
                x: 250,
                y: 100
            }
        let nicknameSize = 90;
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.font = `${nicknameSize}px ${font}`;
        while (ctx.measureText(nickname).width > 425) {
            ctx.font = `${nicknameSize -= 2}px ${font}`;
        }
        shadowText(
            nickname,
            nicknamePos.x, nicknamePos.y,
            4, 4
        );
        //#endregion

        //#region Level / Rank
        const
            levelSize = 120,
            rankSize = 70,
            levelColor = "#99cc66",
            rankColor = "white",
            levelShadowColor = "#99cc66",
            levelPosition = {
                x: 675,
                y: 275
            }
            
        ctx.font = `${levelSize}px ${font}`;
        ctx.textAlign = "right";
        ctx.fillStyle = levelColor;
        shadowText(
            `Level ${level}`,
            levelPosition.x, levelPosition.y,
            10, 5,
            levelShadowColor
        );
        const levelHeight = ctx.measureText(`Level ${level}`).actualBoundingBoxAscent;
        ctx.font = `${rankSize}px ${font}`;
        ctx.fillStyle = rankColor;
        shadowText(
            `Rank #${rank}`,
            levelPosition.x - 10, levelPosition.y + levelHeight - 20,
            2, 2
        );

        //#endregion

        //#region No badges
        const
            badgeCount = badges.length,
            badgeTextFontSize = 40,
            noBadgesFontSize = 30,
            noBadgesColor = "#3E3E3E",
            badgeTextPosition = {
                x: 20,
                y: 245
            }
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.font = `${badgeTextFontSize}px ${font}`;
        if (!badgeCount) {
            ctx.font = `${noBadgesFontSize}px ${font}`;
            ctx.fillStyle = noBadgesColor;
            shadowText(
                `/badges`,
                badgeTextPosition.x, badgeTextPosition.y,
                4, 3
            );
        }

        //#endregion

        //#region Badges
        const badgeSizeOffset = 7;
        const badgeOffsetX = 75;
        
        // Offset to center badges
        let badgeStartOffsetX = 0;
        if (badges.length === 1) { badgeStartOffsetX = 70; }
        if (badges.length === 2) { badgeStartOffsetX = 32; }

        
        // Iterate through badges
        for (let i = 0; i < badges.length; i++) {
            // Get badge
            const badge = badges[i];
            // Get badge image
            const path = `./data/images/badges/${badge.id}/${badge.id}.png`
            const badgeImg = await Canvas.loadImage(path);
            // Set badge size and position
            const badgeSizeY = badgeImg.height / badgeSizeOffset;
            const badgeSizeX = badgeImg.width / badgeSizeOffset;
            const badgePosition = {
                x: 40 + i * badgeOffsetX + badgeStartOffsetX,
                y: 285,
            };    

            ctx.drawImage(
                badgeImg,
                badgePosition.x - badgeSizeX / 2,
                badgePosition.y - badgeSizeY / 2,
                badgeSizeX,
                badgeSizeY
            );
        }
        //#endregion

        return new MessageAttachment(canvas.toBuffer(), "levelup.png");
    },
    /**
     * @param {Message} message 
     * @param {DBGuildMember} DBGuildMember 
     * @param {Number} level 
     * @param {MySQL} sql
     */
    async createLevelupImageGlobal(message, level, sql) {
        const canvas = Canvas.createCanvas(700, 500),
            ctx = canvas.getContext("2d"),

            UserDB = await sql.get("users", ``, "xp DESC"),
            rank = UserDB.findIndex(user => user.id == message.author.id) + 1,
            nextDBUser = UserDB.find((_user, index) => index == rank - 2),
            DBUser = UserDB.find((user) => user.id == message.author.id),
            background = await Canvas.loadImage(`./data/levelupBackgrounds/${DBUser.currentBackground}.png`),
            avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: "png" })),
            dunhammer = await Canvas.loadImage("https://cdn.discordapp.com/avatars/671681661296967680/6ae7fd60617e8bd7388d239b450afad1.png"),
            coin = await Canvas.loadImage("./data/images/DunhammerCoin.png"),
            badges = (await sql.getDBBadges()).filter(badge => badge.bitId & DBUser.currentBadges),
            font = 'Nyata FTR, Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif, Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace, Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif',
            // {    Discord fonts
            //     --font-primary: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-display: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-code: Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace;
            //     --font-korean: Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-japanese: Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-chinese-simplified: Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
            //     --font-chinese-traditional: Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
            // }
            /**
             * Draws text with a shadow
             * @param {String} text
             * @param {Number} x
             * @param {Number} y
             * @param {Number} shadowBlur
             * @param {Number} lineWidth
             */
            shadowText = (text, x, y, shadowBlur, lineWidth, shadowColor) => {
                ctx.strokeStyle = "black";
                ctx.shadowColor = shadowColor || "black";
                ctx.shadowBlur = shadowBlur;
                ctx.lineWidth = lineWidth;
                ctx.strokeText(
                    text,
                    x,
                    y
                );
                ctx.shadowBlur = 0;
                ctx.fillText(
                    text,
                    x,
                    y
                );        
            },

        //#region Background image
            cornerCropSize = 225,
            bgCropRotationOffset = 30,
            whiteBeginX = 700,
            whiteOffset = 200,
            bottomBarHeight = 125,
            bottomBarColor = "#99cc6633";
        // Image
        ctx.beginPath();
        ctx.moveTo(cornerCropSize + bgCropRotationOffset, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.lineTo(0, cornerCropSize - bgCropRotationOffset);
        ctx.closePath();
    
        ctx.save();
        ctx.clip();
    
        ctx.drawImage(background, 0, 0);
        ctx.restore();
        // Bottom right white
        const addWhiteTriangle = (offset, fillAmount) => {
            ctx.beginPath();
            ctx.moveTo(whiteBeginX + bgCropRotationOffset + offset, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(
                whiteBeginX - canvas.height - bgCropRotationOffset + offset,
                canvas.height
            );
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${fillAmount})`;
            ctx.fill();
        };
        for (let i = 0; i < 5; i++) {
            addWhiteTriangle(i * whiteOffset, 0.05 * i + 0.15);
        }
        // Bottom green
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, canvas.height - bottomBarHeight);
        ctx.lineTo(canvas.width, canvas.height - bottomBarHeight);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = bottomBarColor;
        ctx.fill();

        //#endregion

        //#region Avatar
        const avatarSize = 175,
            avatarPosition = {
                x: 115,
                y: 115,
            },
            borderWidth = 3;
        ctx.beginPath();
        ctx.arc(avatarPosition.x, avatarPosition.y, avatarSize / 2, 0, 6.28, false);
        ctx.closePath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        ctx.save();
        ctx.clip();

        ctx.drawImage(
            avatar,
            avatarPosition.x - avatarSize / 2,
            avatarPosition.y - avatarSize / 2,
            avatarSize,
            avatarSize
        );
        ctx.restore();
        //#endregion

        //#region Leaderboard
        const
            iconSize = 85,
            iconCornerOffsetY = (bottomBarHeight - iconSize) / 2,
            iconCornerOffsetX = 20,
            iconPosition = {
                x: canvas.width - iconSize / 2 - iconCornerOffsetX,
                y: canvas.height - iconSize / 2 - iconCornerOffsetY - 10
            },
            iconOutlineWidth = 3,
            leaderboardText = "Global Dunhammer Leaderboard";
        ctx.beginPath();
        ctx.arc(
            iconPosition.x,
            iconPosition.y,
            iconSize / 2,
            0,
            6.28,
            false
        );
        ctx.closePath();
        ctx.lineWidth = iconOutlineWidth;
        ctx.stroke();
        ctx.save();
        ctx.clip();

        ctx.drawImage(
            dunhammer,
            iconPosition.x - iconSize / 2,
            iconPosition.y - iconSize / 2,
            iconSize,
            iconSize
        );
        ctx.restore();
        
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.font = `24px ${font}`;
        const leaderboardTextHeight = ctx.measureText(leaderboardText).actualBoundingBoxAscent;
        shadowText(
            leaderboardText,
            iconPosition.x + iconSize / 2,
            iconPosition.y + iconSize / 2 + leaderboardTextHeight + 7
        );

        //#endregion

        //#region xp behind
        const
            firstLine = rank > 1 ?`${nextDBUser.xp - DBUser.xp} xp behind` : "Congratulations:",
            secondLine = rank > 1 ? nextDBUser.username : "You're 1st place!",
            xpBehindColor = "#999999";
        let xpBehindFontSize = 50;

        ctx.font = `${xpBehindFontSize}px ${font}`;
        while (ctx.measureText(secondLine).width > 550) {
            ctx.font = `${xpBehindFontSize -= 2}px ${font}`;
        }
        
        ctx.fillStyle = xpBehindColor;
        ctx.textAlign = "left";
        shadowText(
            secondLine,
            10, canvas.height - 36,
            2, 2
        );
        ctx.font = `35px ${font}`;
        shadowText(
            firstLine,
            10, canvas.height - 55 - ctx.measureText(secondLine).actualBoundingBoxAscent,
            2, 2
        );
        //#endregion

        //#region Nickname
        const
            nickname = message.author.username,
            nicknamePos = {
                x: 250,
                y: 100
            }
        let nicknameSize = 90;
        ctx.fillStyle = "white";
        ctx.font = `${nicknameSize}px ${font}`;
        ctx.textAlign = "left";
        while (ctx.measureText(nickname).width > 425) {
            ctx.font = `${nicknameSize -= 2}px ${font}`;
        }
        shadowText(
            nickname,
            nicknamePos.x, nicknamePos.y,
            4, 4
        );
        //#endregion

        //#region Level / Rank
        const
            levelSize = 120,
            rankSize = 70,
            levelColor = "#99cc66",
            rankColor = "white",
            levelShadowColor = "#99cc66",
            levelPosition = {
                x: 675,
                y: 275
            }
            
        ctx.font = `${levelSize}px ${font}`;
        ctx.textAlign = "right";
        ctx.fillStyle = levelColor;
        shadowText(
            `Level ${level}`,
            levelPosition.x, levelPosition.y,
            10, 5,
            levelShadowColor
        );
        const
            levelHeight = ctx.measureText(`Level ${level}`).actualBoundingBoxAscent,
            levelWidth = ctx.measureText(`Level ${level}`).width;
        ctx.font = `${rankSize}px ${font}`;
        ctx.fillStyle = rankColor;
        shadowText(
            `Rank #${rank}`,
            levelPosition.x - 10, levelPosition.y + levelHeight - 20,
            2, 2
        );

        //#endregion

        //#region Coins
        const
            coinFontSize = 50,
            coinColor = "#f9f06c",
            coinPosition = {
                x: levelPosition.x - levelWidth + 135,
                y: levelPosition.y - levelHeight
            }
        
        ctx.fillStyle = coinColor;
        ctx.font = `${coinFontSize}px ${font}`;
        shadowText(
            `+${level * 10}`,
            coinPosition.x, coinPosition.y,
            5, 2,
            coinColor
        );
        ctx.drawImage(coin, coinPosition.x + 15, coinPosition.y - coinFontSize + 9, coinFontSize - 5, coinFontSize - 5);
        //#endregion

        //#region No badges
        const
            badgeCount = badges.length,
            badgeTextFontSize = 40,
            noBadgesFontSize = 30,
            noBadgesColor = "#3E3E3E",
            badgeTextPosition = {
                x: 20,
                y: 245
            }
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.font = `${badgeTextFontSize}px ${font}`;
        if (!badgeCount) {
            ctx.font = `${noBadgesFontSize}px ${font}`;
            ctx.fillStyle = noBadgesColor;
            shadowText(
                `/badges`,
                badgeTextPosition.x, badgeTextPosition.y,
                4, 3
            );
        }

        //#endregion

        //#region Badges
        const badgeSizeOffset = 7;
        const badgeOffsetX = 75;
        
        // Offset to center badges
        let badgeStartOffsetX = 0;
        if (badges.length === 1) { badgeStartOffsetX = 70; }
        if (badges.length === 2) { badgeStartOffsetX = 32; }

        
        // Iterate through badges
        for (let i = 0; i < badges.length; i++) {
            // Get badge
            const badge = badges[i];
            // Get badge image
            const path = `./data/images/badges/${badge.id}/${badge.id}.png`
            const badgeImg = await Canvas.loadImage(path);
            // Set badge size and position
            const badgeSizeY = badgeImg.height / badgeSizeOffset;
            const badgeSizeX = badgeImg.width / badgeSizeOffset;
            const badgePosition = {
                x: 40 + i * badgeOffsetX + badgeStartOffsetX,
                y: 285,
            };    

            ctx.drawImage(
                badgeImg,
                badgePosition.x - badgeSizeX / 2,
                badgePosition.y - badgeSizeY / 2,
                badgeSizeX,
                badgeSizeY
            );
        }
        //#endregion


        return new MessageAttachment(canvas.toBuffer(), "levelup.png");
    }

}
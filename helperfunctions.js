/* eslint-disable no-unused-vars */
// CanvasImages
const fs = require('fs'),
    FormData = require('form-data'),
    { createCanvas, loadImage } = require('canvas'),
    { default: fetch} = require('node-fetch'),
    MySQL = require("./sql/sql");

const { Client, TextChannel, MessageEmbed, MessageAttachment, Message, Channel, GuildMember, Guild, DiscordAPIError } = require('discord.js'),

    CanvasImagesMeta = {
        //#region roundRect
        // Credits for this function to Juan Mendes on StackOverflow (https://stackoverflow.com/users/227299/juan-mendes)
        /**
        * Draws a rounded rectangle using the current state of the canvas.
        * If you omit the last three params, it will draw a rectangle
        * outline with a 5 pixel border radius
        * @param {CanvasRenderingContext2D} ctx
        * @param {Number} x The top left x coordinate
        * @param {Number} y The top left y coordinate
        * @param {Number} width The width of the rectangle
        * @param {Number} height The height of the rectangle
        * @param {Number|Object} [radius = 5] The corner radius; It can also be an object 
        *                 to specify different radii for corners
        * @param {Number} [radius.tl = 0] Top left
        * @param {Number} [radius.tr = 0] Top right
        * @param {Number} [radius.br = 0] Bottom right
        * @param {Number} [radius.bl = 0] Bottom left
        * @param {Boolean} [fill = false] Whether to fill the rectangle.
        * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
        */
        roundRect: function (ctx, x, y, width, height, radius, fill, stroke) {
            if (typeof stroke === 'undefined') {
                stroke = true;
            }
            if (typeof radius === 'undefined') {
                radius = 5;
            }
            if (typeof radius === 'number') {
                radius = {tl: radius, tr: radius, br: radius, bl: radius};
            } else {
                var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
                for (var side in defaultRadius) {
                    radius[side] = radius[side] || defaultRadius[side];
                }
            }
            ctx.beginPath();
            ctx.moveTo(x + radius.tl, y);
            ctx.lineTo(x + width - radius.tr, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
            ctx.lineTo(x + width, y + height - radius.br);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            ctx.lineTo(x + radius.bl, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
            ctx.lineTo(x, y + radius.tl);
            ctx.quadraticCurveTo(x, y, x + radius.tl, y);
            ctx.closePath();
            if (fill) {
                ctx.fill();
            }
            if (stroke) {
                ctx.stroke();
            }
        },
        //#endregion
        //#region fillStrokeText
        /**
         * Draws text with an outer stroke.
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} text
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [strokeWidth = 5]
         * @param {string} [strokeColor = black]
         * @param {string} [textColor = white]
         */
        fillStrokeText: function (ctx, text, x, y, strokeWidth, strokeColor, textColor) {
            strokeWidth = strokeWidth ? strokeWidth : 5;
            strokeColor = strokeColor ? strokeColor : "black";
            textColor = textColor ? textColor : "white";
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth*2;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
            ctx.fillStyle = textColor;
            ctx.fillText(text, x, y);
        },
        //#endregion
        //#region measureTextPlus
        /**
         * Measures text in a given font. Font uses regular Canvas font designation.
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} text Text to measure
         * @param {string} [font = ctx.font] Font to measure in
         */
        measureTextPlus: function (ctx, text, font) {
            const old_font = ctx.font
            ctx.font = font ? font : ctx.font;
            const old = ctx.measureText(text),
                measured = {
                    old: old,
                    height: old.emHeightAscent + old.emHeightDescent,
                }
            ctx.font = old_font;
            return measured;
        },
    //#endregion
    }
const CanvasImage = {
        //#region rank_image
        /**
         * Draws an image showcasing the members level, their rank and experience bar, and saves it as 'level.png' to 'imageData/'.
         * @param {GuildMember} member The Discord Guild member
         * @param {MySQL} sql MySQL object
         */
        rank_image: async function (member, sql) {
            const userDB = await sql.get("guild-users", `guildid = ${member.guild.id}`, "xp DESC"),
                DBUser = userDB.find(user => user.userid == member.id),
                xpTotal = DBUser.xp,
                currentLevel = DBUser.level,
                nextLevel = currentLevel + 1,
                currentXP = xpTotal - 5*(118*currentLevel+2*currentLevel*currentLevel*currentLevel)/6,
                xpForNextLevel = 5*(118*nextLevel+2*nextLevel*nextLevel*nextLevel)/6 - 5*(118*currentLevel+2*currentLevel*currentLevel*currentLevel)/6,
                rank = userDB.findIndex(user => user.userid == member.id)+1,

            // Creating the image
                canvas = createCanvas(1000, 300),
                ctx = canvas.getContext('2d'),
                font = 'Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif, Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace, Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif';
                        // {    Discord fonts
                        //     --font-primary: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
                        //     --font-display: Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;
                        //     --font-code: Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace;
                        //     --font-korean: Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif;
                        //     --font-japanese: Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif;
                        //     --font-chinese-simplified: Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
                        //     --font-chinese-traditional: Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif;
                        // }
            // set box avatar_size. 320 is whitespace + profile picture length
            ctx.font = `bold 46px ${font}`;
            const username_text_length = ctx.measureText(member.user.username).width;
            ctx.font = `36px${font}`;
            const tag_text_length = ctx.measureText(member.user.tag.slice(-5)).width;
            canvas.width = Math.max(username_text_length + tag_text_length + 400, 1000);
            // background
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.fill();
            // username
            ctx.font = `36px ${font}`;
            ctx.fillStyle = "#A6A7AA";
            ctx.font = 'bold 60px' + font;
            ctx.fillStyle = "white";
            const username_text_height = ctx.measureText(member.user.username).emHeightAscent,
                username_text_width = ctx.measureText(member.user.username).width;
            ctx.fillText(member.user.username, 300, 50 + username_text_height);
            // tag
            ctx.font = `36px ${font}`;
            ctx.fillStyle = "#A6A7AA";
            ctx.fillText(member.user.tag.slice(-5), 300 + username_text_width, 50 + username_text_height);
            // experience bar
            ctx.fillStyle = "#4a4a4a";
            CanvasImagesMeta.roundRect(ctx, 290, 240, canvas.width - 320, 30, 16, true, false);  // background
            ctx.fillStyle = "#54b35d";
            if (currentXP/xpForNextLevel > 0.02) {
                CanvasImagesMeta.roundRect(ctx, 290, 240, currentXP/xpForNextLevel * (canvas.width - 320), 30, 16, true, false);
            }    // xp_total filled up
            // xp for next lvl
            ctx.font = `34px ${font}`;
            ctx.fillStyle = '#A6A7AA';
            const xp_requried_text = ctx.measureText(` / ${xpForNextLevel} xp_total`), //<!-- FIX THIS --!>
                description_text_y = 240 - xp_requried_text.emHeightAscent + xp_requried_text.emHeightDescent;
            ctx.fillText(` / ${xpForNextLevel} xp`, canvas.width - xp_requried_text.width, description_text_y);
            // current xp_total
            ctx.font = `34px ${font}`;
            ctx.fillStyle = 'white';
            const xp_current_text = ctx.measureText(`${currentXP}`);
            ctx.fillText(`${currentXP}`, canvas.width - xp_requried_text.width - xp_current_text.width, description_text_y);
            // level
            const xp_text_width = xp_requried_text.width + xp_current_text.width;
            ctx.font = `bold 80px ${font}`;
            ctx.fillStyle = "#54b35d";
            const level_number = ctx.measureText(`${currentLevel}`);
            ctx.fillText(`${currentLevel}`, canvas.width - level_number.width - xp_text_width - 30, description_text_y);
            // level text
            ctx.font = `34px ${font}`;
            const level_text = ctx.measureText(`LEVEL`);
            ctx.fillText(`LEVEL`, canvas.width - level_number.width - xp_text_width - 40 - level_text.width, description_text_y);
            // rank
            ctx.font = `bold 80px ${font}`;
            ctx.fillStyle = "white";
            const rank_number = ctx.measureText(`${rank}`);
            ctx.fillText(`${rank}`, canvas.width - level_number.width - xp_text_width - 70 - level_text.width - rank_number.width, description_text_y);
            // rank text
            ctx.font = `34px ${font}`;
            const rank_text = ctx.measureText(`RANK`);
            ctx.fillText(`RANK`, canvas.width - level_number.width - xp_text_width - 80 - level_text.width - rank_number.width - rank_text.width, description_text_y);

            const avatar_url = member.user.displayAvatarURL({format: "png", dynamic: true, avatar_size: 256}),
                image = await loadImage(avatar_url);

            // clip profile picture
            ctx.beginPath();
            ctx.arc(150, 150, 120, 0, 6.28, false);
            ctx.clip();

            ctx.drawImage(image, 30, 30, 240, 240);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync('./imageData/generated/level.png', buffer);
        },
        //#endregion
        //#region levelup_image
        /**
         * Draws an image showcasing the members new level and rank, and saves it as 'levelup.png' to 'imageData/'.
         * @param {GuildMember} member The Discord Guild member
         * @param {RowDataPacket} DBGuildUser The database of saved users
         * @param {Guild} guild The guild of the user
         * @param {MySQL} sql MySQL isntance
         */
        levelup_image: async function (member, DBGuildUser, guild, sql) {
            const avatar_size = 200,
                DBSortedByXP = await sql.get("guild-users", `guildid = ${guild.id}`, "xp DESC"),
                rank = DBSortedByXP.findIndex(element => element.userid == member.id) + 1;
            let nextDBUser = undefined,
                nextUserXP,
                XPBehindText,
                nextDiscordMember;
            if (rank != 1) {
                nextDBUser = DBSortedByXP.find((_element, index) => index == rank-2);
                try {
                    nextDiscordMember = await guild.members.fetch(nextDBUser.userid);
                } catch (err) {
                    if (err.message === "Unknown User" || err.message === "Unknown Member") {
                        nextDBUser.inGuild = false;
                        await sql.update("guild-users", nextDBUser, `guildid = ${nextDBUser.guildid} AND userid = ${nextDBUser.userid}`)
                    }
                    nextDiscordMember = { nickname: "DELETED USER" }
                }
                nextUserXP = nextDBUser.xp;
                XPBehindText = `${nextUserXP - DBGuildUser.xp} xp behind`;
            }
            
            const canvas = createCanvas(700, 600),
                ctx = canvas.getContext('2d'),
            
                level_text = `LEVEL ${DBGuildUser.level}`,
                username_text = `${member.nickname || member.user.username}`,
                rank_text = `RANK #${rank}`;

            canvas.width = canvas.width < CanvasImagesMeta.measureTextPlus(ctx, username_text, `60px Arial`).old.width+200 ? CanvasImagesMeta.measureTextPlus(ctx, username_text, `60px Arial`).old.width+200 : canvas.width;
            if (nextDiscordMember) canvas.width = canvas.width < CanvasImagesMeta.measureTextPlus(ctx, `${ nextDiscordMember.nickname || nextDiscordMember.user.username}`, `30px Arial`).old.width+500 ? CanvasImagesMeta.measureTextPlus(ctx, `${nextDiscordMember.nickname || nextDiscordMember.user.username}`, `30px Arial`).old.width+500 : canvas.width;
            const center = {
                    x: canvas.width/2,
                    y: canvas.height/2
                },
                font = 'Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif, Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace, Whitney,"Apple SD Gothic Neo","NanumBarunGothic","맑은 고딕","Malgun Gothic",Gulim,굴림,Dotum,돋움,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,Hiragino Sans,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","メイリオ",Meiryo,Osaka,"MS PGothic","Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft YaHei New",微软雅黑,"Microsoft Yahei","Microsoft JhengHei",宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif, Whitney,"Microsoft JhengHei",微軟正黑體,"Microsoft JhengHei UI","Microsoft YaHei",微軟雅黑,宋体,SimSun,"Helvetica Neue",Helvetica,Arial,sans-serif';
            //background
            ctx.fillStyle = "#9ED3FF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#4D8C69";
            ctx.fillRect(0, canvas.height/2+20, canvas.width, canvas.height/2-20);
            //add images
            const backgroundLeft = await loadImage('./imageData/levelupBGLeft.png'),
                backgroundRight = await loadImage('./imageData/levelupBGRight.png');
            ctx.drawImage(backgroundLeft, 0, 0, 246, 600);
            ctx.drawImage(backgroundRight, canvas.width-246, 0, 246, 600);
            //rank
            ctx.textAlign = "center";
            ctx.font = `40px ${font}`;
            CanvasImagesMeta.fillStrokeText(
                ctx, rank_text, center.x, 
                0+ctx.measureText(rank_text).emHeightAscent, // y coordinate
                3
            );
            //levelup
            ctx.font = `70px ${font}`;
            CanvasImagesMeta.fillStrokeText(
                ctx, `LEVEL UP!`, center.x, 
                0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px ${font}`).height+ctx.measureText(`LEVEL UP!`).emHeightAscent,
                3
            );
            if (nextDiscordMember) {
                //xp behind
                ctx.font = `30px ${font}`;
                CanvasImagesMeta.fillStrokeText(
                    ctx, `${XPBehindText}`, center.x,
                    0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px ${font}`).height+CanvasImagesMeta.measureTextPlus(ctx, `LEVEL UP!`, `70px ${font}`).height+ctx.measureText(`${XPBehindText}`).emHeightAscent-10,
                    2
                );
                //person
                CanvasImagesMeta.fillStrokeText(
                    ctx, `${nextDiscordMember.nickname || nextDiscordMember.user.username}`, center.x,
                    0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px ${font}`).height+CanvasImagesMeta.measureTextPlus(ctx, `LEVEL UP!`, `70px ${font}`).height+CanvasImagesMeta.measureTextPlus(ctx, `${XPBehindText}`).height+20,
                    2
                );
            }
            //level
            ctx.font = `100px ${font}`;
            CanvasImagesMeta.fillStrokeText(
                ctx, level_text, center.x, 
                center.y+avatar_size/2+ctx.measureText(level_text).emHeightAscent, // y coordinate
                3, "#007820", "#2bd95a"
            );
            //username
            ctx.font = `60px ${font}`;
            CanvasImagesMeta.fillStrokeText(ctx, username_text, center.x, 
                center.y+avatar_size/2+ctx.measureText(username_text).emHeightAscent+CanvasImagesMeta.measureTextPlus(ctx, level_text, `100px Arial`).height, 
                3
            );
            const avatar = await loadImage(member.user.displayAvatarURL({ format: "png", dynamic: true, avatar_size: 256 })),
            // crop
                vOffset = 0;
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2+vOffset, avatar_size/2, 0, 6.28, false);
            ctx.clip();
            // center image
            ctx.drawImage(avatar, canvas.width/2-avatar_size/2, canvas.height/2-avatar_size/2+vOffset, avatar_size, avatar_size);

            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync('./imageData/generated/level.png', buffer);
        },
        //#endregion
    },

    QuickMessage = {
        //#region error
        /**
         * Sends an embed with an error message.
         * @param {TextChannel} channel The channel to send the message
         * @param {string} error The message to send
         */
        error: function (channel, error) {
            return channel.send({ embed: {
                color: 0xcf2f2f,
                title: ":octagonal_sign: Error!",
                description: error
            }});
        },
        //#endregion
        //#region invalid_channel
        /**
         * Sends an "Invalid channel" error.
         * @param {TextChannel} channel Channel to send the error in
         * @param {string} prefix Guild prefix
         * @param {string} command Failed command
         */
        invalid_channel: function (channel, prefix, command) {
            return channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Invalid channel! Use ${prefix}help ${command} for help.`
            }});
        },
        //#endregion
        //#region invalid_argument
        /**
         * Sends an "Invalid argument" error.
         * @param {TextChannel} channel Channel to send the error in
         * @param {String} prefix Guild prefix
         * @param {String} command Failed command
         */
        invalid_argument: function (channel, prefix, command) {
            return channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Invalid argument! Use \`${prefix}help ${command}\` for help.`
            }});
        },
        //#endregion
        //#region invalid_role
        /**
         * Sends an "Invalid role" error.
         * @param {TextChannel} channel Channel to send the error in
         * @param {string} prefix Guild prefix
         * @param {string} command Failed command
         */
        invalid_role: function (channel, prefix, command) {
            return channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Invalid role! Use \`${prefix}help ${command}\` for help.`
            }});
        },
        //#endregion
        //#region invalid_user
        invalid_user: function (channel) {
            return channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:no_pedestrians: User not found!`
            }});
        },
        //#region not_enough_arguments
        /**
         * Sends a "Not enough arguments" error.
         * @param {TextChannel} channel Channel to send the error in
         * @param {string} prefix Guild prefix
         * @param {string} command Failed command
         */
        not_enough_arguments: function (channel, prefix, command) {
            return channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Not enough arguments! Use \`${prefix}help ${command}\` for help.`
            }});
        },
        //#endregion
        //#region add
        /**
         * Sends an "Add" message.
         * @param {TextChannel} channel Channel to send the message in
         * @param {string} message Message
         */
        add: function (channel, message) {
            return channel.send({ embed: {
                color: 2215713,
                description: `:white_check_mark: ${message}`
            }});
        },
        //#endregion
        //#region remove
        /**
         * Sends a "Remove" message.
         * @param {TextChannel} channel Channel to send the message in
         * @param {string} message Message
         */
        remove: function (channel, message) {
            return channel.send({ embed: {
                color: 2215713,
                description: `:x: ${message}`
            }});
        },
        //#endregion
        //#region info
        /**
         * Sends an "Info" message.
         * @param {TextChannel} channel Channel to send the message in
         * @param {string} title Title of the message
         * @param {string} message Message
         */
        info: function (channel, title, message) {
            return channel.send({ embed: {
                color: 49919,
                title: `:information_source: ${title}`,
                description: `${message}`
            }});
        },
        //#endregion
        //#region success
        /**
         * Sends a "Success" message.
         * @param {TextChannel} channel Channel to send the message in
         * @param {string} message Message
         */
        success: function (channel, message) {
            return channel.send({ embed: {
                color: 2215713,
                description: `${message}`
            }});
        },
        //#endregion
        //#region confirmation
        /**
         * Sends a "Confirmation" message.
         * @param {TextChannel} channel Channel to send the message in
         * @param {string} message Message
         */
        confirmation: function (channel, message) {
            return channel.send({ embed: {
                color: 0xe86b0c,    // Orange, awaiting user input
                description: `:grey_question: ${message}`
            }});
        },
        //#endregion
        //#region confirmation_timeout
        confirmation_timeout: function (message) {
            return {
                color: 0x96430f,    // Darker/redder version of awaiting user input, user input timeout/fail
                description: `~~:grey_question: ${message}~~\n\n**:x: Timeout!**`
            }
        },
        //#region update
        update: function (channel, message) {
            return channel.send({ embed: {
                color: 2215713,
                description: `:repeat: ${message}`
            }});
        },
        //#endregion
    },

    apiFunctions = {
        /**
         * Edits a Discord Interaction beacause fuck discord this is the only way to do it. use async. Returns Discord.js Message.
         * @param {Client} client Discord.js client
         * @param {Object} interaction Interaction token
         * @param {TextChannel} channel Any channel
         * @param {String|object} [message="‏‏‎ ‎"] String or embed
         * @returns {Promise<Discord.Message>} Message object‏‏‎
         */
        interactionEdit: async function (client, interaction, channel, message) {
            message ||= "‏‏‎ ‎";
            const body = typeof message == "object" ? { embeds: [message] } : { content: message },

                res = await fetch(`https://discord.com/api/v8/webhooks/${client.user.id}/${interaction.token}/messages/@original`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                    headers: {            
                        'Authorization': `Bot ${client.token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                json = await res.json();
            if (res.status == 400) {
                console.error("Discord API error! (is the embed formated properly?)");
                console.error(res);
            } else {
                const returnMessage = await channel.messages.fetch(json.id);
                return returnMessage;
            }
        },
        /**
         * I dont know what this functio does
         * @param {Client} client Discord.js client
         * @param {object} interaction Interaction object
         * @param {object} embed Message embed
         */
        interactionResponse: async function (client, interaction, embed) {
            const options = {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 4,
                        data: {
                            embeds: [embed],
                        },
                    }),
                    headers: {
                        'Authorization': `Bot ${client.token}`,
                        'Content-Type': 'application/json',
                    },
                },
                res = await fetch(`https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`, options);
        }
    }

module.exports = { CanvasImage, QuickMessage, apiFunctions }
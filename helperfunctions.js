//@ts-check

// CanvasImages
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const CanvasImagesMeta = {
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
    * @param {Number} [radius = 5] The corner radius; It can also be an object 
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
        const old = ctx.measureText(text);
        const measured = {
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
     * @param {LokiJSCollection} user_database The database of saved users
     */
    rank_image: async function (member, user_database) {
        let database_user = user_database.findOne({ user_id: member.id });
        let xp_total = database_user.xp;
        let current_level = database_user.level;
        let next_level = current_level + 1;
        let current_xp = xp_total - 5*(118*current_level+2*current_level*current_level*current_level)/6;
        let xp_for_next_level = 5*(118*next_level+2*next_level*next_level*next_level)/6 - 5*(118*current_level+2*current_level*current_level*current_level)/6;
        let rank = user_database.chain().simplesort('xp', true).data().findIndex(element => element.user_id == member.id) + 1;

        // Creating the image
        const canvas = createCanvas(1000, 300);
        const ctx = canvas.getContext('2d');
        const font = 'Arial';
        // set box avatar_size. 320 is whitespace + profile picture length
        ctx.font = `bold 46px ${font}`;
        let username_text_length = ctx.measureText(member.user.username).width;
        ctx.font = `36px${font}`;
        let tag_text_length = ctx.measureText(member.user.tag.slice(-5)).width;
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
        let username_text_height = ctx.measureText(member.user.username).emHeightAscent;
        let username_text_width = ctx.measureText(member.user.username).width;
        ctx.fillText(member.user.username, 300, 50 + username_text_height);
        // tag
        ctx.font = `36px ${font}`;
        ctx.fillStyle = "#A6A7AA";
        ctx.fillText(member.user.tag.slice(-5), 300 + username_text_width, 50  + username_text_height);
        // experience bar
        ctx.fillStyle = "#4a4a4a";
        CanvasImagesMeta.roundRect(ctx, 290, 240, canvas.width - 320, 30, 16, true, false);  // background
        ctx.fillStyle = "#54b35d";
        CanvasImagesMeta.roundRect(ctx, 290, 240, (current_xp/xp_for_next_level) * (canvas.width - 320), 30, 16, true, false);    // xp_total filled up
        // xp for next lvl
        ctx.font = `34px ${font}`;
        ctx.fillStyle = '#A6A7AA';
        let xp_requried_text = ctx.measureText(` / ${xp_for_next_level} xp_total`); //<!-- FIX THIS --!>
        let description_text_y = 240 - xp_requried_text.emHeightAscent + xp_requried_text.emHeightDescent;
        ctx.fillText(` / ${xp_for_next_level} xp`, canvas.width - xp_requried_text.width, description_text_y);
        // current xp_total
        ctx.font = `34px ${font}`;
        ctx.fillStyle = 'white';
        let xp_current_text = ctx.measureText(`${current_xp}`);
        ctx.fillText(`${current_xp}`, canvas.width - xp_requried_text.width - xp_current_text.width, description_text_y);
        // level
        let xp_text_width = xp_requried_text.width + xp_current_text.width;
        ctx.font = `bold 80px ${font}`;
        ctx.fillStyle = "#54b35d";
        let level_number = ctx.measureText(`${current_level}`);
        ctx.fillText(`${current_level}`, canvas.width - level_number.width - xp_text_width - 30, description_text_y);
        // level text
        ctx.font = `34px ${font}`;
        let level_text = ctx.measureText(`LEVEL`);
        ctx.fillText(`LEVEL`, canvas.width - level_number.width - xp_text_width - 40 - level_text.width, description_text_y);
        // rank
        ctx.font = `bold 80px ${font}`;
        ctx.fillStyle = "white";
        let rank_number = ctx.measureText(`${rank}`);
        ctx.fillText(`${rank}`, canvas.width - level_number.width - xp_text_width - 70 - level_text.width - rank_number.width, description_text_y);
        // rank text
        ctx.font = `34px ${font}`;
        let rank_text = ctx.measureText(`RANK`);
        ctx.fillText(`RANK`, canvas.width - level_number.width - xp_text_width - 80 - level_text.width - rank_number.width - rank_text.width, description_text_y);

        let avatar_url = member.user.displayAvatarURL({format: "png", dynamic: true, avatar_size: 256});
        let image = await loadImage(avatar_url);

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
     * @param {LokiJSCollection} user_database The database of saved users
     * @param {Guild} guild The guild of the user
     */
    levelup_image: async function (member, user_database, guild) {
        const database_user = user_database.findOne({ user_id: member.id });
        const avatar_size = 200;
        const rank = user_database.chain().simplesort('xp', true).data().findIndex(element => element.user_id == member.id) + 1;
        let next_database_user = undefined;
        let next_user_xp;
        let xp_behind_text;
        let next_discord_member;
        if (rank != 1) {
            next_database_user = user_database.chain().simplesort('xp', true).data().find((_element, index) => index == rank-2);
            try {
                next_discord_member = await guild.members.fetch(next_database_user.user_id);
            } catch (err) {
                console.log(err);
            }
            next_user_xp = next_database_user.xp;
            xp_behind_text = `${next_user_xp - database_user.xp} xp behind`;
        }
        
        const canvas = createCanvas(700, 600);
        const ctx = canvas.getContext('2d');
        
        const level_text = `LEVEL ${database_user.level}`;
        const username_text = `${member.nickname || member.user.username}`;
        const rank_text = `RANK #${rank}`;

        canvas.width = canvas.width < CanvasImagesMeta.measureTextPlus(ctx, username_text, `60px Arial`).old.width+200 ? CanvasImagesMeta.measureTextPlus(ctx, username_text, `60px Arial`).old.width+200 : canvas.width;
        if (next_discord_member) canvas.width = canvas.width < CanvasImagesMeta.measureTextPlus(ctx, `${ next_discord_member.nickname || next_discord_member.user.username}`, `30px Arial`).old.width+500 ? CanvasImagesMeta.measureTextPlus(ctx, `${next_discord_member.nickname || next_discord_member.user.username}`, `30px Arial`).old.width+500 : canvas.width;
        const center = {
            x: canvas.width/2,
            y: canvas.height/2
        }
        
        //background
        ctx.fillStyle = "#9ED3FF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#4D8C69";
        ctx.fillRect(0, canvas.height/2+20, canvas.width, canvas.height/2-20);
        //add images
        let backgroundLeft = await loadImage('./imageData/levelupBGLeft.png');
        let backgroundRight = await loadImage('./imageData/levelupBGRight.png');
        ctx.drawImage(backgroundLeft, 0, 0, 246, 600);
        ctx.drawImage(backgroundRight, canvas.width-246, 0, 246, 600);
        //rank
        ctx.textAlign = "center";
        ctx.font = `40px Arial`;
        CanvasImagesMeta.fillStrokeText(
            ctx, rank_text, center.x, 
            0+ctx.measureText(rank_text).emHeightAscent, // y coordinate
            3
        );
        //levelup
        ctx.font = `70px Arial`;
        CanvasImagesMeta.fillStrokeText(
            ctx, `LEVEL UP!`, center.x, 
            0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px Arial`).height+ctx.measureText(`LEVEL UP!`).emHeightAscent,
            3
        );
        if (next_discord_member) {
            //xp behind
            ctx.font = `30px Arial`;
            CanvasImagesMeta.fillStrokeText(
                ctx, `${xp_behind_text}`, center.x,
                0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px Arial`).height+CanvasImagesMeta.measureTextPlus(ctx, `LEVEL UP!`, `70px Arial`).height+ctx.measureText(`${xp_behind_text}`).emHeightAscent-10,
                2
            );
            //person
            CanvasImagesMeta.fillStrokeText(
                ctx, `${next_discord_member.nickname || next_discord_member.user.username}`, center.x,
                0+CanvasImagesMeta.measureTextPlus(ctx, rank_text, `40px Arial`).height+CanvasImagesMeta.measureTextPlus(ctx, `LEVEL UP!`, `70px Arial`).height+CanvasImagesMeta.measureTextPlus(ctx, `${xp_behind_text}`).height+20,
                2
            );
        }
        //level
        ctx.font = `100px Arial`;
        CanvasImagesMeta.fillStrokeText(
            ctx, level_text, center.x, 
            center.y+avatar_size/2+ctx.measureText(ctx, level_text).emHeightAscent, // y coordinate
            3, "#007820", "#2bd95a"
        );
        //username
        ctx.font = `60px Arial`;
        CanvasImagesMeta.fillStrokeText(ctx, username_text, center.x, 
            center.y+avatar_size/2+ctx.measureText(ctx, username_text).emHeightAscent+CanvasImagesMeta.measureTextPlus(ctx, level_text, `100px Arial`).height, 
            3
        );
        let avatar = await loadImage(member.user.displayAvatarURL({ format: "png", dynamic: true, avatar_size: 256 }));
        // crop
        let vOffset = 0;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2+vOffset, avatar_size/2, 0, 6.28, false);
        ctx.clip();
        // center image
        ctx.drawImage(avatar, canvas.width/2-avatar_size/2, canvas.height/2-avatar_size/2+vOffset, avatar_size, avatar_size);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('./imageData/generated/level.png', buffer);
    },
    //#endregion
}

const QuickMessage = {
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
     * @param {string} prefix Guild prefix
     * @param {string} command Failed command
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
    }
    //#endregion
}

module.exports = { CanvasImage, QuickMessage }
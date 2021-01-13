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
     * @param {string} textColor
     * @param {string} strokeColor
     * @param {Number} strokeWidth
     */
    fillStrokeText: function (ctx, text, x, y, textColor, strokeColor, strokeWidth) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth*2;
        ctx.strokeText(text, x, y);
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);
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
        let rank = user_database.chain().simplesort('xp', true).data().findIndex(element => element.user_id == member.id);

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
        fs.writeFileSync('./imageData/level.png', buffer);
    },
    //#endregion
    //#region levelup_image
    /**
     * Draws an image showcasing the members new level and rank, and saves it as 'levelup.png' to 'imageData/'.
     * @param {GuildMember} member The Discord Guild member
     * @param {LokiJSCollection} user_database The database of saved users
     */
    levelup_image: async function (member, user_database) {
        const database_user = user_database.findOne({ user_id: member.id });
        const avatar_size = 200;

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');
        //background
        ctx.fillStyle = "#9ED3FF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#4D8C69";
        ctx.fillRect(0, canvas.height/2+20, canvas.width, canvas.height/2-20);
        //level
        ctx.font = `80px Arial`;
        ctx.lineWidt = 3;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.textAlign = "center";
        CanvasImagesMeta.fillStrokeText(ctx, `LEVEL ${database_user.level}`, canvas.width/2, canvas.height/2+avatar_size-20, '#white', '#black', 5);
        
        let avatar = await loadImage(member.user.displayAvatarURL({ format: "png", dynamic: true, avatar_size: 256 }));
        // crop
        let vOffset = 0;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2+vOffset, avatar_size/2, 0, 6.28, false);
        ctx.clip();
        // center image
        ctx.drawImage(avatar, canvas.width/2-avatar_size/2, canvas.height/2-avatar_size/2+vOffset, avatar_size, avatar_size);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('./imageData/level.png', buffer);
    },
    //#endregion
}

module.exports = {
    CanvasImage
}
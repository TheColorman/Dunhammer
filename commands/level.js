const fs = require('fs');
const Discord = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: 'level',
    short_desc: 'Sends your/tagged users level.',
    long_desc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[tagged user]',
    aliases: ['rank', 'lvl'],
    cooldown: 2,
    async execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, _user, args_original_case_with_command, taggedChannels) {
        let ds_member = args.length ? taggedMembers.first() : msg.member;
        let ds_user = ds_member.user;
        let db_user = user_db.findOne({ user_id: ds_member.id });
        if (!db_user) return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: ":no_pedestrians: User not found."
        }});
        let xp_total = db_user.xp;
        let level = db_user.level;
        let next_level = level+1;
        let xp_for_next_level = 5*(118*next_level+2*next_level*next_level*next_level)/6 - 5*(118*level+2*level*level*level)/6;
        let current_xp_minus_xp_for_current_level = xp_total - 5*(118*level+2*level*level*level)/6;

        let data = user_db.chain().simplesort('xp', true).data();
        let rank = data.findIndex(element => element.user_id == ds_member.id) + 1;

        // Creating the image
        //#region
        const canvas = createCanvas(1000, 300);
        const ctx = canvas.getContext('2d');
        const font = 'Arial';
        // set box size. 320 is whitespace + profile picture length
        ctx.font = 'bold 46px' + font;
        let username_text_length = ctx.measureText(ds_user.username).width;
        ctx.font = `36px${font}`;
        let tag_text_length = ctx.measureText(ds_user.tag.slice(-5)).width;
        canvas.width = Math.max(username_text_length + tag_text_length + 400, 1000);
              
        // background
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fill();
        // username
        ctx.font = '36px' + font;
        ctx.fillStyle = "#A6A7AA";
        ctx.font = 'bold 60px' + font;
        ctx.fillStyle = "white";
        let username_text_height = ctx.measureText(ds_user.username).emHeightAscent;
        let username_text_width = ctx.measureText(ds_user.username).width;
        ctx.fillText(ds_user.username, 300, 50 + username_text_height);
        // tag
        ctx.font = '36px' + font;
        ctx.fillStyle = "#A6A7AA";
        ctx.fillText(ds_user.tag.slice(-5), 300 + username_text_width, 50  + username_text_height);
        // experience bar
        ctx.fillStyle = "#4a4a4a";
        roundRect(ctx, 290, 240, canvas.width - 320, 30, 16, true, false);  // background
        ctx.fillStyle = "#54b35d";
        roundRect(ctx, 290, 240, (current_xp_minus_xp_for_current_level/xp_for_next_level) * (canvas.width - 320), 30, 16, true, false);    // xp_total filled up
        // xp for next lvl
        ctx.font = '34px' + font;
        ctx.fillStyle = '#A6A7AA';
        let xp_requried_text = ctx.measureText(` / ${xp_for_next_level} xp_total`);
        let description_text_y = 240 - xp_requried_text.emHeightAscent + xp_requried_text.emHeightDescent;
        ctx.fillText(` / ${xp_for_next_level} xp`, canvas.width - xp_requried_text.width, description_text_y);
        // current xp_total
        ctx.font = '34px' + font;
        ctx.fillStyle = 'white';
        let xp_current_text = ctx.measureText(`${current_xp_minus_xp_for_current_level}`);
        ctx.fillText(`${current_xp_minus_xp_for_current_level}`, canvas.width - xp_requried_text.width - xp_current_text.width, description_text_y);
        // level
        let xp_text_width = xp_requried_text.width + xp_current_text.width;
        ctx.font = 'bold 80px' + font;
        ctx.fillStyle = "#54b35d";
        let level_number = ctx.measureText(`${level}`);
        ctx.fillText(`${level}`, canvas.width - level_number.width - xp_text_width - 30, description_text_y);
        // level text
        ctx.font = `34px ${font}`;
        let level_text = ctx.measureText(`LEVEL`);
        ctx.fillText(`LEVEL`, canvas.width - level_number.width - xp_text_width - 40 - level_text.width, description_text_y);
        // rank
        ctx.font = 'bold 80px' + font;
        ctx.fillStyle = "white";
        let rank_number = ctx.measureText(`${rank}`);
        ctx.fillText(`${rank}`, canvas.width - level_number.width - xp_text_width - 70 - level_text.width - rank_number.width, description_text_y);
        // rank text
        ctx.font = `34px ${font}`;
        let rank_text = ctx.measureText(`RANK`);
        ctx.fillText(`RANK`, canvas.width - level_number.width - xp_text_width - 80 - level_text.width - rank_number.width - rank_text.width, description_text_y);

        //#endregion

        let avatar_url = ds_user.displayAvatarURL({format: "png", dynamic: true, size: 256});
        let image = await loadImage(avatar_url);
        //avatar_url = 'https://cdn.discordapp.com/avatars/268400056242143232/a_14ebd6e94d2088ca8ec143b3095fb533.gif?size=256';

        // clip profile picture
        ctx.beginPath();
        ctx.arc(150, 150, 120, 0, 6.28, false);
        ctx.clip();

        ctx.drawImage(image, 30, 30, 240, 240);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('./imageData/level.png', buffer);
        const attachment = new Discord.MessageAttachment('./imageData/level.png');
    
        return msg.channel.send({ files: [attachment], embed: {
            color: 2215713,
            image: {
                url: 'attachment://level.png'
            }
        }});       
    }
}

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
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
}
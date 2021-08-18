// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql'),
    Canvas = require('canvas');

module.exports = {
    name: "level",
    ApplicationCommandData: {
        name: "level",
        description: "Displays your level",
        options: [{
            type: "USER",
            name: "user",
            description: "A user whose level to show"
        }]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
        const attachment = await createImage(interaction);
        interaction.reply({
            files: [attachment]
        });
    }
}

/**
 * @param {Discord.CommandInteraction} interaction 
 */
async function createImage(interaction) {
    const canvas = Canvas.createCanvas(800, 270),
        ctx = canvas.getContext('2d'),

        background = await Canvas.loadImage('./data/levelBackgrounds/0.png'),
        avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({
            format: "png"
        })),

    //#region Background image
        cornerCropSize = 200,
        bgCropRotationOffset = 30;
    ctx.beginPath();
    ctx.moveTo(cornerCropSize+bgCropRotationOffset, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, cornerCropSize-bgCropRotationOffset);
    ctx.closePath();

    ctx.save();
    ctx.clip();

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const addWhiteTriangle = (offset, fillAmount) => {
        ctx.beginPath();
        ctx.moveTo(450+bgCropRotationOffset+offset, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(450-canvas.height-bgCropRotationOffset+offset, canvas.height);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 255, 255, ${fillAmount})`;
        ctx.fill()
    }
    for (let i = 0; i < 3; i++) {
        addWhiteTriangle(i*250, 0.05*i+0.15);
    }
    //#endregion

    //#region Avatar
    const avatarSize = 175,
        avatarPosition = {
            x: 100,
            y: 100
        },
        borderWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarPosition.x, avatarPosition.y, avatarSize/2, 0, 6.28, false);
    ctx.closePath();
    ctx.strokeStyle ="#ffffff";
    ctx.lineWidth = borderWidth;
    ctx.stroke();
    ctx.save();
    ctx.clip();

    ctx.drawImage(
        avatar, 
        avatarPosition.x-avatarSize/2, avatarPosition.y-avatarSize/2, 
        avatarSize, avatarSize
    );
    ctx.restore();
    //#endregion

    //#region xp bars
    const guildAvatar = await Canvas.loadImage(interaction.guild.iconURL({
            format: "png"
        })),
        dunhammerAvatar = await Canvas.loadImage("https://cdn.discordapp.com/avatars/671681661296967680/6ae7fd60617e8bd7388d239b450afad1.png"),
        iconSize = 60,
        iconPosition = {
            x: 400,
            y: 125
        },
        barOffset = 90,
        barOffsetX = 20,
        barRadius = 17.5,
        barEndX = 750,
        barOffsetY = iconPosition.y + (iconSize-barRadius*2)/2 - 5,
    
        drawIcon = (iteration, icon) => {
            ctx.beginPath();
            ctx.arc(iconPosition.x, iconPosition.y + iteration*barOffset, iconSize/2, 0, 6.28, false);
            ctx.closePath();
            ctx.save();
            ctx.clip();
            
            ctx.drawImage(
                icon,
                iconPosition.x-iconSize/2, iconPosition.y-iconSize/2+iteration*barOffset,
                iconSize, iconSize
            );
            ctx.restore();
        },
        drawxpBar = (iteration, xpCurrent, xpMax, color) => {
            ctx.beginPath();
            ctx.arc(
                iconPosition.x + iconSize+barOffsetX, barOffsetY + iteration*barOffset,
                barRadius,
                0.6*Math.PI, 1.5*Math.PI
            );
            ctx.lineTo(700, barOffsetY + iteration*barOffset - barRadius);
            ctx.arc(
                barEndX, barOffsetY + iteration*barOffset,
                barRadius,
                1.5*Math.PI, 0.5*Math.PI
            );
            ctx.lineTo(iconPosition.x + iconSize+barOffsetX, barOffsetY + iteration*barOffset + barRadius);
            ctx.closePath();
            ctx.fillStyle = "#CDCDCD";
            ctx.fill();
        }
    
    drawIcon(0, guildAvatar);
    drawIcon(1, dunhammerAvatar);
    drawxpBar(0, 0, 0, "#CDCDCD");
    drawxpBar(1, 0, 0, "#CDCDFF");

    //#endregion

    return new Discord.MessageAttachment(canvas.toBuffer(), 'profile.png');
}
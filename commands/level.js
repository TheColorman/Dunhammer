// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
    // eslint-disable-next-line no-unused-vars
    MySQL = require("../sql/sql"),
    Canvas = require("canvas");

module.exports = {
    name: "level",
    ApplicationCommandData: {
        name: "level",
        description: "Displays your level",
        options: [
            {
                type: "USER",
                name: "user",
                description: "A user whose level to show",
            },
        ],
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
        const attachment = await createImage(interaction);
        interaction.reply({
            files: [attachment],
        });
    },
};

/**
 * @param {Discord.CommandInteraction} interaction
 */
async function createImage(interaction) {
    const canvas = Canvas.createCanvas(800, 270),
        ctx = canvas.getContext("2d"),
        background = await Canvas.loadImage("./data/levelBackgrounds/0.png"),
        avatar = await Canvas.loadImage(
            interaction.user.displayAvatarURL({
                format: "png",
            })
        ),
    //#region Background image
        cornerCropSize = 200,
        bgCropRotationOffset = 30;
    ctx.beginPath();
    ctx.moveTo(cornerCropSize + bgCropRotationOffset, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, cornerCropSize - bgCropRotationOffset);
    ctx.closePath();

    ctx.save();
    ctx.clip();

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const addWhiteTriangle = (offset, fillAmount) => {
        ctx.beginPath();
        ctx.moveTo(450 + bgCropRotationOffset + offset, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(
            450 - canvas.height - bgCropRotationOffset + offset,
            canvas.height
        );
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 255, 255, ${fillAmount})`;
        ctx.fill();
    };
    for (let i = 0; i < 3; i++) {
        addWhiteTriangle(i * 250, 0.05 * i + 0.15);
    }
    //#endregion

    //#region Avatar
    const avatarSize = 175,
        avatarPosition = {
            x: 100,
            y: 100,
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

    //#region xp bars
    const guildAvatar = await Canvas.loadImage(
            interaction.guild.iconURL({
                format: "png",
            })
        ),
        dunhammerAvatar = await Canvas.loadImage(
            "https://cdn.discordapp.com/avatars/671681661296967680/6ae7fd60617e8bd7388d239b450afad1.png"
        ),
        iconSize = 60,
        iconPosition = {
            x: 390,
            y: 125,
        },
        iconOutlineWidth = 3,
        barOffset = 90,
        barOffsetX = 10,
        barRadius = 16,
        barEndX = 760,
        barOffsetY = iconPosition.y + (iconSize - barRadius * 2) / 2 - 5,
        innerBarOffset = 2.5,
        font = "Nyata FTR",
        drawIcon = (iteration, icon) => {
            ctx.beginPath();
            ctx.arc(
                iconPosition.x,
                iconPosition.y + iteration * barOffset,
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
                icon,
                iconPosition.x - iconSize / 2,
                iconPosition.y - iconSize / 2 + iteration * barOffset,
                iconSize,
                iconSize
            );
            ctx.restore();
        },//        End of bar          -  Start of bar
        barLength = barEndX + barRadius - (iconPosition.x + iconSize + barOffsetX - barRadius),
        // draw outer + inner xp bar
        drawxpBar = (iteration, xpCurrent, xpMax, color, rank) => {
            const xpPercentage = xpCurrent/xpMax,
            // draw inner xp bar
                bar = (iteration, radius, insideColor) => {
                    ctx.beginPath();
                    ctx.arc(
                        iconPosition.x + iconSize + barOffsetX,
                        barOffsetY + iteration * barOffset,
                        radius,
                        0.6 * Math.PI,
                        1.5 * Math.PI
                    );
                    ctx.lineTo(700, barOffsetY + iteration * barOffset - radius);
                    ctx.arc(
                        barEndX,
                        barOffsetY + iteration * barOffset,
                        radius,
                        1.5 * Math.PI,
                        0.5 * Math.PI
                    );
                    ctx.lineTo(
                        iconPosition.x + iconSize + barOffsetX,
                        barOffsetY + iteration * barOffset + radius
                    );
                    ctx.closePath();
                    ctx.fillStyle = insideColor;
                    ctx.fill();
                };

            bar(iteration, barRadius, "#CDCDCD");
            // Create clipping mask for inner bar
            const xpBoundingBox = () => {
                ctx.beginPath();
                ctx.moveTo( // Top left corner
                    iconPosition.x + iconSize + barOffsetX - barRadius, // innerBarOffset is added to reduce grey lines at the edge of the bounding box from the inversion process
                    barOffsetY + iteration * barOffset - barRadius
                );
                ctx.lineTo( // Bottom left corner
                    iconPosition.x + iconSize + barOffsetX - barRadius,
                    barOffsetY + iteration * barOffset + barRadius
                );  
                ctx.lineTo( // Bottom right corner (limited by xp)
                    iconPosition.x + iconSize + barOffsetX - barRadius + barLength * xpPercentage,
                    barOffsetY + iteration * barOffset + barRadius
                );
                ctx.lineTo( // Top right corner (limited by xp)
                    iconPosition.x + iconSize + barOffsetX - barRadius + barLength * xpPercentage,
                    barOffsetY + iteration * barOffset - barRadius
                );
                ctx.closePath();
            }
            xpBoundingBox();
            ctx.save();
            ctx.clip();
            bar(iteration, barRadius - innerBarOffset, color);
            ctx.restore();

            // Draw the numbers for the xp inside the bars.
            xpBoundingBox();
            // This function uses the bounding box previously drawn to clip the xp,
            // but this time the box is used to invert the area.
            // Once the text has been drawn, the area is inverted again,
            // but only the text inside the xp area is affected,
            // making it change color once the xp bar reaches the text.
            const invert = () => {
                ctx.globalCompositeOperation = "difference";
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";
            }
            invert();

            ctx.font = `25px ${font}`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#323232";
            ctx.fillText(
                `${xpCurrent}/${xpMax}`,
                iconPosition.x + iconSize + barOffsetX - barRadius + barLength/2,
                barOffsetY + iteration * barOffset + 7
            );
            invert();
            
            // Draw leaderboard name
            const boardName = iteration ? "Global" : "Server";
            ctx.font = `25px ${font}`;
            ctx.textAlign = "right";
            ctx.shadowColor = "black";
            ctx.strokeStyle = "black";
            ctx.shadowBlur = 2;
            ctx.lineWidth = 2;
            ctx.strokeText(
                boardName,
                barEndX,
                barOffsetY + iteration * barOffset - 23
            );
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#CDCDCD";
            ctx.fillText(
                boardName,
                barEndX,
                barOffsetY + iteration * barOffset - 23
            );

            // Draw rank
            ctx.textAlign = "left";
            ctx.shadowBlur = 2;
            ctx.strokeText(
                `Rank: #${rank}`,
                iconPosition.x + iconSize + barOffsetX - barRadius + 10,
                barOffsetY + iteration * barOffset - 23
            );
            ctx.shadowBlur = 0;
            ctx.fillText(
                `Rank: #${rank}`,
                iconPosition.x + iconSize + barOffsetX - barRadius + 10,
                barOffsetY + iteration * barOffset - 23
            );
        },

        xpCurr = 700,
        xpMax = 1000,
        serverRank = 10,
        globalRank = 2313;

    drawIcon(0, guildAvatar);
    drawIcon(1, dunhammerAvatar);

    drawxpBar(0, xpCurr, xpMax, `#95133B`, serverRank);
    drawxpBar(1, xpCurr, xpMax, "#4D662A", globalRank);

    //#endregion

    //#region Username
    const usernameSize = 60;
    ctx.font = `${usernameSize}px ${font}`;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 3;
    ctx.strokeText(
        interaction.user.username,
        460,
        55
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#CDCDCD"
    ctx.fillText(
        interaction.user.username,
        460,
        55
    );
    const usernameWidth = ctx.measureText(interaction.user.username).width;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 7;
    ctx.font = `${usernameSize/2.25}px ${font}`;
    ctx.strokeText(
        `#${interaction.user.tag.slice(-4)}`,
        460 + usernameWidth,
        55
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ACACAC";
    ctx.fillText(
        `#${interaction.user.tag.slice(-4)}`,
        460 + usernameWidth,
        55
    );
    //#endregion

    return new Discord.MessageAttachment(canvas.toBuffer(), "profile.png");
}

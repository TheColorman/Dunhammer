// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
    // eslint-disable-next-line no-unused-vars
    MySQL = require("../sql/sql"),
    Canvas = require("canvas"),
    imgDecoder = require("@nicklasbns/imagedecoder");

module.exports = {
    name: "level",
    ApplicationCommandData: {
        name: "level",
        description: "Displays your level",
        options: [
            {
                type: 6,
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
    async execute(interaction, sql) {
        const
            attachment = await createImage(interaction, sql),
            DBUser = await sql.getDBUser(interaction.user);
        if (DBUser.currentBackground == 0 && Math.random() < 0.2) {
            interaction.reply({
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
            interaction.reply({
                files: [attachment],
            });
        }
    },
};

/**
 * @param {Discord.CommandInteraction} interaction
 * @param {MySQL} sql
 */
async function createImage(interaction, sql) {
    const canvas = Canvas.createCanvas(800, 270),
        ctx = canvas.getContext("2d"),
        member = (interaction.options.data.length ? interaction.options.data[0] : interaction).member,
        DBUser = await sql.getDBUser(member.user),
        background = await Canvas.loadImage(`./data/levelBackgrounds/${DBUser.currentBackground}.png`),
        avatar = await Canvas.loadImage(
            (interaction.options.data.length ? 
                interaction.options.data[0].user :
                interaction.user)
                .displayAvatarURL({
                    format: "png"
                })
        ),
        badges = (await sql.getDBBadges()).filter(badge => badge.bitId & DBUser.currentBadges),
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
            }) || "./data/images/noicon.png"
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
        drawLevel = (iteration, level) => {
            ctx.textAlign = "center";
            ctx.font = `50px ${font}`;
            ctx.shadowBlur = 4;
            const levelWidth = ctx.measureText(level).width;
            ctx.strokeText(
                level,
                iconPosition.x - iconSize - levelWidth / 2 + 10,
                iconPosition.y + iteration * barOffset + 25
            );
            ctx.shadowBlur = 0;
            ctx.fillText(
                level,
                iconPosition.x - iconSize - levelWidth / 2 + 10,
                iconPosition.y + iteration * barOffset + 25
            );
            ctx.font = `25px ${font}`;
            ctx.shadowBlur = 2;
            ctx.strokeText(
                "LVL",
                iconPosition.x - iconSize - levelWidth / 2 + 10,
                iconPosition.y + iteration * barOffset - 15
            );
            ctx.shadowBlur = 0;
            ctx.fillText(
                "LVL",
                iconPosition.x - iconSize - levelWidth / 2 + 10,
                iconPosition.y + iteration * barOffset - 15
            );
            ctx.textAlign = "left";
        },
        memberID = member.id,
        DBGuildMember = await sql.getDBGuildMember(member),
        userDB = await sql.get("users", "", "xp DESC"),
        guildMemberDB = await sql.get("guildusers", `guildid = ${interaction.guild.id}`, "xp DESC"),
        xpTotalGlob = DBUser.xp,
        currentLevelGlob = DBUser.level,
        nextLevelGlob = currentLevelGlob + 1,
        xpCurrGlob = xpTotalGlob - 5*(118*currentLevelGlob+2*currentLevelGlob*currentLevelGlob*currentLevelGlob)/6,
        xpMaxGlob = 5*(118*nextLevelGlob+2*nextLevelGlob*nextLevelGlob*nextLevelGlob)/6 - 5*(118*currentLevelGlob+2*currentLevelGlob*currentLevelGlob*currentLevelGlob)/6,
        globalRank = userDB.findIndex(user => user.id == memberID) + 1,
        xpTotalServ = DBGuildMember.xp,
        currentLevelServ = DBGuildMember.level,
        nextLevelServ = currentLevelServ + 1,
        xpCurrServ = xpTotalServ - 5*(118*currentLevelServ+2*currentLevelServ*currentLevelServ*currentLevelServ)/6,
        xpMaxServ = 5*(118*nextLevelServ+2*nextLevelServ*nextLevelServ*nextLevelServ)/6 - 5*(118*currentLevelServ+2*currentLevelServ*currentLevelServ*currentLevelServ)/6,
        serverRank = guildMemberDB.findIndex(member => member.userid == memberID) + 1;


    drawIcon(0, guildAvatar);
    drawIcon(1, dunhammerAvatar);
    
    const guildIcon = interaction.guild.iconURL({
        format: "png",
    });
    let color = "#37393D";
    if (guildIcon) {

        const clrArr = await imgDecoder.mean(guildIcon);

        while ((clrArr[0] + clrArr[1] + clrArr[2])/3 > 75) {
            clrArr[0] = Math.max(clrArr[0] - 1, 1);
            clrArr[1] = Math.max(clrArr[1] - 1, 1);
            clrArr[2] = Math.max(clrArr[2] - 1, 1);
        }
        color = "#" + clrArr.map(e => e.toString(16)).join("");
    }
    drawxpBar(0, xpCurrServ, xpMaxServ, color, serverRank);
    drawxpBar(1, xpCurrGlob, xpMaxGlob, "#4D662A", globalRank);

    drawLevel(0, DBGuildMember.level);
    drawLevel(1, DBUser.level);

    //#endregion

    //#region Username
    let usernameFontSize = 60;
    const username = (interaction.options.data.length ? interaction.options.data[0] : interaction).user.username;
    ctx.font = `${usernameFontSize}px ${font}`;
    while (ctx.measureText(`${username}`).width > 350) {
        ctx.font = `${usernameFontSize -= 5}px ${font}`;
    }
    ctx.shadowBlur = usernameFontSize/8.5;
    ctx.lineWidth = usernameFontSize/20;
    ctx.strokeText(
        username,
        460,
        55
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#CDCDCD"
    ctx.fillText(
        username,
        460,
        55
    );
    const { width: usernameWidth, emHeightDescent: usernameHeight } = ctx.measureText(username);
    ctx.shadowColor = "black";
    ctx.shadowBlur = usernameFontSize/8.5;
    ctx.font = `${usernameFontSize/2.25}px ${font}`;
    ctx.textAlign = "right";
    ctx.strokeText(
        `#${(interaction.options.data.length ? interaction.options.data[0] : interaction).user.tag.slice(-4)}`,
        460 + usernameWidth,
        62 + usernameHeight
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ACACAC";
    ctx.fillText(
        `#${(interaction.options.data.length ? interaction.options.data[0] : interaction).user.tag.slice(-4)}`,
        460 + usernameWidth,
        62 + usernameHeight
    );
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
            x: 30 + i * badgeOffsetX + badgeStartOffsetX,
            y: 225,
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
    
    return new Discord.MessageAttachment(canvas.toBuffer(), "profile.png");
}

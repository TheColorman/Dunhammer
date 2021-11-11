const
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),
    // eslint-disable-next-line no-unused-vars
    MySQL = require("../sql/sql");

module.exports = {
    name: "badges",
    ApplicationCommandData: {
        name: "badges",
        description: "Displays information about badges",
        type: "CHAT_INPUT",
        options: [{
            type: "STRING",
            name: "options",
            description: "Badge command options",
            required: false,
            choices: [{
                name: "info",
                value: "info"
            }, {
                name: "set",
                value: "set"
            }, {
                name: "progress",
                value: "progress"
            }]
        }, {
            type: "USER",
            name: "user",
            description: "User to check badges for.",
            required: false
        }],
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        const option = interaction.options.getString("options");
        const member = interaction.options.getMember("user");
        interaction.member = await member || interaction.member;

        switch (option) {
            case "info": {
                sendInfo(interaction, sql);
                break;
            } case "set": {
                sendSet(interaction, sql);
                break;
            } case "progress": {
                sendProgress(interaction, sql);
                break;
            } default: {
                sendDefault(interaction, sql);
                break;
            }
        }
    }
}

/** 
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql
 */
const sendDefault = async (interaction, sql) => {

    // Fetch DBUser
    const DBUser = await sql.getDBUser(interaction.member.user);

    // Fetch badges
    const userBadgesField = DBUser.badges;
    const allBadges = await sql.getDBBadges();
    const badgesHas = allBadges.filter(badge => userBadgesField & badge.bitId);

    // Create text
    let badgesText = badgesHas.map(badge => `${badge.idEmoji}`).join(" ");
    badgesText ||= "You don't have any badges!";
        
    // Send message
    interaction.reply({ 
        content: badgesText,
        embeds: [{
            description: `${interaction.member.user}s badges.\n\`/badges options:info\` | Info\n\`/badges options:set\` | Set displayed badges\n\`/badges options:progress\` | See badge progress`,
            color: 0x7BA043,
        }],
    });
}
/** 
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql
 */
const sendInfo = async (interaction, sql) => {
    // Fetch DBUser
    const DBUser = await sql.getDBUser(interaction.member.user);
    const differentUser = interaction.member.id !== interaction.user.id;

    // Fetch badges
    const userBadgesField = DBUser.badges;
    const allBadges = await sql.getDBBadges();
    const badgesHas = allBadges.filter(badge => userBadgesField & badge.bitId);
    const badgesMissing = allBadges
        .filter(badge => !(userBadgesField & badge.bitId))
        .filter(badge => badge.prerequisite == null ? true : badgesHas.map(badge => badge.id).includes(badge.prerequisite));

    // Create text
    // Unlocked badges
    const unlockedText = badgesHas.map(badge => `\`${badge.id}\`${badge.idEmoji} **${badge.name}** | ${badge.description}`).join("\n");
    const lockedText = badgesMissing.map(badge => `\`${badge.id}\`${badge.idEmoji} **${badge.name}** | ${badge.description}`).join("\n");

    // Send message
    interaction.reply({
        embeds: [{
            title: "Badge info",
            description: `${differentUser ? `${interaction.member} has` : `You have`} ${badgesHas.length} badges!\n\n**Unlocked badges:**\n${unlockedText}\n\n**Locked badges:**\n${lockedText}`,
            footer: {
                text: 'Note: Once you have unlocked a badge it will stay unlocked forever.'
            },
            color: 0x7BA043,
        }]
    });
}
/** 
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql
 */
const sendSet = async (interaction, sql) => {
    // Check for running collectors
    if (interaction.client.collectors.includes(interaction.channel.id)) {
        return interaction.reply({
            content: "Please wait until the previous request has been complete.",
            ephemeral: true
        });
    }
    // Check for correct user
    if (interaction.member.id != interaction.user.id) {
        return interaction.reply({
            content: "You can't set someone elses badges!",
            ephemeral: true
        });
    }
    // Create collector
    const filter = message => message.author.id == interaction.user.id && message.content.split(" ").length <= 3 && message.content.split(" ").every(word => !isNaN(word) && !isNaN(parseInt(word)));
    interaction.reply({
        content: `${interaction.member}, please send a message with the badge IDs you want to display (max 3, e.g. \`0 12 5\`)`,
        fetchReply: true,
        deffered: true
    })
        .then((reply) => {
            interaction.client.collectors.push(interaction.channel.id);
            interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    const message = collected.first();
                    // Remove duplicates
                    const badgeIds = [... new Set(message.content.split(" ").map(id => parseInt(id)))];
                    // Fetch badges
                    const DBUser = await sql.getDBUser(interaction.user);
                    const allBadges = await sql.getDBBadges();
                    const badges = allBadges.filter(badge => badgeIds.includes(badge.id));
                    // Check for valid badges
                    const unlockedBadges = badges.filter(badge => badge.bitId & DBUser.badges);
                    const lockedBadges = badges.filter(badge => !(badge.bitId & DBUser.badges));

                    // Sent text
                    let sendText = "";
                    // Set valid badges on profile
                    if (unlockedBadges.length > 0) {
                        const unlockedBadgeBitIds = unlockedBadges.map(badge => badge.bitId);
                        DBUser.currentBadges = unlockedBadgeBitIds.reduce((a, b) => a + b);
                        await sql.update('users', { currentBadges: DBUser.currentBadges }, `id = ${DBUser.id}`);
                        sendText += `Set the following badges on your profile:\n${unlockedBadges.map(badge => badge.idEmoji).join(" ")}\n\n`;
                    }
                    // Notify of invalid badges
                    if (lockedBadges.length > 0) {
                        sendText += `Failed to set the following badges as you haven't unlocked them:\n${lockedBadges.map(badge => badge.idEmoji).join(" ")}\n\n`;
                    }

                    // Clear collector
                    interaction.client.collectors.splice(interaction.client.collectors.indexOf(interaction.channel.id), 1);
                    // Edit message
                    try {
                        await reply.edit({ content: `~~${interaction.member}, please send a message with the badge IDs you want to display (max 3, e.g. \`0 12 5\`)~~` });
                    } catch (e) { /* Ignore */ }

                    // Send message
                    message.reply({
                        embeds: [{
                            description: sendText,
                            color: 0x7BA043,
                        }]
                    });
                })
                .catch(async _collected => {
                    // Delete messages
                    try { await reply.delete(); } catch (e) { /* Ignore */ }
                    interaction.client.collectors.splice(interaction.client.collectors.indexOf(interaction.channel.id), 1);
                });
        });

}

/**
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql 
 */
const sendProgress = async (interaction, sql) => {
    // Fetch DBUser and DBGuildMember
    const DBUser = await sql.getDBUser(interaction.member.user);
    const DBGuildMember = await sql.getDBGuildMember(interaction.member);

    // Fetch relevant data
    const globalRank = await sql.getGlobalRank(DBUser.id);
    const globalLevel = DBUser.level;
    const serverLevel = DBGuildMember.level;
    const level20Servers = (await sql.getDBUserGuilds(interaction.member.user)).filter(DBGuildMember => DBGuildMember.level >= 20).length;
    const pingCount = DBUser.pingCount;
    const commandCount = DBUser.commandCount;
    const spentMoney = DBUser.spentMoney / 100;
    const serversAdded = DBUser.inviteCount;
    const bugReports = "Bug reports are currently not tracked.";

    const sendText = `
    Global rank: \`#${globalRank}\`
    Global level: \`${globalLevel}\`
    Server level: \`${serverLevel}\`
    Servers with level 20: \`${level20Servers}\`
    /ping uses: \`${pingCount}\`
    Command uses: \`${commandCount}\`
    Spent money: \`$${spentMoney}\`
    Added to servers: \`${serversAdded}\`
    Bugs reported: \`${bugReports}\`
    `;

    interaction.reply({
        embeds: [{
            title: "Badge progress",
            description: sendText,
            color: 0x7BA043,
        }]
    });
}
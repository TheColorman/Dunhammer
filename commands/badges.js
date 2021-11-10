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
            description: `${interaction.member.user}s badges.\n\`/badges options:info\` | Info\n\`/badges options:set\` | Set displayed badges\n\`/badges options:progress\` | See badge progress`
        }],
        color: 0x7BA043,
    });
}

        interaction.reply({ 
            embeds: [{
                description: `Badges for ${member}`,
            }]
        }).then(() => {
            interaction.channel.send({
                content: badgesText,
            });
        });
    }
}
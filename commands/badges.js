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
        options: [{
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
        const
            member = interaction.options.data[0] ? interaction.options.data[0].member : interaction.member,


            // Fetch DBUser
            DBUser = await sql.getDBUser(member.user),

            // Fetch badges
            userBadgesField = DBUser.badges,
            userBadgesList = [],

            allBadges = await sql.get(`badges`);

        // Get user badges
        for (const badge of allBadges) {
            if (userBadgesField & badge.id) {
                userBadgesList.push(badge);
            }
        }

        // Send message
        let badgesText = userBadgesList.map(badge => `${badge.idEmoji}`).join(" ");
        if (badgesText == "") badgesText = "You don't have any badges!";

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
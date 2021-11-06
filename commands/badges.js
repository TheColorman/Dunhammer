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
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        const
            // Fetch DBUser
            DBUser = await sql.getDBUser(interaction.user),

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
                title: "Badges",
                description: badgesText,
            }],
        })
    }
}
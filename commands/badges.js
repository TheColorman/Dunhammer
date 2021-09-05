// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
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
     * @param {MySQL} _sql MySQL custom object
     */
    async execute(interaction, _sql) {
        interaction.reply({
            content: `Badges are currently work in progress! DM ${await interaction.client.users.fetch("298842558610800650")} for a chance to get a unique badge when the system is complete!`
        });
    },
};
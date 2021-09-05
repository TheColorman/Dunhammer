// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
    // eslint-disable-next-line no-unused-vars
    MySQL = require("../sql/sql");

module.exports = {
    name: "profile",
    ApplicationCommandData: {
        name: "profile",
        description: "Change any profile settings.",
        options: [
            {
                type: "BOOLEAN",
                name: "level_mentions",
                description:
                    "Changes whether you get mentioned on a global levelup",
            },
        ],
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        if (!interaction.options.data.length) {
            return interaction.reply({
                content:
                    "Settings will soon be available on https://dunhammer.colorman.me.\nIn the meantime you can use the options provided with /profile.",
            });
        }

        const embed = {
            color: 0x7ba043,
            description: "",
        }

        for (const option of interaction.options.data) {
            switch (option.name) {
                case "level_mentions": {
                    embed.description = embed.description.concat(`${option.value ? "✅ Enabled" : "❎ Disabled"} mentions when leveling up (Global only).\n`);
                    sql.update("users", {
                        levelMentions: option.value
                    }, `id = ${interaction.user.id}`);
                    break;
                }
            }
        }
        return interaction.reply({
            embeds: [embed]
        });
    },
};

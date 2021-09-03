// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "roles",
    ApplicationCommandData: {
        name: "roles",
        description: "Update level roles.",
        options: [
            {
                type: "STRING",
                name: "method",
                description: "Choose to add, remove, view or reload current level roles.",
                required: true,
                choices: [
                    {
                        name: "Add",
                        value: "add"
                    }, {
                        name: "Remove",
                        value: "remove"
                    }, {
                        name: "View",
                        value: "view"
                    }, {
                        name: "Reload",
                        value: "reload"
                    }
                ]
            }, {
                type: "ROLE",
                name: "role",
                description: "Choose a role to perform the method on."
            }, {
                type: "INTEGER",
                name: "level",
                description: "Choose the level to perform the method on."
            }
        ]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        const
            method = interaction.options.getString("method"),
            role = interaction.options.getRole("role"),
            level = interaction.options.getInteger("level"),
            DBGuildLevelsystem = await sql.getDBGuildLevelsystem(interaction.guild),
            guildLevelRoles = JSON.parse(DBGuildLevelsystem.roles),
            cumulative = !!DBGuildLevelsystem.rolesCumulative; // alright this is fucking stupid, because DBGuildLevelsystem.rolesCumulative is a number (either 0 or 1) and not a boolean, I just invert it twice with ! to make it a boolean. This is why I love JavaScript.
            
        switch (method) {
            case "view": {
                const guildLevelRolesString = Object.keys(guildLevelRoles).map(key => `Level ${key}: <@&${guildLevelRoles[key]}>`).join("\n");
                interaction.reply({
                    embeds: [
                        {
                            color: 0x7BA043,
                            title: `List of level roles in \`${interaction.guild.name}\``,
                            description: `Cumulative roles: ${cumulative}\n${guildLevelRolesString}`
                        }
                    ]
                });
                break;
            }
            case "add": {
                if (!role) return interaction.reply({
                    embeds: [
                        {
                            color: 0xF14B46,
                            description: "❌ You need to specify the role you want to add!"
                        }
                    ]
                });
                if (!level) return interaction.reply({
                    embeds: [
                        {
                            color: 0xF14B46,
                            description: "❌ You need to specify the level you want to add a role at!"
                        }
                    ]
                });
                const clientHighestRole = interaction.guild.me.roles.highest;
                if (clientHighestRole.position < role.position) return interaction.reply({
                    embeds: [
                        {
                            color: 0xF14B46,
                            description: `❌ I can't give other people ${role}.`
                        }
                    ]
                });

                guildLevelRoles[level] = role.id;
                await sql.update("guildlevelsystem", {
                    roles: JSON.stringify(guildLevelRoles)
                }, `id = ${interaction.guild.id}`);
                interaction.reply({
                    embeds: [
                        {
                            color: 0x7BA043,
                            description: `:white_check_mark: Added ${role} at level ${level}.`
                        }
                    ]
                });
                break;
            }
            case "remove": {
                if (!role && !level) return interaction.reply({
                    embeds: [
                        {
                            color: 0xF14B46,
                            description: "❌ You need to specify either the level or role you want to remove!"
                        }
                    ]
                });

                let text = "This text can't appear :)";
                if (role) {
                    for (const key in guildLevelRoles) {
                        if (guildLevelRoles[key] == role.id) {
                            text = `:white_check_mark: Removed ${role} from level roles.`
                            delete guildLevelRoles[key];
                        }
                    }
                } else if (level) {
                    text = `:white_check_mark: Removed role at level ${level} from level roles.`
                    delete guildLevelRoles[level];
                }
                await sql.update("guildlevelsystem", {
                    roles: JSON.stringify(guildLevelRoles)
                }, `id = ${interaction.guild.id}`);
                interaction.reply({
                    embeds: [
                        {
                            color: 0x7BA043,
                            description: text
                        }
                    ]
                });
                break;
            }
            case "reload": {
                const
                    reply = await interaction.reply({
                        embeds: [{
                            "color": 0x2F3136,
                            "description": `<a:discord_loading:821347252085063680>`
                        }],
                        fetchReply: true
                    }),
                    guildLevels = Object.keys(guildLevelRoles),
                    guildRoles = Object.values(guildLevelRoles),
                    members = await interaction.guild.members.fetch();
                // Loops through each guild member and...
                members.each(async member => {
                    const DBGuildMember = await sql.getDBGuildMember(member);
                    await member.roles.remove(guildRoles, "Refreshing level roles..."); // Removes all their level roles
                    const maxRoleLevel = Math.max.apply(Math, guildLevels.filter(level => level <= DBGuildMember.level));
                    if(guildLevelRoles[maxRoleLevel]) await member.roles.add(guildLevelRoles[maxRoleLevel], "Refreshing level roles...");   // Adds the highest role they can have based on their level
                    if (cumulative) {   // And adds all the other levelroles below it if cumulative roles are enables.
                        const allRoles = guildLevels.filter(roleLevel => roleLevel < maxRoleLevel).map(level => guildLevelRoles[level]);
                        if (allRoles.length) await member.roles.add(allRoles, "Refreshing level roles...");
                    }
                });
                // ok yeah, this runs before all the promises in the loop are done but you know what?
                // fuck promises i dont care anymore its only fake news if you know the truth.
                reply.edit({
                    embeds: [{
                        color: 0x7BA043,
                        description: "Finished reloading all level roles."
                    }]
                });
                break;
            }
        }
    }
}
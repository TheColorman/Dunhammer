// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { QuickMessage, apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "roles",
    aliases: ["levelroles", "leveluproles", "lvlroles", "lvluproles"],
    shortDesc: "Choose which roles are gained at which levels.",
    longDesc: "Add or remove which roles are awarded when a user reaches a specific level. Roles are chosen by either tagging them (e.g. @Admins) or by typing out their name (e.g. Admins).\n\n**Options**\n`add <level> <role>` - Adds a role at the specified level.\n`remove <role>` - Removes a specified role.\n`cumulative <true/false>` - Specify whether old roles are kept when gaining new ones (true: roles build up over time, false: only newest role is given).\n`reload` - Reloads roles for all members in the server.",
    usage: "<add/remove/cumulative/reload> [...arguments]",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
    /**
     * Command execution
     * @param {Discord.Message} msg Message object
     * @param {Object} args Argument object
     * @param {Array<String>} args.lowercase Lowercase arguments
     * @param {Array<String>} args.original Original arguments
     * @param {Object} tags Tag object
     * @param {Discord.Collection<string, Discord.User>} tags.users Collection of user tags
     * @param {Discord.Collection<string, Discord.GuildMember>} tags.members Collection of member tags
     * @param {Discord.Collection<string, Discord.TextChannel>} tags.channels Collection of channel tags
     * @param {Discord.Collection<string, Discord.Role>} tags.roles Collection of role tags
     * @param {MySQL} sql MySQL object
     * @param {Object} interaction Interaction object
     */
    async execute(msg, args, tags, sql, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
            args.lowercase[0] = interaction.data.options[0].name == "options" ? interaction.data.options[0].options[0].name : interaction.data.options[0].name;
        }

        const DBGuild = await sql.getGuildInDB(msg.guild),
            DBGuildLevelsystem = await sql.getGuildLevelsystemInDB(msg.guild),
            DBGuildLevelsystemRoles = JSON.parse(DBGuildLevelsystem.roles),
            DBGuildUsers = await sql.get("guild-users", `guildid = ${msg.guild.id}`);
        // Get role from interaction
        let role; 
        if (interaction && ["add", "remove"].includes(interaction.data.options[0].name)) role = await msg.guild.roles.fetch(interaction.data.options[0].options.find(option => option.name == "role").value);

        let replyEmbed = {}
        switch (args.lowercase[0]) {
            case 'add': {
                // Set interaction values to match old code
                if (interaction) {
                    args.lowercase[1] = interaction.data.options[0].options.find(option => option.name == "level").value
                } else {
                    role = tags.roles.first() || msg.guild.roles.cache.find(role_object => args.lowercase.join(" ").includes(role_object.name.toLowerCase()));
                }
                if (isNaN(args.lowercase[1]) && isNaN(parseFloat(args.lowercase[1]))) return QuickMessage.invalid_argument(msg.channel, DBGuild.prefix, "levelsettings");
                if (!role) return QuickMessage.invalid_role(msg.channel, DBGuild.prefix, "levelsettings");
                
                const highestRolePosition = msg.guild.me.roles.highest.position,
                    highestUserRolePosition = msg.member.roles.highest.position,
                    requestedRolePosition = role.position;
                if (highestRolePosition <= requestedRolePosition || highestUserRolePosition <= requestedRolePosition) {
                    replyEmbed = {
                        color: 0xcf2d2d,
                        title: ":octagonal_sign: Error!",
                        description: `:no_entry: ${highestRolePosition <= requestedRolePosition ? "I" : "You"} don't have permission to give other people ${role} (Check the role hierarchy).`
                    }
                    if (interaction) {
                        return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                    } else {
                        return msg.channel.send({ embed: replyEmbed});
                    }                
                }
                if (role.name === "@everyone") {
                    replyEmbed = {
                        color: 0xcf2d2d,
                        title: ":octagonal_sign: Error!",
                        description: `:no_entry: I can't give people the ${role} role!`
                    }
                    if (interaction) {
                        return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                    } else {
                        return msg.channel.send({ embed: replyEmbed});
                    }                
                }
                
                DBGuildLevelsystemRoles[args.lowercase[1]] = role.id;
                sql.update("guild-levelsystem", { roles: JSON.stringify(DBGuildLevelsystemRoles) }, `id = ${DBGuildLevelsystem.id}`);
                replyEmbed = {
                    color: 2215713,
                    description: `:white_check_mark: Added ${role} to level roles at level ${args.lowercase[1]}.\n\nUse \`${DBGuild.prefix}roles reload\` for the changes to take effect.`
                }
                if (interaction) {
                    return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                } else {
                    return msg.channel.send({ embed: replyEmbed});
                }
            }
            case 'remove': {
                // Set interaction values to match old code
                if (!interaction) role = tags.roles.first() || msg.guild.roles.cache.find(role_object => args.lowercase.join(" ").includes(role_object.name.toLowerCase()));
                if (!role) return QuickMessage.invalid_role(msg.channel, DBGuild.prefix, "levelsettings");
                // Check if role is in saved in database
                if (!(Object.values(DBGuildLevelsystemRoles).indexOf(role.id) > -1)) return QuickMessage.error(msg.channel, `:question: That role is not a level role!`);

                for (const key in DBGuildLevelsystemRoles) {
                    if (DBGuildLevelsystemRoles[key] == role.id) {
                        delete DBGuildLevelsystemRoles[key];
                    }
                }
                await sql.update("guild-levelsystem", { roles: JSON.stringify(DBGuildLevelsystemRoles) }, `id = ${DBGuildLevelsystem.id}`);

                replyEmbed = {
                    color: 2215713,
                    description: `:x: Removed ${role} from level roles.`
                }
                if (interaction) {
                    return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                } else {
                    return msg.channel.send({ embed: replyEmbed});
                }
            }
            case 'reload': {
                
                replyEmbed = {
                    color: 49919,
                    description: "<a:discord_loading:821347252085063680> Reloading all level roles..."
                }

                const message = interaction ? await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed) : await msg.channel.send({ embed: replyEmbed }),
                                    
                    DBGuildLevelsystemRolesSorted = Object.keys(DBGuildLevelsystemRoles).sort().reduce(
                        (obj, key) => { 
                            obj[key] = DBGuildLevelsystemRoles[key]; 
                            return obj;
                        }, 
                        {}
                    );                  

                for (const user of DBGuildUsers) {
                    try {
                        const highestRoleKey = Object.keys(DBGuildLevelsystemRolesSorted).reduce((a, b) => Math.max(a, b)),
                            member = await msg.guild.members.fetch(user.userid);
                        let userLevelRoles = [];
                        for (const roleID of Object.values(DBGuildLevelsystemRoles)) {
                            const role = await msg.guild.roles.fetch(roleID);
                            await member.roles.remove(role);
                        }
                        if (!DBGuildLevelsystem.rolesCumulative && user.level >= highestRoleKey) {
                            const highestRole = await msg.guild.roles.fetch(DBGuildLevelsystemRoles[highestRoleKey]);
                            await member.roles.add(highestRole);
                            userLevelRoles = [DBGuildLevelsystemRoles[highestRoleKey]];
                        } else {
                            for (const levelRoleKey of Object.keys(DBGuildLevelsystemRolesSorted)) {
                                if (user.level >= levelRoleKey) {
                                    const role = await msg.guild.roles.fetch(DBGuildLevelsystemRoles[levelRoleKey]);
                                    await member.roles.add(role);
                                    userLevelRoles.push(DBGuildLevelsystemRoles[levelRoleKey]);
                                }
                            }
                        }
                        user.levelRoles = JSON.stringify(userLevelRoles);
                    } catch(err) {
                        console.error(err);
                        if (err.message === "Unknown member") user.inGuild = false;
                    }
                    sql.update("guild-users", user, `guildid = ${user.guildid} AND userid = ${user.userid}`);
                }

                message.edit({ embed: {
                    color: 2215713,
                    description: "~~:white_check_mark: Reloading all level roles...~~\n\nDone!"
                }});
                replyEmbed = {
                    color: 2215713,
                    description: ":white_check_mark: Reloaded all level roles."
                }
                if (interaction) {
                    return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                } else {
                    return msg.channel.send({ embed: replyEmbed});
                }
            }
            case 'cumulative':
                switch (args.lowercase[1]) {
                    case 'true': {
                        DBGuildLevelsystem.rolesCumulative = true;
                        await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`)
                        replyEmbed = {
                            color: 2215713,
                            description: `:white_check_mark: Set cumulative roles to \`true\`.`
                        }
                        if (interaction) {
                            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed)
                        } else {
                            return msg.channel.send({ embed: replyEmbed });
                        }
                    }
                    case 'false': {
                        DBGuildLevelsystem.rolesCumulative = false;
                        await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
                        replyEmbed = {
                            color: 2215713,
                            description: `:x: Set cumulative roles to \`false\`.`
                        }
                        if (interaction) {
                            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                        } else {
                            return msg.channel.send({ embed: replyEmbed });
                        }
                    }
                    default: {
                        replyEmbed = {
                            color: 0xcf2d2d,
                            title: ":octagonal_sign: Error!",
                            description: `:question: Invalid argument! Use \`${DBGuild.prefix}help roles\` for help.`
                        }
                        if (interaction) {
                            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                        } else {
                            return msg.channel.send({ embed: replyEmbed });
                        }
                    }
                }
            case 'view':
            default: {
                const arr = [];
                arr.push(`Cumulatove roles: ${!!DBGuildLevelsystem.rolesCumulative}`); // alright this is fucking stupid, because DBGuildLevelsystem.rolesCumulative is a number (either 0 or 1) and not a boolean, I just invert it twice with ! to make it a boolean. This is why I love JavaScript.
                for (const [key, value] of Object.entries(DBGuildLevelsystemRoles)) {
                    arr.push(`Level: ${key} - ${await msg.guild.roles.fetch(value)}`);
                }
                replyEmbed = {
                    color: 49919,
                    title: `:information_source: Level roles`,
                    description: `${arr.join('\n')}`
                }
                if (interaction) {
                    return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                } else {
                    return msg.channel.send({ embed: replyEmbed});
                }
            }
        }

    }
}
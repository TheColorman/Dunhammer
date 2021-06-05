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
                if (isNaN(args.lowercase[1]) && isNaN(parseFloat(args.lowercase[1]))) return QuickMessage.invalid_argument(msg.channel, db_guild.prefix, "levelsettings");
                if (!role) return QuickMessage.invalid_role(msg.channel, db_guild.prefix, "levelsettings");
                
                if (highestRolePosition <= requestedRolePosition) {
                const highestRolePosition = msg.guild.me.roles.highest.position,
                    requestedRolePosition = role.position;
                    replyEmbed = {
                        color: 0xcf2d2d,
                        title: ":octagonal_sign: Error!",
                        description: `:no_entry: I don't have permission to give other people ${role}.`            
                    }
                    if (interaction) {
                        return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
                    } else {
                        return msg.channel.send({ embed: replyEmbed});
                    }                
                }
                
                db_guild.levelSystem.roles[args.lowercase[1]] = role.id;
                guild_db.update(db_guild);
                replyEmbed = {
                    color: 2215713,
                    description: `:white_check_mark: Added ${role} to level roles at level ${args.lowercase[1]}.`
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
                if (!role) return QuickMessage.invalid_role(msg.channel, db_guild.prefix, "levelsettings");
                // Check if role is in saved in database
                if (!(Object.values(db_guild.levelSystem.roles).indexOf(role.id) > -1)) return QuickMessage.error(msg.channel, `:question: That role is not a level role!`);

                for (const key in db_guild.levelSystem.roles) {
                    if (db_guild.levelSystem.roles[key] == role.id) delete db_guild.levelSystem.roles[key];
                }

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

                const message = interaction ? await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed) : await msg.channel.send({ embed:  { replyEmbed } });


                const userdata = user_db.chain().data();
                for (const user of userdata) {
                    for (let level = 0; level < user.level; level++) {
                        if (Object.prototype.hasOwnProperty.call(db_guild.levelSystem.roles, level)) {
                            try {
                                const member = await msg.guild.members.fetch(user.user_id);
                                if (!db_guild.levelSystem.roles.cumulative) {
                                    user.levelroles ||= [];
                                    for (const role_id of user.levelroles) {
                                        const role = await msg.guild.roles.fetch(role_id);
                                        member.roles.remove(role);
                                    }
                                }
                                const role = await msg.guild.roles.fetch(db_guild.levelSystem.roles[level]);
                                member.roles.add(role);
                                user.levelroles.push(db_guild.levelSystem.roles[level]);
                            } catch (err) {
                                if (err.message === "Unknown member") {
                                    user.inGuild = false;
                                }
                            }
                            user_db.update(user);
                        }
                    }
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
                    case 'true':
                        db_guild.levelSystem.roles.cumulative = true;
                        return QuickMessage.add(msg.channel, "Set cumulative roles to `true`.")
                    case 'false':
                        db_guild.levelSystem.roles.cumulative = false;
                        return QuickMessage.remove(msg.channel, "Set cumulative roles to `false`.")
                    default:
                        return QuickMessage.invalid_argument(msg.channel, db_guild.prefix, "levelsettings");
                }
            case 'view':
            default: {
                const arr = [];
                for (const [key, value] of Object.entries(db_guild.levelSystem.roles)) {
                    arr.push(`${key == `cumulative` ? `Cumulative: ${value}` : `Level: ${key} - ${await msg.guild.roles.fetch(value)}`}`);
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
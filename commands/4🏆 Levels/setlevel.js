//@ts-check
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "setlevel",
    aliases: ["setxp", "setlvl"],
    shortDesc: "Updates a members level.",
    longDesc: "Changes the level and optionally also the amount of XP a member has. If no XP amount is given, the member will have 0 xp. If XP amount exceeds the threshold for a levelup, the member will level up.\n\n**Arguments:**\n`<member>`, required. A member mention or tag (e.g. <@671681661296967680> or Dunhammer#2797)\n`<level>`, required. The members new level.\n`[xp]`, optional. The members new XP amount.\n\n**Example:** `setlevel Dunhammer#2797 10 500`",
    usage: "<member> <level> [xp]",
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
        }
        
        const db_guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        const user_db = databases.users;

        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            taggedmember = msg.guild.members.cache.find(member => args.original.join(" ").includes(member.user.tag));
        }        
        if (!taggedmember) {
            const replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:no_pedestrians: No user tagged! Use \`${db_guild.prefix}help setlevel\` for help.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
        const db_user = user_db.findOne({user_id: taggedmember.id});
        if (args.lowercase.length < 2) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Not enough argument! Use \`${db_guild.prefix}help setlevel\` for help.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        if (db_user == null) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": ":no_pedestrians: User not found!"
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        
        const new_level = parseInt(args.lowercase[tags.members.first() ? 1 : taggedmember.user.tag.split(" ").length], 10); // explanation in ../Moderation/nickname.js
        const new_xp = parseInt(args.lowercase[tags.members.first() ? 2 : taggedmember.user.tag.split(" ").length], 10);
        db_user.xp = 5*(118*new_level+2*new_level*new_level*new_level)/6 + (new_xp || 0);

        const xp = db_user.xp;
        let lower = 0;
        let upper = 10000000000;
        while (lower + 1 < upper) {
            const middle = Math.floor((lower + upper)/2),
                level_xp = 5*(118*middle+2*middle*middle*middle)/6;
            if (level_xp > xp) {
                upper = middle;
            } else {
                lower = middle;
            }
        }
        const level = lower;
        db_user.level = level;
        user_db.update(db_user);
        const replyEmbed = {
            "color": 2215713,
            "description": `:sparkles: Updated ${taggedmember}'s level to ${args.lowercase[1]}.`
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}
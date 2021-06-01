//@ts-check
const { QuickMessage, apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'nickname',
    aliases: ['nick', 'name'],
    shortDesc: 'Change someones nickname.',
    longDesc: 'Updates a users nickname.',
    usage: '<(tagged user/user tag)> <new nickname>',
    permissions: 'MANAGE_NICKNAMES',
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const changeNickPerms = msg.guild.me.hasPermission('MANAGE_NICKNAMES');
        if (!changeNickPerms) {
            const replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: ":no_entry: I don't have permission to change nicknames on this server!"
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        
        let taggedMember = tags.members.first();
        if (!taggedMember && args.lowercase.length) {
            taggedMember = msg.guild.members.cache.find(member => args.original.join(" ").includes(member.user.tag));   // could get false positives, but I'm not really sure how to get around it
        }
        if (!taggedMember) {
            const replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:no_pedestrians: User not found!`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }

        const clientHighestRole = msg.guild.me.roles.highest;
        const memberHighestRole = msg.member.roles.highest;
        if (clientHighestRole.position < memberHighestRole.position) {
            const replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:no_entry: ${taggedMember} has the role ${memberHighestRole}, which is above my role ${clientHighestRole}.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        const old_nickname = taggedMember.nickname;
        args.original.splice(0, tags.members.first() ? 1 : taggedMember.user.tag.split(" ").length); // if the tag contains a space, remove the first 2 elements from args and so on
        taggedMember.setNickname(args.original.join(" "), `Changed by ${msg.author.tag} using nickname command.`);
        const replyEmbed = {
            color: 2215713,
            description: `:repeat: Updated ${taggedMember}'s nickname: \`${old_nickname}\` => \`${args.original.join(" ")}\``
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}
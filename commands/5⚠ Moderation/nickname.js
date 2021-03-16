//@ts-check
const { QuickMessage } = require('../../helperfunctions.js');

module.exports = {
    name: 'nickname',
    aliases: ['nick', 'name'],
    short_desc: 'Change someones nickname.',
    long_desc: 'Updates a users nickname.',
    usage: '<(tagged user/user tag)> <new nickname>',
    permissions: 'MANAGE_NICKNAMES',
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        
        let taggedMember = tags.members.first();
        if (!taggedMember && args.lowercase.length) {
            taggedMember = msg.guild.members.cache.find(member => args.original.join(" ").includes(member.user.tag));   // could get false positives, but I'm not really sure how to get around it
        }
        if (!taggedMember) return QuickMessage.invalid_user(msg.channel);
        const old_nickname = taggedMember.nickname;
        args.original.splice(0, tags.members.first() ? 1 : taggedMember.user.tag.split(" ").length); // if the tag contains a space, remove the first 2 elements from args and so on
        taggedMember.setNickname(args.original.join(" "), `Changed by ${msg.author.tag} using nickname command.`);
        QuickMessage.update(msg.channel, `Updated ${taggedMember}'s nickname: \`${old_nickname}\` => \`${args.original.join(" ")}\``);
    }
}
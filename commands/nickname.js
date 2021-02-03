//@ts-check
const { QuickMessage } = require('../helperfunctions.js');

module.exports = {
    name: 'nickname',
    aliases: ['nick', 'name'],
    short_desc: 'Change someones nickname.',
    long_desc: 'Updates a users nickname.',
    usage: '<(tagged user/user tag)> <new nickname>',
    permissions: 'MANAGE_NICKNAMES',
    cooldown: 2,
    async execute(msg, args, tags, databases) {
        let taggedMember = tags.members.first();
        if (!taggedMember && args.lowercase.length) {
            taggedMember = msg.guild.members.cache.find(member => member.user.tag == args.original[0]);
        }
        if (!taggedMember) return QuickMessage.invalid_user(msg.channel);
        const old_nickname = taggedMember.nickname;
        args.original.shift()
        taggedMember.setNickname(args.original.join(" "), `Changed by ${msg.author.tag} using nickname command.`);
        QuickMessage.update(msg.channel, `Updated ${taggedMember}'s nickname: \`${old_nickname}\` => \`${args.original.join(" ")}\``);
    }
}
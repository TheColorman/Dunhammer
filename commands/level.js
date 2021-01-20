//@ts-check
const Discord = require('discord.js');
const { CanvasImage } = require('../helperfunctions.js');

module.exports = {
    name: 'level',
    short_desc: 'Displays your/tagged users level.',
    long_desc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[(tagged user/user tag e.g. example#0000)]',
    aliases: ['rank', 'lvl'],
    cooldown: 2,
    async execute(msg, args, tags, databases) {
        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            taggedmember = msg.guild.members.cache.find(member => member.user.tag == args.lowercase[0]);
        }
        await CanvasImage.rank_image(taggedmember || msg.member, databases.users);

        const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
    
        return msg.channel.send({ files: [attachment], embed: {
            color: 2215713,
            image: {
                url: 'attachment://level.png'
            }
        }});       
    }
}
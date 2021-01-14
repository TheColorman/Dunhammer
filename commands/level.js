const Discord = require('discord.js');
const { CanvasImage } = require('../helperfunctions.js');

module.exports = {
    name: 'level',
    short_desc: 'Sends your/tagged users level.',
    long_desc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[tagged user]',
    aliases: ['rank', 'lvl'],
    cooldown: 2,
    async execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command, taggedChannels) {
        await CanvasImage.rank_image(taggedMembers.first() || msg.member, user_db);

        const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
    
        return msg.channel.send({ files: [attachment], embed: {
            color: 2215713,
            image: {
                url: 'attachment://level.png'
            }
        }});       
    }
}
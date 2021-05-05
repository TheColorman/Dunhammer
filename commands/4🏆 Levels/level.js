//@ts-check
const Discord = require('discord.js');
const { CanvasImage, apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'level',
    short_desc: 'Displays your/tagged users level.',
    long_desc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[(tagged user/user tag e.g. example#0000)]',
    aliases: ['rank', 'lvl'],
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            taggedmember = msg.guild.members.cache.find(member => member.user.tag == args.original.join(" "));
        }
        await CanvasImage.rank_image(taggedmember || msg.member, databases.users);
        
        const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
        
        const replyEmbed = {
            color: 2215613,
            image: {
                url: 'attachment://level.png'
            }
        }

        if (interaction) await apiFunctions.interactionEdit(msg.client, interaction, msg.channel);

        return msg.channel.send({ files: [attachment], embed: {
            color: 2215713,
            image: {
                url: 'attachment://level.png'
            }
        }});       
    }
}
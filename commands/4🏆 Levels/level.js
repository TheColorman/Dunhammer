//@ts-check
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { CanvasImage, apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'level',
    shortDesc: 'Displays your/tagged users level.',
    longDesc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[(tagged user/user tag e.g. example#0000)]',
    aliases: ['rank', 'lvl'],
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

        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            const members = await msg.guild.members.fetch({ cache: false });
            taggedmember = await members.find(member => member.user.tag == args.original.join(" "));
        }
        await CanvasImage.rank_image(taggedmember || msg.member, databases.users);
        
        const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
        
        if (interaction) await apiFunctions.interactionEdit(msg.client, interaction, msg.channel);

        return msg.channel.send({ files: [attachment], embed: {
            color: 2215713,
            image: {
                url: 'attachment://level.png'
            }
        }});       
    }
}
//@ts-check
const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'roadmap',
    short_desc: 'Sends a link to the roadmap.',
    aliases: ['trello', 'todo', 'to-do'],
    long_desc: 'Sends a to the Dunhammer roadmap on trello.com. Shows all coming planned features, bugs, what is currently being worked on and all the bots features, along with the bot version and beta features.',
    usage: '',
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const replyEmbed = {
            title: ":map: Roadmap",
            url: "https://trello.com/b/expgfSZa/dunhammer-roadmap",
            color: 49919
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}
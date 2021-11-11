// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const MySQL = require('../sql/sql');

const GitHub = require('github-api');

module.exports = {
    name: "report",
    ApplicationCommandData: {
        name: "report",
        description: "Submit a bug report",
        type: "CHAT_INPUT",
        options: [{
            type: "STRING",
            name: "message",
            description: "The message to report",
            required: true,
        }]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     * 
     */
    async execute(interaction, _sql, _Events) {

        // Get the message
        const reportMessage = interaction.options.getString('message');

        // Send confirmation message
        interaction.reply({
            embeds: [{
                title: "Verify",
                description: `Are you sure you want to submit a bug report?`,
                fields: [{
                    name: "Report:",
                    value: `\`\`\`\n${reportMessage}\n\`\`\``,
                }],
                color: 0xed8505,
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "Confirm",
                    customId: "commands.report.confirm",
                    style: "PRIMARY",
                    emoji: "✅",
                }, {
                    type: "BUTTON",
                    label: "Cancel",
                    customId: "commands.report.cancel",
                    style: "SECONDARY",
                    emoji: "❌",
                }]
            }]
        });
    },
    /**
     * @param {Discord.ButtonInteraction} interaction 
     * @param {MySQL} sql 
     */
    async confirm(interaction, sql, Events) {
        // Block if the user didn't start the command
        if (interaction.message.interaction.user.id !== interaction.user.id) {
            return interaction.reply({
                embeds: [{
                    title: "Error",
                    description: `You can't submit a bug report if you didn't start it!`,
                    color: 0xF14B46,
                }],
                ephemeral: true,
            });
        }

        // Get message
        const reportMessage = interaction.message.embeds[0].fields[0].value.slice(3, -3);

        // Authenticate with GitHub
        const { githubToken } = require('../token.json');
        const gh = new GitHub({
            token: githubToken,
        });
        

        // Create issue
        gh.getIssues("TheColorman", "Dunhammer").createIssue({
            title: `Bug Report: ${interaction.user.username}`,
            body: `${reportMessage}`,
            labels: ['discord report']
        }).then(response => {
            if (response.status !== 201) {
                return interaction.update({
                    embeds: [{
                        title: "Error",
                        description: "There was an error submitting your bug report. Please try again later.",
                        color: 0xF14B46
                    }],
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            label: "Confirm",
                            customId: "commands.report.confirm",
                            style: "PRIMARY",
                            emoji: "✅",
                            disabled: true,
                        }, {
                            type: "BUTTON",
                            label: "Cancel",
                            customId: "commands.report.cancel",
                            style: "SECONDARY",
                            emoji: "❌",
                            disabled: true,
                        }],
                    }],
                });
            }
            // Send success message
            interaction.update({
                embeds: [{
                    title: "Success",
                    description: `Your bug report has been submitted. Thank you for your feedback!\n[Click here to see the report](${response.data.html_url})`,
                    fields: [{
                        name: "Report:",
                        value: `\`\`\`\n${reportMessage}\n\`\`\``,
                    }],
                    color: 0x7BA043
                }],
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "Confirm",
                        customId: "commands.report.confirm",
                        style: "PRIMARY",
                        emoji: "✅",
                        disabled: true,
                    }, {
                        type: "BUTTON",
                        label: "Cancel",
                        customId: "commands.report.cancel",
                        style: "SECONDARY",
                        emoji: "❌",
                        disabled: true,
                    }],
                }],
            });
    
            // Emit event
            Events.emit('bugReport', sql, interaction.user, reportMessage.content, interaction.channel);
        });
        
    },
    /**
     * @param {Discord.ButtonInteraction} interaction 
     * @param {MySQL} sql 
     */
    async cancel(interaction, _sql, _Events) {
        // Block if the user didn't start the command
        if (interaction.message.interaction.user.id !== interaction.user.id) {
            return interaction.reply({
                embeds: [{
                    title: "Error",
                    description: `You can't cancel a bug report if you didn't start it!`,
                    color: 0xF14B46,
                }],
                ephemeral: true,
            });
        }
        
        // Update message
        interaction.update({
            embeds: [{
                title: "Cancelled",
                description: "Your bug report has been cancelled.",
                color: 0xF14B46,
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "Confirm",
                    customId: "commands.report.confirm",
                    style: "PRIMARY",
                    emoji: "✅",
                    disabled: true,
                }, {
                    type: "BUTTON",
                    label: "Cancel",
                    customId: "commands.report.cancel",
                    style: "SECONDARY",
                    emoji: "❌",
                    disabled: true,
                }],
            }],
        });
    }
}
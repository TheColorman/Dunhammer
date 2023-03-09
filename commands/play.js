// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');


module.exports = {
    name: "play",
    ApplicationCommandData: {
        name: "play",
        description: "Play a song from YouTube.",
        type: 1,
        options: [{
            type: 3,
            name: "url",
            description: "URL of the song to play.",
            required: true
        }]
    },
    module: 1,
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     * @param {DunhammerEvents} events DunhammerEvents custom object
     */
    async execute(interaction, _sql, _Events) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({
            embeds: [{
                "color": 0xF14B46,
                "description": "You need to be in a voice channel to use this command!"
            }]
        });

        const con = getVoiceConnection(interaction.guild.id);

        const globalQueue = interaction.client.songQueue;
        if (!globalQueue.has(interaction.guild.id)) {
            globalQueue.set(interaction.guild.id, []);
        }
        const guildQueue = globalQueue.get(interaction.guild.id);

        const url = interaction.options.getString("url", true);
        guildQueue.push(url);
        globalQueue.set(interaction.guild.id, guildQueue);

        const songTitle = (await ytdl.getInfo(url)).player_response.videoDetails.title;
        ytdl.getInfo(url, { downloadURL: true }, (err, info) => {
            if (err) throw err;
            console.log(info);
        })
        if (con && con.state && con.state.subscription.player.state.status === 'playing') return interaction.reply({
            content: `Added ${songTitle} to the queue.\n${url}`,
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "⏹",
                    customId: "commands.play.stop",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    label: "⏭",
                    customId: "commands.play.skip",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "⏯",
                    customId: "commands.play.pause",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "Autoplay",
                    customId: "commands.play.autoplay",
                    style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                }]
            }]
        });

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const playSong = async (connection, url) => {
            const stream = ytdl(url, { filter: 'audioonly' });
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            const player = createAudioPlayer();

            player.play(resource);
            connection.subscribe(player);

            const songInfo = await ytdl.getInfo(url);
            const title = songInfo.player_response.videoDetails.title;
            interaction.channel.send({
                content: `Now playing ${title}\n${url}`,
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "⏹",
                        customId: "commands.play.stop",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "⏭",
                        customId: "commands.play.skip",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "⏯",
                        customId: "commands.play.pause",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "Autoplay",
                        customId: "commands.play.autoplay",
                        style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                    }]
                }]
            });

            player.on(AudioPlayerStatus.Idle, () => {
                const songQueue = globalQueue.get(interaction.guild.id);
                if (songQueue.length > 0) {
                    const nextUrl = songQueue.shift();
                    globalQueue.set(interaction.guild.id, songQueue);
                    playSong(connection, nextUrl);
                } else if (interaction.client.autoplay === true) {
                    interaction.channel.send({
                        content: "No more songs in the queue. Autoplay is enabled, so I'll play a random song for you."
                    });
                    const nextSong = "https://youtu.be/" +
                        songInfo
                            .response
                            .playerOverlays
                            .playerOverlayRenderer
                            .endScreen
                            .watchNextEndScreenRenderer
                            .results[0].endScreenVideoRenderer.videoId;
                    playSong(connection, nextSong);
                } else {
                    connection.destroy();
                    interaction.channel.send({
                        embeds: [{
                            "color": 0x7BA043,
                            "description": `Finished playing the queue.`
                        }],
                    });
                }
            })
        }

        const nextUrl = guildQueue.shift();
        globalQueue.set(interaction.guild.id, guildQueue);

        playSong(connection, nextUrl);
        return interaction.reply({
            content: `Added ${songTitle} to the queue.`,
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "⏹",
                    customId: "commands.play.stop",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    label: "⏭",
                    customId: "commands.play.skip",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "⏯",
                    customId: "commands.play.pause",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "Autoplay",
                    customId: "commands.play.autoplay",
                    style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                }]
            }]

        });
    },
    async stop(interaction, _sql, _Events) {
        const con = getVoiceConnection(interaction.guild.id);
        if (!con) return interaction.reply({
            content: `I'm not playing anything right now.`,
            ephemeral: true
        });
        con.destroy();
        return interaction.reply({
            content: `Stopped playing.`
        });
    },
    async pause(interaction, _sql, _Events) {
        const con = getVoiceConnection(interaction.guild.id);
        if (!con || !con.state || !con.state.subscription || !con.state.subscription.player) return interaction.reply({
            content: `I'm not playing anything right now.`,
            ephemeral: true
        });
        const audioPlayer = con.state.subscription.player;
        if (audioPlayer.state.status === AudioPlayerStatus.Paused) {
            audioPlayer.unpause()
            return interaction.reply({
                content: `Resumed playback.`,
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "⏹",
                        customId: "commands.play.stop",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "⏭",
                        customId: "commands.play.skip",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "⏯",
                        customId: "commands.play.pause",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "Autoplay",
                        customId: "commands.play.autoplay",
                        style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                    }]
                }]

            });
        } else {
            audioPlayer.pause();
            return interaction.reply({
                content: `Paused.`,
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "⏹",
                        customId: "commands.play.stop",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "⏭",
                        customId: "commands.play.skip",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "⏯",
                        customId: "commands.play.pause",
                        style: "PRIMARY"
                    }, {
                        type: "BUTTON",
                        label: "Autoplay",
                        customId: "commands.play.autoplay",
                        style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                    }]
                }]

            });
        }
    },
    async skip(interaction, _sql, _Events) {
        const con = getVoiceConnection(interaction.guild.id);
        if (!con || !con.state || !con.state.subscription || !con.state.subscription.player) return interaction.reply({
            content: `I'm not playing anything right now.`,
            ephemeral: true
        });
        const audioPlayer = con.state.subscription.player;
        audioPlayer.stop();
        return interaction.reply({
            content: `Skipped.`,
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "⏹",
                    customId: "commands.play.stop",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    label: "⏭",
                    customId: "commands.play.skip",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "⏯",
                    customId: "commands.play.pause",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "Autoplay",
                    customId: "commands.play.autoplay",
                    style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                }]
            }]

        });
    },
    async autoplay(interaction, _sql, _Events) {
        let autoplay = interaction.client.autoplay;
        if (!autoplay) interaction.client.autoplay = true;
        else interaction.client.autoplay = false;
        autoplay = interaction.client.autoplay;
        return interaction.reply({
            content: `Autoplay is now ${autoplay ? "enabled" : "disabled"}.`,
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "⏹",
                    customId: "commands.play.stop",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    label: "⏭",
                    customId: "commands.play.skip",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "⏯",
                    customId: "commands.play.pause",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    label: "Autoplay",
                    customId: "commands.play.autoplay",
                    style: interaction.client.autoplay ? "SUCCESS" : "DANGER"
                }]
            }]

        });
    }
}
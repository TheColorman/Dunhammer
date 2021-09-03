// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "leaderboard",
    ApplicationCommandData: {
        name: "leaderboard",
        description: "View xp leaderboard.",
        options: [
            {
                type: "USER",
                name: "user",
                description: "User to search for"
            }, {
                type: "ROLE",
                name: "role",
                description: "Role to filter by"
            }, {
                type: "STRING",
                name: "filter",
                description: "Filter type",
                choices: [
                    {
                        name: "With role",
                        value: "whitelist"
                    }, {
                        name: "Without role",
                        value: "blacklist"
                    }
                ]
            }, {
                type: "STRING",
                name: "type",
                description: "Type of leaderboard to show",
                choices: [
                    {
                        name: "Server",
                        value: "server"
                    }, {
                        name: "Global",
                        value: "global"
                    }
                ]
            }
        ]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        const
            reply = await interaction.reply({
                embeds: [{
                    "color": 0x2F3136,
                    "description": `<a:discord_loading:821347252085063680>`
                }], 
                fetchReply: true 
            }),
            type = interaction.options.getString('type') || "server";

        if (type == "server") await replyServer(interaction, sql, reply);
        else await replyGlobal(interaction, sql, reply);
    },
    // Button functions
    previous(interaction, sql, dataString) {

        const data = JSON.parse(dataString);
        buttonHandler(interaction, sql, data, data.page - 1);
    },
    next(interaction, sql, dataString) {
        const data = JSON.parse(dataString);
        //                                              ⬇ fuck javascript, all my homies hate javascript
        buttonHandler(interaction, sql, data, data.page - - 1);
    },
    first(interaction, sql, dataString) {
        const data = JSON.parse(dataString);
        buttonHandler(interaction, sql, data, 1);        
    },
    last(interaction, sql, dataString) {
        const data = JSON.parse(dataString);
        buttonHandler(interaction, sql, data, 999999);  // truly the best solution to jumping to the last page
    },
    custom(interaction, sql, dataString) {
        const
            data = JSON.parse(dataString),
            filter = message => message.author.id == interaction.user.id && !isNaN(message.content) && !isNaN(parseFloat(message.content));
        
        interaction.reply({
            content: `${interaction.member}, what page would you like to go to?`,
            fetchReply: true,
            deffered: true
        })
            .then((reply) => {  // It works, trust me 😎
                interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
                    .then(collected => {
                        const
                            message = collected.first(),
                            str = Math.round(message.content);
                        // See buttonHandler
                        interaction.options = {
                            getUser: (_user) => undefined,
                            getRole: (_role) => data.role ? interaction.guild.roles.fetch(data.role) : undefined,
                            getString: (_filter) => data.filter
                        }
                        interaction.deferButton = true;
                        if (data.type == "server") replyServer(interaction, sql, interaction.message, str);
                        else replyGlobal(interaction, sql, interaction.message, str);


                        reply.delete();
                        collected.first().delete();
                    })
                    .catch(_collected => {
                        reply.delete();
                    });
            });
    },
    /**
     * @param {Discord.SelectMenuInteraction} interaction 
     * @param {MySQL} sql 
     */
    select(interaction, sql, dataString) {
        const data = JSON.parse(dataString);
        data.type = interaction.values[0];
        buttonHandler(interaction, sql, data, data.page);
    }
}

async function buttonHandler(interaction, sql, data, page) {
    //#region trash
    /* Oh boy I'm gonna need a multi-line comment for this one.
       So, basically, the function replyServer (and replyGlobal when I finish that one)
       excpects the first parameter to be an interaction. That's all good, but only CommandInteractions have the .options 
       property,  so when  interaction.options  is checked,  it's  always  going  to  return  undefined  when checking  a
       ButtonInteraction.  Now, what if someone uses a role  when doing the CommandInteraction  and they press a  button?
       The  ButtonInteraction won't have  a role,  and all  further pages aren't  going to filter by  the role.  That's a
       problem. So, I  have added a .options property  to the ButtonInteraction with the  methods used in the replyServer
       function,  and they return the value  from the data object, which is a  stringified object passed as a part of the
       buttons  CustomId.  This CustomId  is  defined  at the  bototm of  the replyServer  function,  called  dataString.
       Thank you for coming to my Ted Talk.
      
       TL;DR: I'm creating fake methods and returning stringified objects. */
    //#endregion
    const user = data.user ?
        data.type == "server" ?
            await interaction.guild.members.fetch(data.user) :
            await interaction.client.users.fetch(data.user) :
        undefined
    interaction.options = {
        getUser: (_user) => user,
        getRole: (_role) => data.role ? interaction.guild.roles.fetch(data.role) : undefined,
        getString: (_filter) => data.filter
    }
    if (data.type == "server") replyServer(interaction, sql, interaction, page);
    else replyGlobal(interaction, sql, interaction, page);
}

/**
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql 
 * @param {String} page 
 */
async function replyServer(interaction, sql, reply, page) {
    const
        // Get general info
        user = interaction.options ? interaction.options.getUser('user') || interaction.user : interaction.user,
        member = await interaction.guild.members.fetch(user),
        // Variable isn't used, but the program needs to verify
        // that the member is in the database or it wont be
        // able to find the member later
        _DBGuildMember = await sql.getDBGuildMember(member),
        role = interaction.options ? await interaction.options.getRole('role') : undefined,
        filter = interaction.options ? interaction.options.getString('filter') : undefined,

        GuildMemberDB = await sql.get("guildusers", `guildid = ${interaction.guild.id}`, `xp DESC`),
        // Filter by role, check if filter is blacklist and continue accordingly
        GuildMemberDBFiltered = role ?
            GuildMemberDB.filter(DBGuildMember => filter && filter == "blacklist" ?
                !JSON.parse(DBGuildMember.roles).includes(role.id) :
                JSON.parse(DBGuildMember.roles).includes(role.id)) :
            GuildMemberDB;
    if (!page) {
        // Index of chosen member, used to automatically show the right page
        const memberIndex = GuildMemberDB.findIndex(DBGuildMember => DBGuildMember.userid == member.id);
        page = Math.ceil((memberIndex + 1) / 10);
    }
    const
        // Maximum amount of pages based on how many entries are in the database
        maxPage = Math.ceil(GuildMemberDBFiltered.length / 10),
        currentPage = Math.min(maxPage, Math.max(page, 1)),
        // Calculate the 10 members shown based on the page we are on
        DBGuildMemberList = GuildMemberDBFiltered.splice(10 * (currentPage - 1), 10),
        // Map the array into both DiscordJS GuildMembers and DBGuildMembers for use in ...
        MultiMemberList = DBGuildMemberList.map(async DBGuildMember => {
            if (!DBGuildMember.inGuild) return [DBGuildMember.nickname, DBGuildMember];
            return [await interaction.guild.members.fetch(DBGuildMember.userid), DBGuildMember];
        }),
        // ... this array, where it's all turned into a string with the format "#1 - {DiscordGuildMember} `1234` xp"
        GuildMemberDisplay = (await Promise.all(MultiMemberList)).map((memberArr, index) => {
            const
                mentioned = memberArr[1].userid == user.id,
                added = mentioned ? "__" : "";
            // Calculation for rank is based on index and page, so page 2 has from rank 11 to 20
            return `${added}#${(currentPage - 1) * 10 + index + 1} - ${memberArr[0]} \`${memberArr[1].xp}\` xp${added}`;
        }),


        dataString = JSON.stringify({
            page: currentPage,
            role: role? role.id : undefined,
            filter: filter,
            type: "server",
            user: member.id
        }),
        roleString = `${
            // If filtered by role
            role ?  // add "Members with" string
                `**Members with${ // if the role is blacklisted, add "out", so the string becomes: "Members without"
                    filter && filter == "blacklist" ?
                        'out' :
                        ''
                // Add " role {role}" to the string, string is now: "Members with(out) role {role}"
                } role ${role}**\n\n` :
                // Or don't have a string if there is no filter
                ''
        }`,
        replyObj = {
            embeds: [{
                color: 0x7BA043,
                title: `🏆 ${interaction.guild.name}'s Leaderboard`,
                description: `${roleString}${GuildMemberDisplay.join("\n")}`,
                footer: {
                    text: `Page ${currentPage}/${maxPage}`,
                    iconURL: interaction.guild.iconURL({ size: 16 })
                }
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    customId: `commands.leaderboard.first.${dataString}`,
                    emoji: "⏪",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON", 
                    customId: `commands.leaderboard.previous.${dataString}`, // yeah stringifying an object is a stupid-ass solution but why are you reading the fucking source code?
                    emoji: "◀",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.custom.${dataString}`,
                    emoji: "🔢",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.next.${dataString}`,
                    emoji: "▶",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.last.${dataString}`,
                    emoji: "⏩",
                    style: "PRIMARY"
                }]
            }, {
                type: "ACTION_ROW",
                components: [{
                    type: "SELECT_MENU",
                    customId: `commands.leaderboard.select.${dataString}`,
                    options: [{
                        label: "Server",
                        value: "server",
                        description: "Server-wide leaderboard",
                        default: true
                    }, {
                        label: "Global",
                        value: "global",
                        description: "Global Dunhammer leaderboard",
                        default: false
                    }]
                }]
            }]
        }
    
    if ((interaction.isButton() || interaction.isMessageComponent()) && !interaction.deferButton) return reply.update(replyObj);
    reply.edit(replyObj);
}
/**
 * @param {Discord.CommandInteraction|Discord.ButtonInteraction} interaction 
 * @param {MySQL} sql 
 * @param {Discord.Message|Discord.ButtonInteraction} reply 
 * @param {Number} page 
 */
async function replyGlobal(interaction, sql, reply, page) {
    const
        // Get general info
        user = interaction.options ? interaction.options.getUser('user') || interaction.user : interaction.user;
    //// Variable isn't used, but the program needs to verify
    //// that the user is in the database or it wont be
    //// able to find the user later
    // DeepScan wouldn't shut the fuck up about my unused
    // variable so I removed the variable declaration.
    // Are you happy DeepScan? Because I'm not.
    await sql.getDBUser(user);
    const
        UserDB = await sql.get("users", ``, `xp DESC`);
        // Filter by role, check if filter is blacklist and continue accordingly
        // Maximum amount of pages based on how many entries are in the database
    if (!page) {
        // Index of chosen member, used to automatically show the right page
        const memberIndex = UserDB.findIndex(DBUser => DBUser.userid == user.id);
        page = Math.ceil((memberIndex + 1) / 10);
    }    
    const
        maxPage = Math.ceil(UserDB.length / 10),
        currentPage = Math.min(maxPage, Math.max(page, 1)),
        // Calculate the 10 members shown based on the page we are on
        DBUserList = UserDB.splice(10 * (currentPage - 1), 10),
        // ... this array, where it's all turned into a string with the format "#1 - {DiscordGuildMember} `1234` xp"
        UserDisplay = DBUserList.map((DBUser, index) => {
            const
                mentioned = DBUser.id == user.id,
                added = mentioned ? "__" : "";
            // Calculation for rank is based on index and page, so page 2 has from rank 11 to 20
            return `${added}#${(currentPage - 1) * 10 + index + 1} - ${DBUser.username} \`${DBUser.xp}\` xp${added}`
        }),


        dataString = JSON.stringify({
            page: currentPage,
            type: "global",
            user: user.id
        }),
        replyObj = {
            embeds: [{
                color: 0x7BA043,
                title: `🏆 Dunhammer Global Leaderboard <:DunhammerCoin:878740195078463519>`,
                description: `${UserDisplay.join("\n")}`,
                footer: {
                    text: `Page ${currentPage}/${maxPage}`,
                    iconURL: interaction.client.user.displayAvatarURL({ size: 16 })
                }
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    customId: `commands.leaderboard.first.${dataString}`,
                    emoji: "⏪",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON", 
                    customId: `commands.leaderboard.previous.${dataString}`, // yeah stringifying an object is a stupid-ass solution but why are you reading the fucking source code?
                    emoji: "◀",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.custom.${dataString}`,
                    emoji: "🔢",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.next.${dataString}`,
                    emoji: "▶",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.leaderboard.last.${dataString}`,
                    emoji: "⏩",
                    style: "PRIMARY"
                }]
            }, {
                type: "ACTION_ROW",
                components: [{
                    type: "SELECT_MENU",
                    customId: `commands.leaderboard.select.${dataString}`,
                    placeholder: "Leaderboard",
                    options: [{
                        label: "Server",
                        value: "server",
                        description: "Server-wide leaderboard",
                        default: false
                    }, {
                        label: "Global",
                        value: "global",
                        description: "Global Dunhammer leaderboard",
                        default: true
                    }]
                }]
            }]
        }
    if ((interaction.isButton() || interaction.isMessageComponent()) && !interaction.deferButton) return reply.update(replyObj);
    reply.edit(replyObj);
}
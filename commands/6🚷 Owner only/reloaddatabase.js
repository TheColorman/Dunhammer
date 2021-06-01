//@ts-check
module.exports = {
    name: 'reloaddatabase',
    shortDesc: 'Reloads the database.',
    longDesc: 'Reloads the entire database for this guild. This command can only be used by the bot owner.',
    async execute(msg, args, tags, databases) {
        const currentGuild = databases.guilds.findOne({ guild_id: msg.guild.id });
        if (!['298842558610800650', '411240035841474590'].includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${currentGuild.prefix}reloaddatabase\`!`
            }});
        }
        const message = await msg.channel.send({ embed: {
            color: 49919,
            description: "<a:discord_loading:821347252085063680> Refreshing database... (This will take a while)."
        }});

        // Guilds
        await message.edit({ embed: {
            color: 49919,
            description: `<a:discord_loading:821347252085063680> Refreshing database... (This will take a while).\n\n\`\`\`\nRefreshing guilds...\n\n\`\`\``
        }});
        let editDescription = `Refreshing guilds...`;
        const guilds = await msg.client.guilds.cache;

        let index = 1;
        for (const guildArr of guilds) {
            const guild = guildArr['1'];
            editDescription = `${editDescription}\n------------------------------\nVerifying ${guild.name}. (${index}/${guilds.size})`;
            editDescription = cutLineBreaks(editDescription, 10);
            await message.edit({ embed: {
                color: 49919,
                description: `<a:discord_loading:821347252085063680> Refreshing database... (This will take a while).\n\n\`\`\`\n${editDescription}\n\`\`\``,
            }});
            const db_guild = databases.guilds.findOne({ guild_id: guild.id });
            db_guild.levelSystem.roles ||= { cumulative: false};
            db_guild.levelSystem.cooldown_timestamps ||= {};
            db_guild.allowbots ||= false;
            db_guild.name ||= msg.guild.name;
            databases.guilds.update(db_guild);

            // Users (from guild)
            const members = await guild.members.fetch();
            const members_length = members.size;
            editDescription = `${editDescription}\n    Refreshing roles for ${members_length} members...`;
            editDescription = cutLineBreaks(editDescription, 10);
            await message.edit({ embed: {
                color: 49919,
                description: `<a:discord_loading:821347252085063680> Refreshing database... (This will take a while).\n\n\`\`\`\n${editDescription}\n\`\`\``,
            }});
            if (databases.guild_config.getCollection(guild.id) === null) {
                databases.guild_config.addCollection(guild.id, {
                    unique: ["user_id"],
                    autoupdate: true
                });
            }
            const user_db = databases.guild_config.getCollection(guild.id);
            members.each(async member => {
                // roles
                if (user_db.findOne({ user_id: member.id}) == null) {
                    user_db.insert({
                        user_id: member.id,
                        xp: 0,
                        level: 0,
                        levelroles: [],
                        roles: [],
                        inGuild: true,
                        username: member.user.username,
                        tag: member.user.tag.slice(-5),
                        avatarUrl: await member.user.displayAvatarURL({ dynamic: true, size: 512 }),
                    });
                }
                const db_user = user_db.findOne({ user_id: member.id });
                db_user.roles = [];
                member.roles.cache.forEach(role => db_user.roles.push(role.id));
                
                db_user.levelroles ||= false;
                db_user.inGuild ||= true;
                user_db.update(db_user);
            });

            // Users (from database)
            const db_users = user_db.chain().data();
            const db_users_length = db_users.length;
            editDescription = `${editDescription}\n    Verifying ${db_users_length} database members`;
            editDescription = cutLineBreaks(editDescription, 10);
            await message.edit({ embed: {
                color: 49919,
                description: `<a:discord_loading:821347252085063680> Refreshing database... (This will take a while).\n\n\`\`\`\n${editDescription}\n\`\`\``
            }});
            for (const db_user of db_users) {
                try {
                    await msg.guild.members.fetch(db_user.user_id);
                } catch (err) {
                    if (err.message === "Unknown Member" || err.message === "Unknown User") {
                        db_user.inGuild = false;
                    }
                }
                try {
                    const ds_user = await msg.client.users.fetch(db_user.user_id);
                    db_user.username = ds_user.username;
                    db_user.tag = ds_user.tag.slice(-5);
                    db_user.avatarUrl = await ds_user.displayAvatarURL({ dynamic: true, size: 512 });    
                } catch (err) {
                    if (err.message === "Unknown User") {
                        db_user.exists = false;
                    } else {
                        console.error(err);
                    }
                }
                db_user.roles ||= [];
                db_user.xp ||= 0;
                db_user.level = getLevel(db_user.xp);
                user_db.update(db_user);
            }
            index++;
        }
        
        await message.edit({ embed: {
            color: 49919,
            description: `~~:white_check_mark: Refreshing database... (This will take a while).~~\n\n\`\`\`\n${editDescription}\n\`\`\`\n\n Done!`
        }});
        return msg.channel.send({ embed: {
            color: 2215713,
            description: ":white_check_mark: Reloaded the database for this server."
        }});
    }
}

function getLevel(xp) {
    let lower = 0;
    let upper = 10000000000;
    while (lower + 1 < upper) {
        const middle = Math.floor((lower + upper)/2);
        const level_xp = 5*(118*middle+2*middle*middle*middle)/6;
        if (level_xp > xp) {
            upper = middle;
        } else {
            lower = middle;
        }
    }
    return lower;
}

function cutLineBreaks(string, linebreaks) {
    return string.match(/\n/g).length > linebreaks ? (string.split("\n").slice(-string.match(/\n/g).length)).join("\n") : string;
}
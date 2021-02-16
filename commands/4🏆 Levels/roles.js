//@ts-check

const { QuickMessage } = require("../../helperfunctions");

module.exports = {
    name: "roles",
    aliases: ["levelroles", "leveluproles", "lvlroles", "lvluproles"],
    short_desc: "Choose which roles are gained at which levels.",
    long_desc: "Add or remove which roles are awarded when a user reaches a specific level. Roles are chosen by either tagging them (e.g. @Admins) or by typing out their name (e.g. Admins).\n\n**Options**\n`add <level> <role>` - Adds a role at the specified level.\n`remove <role>` - Removes a specified role.\n`cumulative <true/false>` - Specify whether old roles are kept when gaining new ones (true: roles build up over time, false: only newest role is given).\n`reload` - Reloads roles for all members in the server.",
    usage: "<add/remove/cumulative/reload> [...arguments]",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
    async execute(msg, args, tags, databases) {
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        const user_db = databases.users;
        let role;
        
        switch (args.lowercase[0]) {
            case 'add':
                role = tags.roles.first() || msg.guild.roles.cache.find(role_object => args.lowercase.join(" ").includes(role_object.name.toLowerCase()));
                if (isNaN(args.lowercase[1]) && isNaN(parseFloat(args.lowercase[1]))) return QuickMessage.invalid_argument(msg.channel, db_guild.prefix, "levelsettings");
                if (!role) return QuickMessage.invalid_role(msg.channel, db_guild.prefix, "levelsettings");
                
                db_guild.levelSystem.roles[args.lowercase[1]] = role.id;
                guild_db.update(db_guild);
                return QuickMessage.add(msg.channel, `Added ${role} to level roles at level ${args.lowercase[1]}.`);
            case 'remove':
                role = tags.roles.first() || msg.guild.roles.cache.find(role_object => args.lowercase.join(" ").includes(role_object.name.toLowerCase()));
                if (!role) return QuickMessage.invalid_role(msg.channel, db_guild.prefix, "levelsettings");
                if (!(Object.values(db_guild.levelSystem.roles).indexOf(role.id) > -1)) return QuickMessage.error(msg.channel, `:question: That role is not a level role!`);

                for (let key in db_guild.levelSystem.roles) {
                    if (db_guild.levelSystem.roles[key] == role.id) delete db_guild.levelSystem.roles[key];
                }
                return QuickMessage.remove(msg.channel, `Removed ${role} from level roles.`);
            case 'reload':
                msg.channel.send({ embed: {
                    color: 49919,
                    description: ":arrows_counterclockwise: Reloading all level roles... (this might take a while depending on the amount of users on your server)."
                }});
                const userdata = user_db.chain().data();
                for (let user of userdata) {
                    for (let level = 0; level < user.level; level++) {
                        if (db_guild.levelSystem.roles.hasOwnProperty(level)) {
                            try {
                                let member = await msg.guild.members.fetch(user.user_id);
                                if (!db_guild.levelSystem.roles.cumulative) {
                                    user.levelroles ||= [];
                                    for (let role_id of user.levelroles) {
                                        let role = await msg.guild.roles.fetch(role_id);
                                        member.roles.remove(role);
                                    }
                                }
                                const role = await msg.guild.roles.fetch(db_guild.levelSystem.roles[level]);
                                member.roles.add(role);
                                user.levelroles.push(db_guild.levelSystem.roles[level]);
                            } catch (err) {
                                if (err.message === "Unknown member") {
                                    user.inGuild = false;
                                }
                            }
                            user_db.update(user);
                            }
                    }
                }
                return msg.channel.send({ embed: {
                    color: 2215713,
                    description: ":white_check_mark: Reloaded all level roles."
                }});
            case 'cumulative':
                switch (args.lowercase[1]) {
                    case 'true':
                        db_guild.levelSystem.roles.cumulative = true;
                        return QuickMessage.add(msg.channel, "Set cumulative roles to `true`.")
                    case 'false':
                        db_guild.levelSystem.roles.cumulative = false;
                        return QuickMessage.remove(msg.channel, "Set cumulative roles to `false`.")
                    default:
                        return QuickMessage.invalid_argument(msg.channel, db_guild.prefix, "levelsettings");
                }                         
            default:
                const arr = [];
                for (const [key, value] of Object.entries(db_guild.levelSystem.roles)) {
                    arr.push(`${key == "cumulative" ? "Cumulative roles: " : `Level: ${key}`}: ${key == "cumulative" ? `${value}` : await msg.guild.roles.fetch(value)}`);
                }
                return QuickMessage.info(msg.channel, "Level roles", `${arr.join('\n')}`);
        }

    }
}
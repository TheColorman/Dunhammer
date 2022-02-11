/**
 * @typedef {Object} DBUser
 * @property {String}   id                   - User ID
 * @property {String}   username             - Username without tag
 * @property {String}   tag                  - User tag
 * @property {Boolean}  levelMentions        - Whether user gets mentioned when leveling up (global only)
 * @property {Boolean}  levelDm              - Whether user gets a DM when leveling up on a server with disabled levelsystem
 * @property {Boolean}  disabled             - Whether user has opted out of Global leaderboard
 * @property {Number}   xp                   - User total xp
 * @property {Number}   level                - User level
 * @property {Number}   coins                - Users coins
 * @property {Number}   badges               - Bitfield value of all unlocked badges
 * @property {Number}   currentBadges        - Bitfield value of all badges displayed on profile
 * @property {Number}   backgrounds          - Bitfield value of all unlocked backgrounds
 * @property {Number}   currentBackground    - Current selected background
 * @property {Number}   spentMoney           - Total spent money in USD
 * @property {Number}   commandCount         - Total number of commands used
 * @property {Number}   pingCount            - Total number of pings used
 * @property {Number}   inviteCount          - Total number of times user has invited Dunhammer
 */
/**
 * @typedef {Object} DBGuild
 * @property {String}   id         - Guild ID
 * @property {String}   name       - Guild name
 */
/**
 * @typedef {Object} DBGuildLevelsystem
 * @property {String}           id                   - Guild id
 * @property {Boolean}          enabled              - Whether levelsystem is enabled
 * @property {Array<String>}    ignoredChannels      - Stringified array of ignord channel IDs
 * @property {String|null}      levelupChannel       - Channel ID where levelup messages are sent
 * @property {String}           levelupMessage       - Stringified embed object for levelup
 * @property {String}           newroleMessage       - Stringified embed object for newrole
 * @property {Boolean}          tagMember            - Whether to tag the member who leveled up
 * @property {Boolean}          rolesCumulative      - Whether levelup roles are cumulative
 * @property {{Level: String}}  roles                - Stringified object of roles where `key = level` and `value = role ID`
 * @property {Boolean}          publicLeaderboard    - Whether leaderboard is public
 */
/**
 * @typedef {Object} DBGuildMember
 * @property {String}         guildid    - Guild ID
 * @property {String}         userid     - Member ID
 * @property {String}         nickname   - Member nickname
 * @property {Number}         xp         - Total XP
 * @property {Number}         level      - Current level
 * @property {String[]}       roles      - Stringified list of member roles
 */
/**
 * @typedef {Object} DBChannel
 * @property {String}   id                   - Channel ID
 * @property {Number}   messageStreak        - Current channel message streak
 * @property {Number}   streakTimestamp      - Date when streak was last updated in millisecond format
 * @property {String}   lastMessageMember    - ID of last user to send a message in channel
 */
/**
 * @typedef {Object} DBBadge
 * @property {Number}   id               - Badge ID
 * @property {Number}   bitId            - Bitfield value of badge
 * @property {String}   idEmoji          - Discord Emoji ID
 * @property {String}   idGreyEmoji      - Discord Emoji ID for grey version
 * @property {String}   name             - Badge name
 * @property {String}   description      - Badge description
 * @property {Number}   prerequisite     - ID of prerequisite badge, null if no prerequisite required
 */
/**
 * @typedef {DBGuildMember[]} DBUserGuilds
 */


export type Login = {
    host: string;
    user: string;
    database: string;
    password: string;
    charset?: string;
}

export type dbUser = {
    id: string;
    username: string;
    tag: string;
    levelMentions: boolean;
    levelDm: boolean;
    disabled: boolean;
    xp: number;
    level: number;
    coins: number;
    badges: number;
    currentBadges: number;
    backgrounds: number;
    currentBackground: number;
    spentMoney: number;
    commandCount: number;
    pingCount: number;
    inviteCount: number;
}

export type dbGuild = {
    id: string;
    name: string;
}

export type dbGuildLevelsystem = {
    id: string;
    enabled: boolean;
    ignoredChannels: string[];
    levelupChannel: string | null;
    levelupMessage: string;
    newroleMessage: string;
    tagMember: boolean;
    rolesCumulative: boolean;
    roles: {
        [key: number]: string;
    };
    publicLeaderboard: boolean;
}

export type dbGuildMember = {
    guildid: string;
    userid: string;
    nickname: string;
    xp: number;
    level: number;
    roles: string[];
}

export type dbChannel = {
    id: string;
    messageStreak: number;
    streakTimestamp: number;
    lastMessageMember: string;
}

export type dbBadge = {
    id: number;
    bitId: number;
    idEmoji: string;
    idGreyEmoji: string;
    name: string;
    description: string;
    prerequisite: number | null;
}

export type dbUserGuilds = dbGuildMember[];
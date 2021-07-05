const express = require("express"),
    fetch = require("node-fetch"),
    { catchAsync } = require("./utils"),
    session = require("express-session"),
    MySQLStore = require("express-mysql-session")(session),
    bodyParser = require("body-parser"),
    crypto = require("crypto"),
    path = require("path"),
    MySQL = require("../sql/sql"),
    ejs = require("ejs"),
    app = express(),

    { cookieSecret, mysqlPassword, applicationSecret } = require("../token.json"),
    { mysql_login: mysqlLogin, client_id: clientID } = require("../config.json");

// set the view engine to ejs
app.set("view engine", "ejs");

const sql = new MySQL(Object.assign({}, mysqlLogin, { password: mysqlPassword})),
    sessionStore = new MySQLStore({}, sql.con);

app.use(express.static(`${__dirname}/assets`));
app.use(session({
    secret: cookieSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// index page
app.get("/", (req, res) => {
    const user = req.session.user;
    res.render("pages/index", { user });
});

app.get("/help", (req, res) => {
    const user = req.session.user;
    res.render("pages/help", { user });
});

app.get("/profile", catchAsync(async (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect("/login");
    
    const DBUserGuilds = await sql.get("guild-users", `userid = ${user.id}`),
        DBGuilds = DBUserGuilds.map(async DBUserGuild => {
            const DBGuild = (await sql.get("guilds", `id = ${DBUserGuild.guildid}`))[0];
            return Object.assign({}, DBUserGuild, DBGuild);
        });
    //#region Updating database information
        /*
            write a function that updates data for user in database for all their guilds.
            that would mean updating their xpRelative, xpRelativeNextLevel and Rank.
            (actually why even have it in the database if i'm calculating it here anyway?)

        */
    //#endregion
    
    Promise.all(DBGuilds).then(async (guilds) => {
        const html = await ejs.renderFile("./views/pages/profile", { user, guilds }, { async: true });
        res.send(html);
    });
}));

//#region Login
app.get("/logout", (req, res) => {
    req.session.user = undefined;
    res.redirect("/");
});
app.get("/login", catchAsync(async (req, res) => {
    if (req.session.user) {
        const cookieUser = req.session.user,
            DBWebUser = await sql.getWebUserInDB(cookieUser.id),
        
            DiscordResponse = await fetch(`https://discord.com/api/v8/users/@me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${DBWebUser.accessToken}`
                }
            });
        if (DiscordResponse.status != 401) {
            return res.send(`<p>You have been logged in, congrats.</p>`);
        }
    }
    return res.sendFile(path.join(__dirname, '/api/login.html'));
}));
//#endregion
//#region APIs
    //#region Login APIs
app.get("/api/discord/login", (req, res) => {
    let state;

    const hash = crypto.createHash('sha256');

    hash.on('readable', () => {
        const data = hash.read();
        if (data) {
            state = data.toString('hex');
        }
    });

    hash.write(req.session.id);
    hash.end();

    res.json({
        state,
        client_id: clientID
    });
});
app.get("/api/discord/callback", (req, res) => {
    return res.sendFile(path.join(__dirname, 'api/callback.html'));
});
app.post("/api/discord/verify", catchAsync(async (req, res) => {
    const code = req.body.code,
        redirect = req.body.redirect_uri;
    if (!code) throw new Error("NoCodeProvided");

    const data = `client_id=${clientID}&client_secret=${applicationSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirect}&scope=email%20guilds`,
        response = await fetch(`https://discord.com/api/v8/oauth2/token`, {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }),
        tokenJSON = await response.json(),
    
        userResponse = await fetch(`https://discord.com/api/v8/users/@me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenJSON.access_token}`
            }
        }),
        userJSON = await userResponse.json();

    req.session.user = {
        id: userJSON.id,
        username: userJSON.username,
        tag: userJSON.discriminator,
        avatar: userJSON.avatar,
        access_token: tokenJSON.access_token
    }

    res.status(204).end();
}));
    //#endregion
//#endregion

app.listen(8081);
console.log("Server is listening on port 8081");

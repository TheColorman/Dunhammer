const express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),

    app = express(),
    client_id = "671681661296967680";

// Routes
app.use('/old/api/discord', require('./api/discord'));

app.use(cookieParser(client_id));
app.set('etag', false);

app.get('/old', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

app.get("/", (req, res) => {
    res.send("uuuuh");
});

app.listen(8081, () => {
    console.info('Running on port 8081');
});
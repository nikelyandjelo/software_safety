const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const SERVER_PORT = 3000;
const { AuthenticationClient, UserInfoClient } = require('auth0');


const AUTHENTICATION_HEADER = 'Authorization';

const authenticationClient = new AuthenticationClient({
    domain: 'dev-tyadv4mn38acpd24.us.auth0.com',
    clientId: 'w450yyzWEY1GyCHj8Latq8tNsDZqWGpo',
    clientSecret: 'HA_SE9n3v2zh2L6WRqd4LRx3F2FAXajsWKCbBBRqsmFOK7wKMfDO1BXPMHWJVUra',
});

const uiClient = new UserInfoClient({
    domain: 'dev-tyadv4mn38acpd24.us.auth0.com',
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use( async (req, _, next) => {
    let user = {};
 
    try {
        const token = req.get(AUTHENTICATION_HEADER);
        if (token) {
            const { data } = await uiClient.getUserInfo(token);
            user = data;
        }
    } catch (err) {
        console.log('Authentication error: ' + err);
     }
    req.user = user;
    next();
});

app.get('/', (req, res) => {
    if (req.user.nickname) {
        return res.json(
            req.user
        )
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    sessions.destroy(req, res);
    res.redirect('/');
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const { data } = await authenticationClient.oauth.passwordGrant({
            grantType: 'password',
            username: login,
            password,
            scope: 'offline_access'
        });
        res.json(data).send();
    } catch (err) {
        console.log(err);
        res.status(401).send();
    }
});

app.post('/api/refresh', async (req, res) => {
    const refresh_token = req.get(AUTHENTICATION_HEADER);
    const { data } = await authenticationClient.oauth.refreshTokenGrant({ refresh_token });
    console.log('refresh token: ' + refresh_token);
    res.json(data).send();
});

app.listen(SERVER_PORT, () => {
    console.log(`This app listening on port ${SERVER_PORT}`)
})

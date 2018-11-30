require('dotenv').config();

const constants = require('./config/constants');

const request = require('request-promise');

const DS = require('./server/bot-executions/deliver');
const DeliverySystem = new DS();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.post('/get_message', (req, res) => {
  if (Object.keys(req.body).includes('challenge')) {
    res.send(req.body.challenge);
    return;
  }
  DeliverySystem.eventParser(req.body, true);

  res.sendStatus(202);
});

app.use('/oauth', async (req, res) => {
  const code = req.query.code;
  const oauth_res = await request({
    method: 'POST',
    url: 'https://slack.com/api/oauth.access',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code
    }
  });
  const oauth = JSON.parse(oauth_res);
  if (oauth.error !== undefined) {
    res.sendStatus(403);
    return;
  }
  DeliverySystem.addClient(oauth.team_id, oauth.incoming_webhook.url);
  res.redirect(`https://slack.com/messages/${oauth.incoming_webhook.channel}`);
});

app.listen(constants.PORT, () => {
  console.log(`Server started on port ${constants.PORT}`);
});
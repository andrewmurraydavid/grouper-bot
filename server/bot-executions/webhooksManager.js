const monk = require('monk');


class WebhooksManager {
  static async addWebhook(webhook) {
    const db = monk(process.env.MONGO_URI || '');
    db.then(() => {
      console.log('Connected correctly to server');
    });
    const collection = db.get('webhook');

    if (await collection.count({
        team_id: webhook.team_id
      }) > 0)
      collection.findOneAndUpdate({
        team_id: webhook.team_id
      }, {
        url: webhook.url,
        team_id: webhook.team_id
      });
    else
      collection.insert(webhook)
      .then((docs) => {}).catch((err) => {}).then(() => db.close());
  }

  static async readWebhooks() {
    const db = monk(process.env.MONGO_URI || '');
    db.then(() => {
      console.log('Connected correctly to server');
    });
    const collection = db.get('webhook');
    return await collection.find().then(res => res).then(res => res);
  }

  static async getWebhook(team_id) {
    const db = monk(process.env.MONGO_URI || '');
    db.then(() => {
      console.log('Connected correctly to server');
    });
    const collection = db.get('webhook');
    return (await collection.findOne({
      team_id
    }).then(res => res).then(res => res)).url;
  }
}

module.exports = WebhooksManager;
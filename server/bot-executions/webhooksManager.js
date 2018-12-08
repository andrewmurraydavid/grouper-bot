import monk from "monk";

class WebhooksManager {
  /**
   * Adds a webhook to the db
   * @param {string} webhook
   */
  static async addWebhook(webhook) {
    const db = monk(process.env.MONGO_URI || "");
    db.then(() => {
      console.log("Connected correctly to server");
    });
    const collection = db.get("webhook");

    if (
      (await collection.count({
        team_id: webhook.team_id,
      })) > 0
    )
      collection.findOneAndUpdate(
        {
          team_id: webhook.team_id,
        },
        {
          url: webhook.url,
          team_id: webhook.team_id,
        },
      );
    else
      collection
        .insert(webhook)
        .then(_docs => {})
        .catch(_err => {})
        .then(() => db.close());
  }

  /**
   * Reads all webhooks from the db
   * @returns {[object]}
   */
  static async readWebhooks() {
    const db = monk(process.env.MONGO_URI || "");
    db.then(() => {
      console.log("Connected correctly to server");
    });
    const collection = db.get("webhook");
    return await collection
      .find()
      .then(res => res)
      .then(res => res);
  }

  /**
   * Gets the webhook related to the team id
   * @param {string} team_id
   * @returns {object}
   */
  static async getWebhookByTeamId(team_id) {
    const db = monk(process.env.MONGO_URI || "");
    db.then(() => {
      console.log("Connected correctly to server");
    });
    const collection = db.get("webhook");
    return (await collection
      .findOne({
        team_id,
      })
      .then(res => res)
      .then(res => res)).url;
  }
}

export default WebhooksManager;

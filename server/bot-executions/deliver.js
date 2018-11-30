const request = require('request-promise');
const WebhooksManager = require('./webhooksManager');

class DeliverySystem {
  constructor() {
    this.seenMessages = [];
    this.ts = Math.round((new Date()).getTime() / 1000);
    this.prettifier = [
      ['[done]', ':ballot_box_with_check:'],
      ['[blocked]', ':negative_squared_cross_mark:'],
      ['[wip]', ':male-technologist:']
    ];
    this.fetchWebhooks();
  }

  async fetchWebhooks() {
    this.webhooks = await WebhooksManager.readWebhooks();
  }

  addClient( teamId, webhook ) {
    console.log('New team added: ', teamId);
    WebhooksManager.addWebhook(webhook);
  }

  /**
   * @param {object} body
   */
  async sendMessage(body, teamId) {
    const url = await WebhooksManager.getWebhook(teamId);
    console.log(url);
    request({
      url,
      body: body,
      method: 'POST',
      json: true
    });
  }

  makeThingsPretty(text) {
    this.prettifier.map(item => {
      text = text.replace(`${item[0]}`, `${item[1]}`);
    });
    return text;
  }

  filterBotId(eventObject) {
    eventObject.event.text = eventObject.event.text.replace(`<@${eventObject.authed_users[0]}>`, '');
    return eventObject;
  }

  filterMessage(eventId, eventTs, editedTs) {
    if (!this.seenMessages.includes(eventId) && (this.ts < eventTs || this.ts < editedTs)) {
      this.seenMessages.unshift(eventId);
      return true;
    }
    return false;
  }

  /**
   * @param {string} headerText
   */
  bodyCreator(headerText) {
    const body = {
      mkdwn: true,
      text: `${headerText}`
    };
    return body;
  }

  /**
   * @param {Object} eventObject
   * @param {Boolean} respondDirectly
   */
  eventParser(eventObject, respondDirectly = false) {
    const editedTs = eventObject.event.edited !== undefined ? eventObject.event.edited.ts : 0;
    if (this.filterMessage(eventObject.event_id, eventObject.event_time, editedTs)) {
      console.log(eventObject);
      eventObject = this.filterBotId(eventObject);
      const text = this.makeThingsPretty(eventObject.event.text);
      if (respondDirectly) {
        const body = this.bodyCreator(`<@${eventObject.event.user}> said \n>>> ${text}`);
        this.sendMessage(body, eventObject.team_id);
      }
    }
  }
}

module.exports = DeliverySystem;
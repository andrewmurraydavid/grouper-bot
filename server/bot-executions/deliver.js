import request from "request-promise";
import WebhooksManager from "./webhooksManager";

class DeliverySystem {
  constructor() {
    this.seenMessages = [];
    this.ts = Math.round(new Date().getTime() / 1000);
    this.prettifier = [
      ["[done]", ":ballot_box_with_check:"],
      ["[blocked]", ":negative_squared_cross_mark:"],
      ["[wip]", ":male-technologist:"],
    ];
    this.fetchWebhooks();
  }

  /**
   * Stores the webhooks from the db inside the class
   */
  async fetchWebhooks() {
    this.webhooks = await WebhooksManager.readWebhooks();
  }

  /**
   * Adds a client to the db and keeps in memory
   * @param {string} teamId
   * @param {string} webhook
   */
  addClient(teamId, webhook) {
    WebhooksManager.addWebhook(webhook);
  }

  /**
   * Sends a message to the appropiate channel
   * @param {object} body
   * @param {string} teamId
   */
  async sendMessage(body, teamId) {
    const url = await WebhooksManager.getWebhookByTeamId(teamId);
    request({
      url,
      body: body,
      method: "POST",
      json: true,
    });
  }

  /**
   * Formats the message that needs to be sent
   * @param {string} text
   * @returns {string}
   */
  formatMessage(text) {
    this.prettifier.map(item => {
      text = text.replace(`${item[0]}`, `${item[1]}`);
    });
    return text;
  }

  /**
   * Removes the bot id from the event text
   * @param {object} eventObject
   * @returns {object}
   */
  removeBotId(eventObject) {
    eventObject.event.text = eventObject.event.text.replace(
      `<@${eventObject.authed_users[0]}>`,
      "",
    );
    return eventObject;
  }

  /**
   * Filters messages that have been processed already
   * @param {string} eventId Event Id
   * @param {string} eventTs Event Timestamp
   * @param {string} editedTs Edited Timestamp
   */
  filterSeenMessages(eventId, eventTs, editedTs) {
    if (
      !this.seenMessages.includes(eventId) &&
      (this.ts < eventTs || this.ts < editedTs)
    ) {
      this.seenMessages.unshift(eventId);
      return true;
    }
    return false;
  }

  /**
   * Creates a body for the response
   * @param {string} headerText
   * @returns {object}
   */
  bodyCreator(headerText) {
    const body = {
      mkdwn: true,
      text: `${headerText}`,
    };
    return body;
  }

  /**
   * Parses incoming event
   * @param {Object} eventObject
   * @param {Boolean} respondDirectly
   */
  eventParser(eventObject, respondDirectly = false) {
    const editedTs =
      eventObject.event.edited !== undefined ? eventObject.event.edited.ts : 0;
    if (
      this.filterSeenMessages(
        eventObject.event_id,
        eventObject.event_time,
        editedTs,
      )
    ) {
      eventObject = this.removeBotId(eventObject);
      const text = this.formatMessage(eventObject.event.text);
      if (respondDirectly) {
        const body = this.bodyCreator(
          `<@${eventObject.event.user}> said \n>>> ${text}`,
        );
        this.sendMessage(body, eventObject.team_id);
      }
    }
  }
}

export default DeliverySystem;

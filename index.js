const { App, LogLevel } = require("@slack/bolt");

require("dotenv").config();

const bot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.debug
});

async function publishMessage(id, text, link) {
  try {
    const result = await bot.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      text: text + link
    });
  } catch (error) {
    console.error(error);
  }
}

async function replyMessage(id, ts, msgText) {
  try {
    const result = await bot.client.chat.postMessage({
      token: bot.token,
      channel: id,
      thread_ts: ts,
      text: msgText
    });
  } catch (error) {
    console.error(error);
  }
}

bot.event("app_mention", async ({ event, say, client }) => {
  try {
    // if the bot is tagged under a unique thread and the thread is not by the bot
    if (
      event.thread_ts &&
      event.text.includes("scam") &&
      event.parent_user_id !== "U01G9D4DX9Q"
    ) {
      const channelMsg = `Hey <@${event.parent_user_id}>, Your post has been marked as suspicious.`;

      // call the user out in the same channel
      await say(channelMsg);

      const msgText = `A post by <@${event.parent_user_id}> in <#${event.channel}> was flagged by <@${event.user}> as suspicious. `;
      // grab the link to the particular thread
      const link = await client.chat.getPermalink({
        token: client.token,
        channel: event.channel,
        message_ts: event.thread_ts
      });
      // notify the mod-group
      publishMessage('modmode', msgText, link.permalink);
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
  }
});

bot.event("reaction_added", async ({ event, client }) => {
  if (["scamalert","caution"].includes(event.reaction)) {
    try {
      const msgText =
        `A post by <@${event.item_user}> in <#${event.channel}> was marked by <@${event.user}> as ` +
        `:${event.reaction}:. `;

      const link = await client.chat.getPermalink({
        token: client.token,
        channel: event.item.channel,
        message_ts: event.item.ts
      });

      publishMessage('modmode', msgText, link.permalink);
    } catch (error) {
      console.error(error);
    }
  }
});

// doesn't work yet
bot.command("/scam-alert", async ({ ack, payload, context }) => {
  console.log(payload);
  ack();

  try {
    const result = await bot.client.chat.postMessage({
      token: bot.token,
      channel: payload.channel,
      text:
        "Reminder from Your Friendly Neighborhood ModBot: Please don't give out any login credientials or banking information, exchange money or free labour for opportunities found here or job sites."
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await bot.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();

const { App, LogLevel } = require("@slack/bolt");

require("dotenv").config();
const bot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.debug
});

async function replyMessage(id, ts, msgText) {
  try {
    const result = await bot.client.chat.postMessage({
      // The token you used to initialize your app
      token: bot.token,
      channel: id,
      thread_ts: ts,
      text: msgText
    });

    // Print result
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

bot.event("app_mention", async ({ event, say }) => {
  try {
    if (event.thread_ts && event.text.includes("scam")) {
      const msgText = `Hey <@${event.parent_user_id}>, Your post has been marked as suspicious.`;
      await say(msgText);
      await getPermalink({ event });
      await notifyModChannel(event, msgText );
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
  }
});

// so far, only finds link to parent threads and not individual message replies
const getPermalink = event => {
  let link, messageTime;

  async ({ event, client }) => {
    try {
      const messageLink = bot.client.chat.getPermalink({
        token: bot.token,
        channel: event.channel,
        message_ts: event.thread_ts
      });
      console.log(messageLink);
    } catch (error) {
      console.error(error);
    }
  };
};

const notifyModChannel = ( event, msgText ) => {
  async ({ event, client }) => {
    try {
      client.chat.postMessage({
        token: bot.token,
        channel: event.channel,
        text: msgText,
        block: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: msgText
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Post",
                emoji: true
              },
              value: "click_me_123",
              url: "https://google.com",
              action_id: "button-action"
            }
          }
        ]
      });
    } catch (error) {
      console.error(error);
    }
  };
};

// doesn't work yet
bot.event("reaction_added", async ({ event, client }) => {
  console.log(event);
  if (event.reaction === ("scamalert" | "caution")) {
    try {
      const msgText = `A post by <@${event.parent_user_id}> has been marked as suspicious.`;
      // notifyModChannel( event, msgText );
    } catch (error) {
      console.error(error);
    }
  }
});

bot.command("/scam-alert", async ({ ack, payload, context }) => {
  ack();

  console.log(payload);

  try {
    const result = await bot.client.chat.postMessage({
      token: bot.token,
      channel: payload.channel_id,
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

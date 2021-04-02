const { App, LogLevel } = require("@slack/bolt");

require("dotenv").config();

const bot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.debug
});

async function publishMessage(id, text, link) {
  const messageContent = link ? text + link : text;
  try {
    const result = await bot.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      text: messageContent
    });
    await bot.client.ack();
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
    await bot.client.ack();
  } catch (error) {
    console.error(error);
  }
}

const keywords = ["scam", "spam", "upwork"];

bot.event("app_mention", async ({ event, client, ack }) => {
  try {
    // if the bot is tagged under a unique thread and the thread is not by the bot
    if (
      event.thread_ts &&
      keywords.some(key => event.text.includes(key)) &&
      event.parent_user_id !== "U01G9D4DX9Q"
    ) {
      const channelMsg = `Hey <@${event.parent_user_id}>, Your post has been marked as suspicious.`;

      // call the user out in the same channel
      await publishMessage(event.channel, channelMsg);

      const msgText = `A post by <@${event.parent_user_id}> in <#${event.item.channel}> was flagged by <@${event.user}> as suspicious. `;
      // grab the link to the particular thread
      const link = await client.chat.getPermalink({
        token: client.token,
        channel: event.item.channel,
        message_ts: event.thread_ts
      });
      // notify the mod-group
      await publishMessage("modmode", msgText, link.permalink);
      await ack();
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
  }
});

bot.event("reaction_added", async ({ event, client, ack }) => {
  if (["scamalert", "spam", "caution", "warning"].includes(event.reaction)) {
    try {
      const msgText =
        `A post by <@${event.item_user}> in <#${event.item.channel}> was marked by <@${event.user}> as ` +
        `:${event.reaction}:. `;

      const link = await client.chat.getPermalink({
        token: client.token,
        channel: event.item.channel,
        message_ts: event.item.ts
      });

      await publishMessage("modmode", msgText, link.permalink);
      await ack();
    } catch (error) {
      console.error(error);
    }
  }
});

bot.event("app_home_opened", async ({ event, client, context, ack }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({
      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: "home",
        callback_id: "home_view",

        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "* Hello from the TorontoJS Mod Team* :wave:"
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "For the newer members or jobhunting folks, we want to remind you: please *DON'T* give any online account info, banking info or exchange money or free labour for an opportunity found here or on job sites. There has been recent incidents of posts with <https://www.nbcnews.com/tech/security/people-who-turned-upwork-find-freelance-gigs-say-they-were-n1218421|Upwork scams>. /n Are you interested with helping with moderation? Please DM any one of our mod team: <@U064DUE83> <@U0649BLTD> <@U46FDJR0Q> <@U1R5J2XP1> <@U35MY02TY> <@U064DT78R>"
            }
          }
        ]
      }
    });
    await ack();
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await bot.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();

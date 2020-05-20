#!/usr/bin/env node

// Channel ID is on the the browser URL.: https://mycompany.slack.com/messages/MYCHANNELID/
// Pass it as a parameter: node ./delete-slack-messages.js CHANNEL_ID

// CONFIGURATION #######################################################################################################

const token = process.env.SLACK_TOKEN; // You can learn it from: https://api.slack.com/custom-integrations/legacy-tokens

// VALIDATION ##########################################################################################################

if (token === 'SLACK TOKEN') {
  console.error('Token seems incorrect. Please open the file with an editor and modify the token variable.');
}

// #news channel
let channel = process.env.SLACK_CHANNEL_ID;

if (process.argv[0].indexOf('node') !== -1 && process.argv.length > 2) {
  channel = process.argv[2];
} else if (process.argv.length > 1) {
  channel = process.argv[1];
} else {
  console.log('Usage: node ./delete-slack-messages.js CHANNEL_ID');
  process.exit(1);
}

// GLOBALS #############################################################################################################

const dt = new Date();
dt.setDate(dt.getDate() - 1);
const unixtime = Math.floor(dt.getTime() / 1000);

const https = require('https');
const baseApiUrl = 'https://slack.com/api/';
const historyApiUrl = `${baseApiUrl}conversations.history?token=${token}&channel=${channel}&count=1000&latest=${unixtime}&cursor=`;
const deleteApiUrl = `${baseApiUrl}chat.delete?token=${token}&channel=${channel}&ts=`;
const repliesApiUrl = `${baseApiUrl}conversations.replies?token=${token}&channel=${channel}&ts=`;
let delay = 300; // Delay between delete operations in milliseconds

// ---------------------------------------------------------------------------------------------------------------------

const sleep = (delay) => new Promise((r) => setTimeout(r, delay));
const get = (url) =>
  new Promise((resolve, reject) =>
    https
      .get(url, (res) => {
        let body = '';

        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(JSON.parse(body)));
      })
      .on('error', reject)
  );

// ---------------------------------------------------------------------------------------------------------------------

async function deleteMessages(threadTs, messages) {
  if (messages.length == 0) {
    return;
  }

  const message = messages.shift();

  if (message.thread_ts !== threadTs) {
    await fetchAndDeleteMessages(message.thread_ts, ''); // Fetching replies, it will delete main message as well.
  } else {
    const response = await get(deleteApiUrl + message.ts);

    //console.log(response);

    if (response.ok === true) {
      console.log(new Date(message.ts * 1000) + (threadTs ? ' reply' : '') + ' deleted!');
    } else if (response.ok === false) {
      console.log(new Date(message.ts * 1000) + ' could not be deleted! (' + response.error + ')');

      if (response.error === 'ratelimited') {
        await sleep(1000);
        delay += 100; // If rate limited error caught then we need to increase delay.
        messages.unshift(message);
      }
    }
  }

  await sleep(delay);
  await deleteMessages(threadTs, messages);
}

// ---------------------------------------------------------------------------------------------------------------------

async function fetchAndDeleteMessages(threadTs, cursor) {
  const response = await get((threadTs ? repliesApiUrl + threadTs + '&cursor=' : historyApiUrl) + cursor);

  //console.log(response);

  if (!response.messages || response.messages.length === 0) {
    return;
  }

  await deleteMessages(threadTs, response.messages);

  if (response.has_more) {
    await fetchAndDeleteMessages(threadTs, response.response_metadata.next_cursor);
  }
}

// ---------------------------------------------------------------------------------------------------------------------

fetchAndDeleteMessages(null, '');

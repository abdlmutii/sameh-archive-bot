const TelegramBot = require('node-telegram-bot-api');
const { startUptime } = require("repl.uptime");
//const fetch = require("node-fetch");
startUptime();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const { Database } = require('st.db');
const db = new Database("database.json");
const ows = [
  'MuhammedSameh', // Bot Owner
  'abdlmutii', // Dev
  'abdlmuti' // Dev
]
async function joined(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const channelUsername = '@Saicohat';

  try {
    const chatMember = await bot.getChatMember(channelUsername, userId);
    if (chatMember.status !== 'member' && chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
      bot.sendMessage(chatId, 'لازم تتاكد انك في القناة ' + channelUsername);
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error(error);
   // bot.sendMessage(chatId, 'An error occurred while checking channel membership.');
    return true;
  }
}

bot.onText(/\/start/, async(msg) => {
  if(await joined(msg)) {
     if(ows.includes(msg.from.username)) {
     await  bot.sendMessage(msg.chat.id, `السلام عليكم، دي الاوامر الادارية الي هتحتاجها في البوت:\n\n/newarticle - بتعمل مقالة جديدة\nالايتعمال: /newarticle [اسم المقالة]\n[المحتوى]\n\n/rmvarticle - بتحذف مقالة\nالاستعمال: /rmvarticle [اسم المقالة]\n\n/add_button - بيضيف زرار\nالاستعمال: /add_button [اسم الزر]\n[اللينك]\n\n/st_message - بيعدل رسالا الدخول\nالاستعمال: /st_message [المحتوى]\n\n/newsection - بتعمل قسم جديد زي مقالات تريكات الخ.\nالاستعمال: /newsection [الاسم]\n\n/rmvsection - بتحذف قسم\nالاستعمال: /rmvsection [الاسم]`);
    }
     let scts = await db.get("sections");
     let kbrd = scts.reduce((acc, item, index) => {
    if (index % 2 === 0) {
      acc.push([item.text]);
    } else {
      acc[acc.length - 1].push(item.text);
    }
  return acc;
}, []);
   await bot.sendMessage(msg.chat.id, "..", {
        reply_markup: JSON.stringify({
        keyboard: kbrd,
      })
    });
     await bot.sendMessage(msg.chat.id, db.get("start_msg") || "نورت في ارشيف سامح!", {
        reply_markup: JSON.stringify({
        inline_keyboard: db.get("buttons")
      })
    });
  }
})

bot.onText(/\/newsection (.+)/, async(msg, args) => {
   if(ows.includes(msg.from.username)) {
    let scts = await db.get("sections");
    scts.push({ text: args[1], articles: [] });
    db.set("sections", scts);
    bot.sendMessage(msg.chat.id, "انا عملت القسم " + args[1]);
  } else {
    bot.sendMessage(msg.chat.id, "هو ده سامح؟");
  }
})

let oldmsg;
bot.onText(/\/newarticle (.+)/, async(msg, args) => {
  if(!ows.includes(msg.from.username)) return;
   oldmsg = msg;
   let scts = await db.get("sections");
   let butts = [];
  scts.forEach(d => {
  let dob = {
    text: d.text,
    callback_data: d.text
  };
  butts.push([dob]);
});
     bot.sendMessage(msg.chat.id, "عايز تعمل مقالة في اي قسم؟", {
        reply_markup: JSON.stringify({
        inline_keyboard: butts
      })
    });
});

bot.on('callback_query', function onCallbackQuery(cb) {
  let msg = cb.message;
  
  let opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id
  };

  let sc = db.get(`sections`);
  if(sc.some(g => g.text === cb.data)) {
   let obj = sc.find(g => g.text === cb.data);
   obj = obj.articles.push({title: oldmsg.text.replaceAll("/newarticle ", "").split("\n")[0], text: oldmsg.text.replaceAll("/newarticle ", "")});
   db.set("sections", sc);
  let kbrd = db.get("sections").reduce((acc, item, index) => {
    if (index % 2 === 0) {
      acc.push([item.text]);
    } else {
      acc[acc.length - 1].push(item.text);
    } 
  return acc;
}, []);
       kbrd[kbrd.length - 1].push("Main menu");

    opts.keyboard = kbrd;
  bot.editMessageText("تموالنشر", opts);
  } else {
    bot.sendMessage(msg.chat.id, "مش لاقي المقالة دي.");
  }
});

bot.on("message", async msg => {
  if(msg.entities || await joined(msg) === false) return;
  
  let a = await db.get("sections");
  const foundObject = a.find(item => item.text === msg.text) || a.find(item =>
  item.articles.findIndex(article => article.title === msg.text) !== -1);

if (foundObject) {
  if (foundObject.text === msg.text) {
    let kbrdarr = foundObject.articles;
     if(!foundObject.articles[0]) return bot.sendMessage(msg.chat.id, foundObject.text);
     let kbrd = kbrdarr.reduce((acc, item, index) => {
    if (index % 2 === 0) {
      acc.push([item.title]);
    } else {
      acc[acc.length - 1].push(item.title);
    } 
  return acc;
}, []);
       kbrd[kbrd.length - 1].push("Main menu");
     bot.sendMessage(msg.chat.id, "اختر المقالة", {
        reply_markup: JSON.stringify({
        keyboard: kbrd
      })
    });
  } else {
    let artcle = foundObject.articles.find(j => j.title === msg.text)
    if(!artcle) return bot.sendMessage(msg.chat.id, "مش لاقي المقالة");
    bot.sendMessage(msg.chat.id, artcle.text.replace(artcle.title, "") || artcle.title);
  }
} else {
  if(msg.text.includes("Main menu")) {
      let scts = await db.get("sections");
     let kbrd = scts.reduce((acc, item, index) => {
    if (index % 2 === 0) {
      acc.push([item.text]);
    } else {
      acc[acc.length - 1].push(item.text);
    }
  return acc;
}, []);
     bot.sendMessage(msg.chat.id, db.get("start_msg") || "نورت في ارشيف سامح!", {
        reply_markup: JSON.stringify({
        keyboard: kbrd
      })
    });
    } else {
    bot.sendMessage(msg.chat.id, "مش لاقي المقالة دي");
    }
}
})

bot.onText(/\/st_message (.+)/, async(m, a) => {
  if(!ows.includes(m.from.username)) return;
  db.set("start_msg", a[1]);
  bot.sendMessage(m.chat.id, "تم تفيير الرسالة");
})

bot.onText(/\/add_button (.+)/, (m) => {
  if(!ows.includes(m.from.username)) return;
  let ar = m.text.replace("/add_button ", "").split("\n");
  let but = db.get("buttons") || [];
  but.push([{ text: ar[0], url: ar[1] }])
  db.set("buttons", but);
  bot.sendMessage(m.chat.id, "تم اضافة الزرار");
})

bot.onText(/\/rmvarticle (.+)/, async(msg, args) => {
  if(!ows.includes(msg.from.username)) return;
   let scts = await db.get("sections");
   scts = scts.map(item => { if (Array.isArray(item.articles)) { item.articles = item.articles.filter(article => article.title !== args[1]); } return item; });
    db.set("sections", scts);
     bot.sendMessage(msg.chat.id, "تم الحذف");
});

bot.onText(/\/rmvsection (.+)/, async(m, a) => {
  if(!ows.includes(m.from.username)) return;
  let scts = await db.get("sections");
  scts = scts.filter(sec => sec.text !== a[1]);
  db.set("sections", scts);
  bot.sendMessage(m.chat.id, "تم الحذف");
})

bot.on("polling_error", console.log);
    
setInterval(async() => {
  await fetch("https://SamehArchive00.thatdevicec26.repl.co");
}, 180000)
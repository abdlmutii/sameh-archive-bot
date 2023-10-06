const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const { Database } = require('st.db');
const db = new Database("database.json");

async function joined(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const channelUsername = '@technewwz';

  try {
    const chatMember = await bot.getChatMember(channelUsername, userId);
    if (chatMember.status !== 'member' && chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
      bot.sendMessage(chatId, 'لازم تخش الشانل الاول يا نجم ' + channelUsername);
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'An error occurred while checking channel membership.');
  }
}

bot.onText(/\/start/, async(msg) => {
  if(await joined(msg)) {
     if(msg.from.username === "MuhammedSameh") {
      bot.sendMessage(msg.chat.id, `السللم عليكم، دي الاوامر الادارية الي هتحتاجها في البوت:\n\n/newarticle - بتعمل مقالة جديدة\nالايتعمال: /newarticle [اسم المقالة]\n[المحتوى]\n\n/rmvarticle - بتحذف مقالة\nالاستعمال: /rmvarticle[اسم المقالة]\n\n/add_button - بيضيف زرار\nالاستعمال: /add_button[اسم الزر]\n[اللينك]\n\n/start_message - بيعدل رسالا الدخول\nالاستعمال: /start_message[المحتوى]`)
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
     bot.sendMessage(msg.chat.id, db.get("start_msg") || "نورت في اىشيف سامح!", {
        reply_markup: JSON.stringify({
        keyboard: kbrd,
        inline_keyboard: db.get("buttons")
      })
    });
  }
})

bot.onText(/\/newsection (.+)/, async(msg, args) => {
   if(msg.from.username === "MuhammedSameh") {
    let scts = await db.get("sections");
    scts.push({ text: args[1], articles: [] });
    console.log(scts)
    db.set("sections", scts);
    bot.sendMessage(msg.chat.id, "انا عملت القسم " + args[1]);
  } else {
    bot.sendMessage(msg.chat.id, "هو ده سامح؟");
  }
})

let oldmsg;
bot.onText(/\/newarticle (.+)/, async(msg, args) => {
  if(msg.from.username !== "MuhammedSameh") return;
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
     // console.log(kbrdarr)
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
    bot.sendMessage(msg.chat.id, artcle.text);
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
     bot.sendMessage(msg.chat.id, "نورت في اىشيف سامح!", {
        reply_markup: JSON.stringify({
        keyboard: kbrd
      })
    });
    } else {
    bot.sendMessage(msg.chat.id, "مش لاقي المقالة دي");
    }
}
})

bot.onText(/\/start_message (.+)/, async(m, a) => {
  db.set("start_msg", a[1]);
  bot.sendMessage(m.chat.id, "تم تفيير الرسالة");
})

bot.onText(/\/add_button (.+)/, (m) => {
  let ar = m.text.replace("/add_button ").split("\n");
  let but = db.get("buttons");
  but.push([{ text: ar[0], url: ar[1] }])
  db.set("buttons", but);
  bot.sendMessage(m.chat.id, "تم اضافة الزرار");
})

bot.onText(/\/rmvarticle (.+)/, async(msg, args) => {
  if(msg.from.username !== "MuhammedSameh") return;
   let scts = await db.get("sections");
   scts.articles = scts.articles.filter(obj => obj.title !== args[1]);
    db.set("sections", scts);
     bot.sendMessage(msg.chat.id, "تم الحذف");
});

bot.on("polling_error", console.log);

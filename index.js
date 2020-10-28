const config = require('./config.json');
const fetch = require('node-fetch');

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', (message) => {
    const chatId = message.chat.id;
    if(!message.text.startsWith(config.prefix) || message.from.is_bot) return;
    if(!config.allowedUsers.includes(message.from.id)) return;
    
    const args = message.text.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if(command == "help") {
        let text = [
            `Ой, п-привет, ${message.from.first_name}! Вот что я умею:`,
            `• ${config.prefix + "links"} | ${config.linkshaper.uri}/auth`,
            `• ${config.prefix + "short"} <код/"random"> <ссылка> | Сократить обычную дырнет-ссылку [без кода/с кодом]`,
            `• ${config.prefix + "code"} <код> | Просмотр информации о коде сокращённой ссылки`,
            `• ${config.prefix + "delete"} <код> | Удалить ссылку из базы`,
            ``,
            `Linkshaper API URI: ${config.linkshaper.uri}`
        ];

        return bot.sendMessage(chatId, text.join("\n"));
    }

    if(command == "links") return bot.sendMessage(chatId, `Все ссылки находятся тут: ${config.linkshaper.uri}/auth`);
    if(command == "short") {
        let code = args[0];
        if(!code) return bot.sendMessage(chatId, `❌ Не указан код короткой ссылки`);
        if(code == "random") code = makeid(6);

        let link = args.slice(1).join(" ");
        if(!link) return bot.sendMessage(chatId, `❌ Не указана ссылка`);

        return fetch( encodeURI(`${config.linkshaper.uri}/api/create?code=${code}&link=${link}&access_token=${config.linkshaper.token}`) )
            .then(r => r.json())
            .then(r => bot.sendMessage(chatId, (r.created && r.created == true) ? `✅ Ссылка создана!\n${config.linkshaper.uri}/${code}` : `❌ Неизвестная ошибка\n${JSON.stringify(r)}`))
            .catch(e => {
                console.error(e.stack);
                return bot.sendMessage(chatId, `❌ Ошибка ${e.code}`);
            });
    }

    if(command == "code") {
        let code = args[0];
        if(!code) return bot.sendMessage(chatId, `❌ Не указан код короткой ссылки`);
        
        return fetch( encodeURI(`${config.linkshaper.uri}/api/code?code=${code}&access_token=${config.linkshaper.token}`) )
            .then(r => r.json())
            .then(r => bot.sendMessage(chatId, (!r.error) ? [
                `ID в базе: ${r.id}`,
                `Код: ${r.code} | ${config.linkshaper.uri}/${r.code}`,
                `Оригинальная ссылка: ${r.link}`,
                `Дата создания: ${r.createdAt}`,
                `Кликов: ${r.clicks}`,
                `Владелец ссылки: [Discord ID] ${r.owner}`,
                `Возможно удаление?: ${(r.isDeletable == true) ? `✅` : `❌`}`
            ].join("\n") : `❌ Неизвестная ошибка\n${JSON.stringify(r)}`))
            .catch(e => {
                console.error(e.stack);
                return bot.sendMessage(chatId, `❌ Ошибка ${e.code}`);
            });
    }

    if(command == "delete") {
        let code = args[0];
        if(!code) return bot.sendMessage(chatId, `❌ Не указан код короткой ссылки`);
        
        return fetch( encodeURI(`${config.linkshaper.uri}/api/delete?code=${code}&access_token=${config.linkshaper.token}`) )
            .then(r => r.json())
            .then(r => bot.sendMessage(chatId, (!r.error) ? `✅ Ссылка удалена.` : `❌ Неизвестная ошибка\n${JSON.stringify(r)}`))
            .catch(e => {
                console.error(e.stack);
                return bot.sendMessage(chatId, `❌ Ошибка ${e.code}`);
            });
    }
});
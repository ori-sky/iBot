var iBot = require('./iBot.js');
var ctx = new iBot.Context();

ctx.servers['dv'] = new iBot.Server('irc.dreamviews.com', 6667, 'iBot^^', 'iBot', true);
ctx.servers['dv'].loadModule('core');

ctx.servers['pony'] = new iBot.Server('irc.ponychat.net', 6667, 'iBot', 'iBot', false);
ctx.servers['pony'].loadModule('core');

ctx.start();

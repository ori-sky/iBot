var iBot = require('./iBot.js');
var ctx = new iBot.Context();

ctx.servers['dv'] = new iBot.Server('irc.dreamviews.com', 6667, 'iBot^^', 'iBot', true);
ctx.servers['dv'].loadModule('core');

ctx.start();

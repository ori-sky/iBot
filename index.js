var path = require('path');

var Context = require('iBot-Context').Context;
var Server = require('iBot-Server').Server;

var ctx = new Context(
{
	modulesPath: path.resolve('./modules/')
});

ctx.servers['dv'] = new Server(ctx, 'irc.dreamviews.com', 6667, 'iBot^^', 'iBot', true);
ctx.servers['dv'].master = /.+!.+@staff\.dreamviews\.com/;

ctx.servers['pony'] = new Server(ctx, 'irc.ponychat.net', 6667, 'iBot', 'iBot', false);
ctx.servers['pony'].master = /.+!.+@shockk\.pony/;

ctx.loadModule('core', null);

ctx.start();

exports.mod = function(ctx)
{
	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'hellohook')
		{
			server.send('PRIVMSG ' + target + ' :world!');
			server.do('log', 'logTargets', server, 'sent msg `world!`');
		}
	}
}

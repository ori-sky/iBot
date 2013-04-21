exports.mod = function(ctx)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		if(words[0] === '!hellohook')
		{
			server.send('PRIVMSG ' + target + ' :world!');
		}
	}
}

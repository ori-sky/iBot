exports.mod = function(context)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		if(words[0] === '!raw')
		{
			if(server.master.test(prefix.mask))
			{
				server.send(words.slice(1).join(' '));
			}
		}
	}
}

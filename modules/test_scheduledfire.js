exports.mod = function(context)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		if(words[0] === '!scheduledfire')
		{
			server.scheduleFire(words[1], 'test', server, target);
		}
	}

	this.test_scheduledfire$test = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :fired!');
	}
}

exports.mod = function(context)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		switch(words[0])
		{
			case '!firetimed':
				server.fireTimed(words[1], words[2], 'test', server, target);
				break;
			case '!firecancel':
				server.fireCancel(words[1]);
				break;
			case '!firechange':
				server.fireChange(words[1], words[2]);
				break;
		}
	}

	this.test_firetimed$test = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :fired!');
	}
}

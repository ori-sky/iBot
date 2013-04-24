exports.mod = function(context)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		switch(words[0])
		{
			case '!raw':
				if(server.master.test(prefix.mask))
				{
					server.fire('raw', server, words.slice(1).join(' '));
				}
				break;
			case '!rawtimed':
				if(server.master.test(prefix.mask))
				{
					server.fireTimed(words[1], undefined, 'raw', server, words.slice(2).join(' '));
				}
				break;
		}

	}

	this.raw$raw = function(server, data)
	{
		server.send(data);
	}
}

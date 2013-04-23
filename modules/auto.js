exports.mod = function(context)
{
	this.channels = {};

	this.core$privmsg = function(server, prefix, target, message, words)
	{
		if(words[0] === '!auto')
		{
			switch(words[1])
			{
				case 'join':
					server.fire('join', server, prefix, target, words[2], words[3]);
					break;
			}
		}
	}

	this.core$376 = function(server, prefix, message)
	{
		for(var kChannel in this.channels)
		{
			server.send('JOIN ' + kChannel);
		}
	}

	this.auto$join = function(server, prefix, target, opcode, channel)
	{
		if(server.master.test(prefix.mask))
		{
			switch(opcode)
			{
				case '+':
					if(typeof this.channels[channel] === 'undefined')
					{
						this.channels[channel] = true;
					}

					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '-':
					if(typeof this.channels[channel] !== 'undefined')
					{
						delete this.channels[channel];
					}

					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '?':
					server.send('PRIVMSG ' + target + ' :Auto channels: ' + Object.keys(this.channels).join(', '));
					break;
			}
		}
	}
}

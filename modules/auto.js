exports.mod = function(context)
{
	this.channels = {};

	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'auto')
		{
			switch(params[0])
			{
				case 'join':
					server.fire('join', server, prefix, target, params[1], params[2]);
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

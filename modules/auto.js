exports.mod = function(context)
{
	this.join = {};

	this._data = function(data)
	{
		if(data.join !== undefined)
		{
			for(var kJoin in data.join)
			{
				this.join[data.join[kJoin]] = true;
			}
		}
	}

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
		for(var kChannel in this.join)
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
					if(typeof this.join[channel] === 'undefined')
					{
						this.join[channel] = true;
					}

					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '-':
					if(typeof this.join[channel] !== 'undefined')
					{
						delete this.join[channel];
					}

					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '?':
					server.send('PRIVMSG ' + target + ' :Auto channels: ' + Object.keys(this.join).join(', '));
					break;
			}
		}
	}
}

exports.mod = function(context)
{
	this.recv = function(server, prefix, opcode, params)
	{
		switch(opcode)
		{
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				switch(words[0])
				{
					case '!test':
						server.send('PRIVMSG ' + target + ' :test');
						break;
					case '!hello':
						server.send('PRIVMSG ' + target + ' :hello');
						break;
				}
				break;
		}
	}

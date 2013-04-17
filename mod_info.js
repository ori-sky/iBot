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
					case '!channels':
						if(typeof words[1] === 'undefined')
						{
							server.send('PRIVMSG ' + target + ' :Channels: ' + Object.keys(server.user.channels).join(', '));
						}
						else
						{
							server.send('PRIVMSG ' + target + ' :Channels: ' + Object.keys(server.users[words[1]].channels).join(', '));
						}
						break;
					case '!isupport':
						server.send('PRIVMSG ' + target + ' :ISUPPORT: ' + words[1] + ' = ' + server.isupport[words[1]]);
						break;
					case '!identof':
						server.send('PRIVMSG ' + target + ' :Ident of ' + words[1] + ' = ' + server.users[words[1]].ident);
						break;
					case '!hostof':
						server.send('PRIVMSG ' + target + ' :Host of ' + words[1] + ' = ' + server.users[words[1]].host);
						break;
				}
				break;
		}
	}
}

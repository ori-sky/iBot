exports.mod = function(context)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		switch(words[0])
		{
			case '!channels':
				var k;
				if(typeof words[1] === 'undefined')
				{
					k = Object.keys(server.user.channels);
				}
				else
				{
					k = Object.keys(server.users[words[1]].channels);
				}

				server.send('PRIVMSG ' + target + ' :Channels: ' + k.join(', '));
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
	}

	this.core$mode = function(server, prefix, channel, state, modechar, param)
	{
		server.send('PRIVMSG ' + channel + ' :Mode change detected: ' + (state ? '+' : '-') + modechar + ' ' + param);
	}
}

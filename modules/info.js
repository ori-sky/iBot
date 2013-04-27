exports.mod = function(context)
{
	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'channels':
				var k;
				if(typeof params[0] === 'undefined')
				{
					k = Object.keys(server.user.channels);
				}
				else
				{
					k = Object.keys(server.users[params[0]].channels);
				}

				server.send('PRIVMSG ' + target + ' :Channels: ' + k.join(', '));
				break;
			case 'myinfo':
				server.send('PRIVMSG ' + target + ' :MYINFO: ' + params[0] + ' = ' + server.get('core').myinfo[params[0]]);
				break;
			case 'isupport':
				server.send('PRIVMSG ' + target + ' :ISUPPORT: ' + params[0] + ' = ' + server.get('core').isupport[params[0]]);
				break;
			case 'identof':
				server.send('PRIVMSG ' + target + ' :Ident of ' + params[0] + ' = ' + server.users[params[0]].ident);
				break;
			case 'hostof':
				server.send('PRIVMSG ' + target + ' :Host of ' + params[0] + ' = ' + server.users[params[0]].host);
				break;

		}
	}

	this.core$mode = function(server, prefix, channel, state, modechar, param)
	{
		server.send('PRIVMSG ' + channel + ' :Mode change detected: ' + (state ? '+' : '-') + modechar + ' ' + param);
	}
}

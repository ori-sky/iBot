var User = require('../iBot-User');
var Channel = require('../iBot-Channel');

exports.mod = function(context)
{
	this.recv = function(server, prefix, opcode, params)
	{
		switch(opcode)
		{
			case 'PING':
				server.fire('ping', server, prefix, params[0]);
				server.send('PONG :' + params[0]);
				break;
			case 'PONG':
				server.fire('pong', server, prefix, params[0], params[1]);
				server.ponged = true;
				break;
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				server.fire('privmsg', server, prefix, target, params[1], words);
				break;
			case '005': // RPL_ISUPPORT
				server.fire('005', server, prefix, params.slice(1, params.length - 1), params[params.length - 1]);
				break;
			case '353': // RPL_NAMREPLY
				server.fire('353', server, prefix, params[1], params[2], params[3].split(' '));
				break;
			case 'JOIN':
				server.fire('join', server, prefix, params[0]);
				break;
			case 'NICK':
				server.fire('nick', server, prefix, nick);
				break;
			case 'QUIT':
				server.fire('quit', server, prefix, params[0]);
				break;
			case 'PART':
				server.fire('part', server, prefix, params[0], params[1]);
				break;
			case 'KICK':
				server.fire('kick', server, prefix, params[0], params[1], params[2]);
				break;
		}
	}

	this.core$privmsg = function(server, prefix, target, message, words)
	{
		switch(words[0])
		{
			case '!lmsrv':
				if(server.master.test(prefix.mask))
				{
					var result = context.loadModule(words[1], server);
					if(result !== '')
					{
						server.send('PRIVMSG ' + target + ' :' + result);
					}
					else
					{
						server.send('PRIVMSG ' + target + ' :done');
					}
				}
				break;
			case '!lmctx':
				if(server.master.test(prefix.mask))
				{
					var result = context.loadModule(words[1]);
					if(result !== '')
					{
						server.send('PRIVMSG ' + target + ' :' + result);
					}
					else
					{
						server.send('PRIVMSG ' + target + ' :done');
					}
				}
				break;
			case '!umsrv':
				if(server.master.test(prefix.mask))
				{
					context.unloadModule(words[1], server);
					server.send('PRIVMSG ' + target + ' :done');
				}
				break;
			case '!umctx':
				if(server.master.test(prefix.mask))
				{
					context.unloadModule(words[1], null);
					server.send('PRIVMSG ' + target + ' :done');
				}
				break;
			case '!modules':
				server.send('PRIVMSG ' + target + ' :Modules: ' + server.getModules(', '));
				break;
		}
	}

	this.core$005 = function(server, prefix, options, message)
	{
		for(var i=0; i<options.length; ++i)
		{
			var parts = options[i].split('=');
			if(typeof parts[1] === 'undefined') parts[1] = '';
			server.isupport[parts[0]] = parts[1];
		}
	}

	this.core$353 = function(server, prefix, channelPrefix, channel, names)
	{
		var split1 = server.isupport.PREFIX.split(')');
		var split2 = split1[0].split('(');

		for(var i=0; i<names.length; ++i)
		{
			if(split1[1].indexOf(names[i][0]) !== -1)
			{
				names[i] = names[i].substr(1);
			}

			if(typeof server.users[names[i]] === 'undefined')
			{
				server.users[names[i]] = new User(names[i], null, null, null);
			}

			server.users[names[i]].channels[channel] = server.channels[channel];
			server.channels[channel].users[names[i]] = server.users[names[i]];
		}

		server.send('WHO ' + channel);
	}

	this.core$join = function(server, prefix, channel)
	{
		
		if(typeof server.users[prefix.nick] === 'undefined')
		{
			server.users[prefix.nick] = new User(prefix.nick, prefix.ident, prefix.host, null);
		}

		if(typeof server.channels[channel] === 'undefined')
		{
			server.channels[channel] = new Channel(channel);
		}

		server.users[prefix.nick].channels[channel] = server.channels[channel];
		server.channels[channel].users[prefix.nick] = server.users[prefix.nick];
	}

	this.core$nick = function(server, prefix, nick)
	{
		server.users[nick] = server.users[prefix.nick];
		server.users[nick].nick = nick;
		delete server.users[prefix.nick];
	}

	this.core$quit = function(server, prefix, message)
	{
		if(typeof server.users[prefix.nick] !== 'undefined')
		{
			delete server.users[prefix.nick];
		}

		for(var kChannel in server.channels)
		{
			if(typeof server.channels[kChannel].users[prefix.nick] !== 'undefined')
			{
				delete server.channels[kChannel].users[prefix.nick];
			}
		}
	}

	this.core$part = function(server, prefix, channel, message)
	{
		if(typeof server.users[prefix.nick] !== 'undefined')
		{
			delete server.users[prefix.nick].channels[channel];

			if(server.users[prefix.nick] !== server.user && Object.keys(server.users[prefix.nick].channels).length === 0)
			{
				delete server.users[prefix.nick];
			}
		}

		if(typeof server.channels[channel] !== 'undefined')
		{
			delete server.channels[channel].users[prefix.nick];

			if(server.users[prefix.nick] === server.user)
			{
				delete server.channels[channel];
			}
		}
	}

	this.core$kick = function(server, prefix, channel, target, message)
	{
		if(typeof server.users[target] !== 'undefined')
		{
			delete server.users[target].channels[channel];

			if(server.users[target] !== server.user && Object.keys(server.users[target].channels).length === 0)
			{
				delete server.users[target];
			}
		}

		if(typeof server.channels[channel] !== 'undefined')
		{
			delete server.channels[channel].users[channel];

			if(server.users[target] === server.user)
			{
				delete server.channels[channel];
			}
		}
	}
}

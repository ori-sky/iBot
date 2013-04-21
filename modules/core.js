var User = require('../iBot-User');
var Channel = require('../iBot-Channel');

exports.mod = function(context)
{
	this.recv = function(server, prefix, opcode, params)
	{
		switch(opcode)
		{
			case 'PING':
				server.send('PONG :' + params[0]);
				break;
			case 'PONG':
				server.ponged = true;
				break;
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				server.fire('privmsg', server, prefix, target, params[1], words);

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
				break;
			case '005': // RPL_ISUPPORT
				for(var i=1; i<params.length-1; ++i)
				{
					var parts = params[i].split('=');
					if(typeof parts[1] === 'undefined') parts[1] = '';
					server.isupport[parts[0]] = parts[1];
				}
				break;
			case '353': // RPL_NAMREPLY
				var words = params[3].split(' ');

				var split1 = server.isupport.PREFIX.split(')');
				var split2 = split1[0].split('(');

				for(var i=0; i<words.length; ++i)
				{
					if(split1[1].indexOf(words[i][0]) !== -1)
					{
						words[i] = words[i].substr(1);
					}

					if(typeof server.users[words[i]] === 'undefined')
					{
						server.users[words[i]] = new User(words[i], null, null, null);
					}

					server.users[words[i]].channels[params[2]] = server.channels[params[2]];
					server.channels[params[2]].users[words[i]] = server.users[words[i]];
				}

				server.send('WHO ' + params[2]);

				break;
			case 'JOIN':
				if(typeof server.users[prefix.nick] === 'undefined')
				{
					server.users[prefix.nick] = new User(prefix.nick, prefix.ident, prefix.host, null);
				}

				if(typeof server.channels[params[0]] === 'undefined')
				{
					server.channels[params[0]] = new Channel(params[0]);
				}

				server.users[prefix.nick].channels[params[0]] = server.channels[params[0]];
				server.channels[params[0]].users[prefix.nick] = server.users[prefix.nick];

				break;
			case 'NICK':
				server.users[params[0]] = server.users[prefix.nick];
				server.users[params[0]].nick = params[0];
				delete server.users[prefix.nick];
				break;
			case 'QUIT':
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
				break;
			case 'PART':
				if(typeof server.users[prefix.nick] !== 'undefined')
				{
					delete server.users[prefix.nick].channels[params[0]];

					if(server.users[prefix.nick] !== server.user && Object.keys(server.users[prefix.nick].channels).length === 0)
					{
						delete server.users[prefix.nick];
					}
				}

				if(typeof server.channels[params[0]] !== 'undefined')
				{
					delete server.channels[params[0]].users[prefix.nick];

					if(server.users[prefix.nick] === server.user)
					{
						delete server.channels[params[0]];
					}
				}

				break;
			case 'KICK':
				if(typeof server.users[params[1]] !== 'undefined')
				{
					delete server.users[params[1]].channels[params[0]];

					if(server.users[params[1]] !== server.user && Object.keys(server.users[params[1]].channels).length === 0)
					{
						delete server.users[params[1]];
					}
				}

				if(typeof server.channels[params[0]] !== 'undefined')
				{
					delete server.channels[params[0]].users[params[1]];

					if(server.users[params[1]] === server.user)
					{
						delete server.channels[params[0]];
					}
				}

				break;
		}
	}
}

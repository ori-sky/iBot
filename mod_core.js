var vm = require('vm');
var sandbox = vm.createContext({});

var User = require('./iBot-User.js').User;
var Channel = require('./iBot-Channel.js').Channel;

exports.mod = function(context)
{
	this.recv = function(server, prefix, opcode, params)
	{
		switch(opcode)
		{
			case 'PING':
				server.send('PONG :' + params[0]);
				break;
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				switch(words[0])
				{
					case '!lmsrv':
						if(server.master.test(prefix.mask))
						{
							context.reloadModule(words[1], server);
							server.send('PRIVMSG ' + target + ' :done');
						}
						break;
					case '!lmctx':
						if(server.master.test(prefix.mask))
						{
							context.reloadModule(words[1], null);
							server.send('PRIVMSG ' + target + ' :done');
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
					case '!test':
						server.send('PRIVMSG ' + target + ' :test');
						break;
					case '!hello':
						server.send('PRIVMSG ' + target + ' :hello');
						break;
				}
				break;
			case '353': // RPL_NAMREPLY
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
		}
	}
}

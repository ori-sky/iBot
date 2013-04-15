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

				if(target === server.user.nick)
				{
					target = prefix.nick;
				}

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
					case '!mods':
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
					case '!js':
						if(server.master.test(prefix.mask))
						{
							var js = words.slice(1).join(' ');

							sandbox._ =
							{
								root: sandbox,
								echoResult: false,
								send: server.send,
								params: params,
								words: words
							};

							try
							{
								var result = vm.runInContext(js, sandbox);

								if(sandbox._.echoResult === true)
								{
									server.send('PRIVMSG ' + target + ' :Result: ' + result);
								}

								delete sandbox._;
							}
							catch(e)
							{
								console.error(e.stack);
								server.send('PRIVMSG ' + target + ' :' + e.message);
							}
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

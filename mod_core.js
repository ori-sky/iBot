var vm = require('vm');
var sandbox = vm.createContext({});

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
					case '!mods':
						server.send('PRIVMSG ' + target + ' :Modules: ' + server.getModules(', '));
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
		}
	}
}

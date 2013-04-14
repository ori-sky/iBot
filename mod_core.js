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

				switch(words[0])
				{
					case '!_loads':
						if(server.master.test(prefix['mask']))
						{
							server.reloadModule(words[1]);
							server.send('PRIVMSG ' + params[0] + ' :done');
						}
						break;
					case '!_loadc':
						if(server.master.test(prefix['mask']))
						{
							context.reloadModule(words[1]);
							server.send('PRIVMSG ' + params[0] + ' :done');
						}
						break;
					case '!_raw':
						if(server.master.test(prefix['mask']))
						{
							server.send(words.slice(1).join(' '));
						}
						break;
					case '!_js':
						if(server.master.test(prefix['mask']))
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
									server.send('PRIVMSG ' + params[0] + ' :Result: ' + result);
								}

								delete sandbox._;
							}
							catch(e)
							{
								console.error(e.stack);
								server.send('PRIVMSG ' + params[0] + ' :' + e.message);
							}
						}
						break;
					case '!test':
						server.send('PRIVMSG ' + params[0] + ' :test');
						break;
				}
				break;
		}
	}
}

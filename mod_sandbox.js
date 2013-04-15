var vm = require('vm');
var sandbox = vm.createContext({});

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
				}
				break;
		}
	}
}

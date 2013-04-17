var child_process = require('child_process');
var worker = child_process.fork('./mod_sandbox-worker.js');

exports.mod = function(context)
{
	this.running = false;

	worker.on('message', function(m)
	{
		this.server.send(m.output);

		// todo: parse out \r and \n
		if(m.echoResult)
		{
			this.server.send('PRIVMSG ' + this.target + ' :Result: ' + m.result);
		}

		this.running = false;
		clearTimeout(this.timeout);
	}.bind(this));

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
						//if(server.master.test(prefix.mask))
						if(!this.running)
						{
							this.server = server;
							this.target = target;

							var js = words.slice(1).join(' ');

							this.running = true;
							worker.send({js:js, params:params, words:words, target:target});

							this.timeout = setTimeout(function()
							{
								server.send('PRIVMSG ' + target + ' :JavaScript execution timed out');

								worker.kill();
								worker = child_process.fork('./mod_sandbox-worker.js');

								this.running = false;
							}.bind(this), 2000);

							/*
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
							*/
						}
						break;
				}
				break;
		}
	}
}

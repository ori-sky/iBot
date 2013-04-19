var child_process = require('child_process');
var worker = child_process.fork('./mod_sandbox-worker.js');

exports.mod = function(context)
{
	this.running = false;

	this.reconnectWorker = function(worker)
	{
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
	}.bind(this);

	this.reconnectWorker(worker);

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
								this.reconnectWorker(worker);

								this.running = false;
							}.bind(this), 2000);
						}
						break;
				}
				break;
		}
	}
}

exports.mod = function(server)
{
	this.recv = function(prefix, opcode, params)
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
					case '!_load':
						server.reloadModule(words[1]);
						server.send('PRIVMSG ' + params[0] + ' :done');
						break;
					case '!_raw':
						server.send(params[1].substr(6));
						break;
					case '!test':
						server.send('PRIVMSG ' + params[0] + ' :test');
						break;
				}
				break;
		}
	}
}

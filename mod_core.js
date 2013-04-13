exports.mod = function(server)
{
	this.server = server;

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
						//server.send('PRIVMSG ' + params[0] + ' :denied');
						server.reloadModule(words[1]);
						break;
				}
				break;
		}
	}
}

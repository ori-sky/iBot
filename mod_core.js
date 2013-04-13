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
				switch(params[1])
				{
					case '!_load':
						server.send('PRIVMSG ' + params[0] + ' :denied');
						break;
				}
				break;
		}
	}
}

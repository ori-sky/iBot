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
					case '!_raw':
						if(server.master.test(prefix['mask']))
						{
							server.send(words.slice(1).join(' '));
						}
						break;
				}
				break;
		}
	}
}

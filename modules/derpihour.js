exports.mod = function(context)
{
	this.derpihour = false;

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
					case '!derpihour':
						if(!this.derpihour)
						{
							this.derpihour = true;
							server.send('PRIVMSG ' + target + ' :Derpi Hour!');
						}
						else
						{
							this.derpihour = false;
							server.send('PRIVMSG ' + target + ' :Aww... ;-;');
						}
						break;
					case '!derpihour?':
						server.send('PRIVMSG ' + target + ' :Derpi Hour? ' + this.derpihour.toString().toUpperCase());
						break;
				}
				break;
		}
	}
}

var crypto = require('crypto');

exports.mod = function(context, server)
{
	this.core$cmd = function(prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'ping':
				server.send('PRIVMSG ' + target + ' :pong' + (params[0] !== undefined ? (' ' + params[0]) : ''));
				break;
			case 'digest':
				if(params.length < 2) { server.send('PRIVMSG ' + target + ' :Syntax: hash <type> <string>'); break; }

				var h = crypto.createHash(params[0]);
				h.update(params[1]);
				server.send('PRIVMSG ' + target + ' :Hash: ' + h.digest('hex'));
				break;
		}
	}
}

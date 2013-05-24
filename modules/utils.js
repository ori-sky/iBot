var crypto = require('crypto');
var util = require('util');

exports.mod = function(context, server)
{
	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		switch(cmd)
		{
			case 'ping':
				$core._privmsg(target, 'pong' + (params[0] !== undefined ? (' ' + params[0]) : ''));
				break;
			case 'digest':
				if(params.length < 2)
				{
					$core._privmsg(target, 'Syntax: hash <type> <string>');
					break;
				}

				var h = crypto.createHash(params[0]);
				h.update(params[1]);
				$core._privmsg(target, 'Hash: ' + h.digest('hex'));
				break;
			case 'memusage':
				$core._privmsg(target, util.inspect(process.memoryUsage()));
				break;
		}
	}
}

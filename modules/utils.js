var crypto = require('crypto');
var util = require('util');

exports.mod = function(context, server)
{
	this.help$register = function()
	{
		server.do('help$register', 'utils');
	}

	this._help = function(topic, params)
	{
		switch(topic)
		{
			case 'utils':
				return {
					text: 'Provides various utility commands.',
					sub: ['ping', 'digest', 'memusage']
				};
		}
	}

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
					$core._privmsg(target, 'Syntax: digest <type> <string>');
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

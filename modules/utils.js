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
				switch(params[0])
				{
					case 'ping':
						return "Send a ping to the bot (useful for connection checks).";
					case 'digest':
						return "Digest a string into a hash.";
					case 'memusage':
						return "Show current memory usage.";
					default:
						return {
							text: 'Provides various utility commands.',
							sub: ['ping', 'digest', 'memusage']
						};
				}
				break;
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

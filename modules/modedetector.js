exports.mod = function(server, context)
{
	this.core$mode = function(prefix, channel, state, modechar, param, $core)
	{
		$core._privmsg(channel, 'Mode change detected: ' + (state ? '+' : '-') + modechar + ' ' + param);
	}
}

exports.mod = function(context, server)
{
	this.core$cmd = function(prefix, target, command, params, $core)
	{
		if(command === 'helloworld') $core._privmsg(target, 'Hello, ' + prefix.nick + '!');
	}
}

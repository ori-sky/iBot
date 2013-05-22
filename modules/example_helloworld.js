exports.mod = function(context, server)
{
	// hook into cmd event from core
	this.core$cmd = function(prefix, target, command, params, $core)
	{
		if(command === 'helloworld')
		{
			// will output "Hello, <nick>!"
			$core._privmsg(target, 'Hello, ' + prefix.nick + '!');
		}
	}
}

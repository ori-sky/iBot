exports.mod = function(context)
{
	// hook into cmd event from core
	this.core$cmd = function(server, prefix, target, command, params)
	{
		if(command === 'helloworld')
		{
			// will output "Hello, <nick>!"
			server.send('PRIVMSG ' + target + ' :Hello, ' + prefix.nick + '!');
		}
	}
}

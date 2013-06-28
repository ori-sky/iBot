exports.mod = function(context, server)
{
	this.help$register = function()
	{
		server.do('help$register', 'helloworld');
	}

	this._help = function(topic, params)
	{
		switch(topic)
		{
			case 'helloworld':
				return 'Prints a hello message.';
		}
	}

	this.core$cmd = function(prefix, target, command, params, $core)
	{
		if(command === 'helloworld') $core._privmsg(target, 'Hello, ' + prefix.nick + '!');
	}
}

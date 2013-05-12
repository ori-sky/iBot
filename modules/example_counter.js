exports.mod = function(context)
{
	this.counter = 0;

	// resume
	this._resume = function(data)
	{
		if(typeof data === 'number') this.counter = data;
	}

	// suspend
	this._suspend = function()
	{
		return this.counter;
	}

	// hook into cmd event from core
	this.core$cmd = function(server, prefix, target, command, params)
	{
		if(command === 'counter')
		{
			server.send('PRIVMSG ' + target + ' :Counter is now: ' + ++this.counter);
		}
	}
}

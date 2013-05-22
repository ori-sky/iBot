exports.mod = function(context, server)
{
	this.counter = 0;

	// load
	this._load = function(data)
	{
		if(typeof data === 'number') this.counter = data;
	}

	// save
	this._save = function()
	{
		return this.counter;
	}

	// suspend
	this._suspend = function()
	{
		return this.counter;
	}

	// resume
	this._resume = function(data)
	{
		if(typeof data === 'number') this.counter = data;
	}

	// hook into cmd event from core
	this.core$cmd = function(prefix, target, command, params)
	{
		if(command === 'counter')
		{
			server.do('core$privmsg', target, 'Counter is now: ' + ++this.counter);
		}
	}
}

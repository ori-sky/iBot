exports.mod = function(context)
{
	this.counter = 0;

	// load data
	this._load = function(data)
	{
		if(typeof data === 'number') this.counter = data;
	}

	// save data
	this._save = function()
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

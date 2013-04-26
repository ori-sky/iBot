exports.mod = function(context)
{
	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'firetimed':
				server.fireTimed(params[0], params[1], 'test', server, target);
				break;
			case 'firecancel':
				server.fireCancel(params[0]);
				break;
			case 'firechange':
				server.fireChange(params[0], params[1]);
				break;
		}
	}

	this.test_firetimed$test = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :fired!');
	}
}

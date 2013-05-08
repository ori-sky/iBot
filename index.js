module.exports =
{
	Context:	require('./iBot-Context'),
	Server:		require('./iBot-Server'),
	User:		require('./iBot-User'),
	Channel:	require('./iBot-Channel'),
	Mode:		require('./iBot-Mode'),
	start: function(path)
	{
		var fs = require('fs');

		var ctx = undefined;

		if(path === undefined) path = process.cwd() + '/config.json';

		fs.readFile(path, function(err, data)
		{
			if(err) console.log(err);
			else
			{
				try
				{
					var config = JSON.parse(data);
					ctx = new module.exports.Context(config);
					ctx.start();
				}
				catch(e)
				{
					console.log('Errors parsing config file:');
					console.log(e.stack);
				}
			}
		});
	}
};

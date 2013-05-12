module.exports =
{
	Context:	require('./iBot-Context'),
	Server:		require('./iBot-Server'),
	User:		require('./iBot-User'),
	Channel:	require('./iBot-Channel'),
	Mode:		require('./iBot-Mode'),
	start: function(path)
	{
		if(path === undefined) path = process.cwd() + '/config.json';
		var context = new module.exports.Context(path);
	}
};

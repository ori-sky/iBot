exports.mod = function(server)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		server.send('PRIVMSG ' + target + ' :before');
		server.fire('inner', server, target);
		server.send('PRIVMSG ' + target + ' :after');
	}

	this.test_hookstack$inner = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :inner');
	}
}

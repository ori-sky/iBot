exports.mod = function(server)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		server.send('PRIVMSG ' + target + ' :before');
		server.fire('depth2', server, target);
		server.send('PRIVMSG ' + target + ' :after');
	}

	this.test_hookstack2$depth3 = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :depth3');
	}
}

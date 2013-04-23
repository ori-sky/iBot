exports.mod = function(server)
{
	this.test_hookstack$depth2 = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :depth2 before');
		server.fire('depth3', server, target);
		server.send('PRIVMSG ' + target + ' :depth2 after');
	}
}

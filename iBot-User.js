exports.User = function(nick, ident, host, realname)
{
	this.nick = nick;
	this.ident = ident;
	this.host = host;
	this.realname = realname;

	this.channels = {};
	this.modes = [];
}

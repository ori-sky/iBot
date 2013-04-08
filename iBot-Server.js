var User = require('iBot-User.js');

exports.Server = function(host, port, nick, ident, pass)
{
	this.host = host;
	this.port = port;
	this.nick = nick;
	this.ident = ident;
	this.pass = pass;

	this.users = {};
	this.channels = {};

	this.user = new User(nick, ident, '', 'iBot');
	this.users[nick] = this.user;
}

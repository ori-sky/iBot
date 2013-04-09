var net = require('net');

var User = require('./iBot-User.js').User;

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

	this.onConnect = function()
	{
		
	}

	this.connect = function()
	{
		this.client = new net.Socket();

		this.client.on('data', this.onData);
		this.client.on('close', this.onClose);

		this.client.setEncoding('utf8');
		this.client.setNoDelay();
		this.client.connect(port, host, this.onConnect);
	}

	this.send = function(data)
	{
		this.sendSilent(data);
	}

	this.sendSilent = function(data)
	{
		this.client.write(data + '\r\n');
	}
}

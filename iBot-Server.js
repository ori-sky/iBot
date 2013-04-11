var net = require('net');
var readline = require('readline');

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
		if(typeof this.pass === 'string' && this.pass !== '')
		{
			this.sendSilent('PASS ' + this.pass);
		}
		else if(typeof this.pass === 'boolean' && this.pass !== false)
		{
			var rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout
			}
			);

			console.log('Enter PASS for ' + host + ':' + port + ' ' + this.nick + '!' + this.ident + ': ');
			rl.question('', function(pass)
			{
				console.log('\x1b[1A\x1b[2K');

				this.pass = pass;
				this.onConnect();

				rl.close();
			}.bind(this)
			);

			return;
		}

		this.send('NICK ' + this.nick);
		this.send('USER ' + this.ident + ' 0 * :' + this.user.realname);
	}.bind(this);

	this.onData = function(data)
	{
		var text = data.toString();
		var texts = text.split('\r\n');

		for(var i=0; i<(texts.length-1); ++i)
		{
			this.recv(texts[i]);
		}
	}

	this.connect = function()
	{
		this.client = new net.Socket();

		//this.client.on('data', this.onData);
		//this.client.on('close', this.onClose);

		this.client.setEncoding('utf8');
		this.client.setNoDelay();
		this.client.connect(port, host, this.onConnect);
	}

	this.send = function(data)
	{
		console.log(data);
		this.sendSilent(data);
	}

	this.sendSilent = function(data)
	{
		this.client.write(data + '\r\n');
	}
}

exports.exit = function()
{
	rl.close();
}

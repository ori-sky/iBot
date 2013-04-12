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
	this.modules = {};

	this.user = new User(nick, ident, '', 'iBot');
	this.users[nick] = this.user;

	this.addModule = function(name)
	{
		var sandboxedServer =
		{
			send: this.send,
			sendSilent: this.sentSilent
		};

		var module = require('./mod_' + name + '.js');
		this.modules[name] = new module.mod();

		console.log('Loaded mod_' + name);
	}

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

	this.accumulator = '';

	this.onData = function(data)
	{
		var text = this.accumulator + data.toString();
		var texts = text.split('\r\n');

		for(var i=0; i<(texts.length-1); ++i)
		{
			this.recv(texts[i]);
		}

		this.accumulator = texts[texts.length - 1];
	}.bind(this);

	this.onClose = function()
	{
		this.client.end();
		this.client.destroy();

		var timeout = setTimeout(function()
		{
			this.connect();
		}.bind(this), 5000);
	}.bind(this);

	this.connect = function()
	{
		this.client = new net.Socket();

		this.client.on('data', this.onData);
		this.client.on('close', this.onClose);

		this.client.setEncoding('utf8');
		this.client.setNoDelay();
		this.client.connect(port, host, this.onConnect);
	}

	this.recv = function(data)
	{
		console.log('r> ' + data);
		var words = data.split(' ');

		var prefix = null;
		var opcode = '';
		var params = [];
		var paramsIndex = 0;

		if(words[0][0] === ':')
		{
			prefix = {};
			prefix['mask'] = words[0].substr(1);

			if(prefix['mask'].indexOf('!') !== -1)
			{
				var split1 = prefix['mask'].split('!');
				var split2 = split1[1].split('@');

				prefix['nick'] = split1[0];
				prefix['ident'] = split2[0];
				prefix['host'] = split2[1];
			}

			opcode = words[1];

			if(words.length > 2)
			{
				paramsIndex = 2;
			}
		}
		else
		{
			opcode = words[0];

			if(words.length > 1)
			{
				paramsIndex = 1;
			}
		}

		if(paramsIndex > 0)
		{
			var inString = false;
			for(var i=paramsIndex; i<words.length; ++i)
			{
				if(!inString && words[i][0] === ':')
				{
					inString = true;
					params.push(words[i].substr(1));
					continue;
				}

				if(inString)
				{
					params[params.length - 1] += ' ' + words[i];
				}
				else
				{
					params.push(words[i]);
				}
			}
		}

		switch(opcode)
		{
			case 'PING':
				this.send('PONG :' + params[0]);
				break;
		}
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

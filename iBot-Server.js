var net = require('net');
var tls = require('tls');
var readline = require('readline');

var User = require('./iBot-User.js');

module.exports = function(context, host, port, nick, ident, pass, ssl)
{
	this.host = host;
	this.port = port;
	this.nick = nick;
	this.ident = ident;
	this.pass = pass;

	this.isupport = {};
	this.users = {};
	this.channels = {};
	this.modules = {};

	this.user = new User(nick, ident, '', 'iBot');

	this.getModules = function(delimiter)
	{
		var keys = Object.keys(this.modules);
		return keys.join(delimiter);
	}

	this.onConnect = function()
	{
		if(ssl)
		{
			context.log('err', 'TLS negotiation: ' + this.client.authorized ? 'authorized' : 'unauthorized');
		}

		this.users[nick] = this.user;

		if(typeof this.pass === 'string' && this.pass !== '')
		{
			this.sendSilent('PASS ' + this.pass);
		}
		else if(typeof this.pass === 'boolean' && this.pass !== false)
		{
			if(typeof this.rl !== 'undefined') this.rl.close();

			this.rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout
			});

			context.log('out', 'Enter PASS for ' + host + ':' + port + ' ' + this.nick + '!' + this.ident + ': ');
			this.rl.question('', function(pass)
			{
				context.logUnsafe('out', '\x1b[1A\x1b[2K');

				this.pass = pass;
				this.onConnect();

				this.rl.close();
			}.bind(this));

			return;
		}

		this.send('NICK ' + this.nick);
		this.send('USER ' + this.ident + ' 0 * :' + this.user.realname);

		this.ponged = true;
		this.pingInterval = setInterval(function()
		{
			if(this.ponged)
			{
				this.send('PING :keepalive');
			}
			else
			{
				this.onClose();
			}
		}.bind(this), 120000);
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
		context.log('err', 'Connection closed');

		clearInterval(this.pingInterval);

		this.client.end();
		this.client.destroy();

		delete this.users;
		delete this.channels;
		delete this.user.channels;

		this.users = {};
		this.channels = {};
		this.user.channels = {};

		var timeout = setTimeout(function()
		{
			this.connect();
		}.bind(this), 5000);
	}.bind(this);

	this.onError = function(err)
	{
		context.log('urgent', err);
	}.bind(this);

	this.connect = function()
	{
		if(ssl)
		{
			context.log('err', 'Negotiating connection over TLS');
			this.client = tls.connect(port, host, {}, this.onConnect);
		}
		else
		{
			this.client = new net.Socket();
			this.client.setNoDelay();

			this.client.connect(port, host, this.onConnect);
		}

		this.client.setEncoding('utf8');

		this.client.on('data', this.onData);
		this.client.on('close', this.onClose);
		this.client.on('error', this.onError);
	}.bind(this);

	this.recv = function(data)
	{
		context.log('err', 'R> ' + data);
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

		for(var mod in this.modules)
		{
			try
			{
				this.modules[mod].recv(this, prefix, opcode, params);
			}
			catch(e)
			{
				context.logUnsafe('urgent', e.stack);
			}
		}
	}.bind(this);

	this.send = function(data)
	{
		context.log('err', 'S> ' + data);
		this.sendSilent(data);
	}.bind(this);

	this.sendSilent = function(data)
	{
		this.client.write(data + '\r\n');
	}.bind(this);
}

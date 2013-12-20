/*
 * Copyright (c) 2013, David Farrell <shokku.ra@gmail.com>
 *  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * 
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * - Neither the name of iBot nor the names of its contributors may be used to
 *   endorse or promote products derived from this software without specific
 *   prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var net = require('net');
var util = require('util');

exports.mod = function(context, server)
{
	this.Client = function(clients, connection)
	{
		this.clients = clients;
		this.connection = connection;
		this.registered = false;
		this.sending = false;
		this.accumulator = '';

		this.pass = '';
		this.user = '';

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

		this.recv = function(data)
		{
			var words = data.split(' ');
			var opcode = words[0];

			if(this.registered === true)
			{
				switch(opcode.toUpperCase())
				{
					case 'PRIVMSG':
						var prefix = server.user.nick + '!' + server.user.ident + '!' + server.user.host;

						this.sending = true;
						server.do('core$send', data);
						break;
					case 'QUIT':
						this.quit();
						break;
					case 'QUOTE':
						server.send(words.slice(1).join(' '));
						break;
					case 'CMD':
						var prefix = '*';
						var target = words[1];
						var cmd = words[2];
						var params = words.slice(3);

						if(target === '*') target = server.user.nick;

						server.fire('core$cmdraw', prefix, target, cmd, params);
						break;
					default:
						this.sending = true;
						server.do('core$send', data);
						break;
				}
			}
			else
			{
				switch(opcode.toUpperCase())
				{
					case 'QUIT':
						this.quit();
						break;
					case 'NICK':
						break;
					case 'PASS':
						if(words[1] !== undefined) this.pass = words[1];
						break;
					case 'USER':
						if(words[1] !== undefined) this.user = words[1].toLowerCase();

						if(server.do('account$checkpasslevel', this.user, this.pass, 1000000000) === false)
						{
							this.error('Authentication failed');
							break;
						}

						this.registered = true;
						this.connection.write(':ibot 001 ' + server.user.nick + ' :Welcome to iBot ' + server.user.nick + '\r\n');

						for(var kChannel in server.user.channels)
						{
							var prefix = server.user.nick + '!' + server.user.ident + '!' + server.user.host;
							this.connection.write(':' + prefix + ' JOIN ' + kChannel + '\r\n');
							server.do('core$send', 'NAMES ' + kChannel);
						}

						break;
					default:
						this.connection.write(':ibot 451 * :You have not registered\r\n');
						break;
				}
			}
		}.bind(this);

		this.error = function(reason)
		{
			if(reason === undefined) reason = 'Connection closed';

			try
			{
				this.connection.write('ERROR :Closing link: 127.0.0.1 (' + reason + ')\r\n');
			}
			catch(e)
			{
				console.log(e);
			}

			this.quit();
		}.bind(this);

		this.quit = function()
		{
			for(var iClient in this.clients)
			{
				if(this.clients[iClient].connection === this.connection)
				{
					this.clients.splice(iClient, 1);
				}
			}

			this.connection.end();
			this.connection.destroy();
		}.bind(this);
	}

	this.server = undefined;
	this.clients = [];

	this._suspend = function()
	{
		if(this.timeout !== undefined) clearTimeout(this.timeout);
		this.destroy();
	}

	this._loaded = function()
	{
		this.timeout = setTimeout(function() { this.create(); }.bind(this), 2000);
	}

	this._unloaded = function()
	{
		if(this.timeout !== undefined) clearTimeout(this.timeout);
		this.destroy();
	}

	this.$recv_raw = function(data)
	{
		for(var iClient in this.clients)
		{
			if(this.clients[iClient].registered === true)
			{
				this.clients[iClient].connection.write(data + '\r\n');
			}
		}
	}

	this.$send = function(data)
	{
		for(var iClient in this.clients)
		{
			if(this.clients[iClient].registered === true && this.clients[iClient].sending === false)
			{
				var words = data.split(' ');
				var opcode = words[0];

				switch(opcode)
				{
					case 'PRIVMSG':
						var prefix = server.user.nick + '!' + server.user.ident + '!' + server.user.host;
						this.clients[iClient].connection.write(':' + prefix + ' ' + data);
						break;
				}
			}
			else if(this.clients[iClient].sending === true) this.clients[iClient].sending = false;
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'relay')
		{
			switch(params[0])
			{
				case '?':
					$core._privmsg(target, this.clients.length);
					break;
			}
		}
	}

	this.create = function()
	{
		this.server = net.createServer();
		
		this.server.on('connection', function(c)
		{
			var client = new this.Client(this.clients, c);
			this.clients.push(client);
			setTimeout(function()
			{
				if(client.registered === false) client.error('Registration timed out');
			}.bind(this), 30000);

			c.setEncoding('utf8');

			c.on('data', client.onData);

			c.on('end', function()
			{
				for(var iClient in this.clients)
				{
					if(this.clients[iClient].connection === c)
					{
						this.clients[iClient].quit();
					}
				}
			}.bind(this));

			c.on('error', function(err)
			{
				console.log(err);

				for(var iClient in this.clients)
				{
					if(this.clients[iClient].connection === c)
					{
						this.clients[iClient].quit();
					}
				}
			}.bind(this));
		}.bind(this));

		this.server.on('error', function(err)
		{
			console.log(err);
		});

		this.server.listen(18010);
	}

	this.destroy = function()
	{
		if(this.server !== undefined)
		{
			for(var iClient in this.clients)
			{
				this.clients[iClient].connection.end();
				this.clients[iClient].connection.destroy();
			}

			this.server.close();
		}
	}
}

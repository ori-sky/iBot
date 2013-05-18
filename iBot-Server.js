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
var tls = require('tls');
var readline = require('readline');

var User = require('./iBot-User.js');

module.exports = function(context, host, port, nick, ident, pass, ssl)
{
	this.users = {};
	this.channels = {};
	
	this.modules = {};
	this.moduleData = {};
	this.activeModuleStack = [];
	this.timeouts = {};

	this.willQuit = false;

	this.addModule = function(name, mod)
	{
		var tmp = this.do(name + '$suspend');
		this.modules[name] = mod;

		if(mod.data === undefined) mod.data = {};

		if(this.config !== undefined)
		{
			if(this.config.data !== undefined)
			{
				if(this.config.data[name] !== undefined) this.do(name + '$load', JSON.parse(JSON.stringify(this.config.data[name])));
			}
		}

		if(tmp !== undefined) this.do(name + '$resume', tmp);

		this.do(name + '$loaded', this);
	}

	this.rmModule = function(name)
	{
		if(this.config !== undefined)
		{
			var tmp = this.do(name + '$save');

			if(tmp !== undefined)
			{
				if(this.config.data === undefined) this.config.data = {};
				this.config.data[name] = tmp;
			}
		}

		this.do(name + '$unloaded');
		this.modules[name] = undefined;
		delete this.modules[name];
	}

	this.getModules = function(delimiter)
	{
		var keys = Object.keys(this.modules);
		return keys.join(delimiter);
	}

	this.get = function(moduleName)
	{
		if(typeof moduleName === 'undefined') moduleName = this.activeModuleStack[this.activeModuleStack.length - 1];
		if(typeof this.moduleData[moduleName] === 'undefined') this.moduleData[moduleName] = {};
		return this.moduleData[moduleName];
	}

	this.do = function()
	{
		var moduleName = undefined;

		try
		{
			var fullName = arguments[0];
			var s1 = fullName.split('$');
			moduleName = s1[0];
			var methodName = s1[1];

			if(this.modules[moduleName] !== undefined && this.modules[moduleName]['_' + methodName] !== undefined)
			{
				var ret = this.modules[moduleName]['_' + methodName].apply(this.modules[moduleName], Array.prototype.slice.call(arguments, 1));
				return ret;
			}
		}
		catch(e)
		{
			if(moduleName === undefined) console.log(e.message);
			else console.log('[' + moduleName + '] ' + e.message);
		}

		return undefined;
	}

	this.fire = function()
	{
		for(var kModule in this.modules)
		{
			var activeModule = this.activeModuleStack[this.activeModuleStack.length - 1];
			var eventName = arguments[0];
			if(eventName !== undefined && eventName[0] === '$')
			{
				activeModule = '';
				eventName = eventName.substr(1);
			}

			if(this.modules[kModule][activeModule + '$' + eventName] !== undefined)
			{
				this.activeModuleStack.push(kModule);

				try
				{
					this.modules[kModule][activeModule + '$' + eventName].apply(this.modules[kModule], Array.prototype.slice.call(arguments, 1));
				}
				catch(e)
				{
					 console.log(e.stack);
				}

				this.activeModuleStack.pop();
			}
		}
	}

	this.fireTimed = function()
	{
		var activeModule = this.activeModuleStack[this.activeModuleStack.length - 1];
		var args = Array.prototype.slice.call(arguments, 0);
		var duration = args[0];
		var id = args[1];
		if(typeof id === 'undefined') id = 'default';

		this.fireCancel(id);

		if(typeof this.timeouts[id] === 'undefined')
		{
			this.timeouts[id] = {};
		}

		this.timeouts[id].time = new Date().getTime();
		this.timeouts[id].duration = duration;
		this.timeouts[id].fn = function()
		{
			this.activeModuleStack.push(activeModule);
			this.fire.apply(this, args.slice(2));
			this.activeModuleStack.pop();
			this.fireCancel(id);
			delete this.timeouts[id];
		}.bind(this);
		this.timeouts[id].timeout = setTimeout(this.timeouts[id].fn, duration);
	}.bind(this);

	this.fireChange = function(newDuration, id)
	{
		if(typeof id === 'undefined') id = 'default';
		if(typeof this.timeouts[id] !== 'undefined')
		{
			var duration = newDuration - (new Date().getTime() - this.timeouts[id].time);
			this.fireCancel(id);
			this.timeouts[id].timeout = setTimeout(this.timeouts[id].fn, duration);
		}
	}

	this.fireCancel = function(id)
	{
		if(typeof id === 'undefined') id = 'default';
		if(typeof this.timeouts[id] !== 'undefined')
		{
			clearTimeout(this.timeouts[id].timeout);
		}
	}

	this.onConnect = function()
	{
		if(this.ssl)
		{
			this.fire('$log', 'TLS negotiation: ' + this.client.authorized ? 'authorized' : 'unauthorized', 'err');
		}

		this.user = new User(this.nick, this.ident, '', 'iBot');
		this.users[this.nick] = this.user;

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

			console.log('Enter PASS for ' + this.host + ':' + this.port + ' ' + this.nick + '!' + this.ident + ': ');
			this.rl.question('', function(pass)
			{
				console.log('\x1b[1A\x1b[2K');

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
				this.ponged = false;
				this.send('PING :keepalive');
			}
			else
			{
				this.client.end();
				this.client.destroy();
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
		this.fire('$log', 'Connection closed', 'err');

		clearInterval(this.pingInterval);

		this.client.end();
		this.client.destroy();

		delete this.users;
		delete this.channels;
		delete this.user.channels;

		this.users = {};
		this.channels = {};
		this.user.channels = {};

		if(!this.willQuit)
		{
			var timeout = setTimeout(function()
			{
				this.connect();
			}.bind(this), 5000);
		}
	}.bind(this);

	this.onError = function(err)
	{
		this.fire('$log', err, 'urgent');
	}.bind(this);

	this.connect = function()
	{
		if(this.ssl)
		{
			this.fire('$log', 'Negotiating connection over TLS', 'err');
			this.client = tls.connect(this.port, this.host, {rejectUnauthorized:false}, this.onConnect);
		}
		else
		{
			this.client = new net.Socket();
			this.client.setNoDelay();

			this.client.connect(this.port, this.host, this.onConnect);
		}

		this.client.setEncoding('utf8');

		this.client.on('data', this.onData);
		this.client.on('close', this.onClose);
		this.client.on('error', this.onError);
	}.bind(this);

	this.recv = function(data)
	{
		this.fire('$log', 'R> ' + data, 'err');
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

		this.fire('$recv', this, prefix, opcode, params);
	}.bind(this);

	this.send = function(data)
	{
		this.fire('$log', 'S> ' + data, 'err');
		this.sendSilent(data);
	}.bind(this);

	this.sendSilent = function(data)
	{
		this.client.write(data + '\r\n');
	}.bind(this);

	this.quit = function()
	{
		this.willQuit = true;
		if(this.client !== undefined) this.client.end();

		for(var kServer in context.servers)
		{
			if(context.servers[kServer] === this) delete context.servers[kServer];
		}
	}.bind(this);

	if(typeof host === 'object')
	{
		var config = host;
		this.config = config;
		this.host = config.host;
		this.port = config.port;
		this.pass = config.pass;
		this.ssl = config.ssl;
		this.nick = config.nick;
		this.ident = config.ident;
		this.master = config.master

		if(this.port === undefined) this.port = 6667;
		if(this.pass === undefined) this.pass = false;
		if(this.ssl === undefined) this.ssl = false;
		if(this.ident === undefined) this.ident = 'ibot';

		if(this.master === undefined) this.master = /^$/;
		else this.master = new RegExp(this.master);

		if(config.modules !== undefined)
		{
			for(var kModule in config.modules)
			{
				context.loadModule(config.modules[kModule], this);
			}
		}
	}
	else
	{
		this.host = host;
		this.port = port;
		this.nick = nick;
		this.ident = ident;
		this.pass = pass;
		this.ssl = ssl;
	}
}

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

	this.isConnected = false;
	this.willQuit = false;

	this.save = function()
	{
		for(var kModule in this.modules)
		{
			if(this.pconfig !== undefined)
			{
				var tmp = this.do(kModule + '$save');

				if(tmp !== undefined)
				{
					if(this.pconfig.data === undefined) this.pconfig.data = {};
					this.pconfig.data[kModule] = tmp;
				}
			}
		}
	}

	this.addModule = function(name, mod, updateConfig)
	{
		var tmp = this.do(name + '$suspend');
		this.modules[name] = mod;

		if(mod.data === undefined) mod.data = {};

		if(this.pconfig !== undefined)
		{
			if(this.pconfig.data !== undefined)
			{
				if(this.pconfig.data[name] !== undefined)
				{
					this.do(name + '$load', JSON.parse(JSON.stringify(this.pconfig.data[name])));
				}
			}
		}

		if(updateConfig !== false)
		{
			if(this.config.modules === undefined) this.config.modules = [];

			var inArray = false;
			for(var i=0; i<this.config.modules.length; ++i)
			{
				if(this.config.modules[i] === name) inArray = true;
			}

			if(inArray === false) this.config.modules.push(name);
		}

		if(tmp !== undefined) this.do(name + '$resume', tmp);

		this.do(name + '$loaded', this);
	}

	this.rmModule = function(name, updateConfig)
	{
		if(this.pconfig !== undefined)
		{
			var tmp = this.do(name + '$save');

			if(tmp !== undefined)
			{
				if(this.pconfig.data === undefined) this.pconfig.data = {};
				this.pconfig.data[name] = tmp;
			}
		}

		if(updateConfig !== false)
		{
			for(var i=0; i<this.config.modules.length; ++i)
			{
				if(this.config.modules[i] === name) this.config.modules.splice(i, 1);
			}
		}

		this.do(name + '$unloaded', this);
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

	// TODO: sort out this mess of an event system
	// TODO: maybe combine do and fire somehow?

	this.do = function()
	{
		if(this.activeModuleStack.length > 100)
		{
			console.log('Exceeded max module stack size.');
			return undefined;
		}

		var sender = this.modules[this.activeModuleStack[this.activeModuleStack.length - 1]];

		var fullName = arguments[0];
		if(typeof fullName !== 'string') return undefined;

		var s1 = fullName.split('$');
		if(s1.length < 2) return undefined;

		var moduleName = s1[0];
		var methodName = s1[1];

		var ret = undefined;

		this.activeModuleStack.push(moduleName);

		try
		{
			if(this.modules[moduleName] !== undefined && this.modules[moduleName]['_' + methodName] !== undefined)
			{
				var params = Array.prototype.slice.call(arguments, 1);
				params.push(sender);

				ret = this.modules[moduleName]['_' + methodName].apply(this.modules[moduleName], params);
			}
		}
		catch(e)
		{
			if(moduleName === undefined) console.log(e.message);
			else console.log('[' + moduleName + '] ' + e.message);
		}

		this.activeModuleStack.pop();

		return ret;
	}

	this.fire = function()
	{
		if(this.activeModuleStack.length > 100)
		{
			console.log('Exceeded max module stack size.');
			return undefined;
		}

		//var sender = this.modules[this.activeModuleStack[this.activeModuleStack.length - 1]];

		for(var kModule in this.modules)
		{
			var activeModule = this.activeModuleStack[this.activeModuleStack.length - 1];
			var eventName = arguments[0];

			if(eventName !== undefined)
			{
				var s = eventName.split('$');
				if(s.length > 1)
				{
					activeModule = s[0];
					eventName = s[1];
				}
			}

			var sender = this.modules[activeModule];

			if(this.modules[kModule][activeModule + '$' + eventName] !== undefined)
			{
				this.activeModuleStack.push(kModule);

				try
				{
					var params = Array.prototype.slice.call(arguments, 1);
					params.push(sender);

					this.modules[kModule][activeModule + '$' + eventName].apply(this.modules[kModule], params);
				}
				catch(e)
				{
					 console.log(e.stack);
				}

				this.activeModuleStack.pop();
			}
		}
	}

	this.onConnect = function()
	{
		if(this.ssl)
		{
			this.fire('$log', 'TLS negotiation: ' + (this.client.authorized ? 'authorized' : 'unauthorized'), 'err');
		}

		this.isConnected = true;

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
		this.isConnected = false;

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
		this.fire('$recv_raw', data);

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

		this.fire('$recv', prefix, opcode, params);
	}.bind(this);

	this.send = function(data, crlf)
	{
		if(crlf === true || crlf === undefined) this.fire('$send', data + '\r\n');
		else this.fire('$send', data);

		this.sendSilent(data, crlf);
	}.bind(this);

	this.sendSilent = function(data, crlf)
	{
		if(crlf === true || crlf === undefined) this.client.write(data + '\r\n');
		else this.client.write(data);
	}.bind(this);

	this.reconnect = function()
	{
		this.client.end();
		this.client.destroy();
	}.bind(this);

	this.quit = function()
	{
		this.willQuit = true;

		for(var kModule in this.modules)
		{
			this.rmModule(kModule, false);
		}

		if(this.client !== undefined) this.client.end();

		for(var kServer in context.servers)
		{
			if(context.servers[kServer] === this) delete context.servers[kServer];
		}
	}.bind(this);

	if(typeof host === 'object')
	{
		var config = host;
		var pconfig = port;

		this.config = config;
		this.pconfig = pconfig;

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

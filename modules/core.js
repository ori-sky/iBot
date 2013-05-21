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

var Server = require('../iBot-Server');
var User = require('../iBot-User');
var Channel = require('../iBot-Channel');

exports.mod = function(context)
{
	this._loaded = function(server)
	{
		server.send('VERSION');
	}

	this.$recv = function(server, prefix, opcode, params)
	{
		switch(opcode)
		{
			case '004': // RPL_MYINFO
				server.fire('004', server, prefix, params[1], params[2], params[3], params[4], params.slice(5));
			case '005': // RPL_ISUPPORT
				server.fire('005', server, prefix, params.slice(1, params.length - 1), params[params.length - 1]);
				break;
			case '352': // RPL_WHOREPLY
				var split = params[7].split(' ');
				server.fire('352', server, prefix, params[1], params[2], params[3], params[4], params[5], params[6], split[0], split[1]);
				break;
			case '353': // RPL_NAMREPLY
				server.fire('353', server, prefix, params[1], params[2], params[3].split(' '));
				break;
			case '376': // RPL_ENDOFMOTD
				server.fire('376', server, prefix, params[1]);
				break;
			case 'PING':
				server.fire('ping', server, prefix, params[0]);
				server.send('PONG :' + params[0]);
				break;
			case 'PONG':
				server.fire('pong', server, prefix, params[0], params[1]);
				server.ponged = true;
				break;
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				server.fire('privmsg', server, prefix, target, params[1], words);
				break;
			case 'JOIN':
				server.fire('join', server, prefix, params[0]);
				break;
			case 'NICK':
				server.fire('nick', server, prefix, params[0]);
				break;
			case 'QUIT':
				server.fire('quit', server, prefix, params[0]);
				break;
			case 'PART':
				server.fire('part', server, prefix, params[0], params[1]);
				break;
			case 'KICK':
				server.fire('kick', server, prefix, params[0], params[1], params[2]);
				break;
			case 'MODE':
				server.fire('mode_raw', server, prefix, params[0], params[1], params.slice(2));
				break;
		}
	}

	this.core$004 = function(server, prefix, servername, version, usermodes, chanmodes, extra)
	{
		var data = server.get();
		if(typeof data.myinfo === 'undefined') data.myinfo = {};
		data.myinfo.servername = servername;
		data.myinfo.version = version;
		data.myinfo.usermodes = usermodes;
		data.myinfo.chanmodes = chanmodes;
		data.myinfo.extra = extra;
	}

	this.core$005 = function(server, prefix, options, message)
	{
		var data = server.get();
		if(typeof data.isupport === 'undefined') data.isupport = {};

		for(var i=0; i<options.length; ++i)
		{
			var parts = options[i].split('=');
			if(typeof parts[1] === 'undefined') parts[1] = '';
			data.isupport[parts[0]] = parts[1];
		}
	}

	this.core$352 = function(server, prefix, channel, ident, host, serverhost, nick, extrainfo, hopcount, realname)
	{
		if(server.channels[channel] !== 'undefined')
		{
			server.users[nick].ident = ident;
			server.users[nick].host = host;
			server.users[nick].realname = realname;
		}
	}

	this.core$353 = function(server, prefix, channelPrefix, channel, names)
	{
		var split1 = server.get().isupport.PREFIX.split(')');
		var split2 = split1[0].split('(');

		for(var i=0; i<names.length; ++i)
		{
			if(split1[1].indexOf(names[i][0]) !== -1)
			{
				names[i] = names[i].substr(1);
			}

			if(typeof server.users[names[i]] === 'undefined')
			{
				server.users[names[i]] = new User(names[i], null, null, null);
			}

			server.users[names[i]].channels[channel] = server.channels[channel];
			server.channels[channel].users[names[i]] = server.users[names[i]];
		}

		server.send('WHO ' + channel);
	}

	this.core$privmsg = function(server, prefix, target, message, words)
	{
		var cmd = undefined;
		var params = undefined;

		if(words[0][0] === '!')
		{
			cmd = words[0].substr(1);
			params = words.slice(1);
		}
		else if(new RegExp('^' + server.user.nick + '[\,\:]?$', 'i').test(words[0]))
		{
			for(var i=1; i<words.length; ++i)
			{
				if(words[i] !== '')
				{
					cmd = words[i];
					params = words.slice(i + 1);
					break;
				}
			}
		}

		if(cmd !== undefined) server.fire('cmdraw', server, prefix, target, cmd, params);
	}

	this.core$cmdraw = function(server, prefix, target, cmd, params)
	{
		var paramsFiltered = params.filter(function(element, i, arr)
		{
			return (element !== '');
		});

		server.fire('cmd', server, prefix, target, cmd, paramsFiltered);

		switch(cmd)
		{
			case 'do': // novelty
				if(server.master.test(prefix.mask))
				{
					server.send('PRIVMSG ' + target + ' :/' + params.join(' '));
					server.fire('cmdraw', server, prefix, target, params[0], params.slice(1));
				}
				break;
			case 'do-r':
				if(server.master.test(prefix.mask))
				{
					var p = []
					for(var i=0; i<params[0]; ++i) p.push('do');
					for(var i=1; i<params.length; ++i) p.push(params[i]);
					server.fire('cmdraw', server, prefix, target, 'do', p);
				}
				break;
		}
	}

	this.core$join = function(server, prefix, channel)
	{
		
		if(typeof server.users[prefix.nick] === 'undefined')
		{
			server.users[prefix.nick] = new User(prefix.nick, prefix.ident, prefix.host, null);
		}

		if(typeof server.channels[channel] === 'undefined')
		{
			server.channels[channel] = new Channel(channel);
		}

		server.users[prefix.nick].channels[channel] = server.channels[channel];
		server.channels[channel].users[prefix.nick] = server.users[prefix.nick];
	}

	this.core$nick = function(server, prefix, nick)
	{
		server.users[nick] = server.users[prefix.nick];
		server.users[nick].nick = nick;
		delete server.users[prefix.nick];
	}

	this.core$quit = function(server, prefix, message)
	{
		if(typeof server.users[prefix.nick] !== 'undefined')
		{
			delete server.users[prefix.nick];
		}

		for(var kChannel in server.channels)
		{
			if(typeof server.channels[kChannel].users[prefix.nick] !== 'undefined')
			{
				delete server.channels[kChannel].users[prefix.nick];
			}
		}
	}

	this.core$part = function(server, prefix, channel, message)
	{
		if(typeof server.users[prefix.nick] !== 'undefined')
		{
			delete server.users[prefix.nick].channels[channel];

			if(server.users[prefix.nick] !== server.user && Object.keys(server.users[prefix.nick].channels).length === 0)
			{
				delete server.users[prefix.nick];
			}
		}

		if(typeof server.channels[channel] !== 'undefined')
		{
			delete server.channels[channel].users[prefix.nick];

			if(server.users[prefix.nick] === server.user)
			{
				delete server.channels[channel];
			}
		}
	}

	this.core$kick = function(server, prefix, channel, target, message)
	{
		if(typeof server.users[target] !== 'undefined')
		{
			delete server.users[target].channels[channel];

			if(server.users[target] !== server.user && Object.keys(server.users[target].channels).length === 0)
			{
				delete server.users[target];
			}
		}

		if(typeof server.channels[channel] !== 'undefined')
		{
			delete server.channels[channel].users[channel];

			if(server.users[target] === server.user)
			{
				delete server.channels[channel];
			}
		}
	}

	this.core$mode_raw = function(server, prefix, channel, modestring, params)
	{
		var plus = true;
		var index = 0;
		var parts = server.get().isupport.CHANMODES.split(',');

		for(var i=0; i<modestring.length; ++i)
		{
			if(modestring[i] === '+') plus = true;
			else if(modestring[i] === '-') plus = false;
			else
			{
				/*
				 * # 0 = Mode that adds or removes a nick or address to a list. Always has a parameter.
				 * # 1 = Mode that changes a setting and always has a parameter.
				 * # 2 = Mode that changes a setting and only has a parameter when set.
				 * # 3 = Mode that changes a setting and never has a parameter.
				 */
				
				var section = -1;
				for(var p=0; p<parts.length; ++p)
				{
					if(parts[p].indexOf(modestring[i]) !== -1)
					{
						section = p;
						break;
					}
				}
				if(section === -1) section = 1; // mode is either broken or a prefix mode
				
				if(section === 0 || section === 1 || (section === 2 && plus)) 
				{
					server.fire('mode', server, prefix, channel, plus, modestring[i], params[index]);
					++index;
				} 
				else 
				{
					server.fire('mode', server, prefix, channel, plus, modestring[i], null);
				}
			}
		}
	}

	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'lmsrv':
				if(server.master.test(prefix.mask))
				{
					var modules = params[0];
					var name = params[1];
					var srv = server;
					if(name !== undefined) srv = context.servers[name];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						var result = context.loadModule(modules[i], srv);
						if(result !== '') server.send('PRIVMSG ' + target + ' :' + result);
						else server.send('PRIVMSG ' + target + ' :Loaded module: ' + modules[i]);
					}
				}
				break;
			case 'lmctx':
				if(server.master.test(prefix.mask))
				{
					var modules = params[0];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						var result = context.loadModule(modules[i]);
						if(result !== '') server.send('PRIVMSG ' + target + ' :' + result);
						else server.send('PRIVMSG ' + target + ' :Loaded module: ' + modules[i]);
					}
				}
				break;
			case 'umsrv':
				if(server.master.test(prefix.mask))
				{
					var modules = params[0];
					var name = params[1];
					var srv = server;
					if(name !== undefined) srv = context.servers[name];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						context.unloadModule(modules[i], srv);
						server.send('PRIVMSG ' + target + ' :Unloaded module: ' + modules[i]);
					}
				}
				break;
			case 'umctx':
				if(server.master.test(prefix.mask))
				{
					var modules = params[0];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						context.unloadModule(modules[i]);
						server.send('PRIVMSG ' + target + ' :Unloaded module: ' + modules[i]);
					}
				}
				break;
			case 'addsrv':
				if(server.master.test(prefix.mask))
				{
					var syntax = 'Syntax: addsrv <name> <host> <nick> [ident] [port] [ssl true/false] [master regular!exp@ression] [modules one,two,etc]';
					var name = params[0];
					var host = params[1];
					var nick = params[2];
					var ident = params[3];
					var port = parseInt(params[4]);
					var ssl = params[5];
					var master = params[6]
					var modules = params[7];

					if(nick === undefined) { server.send('PRIVMSG ' + target + ' :' + syntax); break; }
					if(ident === undefined) ident = 'ibot';
					if(isNaN(port)) port = 6667;
					ssl = ssl === 'true';

					if(master === undefined) master = /./;
					else master = new RegExp(master); // TODO: case insensitive?

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					if(context.servers[name] !== undefined) context.servers[name].quit();

					context.servers[name] = new Server(context, host, port, nick, ident, false, ssl);
					context.servers[name].master = master;

					for(var i=0; i<modules.length; ++i)
					{
						context.loadModule(modules[i], context.servers[name]);
					}

					context.servers[name].connect();
					server.send('PRIVMSG ' + target + ' :done');
				}
				break;
			case 'rmsrv':
				if(server.master.test(prefix.mask))
				{
					var syntax = 'Syntax: rmsrv <name>';
					var name = params[0];

					if(name === undefined) { server.send('PRIVMSG ' + target + ' :' + syntax); break; }

					context.servers[name].quit();
					server.send('PRIVMSG ' + target + ' :done');
				}
				break;
			case 'modules':
				var name = params[0];
				var srv = server;
				if(server.master.test(prefix.mask) && name !== undefined) srv = context.servers[name];

				server.send('PRIVMSG ' + target + ' :Modules: ' + srv.getModules(', '));
				break;
			case 'servers':
				server.send('PRIVMSG ' + target + ' :Servers: ' + Object.keys(context.servers).join(', '));
				break;
			case 'quit':
				if(server.master.test(prefix.mask))
				{
					server.quit();
				}
				break;
			case 'save':
				context.save();
				server.send('PRIVMSG ' + target + ' :Config saved to disk.');
				break;
			case 'rehash':
				context.load();
				server.send('PRIVMSG ' + target + ' :Config rehashed from disk.');
				break;
		}
	}

	this._cmd = function(server, prefix, target, cmd, params)
	{
		console.log(target);
		console.log(cmd);
		console.log(params);
		server.fire('cmdraw', server, prefix, target, cmd, params);
	}
}

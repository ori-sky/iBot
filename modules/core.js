/*
 * Copyright (c) 2013, David Farrell <shokku.ra@gmail.com>
 *                     Quora Dodrill <quora@lavabit.com>
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

exports.mod = function(context, server)
{
	this.cmd_prefix = '!';
	this.log_colors = true;

	this.messageLoopInterval = undefined;
	this.messageQueue = [];

	this.log_current_message = true;

	this._load = function(data)
	{
		if(data.cmd_prefix !== undefined) this.cmd_prefix = data.cmd_prefix;
		if(data.log_colors !== undefined) this.log_colors = data.log_colors;
	}

	this._save = function()
	{
		return {
			cmd_prefix: this.cmd_prefix,
			log_colors: this.log_colors
		};
	}

	this._suspend = function()
	{
		if(this.messageLoopInterval !== undefined) clearInterval(this.messageLoopInterval);
		if(this.pingInterval !== undefined) clearInterval(this.pingInterval);
	}

	this._loaded = function()
	{
		if(this.messageLoopInterval === undefined)
		{
			this.mq_count = 0;
			this.messageLoopInterval = setInterval(function()
			{
				try
				{
					if(this.mq_count < 3)
					{
						var elements = this.messageQueue.splice(0, 1);

						for(var i=0; i<elements.length; ++i)
						{
							server.send(elements[i], false);
							++this.mq_count;
						}
					}

					this.mq_count -= 0.4;
					if(this.mq_count < 0) this.mq_count = 0;
				}
				catch(e)
				{
					console.log(e);
				}
			}.bind(this), 500);
		}

		if(this.pingInterval === undefined)
		{
			this.hasPonged = true;
			this.pingInterval = setInterval(function()
			{
				if(this.hasPonged)
				{
					this.hasPonged = false;
					server.send('PING :keepalive');
				}
				else
				{
					server.reconnect();
					this.hasPonged = true;
				}
			}.bind(this), 180000);
		}

		if(server.isConnected)
		{
			server.do('core$send', 'VERSION');
		}
	}

	this._unloaded = function()
	{
		if(this.messageLoopInterval !== undefined) clearInterval(this.messageLoopInterval);
		if(this.pingInterval !== undefined) clearInterval(this.pingInterval);
	}

	this.$send = function(data)
	{
		server.do('log$log_interleaved', 'err', ['-> ', data]);
	}

	this.$recv = function(prefix, opcode, params, data)
	{
		switch(opcode)
		{
			case 'CAP':
				server.fire('cap', prefix, params[1], params.slice(2));
				break;
			case '001':
				server.fire('001', prefix, params.slice(1));
				break;
			case '002':
				server.fire('002', prefix, params[1], params[2]);
				break;
			case '003':
				server.fire('003', prefix, params[1], params[2]);
				break;
			case '004': // RPL_MYINFO
				server.fire('004', prefix, params[1], params[2], params[3], params[4], params.slice(5));
			case '005': // RPL_ISUPPORT
				server.fire('005', prefix, params.slice(1, params.length - 1), params[params.length - 1]);
				break;
			case '352': // RPL_WHOREPLY
				var split = params[7].split(' ');
				server.fire('352', prefix, params[1], params[2], params[3], params[4], params[5], params[6], split[0], split[1]);
				break;
			case '353': // RPL_NAMREPLY
				server.fire('353', prefix, params[1], params[2], params[3].split(' '));
				break;
			case '376': // RPL_ENDOFMOTD
				server.fire('376', prefix, params[1]);
				break;
			case 'PING':
				server.fire('ping', prefix, params[0]);
				server.send('PONG :' + params[0]);
				break;
			case 'PONG':
				server.fire('pong', prefix, params[0], params[1]);
				this.hasPonged = true;
				break;
			case 'PRIVMSG':
				var words = params[1].split(' ');
				var target = params[0];
				if(target === server.user.nick) target = prefix.nick;

				server.fire('privmsg', prefix, target, params[1], words);
				break;
			case 'NOTICE':
				var words = params[1].split(' ');
				var target = params[0];
				server.fire('notice', prefix, target, params[1], words);
			case 'JOIN':
				server.fire('join', prefix, params[0]);
				break;
			case 'NICK':
				server.fire('nick', prefix, params[0]);
				break;
			case 'QUIT':
				server.fire('quit', prefix, params[0]);
				break;
			case 'PART':
				server.fire('part', prefix, params[0], params[1]);
				break;
			case 'KICK':
				server.fire('kick', prefix, params[0], params[1], params[2]);
				break;
			case 'MODE':
				server.fire('mode_raw', prefix, params[0], params[1], params.slice(2));
				break;
		}

		if(this.log_current_message === true)
		{
			if(this.log_colors === true)
			{
				var log_params = ['<-', ''];
				if(prefix !== null)
				{
					log_params.push(' \x1b[35m\x1b[1m');
					log_params.push(prefix.mask);
				}

				log_params.push('\x1b[0m \x1b[31m\x1b[1m');
				log_params.push(opcode);

				for(var i=0; i<params.length; ++i)
				{
					if(i % 2 === 1)	log_params.push('\x1b[0m \x1b[33m\x1b[1m');
					else		log_params.push('\x1b[0m \x1b[32m\x1b[1m');
					log_params.push(params[i]);
				}

				log_params.push('\x1b[0m');

				server.do('log$log_interleaved', 'err', log_params);
			}
			else
			{
				server.fire('$log', '<- ' + data, 'err');
			}
		}

		this.log_current_message = true;
	}

	this.core$004 = function(prefix, servername, version, usermodes, chanmodes, extra)
	{
		var data = server.get();
		if(typeof data.myinfo === 'undefined') data.myinfo = {};
		data.myinfo.servername = servername;
		data.myinfo.version = version;
		data.myinfo.usermodes = usermodes;
		data.myinfo.chanmodes = chanmodes;
		data.myinfo.extra = extra;
	}

	this.core$005 = function(prefix, options, message)
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

	this.core$352 = function(prefix, channel, ident, host, serverhost, nick, extrainfo, hopcount, realname)
	{
		if(server.channels[channel] !== 'undefined')
		{
			server.users[nick].ident = ident;
			server.users[nick].host = host;
			server.users[nick].realname = realname;
		}
	}

	this.core$353 = function(prefix, channelPrefix, channel, names)
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
	}

	this.core$privmsg = function(prefix, target, message, words)
	{
		if(message[0] === '\x01' && message[message.length - 1] === '\x01')
		{
			var opcode = words[0].substr(1);
			var start_pos = words[0].length + 1;
			var data = message.substr(start_pos, message.length - start_pos - 1);
			var w = data.split(' ');

			server.fire('ctcp_request', prefix, target, opcode, data, w);
		}

		var cmd = undefined;
		var params = undefined;

		if(words[0][0] === this.cmd_prefix)
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
		else if(this._is_query(target))
		{
			cmd = words[0];
			params = words.slice(1);
		}

		if(cmd !== undefined) server.fire('cmdraw', prefix, target, cmd, params);
	}

	this.core$notice = function(prefix, target, message, words)
	{
		if(message[0] === '\x01' && message[message.length - 1] === '\x01')
		{
			var opcode = words[0].substr(1);
			var start_pos = words[0].length + 1;
			var data = message.substr(start_pos, message.length - start_pos - 1);
			var w = data.split(' ');

			server.fire('ctcp_reply', prefix, target, opcode, data, w);
		}
	}

	this.core$cmdraw = function(prefix, target, cmd, params, $core)
	{
		var paramsFiltered = params.filter(function(element, i, arr)
		{
			return (element !== '');
		});

		server.fire('cmd', prefix, target, cmd, paramsFiltered);

		switch(cmd)
		{
			case 'do':
				if($core._authed(prefix))
				{
					server.do('core$privmsg', target, '/' + params.join(' '));
					server.do('core$cmd', prefix, target, params[0], params.slice(1));
				}
				break;
			case 'do-r':
				if($core._authed(prefix))
				{
					var p = []
					for(var i=0; i<params[0]; ++i) p.push('do');
					for(var i=1; i<params.length; ++i) p.push(params[i]);
					server.do('core$cmd', prefix, target, 'do', p);
				}
				break;
			case 'times':
				if($core._authed(prefix))
				{
					for(var i=0; i<params[0]; ++i)
					{
						server.do('core$cmd', prefix, target, params[1], params.slice(2));
					}
				}
				break;
		}
	}

	this.core$join = function(prefix, channel)
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

		if(prefix.nick === server.user.nick)
		{
			server.do('core$send', 'WHO ' + channel);
		}
	}

	this.core$nick = function(prefix, nick)
	{
		server.users[nick] = server.users[prefix.nick];
		server.users[nick].nick = nick;
		delete server.users[prefix.nick];

		for(var c in server.users[nick].channels)
		{
			server.users[nick].channels[c].users[nick] = server.users[nick];
			delete server.users[nick].channels[c].users[prefix.nick];
		}
	}

	this.core$quit = function(prefix, message)
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

	this.core$part = function(prefix, channel, message)
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

	this.core$kick = function(prefix, channel, target, message)
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

	this.core$mode_raw = function(prefix, channel, modestring, params)
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
					server.fire('mode', prefix, channel, plus, modestring[i], params[index]);
					++index;
				} 
				else 
				{
					server.fire('mode', prefix, channel, plus, modestring[i], null);
				}
			}
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		switch(cmd)
		{
			case 'lmsrv':
				if($core._authed(prefix))
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
						if(result !== '') server.do('core$privmsg', target, result);
						else server.do('core$privmsg', target, 'Loaded module: ' + modules[i]);
					}
				}
				break;
			case 'lmctx':
				if($core._authed(prefix))
				{
					var modules = params[0];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						var result = context.loadModule(modules[i]);
						if(result !== '') server.do('core$privmsg', target, result);
						else server.do('core$privmsg', target, 'Loaded module: ' + modules[i]);
					}
				}
				break;
			case 'umsrv':
				if($core._authed(prefix))
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
						server.do('core$privmsg', target, 'Unloaded module: ' + modules[i]);
					}
				}
				break;
			case 'umctx':
				if($core._authed(prefix))
				{
					var modules = params[0];

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					for(var i=0; i<modules.length; ++i)
					{
						context.unloadModule(modules[i]);
						server.do('core$privmsg', target, 'Unloaded module: ' + modules[i]);
					}
				}
				break;
			case 'addsrv':
				if($core._authed(prefix))
				{
					var syntax = 'Syntax: addsrv <name> <host> <nick> [ident] [port] [ssl true/false] [master regular!exp@ression] [modules one,two,etc] [pass]';
					var name = params[0];
					var host = params[1];
					var nick = params[2];
					var ident = params[3];
					var port = parseInt(params[4]);
					var ssl = params[5];
					var master = params[6]
					var modules = params[7];
					var pass = params[8];

					if(nick === undefined) { server.do('core$privmsg', target, syntax); break; }
					if(ident === undefined) ident = 'ibot';
					if(isNaN(port)) port = 6667;
					ssl = ssl === 'true';

					if(master === undefined) master = /^$/;
					else master = new RegExp(master);

					if(modules === undefined) modules = [];
					else modules = modules.split(',');

					if(context.servers[name] !== undefined) context.servers[name].quit();

					var config = {
						host: host,
						port: port,
						nick: nick,
						ident: ident,
						pass: pass,
						ssl: ssl,
						master: master
					};

					context.addServer(name, config);

					for(var i=0; i<modules.length; ++i)
					{
						context.loadModule(modules[i], context.servers[name]);
					}

					context.servers[name].connect();
					server.do('core$privmsg', target, 'Done');
				}
				break;
			case 'rmsrv':
				if($core._authed(prefix))
				{
					var syntax = 'Syntax: rmsrv <name>';
					var name = params[0];

					if(name === undefined) { server.do('core$privmsg', target, syntax); break; }

					context.servers[name].quit();
					server.do('core$privmsg', target, 'Done');
				}
				break;
			case 'getmaster':
				if($core._authed(prefix))
				{
					var name = params[0];
					var srv = server;

					if(name !== undefined) srv = context.servers[name];

					$core._privmsg(target, 'Master: ' + srv.master.source);
				}
				break;
			case 'setmaster':
				if($core._authed(prefix))
				{
					var syntax = 'Syntax: setmaster <master regular!exp@ression> [server name]';
					var master = params[0];
					var name = params[1];
					var srv = server;

					if(master === undefined) { $core._privmsg(target, syntax); break; }
					if(name !== undefined) srv = context.servers[name];

					master = new RegExp(master);
					srv.master = master;

					$core._privmsg(target, 'Done');
				}
				break;
			case 'getsrvaddr':
				if($core._authed(prefix))
				{
					var name = params[0];
					var srv = server;

					if(name !== undefined) srv = context.servers[name];

					$core._privmsg(target, 'Server address: ' + srv.host);
				}
				break;
			case 'setsrvaddr':
				if($core._authed(prefix))
				{
					var syntax = 'Syntax: setsrvaddr <addr> [server name]';
					var addr = params[0];
					var name = params[1];
					var srv = server;

					if(addr === undefined) { $core._privmsg(target, syntax); break; }
					if(name !== undefined) srv = context.servers[name];

					srv.host = addr;
					$core._privmsg(target, 'Done');
				}
				break;
			case 'modules':
				var name = params[0];
				var srv = server;
				if($core._authed(prefix) && name !== undefined) srv = context.servers[name];

				server.do('core$privmsg', target, 'Modules: ' + srv.getModules(', '));
				break;
			case 'servers':
				server.do('core$privmsg', target, 'Servers: ' + Object.keys(context.servers).join(', '));
				break;
			case 'quit':
				if($core._authed(prefix))
				{
					if(params[0] === 'all') context.quit();
					else server.quit();
				}
				break;
			case 'save':
				if($core._authed(prefix))
				{
					context.save();
					server.do('core$privmsg', target, 'Config written.');
				}
				break;
			case 'rehash':
				if($core._authed(prefix))
				{
					context.load();
					server.do('core$privmsg', target, 'Config rehashed.');
				}
				break;
			case 'clrmsgq':
				if($core._authed(prefix))
				{
					this.messageQueue = [];
					server.do('core$privmsg', target, 'Done.');
				}
				break;
		}
	}

	this._authed = function(prefix, priv, level)
	{
		if(level === undefined || typeof level === 'object' || typeof level === 'string')
		{
			level = 1000000000;
		}

		if(server.master.test(prefix.mask)) return true;
		if(prefix === '*') return true;
		if(server.do('account$authed', prefix, priv, level) === true) return true;
		return false;
	}

	this._send = function(data, crlf)
	{
		data = data.toString();
		var d = data + ((crlf !== false) ? '\r\n' : '');
		this.messageQueue.push(d);
	}

	this._hide_current_message = function()
	{
		this.log_current_message = false;
		return this.log_current_message;
	}

	this._cmd = function(prefix, target, cmd, params)
	{
		server.fire('cmdraw', prefix, target, cmd, params);
	}

	this._privmsg = function(target, msg)
	{
		msg = msg.toString();
		this._send('PRIVMSG ' + target + ' :' + msg.replace(/[\r\n]/g, ''));
	}

	this._notice = function(target, msg)
	{
		msg = msg.toString();
		this._send('NOTICE ' + target + ' :' + msg.replace(/[\r\n]/g, ''));
	}

	this._join = function(channel)
	{
		channel = channel.toString();
		this._send('JOIN ' + channel.replace(/[\r\n]/g, ''));
	}

	this._ctcp_request = function(target, opcode, data)
	{
		target = target.toString().replace(/[\r\n]/g, '');
		opcode = opcode.toString().replace(/[\r\n]/g, '');
		data = data.toString().replace(/[\r\n]/g, '');
		this._send('PRIVMSG ' + target + ' :\x01' + opcode + ' ' + data + '\x01');
	}

	this._is_query = function(target)
	{
		var data = server.get();
		var chantypes = (data.isupport !== undefined) ? data.isupport.CHANTYPES : '#&+!';
		return chantypes.indexOf(target[0]) === -1;
	}
}

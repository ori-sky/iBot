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

var util = require('util');
var fs = require('fs');

var Server = require('./iBot-Server');

module.exports = function(configPath)
{
	this.servers = {};

	this.start = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].connect();
		}
	}

	this.run = this.start;

	this.load = function(all)
	{
		fs.readFile(configPath, function(err, data)
		{
			if(err) console.log(err);
			else
			{
				try
				{
					this.config = JSON.parse(data);

					if(all === true)
					{
						if(this.config.servers !== undefined)
						{
							for(var kServer in this.config.servers)
							{
								this.servers[kServer] = new Server(this, this.config.servers[kServer]);
							}
						}

						if(this.config.modules !== undefined)
						{
							for(var kModule in this.config.modules)
							{
								this.loadModule(this.config.modules[kModule]);
							}
						}

						this.start();
						this.save();
					}
					else
					{
						if(this.config.servers !== undefined)
						{
							for(var kServer in this.config.servers)
							{
								this.servers[kServer].config = this.config.servers[kServer];
							}
						}
					}
				}
				catch(e)
				{
					console.log('Errors parsing config file:');
					console.log(e.stack);
				}
			}
		}.bind(this));
	}

	this.save = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].save();
		}

		var s = JSON.stringify(this.config, null, 2) + '\n';

		if(s !== undefined)
		{
			fs.writeFile(configPath, s, function(err)
			{
				if(err) console.log(err);
				else console.log('Saved config to ' + util.inspect(configPath));
			}.bind(this));
		}
	}

	this.loadModule = function(name, server)
	{
		var path = undefined;

		try
		{
			path = process.cwd() + '/modules/' + name;
			require.resolve(path);
			if(!fs.existsSync(require.resolve(path))) throw new Error('Local module does not exist');
		}
		catch(e1)
		{
			try
			{
				path = './modules/' + name;
				if(!fs.existsSync(require.resolve(path))) throw new Error('iBot module does not exist');
			}
			catch(e2)
			{
				console.log(e1.message);
				console.log(e2.message);
				return e1.message + ' | ' + e2.message;
			}
		}

		try
		{
			if(typeof require.cache[require.resolve(path)] !== 'undefined') delete require.cache[require.resolve(path)];
			var module = require(path);

			if(typeof server === 'undefined' || server === null)
			{
				for(var kServer in this.servers)
				{
					var mod = new module.mod(this);
					this.servers[kServer].addModule(name, mod);
				}
			}
			else
			{
				var mod = new module.mod(this);
				server.addModule(name, mod);
			}

			console.log('Loaded module: ' + name);
			return '';
		}
		catch(e)
		{
			console.log('Failed to load module: ' + name);
			console.log(e.stack);
			return e.message;
		}
	}

	this.unloadModule = function(name, server)
	{
		if(server === undefined)
		{
			for(var kServer in this.servers)
			{
				this.servers[kServer].rmModule(name);
			}
		}
		else
		{
			server.rmModule(name);
		}

		console.log('Unloaded module: ' + name);
	}

	// JSON config

	this.load(true);
}

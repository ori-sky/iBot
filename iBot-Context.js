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
		var s = JSON.stringify(this.config, null, 2);

		if(s !== undefined)
		{
			fs.writeFile(configPath + '.new', s, function(err)
			{
				if(err) console.log(err);
				else console.log('Saved config to ' + util.inspect(configPath + '.new'));
			}.bind(this));
		}
	}

	this.loadModule = function(name, server)
	{
		var path;

		try
		{
			path = process.cwd() + '/modules/' + name;
			if(typeof require.cache[path] !== 'undefined') delete require.cache[path];
			require.resolve(path);
		}
		catch(e)
		{
			try
			{
				path = './modules/' + name;
				require.resolve(path);
			}
			catch(e2)
			{
				console.log(e.message);
				console.log(e2.message);
				return e.message + ' | ' + e2.message;
			}
		}

		try
		{
			if(typeof require.cache[require.resolve(path)] !== 'undefined')
			{
				delete require.cache[require.resolve(path)];
			}

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

exports.Context = function()
{
	this.servers = {};

	this.logChannels =
	{
		out: process.stdout,
		err: process.stderr
	};

	this.start = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].connect();
		}
	}

	this.log = function(logChannel, message)
	{
		this.logChannels[logChannel].write(message);
	}

	this.loadModule = function(name, server)
	{
		var module = require('./mod_' + name + '.js');
		var mod = new module.mod(this);

		if(server === null)
		{
			for(var kServer in this.servers)
			{
				this.servers[kServer].modules[name] = mod;
			}
		}
		else
		{
			server.modules[name] = mod;
		}

		console.error('Loaded mod_' + name);
	}

	this.reloadModule = function(name, server)
	{
		if(typeof require.cache[require.resolve('./mod_' + name + '.js')] !== 'undefined')
		{
			delete require.cache[require.resolve('./mod_' + name + '.js')];
		}

		this.loadModule(name, server);
	}

	this.unloadModule = function(name, server)
	{
		if(server === null)
		{
			for(var kServer in this.servers)
			{
				this.servers[kServer].modules[name] = null;
				delete this.servers[kServer].modules[name];
			}
		}
		else
		{
			server.modules[name] = null;
			delete server.modules[name];
		}

		console.error('Unloaded mod_' + name);
	}
}

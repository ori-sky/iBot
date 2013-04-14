exports.Context = function()
{
	this.servers = {};

	this.start = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].connect();
		}
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
}

module.exports = function(options)
{
	this.options = options;
	this.servers = {};

	this.start = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].connect();
		}
	}

	this.run = this.start;

	this.loadModule = function(name, server)
	{
		var path;

		try
		{
			if(typeof this.options === 'undefined') this.options = {};
			if(typeof this.options.modulesPath === 'undefined') this.options.modulesPath = process.cwd() + '/modules';
			path = this.options.modulesPath + '/' + name;
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
			var mod = new module.mod(this);

			if(typeof mod.data === 'undefined') mod.data = {};

			if(typeof server === 'undefined' || server === null)
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

			console.log('out', 'Loaded module: ' + name);
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

		console.log('Unloaded module: ' + name);
	}
}

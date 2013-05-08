var Server = require('./iBot-Server');

module.exports = function(config)
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

			// TODO: find a better way to do this
			//var mod = new module.mod(this);

			if(typeof server === 'undefined' || server === null)
			{
				for(var kServer in this.servers)
				{
					// TODO: find a better way to do this
					var mod = new module.mod(this);
					if(typeof mod.data === 'undefined') mod.data = {};

					this.servers[kServer].modules[name] = mod;
					this.servers[kServer].do(name + '$loaded', this.servers[kServer]);
				}
			}
			else
			{
				// TODO: find a better way to do this
				var mod = new module.mod(this);
				if(typeof mod.data === 'undefined') mod.data = {};

				server.modules[name] = new module.mod(this);
				server.do(name + '$loaded', server);
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
		if(server === undefined)
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

	// JSON config
	if(config !== undefined)
	{
		if(config.servers !== undefined)
		{
			for(var kServer in config.servers)
			{
				this.servers[kServer] = new Server(true, config.server[kServer]);
			}
		}

		if(config.modules !== undefined)
		{
			for(var kModule in config.modules)
			{
				this.loadModule(config.modules[kModule]);
			}
		}
	}
}

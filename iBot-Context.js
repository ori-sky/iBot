var util = require('util');

module.exports = function(options)
{
	this.options = options;
	this.servers = {};

	this.lc =
	{
		urgent: process.stdout,
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
		message = util.inspect(message);
		this.logUnsafe(logChannel, message);
	}

	this.logUnsafe = function(logChannel, message)
	{
		this.lc[logChannel].write(message + '\n');
	}

	this.loadModule = function(name, server)
	{
		var path;

		try
		{
			path = this.options.modulesPath + '/' + name;
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
				this.log('urgent', e.message);
				this.log('urgent', e2.message);
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

			this.log('out', 'Loaded module: ' + name);
			return '';
		}
		catch(e)
		{
			this.log('out', 'Failed to load module: ' + name);
			this.logUnsafe('urgent', e.stack);
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

		this.log('out', 'Unloaded module: ' + name);
	}
}

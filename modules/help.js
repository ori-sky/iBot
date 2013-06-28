exports.mod = function(context, server)
{
	this.registers = {};
	
	this.$loaded = function(name)
	{
		server.fire('register^' + name);
	}

	this._loaded = function()
	{
		server.fire('register');
	}

	this._register = function(topic, $sender, $name)
	{
		this.registers[topic] = $name;
	}

	this.$unloaded = function(name)
	{
		if(this.registers[name] !== undefined) delete this.registers[name];
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		switch(cmd)
		{
			case 'help':
				var syntax = 'Syntax: help <topic>';
				var topic = params[0];

				if(topic === undefined)
				{
					$core._privmsg(target, syntax);
					break;
				}

				if(this.registers[topic] === undefined)
				{
					$core._privmsg(target, 'No help available for \'' + topic + '\'');
					break;
				}

				var h = server.do(this.registers[topic] + '$help', topic, params.slice(1));

				if(h === undefined || h === '')
				{
					$core._privmsg(target, 'No help available for \'' + topic + '\'');
					break;
				}

				$core._privmsg(target, topic + ': ' + h);
				break;
		}
	}
}

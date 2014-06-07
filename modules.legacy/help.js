exports.mod = function(context, server)
{
	this.topics = {};
	
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
		this.topics[topic] = $name;
	}

	this.$unloaded = function(name)
	{
		if(this.topics[name] !== undefined) delete this.topics[name];
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		switch(cmd)
		{
			case 'help':
				var syntax = 'Syntax: help <topic>';
				var topic = params[0];
				var topic_all = params.join(' ');

				if(topic === undefined)
				{
					$core._privmsg(target, syntax);
					$core._privmsg(target, 'Topics: ' + Object.keys(this.topics).join(', '));
					break;
				}

				if(this.topics[topic] === undefined)
				{
					$core._privmsg(target, 'No help available for \'' + topic + '\'');
					break;
				}

				var h = server.do(this.topics[topic] + '$help', topic, params.slice(1));

				if(h === undefined)
				{
					$core._privmsg(target, 'No help available for \'' + topic + '\'');
					break;
				}

				if(typeof h === 'string')
				{
					$core._privmsg(target, topic_all + ': ' + h);
					break;
				}
				else if(typeof h === 'object')
				{
					if(h.text !== undefined)
					{
						$core._privmsg(target, topic_all + ': ' + h.text);
					}

					if(h.sub !== undefined)
					{
						$core._privmsg(target, 'Sub-topics: ' + h.sub.join(', '));
					}
				}

				break;
		}
	}
}

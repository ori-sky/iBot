var util = require('util');

exports.mod = function(context)
{
	this.join = [];
	this.perform = [];

	this._load = function(data)
	{
		if(typeof data.join !== 'undefined') this.join = data.join;
		if(typeof data.perform !== 'undefined') this.perform = data.perform;
	}

	this._save = function()
	{
		return {
			join: this.join,
			perform: this.perform
		};
	}

	this.core$376 = function(server, prefix, message)
	{
		for(var i in this.join)
		{
			server.send('JOIN ' + this.join[i]);
		}

		for(var i in this.perform)
		{
			server.send(this.perform[i]);
		}
	}

	this.core$cmdraw = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'auto')
		{
			if(server.master.test(prefix.mask))
			{
				switch(params[0])
				{
					case 'perform':
						server.do('auto$perform', server, prefix, target, params[1], params.slice(2).join(' '));
						break;
				}
			}
		}
	}

	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'auto')
		{
			if(server.master.test(prefix.mask))
			{
				switch(params[0])
				{
					case 'join':
						server.do('auto$join', server, prefix, target, params[1], params[2]);
						break;
				}
			}
		}
	}

	this._join = function(server, prefix, target, opcode, channel)
	{
		switch(opcode)
		{
			case '+':
				if(typeof this.join.indexOf(channel === -1)) this.join.push(channel);
				server.send('PRIVMSG ' + target + ' :done');
				break;
			case '-':
				var i = this.join.indexOf(channel);
				if(i !== -1) this.join.splice(i, 1);
				server.send('PRIVMSG ' + target + ' :done');
				break;
			case '?':
				server.send('PRIVMSG ' + target + ' :Auto join: ' + this.join.join(', '));
				break;
		}
	}

	this._perform = function(server, prefix, target, opcode, param)
	{
		switch(opcode)
		{
			case '+':
				this.perform.push(param);
				server.send('PRIVMSG ' + target + ' :done');
				break;
			case '-':
				if(param >= 0 && param < this.perform.length) this.perform.splice(param, 1);
				server.send('PRIVMSG ' + target + ' :done');
				break;
			case '?':
				var a = [];
				for(var i in this.perform)
				{
					a.push(i + '[' + util.inspect(this.perform[i]) + ']');
				}

				server.send('PRIVMSG ' + target + ' :Auto perform: ' + a.join(', '));
				break;
		}
	}
}

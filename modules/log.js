var util = require('util');

exports.mod = function(context)
{
	this.channels =
	{
		urgent: process.stdout,
		out: process.stdout,
		err: process.stderr,
		verbose: null,
	};

	this.$log = function(data, channel)
	{
		this.log(data, channel)
	}

	this.log = function(data, channel)
	{
		this.logUnsafe(data, channel);
	}

	this.logUnsafe = function(data, channel)
	{
		var d = new Date();
		var t = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ']';

		if(typeof this.channels[channel] === 'undefined') channel = 'out';

		if(this.channels[channel] !== null)
		{
			this.channels[channel].write(t + ' ' + data + '\n');
		}
	}
}

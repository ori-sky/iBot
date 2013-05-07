exports.mod = function(context)
{
	this.core$cmdraw = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'remind':
				server.fireTimed(this.timeToMilliseconds(params[0]), target + '$' + prefix.nick, 'remind', server, prefix.nick, target, params.slice(1).join(' '));
				break;
			case 'remindme':
				server.fireTimed(this.timeToMilliseconds(params[0]), prefix.nick, 'remind', server, prefix.nick, prefix.nick, params.slice(1).join(' '));
				break;
		}
	}

	this.remind$remind = function(server, from, to, msg)
	{
		server.send('PRIVMSG ' + to + ' :Reminder from ' + from + ': ' + msg);
	}

	this.timeToMilliseconds = function(timeString)
	{
		//var r = /(\d+y)?(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+)?/;
		var r = /(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+)?/;
		var match = r.exec(timeString);

		var t = 0;

		// this won't take leap years into account
		// years and weeks don't work presumably because max integer size is too big
		/*
		if(typeof match[1] !== 'undefined') t += parseInt(match[1]) * 1000 * 60 * 60 * 24 * 7 * 365;
		if(typeof match[2] !== 'undefined') t += parseInt(match[2]) * 1000 * 60 * 60 * 24 * 7;
		if(typeof match[3] !== 'undefined') t += parseInt(match[3]) * 1000 * 60 * 60 * 24;
		if(typeof match[4] !== 'undefined') t += parseInt(match[4]) * 1000 * 60 * 60;
		if(typeof match[5] !== 'undefined') t += parseInt(match[5]) * 1000 * 60;
		if(typeof match[6] !== 'undefined') t += parseInt(match[6]) * 1000;
		if(typeof match[7] !== 'undefined') t += parseInt(match[7]);
		*/

		if(typeof match[1] !== 'undefined') t += parseInt(match[1]) * 1000 * 60 * 60 * 24;
		if(typeof match[2] !== 'undefined') t += parseInt(match[2]) * 1000 * 60 * 60;
		if(typeof match[3] !== 'undefined') t += parseInt(match[3]) * 1000 * 60;
		if(typeof match[4] !== 'undefined') t += parseInt(match[4]) * 1000;
		if(typeof match[5] !== 'undefined') t += parseInt(match[5]);

		return t;
	}
}

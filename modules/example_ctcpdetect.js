exports.mod = function(context, server)
{
	// hook into global recv event
	this.$recv = function(prefix, opcode, params)
	{
		// params[0] is target, params[1] is message
		switch(opcode)
		{
			case 'PRIVMSG':
				if(params[1][0] === '\001' && params[1][params[1].length - 1] === '\001')
				{
					console.log('detected CTCP request!');
				}
				break;
			case 'NOTICE':
				if(params[1][0] === '\001' && params[1][params[1].length - 1] === '\001')
				{
					console.log('detected CTCP reply!');
				}
				break;
		}
	}
}

exports.mod = function(context)
{
	this.core$cmdraw = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'raw':
				if(server.master.test(prefix.mask))
				{
					server.fire('raw', server, params.join(' '));
				}
				break;
			case 'rawtimed':
				if(server.master.test(prefix.mask))
				{
					server.fireTimed(params[0], undefined, 'raw', server, params.slice(1).join(' '));
				}
				break;
		}

	}

	this.raw$raw = function(server, data)
	{
		server.send(data);
	}
}

exports.Context = function()
{
	this.servers = {};

	this.run = function()
	{
		for(var kServer in this.servers)
		{
			this.servers[kServer].connect();
		}
	}
}

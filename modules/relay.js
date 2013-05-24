/*
 * Copyright (c) 2013, David Farrell <shokku.ra@gmail.com>
 *  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * 
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * - Neither the name of iBot nor the names of its contributors may be used to
 *   endorse or promote products derived from this software without specific
 *   prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var net = require('net');
var util = require('util');

exports.mod = function(context, server)
{
	this.server = undefined;
	this.clients = [];

	this._suspend = function()
	{
		if(this.timeout !== undefined) clearTimeout(this.timeout);
		this.destroy();
	}

	this._loaded = function()
	{
		this.timeout = setTimeout(function() { this.create(); }.bind(this), 2000);
	}

	this._unloaded = function()
	{
		if(this.timeout !== undefined) clearTimeout(this.timeout);
		this.destroy();
	}

	this.$recv = function(prefix, opcode, params)
	{
		for(var iClient in this.clients)
		{
			this.clients[iClient].write(prefix.mask + ' ' + opcode + ' ' + params.join(' ') + '\r\n');
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'relay')
		{
			switch(params[0])
			{
				case '?':
					$core._privmsg(target, this.clients.length);
					break;
			}
		}
	}

	this.create = function()
	{
		this.server = net.createServer();
		
		this.server.on('connection', function(c)
		{
			this.clients.push(c);

			c.setEncoding('utf8');

			c.on('data', function(data)
			{
				server.fire('$log', data);
				server.send(data.trim());
			}.bind(this));

			c.on('end', function()
			{
				var i = this.clients.indexOf(c);
				if(i !== -1) this.clients.splice(i, 1);
			}.bind(this));

			c.on('error', function(err)
			{
				console.log(err);
			}.bind(this));
		}.bind(this));

		this.server.on('error', function(err)
		{
			console.log(err);
		});

		this.server.listen(18010);
	}

	this.destroy = function()
	{
		if(this.server !== undefined)
		{
			for(var iClient in this.clients)
			{
				this.clients[iClient].end();
				this.clients[iClient].destroy();
			}

			this.server.close();
		}
	}
}

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

	this._resume = function(data)
	{
		if(typeof data.join !== 'undefined') this.join = data.join;
		if(typeof data.perform !== 'undefined') this.perform = data.perform;
	}

	this._suspend = function()
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
				server.do('core$privmsg', server, target, 'Done');
				break;
			case '-':
				var i = this.join.indexOf(channel);
				if(i !== -1) this.join.splice(i, 1);
				server.do('core$privmsg', server, target, 'Done');
				break;
			case '?':
				server.do('core$privmsg', server, target, 'Auto join: ' + this.join.join(', '));
				break;
		}
	}

	this._perform = function(server, prefix, target, opcode, param)
	{
		switch(opcode)
		{
			case '+':
				this.perform.push(param);
				server.do('core$privmsg', server, target, 'Done');
				break;
			case '-':
				if(param >= 0 && param < this.perform.length) this.perform.splice(param, 1);
				server.do('core$privmsg', server, target, 'Done');
				break;
			case '?':
				var a = [];
				for(var i in this.perform)
				{
					a.push(i + '[' + util.inspect(this.perform[i]) + ']');
				}

				server.do('core$privmsg', server, target, 'Auto perform: ' + a.join(', '));
				break;
		}
	}
}

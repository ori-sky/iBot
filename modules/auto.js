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

exports.mod = function(context, server)
{
	this.join = [];
	this.perform = [];

	this._load = function(data)
	{
		if(data.join !== undefined) this.join = data.join;
		if(data.perform !== undefined) this.perform = data.perform;
	}

	this._suspend = function()
	{
		return {
			join: this.join,
			perform: this.perform
		};
	}

	this._resume = function(data)
	{
		if(data.join !== undefined) this.join = data.join;
		if(data.perform !== undefined) this.perform = data.perform;
	}

	this._save = function()
	{
		return {
			join: this.join,
			perform: this.perform
		};
	}

	this.core$001 = function(prefix, message, $core)
	{
		for(var i in this.join)
		{
			$core._join(this.join[i]);
		}

		for(var i in this.perform)
		{
			server.do('core$send', this.perform[i]);
		}
	}

	this.core$cmdraw = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'auto')
		{
			if($core._authed(prefix))
			{
				switch(params[0])
				{
					case 'perform':
						var opcode = params[1];
						var param = params.slice(2).join(' ');

						switch(opcode)
						{
							case '+':
								this.perform.push(param);
								$core._privmsg(target, 'Done');
								break;
							case '-':
								if(param >= 0 && param < this.perform.length) this.perform.splice(param, 1);
								$core._privmsg(target, 'Done');
								break;
							case '?':
								var a = [];
								for(var i in this.perform)
								{
									a.push(i + '[' + util.inspect(this.perform[i]) + ']');
								}

								$core._privmsg(target, 'Auto perform: ' + a.join(', '));
								break;
						}
						break;
				}
			}
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'auto')
		{
			if($core._authed(prefix))
			{
				switch(params[0])
				{
					case 'join':
						var opcode = params[1];
						var channel = params[2];

						switch(opcode)
						{
							case '+':
								if(typeof this.join.indexOf(channel === -1)) this.join.push(channel);
								$core._privmsg(target, 'Done');
								break;
							case '-':
								var i = this.join.indexOf(channel);
								if(i !== -1) this.join.splice(i, 1);
								$core._privmsg(target, 'Done');
								break;
							case '?':
								$core._privmsg(target, 'Auto join: ' + this.join.join(', '));
								break;
						}
						break;
				}
			}
		}
	}
}

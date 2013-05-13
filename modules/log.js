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
	this.streams =
	{
		urgent: process.stdout,
		out: process.stdout,
		err: process.stderr,
		verbose: null,
	};

	this.core$cmd = function(server, prefix, target, command, params)
	{
		if(command === 'log')
		{
			if(typeof this.data.targets !== 'object') this.data.targets = {};

			switch(params[0])
			{
				case '+':
					this.data.targets[params[1]] = true;
					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '-':
					delete this.data.targets[params[1]];
					server.send('PRIVMSG ' + target + ' :done');
					break;
				case '?':
					break;
			}
		}
	}

	this.$log = function(data, stream)
	{
		this.log(data, stream)
	}

	this.log = function(data, stream)
	{
		this.logUnsafe(util.inspect(data), stream);
	}

	this.logUnsafe = function(data, stream)
	{
		var d = new Date();
		var t = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ']';

		if(typeof this.streams[stream] === 'undefined') stream = 'out';

		if(this.streams[stream] !== null)
		{
			this.streams[stream].write(t + ' ' + data + '\n');
		}
	}

	this._logTargets = function(server, data)
	{
		var dataSafe = util.inspect(data);

		if(typeof this.data.targets !== 'undefined')
		{
			for(var kTarget in this.data.targets)
			{
				if(this.data.targets[kTarget] === true)
				{
					server.send('PRIVMSG ' + kTarget + ' :' + dataSafe);
				}
			}
		}
	}
}

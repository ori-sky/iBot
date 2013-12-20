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
	this.streams =
	{
		urgent: process.stdout,
		out: process.stdout,
		err: process.stderr,
		verbose: null,
	};

	this.core$cmd = function(prefix, target, command, params, $core)
	{
		if(command === 'log')
		{
			if(typeof this.data.targets !== 'object') this.data.targets = {};

			switch(params[0])
			{
				case '+':
					this.data.targets[params[1]] = true;
					$core._privmsg(target, 'Done');
					break;
				case '-':
					delete this.data.targets[params[1]];
					$core._privmsg(target, 'Done');
					break;
				case '?':
					// TODO
					break;
			}
		}
	}

	this.$log = function(data, stream)
	{
		this._log(data, stream)
	}

	this._log_interleaved = function(stream, args)
	{
		var str = '';
		var safe = false;

		for(var i=0; (i < args.length && typeof args[i] === 'string'); ++i)
		{
			if(safe === true)
			{
				var inspected = util.inspect(args[i]);
				str += inspected.substr(1, inspected.length - 2);
			}
			else
			{
				str += args[i];
			}

			safe = !safe;
		}

		this._log_unsafe(str, stream);
	}

	this._log = function(data, stream)
	{
		var d = util.inspect(data);
		this._log_unsafe(d, stream);
	}

	this._log_unsafe = function(data, stream)
	{
		var d = new Date();
		var hours = d.getHours().toString();
		var minutes = d.getMinutes().toString();
		var seconds = d.getSeconds().toString();

		if(hours.length === 1) hours = '0' + hours;
		if(minutes.length === 1) minutes = '0' + minutes;
		if(seconds.length === 1) seconds = '0' + seconds;

		var t = '[' + hours + ':' + minutes + ':' + seconds + ']';

		if(typeof this.streams[stream] === 'undefined') stream = 'out';

		if(this.streams[stream] !== null)
		{
			this.streams[stream].write(t + ' ' + data + '\n');
		}
	}

	this._logTargets = function(data)
	{
		var dataSafe = util.inspect(data);

		if(typeof this.data.targets !== 'undefined')
		{
			for(var kTarget in this.data.targets)
			{
				if(this.data.targets[kTarget] === true)
				{
					server.do('core$privmsg', kTarget, dataSafe);
				}
			}
		}
	}
}

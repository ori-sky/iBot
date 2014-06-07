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

exports.mod = function(context, server)
{
	this.segmentDuration = 604800000;
	this.segmentInterval = undefined;
	this.schedules = [];
	this.timeouts = [];

	this._load = function(data)
	{

	}

	this._save = function()
	{

	}

	this._suspend = function()
	{
		var data =
		{
			lastCbInterval: this.lastCbInterval,
			segmentInterval: this.segmentInterval,
			schedules: this.schedules,
			timeouts: this.timeouts
		};
		return data;
	}

	this._resume = function(data)
	{
		if(data.lastCbInterval !== undefined) this.lastCbInterval = data.lastCbInterval;
		if(data.segmentInterval !== undefined) this.segmentInterval = data.segmentInterval;
		if(data.schedules !== undefined) this.schedules = data.schedules;
		if(data.timeouts !== undefined) this.timeouts = data.timeouts;
	}

	this._loaded = function(server)
	{
		var ms = 0;

		if(this.segmentInterval !== undefined)
		{
			clearInterval(this.segmentInterval);

			if(this.lastCbInterval !== undefined)
			{
				var diff = process.hrtime(this.lastCbInterval);
				ms = this.segmentDuration - (diff[0] * 1000 + diff[1] / 1000000);
			}
		}
		else
		{
			ms = this.segmentDuration;
		}

		setTimeout(function()
		{
			this.cbInterval(server);
			this.segmentInterval = setInterval(function()
			{
				this.cbInterval(server);
			}.bind(this), this.segmentDuration);
		}.bind(this), ms);
	}

	this._unloaded = function(server)
	{
		clearInterval(this.segmentInterval);

		for(var iTimeout in this.timeouts)
		{
			clearTimeout(this.timeouts[iTimeout]);
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'scheduler')
		{
			switch(params[0])
			{
				case '+':
					server.do('scheduler$schedule', params[1], params[2], function()
					{
						server.do('core$cmd', prefix, target, params[3], params.slice(4));
					});
					$core._privmsg(target, 'Scheduled event added.');
					break;
				case '?':
					$core._privmsg(target, 'Number of schedules: ' + this.schedules.length);
					break;
			}
		}
	}

	this._fire = function()
	{
		var args = arguments;
		var offset = args[0];
		var segments = args[1];
		var eventName = args[2];
		var params = Array.prototype.slice.call(arguments, 3);
		var a = [eventName].concat(params);

		server.do('scheduler$schedule', offset, segments, function()
		{
			server.fire.apply(server, a);
		});
	}

	this._schedule = function(offset, segments, callback)
	{
		var offset = server.do('scheduler$timeToMilliseconds', offset);

		if(segments > 0)
		{
			var newOffset = offset;

			if(this.lastCbInterval !== undefined)
			{
				var diff = process.hrtime(this.lastCbInterval);
				newOffset += Math.floor(diff[0] * 1000 + diff[1] / 1000000);
			}

			this.schedules.push({offset:newOffset, segments:segments, callback:callback});
		}
		else
		{
			this.timeouts.push(setTimeout(callback, offset));
		}
	}

	this._unschedule = function(index)
	{
		// TODO
	}

	this.cbInterval = function(server)
	{
		this.lastCbInterval = process.hrtime();

		for(var iSchedule in this.schedules)
		{
			--this.schedules[iSchedule].segments;

			if(this.schedules[iSchedule].segments <= 0)
			{
				this.timeouts.push(setTimeout(this.schedules[iSchedule].callback, this.schedules[iSchedule].offset));
				this.schedules.splice(iSchedule, 1);
			}
		}
	}.bind(this);

	this._timeToMilliseconds = function(timeString)
	{
		var r = /(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+)?/;
		var match = r.exec(timeString);

		var t = 0;
		if(match[1] !== undefined) t += parseInt(match[1]) * 1000 * 60 * 60 * 24;
		if(match[2] !== undefined) t += parseInt(match[2]) * 1000 * 60 * 60;
		if(match[3] !== undefined) t += parseInt(match[3]) * 1000 * 60;
		if(match[4] !== undefined) t += parseInt(match[4]) * 1000;
		if(match[5] !== undefined) t += parseInt(match[5]);

		return t;
	}
}

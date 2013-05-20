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

exports.mod = function(context)
{
	this.segmentDuration = 10000;
	this.segmentInterval = undefined;
	this.schedules = [];

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
			schedules: this.schedules
		};
		return data;
	}

	this._resume = function(data)
	{
		if(data.lastCbInterval !== undefined) this.lastCbInterval = data.lastCbInterval;
		if(data.segmentInterval !== undefined) this.segmentInterval = data.segmentInterval;
		if(data.schedules !== undefined) this.schedules = data.schedules;
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
		this.segmentInterval = undefined;
	}

	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'scheduler')
		{
			switch(params[0])
			{
				case '+':
					var offset = parseInt(params[1]);
					var segments = parseInt(params[2]);
					if(isNaN(offset)) offset = 0;
					if(isNaN(segments)) segments = 0;

					server.do('scheduler$schedule', server, offset, segments);
					break;
				case '?':
					server.send('PRIVMSG ' + target + ' :Number of schedules: ' + this.schedules.length);
					break;
			}
		}
	}

	this._schedule = function(server, offset, segments)
	{
		var newOffset = offset;

		if(this.lastCbInterval !== undefined)
		{
			var diff = process.hrtime(this.lastCbInterval);
			newOffset += Math.floor(diff[0] * 1000 + diff[1] / 1000000);
		}
		this.schedules.push({offset:newOffset, segments:segments});
	}

	this.cbInterval = function(server)
	{
		this.lastCbInterval = process.hrtime();

		for(var iSchedule in this.schedules)
		{
			--this.schedules[iSchedule].segments;

			server.do('log$logTargets', server, iSchedule + ': ' + this.schedules[iSchedule].offset + ',' + this.schedules[iSchedule].segments);

			if(this.schedules[iSchedule].segments <= 0)
			{
				setTimeout(function()
				{
					server.do('log$logTargets', server, iSchedule + ': fired!');
				}.bind(this), this.schedules[iSchedule].offset);
				this.schedules.splice(iSchedule, 1);
			}
		}
	}.bind(this);
}

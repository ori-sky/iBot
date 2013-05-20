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

	this._load = function(data)
	{

	}

	this._save = function()
	{

	}

	this._suspend = function()
	{

	}

	this._resume = function(data)
	{

	}

	this._loaded = function(server)
	{

	}

	this._unloaded = function(server)
	{

	}

	this.core$cmd = function(server, prefix, target, cmd, params)
	{
		if(cmd === 'scheduler')
		{
			switch(params[0])
			{
				case '+':
					server.do('scheduler$fire', server, [parseInt(params[1]), parseInt(params[2])], undefined, 'test', server, target);
					break;
			}
		}
	}

	this._fire = function()
	{
		var args = Array.prototype.slice.call(arguments, 0);
		var server = args[0];
		var timespan = args[1];
		var name = args[2];

		if(server === undefined) throw new Error('Server undefined');

		var ms = 0;

		if(typeof timespan === 'object')
		{
			if(typeof timespan[0] === 'number' && !isNaN(timespan[0])) ms += timespan[0];
			if(typeof timespan[1] === 'number' && !isNaN(timespan[1])) ms += timespan[1] * this.segmentDuration;
		}
		else if(typeof timespan === 'number')
		{
			ms = timespan;
		}

		var a = [ms, name].concat(args.slice(3));
		server.fireTimed.apply(server, a);
	}

	this.scheduler$test = function(server, target)
	{
		server.send('PRIVMSG ' + target + ' :fired');
	}
}

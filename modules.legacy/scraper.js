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

var http = require('http');

exports.mod = function(context, server)
{
	this.active = false;

	this._load = function(data)
	{
		if(data.active !== undefined && typeof data.active === 'boolean')
		{
			this.active = data.active;
		}
	}

	this._save = function()
	{
		return { active: this.active };
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'scraper')
		{
			switch(params[0])
			{
				case 'on':
					if($core._authed(prefix))
					{
						this.active = true;
						$core._privmsg(target, 'Scrape command is now active.');
					}
					break;
				case 'off':
					if($core._authed(prefix))
					{
						this.active = false;
						$core._privmsg(target, 'Scrape command is now inactive.');
					}
					break;
			}
		}
		else if(cmd === 'scrape' &&  this.active)
		{
			var host = params[0];
			var path = params[1];
			var expr = params[2];

			$core._privmsg(target, 'Scraping: ' + host + path);

			server.do('scraper$scrape', target, host, path, 'Data', new RegExp(expr), function(target, key, value)
			{
				if(value !== undefined) $core._privmsg(target, key + ': ' + value);
				else $core._privmsg(target, 'Scrape failed.');
			}, undefined);
		}
	}

	this._scrape = function(target, host, path, key, expr, callback, processor)
	{
		if(processor === undefined)
		{
			processor = function(match) { if(match !== null) return match[1]; }
		}

		this.get(host, path, function(data)
		{
			if(data !== undefined)
			{
				var match = data.match(expr);
				callback(target, key, processor(match));
			}
			else callback(target, key, undefined);
		}.bind(this));
	}

	this.get = function(host, path, callback, depth)
	{
		if(depth === undefined) depth = 0;
		if(depth > 5) { callback(undefined); return; }

		var options = { host: host, path: path };

		var req = http.request(options, function(response)
		{
			response.on('error', function(err)
			{
				console.log(err);
				callback();
			});

			switch(response.statusCode)
			{
				case 301:
					this.get(host, response.headers.location, callback, ++depth);
					break;
				case 200:
					var data = '';

					response.on('data', function(chunk)
					{
						data += chunk;
						if(data.length > 10000000) req.abort();
					});
					response.on('end', function() { callback(data); });
					break;
				default:
					console.log(response.statusCode);
					callback();
					break;
			}
		}.bind(this));

		req.on('error', function(err)
		{
			console.log(err);
			callback();
		});

		setTimeout(function() { req.abort(); }, 10000);
		req.end();
	}
}

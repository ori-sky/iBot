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
	this.core$cmdraw = function(server, prefix, target, cmd, params)
	{
		switch(cmd)
		{
			case 'remind':
				server.do('scheduler$fire', server, this.timeToMilliseconds(params[0]), params[1], 'remind$remind', server, prefix.nick, target, params.slice(2).join(' '));
				break;
			case 'remindme':
				server.do('scheduler$fire', server, this.timeToMilliseconds(params[0]), params[1], 'remind$remind', server, prefix.nick, prefix.nick, params.slice(2).join(' '));
				break;
		}
	}

	this.remind$remind = function(server, from, to, msg)
	{
		console.log(4567);
		server.send('PRIVMSG ' + to + ' :Reminder from ' + from + ': ' + msg);
	}

	this.timeToMilliseconds = function(timeString)
	{
		//var r = /(\d+y)?(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+)?/;
		var r = /(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+)?/;
		var match = r.exec(timeString);

		var t = 0;

		// this won't take leap years into account
		// years and weeks don't work presumably because max integer size is too big
		/*
		if(typeof match[1] !== 'undefined') t += parseInt(match[1]) * 1000 * 60 * 60 * 24 * 7 * 365;
		if(typeof match[2] !== 'undefined') t += parseInt(match[2]) * 1000 * 60 * 60 * 24 * 7;
		if(typeof match[3] !== 'undefined') t += parseInt(match[3]) * 1000 * 60 * 60 * 24;
		if(typeof match[4] !== 'undefined') t += parseInt(match[4]) * 1000 * 60 * 60;
		if(typeof match[5] !== 'undefined') t += parseInt(match[5]) * 1000 * 60;
		if(typeof match[6] !== 'undefined') t += parseInt(match[6]) * 1000;
		if(typeof match[7] !== 'undefined') t += parseInt(match[7]);
		*/

		if(typeof match[1] !== 'undefined') t += parseInt(match[1]) * 1000 * 60 * 60 * 24;
		if(typeof match[2] !== 'undefined') t += parseInt(match[2]) * 1000 * 60 * 60;
		if(typeof match[3] !== 'undefined') t += parseInt(match[3]) * 1000 * 60;
		if(typeof match[4] !== 'undefined') t += parseInt(match[4]) * 1000;
		if(typeof match[5] !== 'undefined') t += parseInt(match[5]);

		return t;
	}
}

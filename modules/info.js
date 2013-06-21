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
	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		switch(cmd)
		{
			case 'users':
				var syntax = 'Syntax: users <channel>';
				var channel = params[0];
				if(channel === undefined) { $core._privmsg(target, syntax); break; }

				var k = Object.keys(server.channels[channel].users);
				$core._privmsg(target, 'Users: ' + k.join(', '));
				break;
			case 'channels':
				var k = undefined;
				if(params[0] === undefined) k = Object.keys(server.user.channels);
				else k = Object.keys(server.users[params[0]].channels);

				$core._privmsg(target, 'Channels: ' + k.join(', '));
				break;
			case 'myinfo':
				$core._privmsg(target, 'MYINFO: ' + params[0] + ' = ' + server.get('core').myinfo[params[0]]);
				break;
			case 'isupport':
				$core._privmsg(target, 'ISUPPORT: ' + params[0] + ' = ' + server.get('core').isupport[params[0]]);
				break;
			case 'mynick':
				$core._privmsg(target, 'My nick is ' + server.user.nick);
				break;
			case 'identof':
				$core._privmsg(target, 'Ident of ' + params[0] + ' = ' + server.users[params[0]].ident);
				break;
			case 'hostof':
				$core._privmsg(target, 'Host of ' + params[0] + ' = ' + server.users[params[0]].host);
				break;
		}
	}
}

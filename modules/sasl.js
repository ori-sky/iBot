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
	this.username = undefined;
	this.password = undefined;

	this._load = function(data)
	{
		this.username = data.username;
		this.password = data.password;
	}

	this.cap$ls = function(prefix, cap, $cap)
	{
		if(cap === 'sasl')
		{
			$cap._wait();
			server.send('CAP REQ :sasl');
		}
	}

	this.cap$ack = function(prefix, cap, $cap)
	{
		if(cap === 'sasl')
		{
			server.send('AUTHENTICATE PLAIN');
		}
	}

	this.cap$nak = function(prefix, cap, $cap)
	{
		if(cap === 'sasl')
		{
			$cap._done();
		}
	}

	this.sasl$authenticate = function(params)
	{
		if(params[0] === '+')
		{
			var auth = this.username + '\0' + this.username + '\0' + this.password;
			var buf = new Buffer(auth);
			server.send('AUTHENTICATE ' + buf.toString('base64'));
		}
	}

	this.$recv = function(prefix, opcode, params)
	{
		switch(opcode)
		{
			case 'AUTHENTICATE':
				server.fire('authenticate', params);
				break;
			case '900': // logged in
				server.do('cap$done');
				break;
			case '904': // authentication failed
				server.do('cap$done');
				break;
		}

	}
}

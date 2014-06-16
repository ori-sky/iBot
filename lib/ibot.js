/*
 *  Copyright 2013-2014 David Farrell
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var net = require('net')
var tls = require('tls')

exports.connect = function(config, callback)
{
	var connection = undefined
	if(config.ssl)
	{
		connection = tls.connect(config.port, config.host, {rejectUnauthorized:false}, callback)
	}
	else
	{
		connection = new net.Socket()
		connection.setNoDelay()
		connection.connect(config.port, config.host, callback)
	}

	connection.setEncoding('utf8')
	return connection
}

exports.Message = function(data)
{
	var words = data.split(' ')
	var index = 0

	this.tags = {}

	if(words[index][0] === '@')
	{
		var tags = words[index].substr(1).split(';')

		for(var i=0; i<tags.length; ++i)
		{
			var spl = tags[i].split('=')
			this.tags[spl[0]] = (spl[1] !== undefined) ? spl[1] : null
		}

		++index
	}

	if(words[index][0] === ':')
	{
		this.prefix = {}
		this.prefix.mask = words[index].substr(1)

		if(this.prefix.mask.indexOf('!') !== -1)
		{
			var spl1 = this.prefix.mask.split('!')
			var spl2 = spl1[1].split('@')
			this.prefix.nick = spl1[0]
			this.prefix.user = spl2[0]
			this.prefix.host = spl2[1]
		}

		++index
	}

	this.opcode = words[index++]
	this.params = []

	var in_string = false
	for(var i=index; i<words.length; ++i)
	{
		if(in_string)
		{
			this.params[this.params.length - 1] += ' ' + words[i]
			continue
		}

		if(words[i][0] === ':')
		{
			in_string = true
			this.params.push(words[i].substr(1))
			continue
		}

		this.params.push(words[i])
	}

	this.toString = function()
	{
		var s = this.opcode + ' ' + this.params.join(' ')
		if(this.prefix !== undefined) s = this.prefix.mask + ' ' + s
		return s
	}
}

exports.Server = function(config)
{
	this.config = config

	var on_connect = function()
	{
		exports.mods.instance = this.instance
		exports.mods.fire('ibot$connect')
		this.send('NICK ' + this.config.nick)
		this.send('USER ' + this.config.user + ' 0 * :iBot')
	}.bind(this)

	var on_close = function(had_error)
	{
		exports.mods.instance = this.instance
		exports.mods.fire('ibot$disconnect')
		this.connect()
	}.bind(this)

	var on_error = function(err)
	{
		exports.mods.instance = this.instance
		exports.mods.fire('ibot$error', err)
		console.log(err)
	}.bind(this)


	var accumulator = ''
	var on_data = function(buffer)
	{
		var data = accumulator + buffer.toString()
		var lines = data.split('\r\n')

		for(var i=0; i<lines.length-1; ++i)
		{
			this.recv(lines[i])
		}

		accumulator = lines[lines.length - 1]
	}.bind(this)

	this.connect = function()
	{
		if(this.connection !== undefined)
		{
			this.connection.end()
			this.connection.destroy()
			this.connection = undefined
			setTimeout(this.connect, 5000)
			return
		}

		this.connection = exports.connect(this.config, on_connect)
		this.connection.on('close', on_close)
		this.connection.on('error', on_error)
		this.connection.on('data', on_data)
	}.bind(this)

	this.recv = function(data)
	{
		var message = new exports.Message(data)

		try
		{
			exports.mods.instance = this.instance
			exports.mods.fire('ibot$raw', data)
			exports.mods.fire('ibot$recv', message)
		}
		catch(e)
		{
			console.log(e.stack)
		}
	}

	this.send = function(data, newline)
	{
		exports.mods.instance = this.instance
		exports.mods.fire('ibot$send', data)

		if(newline !== false) data += '\r\n'
		this.connection.write(data)
	}

	this.instance = exports.mods.newInstance()
	exports.mods.instances[this.instance].server = this
}

var servers = {}

exports.name = 'ibot'
exports.config$load = function(config)
{
	if(config.servers !== undefined)
	{
		for(var k in config.servers)
		{
			if(servers[k] === undefined)
			{
				servers[k] = new exports.Server(config.servers[k])
				servers[k].connect()
			}
		}
	}
}

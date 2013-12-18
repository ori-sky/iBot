/*
 *  Copyright 2013 David Farrell
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

exports.connect = function(config)
{
    var connection = undefined
    if(config.ssl)
    {
        connection = tls.connect(config.port, config.host, {rejectUnauthorized:false})
    }
    else
    {
        connection = new net.Socket()
        connection.setNoDelay()
        connection.connect(config.port, config.host)
    }

    connection.setEncoding('utf8')
    return connection
}

exports.Message = function(data)
{
    var words = data.split(' ')
    var index = 0

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
    this.connection = exports.connect(this.config)
    this.connection.on('connect', function()
    {
        console.log('connected!')

        this.send('NICK ' + this.config.nick)
        this.send('USER ' + this.config.user + ' 0 * :iBot')
    }.bind(this))

    this.connection.on('close', function(had_error)
    {
        console.log('closed!')
    })

    this.connection.on('error', function(err)
    {
        console.log('error!')
    })

    var accumulator = ''
    this.connection.on('data', function(buffer)
    {
        var data = accumulator + buffer.toString()
        var lines = data.split('\r\n')

        for(var i=0; i<lines.length-1; ++i)
        {
            this.recv(lines[i])
        }

        accumulator = lines[lines.length - 1]
    }.bind(this))

    this.recv = function(data)
    {
        var message = new exports.Message(data)
        exports.__mods.fire('ibot$raw', this, data)
        exports.__mods.fire('ibot$recv', this, message)
    }

    this.send = function(data, newline)
    {
        console.log('-> ' + data)

        if(newline !== false) data += '\r\n'
        this.connection.write(data)
    }
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
            }
        }
    }
}

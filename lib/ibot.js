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

exports.Server = function(config)
{
    this.config = config
    this.connection = exports.connect(this.config)
    this.connection.on('connect', function()
    {
        console.log('connected!')
    }.bind(this))

    this.connection.on('close', function(had_error)
    {
        console.log('closed!')
    })

    this.connection.on('error', function(err)
    {
        console.log('error!')
    })

    this.connection.on('data', function(buffer)
    {
        console.log('data received!')
    })
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

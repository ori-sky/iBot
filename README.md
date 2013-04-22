# iBot Framework

iBot is an IRC client-side framework designed to be extensible and easy to use.

### Recent Changes

* Wrote a module hooks system for event exposing
* To fire an event, from a module call `server.fire('eventname', param1, param2, ...)`
* To hook into an event, from a module use `this.modulename$eventname = function(param1, param2, ...)`

For example, to hook into the `privmsg` event from mod core:

```javascript
exports.mod = function(ctx)
{
	this.core$privmsg = function(server, prefix, target, message, words)
	{
		if(words[0] === '!hello')
		{
			server.send('PRIVMSG ' + target + '  :world!');
		}
	}
}
```

More documentation to follow later.

### Installation

```
npm install ibot
```

### Quick Start

It's very easy to create a connection using iBot.

```javascript
var Context = require('ibot').Context;
var Server = require('ibot').Server;

var ctx = new Context();
ctx.servers.test = new Server(ctx, 'irc.example.com', 6667, 'MyNick', 'myident', false, false);
ctx.servers.test.master = /nick!ident@host/;

ctx.loadModule('core');
ctx.run();
```

`Server.master` determines which users can use the admin commands such as for loading and unloading modules. It takes a JavaScript regular expression so it can be configured for partial matches or for more complex expressions.

The IRC commands available through core are as follows:

* `!lmsrv <module>`       - loads a module instance into the current server
* `!lmctx <module>`       - loads a module instance into all servers
* `!umsrv <module>`       - unloads a module from the current server
* `!umctx <module>`       - unloads a module from all servers
* `!modules`              - lists the loaded modules for the current server

### Modules

iBot has a robust module system. Some modules, like core, are bundled with the package and can be loaded with no configuration. If you want to include other modules and, more than likely, write your own, there's a bit more setup involved but it's still fairly simple.

```javascript
// Filename: index.js

var path = require('path');

var Context = require('ibot').Context;
var Server = require('ibot').Server;

var ctx = new Context({modulesPath: path.resolve('./path/to/modules/')});
ctx.servers.test = new Server(ctx, 'irc.example.com', 6667, 'MyNick', 'myident', false, false);
ctx.servers.test.master = /nick!ident@host/;

ctx.loadModule('core');

// you don't need this line, you can load the module via !lmsrv or !lmctx
ctx.loadModule('hello');

ctx.run();
```

```javascript
// Filename: ./path/to/modules/hello.js

exports.mod = function(ctx)
{
	this.recv = function(server, prefix, opcode, params)
	{
		if(opcode === 'PRIVMSG')
		{
			var words = params[1].split(' ');
			var target = params[0];

			// get the correct target in case it's a private message
			if(target === server.user.nick) target = prefix.nick;

			if(words[0] === '!hello')
			{
				server.send('PRIVMSG ' + target + ' :world!');
			}
		}
	}
}
```

## License

Copyright (c) 2013, David Farrell.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of iBot nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

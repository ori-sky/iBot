# iBot Framework

iBot is an IRC client-side framework designed to be extensible and easy to use.

## Usage

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
	this.$recv = function(server, prefix, opcode, params)
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

## Changelog

Here you will find the list of changes in iBot.

#### `cmd` & `cmdraw`

* Two new convenience events have been added in mod core. Parameters are outlined in `doc/events`.
* These events are fired if the first word of a PRIVMSG begins with `!` or if the first word is the bot's current nick.
* `cmd` params comprise only of non-empty elements from the message words array.
* `cmdraw` params are unfiltered and contain all elements (useful for mod raw).

Example usage of commands:

```
<user> !lmsrv module
<user> iBot: lmsrv module
<user> ibot, lmsrv module
<user> ibot lmsrv module
<user> ibot      lmsrv                module
<user> ibot   raw PRIVMSG #channel :these two spaces will send correctly ->  <-
```

#### Global Events

* Events can now be fired without a sender by prefixing the event name with $
* Modules can hook into global events by not specifying the sender.

For example:

```javascript
// fire an event
server.fire('sayhello', server, target);

// hook into an event
this.$sayhello = function(server, target) { ... }
```

#### Scheduled Fires (updated)

* Syntax is now `Server.fireTimed(numMilliseconds, 'timeoutName', 'eventName', param1, param2, ...)`
* Fire can be cancelled with `Server.fireCancel('timeoutName')`
* Duration can be changed based on the original time with `Server.fireChange(newMilliseconds, 'timeoutName')`
* Fire can be overwriten (changes duration based on the current time effectively) by calling `fireTimed` again.
* `timeoutName` in all functions defaults to 'default' if undefined.

#### Recursive Hooks

* Hooks now work recursively across mutliple modules.
* A stack is used to keep track of the calls in the module system.
* This allows for call structures like the one seen below (located in experimental branch).

```
iBot
-> core
-> -> test_hookstack
-> -> -> test_hookstack2
-> -> -> -> test_hookstack
-> -> -> test_hookstack2
-> -> test_hookstack
-> core
iBot
```

#### Scheduled Fires

* Same syntax as `Server.fire('event', param1, param2, ...)`
* Syntax is `Server.scheduleFire(numMilliseconds, 'event', param1, param2, ...)`
* Works exactly the same way as fire except scheduled.
* Cancellation and duration changing coming soon.

#### `auto`

* `auto` currently autojoining of channels.
* `!auto join +` - adds a channel to autojoin
* `!auto join -` - removes a channel from autojoin
* `!auto join ?` - lists channels in autojoin

#### Bug Fixes

* Fixed module exceptions not being logged.
* Fixed modules being unable to access their own members.

#### `recv` changed to `$recv`

* Global events will be added soon.
* These will use the module hooks system without a module name.
* These will be fireable from any module and hookable from any module.
* The existing event `recv` has been changed to `$recv` to prepare for this.
* This will avoid any potential function name clashes (unless you use $ in your function names).

#### Mode Changes

* Mod `core` now fires the event `mode` for every mode change.
* The event is fired for each parsed mode (splits up complex changes such as +vv-o+h).
* More info can be found in `doc/events`.

#### Module Hooks

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

## License

Copyright (c) 2013, David Farrell.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of iBot nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

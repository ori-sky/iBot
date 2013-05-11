# iBot Framework

iBot is an IRC client-side framework designed to be extensible and easy to use.

## Usage

### Installation

```
npm install ibot
```

### Quick Start

It's very easy to connect to an IRC server using iBot.

##### index.js
```javascript
require('ibot').start();
```

##### config.json
```json
{
  "servers": {
    "example": {
      "host": "irc.example.com",
      "nick": "MyNick"
      "master": "^.+!.+@isp\.com$"
    }
  },
  "modules": [
    "core",
    "log"
  ]
}
```

`Server.master` is a regular expression which is used for permission checking. This may be changed to an authentication system at a later stage.

The IRC commands available through core are as follows. Angle bracket parameters are required, square bracket parameters are optional.

* `!lmctx <module>`                    - load a module instance into all servers
* `!umctx <module>`                    - unload a module from all servers
* `!lmsrv <module> [name]`             - load a module instance into the current server or the server specified by name
* `!umsrv <module> [name]`             - unload a module from the current server or the server specified by name
* `!modules [name]`                    - list the loaded modules for the current server or the server specified by name
* `!addsrv <name> <host> <nick> [ident] [port] [ssl true/false] [master] [modules a,b,etc]` - connects to a new server with the specified options
* `!rmsrv <name>`                      - disconnects from and removes the server specified by name
* `!quit`                              - disconnect from the current server and remove it

### Modules

iBot has an extensible and robust module system. A number of modules are bundled with the package, such as `core` and `log`. If you want to include other modules or write your own, this section explains how to do so. Modules should go inside a directory called `modules` in the project's root directory. They can be loaded by adding them to the `modules` section in config.json or by loading them through `core` at runtime.

##### Outputs `Hello, <nick>!`
```javascript
exports.mod = function(context)
{
	// hook into cmd event from core
	this.core$cmd = function(server, prefix, target, command, params)
	{
		if(command === 'helloworld')
		{
			// will output "Hello, <nick>!"
			server.send('PRIVMSG ' + target + ' :Hello, ' + prefix.nick + '!');
		}
	}
}
```
##### Increments a counter which saves and loads when reloaded

```javascript
exports.mod = function(context)
{
	this.counter = 0;

	// load data
	this._load = function(data)
	{
		if(typeof data === 'number') this.counter = data;
	}

	// save data
	this._save = function()
	{
		return this.counter;
	}

	// hook into cmd event from core
	this.core$cmd = function(server, prefix, target, command, params)
	{
		if(command === 'counter')
		{
			++this.counter;
			server.send('PRIVMSG ' + target + ' :Counter is now: ' + this.counter);
		}
	}
}
```

##### Detects CTCP requests and replies
```javascript
exports.mod = function(context)
{
	// hook into global recv event
	this.$recv = function(server, prefix, opcode, params)
	{
		// params[0] is target, params[1] is message
		switch(opcode)
		{
			case 'PRIVMSG':
				if(params[1][0] === '\001' && params[1][params[1].length - 1] === '\001')
				{
					console.log('detected CTCP request!');
				}
				break;
			case 'NOTICE':
				if(params[1][0] === '\001' && params[1][params[1].length - 1] === '\001')
				{
					console.log('detected CTCP reply!');
				}
				break;
		}
	}
}
```

## Changelog

Here you will find the list of changes in iBot.

#### State loading and saving

* Modules can now save their state before being reloaded and restore the state after being reloaded.
* Check the example modules (example_counter) for a simple incrementing counter.
* Currently only works when reloading a module - unloading and loading will wipe all module data.

#### JSON config

* iBot now supports JSON config files.
* Backwards compatibility exists for programmatic creation.
* Read the Quick Start section for more details.

#### Logging to channels

* The `log` module now has a `logTargets` method to log data to all of its target channels or users.
* Syntax is `server.do('log$logTargets', server, 'this is the data');`
* Targets can be added with `!log + #target` and removed with `!log - #target`

#### Method Calling

* Similar to how events can be fired from one source to many destinations, methods in one destination can be called from many sources.
* Syntax is `server.do('destinationModule$methodName', param1, param2, ...);`
* Methods can return a parameter.

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

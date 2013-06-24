## Changelog

Here you will find the list of changes in iBot.

#### `private.config.json`

* Module data is now saved to a separate file `private.config.json` instead of `config.json`.
* This will allow for easier config editing without having to sift through data.
* Various other changes - see commit messages for details.

#### `core` event changes

* `server` param has been removed from all events fired by core.
* Modules will have to be updated or they will most likely break.
* Additionally, `server` is now passed as the second param in module creation (first param being `context`).

#### `core$privmsg` function

* `core` now has a _privmsg function which can be used to send a PRIVMSG.
* See examples for usage.

#### Module `scheduler`

* Scheduler module added to replace Server.fireTimed.
* Now uses a segments/offset system to support very high durations (theoretically above 300.000,000,000,000 years)
* Segments determines how many 10 minute intervals to wait before scheduling offset.
* Offset determines how many milliseconds to schedule for.

Syntax is as follows:

`Server.do('scheduler$schedule', server, offset, segments, callback);`

#### Module `scraper`

* The scraper module provides a way to scrape data from a web page using a regexp.
* Config option `active` enables or disables usage of the `scrape` command.

#### Load & Save & Suspend & Resume

Module data storage is now complete.

* `load(data)`      - loads config data into module
* `save`            - saves module data into config
* `suspend`         - suspends module data before reload
* `resume(data)`    - resumes module data after reload

The ideal module should suspend and resume data which should only exist while the module is running, and save and load data which it considers to be more permanent. For example, a module which displays a custom message and keeps track of how many times it has been displayed while loaded should follow this life cycle.

* create
  * `load` - message
  * ...
  * reload begin
  * `suspend` - message, counter
  * `resume` - message, counter
  * reload end
  * ...
  * `save` - message
* destroy

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
			server.do('core$privmsg', server, target, 'world!');
		}
	}
}
```

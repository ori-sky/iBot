# iBot Framework

iBot is a `mods` module for a very lightweight, minimal, and extensible IRC client framework.

### Dependencies

```
$ npm install mods
$ npm install mods-config
```

## Usage

### Installation

```
$ npm install ibot
```

### Quick Start

Using iBot, it's very easy to create a minimal bot.

##### index.js
```javascript
var mods = new(require('mods'))
mods.load('mods-config')
mods.load('ibot')
```

##### config.json
```json
{
  "ibot": {
    "servers": {
      "example": {
        "host": "irc.example.com",
        "port": 6667,
        "ssl": false,
        "nick": "iBot",
        "user": "ibot"
      }
    }
  }
}
```

### Essentials

You probably want iBot to do more than, well, nothing, so it's a good idea to install `ibot-essentials`.

```
$ npm install ibot-essentials
```

In this example, iBot shows data sent/received, responds to server PINGs, and automatically joins some channels on connect.

##### index.js
```javascript
var mods = new(require('mods'))
mods.load('mods-config')
mods.load('ibot')
mods.load('ibot-essentials/mods/core')
mods.load('ibot-essentials/mods/output')
mods.load('ibot-essentials/mods/ping')
mods.load('ibot-essentials/mods/autojoin')
```

##### config.json
```json
{
  "ibot": {
    "servers": {
      "example": {
        "host": "irc.example.com",
        "port": 6667,
        "ssl": false,
        "nick": "iBot",
        "user": "ibot"
      }
    }
  },
  "ibot_autojoin": {
    "channels": [
      "#ibot",
      "#programming",
      "#self-learning-for-dummies"
    ]
  }
}
```

### Example Module

This is an example `mods` module which greets users who join a channel. There is a lot of room for improvement but it shows how iBot modules are written.

##### greet.js
```javascript
exports.name = 'greet'
exports.ibot$recv = function(server, message)
{
    if(message.opcode === 'JOIN')
    {
        server.send('PRIVMSG ' + message.params[0] + ' :Welcome, ' + message.prefix.nick + '!!')
    }
}
```

## Why?

iBot doesn't have a module system, nor does it have a config system. It doesn't include any modules either. Versions of iBot before v0.7.0 did. So, why not?

The module and config systems in previous versions of iBot were completely rewritten as generic, self-contained systems which can be used in any project (not just iBot). This means that the most important part of iBot - the iBot framework itself - is very concise and lightweight, and can be used without any module system or config system if desired. Additionally, it means that the config system it *does* use can be swapped out with another config system entirely.

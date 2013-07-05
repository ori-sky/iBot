var util = require('util');
var crypto = require('crypto');

exports.mod = function(context, server)
{
	this.Account = function(username)
	{
		this.version = 1;
		this.username = username;
		this.accesslevel = 1;
		this.privileges = [];
	};

	this.accounts = {};
	this.logins = {};

	this.help$register = function()
	{
		server.do('help$register', 'account');
	}

	this._help = function(topic, params)
	{
		switch(topic)
		{
			case 'account':
				switch(params[0])
				{
					case 'register':
						return 'Register a new account.';
					case 'login':
						return 'Log into your account.';
					case 'logout':
						return 'Log out of your account.';
					case 'setpass':
						return 'Change your account password.';
					default:
						return {
							text: 'A simple account system.',
							sub: ['register', 'login', 'logout', 'setpass']
						};
				}
				break;
		}
	}

	this._load = function(data)
	{
		if(data.accounts !== undefined) this.accounts = data.accounts;
	}

	this._suspend = function()
	{
		return {
			accounts: this.accounts,
			logins: this.logins
		};
	}

	this._resume = function(data)
	{
		if(data.accounts !== undefined) this.accounts = data.accounts;
		if(data.logins !== undefined) this.logins = data.logins;
	}

	this._save = function()
	{
		return {
			accounts: this.accounts
		};
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'account')
		{
			switch(params[0])
			{
				case 'register':
					$core._hide_current_message();

					var syntax = 'Syntax: account register <username> <password>';
					var username = params[1];
					var password = params[2];

					if(password === undefined)
					{
						$core._privmsg(target, syntax);
						break;
					}

					if(this.logins[prefix.nick] !== undefined)
					{
						$core._privmsg(target, 'You are already logged in.');
						break;
					}

					var lusername = username.toLowerCase();

					if(this.accounts[lusername] !== undefined)
					{
						$core._privmsg(target, 'That account is already registered.');
						break;
					}

					this.accounts[lusername] = new this.Account(username, password);
					this._setpass(lusername, password);

					this.logins[prefix.nick] = lusername;
					$core._privmsg(target, 'Your account has been created. You are now logged in.');

					break;
				case 'login':
					$core._hide_current_message();

					var syntax = 'Syntax: account login <username> <password>';
					var username = params[1];
					var password = params[2];

					if(password === undefined)
					{
						$core._privmsg(target, syntax);
						break;
					}

					if(this.logins[prefix.nick] !== undefined)
					{
						$core._privmsg(target, 'You are already logged in.');
						break;
					}

					var lusername = username.toLowerCase();

					if(this.accounts[lusername] === undefined)
					{
						$core._privmsg(target, 'That account is not registered.');
						break;
					}

					if(this._checkpass(lusername, password) !== true)
					{
						$core._privmsg(target, 'Password incorrect.');
						break;
					}

					this.logins[prefix.nick] = lusername;
					$core._privmsg(target, 'You are now logged in.');
					break;
				case 'logout':
					if(this.logins[prefix.nick] === undefined)
					{
						$core._privmsg(target, 'You are not logged in.');
						break;
					}

					delete this.logins[prefix.nick];
					$core._privmsg(target, 'You are now logged out.');
					break;
				case 'hash':
					var hash = this._hash(params[1], params[2]);

					$core._privmsg(target, 'Hash: ' + util.inspect(hash[0]));
					$core._privmsg(target, 'Salt: ' + util.inspect(hash[1]));
					break;
				case 'setpass':
					$core._hide_current_message();

					var syntax = 'Syntax account setpass [username] <password>';
					var username = params[1];
					var password = params[2];

					if(password === undefined)
					{
						$core._privmsg(target, syntax);
						break;
					}

					var lusername = username.toLowerCase();

					if(this.logins[prefix.nick] === lusername || $core._authed(prefix))
					{
						this._setpass(lusername, password);
						$core._privmsg(target, 'Password set.');
					}
					else
					{
						$core._privmsg(target, 'You are not allowed to use this command.');
					}

					break;
				case 'setlevel':
					if($core._authed(prefix))
					{
						var syntax = 'Syntax: account setlevel <username> <level>';
						var username = params[1];

						var level = params[2];;
						if(level === '*') level = 1000000000;
						else if(level === '-*') level = -1000000000;
						else level = parseInt(level);

						if(isNaN(level))
						{
							$core._privmsg(target, syntax);
							break;
						}

						var lusername = username.toLowerCase();

						if(this.accounts[lusername] === undefined)
						{
							$core._privmsg(target, 'That account is not registered.');
							break;
						}

						this.accounts[lusername].accesslevel = level;
						$core._privmsg(target, 'Access level set to ' + level + '.');
					}
					break;
				case 'getall':
					if($core._authed(prefix))
					{
						var syntax = 'Syntax: account getall <username>';
						var username = params[1];

						if(username === undefined)
						{
							$core._privmsg(target, syntax);
							break;
						}

						var lusername = username.toLowerCase();

						if(this.accounts[lusername] === undefined)
						{
							$core._privmsg(target, 'That account is not registered.');
							break;
						}

						$core._privmsg(target, util.inspect(this.accounts[lusername]));
					}
					break;
				case 'wipe':
					if($core._authed(prefix))
					{
						this.accounts = {};
						$core._privmsg(target, 'All accounts wiped from data.');
					}
					break;
			}
		}
	}

	this._setpass = function(username, password)
	{
		var h = server.do('account$hash', password, undefined);
		this.accounts[username].passhash = h[0];
		this.accounts[username].passsalt = h[1];
	}

	this._checkpass = function(username, password)
	{
		if(this.accounts[username] !== undefined)
		{
			var h = server.do('account$hash', password, this.accounts[username].passsalt);
			if(h[0] === this.accounts[username].passhash) return true;
		}

		return false;
	}

	this._checkpasslevel = function(username, password, level)
	{
		if(this._checkpass(username, password) && this.accounts[username].accesslevel >= level) return true;
		else return false;
	}

	this._authed = function(prefix, priv, level)
	{
		if(this.logins[prefix.nick] !== undefined)
		{
			if(this.accounts[this.logins[prefix.nick]].privileges.indexOf(priv) !== -1) return true;
			if(this.accounts[this.logins[prefix.nick]].accesslevel >= level) return true;
		}

		return false;
	}

	this._getlogin = function(prefix)
	{
		return this.logins[prefix.nick];
	}

	this._hash = function(data, salt)
	{
		var iters = 100000;
		var saltlen = 10;
		var keylen = 50;

		try
		{
			if(salt === undefined) salt = crypto.randomBytes(saltlen).toString('ascii');

			var hash = crypto.pbkdf2Sync(data, salt, iters, keylen).toString();

			return [
				hash,
				salt
			];
		}
		catch(e)
		{
			console.log(e);
			return undefined;
		}
	}
}

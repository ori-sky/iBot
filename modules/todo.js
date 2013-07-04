exports.mod = function(context, server)
{
	this.max_length = 10;
	this.lists = {};

	this.help$register = function()
	{
		server.do('help$register', 'todo');
	}

	this._help = function(topic, params)
	{
		switch(topic)
		{
			case 'todo':
				switch(params[0])
				{
					case '+':
						return 'Add an entry to your todo list.';
					case '-':
						return 'Remove an entry from your todo list.';
					case '?':
						return 'Display your todo list.';
					default:
						return {
							text: 'Add an entry to your todo list.',
							sub: ['-', '?']
						};
				}
				break;
		}
	}

	this._load = function(data)
	{
		if(data.max_length !== undefined) this.max_length = data.max_length;
		if(data.lists !== undefined) this.lists = data.lists;
	}

	this._suspend = function()
	{
		return {
			max_length: this.max_length,
			lists: this.lists
		};
	}

	this._resume = function(data)
	{
		if(data.max_length !== undefined) this.max_length = data.max_length;
		if(data.lists !== undefined) this.lists = data.lists;
	}

	this._save = function()
	{
		return {
			max_length: this.max_length,
			lists: this.lists
		};
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'todo')
		{
			switch(params[0])
			{
				case '-':
					var syntax = 'Syntax: todo - <entry #>';
					var entry_no = parseInt(params[1]);
					var num_to_remove = parseInt(params[2]);

					// TODO: implement ranges
					num_to_remove = 1;

					if(isNaN(entry_no)) { $core._privmsg(target, syntax); break; }
					if(isNaN(num_to_remove)) num_to_remove = 1;

					var login = server.do('account$getlogin', prefix);

					if(login === undefined)
					{
						$core._privmsg(target, 'You are not logged in.');
						break;
					}

					if(entry_no < 1 || this.lists[login] === undefined || this.lists[login].length < entry_no)
					{
						$core._privmsg(target, 'That entry does not exist on your todo list.');
						break;
					}

					var entry = this.lists[login].splice(entry_no - 1, num_to_remove);

					var s = (num_to_remove === 1) ? 'entry' : 'entries';

					$core._privmsg(target, 'Removed ' + entry.length + ' ' + s + ' from todo list. Sending removed ' + s + ' via NOTICE.');

					for(var i=0; i<entry.length; ++i)
					{
						$core._notice(prefix.nick, '#' + (entry_no + i) + ': ' + entry[i].data);
					}
					break;
				case '?':
				case '':
				case undefined:
				case null:
					var login = server.do('account$getlogin', prefix);

					if(login === undefined)
					{
						$core._privmsg(target, 'You are not logged in.');
						break;
					}

					if(this.lists[login] === undefined || this.lists[login].length === 0)
					{
						$core._privmsg(target, 'Your todo list is empty.');
						break;
					}

					$core._privmsg(target, 'Sending todo list via NOTICE.');

					for(var iTodo=0; iTodo<this.lists[login].length; ++iTodo)
					{
						$core._notice(prefix.nick, '#' + (iTodo + 1) + ': ' + this.lists[login][iTodo].data);
					}

					break;
				default:
					var syntax = 'Syntax: todo <data>';
					var data = params.join(' ');

					if(data === '') { $core._privmsg(target, syntax); break; }

					var login = server.do('account$getlogin', prefix);

					if(login === undefined)
					{
						$core._privmsg(target, 'You are not logged in.');
						break;
					}

					if(this.lists[login] === undefined) this.lists[login] = [];

					if(this.lists[login].length === this.max_length)
					{
						$core._privmsg(target, 'Too many entries on todo list (max=' + this.max_length + ').');
						break;
					}

					// TODO: make priority configurable
					this.lists[login].push({data: data, priority: 5});

					$core._privmsg(target, 'Added entry to todo list.');
					break;
			}
		}
	}
}

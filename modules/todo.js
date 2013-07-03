exports.mod = function(context, server)
{
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
							text: 'A simple account-based todo list.',
							sub: ['+', '-', '?']
						};
				}
				break;
		}
	}

	this.core$cmd = function(prefix, target, cmd, params, $core)
	{
		if(cmd === 'todo')
		{
			switch(params[0])
			{
				case '+':
					var syntax = 'Syntax: todo + <data>';
					var data = params.slice(1).join(' ');

					if(data === '') { $core._privmsg(target, syntax); break; }

					var login = server.do('account$getlogin', prefix);

					if(login === undefined)
					{
						$core._privmsg(target, 'You are not logged in.');
						break;
					}

					if(this.lists[login] === undefined) this.lists[login] = [];

					// TODO: make priority configurable
					this.lists[login].push({data: data, priority: 5});

					$core._privmsg(target, 'Added entry to todo list.');
					break;
				case '-':
					var syntax = 'Syntax: todo - <entry #>';
					var entry_no = parseInt(params[1]);

					if(isNaN(entry_no)) { $core._privmsg(target, syntax); break; }

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

					var entry = this.lists[login].splice(entry_no - 1, 1);

					$core._privmsg(target, 'Removed entry from todo list. Sending removed entry via NOTICE.');
					$core._notice(prefix.nick, '#' + entry_no + ': ' + entry[0].data);
					break;
				case '?':
				default:
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
			}
		}
	}
}

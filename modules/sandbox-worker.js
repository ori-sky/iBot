var fs = require('fs');
var vm = require('vm');
var sandbox = vm.createContext({});

fs.readFile('./mod_sandbox-sandbox.json', function(err, data)
{
	if(err)
	{
		console.error(err);
	}
	else
	{
		JSON.parse(data, function(key, val)
		{
			try
			{
				var js;

				if(typeof val === 'string' && val[0] === '\\')
				{
					js = key + '=\'' + val + '\'';
				}
				else js = key + '=' + val;

				console.log(js);
				vm.runInContext(js, sandbox);
			}
			catch(e)
			{
				console.log(e);
			}
		});
	}
});

process.on('message', function(m)
{
	sandbox._ =
	{
		root: sandbox,
		echoResult: false,
		output: '',
		params: m.params,
		words: m.words
	}

	var reply =
	{
		echoResult: false,
		result: result,
		output: ''
	}

	try
	{
		var result = vm.runInContext(m.js, sandbox);

		var reply =
		{
			echoResult: sandbox._.echoResult,
			result: result,
			output: sandbox._.output
		}

		delete sandbox._;

		var jsonString = JSON.stringify(sandbox, function(key, val)
		{
			if(typeof val === 'function') return val.toString();
			else if(typeof val === 'string') return '\\' + val.toString();
			else return val;
		}, 2);

		fs.writeFile('./mod_sandbox-sandbox.json', jsonString, function(err)
		{
			console.log('Write error: ' + err);
		});
	}
	catch(e)
	{
		console.error(e.stack);
		reply.output += 'PRIVMSG ' + m.target + ' :JavaScript error: ' + e.message;
	}

	process.send(reply);
});

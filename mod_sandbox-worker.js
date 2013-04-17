var vm = require('vm');
var sandbox = vm.createContext({});

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
	}
	catch(e)
	{
		console.error(e.stack);
		reply.output += 'PRIVMSG ' + m.target + ' :JavaScript error: ' + e.message;
	}

	process.send(reply);
});

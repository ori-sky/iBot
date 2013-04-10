exports._Context = require('./iBot-Context.js');
exports._Server = require('./iBot-Server.js');
exports._User = require('./iBot-User.js');
exports._Channel = require('./iBot-Channel.js');
exports._Mode = require('./iBot-Mode.js');

exports.Context = exports._Context.Context;
exports.Server = exports._Server.Server;
exports.User = exports._User.User;
exports.Channel = exports._Channel.Channel;
exports.Mode = exports._Mode.Mode;

exports.exit = function()
{
	exports._Server.exit();
}

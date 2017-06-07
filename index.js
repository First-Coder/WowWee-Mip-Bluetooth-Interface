/*
	Include das Express Modul
*/
var express 		= 	require("express")
,	app 			= 	express();

/*
	Include das HTTP Modul
*/
var	server		=	require("http").createServer(app);

/*
	Include das Socket Modul
*/
var	io			=	require("socket.io")(server);

/*
	Include  das MIP Modul
*/
var mip 					= 	require("wowweemip")
,	mipFinder				= 	new mip.Finder()
,	MiPRobot 				= 	mip.Robot;

/*
	Definitionen
*/
const PORT					=	5000;
const DEBUG					=	true;

function Bot(bot)
{
	this.bot = bot;
	
	this.getBotId 			= 	bot._peripheral.id;
	this.getBotName			=	bot.name;
	this.isConnected		=	false;
	this.connectErrorMsg	=	"";
};

function getRobotlist()
{
	var returnArray			=	new Array();
	for(var bot of Robots)
	{
		infoArray			=	{};
		infoArray['id']		=	bot.getBotId;
		infoArray['name']	=	bot.getBotName;
		returnArray.push(infoArray);
	};
	return JSON.stringify(returnArray);
};

function getConnectStatus(bot)
{
	var returnArray			=	{};
	returnArray['success']	=	bot.isConnected;
	returnArray['msg']		=	bot.connectErrorMsg;
	return JSON.stringify(returnArray);
};

/*
	Variabeln
*/
var Robots = [], ConnectedBot;

/*
	Konfigurationen
*/
server.listen(PORT);
app.use(express.static(__dirname + '/web'));

/*
	Socket
*/
io.sockets.on('connection', function(socket) {
	// Socket um Farbe zu ändern
	socket.on('setLed', function(r, g, b) {
		MiPRobot.prototype.setMipChestLedWithColor.call(ConnectedBot.bot, r, g, b, 0x00);
	});
	
	// Socket um Farbe zu ändern
	socket.on('playSound', function(soundNumber) {
		MiPRobot.prototype.playMipSound.call(ConnectedBot.bot, soundNumber, 0);
	});
	
	// Socket Drive
	socket.on('drive', function(cm) {
		MiPRobot.prototype.driveDistanceByCm.call(ConnectedBot.bot, cm, 0);
	});
	
	// Socket Direction
	socket.on('direction', function(degree) {
		MiPRobot.prototype.driveDistanceByCm.call(ConnectedBot.bot, 10, degree);
	});
	
	// Socket mit vorhandenen Botnamen
	socket.emit('getBotconnections', getRobotlist());
	
	// Socket um mit Bot zu verbinden
	socket.on('botConnect', function(id) {
		for(var bot of Robots)
		{
			if(DEBUG)
			{
				console.log("--> Try to connect to: "+bot.getBotId);
			};
			if(bot.getBotId == id)
			{
				mipFinder.connect(bot.bot, function(err) {
					if (err != null)
					{
						if(DEBUG)
						{
							console.log("--> Connect failed: "+err);
						};
						bot.connectErrorMsg 	=	err;
						socket.emit('getConnectStatus', getConnectStatus(bot));
						return;
					};
					
					if(DEBUG)
					{
						console.log("--> Connect was successful!");
						console.log('----------------------------------------------------------------');
					};
					bot.isConnected				=	true;
					ConnectedBot				=	bot;
					
					ConnectedBot.bot.enableBTReceiveDataNotification(true, function(err, data) {
						if (err)
						{
							console.log(err);
							return;
						};
							
						ConnectedBot.bot.convertMiPResponse(data, function(command, arr)
						{
							if(DEBUG)
							{
								console.log("--> "+command+": "+arr);
							};
							
							var returnArray			=	{};
							returnArray['comand']	=	command;
							returnArray['value']	=	arr;
							returnArray['id']		=	ConnectedBot.getBotId;
							
							socket.emit('receiveMessage', JSON.stringify(returnArray));
						});
					});
					
					MiPRobot.prototype.readMipHardwareVersion.call(ConnectedBot.bot);
					MiPRobot.prototype.readMipFirmwareVersion.call(ConnectedBot.bot);
					//ConnectedBot.bot.readMipVolumeLevel;
					/*ConnectedBot.bot.readMipStatus(function(data)
					{
						console.log(data);
					});*/
					/*console.log(ConnectedBot.bot.(100, 0, function(err) {
			console.log("moving toward");
		}));*/
					
					socket.emit('getConnectStatus', getConnectStatus(bot));
				});
			};
		};
		/*var selectedRobot, mipFinder	= new mip.Finder();
		
		for(var bot of Robots)
		{
			if(bot.Name == data)
			{
				selectedRobot = bot
			};
		};*/
		/*mipFinder.scan(function(err, robots) {
			console.log("GALL");
			if (err != null)
			{
				console.log(err);
				return;
			};
			
			for (var i in robots)
			{
				console.log(robots[i].name+" vs "+data);
				if(robots[i].name == data)
				{
					console.log(robots[i].name);
					mipFinder.connect(robots[i], function(err) {
						console.log(data);
					});
				};
			};
		});*/
		
	});
});


console.log('----------------------------------------------------------------');
console.log('---> Studienprojekt MIP Control');
console.log('----------------------------------------------------------------');
console.log('---> Entwickler: Benjamin Hoheisel');
console.log('---> Entwickler: Lukas Gundermann');
console.log('----------------------------------------------------------------');
console.log('---> Server: http://localhost:'+PORT+'/');
console.log('----------------------------------------------------------------');
mipFinder.scan(function(err, robots) {
	if (err != null)
	{
		console.log(err);
		return;
	};
	
	for (var i in robots)
	{
		Robots.push(new Bot(robots[i]));
		if(DEBUG)
		{
			console.log('---> Found bot: '+robots[i].name);
		};
	};
	
	if(DEBUG)
	{
		console.log('----------------------------------------------------------------');
	};
});
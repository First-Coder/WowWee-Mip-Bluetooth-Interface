/*
	Express Modul eingebunden (stellt für den Webserver statische Dateien bereit )
*/
var express 		= 	require("express")
,	app 			= 	express();

/*
	HTTP Modul eingebunden (stellt Webserverdienste bereit, Zur deklaration eines Ports verwendet)
*/
var	server		=	require("http").createServer(app);

/*
	Socket Modul eingebunden (ermöglicht Kommunikation zwischen Webinterface und main.js. Informationsübermittlung via Socket Event)
*/
var	io						=	require("socket.io")(server);

/*
	MIP Modul eingebunden (SDK beinhaltet Funktionen und Definitionen zur Bluetoothansteuerung des MIP und seiner Bestandteile)
*/
var mip 					= 	require("wowweemip")
,	mipFinder				= 	new mip.Finder()
,	MiPRobot 				= 	mip.Robot;

/*
	Definitionen
*/
const PORT					=	5000;						//Der Port wurde als 5000 definiert, kann jedoch geändert werden
const DEBUG					=	true;						//Sollen Zusaetzliche Informationen in der Shellconsole angezeigt werden?

/*
	Object: Bot
*/
function Bot(bot)											//Funktion zur Abfrage von verfügbaren MIPs
{
	this.bot = bot;
	this.getBotId 			= 	bot._peripheral.id;			//Ließt MIP Identitätsnummer aus
	this.getBotName			=	bot.name;					//Ließt MIP Name aus
	this.isConnected		=	false;						//Setzt Verbindung auf false, MIP nicht verbunden
	this.connectErrorMsg	=	"";
};

/*
	Funktion: Funktion zum erstellen eines Arrays, welches die Daten der gefundenen MIPs beinhaltet
*/
function getRobotlist()
{
	var returnArray			=	new Array();
	for(var bot of Robots)
	{
		infoArray			=	{};
		infoArray['id']		=	bot.getBotId;				//MIP ID
		infoArray['name']	=	bot.getBotName;				//MIP Name
		returnArray.push(infoArray);
	};
	return JSON.stringify(returnArray);
};

/*
	Funktion: Funktion zur Abfrage des Verbindungsstatus des MIP
*/
function getConnectStatus(bot)
{
	var returnArray			=	{};
	returnArray['success']	=	bot.isConnected;			//gibt 'success' aus, wenn MIP erfolgreich verbunden
	returnArray['msg']		=	bot.connectErrorMsg;		//gibt 'msg' (Fehlermeldung) aus wenn Verbindung fehlgeschlagen
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
	Socket (für die Kommunikation zwischen Webinterface und main.js)
*/
io.sockets.on('connection', function(socket) {
	// Socket um Farbe zu ändern
	socket.on('setLed', function(r, g, b) {
		MiPRobot.prototype.setMipChestLedWithColor.call(ConnectedBot.bot, r, g, b, 0x00);		//setzt LED standardgemäß auf aus. Farbeinstellung erfolgt über Webinterface
	});
	
	// Socket um Sound abzuspielen
	socket.on('playSound', function(soundNumber) {
		MiPRobot.prototype.playMipSound.call(ConnectedBot.bot, soundNumber, 0);					//Ruft je nach Wahl den entsprechenden Sound auf
	});
	
	// Socket zum Fahren
	socket.on('drive', function(cm) {
		MiPRobot.prototype.driveDistanceByCm.call(ConnectedBot.bot, cm, 0);						//Fahrdistanz standardgemäß auf 0. Je nach Wahl wird die gewünschte Distanz übergeben und ausgeführt
	});
	
	// Socket für Fahrrichtung
	socket.on('direction', function(degree) {
		MiPRobot.prototype.driveDistanceByCm.call(ConnectedBot.bot, 3, degree);				//Fahrtrischtung in Grad. Auch über Webinterface einstellbar.
	});
	
	// Socket mit vorhandenen Botnamen
	socket.emit('getBotconnections', getRobotlist());
	
	// Socket um mit Bot zu verbinden
	socket.on('botConnect', function(id) {
		for(var bot of Robots)
		{
			if(DEBUG)
			{
				console.log("--> Try to connect to: "+bot.getBotId);									//schreibt ins Log, mit welchem MIP sich derzeit versucht wird zu verbinden
			};
			if(bot.getBotId == id)
			{
				mipFinder.connect(bot.bot, function(err) {	
					if (err != null)																	//Tritt ein Verbindungsfehler auf, wird folgende Anweisung aufgerufen
					{
						if(DEBUG)
						{
							console.log("--> Connect failed: "+err);									//Konsole gibt aus: "--> Connect failed: " und Fehlercode
						};	
						bot.connectErrorMsg 	=	err;
						socket.emit('getConnectStatus', getConnectStatus(bot));
						return;
					};
					
					if(DEBUG)																			//War die Verbindung erfolgreich, wird folgende If Anweisung aufgerufen
					{	
						console.log("--> Connect was successful!");										//Konsolenlogeintrag "--> Connect was successful!"
						console.log('----------------------------------------------------------------');
					};
					bot.isConnected				=	true;												//Setzt Verbindungsstatus auf true (Verbunden)
					ConnectedBot				=	bot;												//übergibt verbundenen Bot an Variable bot
					
					ConnectedBot.bot.enableBTReceiveDataNotification(true, function(err, data) {		//Prüft ob gesendete Daten empfangen wurden
						if (err)																		//Nicht empfangen -> Fehler
						{
							console.log(err);
							return;
						};
							
						ConnectedBot.bot.convertMiPResponse(data, function(command, arr)
						{
							if(DEBUG)																	//Empfangen -> Gibt aus, was empfangen wurde
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
					socket.emit('getConnectStatus', getConnectStatus(bot));
				});
			};
		};
	});
});

//gibt den folgenden Text in Konsole aus
console.log('----------------------------------------------------------------');
console.log('---> Studienprojekt MIP Control');
console.log('----------------------------------------------------------------');
console.log('---> Entwickler: Benjamin Hoheisel');
console.log('---> Entwickler: Lukas Gundermann');
console.log('----------------------------------------------------------------');
console.log('---> Server: http://localhost:'+PORT+'/');
console.log('----------------------------------------------------------------');

//Funktion zum scannen nach verfügbaren Bluetoothverbindungen von MIPs
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
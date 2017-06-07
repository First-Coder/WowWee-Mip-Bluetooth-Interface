$(document).ready(function() {
	socket.on('getBotconnections', function(data) {
		var infos		=	JSON.parse(data);
		var rows		=	[];
		
		for(var row of infos)
		{
			rows.push({
				name:				row.name,
				hardwareversion:	'<font id="'+row.id+'_hw">Unbekannt</font>',
				firmewareversion:	'<font id="'+row.id+'_fw">Unbekannt</font>',
				actions:			'<button id="'+row.id+'" onClick="Connect(\''+row.id+'\');" class="btn btn-primary btn-sm"><i class="fa fa-sign-in" aria-hidden="true"></i> Verbinden</button>',
				id:					row.id
			});
		};
		
		$('#mipTable').bootstrapTable('append', rows);
	});
	
	socket.on('receiveMessage', function(data) {
		var infos		=	JSON.parse(data);
		
		switch(infos.comand)
		{
			case "GET_HARDWARE_VERSION":
				document.getElementById(infos.id+"_hw").innerHTML = infos.value;
				break;
			case "GET_SOFTWARE_VERSION":
				document.getElementById(infos.id+"_fw").innerHTML = infos.value;
				break;
		};
		console.log(infos);
	});
});

function direction(right)
{
	socket.emit('direction', (!right) ? (-10) : 10);
};

function driveForward(backward)
{
	var driveInCm 	=	(($('#distanceMSlider').val()) * 10)+$('#distanceCmSlider').val();
	socket.emit('drive', (backward) ? (driveInCm*-1) : driveInCm);
};

function PlaySound(sound)
{
	socket.emit('playSound', sound);
};

function setRobotColor()
{
	var rval	=	document.getElementById('valR').value;
	var gval	=	document.getElementById('valG').value;
	var bval 	=	document.getElementById('valB').value;
	
	if(rval <= 0)
	{
		rval	=	0;
	};
	
	if(gval <= 0)
	{
		gval	=	0;
	};
	
	if(bval <= 0)
	{
		bval	=	0;
	};
	
	socket.emit('setLed', rgb2hex(rval), rgb2hex(gval), rgb2hex(bval));
};

function rgb2hex(value)
{
	return	("0x" + parseInt(value,10).toString(16));
		
	//http://jsfiddle.net/Mottie/xcqpF/1/light/
};

function Connect(id)
{
	socket.emit('botConnect', id);
	socket.on('getConnectStatus', function(data) {
		var infos		=	JSON.parse(data);
		
		if(infos.success)
		{
			$('#'+id).removeClass("btn-primary");
			$('#'+id).addClass("btn-success");
			$('#'+id).attr("onClick", "");
			
			document.getElementById(id).innerHTML = '<i class="fa fa-check" aria-hidden="true"></i> Verbunden';
			
			$('button').prop("disabled", false);
		}
		else
		{
			alert("UPS");
		};
	});
};

/* Function to Change to Connectiontype */
function ChangeConnectTypeClass()
{
	var btn		=	$("#connectType");
	if(btn.hasClass("btn-primary"))
	{
		btn.removeClass("btn-primary");
		btn.addClass("btn-success");
		
		document.getElementById("connectType").innerHTML = "<i class='fa fa-plug'></i> Kabel";
	}
	else
	{
		btn.removeClass("btn-success");
		btn.addClass("btn-primary");
		
		document.getElementById("connectType").innerHTML = "<i class='fa fa-bluetooth'></i> Bluetooth";
	};
};

/* Bootstrap tables */
$('#mipTable').bootstrapTable({
	formatNoMatches: function()
	{
		return "Keine MIPs gefunden";
	}
});


/* Sliders */
$("#soundSlider").slider();
$("#soundSlider").on("slide", function(slideEvt) {
	$("#soundSliderVal").text(slideEvt.value);
});

$("#distanceCmSlider").slider();
$("#distanceCmSlider").on("slide", function(slideEvt) {
	$("#distanceCmSliderVal").text(slideEvt.value);
});

$("#distanceMSlider").slider();
$("#distanceMSlider").on("slide", function(slideEvt) {
	$("#distanceMSliderVal").text(slideEvt.value);
});
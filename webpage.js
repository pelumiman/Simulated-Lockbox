var express =require("express"); //requires express app

//Setup of express app
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);//sets up socket.io 

var SerialPort = require('serialport');
var Readline = require('@serialport/parser-readline');
//checks if port is successfully opened
var port = new SerialPort('COM3', {baudRate: 9600}, function (err) {
  if (err) {
    return console.log('Error on port open: ', err.message);
  }
  console.log('Serial Port Open');
});
var parser = port.pipe(new Readline());  // seperate data input using newlines
var state = 0;

// routes the HTTP GET Requests to the path which is being specified 
app.get('/', function(req, res){
  res.sendFile(__dirname + '/webpage.html');
});
//used to mount the specified middleware function(s) at the path which is being specified
app.use('/static', express.static(__dirname + '/public'));

//This code will notify when the user connects, disconnects or writes a message 
io.on('connection', function(socket){
  socket.on('disconnect', function(){
	io.emit('nClientUpdate', {});//emit to webpage
  });
  //if the message wriiten starts with setPW and then the string, 
  socket.on('setPW',function(msg){
    var str = 'setPW:'+msg.PW.toString()+'\n';
    port.write(str, function(err) {
     // outputs message wriiten to the console or it outputs the error message
    if (err) {
     return console.log('Error on port write: ', err.message);
    }
    console.log('message written');
   });
   
  });
  io.emit('nClientUpdate', {});//emit to webpage
});

//Data handler for data received from Serialport via parser
parser.on('data', function(data) {
	var dataStr = data.toString();
    console.log(dataStr);
	if(dataStr == 'Door opened\r'){
		state=1;
	}else if(dataStr == 'Door closed\r'){
		state=0;
	}
	io.emit('DoorStateUpdate', {door:state});	
});

//is called when port gets closed
port.on('close', function() {
  console.log('Port closed');
})
//called if there is an eror on the port
port.on('error', function(err) {
  console.log('Error on port: ', err.message);
})
//Starts the HTTP server listening for connections.
http.listen(4000, function(){
  console.log('listening on *:4000');
});

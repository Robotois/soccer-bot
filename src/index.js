const  nm = require('node-machine-id');
const mqtt = require('mqtt');
const MotorController = require('robotois-servo-controller');

const motorController = new MotorController();

let id = nm.machineIdSync({original: true});
const clientId = `SoccerBot-${id}` || 'SoccerBot-01';
const myTopic = `SoccerBots/${clientId}`;

const client = mqtt.connect('mqtt://192.168.50.27', { clientId });

//console.log(clientId);

client.on('connect', function () {
  client.subscribe(myTopic);
});

client.on('message', function(topic, message) {
  //console.log(clientId);
  const msgStr = message.toString();
  const msgObj = JSON.parse(msgStr);
  //console.log(msgObj);
  motorController.drive(msgObj.x, msgObj.y, msgObj.r);
});

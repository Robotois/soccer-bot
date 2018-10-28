const  nm = require('node-machine-id');
const mqtt = require('mqtt');
const MotorController = require('robotois-servo-controller');
const LEDStrip = require('robotois-ws2811');
const led = new LEDStrip(16);
const Gpio = require('onoff').Gpio;
const IP = '192.168.50.27';

const colors = {
  primary: '#00d1b2',
  link: '#3273dc',
  info: '#209cee',
  success: '#23d160',
  warning: '#ffdd57',
  error: '#ff3860',
};

const solenoid = new Gpio(17, 'out');
solenoid.writeSync(0);
let kickTimeout = false;

const motorController = new MotorController();

let id = nm.machineIdSync({original: true});
const clientId = `SoccerBot-${id}` || 'SoccerBot-01';
const myTopic = `SoccerBots/${clientId}`;

const client = mqtt.connect(`mqtt://${IP}`, { clientId });

//console.log(clientId);

client.on('connect', function () {
  client.subscribe(myTopic);
  led.allOn(colors['primary']);
});

client.on('message', function(topic, message) {
  //console.log(clientId);
  const msgStr = message.toString();
  const msgObj = JSON.parse(msgStr);
  const { x, y, r, k, l } = msgObj;
  //console.log(msgObj);
  motorController.drive(msgObj.x, msgObj.y, msgObj.r);
  if (k !== undefined && k == 1 && kickTimeout == false) {
    solenoid.writeSync(1);
    kickTimeout = setTimeout(() => {
      solenoid.writeSync(0);
      clearTimeout(kickTimeout);
      kickTimeout = false;
    }, 500);
  }
});

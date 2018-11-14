const fs = require('fs');
const path = require('path');
const nm = require('node-machine-id');
const mqtt = require('mqtt');
const MotorController = require('robotois-servo-controller');
const LEDStrip = require('robotois-ws2811');
const Gpio = require('onoff').Gpio;
let config = require('./config.json');
const { BROKER_IP } = require('./constants');

const colors = {
  primary: '#00d1b2',
  link: '#3273dc',
  info: '#209cee',
  success: '#23d160',
  warning: '#ffdd57',
  error: '#ff3860',
  yellow: '#FFC107',
  white: '#F5F5F5',
  purple: '#9C27B0',
};

const leds = new LEDStrip(25);
const solenoid = new Gpio(17, 'out');
let kickTimeout = false;
const motorController = new MotorController();
let id;
let team;
let number;

let clientId;
let myTopic;
let client;
let celebrateTimeout = false;

function clientInit() {
  solenoid.writeSync(0);
  team = config.team;
  number = config.number;
  if (team !== null && number !== null) {
    clientId = `SoccerBot-${team}-${number}`;
  } else {
    id = nm.machineIdSync({original: true});
    clientId = `SoccerBot-${id}` || 'SoccerBot-01';
  }

  myTopic = `SoccerBots/${clientId}`;
  client = mqtt.connect(`mqtt://${BROKER_IP}`, { clientId });
  client.on('connect', function () {
    client.subscribe(myTopic);
    client.subscribe(`${myTopic}/config`);
    client.subscribe(`score-boards/${team}`);
  });
  client.on('message', function(topic, message) {
    const msgStr = message.toString();
    const msgObj = JSON.parse(msgStr);
    if(topic.includes('config')) {
      setConfig(msgObj);
      return;
    }
    if(topic.includes('score')) {
      score(msgObj);
      return;
    }
    // console.log(msgObj);
    driveBot(msgObj);
  });
}

function setConfig(msgObj) {
  config = msgObj;
  console.log('New Config:', config);
  client.end();
  client = null;
  setTimeout(() => {
    console.log('Restarting Client');
    clientInit();
  }, 3000);
  fs.writeFile(path.resolve(__dirname, './config.json'), JSON.stringify(msgObj), (err) => {
    if (err) throw err;
    console.log('Config file saved!');
  });
}

function driveBot({ x, y, r, k }) {
  motorController.drive(x, y, r);
  if (k !== undefined && k == 1 && kickTimeout == false) {
    solenoid.writeSync(1);
    kickTimeout = setTimeout(() => {
      solenoid.writeSync(0);
      clearTimeout(kickTimeout);
      kickTimeout = false;
    }, 500);
  }
};

function score({ action, increment}) {
  if (action == 'goal' && increment == 1 && celebrateTimeout == false) {
    // console.log('Celebrate the Goal!');
    leds.allBlink(colors[purple]);
    celebrateTimeout = setTimeout(() => {
      leds.allOff();
      clearTimeout(celebrateTimeout);
      celebrateTimeout = false;
    }, 5000);
  }
}
clientInit();

const fs = require('fs');
const path = require('path');
const nm = require('node-machine-id');
const mqtt = require('mqtt');
const MotorController = require('robotois-servo-controller');
const LEDStrip = require('robotois-ws2811');
const Gpio = require('onoff').Gpio;
let config = require('./config.json');

const colors = {
  primary: '#00d1b2',
  link: '#3273dc',
  info: '#209cee',
  success: '#23d160',
  warning: '#ffdd57',
  error: '#ff3860',
  yellow: '#FFC107',
  white: '#F5F5F5',
};

const leds = new LEDStrip(16);
const solenoid = new Gpio(17, 'out');
let kickTimeout = false;
const motorController = new MotorController();
let id;

const brokerAdd = '192.168.50.27';
let clientId;
let myTopic;
let client;
let celebrateTimeout = false;

function clientInit() {
  solenoid.writeSync(0);
  const { team, number } = config;

  if (team !== null && number !== null) {
    clientId = `SoccerBot-${team}-${number}`;
  } else {
    id = nm.machineIdSync({original: true});
    clientId = `SoccerBot-${id}` || 'SoccerBot-01';
  }

  myTopic = `SoccerBots/${clientId}`;
  client = mqtt.connect(`mqtt://${brokerAdd}`, { clientId });
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
    leds.blinkAll(colors[team]);
    celebrateTimeout = setTimeout(() => {
      leds.allOff();
      clearTimeout(celebrateTimeout);
      celebrateTimeout = false;
    }, 3000);
  }
}
clientInit();

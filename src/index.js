const fs = require('fs');
const path = require('path');
const nm = require('node-machine-id');
const mqtt = require('mqtt');
const MotorController = require('robotois-motors-v2');
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

const leds = new LEDStrip(16);
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
  });

  client.on('message', function(topic, message) {
    const msgStr = message.toString();
    const msgObj = JSON.parse(msgStr);
    driveBot(msgObj);
  });
}

function driveBot({ x, y, r, k }) {
  motorController.drive(x, y, r);
};

clientInit();

function release() {
  leds.allOff();
  motorController.release();
}
process.on('SIGINT', () => {
  release();
  process.exit();
});

process.on('SIGTERM', () => {
  release();
  process.exit();
});

process.on('exit', () => {
  release();
  process.exit();
});

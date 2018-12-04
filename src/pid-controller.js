/**
 * Array values: [Y axis, Rotation]
 */
let prevPWM = [0, 0];
let currentPWM = [0, 0];
let currentError = [0, 0];
let prevError = [0, 0];
let integral = [0, 0];
let changeRate = [0, 0];
let pwmDiff = [0, 0];
let pwmRef = [0, 0];
let kd = [0, 0], ki = [0, 0], kp = [0, 0];

const initialize = (_kp, _ki, _kd) => {
  kp = _kp;
  ki = _ki;
  kd = _kd;
}

const setPWMs = (pwm) => {
  pwmRef = [...pwm];
}

const iterate = () => {
  currentError[0] = pwmRef[0] - currentPWM[0];
  currentError[1] = pwmRef[1] - currentPWM[1];
  integral[0] += currentError[0];
  integral[1] += currentError[1];

  changeRate[0] =
    currentError[0] * kp[0] +
    integral[0] * ki[0] +
    (currentError[0] - prevError[0]) * kd[0];
  changeRate[1] =
    currentError[1] * kp[1] +
    integral[1] * ki[1] +
    (currentError[1] - prevError[1]) * kd[1];

  currentPWM[0] += changeRate[0];
  currentPWM[1] += changeRate[1];
  currentPWM[0] = Math.floor(currentPWM[0] * 10000) / 10000;
  currentPWM[1] = Math.floor(currentPWM[1] * 10000) / 10000;
  prevError[0] = currentError[0];
  prevError[1] = currentError[1];
  return currentPWM;
}

const runner = (drive) => {
  initialize([0.35, 0.35], [0, 0], [0.45, 0.45])
  setInterval(() => {
    iterate();
    // console.log(currentPWM);
    drive(currentPWM[0].toFixed(2), currentPWM[1].toFixed(2));
  }, 200);
}

module.exports = {
  setPWMs,
  runner,
}
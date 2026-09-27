const STORAGE_KEY = 'ocular-observations';
const form = document.querySelector('#observation-form');
const savedSection = document.querySelector('.saved-observations');
const observationList = document.querySelector('#observation-list');
const observationCount = document.querySelector('#observation-count');
const timeInput = document.querySelector('#observation-time');
const setTimeButton = document.querySelector('#set-time-button');
const timeOverlay = document.querySelector('#time-overlay');
let observations = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let timeSetterActive = false;

function setCurrentTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  timeInput.value = now.toISOString().slice(0, 19);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

function openTimeSetter() {
  timeSetterActive = true;
  timeOverlay.hidden = false;
  timeOverlay.setAttribute('aria-hidden', 'false');
}

function setTimeFromUserInput() {
  if (!timeSetterActive) return;
  setCurrentTime();
  timeSetterActive = false;
  timeOverlay.hidden = true;
  timeOverlay.setAttribute('aria-hidden', 'true');
}

function formatAltitude(observation) {
  const minutes = Number(observation.minutes) + (Number(observation.seconds) || 0) / 60;
  return `${String(observation.degrees).padStart(2, '0')}° ${minutes.toFixed(1).padStart(4, '0')}′`;
}

function renderObservations() {
  savedSection.hidden = observations.length === 0;
  observationCount.textContent = observations.length;
  observationList.innerHTML = observations.map((observation) => `
    <li>
      <time datetime="${observation.time}">${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(observation.time))} UTC</time>
      <strong>${formatAltitude(observation)}</strong>
      <span>${observation.horizon} horizon</span>
    </li>
  `).join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  observations.unshift({
    time: formData.get('time'),
    degrees: formData.get('degrees'),
    minutes: formData.get('minutes'),
    horizon: formData.get('horizon'),
  });
  save();
  renderObservations();
  form.reset();
  setCurrentTime();
  document.querySelector('[name="degrees"]').focus();
});

setCurrentTime();
renderObservations();
setTimeButton.addEventListener('click', openTimeSetter);
document.addEventListener('pointerdown', setTimeFromUserInput);
document.addEventListener('keydown', setTimeFromUserInput);

let deferredInstall;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstall = event;
  document.querySelector('#install-button').hidden = false;
});

document.querySelector('#install-button').addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  deferredInstall = null;
  document.querySelector('#install-button').hidden = true;
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
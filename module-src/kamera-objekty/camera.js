import { detectRegions, smoothRegions } from './regions.js';

const byId = id => document.getElementById(id);
const main = document.querySelector('main');
const video = document.querySelector('video');
const still = byId('still');
const overlay = byId('overlay');
const camera = byId('camera');
const live = byId('live');
const snapshot = byId('snapshot');
const empty = byId('empty');
const status = byId('status');
const sample = document.createElement('canvas');
const pixels = sample.getContext('2d', { willReadFrequently: true });
const ink = overlay.getContext('2d');

let stream;
let timer;
let generation = 0;
let frozen = false;
let boxes = [];

function paint() {
  ink.clearRect(0, 0, overlay.width, overlay.height);
  ink.lineWidth = Math.max(2, Math.min(overlay.width, overlay.height) / 160);
  ink.shadowColor = '#10151e';
  ink.shadowBlur = ink.lineWidth;
  ink.strokeStyle = '#6dffbd';
  for (const { x, y, w, h } of boxes) {
    ink.strokeRect(x * overlay.width, y * overlay.height, w * overlay.width, h * overlay.height);
  }
}

function analyze(source, width, height, smooth) {
  const scale = Math.min(1, 224 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  if (sample.width !== w || sample.height !== h) {
    sample.width = w;
    sample.height = h;
  }
  if (overlay.width !== width || overlay.height !== height) {
    overlay.width = width;
    overlay.height = height;
    boxes = [];
  }
  pixels.drawImage(source, 0, 0, w, h);
  const found = detectRegions(pixels.getImageData(0, 0, w, h));
  boxes = smooth ? smoothRegions(boxes, found) : found;
  paint();
  const message = (frozen ? 'Snímek' : 'Živě') + ' · Označené oblasti ' + boxes.length;
  if (status.textContent !== message) status.textContent = message;
}

function scan() {
  if (!frozen && stream && video.readyState >= 2) {
    snapshot.disabled = false;
    analyze(video, video.videoWidth, video.videoHeight, true);
  }
}

function setFrozen(value) {
  frozen = value;
  still.hidden = !value;
  video.hidden = value;
  live.setAttribute('aria-pressed', String(!value));
  snapshot.setAttribute('aria-pressed', String(value));
}

function stop(message = 'Kamera je vypnutá.') {
  generation++;
  clearInterval(timer);
  const previous = stream;
  stream = null;
  previous?.getTracks().forEach(track => track.stop());
  video.srcObject = null;
  setFrozen(false);
  still.width = 1;
  still.height = 1;
  boxes = [];
  paint();
  empty.hidden = false;
  camera.textContent = 'Zapnout kameru';
  live.disabled = true;
  snapshot.disabled = true;
  status.textContent = message;
}

async function start() {
  const request = ++generation;
  camera.textContent = 'Zrušit';
  status.textContent = 'Čekám na přístup ke kameře…';
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      stop('Kamera vyžaduje HTTPS a podporovaný prohlížeč.');
      return;
    }
    const requested = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    if (request !== generation) {
      requested.getTracks().forEach(track => track.stop());
      return;
    }
    stream = requested;
    stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
      if (stream === requested) stop('Přístup ke kameře byl ukončen.');
    }));
    video.srcObject = stream;
    await video.play();
    if (request !== generation) return;
    empty.hidden = true;
    camera.textContent = 'Vypnout kameru';
    live.disabled = false;
    timer = setInterval(scan, 150);
    scan();
  } catch (error) {
    if (request !== generation) return;
    stop(error.name === 'NotAllowedError'
      ? 'Přístup ke kameře je zamítnutý. Povol kameru v nastavení webu.'
      : 'Kameru se nepodařilo spustit.');
  }
}

camera.onclick = () => {
  if (camera.textContent === 'Zapnout kameru') void start();
  else stop();
};
live.onclick = () => {
  boxes = [];
  paint();
  setFrozen(false);
  scan();
};
snapshot.onclick = () => {
  if (frozen || video.readyState < 2) return;
  still.width = video.videoWidth;
  still.height = video.videoHeight;
  still.getContext('2d').drawImage(video, 0, 0);
  setFrozen(true);
  analyze(still, still.width, still.height, false);
};
byId('back').onclick = () => window.ArcadeHost.back();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});
window.ArcadeHost.register({
  start() { main.hidden = false; },
  pause() { stop(); },
  stop() {
    stop();
    main.hidden = true;
  }
});

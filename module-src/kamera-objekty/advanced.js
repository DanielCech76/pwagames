import { availability, models, saveAssets } from './model-storage.js';
import { gridPrompts, outlinePrompts, shiftMask } from './prompts.js';

export function createAdvanced({ status, drawing, showVideo, showFrame, capture }) {
  const get = id => document.getElementById(id);
  const panel = get('advanced');
  const layer = get('depth-layer');
  const pairControls = get('pair');
  const main = document.querySelector('main');
  const automatic = get('automatic');
  const depth = get('depth');
  const compare = get('compare');
  const track = get('track');
  const second = get('second');
  const objects = get('object-target');
  const cancel = get('cancel-analysis');
  const download = get('download-models');
  const modelState = get('model-state');
  let downloadController;
  let image;
  let pair;
  let worker;
  let pending;
  let depthReady = false;
  let candidates = [];

  function setMessage(message) {
    status.textContent = message;
  }

  function update() {
    panel.hidden = !image;
    pairControls.hidden = !pair;
    main.toggleAttribute('data-pair', Boolean(pair));
    objects.hidden = !candidates.length;
    cancel.hidden = !pending || Boolean(pair);
    for (const button of [automatic, depth, compare, track, second]) button.disabled = Boolean(pending);
    if (pair) showVideo(true);
  }

  function abort() {
    if (!pending) return;
    worker?.terminate();
    worker = null;
    const request = pending;
    pending = null;
    clearTimeout(request.timeout);
    request.resolve(null);
  }

  function reset(frame) {
    abort();
    image = frame;
    pair = null;
    candidates = [];
    depthReady = false;
    layer.hidden = true;
    layer.width = layer.height = 1;
    depth.setAttribute('aria-pressed', 'false');
    update();
  }

  function run(kind, frame, options = {}) {
    if (downloadController && kind !== 'views') {
      setMessage('Počkej na dokončení stahování AI modelů.');
      return Promise.resolve(null);
    }
    if (pending) {
      setMessage('Počkej na dokončení právě spuštěné analýzy.');
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      function finish(value) {
        clearTimeout(pending?.timeout);
        pending = null;
        update();
        resolve(value);
        if (kind !== 'views') void refreshModels();
      }
      function fail(error) {
        console.warn('Camera analysis:', error);
        setMessage(kind === 'views' ? 'Pohledy se nepodařilo porovnat.' :
          'Model se nepodařilo spustit. Při prvním použití ověř připojení a zkus to znovu.');
        finish(null);
      }
      try {
        worker ??= new Worker(new URL('./ai-worker.js', import.meta.url), { type: 'module' });
        function renewTimeout() {
          clearTimeout(pending?.timeout);
          pending.timeout = setTimeout(() => {
            worker?.terminate();
            worker = null;
            fail('timeout');
          }, 180000);
        }
        const task = { resolve };
        pending = task;
        renewTimeout();
        update();
        setMessage(kind === 'views' ? 'Porovnávám snímky…' : 'Připravuji model…');
        worker.onmessage = ({ data }) => {
          if (pending !== task) return;
          renewTimeout();
          if (data.phase === 'download') {
            setMessage('Stahuji model' + (Number.isFinite(data.progress) ? ' · ' + Math.round(data.progress) + ' %' : '') + '…');
          } else if (data.phase === 'analysis') {
            const percent = Number.isFinite(data.progress) ? ' · ' + Math.round(data.progress * 100) + ' %' : '';
            setMessage('Analyzuji snímek v telefonu' + percent + '…');
          } else if (data.error) {
            fail(data.error);
          } else {
            finish(data.result);
          }
        };
        worker.onerror = event => {
          if (pending !== task) return;
          worker.terminate();
          worker = null;
          fail(event.message);
        };
        worker.postMessage({ kind, frame, ...options });
      } catch (error) {
        fail(error);
      }
    });
  }

  async function refine(frame, seed) {
    if (pending) {
      setMessage('Počkej na dokončení právě spuštěné analýzy.');
      return null;
    }
    const points = outlinePrompts(frame, seed);
    if (!points.some(point => point.label)) {
      setMessage('Označ alespoň jednu část předmětu.');
      return null;
    }
    const reference = Uint8Array.from(seed.outline, (value, i) => seed.marks[i] ? Number(seed.marks[i] === 1) : value);
    const result = await run('sam', frame, { prompts: [points], reference });
    if (result?.length && image === frame) {
      candidates = [];
      drawing.setPreview([]);
      update();
    }
    if (result?.length === 0) setMessage('AI nenašla odpovídající masku. Uprav obrys nebo opravné tahy.');
    return result?.[0];
  }

  cancel.onclick = () => {
    abort();
    update();
    setMessage('Analýza zrušena.');
  };

  async function analyze(frame, automatically = false) {
    if (frame !== image || !frame || pending || (automatically && drawing.hasDraft())) return;
    const items = await run('sam', frame, { prompts: gridPrompts(frame) });
    if (frame !== image || !items || (automatically && drawing.hasDraft())) return;
    candidates = items;
    objects.replaceChildren(...items.map((_, i) => new Option('Objekt ' + (i + 1), String(i))));
    drawing.setPreview(items);
    update();
    setMessage(items.length ? 'AI označila obrysy: ' + items.length + '. Pro sledování vyber objekt ze seznamu.' : 'AI nenašla dostatečně jisté objekty. Zůstávají základní obrysy.');
    void refreshModels();
  }

  automatic.onclick = () => analyze(image);

  async function analyzeNewFrame() {
    const frame = image;
    const available = await availability().catch(() => ({}));
    if (frame !== image || pending || drawing.hasDraft()) return;
    if (available.sam) await analyze(frame, true);
    else setMessage('Základní obrysy jsou hotové. Stáhni AI modely pro automatickou AI analýzu.');
  }

  async function refreshModels() {
    if (downloadController) return;
    try {
      const available = await availability();
      if (downloadController) return;
      const count = Object.values(available).filter(Boolean).length;
      download.disabled = count === Object.keys(models).length;
      modelState.textContent = download.disabled ? 'AI modely připravené offline' : 'Uloženo ' + count + ' ze 3 modelů';
    } catch {
      modelState.textContent = 'Úložiště modelů je nedostupné.';
    }
  }

  download.onclick = async () => {
    if (downloadController) {
      downloadController.abort();
      return;
    }
    if (pending) {
      modelState.textContent = 'Počkej na dokončení právě spuštěné analýzy.';
      return;
    }
    const controller = new AbortController();
    downloadController = controller;
    download.textContent = 'Zrušit stahování';
    modelState.textContent = 'Připravuji stažení…';
    try {
      const persistence = navigator.storage?.persist?.().catch(() => false);
      await saveAssets(Object.keys(models), (done, total) => {
        modelState.textContent = 'Stahuji AI · ' + done + ' z ' + total + ' souborů';
      }, controller.signal);
      await persistence;
      if (image && !pending) queueMicrotask(() => void analyzeNewFrame());
    } catch (error) {
      modelState.textContent = controller.signal.aborted
        ? 'Stahování přerušeno. Uložené soubory se při dalším pokusu použijí.'
        : error.name === 'QuotaExceededError' ? 'V telefonu není dost místa pro AI modely.'
          : 'Stažení se nezdařilo. Zkus pokračovat po připojení k internetu.';
      return;
    } finally {
      downloadController = null;
      download.textContent = 'Stáhnout AI offline';
    }
    await refreshModels();
  };

  objects.onchange = () => {
    drawing.setPreview([candidates[Number(objects.value)]]);
  };

  depth.onclick = async () => {
    const frame = image;
    if (!depthReady) {
      const values = await run('depth', frame);
      if (image !== frame || !values) return;
      layer.width = frame.width;
      layer.height = frame.height;
      const ctx = layer.getContext('2d');
      const colors = ctx.createImageData(frame.width, frame.height);
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        colors.data[4 * i] = v;
        colors.data[4 * i + 1] = Math.round(180 * Math.sin(Math.PI * v / 255));
        colors.data[4 * i + 2] = 255 - v;
        colors.data[4 * i + 3] = 255;
      }
      ctx.putImageData(colors, 0, 0);
      depthReady = true;
    }
    layer.hidden = !layer.hidden;
    depth.setAttribute('aria-pressed', String(!layer.hidden));
    setMessage(layer.hidden ? 'Mapa hloubky skrytá.' : 'Relativní hloubka · teplé barvy blíž, modré dál.');
  };

  function begin(kind) {
    const chosen = candidates[Number(objects.value)] ?? drawing.selected();
    if (!chosen) {
      setMessage('Nejdřív zpřesni obrys nebo najdi objekty pomocí AI.');
      return;
    }
    pair = { kind, mask: chosen.mask, frame: image };
    update();
    setMessage('Posuň telefon mírně do strany a ponech předmět i část pozadí v záběru.');
  }

  function end() {
    pair = null;
    showVideo(false);
    update();
  }

  compare.onclick = () => begin('views');
  track.onclick = () => begin('sam2');
  get('cancel-pair').onclick = () => {
    abort();
    end();
    setMessage('Zobrazuji původní snímek.');
  };

  second.onclick = async () => {
    const request = pair;
    const shot = capture();
    const next = shot?.image;
    if (!next || next.width !== request.frame.width || next.height !== request.frame.height) {
      setMessage('Zachovej stejnou orientaci telefonu jako u prvního snímku.');
      return;
    }
    const motion = await run('views', request.frame, { second: next, reference: request.mask });
    if (pair !== request) return;
    if (!motion || !motion.coherent) {
      setMessage('Málo spolehlivých shod. Zkus menší posun a ponech v záběru detaily předmětu i pozadí.');
      return;
    }
    if (request.kind === 'views') {
      end();
      setMessage(motion.displacement >= 3
        ? 'Nalezen odlišný posun předmětu vůči pozadí. Může jít o paralaxu.'
        : 'Rozdílný posun se nepotvrdil. Zkus větší boční posun telefonu.');
      return;
    }
    const moved = shiftMask(request.mask, next.width, next.height, motion.dx, motion.dy);
    const points = outlinePrompts(next, { outline: moved, marks: new Uint8Array(moved.length) });
    if (!points.some(point => point.label)) {
      setMessage('Předmět opustil záběr. Zkus menší posun.');
      return;
    }
    const items = await run('sam2', next, { prompts: [points], reference: moved, tracking: true });
    if (pair !== request || !items) return;
    if (!items.length) {
      setMessage('SAM 2 nenašel spolehlivou masku. Zkus další pohled.');
      return;
    }
    end();
    showFrame(shot);
    drawing.setPreview(items);
    setMessage('SAM 2 přenesl výběr na další snímek. Můžeš pokračovat dalším pohledem.');
  };
  return { reset, refine, analyzeNewFrame, refreshModels, dispose() {
    reset();
    worker?.terminate();
    worker = null;
  }, close() {
    downloadController?.abort();
  } };
}

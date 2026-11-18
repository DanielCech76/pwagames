import { refineOutline } from './outline.js';

export function createDrawing(overlay, status, redraw, aiRefine) {
  const panel = document.getElementById('drawing');
  const modes = ['trace', 'add', 'subtract'];
  const buttons = Object.fromEntries([...modes, 'undo', 'refine', 'refine-ai', 'next'].map(id => [id, document.getElementById(id)]));
  const stencil = document.createElement('canvas');
  const raster = stencil.getContext('2d', { willReadFrequently: true });
  const tint = document.createElement('canvas');
  const tintContext = tint.getContext('2d');
  let frame;
  let mode;
  let strokes;
  let active;
  let result;
  let accepted;
  let dirty;
  let attempted;
  let busy = false;
  let preview = [];

  function sync(message) {
    panel.hidden = !frame;
    overlay.classList.toggle('drawing', Boolean(frame));
    for (const tool of modes) buttons[tool].setAttribute('aria-pressed', String(tool === mode));
    buttons.add.disabled = buttons.subtract.disabled = busy || !strokes?.length;
    buttons.undo.disabled = busy || !strokes?.length && !accepted?.length;
    buttons['refine-ai'].disabled = busy || !strokes?.length;
    buttons.refine.disabled = busy || !strokes?.length || !dirty;
    buttons.next.disabled = busy || !result?.box || dirty;
    if (message) status.textContent = message;
    redraw();
  }

  function reset(image) {
    frame = image;
    preview = [];
    busy = false;
    mode = 'trace';
    strokes = [];
    active = null;
    result = null;
    accepted = [];
    dirty = false;
    attempted = false;
    if (frame) {
      stencil.width = tint.width = frame.width;
      stencil.height = tint.height = frame.height;
    }
    sync(frame ? 'Obkresli předmět prstem a klepni na Zpřesnit.' : '');
  }

  function path(ctx, points, width, height) {
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (const point of points.slice(1)) ctx.lineTo(point.x * width, point.y * height);
  }

  function rasterize() {
    const { width, height } = frame;
    raster.clearRect(0, 0, width, height);
    raster.fillStyle = '#fff';
    path(raster, strokes[0].points, width, height);
    raster.fill();
    const pixels = raster.getImageData(0, 0, width, height).data;
    const outline = Uint8Array.from({ length: width * height }, (_, i) => Number(pixels[i * 4 + 3] >= 128));
    if (!outline.some(Boolean)) {
      sync('Obrys je příliš malý. Zkus předmět obkreslit znovu.');
      return;
    }
    raster.clearRect(0, 0, width, height);
    raster.lineWidth = Math.max(3, Math.min(width, height) * .025);
    raster.lineCap = raster.lineJoin = 'round';
    for (const { tool, points } of strokes.slice(1)) {
      raster.strokeStyle = raster.fillStyle = tool === 'add' ? '#f00' : '#00f';
      if (points.length > 1) {
        path(raster, points, width, height);
        raster.stroke();
      } else {
        raster.beginPath();
        raster.arc(points[0].x * width, points[0].y * height, raster.lineWidth / 2, 0, Math.PI * 2);
        raster.fill();
      }
    }
    const edits = raster.getImageData(0, 0, width, height).data;
    const marks = Uint8Array.from(outline, (_, i) => {
      const p = 4 * i;
      return edits[p + 3] < 128 ? 0 : edits[p] >= edits[p + 2] ? 1 : 2;
    });
    return { outline, marks };
  }

  function apply(selection) {
    result = selection;
    dirty = false;
    attempted = true;
    mode = 'add';
    sync(result.box ? 'Výběr můžeš opravit nebo označit další objekt.' : 'Výběr je prázdný. Přidej část objektu nebo nakresli nový obrys.');
  }

  function refine() {
    if (!frame || !strokes.length || !dirty || busy) return;
    const seed = rasterize();
    if (seed) apply(refineOutline(frame, seed.outline, seed.marks));
  }

  buttons['refine-ai'].onclick = async () => {
    const seed = rasterize();
    if (!seed) return;
    const image = frame;
    busy = true;
    sync();
    try {
      const selection = await aiRefine(image, seed);
      if (image === frame && selection) apply(selection);
    } finally {
      if (image === frame) {
        busy = false;
        sync();
      }
    }
  };

  function setPreview(items) {
    preview = items;
    redraw();
  }

  function selected() {
    return result?.box ? result : accepted.at(-1)?.result ?? preview[0];
  }

  function point(event, clamp) {
    const rect = overlay.getBoundingClientRect();
    const scale = Math.min(rect.width / overlay.width, rect.height / overlay.height);
    const width = overlay.width * scale;
    const height = overlay.height * scale;
    const x = (event.clientX - rect.left - (rect.width - width) / 2) / width;
    const y = (event.clientY - rect.top - (rect.height - height) / 2) / height;
    if (!clamp && (x < 0 || x > 1 || y < 0 || y > 1)) return null;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  overlay.addEventListener('pointerdown', event => {
    if (!frame || busy || active || event.button !== 0) return;
    const start = point(event, false);
    if (!start) return;
    overlay.setPointerCapture(event.pointerId);
    active = { id: event.pointerId, tool: mode, points: [start] };
    redraw();
  });
  overlay.addEventListener('pointermove', event => {
    if (active?.id !== event.pointerId) return;
    active.points.push(point(event, true));
    redraw();
  });
  overlay.addEventListener('pointerup', event => {
    if (active?.id !== event.pointerId) return;
    active.points.push(point(event, true));
    if (active.tool !== 'trace' || active.points.length >= 3) {
      if (active.tool === 'trace') {
        preview = [];
        strokes = [];
        result = null;
        attempted = false;
      }
      strokes.push(active);
      dirty = true;
    }
    active = null;
    sync(dirty ? 'Klepni na Zpřesnit.' : 'Předmět obkresli jedním souvislým tahem.');
  });
  function cancel(event) {
    if (active?.id !== event.pointerId) return;
    active = null;
    redraw();
  }
  overlay.addEventListener('pointercancel', cancel);
  overlay.addEventListener('lostpointercapture', cancel);

  for (const tool of modes) buttons[tool].onclick = () => {
    mode = tool;
    sync(tool === 'trace' ? 'Jedním tahem obkresli předmět.'
      : tool === 'add' ? 'Přejeď přes chybějící část předmětu.' : 'Přejeď přes oblast, která do výběru nepatří.');
  };
  buttons.refine.onclick = refine;
  buttons.undo.onclick = () => {
    if (busy) return;
    if (!strokes.length) {
      const previous = accepted.pop();
      if (previous) {
        strokes = previous.strokes;
        result = previous.result;
        attempted = true;
        mode = 'add';
      }
      sync('Pokračuj v úpravě výběru.');
      return;
    }
    strokes.pop();
    result = null;
    dirty = Boolean(strokes.length);
    if (dirty && attempted) refine();
    else {
      mode = 'trace';
      sync(dirty ? 'Klepni na Zpřesnit.' : 'Obkresli předmět prstem.');
    }
  };
  buttons.next.onclick = () => {
    if (busy) return;
    accepted.push({ strokes, result });
    strokes = [];
    result = null;
    attempted = false;
    mode = 'trace';
    sync('Obkresli další předmět.');
  };

  function paint(ctx, width, height) {
    if (!frame) return null;
    const selections = [...preview, ...accepted.map(item => item.result), result].filter(item => item?.box);
    if (selections.length) {
      const image = tintContext.createImageData(frame.width, frame.height);
      for (const { mask } of selections) {
        for (let i = 0; i < mask.length; i++) {
          if (mask[i]) image.data.set([55, 230, 157, 85], i * 4);
        }
      }
      tintContext.putImageData(image, 0, 0);
      ctx.drawImage(tint, 0, 0, width, height);
    }
    const pending = dirty ? [...strokes] : [];
    if (active) pending.push(active);
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const { tool, points } of pending) {
      ctx.strokeStyle = tool === 'trace' ? '#fff' : tool === 'add' ? '#6dffbd' : '#ff9189';
      ctx.lineWidth = Math.max(3, Math.min(width, height) * (tool === 'trace' ? .005 : .022));
      path(ctx, points, width, height);
      if (points.length > 1) ctx.stroke();
      else {
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(points[0].x * width, points[0].y * height, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return active || strokes.length || accepted.length || preview.length ? selections.map(item => ({ mask: item.mask, width: frame.width, height: frame.height })) : null;
  }
  return { reset, paint, selected, setPreview, hasDraft: () => Boolean(active || strokes?.length || accepted?.length) };
}

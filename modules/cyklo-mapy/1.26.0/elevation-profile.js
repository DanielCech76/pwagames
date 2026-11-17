/* Distance-weighted elevation bars, shared by plans, history and simulation. */
(function (root) {
  'use strict';
  const cache = new WeakMap();
  const finite = Number.isFinite;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const label = n => n.toLocaleString('cs-CZ', {maximumFractionDigits: 1});

  function build(route, count = 24) {
    count = clamp(Math.round(count) || 24, 8, 32);
    const cs = route?.coordinates || [], cumulative = route?.cumulative || [];
    const length = cumulative.at(-1) || 0;
    const bins = Array.from({length: count}, () => ({area: 0, covered: 0, min: Infinity, max: -Infinity, value: null}));
    if (!(length > 0)) return {bins, length, available: false};
    const width = length / count;
    let min = Infinity, max = -Infinity;
    for (let i = 1; i < cs.length; i++) {
      const a = cs[i - 1][2], b = cs[i][2], from = cumulative[i - 1], to = cumulative[i];
      if (!finite(a) || !finite(b) || !(to > from) || (route.segments && route.segments[i] !== route.segments[i - 1])) continue;
      min = Math.min(min, a, b); max = Math.max(max, a, b);
      const first = clamp(Math.floor(from / width), 0, count - 1);
      const last = clamp(Math.floor(to / width), 0, count - 1);
      for (let j = first; j <= last; j++) {
        const left = Math.max(from, j * width), right = Math.min(to, (j + 1) * width);
        if (!(right > left)) continue;
        const lo = a + (b - a) * (left - from) / (to - from);
        const hi = a + (b - a) * (right - from) / (to - from);
        const bin = bins[j];
        bin.area += (lo + hi) / 2 * (right - left);
        bin.covered += right - left;
        bin.min = Math.min(bin.min, lo, hi); bin.max = Math.max(bin.max, lo, hi);
      }
    }
    // Incomplete intervals remain visible gaps rather than invented elevations.
    for (const b of bins) if (b.covered >= width * .999) b.value = b.area / b.covered;
    if (!bins.some(b => finite(b.value))) return {bins, length, available: false};
    const span = Math.max(2, max - min);
    const roughStep = span / 4, power = 10 ** Math.floor(Math.log10(roughStep));
    const step = [1, 2, 5, 10].map(v => v * power).find(v => v >= roughStep);
    let low = Math.floor(min / step) * step, high = Math.ceil(max / step) * step;
    if (high - low < 2) { const center = (min + max) / 2; low = Math.floor(center - 1); high = Math.ceil(center + 1); }
    return {bins, length, min, max, low, high, step, available: true};
  }

  function model(route) {
    if (!route) return build(null);
    if (!cache.has(route)) cache.set(route, build(route));
    return cache.get(route);
  }

  function state(profile, along) {
    const active = finite(along) && profile.length > 0;
    const index = active ? clamp(Math.floor(clamp(along, 0, profile.length) / profile.length * profile.bins.length), 0, profile.bins.length - 1) : -1;
    return {active, index};
  }

  function rounded(ctx, x, y, w, h, radius = 4) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, radius);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  function render(canvas, route, options = {}) {
    const profile = model(route), current = state(profile, options.along);
    const palette = root.CykloAppearance?.palette() || {ink:'#153f29',muted:'#52664a',grid:'#cad4bf',past:['#87aa64','#205a37'],future:['#d7e3c8','#c3d3b2'],accent:['#ffa128','#eb7b0c'],onAccent:'#172820'};
    const width = canvas.clientWidth || 320, height = options.compact ? 106 : 170;
    const dpr = Math.min(3, root.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
    if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return profile;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height);
    ctx.font = '11px system-ui'; ctx.fillStyle = palette.muted;
    if (!profile.available) {
      ctx.fillText('Výšková data nejsou dostupná', 12, height / 2);
      canvas.setAttribute?.('aria-label', 'Výškový profil: výšková data nejsou dostupná');
      return profile;
    }
    const left = 43, right = width - 12, top = current.active ? 29 : 16, bottom = height - 24;
    const chartWidth = Math.max(1, right - left), chartHeight = bottom - top;
    const y = value => bottom - (value - profile.low) / (profile.high - profile.low) * chartHeight;
    ctx.lineWidth = 1;
    const gridCount = options.compact ? 2 : 4;
    for (let i = 0; i <= gridCount; i++) {
      const value = profile.low + (profile.high - profile.low) * i / gridCount, py = y(value);
      ctx.strokeStyle = palette.grid; ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke();
      if (!options.compact || i === 0 || i === gridCount) {
        ctx.fillStyle = palette.muted; ctx.textAlign = 'right'; ctx.fillText(label(value) + ' m', left - 6, py + 4);
      }
    }
    const slot = chartWidth / profile.bins.length, gap = Math.min(4, slot * .22);
    for (let i = 0; i < profile.bins.length; i++) {
      const bin = profile.bins[i];
      if (!finite(bin.value)) continue;
      const x = left + i * slot + gap / 2, py = y(bin.value), h = Math.max(2, bottom - py);
      const active = i === current.index, future = current.active && i > current.index;
      const gradient = ctx.createLinearGradient?.(0, py, 0, bottom);
      const colors = active ? palette.accent : future ? palette.future : palette.past;
      if (gradient?.addColorStop) { gradient.addColorStop(0, colors[0]); gradient.addColorStop(1, colors[1]); ctx.fillStyle = gradient; }
      else ctx.fillStyle = colors[1];
      rounded(ctx, x, py, Math.max(1, slot - gap), h, Math.min(4, (slot - gap) / 2, h / 2));
      // Quiet min/max whiskers retain short peaks hidden by interval averaging.
      if (bin.max - bin.min > .2) {
        ctx.strokeStyle = future ? palette.future[1] : active ? palette.accent[1] : palette.past[1];
        ctx.beginPath(); ctx.moveTo(x + (slot - gap) / 2, y(bin.min)); ctx.lineTo(x + (slot - gap) / 2, y(bin.max)); ctx.stroke();
      }
    }
    ctx.textAlign = 'left'; ctx.fillStyle = palette.ink;
    ctx.fillText('0', left, height - 6);
    ctx.textAlign = 'center'; ctx.fillText(label(profile.length / 2000), left + chartWidth / 2, height - 6);
    ctx.textAlign = 'right'; ctx.fillText(label(profile.length / 1000) + ' km', right, height - 6);
    if (current.active) {
      const x = left + (current.index + .5) * slot;
      const text = finite(options.altitude) ? label(options.altitude) + ' m' : '— m';
      const pillWidth = Math.max(42, text.length * 6.5 + 14), px = clamp(x - pillWidth / 2, left, right - pillWidth);
      ctx.fillStyle = palette.accent[1]; rounded(ctx, px, 2, pillWidth, 20, 6);
      ctx.beginPath(); ctx.moveTo(x - 4, 22); ctx.lineTo(x + 4, 22); ctx.lineTo(x, 27); ctx.fill();
      ctx.font = 'bold 11px system-ui'; ctx.fillStyle = palette.onAccent; ctx.textAlign = 'center'; ctx.fillText(text, px + pillWidth / 2, 16);
    }
    canvas.setAttribute?.('aria-label', 'Sloupcový výškový profil, ' + profile.bins.length + ' úseků, rozsah ' + label(profile.low) + ' až ' + label(profile.high) + ' metrů' + (current.active ? ', aktuální úsek ' + (current.index + 1) + ', výška ' + (finite(options.altitude) ? label(options.altitude) + ' metrů' : 'není dostupná') : ''));
    return profile;
  }

  function fromTrack(track) {
    const coordinates = [], cumulative = [], segments = [];
    let length = 0, previous = null;
    for (const p of track) {
      if (!finite(p.lat) || !finite(p.lon)) continue;
      if (previous && previous.segment === p.segment) length += root.CykloNav.distance(previous, p);
      coordinates.push([p.lon, p.lat, p.alt]); cumulative.push(length); segments.push(p.segment);
      previous = p;
    }
    return {coordinates, cumulative, segments, length};
  }
  root.CykloElevation = {build, model, state, render, fromTrack};
})(globalThis);

const names = {
  'coffee mug': 'hrnek', cup: 'šálek', 'water bottle': 'láhev na vodu', 'pop bottle': 'láhev',
  'wine bottle': 'láhev vína', 'beer bottle': 'láhev piva', 'wine glass': 'sklenice na víno',
  'beer glass': 'sklenice na pivo', bowl: 'miska', plate: 'talíř', spoon: 'lžíce',
  'wooden spoon': 'vařečka', 'frying pan': 'pánev', wok: 'wok', ladle: 'naběračka',
  teapot: 'konvice', 'coffeepot': 'kávová konvice', toaster: 'toustovač', microwave: 'mikrovlnka',
  refrigerator: 'lednice', dishwasher: 'myčka', 'vacuum': 'vysavač', 'table lamp': 'stolní lampa',
  lampshade: 'stínidlo', 'wall clock': 'nástěnné hodiny', 'analog clock': 'hodiny', 'digital clock': 'digitální hodiny',
  'folding chair': 'skládací židle', 'rocking chair': 'houpací křeslo', 'barber chair': 'kadeřnické křeslo',
  'studio couch': 'pohovka', 'dining table': 'jídelní stůl', 'desk': 'psací stůl',
  'cellular telephone': 'mobilní telefon', laptop: 'notebook', notebook: 'notebook',
  'desktop computer': 'počítač', 'computer keyboard': 'klávesnice', mouse: 'počítačová myš',
  monitor: 'monitor', television: 'televize', 'remote control': 'dálkový ovladač',
  'lens cap': 'krytka objektivu', 'reflex camera': 'fotoaparát', loudspeaker: 'reproduktor',
  backpack: 'batoh', purse: 'kabelka', umbrella: 'deštník', 'running shoe': 'běžecká bota',
  'Loafer': 'mokasín', sandal: 'sandál', 'soccer ball': 'fotbalový míč', basketball: 'basketbalový míč',
  'mountain bike': 'horské kolo', 'bicycle-built-for-two': 'tandem', 'sports car': 'sportovní auto',
  'school bus': 'školní autobus', 'pickup': 'pick-up', minivan: 'minivan',
  banana: 'banán', orange: 'pomeranč', lemon: 'citron', 'Granny Smith': 'jablko',
  pineapple: 'ananas', strawberry: 'jahoda', cucumber: 'okurka', broccoli: 'brokolice',
  pizza: 'pizza', cheeseburger: 'hamburger', pretzel: 'preclík', 'French loaf': 'bageta',
  tabby: 'kočka', 'tiger cat': 'kočka', 'Persian cat': 'kočka', 'Siamese cat': 'kočka',
  'Egyptian cat': 'kočka', Labrador: 'pes', 'Labrador retriever': 'pes', 'golden retriever': 'pes',
  'German shepherd': 'pes', pug: 'pes', beagle: 'pes', Chihuahua: 'pes',
  'ballpoint': 'propiska', 'fountain pen': 'plnicí pero', 'pencil sharpener': 'ořezávátko',
  eraser: 'guma', ruler: 'pravítko', 'paper towel': 'papírová utěrka',
  toilet: 'toaleta', 'toilet tissue': 'toaletní papír', 'soap dispenser': 'dávkovač mýdla',
  'hair dryer': 'fén', toothbrush: 'zubní kartáček', 'teddy': 'plyšový medvěd',
  candle: 'svíčka', vase: 'váza', 'flowerpot': 'květináč', 'watering can': 'konev'
};

export function confidentName([best, next] = []) {
  if (!best || best.score < .4) return null;
  const translate = result => names[result?.label.split(',')[0].trim()];
  const label = translate(best);
  if (!label || (next && translate(next) !== label && best.score - next.score < .14)) return null;
  return label;
}

export function maskedCrop({ width, height, data }, { mask, box }) {
  const cx = (box.x + box.w / 2) * width;
  const cy = (box.y + box.h / 2) * height;
  const size = Math.ceil(Math.max(box.w * width, box.h * height) * 1.17);
  const x0 = Math.floor(cx - size / 2);
  const y0 = Math.floor(cy - size / 2);
  const rgb = new Uint8ClampedArray(size * size * 3).fill(127);
  for (let y = Math.max(0, -y0); y < Math.min(size, height - y0); y++) {
    for (let x = Math.max(0, -x0); x < Math.min(size, width - x0); x++) {
      const pixel = (y + y0) * width + x + x0;
      const offset = 3 * (y * size + x);
      const weight = mask[pixel] ? 1 : .25;
      for (let c = 0; c < 3; c++) rgb[offset + c] = 127 + (data[4 * pixel + c] - 127) * weight;
    }
  }
  return { rgb, size };
}

export function paintNames(ctx, items, width, height, font) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.font = '600 ' + font + 'px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  const placed = [];
  for (const { name, box } of items) {
    if (!name) continue;
    const w = ctx.measureText(name).width + font;
    const h = font * 1.55;
    const x = Math.max(0, Math.min(width - w, box.x * width));
    const top = box.y * height;
    const y = Math.min(height - h, top >= h ? top - h : top);
    if (placed.some(p => x < p.x + p.w && x + w > p.x && y < p.y + h && y + h > p.y)) continue;
    placed.push({ x, y, w });
    ctx.fillStyle = '#0b201b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e7fff5';
    ctx.fillText(name, x + font / 2, y + h / 2);
  }
  ctx.restore();
}

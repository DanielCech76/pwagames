// Reproduce the small browser-only vector decoder; runtime has no npm dependency.
import {build} from 'esbuild';
import {copyFileSync} from 'node:fs';
await build({stdin:{contents:"export {VectorTile} from '@mapbox/vector-tile';export {PbfReader} from 'pbf';export {default as earcut} from 'earcut';",resolveDir:process.cwd()},bundle:true,minify:true,format:'iife',globalName:'LookVector',outfile:'module-src/cyklo/vendor/look-vector.js',target:'es2020'});
for(const [pkg,name]of [['@mapbox/vector-tile','vector-tile'],['@mapbox/point-geometry','point-geometry'],['pbf','pbf'],['earcut','earcut']])copyFileSync('node_modules/'+pkg+(pkg==='@mapbox/vector-tile'?'/LICENSE.txt':'/LICENSE'),'module-src/cyklo/vendor/LICENSE-'+name+'.txt');

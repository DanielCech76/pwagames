const workshopDialog=document.createElement('dialog');
workshopDialog.id='work-dialog';
workshopDialog.innerHTML='<header><h2></h2><button aria-label="Zavřít">×</button></header><div id="work-content"></div>';
document.body.append(workshopDialog);
const workContent=$('work-content');
const closeTools=workshopDialog.querySelector('button');
closeTools.className='work-close';closeTools.innerHTML=uiIcon('M5 5l14 14M19 5 5 19');
closeTools.onclick=()=>workshopDialog.close();
const toolBack=document.createElement('button');
toolBack.type='button';toolBack.className='work-close work-panel-back';toolBack.hidden=true;
toolBack.setAttribute('aria-label','Zpět');toolBack.innerHTML=uiIcon('M19 12H5m7-7-7 7 7 7');
workshopDialog.querySelector('header').prepend(toolBack);
const toolHistory=[];
let stagedForm=null;
const preparedEditorForms=new WeakMap();
function openSubpanel(action){
 if(workshopDialog.open){
  toolHistory.push({title:workshopDialog.querySelector('h2').textContent,mode:workshopDialog.dataset.mode,
   nodes:[...workContent.childNodes],scroll:workContent.scrollTop});
 }
 action();toolBack.hidden=!toolHistory.length;
}
function backToolPanel(){
 if(!toolHistory.length){workshopDialog.close();return;}
 restoreEditorForm();
 if(workshopDialog.dataset.mode==='object')finishWorkshopMove(true);
 const {title,mode,nodes,scroll}=toolHistory.pop();
 workPanel(title,mode);workContent.replaceChildren(...nodes);workContent.scrollTop=scroll;
 toolBack.hidden=!toolHistory.length;
}
toolBack.onclick=backToolPanel;
workshopDialog.addEventListener('close',()=>{
 if(workshopDialog.open)return;
 restoreEditorForm();toolHistory.length=0;toolBack.hidden=true;
});
function rootTool(action){
 restoreEditorForm();toolHistory.length=0;toolBack.hidden=true;action();
}
function restoreEditorForm(){
 if(!stagedForm)return;
 const {source,container,sync}=stagedForm;
 sync.abort();source.append(...container.childNodes);container.remove();stagedForm=null;
}
function openEditorForm(id){
 const source=$(id),heading=$(source.getAttribute('aria-labelledby'));
 openSubpanel(()=>{
  workPanel(heading.textContent,'form');
  const container=document.createElement('div');container.className='work-form';
  container.append(...source.childNodes);workContent.append(container);
  heading.hidden=true;
  const decorative=heading.closest('.dialog-heading');
  if(decorative)decorative.hidden=true;
  const sync=new AbortController();
  stagedForm={source,container,sync};
  const dimensions=(value)=>value==='in'?'″':value;
  const mmFactor=()=>unitFactor(workPreferences.unit);
  const pngFactor=()=>unitFactor($('png-unit').value);
  const spec={
   'page-width':[()=>30/mmFactor(),()=>1500/mmFactor(),()=>.1/mmFactor(),()=>workUnit()],
   'page-height':[()=>20/mmFactor(),()=>1000/mmFactor(),()=>.1/mmFactor(),()=>workUnit()],
   'png-width':[()=>1/pngFactor(),()=>1500/pngFactor(),()=>.1/pngFactor(),()=>dimensions($('png-unit').value)],
   'png-height':[()=>1/pngFactor(),()=>1000/pngFactor(),()=>.1/pngFactor(),()=>dimensions($('png-unit').value)],
   'png-dpi':[()=>1,()=>2400,()=>1,()=>'DPI'],
   'repair-area':[()=>0,()=>100,()=>.1,()=>'mm²']
  };
  const update=preparedEditorForms.get(source)??[];
  if(!preparedEditorForms.has(source)){
  for(const input of container.querySelectorAll('input[type=number]')){
   const config=spec[input.id];if(!config)continue;
   const label=input.closest('label');
   const row=workNumberRow(input,label.textContent.replace(/ mm²$| \(mm\)$| \(cm\)$| \(″\)$| \(DPI\)$/,'').trim(),config);
   label.replaceWith(row.element);update.push(row.sync);
  }
  for(const select of container.querySelectorAll('select')){
   const label=select.closest('label');if(!label)continue;
   if(select.options.length<=3&&select.id!=='png-unit'){
    label.classList.add('work-segment-row');
    const choices=document.createElement('div');choices.className='work-param-options';label.append(choices);
    select.hidden=true;
    for(const option of select.options){
     const button=workButton(option.textContent,()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));},choices);
     update.push(()=>button.setAttribute('aria-pressed',String(option.value===select.value)));
    }
   }else label.classList.add('work-choice-row');
  }
  preparedEditorForms.set(source,update);
  }
  if(id==='appearance-dialog'){
   const close=$('appearance-close');close.hidden=true;
  }
  const apply=()=>update.forEach(fn=>fn());
  container.addEventListener('input',apply,{signal:sync.signal});
  container.addEventListener('change',apply,{signal:sync.signal});
  apply();
 });
}
function closeEditorForm(id,instance=stagedForm){
 if(stagedForm?.source.id===id){if(instance===stagedForm)backToolPanel();return;}
 $(id).close();
}
function workNumberRow(input,label,config){
 const [min,max,step,unit]=config;
 const element=document.createElement('div');element.className='work-number-row';
 const title=document.createElement('label');title.textContent=label;
 const range=document.createElement('input');range.type='range';range.setAttribute('aria-label',label);
 title.append(range);
 const value=document.createElement('div');value.className='work-number-value';
 input.setAttribute('aria-label',label+' – přesná hodnota');
 const suffix=document.createElement('span');suffix.setAttribute('aria-hidden','true');
 value.append(input,suffix);element.append(title,value);
 function sync(){
  const current=input.valueAsNumber;
  range.min=min();range.max=Math.max(max(),Number.isFinite(current)?current:max());range.step=step();
  if(Number.isFinite(current))range.value=current;
  suffix.textContent=unit();
  paintRangeProgress(range);
 }
 range.oninput=()=>{
  input.value=Number(range.valueAsNumber.toPrecision(10));
  input.dispatchEvent(new Event('input',{bubbles:true}));sync();
 };
 range.onchange=()=>input.dispatchEvent(new Event('change',{bubbles:true}));
 input.addEventListener('input',sync);
 sync();
 return {element,sync};
}
function workButton(label,action,parent=workContent){
 const button=document.createElement('button');
 button.type='button';button.textContent=label;button.onclick=action;parent.append(button);
 if(label==='Zpět'&&workContent.contains(button)&&toolHistory.length)button.hidden=true;
 const icon=actionGlyph(label);
 if(icon){
  button.classList.add(parent.classList.contains('work-actions')&&workContent.contains(parent)?'work-tile':'work-inline-icon');
  button.insertAdjacentHTML('afterbegin',icon);
 }
 return button;
}
function workPanel(title,mode='tools'){
 if(mode!=='form')restoreEditorForm();
 if(workshopDialog.dataset.mode==='object'&&mode!=='object')finishWorkshopMove(true);
 workshopDialog.dataset.mode=mode;

 workshopDialog.querySelector('h2').textContent=title;
 workContent.replaceChildren();
 if(!workshopDialog.open)workshopDialog.show();
 workContent.scrollTop=0;
}
function workText(value,parent=workContent){
 const p=document.createElement('p');p.textContent=value;parent.append(p);return p;
}
function workActions(){
 const row=document.createElement('div');row.className='work-actions';workContent.append(row);return row;
}
function closeThen(action){if(workshopDialog.open)workshopDialog.close();action();}
function showWorkshopView(){
 workPanel('Pohled');
 const row=workActions();
 const zoom=workText(Math.round(sceneZoom*100)+' %',row);zoom.id='work-zoom-value';
 const step=factor=>zoomScene(sceneZoom*(factor-1));
 workButton('−',()=>step(.8),row);
 workButton('+',()=>step(1.25),row);
 workButton('Celé plátno',fitScene,row);
 const hand=workButton('Ruka',()=>{
  setWorkshopHand(!viewHand);
  closeThen(()=>{});
 },row);
 hand.setAttribute('aria-pressed',String(viewHand));
 const modes=workActions();
 for(const [mode,label] of [['normal','Normální'],['inverse','Inverzní'],['hairline','Vlasový']]){
  const button=workButton(label,()=>{
   if(appearance!==mode)$('appearance-modes').querySelector('[value="'+mode+'"]').click();
   showWorkshopView();
  },modes);
  button.setAttribute('aria-pressed',String(appearance===mode));
 }
 const theme=$('color-preset').cloneNode(true);theme.removeAttribute('id');
 theme.value=foreground+','+background;
 theme.onchange=()=>{$('color-preset').value=theme.value;$('color-preset').onchange();};
 const field=document.createElement('label');field.textContent='Barevné téma ';field.append(theme);workContent.append(field);
 const tools=workActions();
 workButton('Vlastní barvy',()=> $('appearance-open').click(),tools);
 const dimensions=workButton('Kóty',()=>{
  if(workPreferences.dimensions!=='hide')workPreferences.lastDimensions=workPreferences.dimensions;
  workPreferences.dimensions=workPreferences.dimensions==='hide'?(workPreferences.lastDimensions??'edge'):'hide';
  saveWorkPreferences();showWorkshopView();
 },tools);
 dimensions.dataset.dimensionsToggle='';
 dimensions.setAttribute('aria-pressed',String(workPreferences.dimensions!=='hide'));
}
const lockedTools=new Set(['project-new','project-load','page-open','toggle-base']);
function triggerTool(id){
 if(sceneLocked&&lockedTools.has(id)){showWorkshopComposition();return;}
 if(['page-open','project-save','png','repair-open','appearance-open'].includes(id))$(id).click();
 else closeThen(()=>$(id).click());
}
function showWorkshopTemplates(){
 if(sceneLocked){showWorkshopComposition();return;}
 workPanel('Šablony');
 const row=workActions();
 for(const option of Array.from($('circle-preset').options).filter(option=>option.value)){
  workButton(option.textContent,()=>{
   const source=$('circle-preset');source.value=option.value;
   source.dispatchEvent(new Event('change'));closeThen(()=>{});
  },row);
 }
}
function showWorkshopComposition(){
 workPanel('Kompozice');
 const row=workActions();
 for(const [label,action] of [
  ['Nová',()=>triggerTool('project-new')],['Šablony',()=>openSubpanel(showWorkshopTemplates)],['Rozměry',()=>triggerTool('page-open')],
  ['Rám a horizont',()=>openSubpanel(showWorkshopFrame)],['Podstava',()=>{$('toggle-base').click();showWorkshopComposition();}],
  [sceneLocked?'Odemknout kompozici':'Zamknout kompozici',()=>{$('scene-lock').click();showWorkshopComposition();}],
  ['Posun celé kompozice',()=>closeThen(beginWorkshopGroupMove)]]){
  const button=workButton(label,action,row);
  if(['Nová','Šablony','Rozměry','Rám a horizont','Podstava','Posun celé kompozice'].includes(label))button.disabled=sceneLocked;
  if(label==='Podstava')button.setAttribute('aria-pressed',String(Boolean(base)));
  if(label==='Posun celé kompozice'&&!objects.length)button.disabled=true;
 }
}
function showWorkshopFiles(){
 workPanel('Soubory');
 workText('Projekt');
 const project=workActions();
 workButton('Otevřít',()=>triggerTool('project-load'),project).disabled=sceneLocked;
 workButton('Uložit',()=>{if(projectHasName)saveProjectFile(projectFileStem);else triggerTool('project-save');},project);
 workButton('Uložit jako',()=>triggerTool('project-save'),project);
 workText('Export');
 const row=workActions();
 workButton('PNG',()=>triggerTool('png'),row);
 workButton('SVG',()=>triggerTool('svg'),row);
 workButton('Nastavení exportu',()=>openWorkSettings('png',showWorkshopFiles),row);
 workText('PNG · '+workPreferences.dpi+' DPI · '+(workPreferences.range==='page'?'Celé plátno':'Ořez na obsah')+' · '+(workPreferences.background==='clear'?'Průhledné':'Barva plátna'));
}
function workshopMenu(){
 workPanel('Další nástroje');
 const row=workActions();
 workButton('Kontrola řezání',()=>openSubpanel(showCutCheck),row);
 workButton('Opravit siluetu',()=>triggerTool('repair-open'),row);
 workButton('Nastavení řezu',()=>triggerTool('setup-open'),row);
 workButton('Sady objektů',()=>openWorkSettings('sets',workshopMenu),row);
 workButton('Nastavení dílny',()=>openWorkSettings(workSection,workshopMenu),row);
 workButton('Zpět do aplikace',()=>closeThen(()=>window.ArcadeHost.back()),row);
}
function showWorkshopFrame(){
 if(sceneLocked){showWorkshopComposition();return;}
 workPanel('Plátno a rám');
 const controls=[['frame-choice','frame'],['template-choice','circle-preset'],['horizon-control','horizon'],['frame-settings','minimum-width']];
 for(const [id] of controls){
  const source=$(id),copy=source.cloneNode(true);copy.removeAttribute('id');copy.hidden=source.hidden;
  for(const control of copy.querySelectorAll('[id]')){
   const original=$(control.id);control.removeAttribute('id');
   if(!control.matches('input,select'))continue;
   control.value=original.value;
   control.onchange=()=>{original.value=control.value;original.dispatchEvent(new Event(original.id==='horizon'?'input':'change'));showWorkshopFrame();};
  }
  workContent.append(copy);
 }
 workButton('Posun celé kompozice',()=>closeThen(beginWorkshopGroupMove)).disabled=sceneLocked||!objects.length;
}
function showWorkshopObjects(){
 workPanel('Objekty');
 const add=workButton('Přidat objekt',()=>openSubpanel(showWorkshopAdd));add.classList.add('primary','work-add-object');add.disabled=sceneLocked;
 for(const item of [...objects].reverse()){
  const button=workButton(typeName(item),()=>{selected=item.id;refresh();openSubpanel(showWorkshopObject);});
  button.className='work-card';button.prepend(motifThumbnail(item));
  button.setAttribute('aria-pressed',String(item.id===selected));
 }
}
let moveDraft=null,groupDraft=null;
const moveHandle=document.createElement('button');
moveHandle.id='work-move-handle';moveHandle.hidden=true;moveHandle.textContent='✥';
moveHandle.setAttribute('aria-label','Přesunout vybraný objekt');
scenePaper.append(moveHandle);
const moveConfirm=document.createElement('div');
moveConfirm.className='work-move-confirm';moveConfirm.hidden=true;document.body.append(moveConfirm);
function finishWorkshopMove(commit){
 if(groupDraft){
  if(!commit)for(const entry of groupDraft){entry.item.x=entry.x;entry.item.y=entry.y;}
  groupDraft=null;moveComposition=false;moveConfirm.hidden=true;refresh();return;
 }
 if(!moveDraft)return;
 if(!commit){moveDraft.item.x=moveDraft.x;moveDraft.item.y=moveDraft.y;}
 moveDraft=null;moveHandle.hidden=moveConfirm.hidden=true;refresh();
}
function beginWorkshopGroupMove(){
 finishWorkshopMove(false);
 setWorkshopHand(false);
 moveConfirm.dataset.group='true';
 groupDraft=objects.map(item=>({item,x:item.x,y:item.y}));
 moveComposition=true;moveConfirm.hidden=false;refresh();
}
workText('Tažením po plátně posuň všechny objekty.',moveConfirm).className='work-group-instruction';
workButton('Hotovo',()=>finishWorkshopMove(true),moveConfirm);
workButton('Zrušit',()=>finishWorkshopMove(false),moveConfirm);
function showWorkshopObject(){
 const item=selectedObject();
 if(!item){
  workPanel('Upravit objekt','object');workText('Vyber objekt klepnutím na plátno nebo v seznamu.');
  workButton('Objekty',showWorkshopObjects);return;
 }
 workPanel('Upravit objekt','object');
 workText(typeName(item));

 const row=workActions();
 workButton('Zpět na objekty',()=>{if(toolHistory.at(-1)?.title==='Objekty')backToolPanel();else rootTool(showWorkshopObjects);},row);
 if(sceneLocked)return;
 const controls=document.createElement('div');controls.className='work-object-fields';workContent.insertBefore(controls,row);
 const g=geometry(item),r=item.height/(item.unitTop??g.reference??-g.top);
 const factor=workPageMm()[0]/W/unitFactor(workPreferences.unit);
 const ratioButton=workButton('Poměr stran',()=>{
  $('lock-aspect').checked=!$('lock-aspect').checked;
  ratioButton.setAttribute('aria-pressed',String($('lock-aspect').checked));
 },controls);
 ratioButton.setAttribute('aria-pressed',String($('lock-aspect').checked));
 function number(label,value,min,max,onchange,unit=''){
  const input=document.createElement('input');
  input.type='number';input.min=min;input.max=max;input.step='any';input.value=Number(value.toFixed(unit==='″'?4:2));
  const row=workNumberRow(input,label,[()=>min,()=>max,()=>unit==='°'?1:unit==='mm'?.1:.01,()=>unit]);
  input.oninput=()=>{if(Number.isFinite(input.valueAsNumber)&&input.validity.valid){onchange(input.valueAsNumber);refresh();}};
  if(unit!=='°')input.onchange=()=>showWorkshopObject();
  controls.append(row.element);
 }
 for(const [label,key,other,baseSize] of [['Šířka','scaleX','scaleY',2*g.half*r],['Výška','scaleY','scaleX',((g.bottom||0)-g.top)*r]]){
  const unit=baseSize*factor;if(!(unit>0))continue;
  number(label,(item[key]??1)*unit,Math.floor(unit*.2*1e6)/1e6,Math.ceil(unit*2*1e6)/1e6,value=>{
   const scale=clamp(value/unit,.2,2),relative=scale/(item[key]??1);
   item[key]=scale;
   if($('lock-aspect').checked)item[other]=clamp((item[other]??1)*relative,.2,2);
   positionWorkshopHandle();
  },workUnit());
 }
 number('Otočení',item.rotation??0,-180,180,value=>{item.rotation=value;positionWorkshopHandle();},'°');
 if(moveDraft?.item===item){
  workButton('Dokončit přesun',()=>{finishWorkshopMove(true);showWorkshopObject();},row);
  workButton('Zrušit přesun',()=>{finishWorkshopMove(false);showWorkshopObject();},row);
 }else workButton('Přesunout',()=>{
  finishWorkshopMove(true);setWorkshopHand(false);moveComposition=false;
  moveDraft={item,x:item.x,y:item.y};moveHandle.hidden=false;
  positionWorkshopHandle();showWorkshopObject();
 },row);
 for(const [label,id] of [['Duplikovat','quick-copy'],['Otočit o 15°','quick-rotate'],['Zrcadlit','quick-mirror'],['Dopředu','layer-up'],['Dozadu','layer-down'],['Smazat','quick-remove']]){
  workButton(label,()=>{finishWorkshopMove(true);$(id).click();showWorkshopObject();},row).disabled=$(id).disabled;
 }
 if(detailLabel(item)) for(const [label,value] of [['Průhledné','transparent'],['Barva pozadí','background']]){
  const fill=workButton(label,()=>{item.detailTreatment=value;refresh();showWorkshopObject();});
  fill.setAttribute('aria-pressed',String(value===(item.detailTreatment??(legacyBacking(item,geometry(item))?'background':'transparent'))));
 }
 if(!item.externalSvg)workButton('Upravit motiv',()=>closeThen(()=>$('quick-edit').click()));
}
workshopDialog.addEventListener('close',()=>{
 if(!workshopDialog.open&&moveDraft)finishWorkshopMove(true);
});
function positionWorkshopHandle(){
 if(!moveDraft)return;
 const b=bounds(moveDraft.item);
 moveHandle.style.left=(b.left+b.right)*50/W+'%';
 moveHandle.style.top=(b.top+b.bottom)*50/H+'%';
}
let handleDrag=null;
moveHandle.onpointerdown=e=>{
 if(!moveDraft)return;
 const [x,y]=canvasPoint(e,stage),item=moveDraft.item;
 handleDrag={id:e.pointerId,dx:x-item.x,dy:y-item.y};
 moveHandle.setPointerCapture(e.pointerId);
};
moveHandle.onpointermove=e=>{
 if(!moveDraft||handleDrag?.id!==e.pointerId)return;
 const [x,y]=canvasPoint(e,stage),item=moveDraft.item;
 item.x=x-handleDrag.dx;item.y=y-handleDrag.dy;
 positionWorkshopHandle();schedule();
};
moveHandle.onlostpointercapture=()=>{handleDrag=null;};
function renderMotifCanvas(canvas,model){
 const g=geometry(model),height=(g.bottom??0)-g.top;
 const factor=Math.min((canvas.height-24)/Math.max(1,height),(canvas.width-24)/Math.max(1,g.half*2));
 const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
 drawObject(context,{...model,x:canvas.width/2,y:(canvas.height+height*factor)/2-(g.bottom??0)*factor,height:factor*(model.unitTop??g.reference??-g.top)},g);
}
function showMotifPreview(name,model,back=showWorkshopAdd){
 if($('motif-dialog').open)$('motif-dialog').close();
 workPanel(name);
 const row=workActions(),viewport=document.createElement('div'),canvas=document.createElement('canvas');
 viewport.className='work-preview';canvas.width=1500;canvas.height=1100;viewport.append(canvas);
 renderMotifCanvas(canvas,model);
 let zoom=1;
 const resize=()=>{canvas.style.width=Math.max(1,Math.min(viewport.clientWidth,viewport.clientHeight*canvas.width/canvas.height))*zoom+'px';};
 workButton('Zpět',()=>toolHistory.length?backToolPanel():back(),row);workButton('−',()=>{zoom=Math.max(.25,zoom/1.5);resize();},row);
 workButton('+',()=>{zoom=Math.min(10,zoom*1.5);resize();},row);
 workButton('Přizpůsobit',()=>{zoom=1;resize();},row);
 workButton('Vložit',()=>closeThen(()=>chooseMotif(model)),row).disabled=sceneLocked;
 workContent.append(viewport);resize();
}
async function showWorkshopAdd(){
 workPanel('Přidat objekt');
 const row=workActions();
 workButton('Zpět na objekty',()=>{if(toolHistory.at(-1)?.title==='Objekty')backToolPanel();else rootTool(showWorkshopObjects);},row);
 workButton('Knihovny',()=>openSubpanel(showWorkshopLibraries),row);
 for(const [index,[name,types]] of motifCategories.entries()){
  const button=workButton(name,()=>openSubpanel(()=>{
   workPanel(builtInSet(index).name);
   const entries=types.length?types.flatMap(categoryModels):savedTemplates.map(item=>[item.label,item]);
   renderWorkshopMotifs(entries,()=>showWorkshopAdd());
   if(name==='Domky')workButton('Vlastní dům',()=>closeThen(()=>$('empty-building').click()));
  }),row);
  button.classList.add('work-tile');
  const set=builtInSet(index);
  setTileIcon(button,set);
  awaitSets().then(()=>{if(button.isConnected){const current=builtInSet(index);button.textContent=current.name;setTileIcon(button,current);}}).catch(()=>{});
 }
 awaitSets().then(()=>{
  if(!row.isConnected)return;
  for(const group of workshopGroups){
   const button=workButton(group.name,()=>openSubpanel(()=>showLibraryGroup(group.id)),row);
   button.classList.add('work-tile');setTileIcon(button,group);
  }
 }).catch(error=>{if(row.isConnected)workText(error.message);});
}
function renderWorkshopMotifs(entries,back){
 for(const [name,model] of entries){
  const button=workButton(name,()=>openSubpanel(()=>showMotifPreview(name,model,back)));
  button.className='work-card';button.prepend(motifThumbnail(model));
 }
}
function updateModuleSource(){
 return new URL('../../../core/',location.href);
}
let workshopUpdateDownloading=false;
function showWorkshopUpdate(target){
 const id='vanocni-dilna',version=document.querySelector('.app-version').textContent.trim();
 const status=workText('Nainstalovaná verze '+version,target);
 const progress=document.createElement('progress');progress.hidden=true;progress.max=1;target.append(progress);
 const button=workButton('Zkontrolovat aktualizaci',async()=>{
  button.disabled=true;
  try{
   const root=updateModuleSource();
   const packages=await import(new URL('packages.js',root));
   const {get}=await import(new URL('db.js',root));
   const record=await get('modules',id);
   if(!record?.active)throw Error('Aktualizace je dostupná v nainstalovaném modulu PWA.');
   const pending=record.pending?.manifest.version;
   if(pending&&!navigator.onLine){
    status.textContent='Staženo: '+pending+'. Použije se při příštím otevření dílny.';return;
   }
   const entry=(await packages.catalog()).modules.find(item=>item.id===id);
   if(!button.isConnected)return;
   if(pending&&(!entry||packages.compare(pending,entry.version)>=0)){
    status.textContent='Staženo: '+pending+'. Použije se při příštím otevření dílny.';
    return;
   }
   if(!entry||packages.compare(entry.version,version)<=0){
    status.textContent='Verze '+version+' je aktuální.';return;
   }
   const issue=packages.compatible(entry);
   if(issue)throw Error(issue);
   status.textContent='Nainstalováno '+version+' · dostupná verze '+entry.version;
   workButton('Stáhnout '+entry.version,async e=>{
    const download=e.currentTarget;download.disabled=button.disabled=true;progress.hidden=false;workshopUpdateDownloading=true;
    try{
     await packages.install(entry,{onProgress:({done,total})=>{progress.value=total?done/total:0;}});
     status.textContent='Staženo: '+entry.version+'. Použije se při příštím otevření dílny.';
     download.remove();
    }catch(error){status.textContent=error.message;download.disabled=false;}
    finally{progress.hidden=true;button.disabled=false;workshopUpdateDownloading=false;}
   },target).dataset.download='true';
  }catch(error){status.textContent='Kontrola selhala: '+error.message;}
  finally{button.disabled=false;}
 },target);
 button.addEventListener('click',()=>target.querySelector('[data-download]')?.remove(),{capture:true});
}
const handBadge=workButton('Ruka aktivní · vypnout',()=>setWorkshopHand(false),sceneScroll);
handBadge.id='work-hand-badge';handBadge.hidden=true;
function setWorkshopHand(active){
 if(active)finishWorkshopMove(false);
 viewHand=active;
 handBadge.hidden=!active;
 sceneScroll.toggleAttribute('data-hand',active);
}
const toolbarActions={
 'work-add':showWorkshopObject,'work-layers':showWorkshopObjects,
 'work-view':showWorkshopView,'work-fit':()=>currentShortcut()[2](),
 'work-save':showWorkshopFiles,'work-more':workshopMenu
};
for(const [id,action] of Object.entries(toolbarActions))$(id).onclick=()=>rootTool(action);
const desktopMenu=workButton('Nástroje dílny',workshopMenu,document.querySelector('.project-tools'));
desktopMenu.className='work-desktop-menu';
const libraryKey='workshop-object-libraries-v1';
let workshopGroups=[];
let libraryReady=false;
async function loadGroups(){
 if(libraryReady)return;
 const groups=await window.ArcadeHost.storageAsync.get(libraryKey);
 workshopGroups=Array.isArray(groups)?groups:[];
 libraryReady=true;
}
async function storeGroups(groups){
 await window.ArcadeHost.storageAsync.batch([{key:libraryKey,value:groups}]);
 workshopGroups=groups;
}
const zipText=new TextDecoder('utf-8',{fatal:true});
const zipEncoder=new TextEncoder();
const stableId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value);
const assetPath=value=>typeof value==='string'&&value.length<240&&value.split('/').every(part=>/^[-a-zA-Z0-9_.]+$/.test(part)&&!['.','..','__proto__','constructor','prototype'].includes(part));
const libraryName=value=>typeof value==='string'&&value.trim()&&value.length<=120;
const maxAssetSize=2_000_000;
function validateExternalModel(model){
 if(!model||!libraryName(model.name)||typeof model.path!=='string'||model.path.length>maxAssetSize||
  !/^[MLZ\d.,\s-]+$/i.test(model.path)||!Number.isFinite(model.width)||model.width<1||model.width>1600||
  !Number.isFinite(model.height)||model.height<1||model.height>1600)throw Error('Neplatná geometrie SVG motivu.');
 return {name:model.name,path:model.path,width:model.width,height:model.height};
}
const externalGeometries=new WeakMap();
function externalLoops(path){
 return [...path.matchAll(/M([^MZ]+)Z/gi)].map(match=>{
  const coords=match[1].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/g)?.map(Number)??[];
  const points=[];
  for(let i=0;i+1<coords.length;i+=2)points.push([coords[i],coords[i+1]]);
  return points;
 }).filter(points=>points.length>=3);
}
function roundedExternalLoop(points,limit){
 // Round short tracing steps while keeping the long edges and intentional points.
 const corners=points.map((p,i)=>{
  const prev=points.at(i-1),next=points[(i+1)%points.length];
  const a=Math.hypot(p[0]-prev[0],p[1]-prev[1]),b=Math.hypot(p[0]-next[0],p[1]-next[1]);
  const short=Math.min(a,b);
  const amount=short>limit*2.2?0:Math.min(short*.46,limit);
  return [a? p.map((v,j)=>v+(prev[j]-v)*amount/a):p,p,b?p.map((v,j)=>v+(next[j]-v)*amount/b):p];
 });
 const loop=new Path2D();loop.moveTo(...corners[0][0]);
 for(const [start,vertex,end] of corners){
  loop.lineTo(...start);loop.quadraticCurveTo(...vertex,...end);
 }
 loop.closePath();return loop;
}
function externalGeometry(model){
 const cached=externalGeometries.get(model);
 if(cached)return cached;
 const ink=new Path2D(),back=new Path2D(),matrix=new DOMMatrix().translate(-model.width/2,-model.height);
 const limit=Math.max(.5,Math.min(4,Math.max(model.width,model.height)*.0027));
 const loops=externalLoops(model.path).map(points=>{
  const box=[Infinity,Infinity,-Infinity,-Infinity];
  for(const [x,y] of points){
   box[0]=Math.min(box[0],x);box[1]=Math.min(box[1],y);
   box[2]=Math.max(box[2],x);box[3]=Math.max(box[3],y);
  }
  return {box,outline:roundedExternalLoop(points,limit),point:points[0]};
 });
 for(const loop of loops){
  ink.addPath(loop.outline,matrix);
  const [x,y]=loop.point;
  const nested=loops.some(other=>other!==loop&&other.box[0]<=loop.box[0]&&other.box[1]<=loop.box[1]&&
   other.box[2]>=loop.box[2]&&other.box[3]>=loop.box[3]&&
   (other.box[0]<loop.box[0]||other.box[1]<loop.box[1]||other.box[2]>loop.box[2]||other.box[3]>loop.box[3])&&
   pc.isPointInPath(other.outline,x,y,'evenodd'));
  if(!nested)back.addPath(loop.outline,matrix);
 }
 const geometry={ink,back,holes:new Path2D(),strokes:[],inset:[],evenOdd:true,top:-model.height,half:model.width/2};
 externalGeometries.set(model,geometry);return geometry;
}
function safeSvg(source){
 if(source.length>maxAssetSize||/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('SVG je příliš velké nebo má nepodporovanou deklaraci.');
 const documentSvg=new DOMParser().parseFromString(source,'image/svg+xml'),svg=documentSvg.documentElement;
 if(svg.localName!=='svg'||svg.namespaceURI!=='http://www.w3.org/2000/svg'||documentSvg.querySelector('parsererror'))throw Error('Neplatné SVG.');
 const allowed=new Set('svg g path rect circle ellipse polygon polyline line defs clipPath mask linearGradient radialGradient stop use symbol title desc'.split(' '));
 for(const element of [svg,...svg.querySelectorAll('*')]){
  if(element.namespaceURI!==svg.namespaceURI||!allowed.has(element.localName))throw Error('SVG obsahuje nepodporovaný prvek '+element.localName+'.');
  for(const a of [...element.attributes]){
   if(a.name==='xmlns'||a.name==='xmlns:xlink')continue;
   if(/^on/i.test(a.name)||a.localName==='base'||a.localName==='style'&&/@|\\|image-set/i.test(a.value)||
     a.localName==='href'&&!/^#[\w:.-]+$/.test(a.value)||
     /url\s*\(/i.test(a.value)&&!/^url\(\s*['"]?#[\w:.-]+['"]?\s*\)$/.test(a.value))
    throw Error('SVG obsahuje aktivní obsah nebo externí odkaz.');
  }
 }
 return svg;
}
async function svgModel(name,source){
 const svg=safeSvg(source);
 let box=svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
 if(!box){
  const length=value=>{
   const match=/^\s*(\d+(?:\.\d+)?)(px|mm|cm|in|pt)?\s*$/.exec(value||'');
   return match?Number(match[1])*({mm:96/25.4,cm:96/2.54,in:96,pt:96/72}[match[2]]??1):NaN;
  };
  box=[0,0,length(svg.getAttribute('width')),length(svg.getAttribute('height'))];
 }
 if(box.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0)throw Error('SVG potřebuje platný viewBox nebo pevné rozměry.');
 const ratio=1600/Math.max(box[2],box[3]),width=Math.max(1,Math.round(box[2]*ratio)),height=Math.max(1,Math.round(box[3]*ratio));
 svg.setAttribute('viewBox',box.join(' '));svg.setAttribute('width',width);svg.setAttribute('height',height);
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const rgba=context.getImageData(0,0,width,height).data,mask=new Uint8Array(width*height);
  for(let i=0;i<mask.length;i++)mask[i]=rgba[4*i+3]>=128;
  const path=contourSVG(mask,width,height,.35);
  if(!path)throw Error('SVG nemá viditelnou geometrii.');
  return validateExternalModel({name,path,width,height});
 }finally{URL.revokeObjectURL(url);}
}
function libraryModel(item){
 const model=item.model;
 return {...template('house'),fixedHouse:true,externalSvg:model,height:Math.min(220,110*model.height/model.width)};
}
function libraryIcon(group){
 const icon=document.createElement('span');icon.innerHTML=glyph('collection-fill');
 const cover=group.cover;
 if(cover){
  const image=document.createElement('img');image.alt='';image.width=56;image.height=36;
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(cover);
  return image;
 }
 const item=group.items.find(item=>item.id===group.iconItem)??group.items[0];
 return item?setThumbnail(item.model?libraryModel(item):item.motif):icon;
}
function setThumbnail(motif){
 const thumb=motifThumbnail(motif),ctx=thumb.getContext('2d',{willReadFrequently:true});
 const {width:w,height:h}=thumb,rgba=ctx.getImageData(0,0,w,h).data;
 let left=w,right=-1,top=h,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>64){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(right<0)return thumb;
 const icon=document.createElement('canvas');icon.width=right-left+1;icon.height=bottom-top+1;
 icon.getContext('2d').drawImage(thumb,left,top,icon.width,icon.height,0,0,icon.width,icon.height);
 icon.setAttribute('aria-hidden','true');return icon;
}
async function showWorkshopLibraries(){
 workPanel('Knihovny objektů');
 if(!libraryReady){
  const message=workText('Načítám knihovny…');
  try{await loadGroups();}catch(error){message.textContent=error.message;return;}
  if(message.parentNode!==workContent||!workshopDialog.open)return;
  message.remove();
 }
 const row=workActions();
 workButton('Import ZIP',()=>openSubpanel(()=>showLibraryImport()),row);
 workButton('Export ZIP',()=>openSubpanel(()=>showLibraryExport()),row).disabled=!workshopGroups.length;
 workButton('Přidat SVG',()=>openSubpanel(()=>showLibraryAdd()),row).disabled=!workshopGroups.length;
 workButton('Nová skupina',()=>{
  workPanel('Nová skupina');
  const name=libraryInput('Název','text');
  const error=workText('');
  const create=workButton('Vytvořit',async()=>{
   if(!libraryName(name.value)){error.textContent='Zadej název skupiny.';return;}
   create.disabled=true;
   try{await storeGroups([...workshopGroups,{id:crypto.randomUUID(),name:name.value.trim(),items:[]}]);if(create.isConnected&&workshopDialog.open)showWorkshopLibraries();}
   catch(e){error.textContent=e.message;create.disabled=false;}
  });
 },row);
 for(const group of workshopGroups){
  const button=workButton(group.name+' · '+group.items.length,()=>openSubpanel(()=>showLibraryGroup(group.id)));
  button.className='work-card';button.prepend(libraryIcon(group));
 }
}
function showLibraryGroup(id){
 const group=workshopGroups.find(group=>group.id===id);
 if(!group)return showWorkshopLibraries();
 workPanel(group.name);
 const row=workActions();
 workButton('Zpět',showWorkshopLibraries,row);
 workButton('Přidat SVG',()=>openSubpanel(()=>showLibraryAdd(id)),row);
 renderWorkshopMotifs(group.items.map(item=>[item.name,libraryModel(item)]),()=>showLibraryGroup(id));
}
function libraryInput(label,type){
 const field=document.createElement('label'),input=document.createElement('input');
 field.textContent=label+' ';input.type=type;field.append(input);workContent.append(field);return input;
}
function showLibraryAdd(id,back){
 workPanel('Přidat SVG');
 const input=libraryInput('Soubor SVG','file');input.accept='.svg,image/svg+xml';
 const name=libraryInput('Název','text');name.maxLength=120;
 const destination=document.createElement('select');
 destination.setAttribute('aria-label','Cílová skupina');
 for(const group of workshopGroups)destination.add(new Option(group.name,group.id));
 if(id)destination.value=id;
 workContent.append(destination);
 const message=workText(''),viewport=document.createElement('div'),canvas=document.createElement('canvas');
 viewport.className='work-preview';viewport.hidden=true;canvas.width=840;canvas.height=520;
 canvas.style.width='100%';viewport.append(canvas);
 let staged=null,revision=0,zoom=1;
 const row=workActions();
 const save=workButton('Přidat do knihovny',async()=>{
  if(!staged||!libraryName(name.value)){message.textContent='Zadej název motivu.';return;}
  const groupId=destination.value;
  const item={...staged,id:crypto.randomUUID(),name:name.value.trim(),model:{...staged.model,name:name.value.trim()}};
  try{
   save.disabled=true;
   await storeGroups(workshopGroups.map(group=>group.id===groupId?{...group,items:[...group.items,item]}:group));
   if(save.isConnected&&workshopDialog.open)(back??(()=>showLibraryGroup(groupId)))();
  }catch(e){message.textContent=e.message;save.disabled=false;}
 },row);
 save.disabled=true;
 workButton('−',()=>{zoom=Math.max(.5,zoom/1.4);canvas.style.width=100*zoom+'%';},row);
 workButton('+',()=>{zoom=Math.min(8,zoom*1.4);canvas.style.width=100*zoom+'%';},row);
 workButton('Zpět',()=>back?back():id?showLibraryGroup(id):showWorkshopLibraries(),row);
 workContent.append(viewport);
 input.onchange=async()=>{
  const request=++revision,file=input.files[0];staged=null;save.disabled=true;viewport.hidden=true;
  if(!file)return;
  try{
   if(file.size>maxAssetSize)throw Error('SVG smí mít nejvýše 2 MB.');
   name.value=file.name.replace(/\.svg$/i,'').slice(0,120);
   const source=await file.text(),model=await svgModel(name.value,source);
   if(request!==revision)return;
   staged={source,model};renderMotifCanvas(canvas,libraryModel(staged));
   viewport.hidden=false;save.disabled=false;message.textContent='';
  }catch(e){if(request===revision)message.textContent=e.message;}
 };
}
function readLibraryZip(data){
 let total=0,count=0;
 const seen=new Set();
 return fflate.unzipSync(data,{filter:file=>{
  if(file.name.endsWith('/'))return false;
  if(++count>500||!assetPath(file.name)||seen.has(file.name)||file.originalSize>maxAssetSize||
    (total+=file.originalSize)>16_000_000)throw Error('ZIP překračuje limity nebo obsahuje neplatnou cestu.');
  seen.add(file.name);return true;
 }});
}
async function parseLibraryZip(file){
 if(file.size>16_000_000)throw Error('ZIP smí mít nejvýše 16 MB.');
 const files=readLibraryZip(new Uint8Array(await file.arrayBuffer()));
 const read=path=>{
  if(!assetPath(path)||!Object.hasOwn(files,path))throw Error('Chybí soubor '+path+'.');
  return zipText.decode(files[path]);
 };
 const manifest=JSON.parse(read('manifest.json'));
 if(manifest.format!=='vanocni-dilna-object-library'||manifest.version!==1||!Array.isArray(manifest.groups)||!manifest.groups.length||manifest.groups.length>100)throw Error('Neplatný manifest knihovny.');
 const groupIds=new Set(),groups=[];
 for(const group of manifest.groups){
  if(!group||!stableId(group.id)||groupIds.has(group.id)||!libraryName(group.name)||!Array.isArray(group.items)||group.items.length>400)throw Error('Neplatná skupina v manifestu.');
  groupIds.add(group.id);
  const itemIds=new Set(),items=[];
  for(const item of group.items){
   if(!item||!stableId(item.id)||itemIds.has(item.id)||!libraryName(item.name)||!item.svg?.endsWith?.('.svg'))throw Error('Neplatná položka v manifestu.');
   itemIds.add(item.id);
   const source=read(item.svg);
   items.push({id:item.id,name:item.name,source,model:await svgModel(item.name,source)});
  }
  const cover=group.cover==null?undefined:new XMLSerializer().serializeToString(safeSvg(read(group.cover)));
   if(group.iconItem!=null&&!itemIds.has(group.iconItem))throw Error('Titulní motiv v sadě chybí.');
  groups.push({id:group.id,name:group.name,cover,iconItem:group.iconItem,items});
 }
 return groups;
}
function showLibraryImport(back=showWorkshopLibraries){
 workPanel('Import ZIP');
 const input=libraryInput('Knihovna','file');input.accept='.zip,application/zip';
 const status=workText(''),preview=document.createElement('div');workContent.append(preview);
 const row=workActions();workButton('Zpět',back,row);
 let imported=[],revision=0;
 const choices=new Map();
 const apply=workButton('Importovat',async()=>{
  const next=new Map(workshopGroups.map(group=>[group.id,group]));
  for(const group of imported){
   const action=choices.get(group.id)?.value;
   if(action==='skip')continue;
   if(action==='copy')next.set(crypto.randomUUID(),{...group,id:null});
   else if(action==='replace'||!next.has(group.id))next.set(group.id,group);
  }
  apply.disabled=true;
  try{await storeGroups([...next].map(([id,group])=>({...group,id})));if(apply.isConnected&&workshopDialog.open)back();}
  catch(e){status.textContent=e.message;apply.disabled=false;}
 },row);
 apply.disabled=true;
 input.onchange=async()=>{
  const request=++revision,file=input.files[0];apply.disabled=true;preview.replaceChildren();choices.clear();
  if(!file)return;
  status.textContent='Kontroluji ZIP…';
  try{
   const groups=await parseLibraryZip(file);
   if(request!==revision)return;
   imported=groups;
   for(const group of groups){
    const line=workText(group.name+' · '+group.items.length,preview);
    line.className='work-card';line.prepend(libraryIcon(group));
    if(!workshopGroups.some(existing=>existing.id===group.id))continue;
    const select=document.createElement('select');choices.set(group.id,select);
    select.setAttribute('aria-label','Kolize skupiny '+group.name);
    for(const [label,value] of [['Přeskočit','skip'],['Nahradit','replace'],['Importovat jako kopii','copy']])select.add(new Option(label,value));
    line.append(select);
   }
   status.textContent='Připraveno k importu';apply.disabled=false;
  }catch(e){if(request===revision)status.textContent=e.message;}
 };
}
function showLibraryExport(back=showWorkshopLibraries,available=workshopGroups){
 workPanel('Export ZIP');
 workButton('Zpět',back);
 const inputs=[];
 workButton('Vybrat vše',()=>{for(const input of inputs)input.checked=true;});
 for(const group of available){
  const input=libraryInput(group.name+' · '+group.items.length,'checkbox');input.value=group.id;
  input.parentElement.className='work-card';input.parentElement.prepend(libraryIcon(group));inputs.push(input);
 }
 const status=workText('');
 workButton('Stáhnout ZIP',()=>{
  const chosen=new Set(inputs.filter(input=>input.checked).map(input=>input.value));
  if(!chosen.size){status.textContent='Vyber alespoň jednu skupinu.';return;}
  try{
   const files=Object.create(null);
   const groups=available.filter(group=>chosen.has(group.id)).map(group=>{
    const prefix='groups/'+group.id+'/';
    const cover=group.cover?prefix+'cover.svg':undefined;
    if(cover)files[cover]=zipEncoder.encode(group.cover);
    const items=group.items.map(item=>{
     const svg=prefix+'items/'+item.id+'.svg';files[svg]=zipEncoder.encode(item.source??builtinSvg(item.motif));
     return {id:item.id,name:item.name,svg};
    });
    return {id:group.id,name:group.name,cover,iconItem:group.iconItem,items};
   });
   files['manifest.json']=zipEncoder.encode(JSON.stringify({format:'vanocni-dilna-object-library',version:1,groups},null,2));
   const bytes=fflate.zipSync(files,{level:6});
   readLibraryZip(bytes);
   if(bytes.length>16_000_000)throw Error('Vyber méně skupin. ZIP překračuje limit 16 MB.');
   const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));
   link.download='vanocni-knihovny.zip';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }catch(e){status.textContent=e.message;}
 });
}
function cutRegions(mask,w,h){
 const black=labelMask(mask,w,h,1);
 const negative=Uint8Array.from(mask,pixel=>1-pixel);
 const white=labelMask(negative,w,h,1);
 function describe(labels,value){
  const entries=Array.from({length:labels.components+1},()=>null);
  for(let i=0;i<mask.length;i++){
   const id=labels.problem[i];if(!id)continue;
   const x=i%w,y=Math.floor(i/w);
   const region=entries[id]??={id,value,seed:i,area:0,left:x,right:x,top:y,bottom:y,hash:2166136261};
   region.area++;region.left=Math.min(region.left,x);region.right=Math.max(region.right,x);
   region.top=Math.min(region.top,y);region.bottom=Math.max(region.bottom,y);
   region.hash=Math.imul(region.hash^i,16777619)>>>0;
  }
  return entries;
 }
 return {black,white,regions:[...describe(black,1).filter(Boolean).filter(region=>region.id!==black.keeper),
  ...describe(white,0).filter(Boolean).filter(region=>region.left>0&&region.top>0&&region.right<w-1&&region.bottom<h-1)]};
}
function validateCutEdits(edits){
 if(edits==null)return [];
 if(!Array.isArray(edits)||edits.length>200||edits.some(e=>!e||![0,1].includes(e.value)||
  ![e.w,e.h,e.seed,e.area,e.hash].every(Number.isSafeInteger)||
  e.w<1||e.h<1||e.w*e.h>30_000_000||e.seed<0||e.seed>=e.w*e.h||e.area<1||e.area>e.w*e.h||
  e.hash<0||e.hash>0xffffffff))throw Error('Neplatné opravy siluety.');
 return edits;
}
function applyCutEdits(mask,w,h){
 const edits=cutEdits.filter(edit=>edit.w===w&&edit.h===h);
 if(!edits.length)return;
 let analysis=cutRegions(mask,w,h),changed=false;
 for(const edit of edits){
  const matches=region=>region.seed===edit.seed&&region.area===edit.area&&region.hash===edit.hash&&region.value===edit.value;
  let region=analysis.regions.find(matches);
  if(!region&&changed){
   analysis=cutRegions(mask,w,h);changed=false;
   region=analysis.regions.find(matches);
  }
  if(!region)continue;
  const labels=(region.value?analysis.black:analysis.white).problem;
  changed=true;
  for(let y=region.top;y<=region.bottom;y++)for(let x=region.left;x<=region.right;x++){
   const i=y*w+x;if(labels[i]===region.id)mask[i]=1-region.value;
  }
 }
}
function thinCutAreas(mask,w,h,limit){
 const found=[];
 if(limit<=1)return found;
 // Look for enclosed narrow runs with thicker material on either side.
 function axis(transposed){
  const columns=transposed?h:w,rows=transposed?w:h;
  const thickness=new Uint16Array(mask.length);
  for(let x=0;x<columns;x++)for(let y=0;y<rows;){
   const ink=(col,row)=>mask[transposed?col*w+row:row*w+col];
   if(!ink(x,y)){y++;continue;}
   let end=y+1;while(end<rows&&ink(x,end))end++;
   for(let pos=y;pos<end;pos++)thickness[x+pos*columns]=end-y;
   y=end;
  }
  const reach=Math.max(2,Math.ceil(limit*2));
  for(let y=1;y<rows-1;y++)for(let x=reach;x<columns-reach;x++){
   const i=x+y*columns,value=thickness[i];
   if(!value||value>=limit||thickness[i-reach]<limit||thickness[i+reach]<limit)continue;
   const px=transposed?y:x,py=transposed?x:y;
   if(found.some(p=>Math.hypot(p.x-px,p.y-py)<reach*1.5))continue;
   found.push({kind:'Tenký spoj',x:px,y:py,width:value});
   if(found.length>=40)return;
  }
 }
 axis(false);if(found.length<40)axis(true);return found;
}
const markerLayer=document.createElement('div');markerLayer.id='work-cut-markers';scenePaper.append(markerLayer);
let areaLimit=.25,cutResults=[],cutFilters=new Set(['Ostrov','Tenký spoj','Drobný fragment','Drobný otvor']);
workshopDialog.addEventListener('close',()=>markerLayer.replaceChildren());
function showCutCheck(){
 workPanel('Kontrola řezání');
 const scale=cutScale(),{mask,w,h}=preparedCutMask(),pixels=cutPixelsPerMm(scale);
 const {regions}=cutRegions(mask,w,h);
 cutResults=regions.flatMap(region=>{
  const small=region.area/(pixels*pixels)<=areaLimit;
  if(!region.value&&!small)return [];
  return [{kind:region.value?(small?'Drobný fragment':'Ostrov'):'Drobný otvor',
   x:(region.left+region.right)/2,y:(region.top+region.bottom)/2,region,w,h}];
 }).concat(thinCutAreas(mask,w,h,minimumMm*pixels)).map((problem,index)=>({...problem,index:index+1,scale,pixels}));
 const settings=workActions();
 function threshold(label,value,min,max,step,apply){
  const field=document.createElement('label'),input=document.createElement('input');
  field.textContent=label+' ';input.type='number';input.value=value;input.min=min;input.max=max;input.step=step;
  input.onchange=()=>{if(input.reportValidity()&&Number.isFinite(input.valueAsNumber)){apply(input.valueAsNumber);showCutCheck();}};
  field.append(input);settings.append(field);
 }
 threshold('Min. spoj (mm)',minimumMm,.4,5,.1,value=>{minimumMm=value;$('minimum-width').value=value;invalidateCut();check();});
 threshold('Drobný tvar do (mm²)',areaLimit,.01,100,.01,value=>{areaLimit=value;});
 const filters=workActions();
 for(const kind of ['Ostrov','Tenký spoj','Drobný fragment','Drobný otvor']){
  const button=workButton(kind,()=>{cutFilters.has(kind)?cutFilters.delete(kind):cutFilters.add(kind);showCutCheck();},filters);
  button.setAttribute('aria-pressed',String(cutFilters.has(kind)));
 }
 if(cutEdits.length)workButton('Vrátit poslední opravu',()=>{cutEdits.pop();invalidateCut();check();showCutCheck();}).disabled=sceneLocked;
 const shown=cutResults.filter(problem=>cutFilters.has(problem.kind));
 workText(shown.length?('Nálezy: '+shown.length):'Pro zvolené filtry bez nálezů.');
 if(shown.length>100)workText('Zobrazeno prvních 100 nálezů.');
 markerLayer.replaceChildren();
 for(const problem of shown.slice(0,100)){
  const button=workButton(problem.index+' · '+problem.kind,()=>showCutProblem(problem));
  button.className='work-card';button.insertAdjacentHTML('afterbegin',actionGlyph(problem.kind));addCutMarker(problem);
 }
}
function addCutMarker(problem){
 const marker=document.createElement('span');
 marker.textContent=problem.index;
 marker.dataset.kind=problem.kind;
 marker.style.left=problem.x/problem.scale/W*100+'%';
 marker.style.top=problem.y/problem.scale/H*100+'%';
 markerLayer.append(marker);
}
function showCutProblem(problem){
 workPanel(problem.kind);
 markerLayer.replaceChildren();addCutMarker(problem);
 workButton('Zpět na nálezy',()=>{fitScene();showCutCheck();});
 viewX=viewY=0;zoomScene(Math.max(2.25,sceneZoom)-sceneZoom);
 function centerProblem(){
  const width=scenePaper.offsetWidth;
  viewX=width*(.5-problem.x/problem.scale/W);
  viewY=width*H/W*(.5-problem.y/problem.scale/H);
  layoutView();
 }
 centerProblem();requestAnimationFrame(centerProblem);
 const region=problem.region;
 if(!region){workText('Odhad šířky: '+(problem.width/problem.pixels).toFixed(2)+' mm');return;}
 workText('Plocha: '+(region.area/problem.pixels**2).toFixed(2)+' mm²');
 if(sceneLocked)return;
 const label=region.value?'Odstranit fragment':'Vyplnit otvor';
 const preview=document.createElement('canvas');
 preview.width=260;preview.height=116;preview.style.maxWidth='100%';
 const c=preview.getContext('2d'),{mask,w,h}=preparedCutMask();
 const padding=8,factor=Math.min(108/(8+region.right-region.left+2*padding),84/(8+region.bottom-region.top+2*padding));
 const source=document.createElement('canvas');source.width=region.right-region.left+1+2*padding;source.height=region.bottom-region.top+1+2*padding;
 const sc=source.getContext('2d'),image=sc.createImageData(source.width,source.height);
 function drawPatch(after,offset){
  const labels=after?cutRegions(mask,w,h)[region.value?'black':'white'].problem:null;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
   const px=region.left-padding+x,py=region.top-padding+y,i=px+py*w;
   const ink=px>=0&&px<w&&py>=0&&py<h&&(after&&labels[i]===region.id?!region.value:mask[i]);
   const out=(y*source.width+x)*4;
   image.data[out]=image.data[out+1]=image.data[out+2]=ink?0:246;image.data[out+3]=255;
  }
  sc.putImageData(image,0,0);c.drawImage(source,offset,22,source.width*factor,source.height*factor);
 }
 c.fillText('Před',4,14);c.fillText('Po',136,14);drawPatch(false,4);drawPatch(true,136);
 workContent.append(preview);
 const limit=workText('');
 workButton(label,()=>{
  if(cutEdits.length>=200){limit.textContent='Kompozice dosáhla limitu 200 oprav.';return;}
  cutEdits.push({w:problem.w,h:problem.h,value:region.value,seed:region.seed,area:region.area,hash:region.hash});
  invalidateCut();check();fitScene();showCutCheck();
 });
}
const workPreferenceKey='workshop-display-v1';
const workDefaults={shortcut:'composition',unit:'mm',dimensions:'edge',grid:0,dpi:300,background:'paper',range:'page'};
const workPreferences={...workDefaults};
try{Object.assign(workPreferences,JSON.parse(editorStorage.getItem(workPreferenceKey)||'{}'));}catch{}
const unitFactor=unit=>({mm:1,cm:10,in:25.4}[unit]||1);
const workVersion=document.querySelector('.app-version').textContent.trim();
const workPageMm=()=>[outputMm*W/(fullPage?W:cutWidth||W),pageHeightMm??outputMm*H/(fullPage?W:cutWidth||W)];
const workUnit=()=>workPreferences.unit==='in'?'″':workPreferences.unit;
const workMeasure=value=>new Intl.NumberFormat('cs',{maximumFractionDigits:2}).format(value/unitFactor(workPreferences.unit));
const workDimensions=document.createElement('div');
workDimensions.className='work-dimensions';
workDimensions.innerHTML='<output><span></span></output><output><span></span></output>';
scenePaper.append(workDimensions);
const workSizeCorner=document.createElement('output');
workSizeCorner.className='work-size-corner';
sceneScroll.append(workSizeCorner);
const workGrid=document.createElement('div');workGrid.className='work-grid';scenePaper.append(workGrid);
function refreshWorkDimensions(){
 const [width,height]=workPageMm(),unit=workUnit();
 workDimensions.children[0].firstElementChild.textContent=workMeasure(width)+' '+unit;
 workDimensions.children[1].firstElementChild.textContent=workMeasure(height)+' '+unit;
 const viewport=sceneScroll.getBoundingClientRect(),paper=scenePaper.getBoundingClientRect();
 const edge=workPreferences.dimensions==='edge'&&paper.left>=viewport.left&&paper.top>=viewport.top&&paper.right+60<=viewport.right&&paper.bottom+25<=viewport.bottom;
 workDimensions.hidden=!edge;
 workSizeCorner.hidden=workPreferences.dimensions==='hide'||edge;
 workSizeCorner.textContent=workMeasure(width)+' × '+workMeasure(height)+' '+unit;
 const step=workPreferences.grid*unitFactor(workPreferences.unit);
 workGrid.hidden=!step||paper.width*step/width<8;
 workGrid.style.backgroundSize=100*step/width+'% '+100*step/height+'%';
}
new ResizeObserver(refreshWorkDimensions).observe(scenePaper);
function saveWorkPreferences(){
 try{editorStorage.setItem(workPreferenceKey,JSON.stringify(workPreferences));}catch{}
 refreshWorkDimensions();
}
const workIconPaths={about:'M8 2 2 12h3L1 19h14l-4-7h3L8 2zm8 3 6 9h-3l4 6h-7',help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-3-13a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0z',more:'M4 12h.01m8 0h.01m8 0h.01',house:'M3 11 12 3l9 8v10H3V11zm7 10v-7h4v7',tree:'m12 2-6 9h3l-6 8h18l-6-8h3l-6-9zm0 17v3',snow:'M12 2v20M3 7l18 10M3 17 21 7',bell:'M4 17h16l-3-4V9a5 5 0 0 0-10 0v4l-3 4zm6 3h4'};
const workIcon=(key)=>key==='objects'?uiIcon('M4 5h9M4 12h9M4 19h9M17 3h4v4h-4zm0 7h4v4h-4zm0 7h4v4h-4z'):uiIcon(workIconPaths[key]||mobilePaths[key]||mobilePaths.layer);
const bar=$('workshop-bar');
for(const [id,key] of Object.entries({'work-add':'edit','work-layers':'objects','work-view':'eye','work-fit':'fit','work-save':'save','work-more':'more'})){
 const button=$(id),label=({'work-add':'Upravit objekt','work-save':'Soubory','work-more':'Další nástroje'}[id]??button.querySelector('span').textContent);
 button.setAttribute('aria-label',label);button.title=label;button.innerHTML=workIcon(key);
}
const iconButton=(label,key,action,parent)=>{
 const button=workButton(label,action,parent);button.setAttribute('aria-label',label);button.title=label;button.innerHTML=workIcon(key);return button;
};
const railAbout=iconButton('Nastavení dílny','about',()=>openWorkSettings(),bar);
railAbout.className='work-brand';
const railVersion=document.createElement('small');railVersion.textContent=workVersion;railAbout.append(railVersion);bar.prepend(railAbout);
const railHelp=iconButton('Průvodce','help',()=>toggleWorkGuide(),bar);railHelp.className='work-rail-help';
const mast=document.querySelector('.masthead');
const headerAbout=iconButton('Nastavení dílny','about',()=>openWorkSettings(),mast);headerAbout.className='work-header-about';
const headerHelp=iconButton('Průvodce','help',()=>toggleWorkGuide(),mast);headerHelp.className='work-header-help';
const guide=document.createElement('div');guide.className='work-guide';guide.hidden=true;document.body.append(guide);
function toggleWorkGuide(force=guide.hidden){
 guide.hidden=!force;guide.replaceChildren();
 if(!force)return;
 iconButton('Zavřít průvodce','close',()=>toggleWorkGuide(false),guide);
 workText('Průvodce',guide);
 const targets=workshopDialog.open?[...workContent.querySelectorAll('button')]:[...bar.querySelectorAll('button:not(.work-rail-help)')].filter(el=>el.offsetWidth);
 for(const target of targets){
  const box=target.getBoundingClientRect();
  if(box.bottom<=0||box.top>=innerHeight||(workshopDialog.open&&(box.top<workContent.getBoundingClientRect().top||box.bottom>workContent.getBoundingClientRect().bottom)))continue;
  const caption=workText(target.getAttribute('aria-label')||target.textContent,guide);
  const side=matchMedia('(orientation:landscape)').matches;
  if(workshopDialog.open)continue;
  caption.className='work-guide-tip';
  if(side){caption.style.left=box.right+8+'px';caption.style.top=box.top+'px';}
  else {
   const index=targets.indexOf(target);
   caption.style.left=Math.max(38,Math.min(innerWidth-38,(box.left+box.right)/2))+'px';
   caption.style.top=box.top-(index%2?90:48)+'px';caption.classList.add('work-guide-bottom');
  }
 }
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!guide.hidden){e.stopImmediatePropagation();toggleWorkGuide(false);}},true);
const settings=document.createElement('dialog');settings.id='work-settings';settings.setAttribute('aria-label','Nastavení dílny');document.body.append(settings);
let workSection='canvas';
let settingsBack=null;
function openWorkSettings(section=workSection,back=null){
 settingsBack=back;
 if(workshopDialog.open)workshopDialog.close();
 toggleWorkGuide(false);
 if(!settings.open)settings.show();
 document.body.classList.add('work-settings-open');renderWorkSettings(section);
}
settings.addEventListener('close',()=>{
 if(settings.open)return;
 document.body.classList.remove('work-settings-open');
 const back=settingsBack;settingsBack=null;
 back?.();
});
function renderWorkSettings(section){
 workSection=section;settings.replaceChildren();
 const header=document.createElement('header');settings.append(header);
 iconButton(settingsBack?'Zpět':'Zpět do kompozice','left',()=>settings.close(),header);
 const title=document.createElement('h2');title.textContent='Nastavení dílny';header.append(title);
 const nav=document.createElement('nav'),content=document.createElement('section');settings.append(nav,content);
 for(const [id,label] of [['canvas','Plátno'],['png','Export PNG'],['sets','Sady objektů'],['controls','Ovládání'],['system','Systém']]){
  const b=workButton(label,()=>renderWorkSettings(id),nav);b.setAttribute('aria-current',id===section?'page':'false');
 }
 function option(label,key,entries){
  const field=document.createElement('label'),select=document.createElement('select');
  field.textContent=label;field.append(select);content.append(field);
  for(const [value,name] of entries)select.add(new Option(name,value));
  select.value=workPreferences[key];select.onchange=()=>{workPreferences[key]=select.value;saveWorkPreferences();updateShortcutButton();renderWorkSettings(section);};
 }
 function number(label,key,min,max){
  const input=document.createElement('input');
  input.type='number';input.min=min;input.max=max;input.value=workPreferences[key];
  input.step=key==='grid'?'any':'1';
  const row=workNumberRow(input,label,[()=>min,()=>key==='grid'?100:max,()=>key==='grid'?.1:1,()=>key==='dpi'?'DPI':'']);
  input.onchange=()=>{if(!input.reportValidity()||!Number.isFinite(input.valueAsNumber))return;workPreferences[key]=input.valueAsNumber;saveWorkPreferences();renderWorkSettings(section);};
  content.append(row.element);
 }
 if(section==='canvas'){
  option('Jednotky','unit',[['mm','Milimetry'],['cm','Centimetry'],['in','Palce']]);
  option('Rozměry plátna','dimensions',[['edge','Kóty u plátna'],['corner','V rohu'],['hide','Skrýt']]);
  number('Krok mřížky ('+workUnit()+', 0 vypne)','grid',0,10000);
 }else if(section==='png'){
  const row=document.createElement('div');row.className='work-actions';content.append(row);
  for(const dpi of [150,300,600]){
   const button=workButton(dpi+' DPI',()=>{workPreferences.dpi=dpi;saveWorkPreferences();renderWorkSettings(section);},row);
   button.setAttribute('aria-pressed',String(workPreferences.dpi===dpi));
  }
  number('Vlastní DPI','dpi',1,2400);
  option('Pozadí','background',[['paper','Barva plátna'],['clear','Průhledné']]);
  option('Rozsah exportu','range',[['page','Celé plátno'],['ink','Ořez na obsah']]);
  const [w,h]=workPageMm(),mask=preparedCutMask(),bounds=workPreferences.range==='ink'?exportBounds(true):{width:mask.w,height:mask.h};
  if(bounds)workText(Math.round(w*bounds.width/mask.w*workPreferences.dpi/25.4)+' × '+Math.round(h*bounds.height/mask.h*workPreferences.dpi/25.4)+' px',content);
 }else if(section==='controls'){
  option('Rychlá volba','shortcut',Object.entries(workShortcuts).map(([id,[label]])=>[id,label]));
 }else if(section==='sets'){
  renderSets(content);
 }else{
  showWorkshopUpdate(content);
  workText(navigator.onLine?'Připojení: online':'Připojení: offline',content);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Systémové informace';details.append(summary);content.append(details);
  workText(innerWidth+' × '+innerHeight+' CSS px',details);
  const root=updateModuleSource();
  import(new URL('db.js',root)).then(async db=>{
   workText('Jádro PWA '+db.CORE_VERSION,details);
   const record=await db.get('modules','vanocni-dilna');
   const cache=record?.active?.cache;
   workText(cache&&await caches.has(cache)?'Offline balíček je uložen.':'Offline balíček není k dispozici.',details);
  }).catch(()=>workText('Údaje jádra nejsou dostupné.',details));
  workButton('Obnovit výchozí nastavení',()=>{Object.assign(workPreferences,workDefaults);saveWorkPreferences();updateShortcutButton();renderWorkSettings(section);},content);
 }
}

const builtInSetKey='workshop-builtin-set-icons-v1';
let builtinOverrides={},setsLoading;
function awaitSets(){
 return setsLoading??=Promise.all([loadGroups(),window.ArcadeHost.storageAsync.get(builtInSetKey)]).then(([,value])=>{
  builtinOverrides=value??{};
 }).catch(error=>{setsLoading=null;throw error;});
}
function builtInSet(index){
 const [name,types]=motifCategories[index];
 const entries=types.length?types.flatMap(categoryModels):savedTemplates.map(item=>[item.label,item]);
 return {id:'builtin-'+index,builtin:true,name,items:entries.map(([name,motif],i)=>({id:'motif-'+i,name,motif})),...builtinOverrides[index]};
}
function setTileIcon(button,set){
 button.querySelector('.work-set-icon')?.remove();
 button.querySelector(':scope > svg')?.remove();
 const icon=libraryIcon(set);
 icon.classList.add('work-set-icon');button.prepend(icon);
}
function builtinSvg(motif){
 const canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;
 renderMotifCanvas(canvas,motif);
 const {width:w,height:h}=canvas;
 const rgba=canvas.getContext('2d').getImageData(0,0,w,h).data;
 const mask=new Uint8Array(w*h);
 for(let i=0;i<mask.length;i++)mask[i]=rgba[4*i+3]>=128;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'"><path fill-rule="evenodd" d="'+contourSVG(mask,w,h,.35)+'"/></svg>';
}
function setTool(action){
 settings.close();action();
}
function backToSets(){
 if(workshopDialog.open)workshopDialog.close();
 openWorkSettings('sets');
}
async function renderSets(content){
 const heading=document.createElement('h3');heading.textContent='Sady objektů';content.append(heading);
 const status=workText('Načítám sady…',content);
 try{await awaitSets();}catch(error){status.textContent=error.message;return;}
 if(!content.isConnected)return;
 status.remove();
 const sets=[...motifCategories.map((_,i)=>builtInSet(i)),...workshopGroups];
 const actions=document.createElement('div');actions.className='work-actions';content.append(actions);
 workButton('Import ZIP',()=>setTool(()=>showLibraryImport(backToSets)),actions);
 workButton('Export ZIP',()=>setTool(()=>showLibraryExport(backToSets,sets)),actions);
 workButton('Nová sada',()=>editSet(content,{id:crypto.randomUUID(),name:'',items:[]}),actions);
 const list=document.createElement('div');list.className='work-set-list';content.append(list);
 for(const set of sets){
  const row=document.createElement('div');row.className='work-set-row';list.append(row);
  const icon=libraryIcon(set);icon.classList.add('work-set-icon');
  const title=document.createElement('span');title.textContent=set.name;
  const count=document.createElement('small');count.textContent=set.items.length;
  count.setAttribute('aria-label',set.items.length+' motivů');
  row.append(icon,title,count);
  const edit=workButton('Upravit sadu',()=>editSet(content,set),row);
  edit.setAttribute('aria-label','Upravit sadu '+set.name);edit.title='Upravit sadu';edit.innerHTML=glyph('pencil-fill');
 }
}
function editSet(content,set){
 content.replaceChildren();
 const heading=document.createElement('h3');heading.textContent=set.name||'Nová sada';content.append(heading);
 const field=document.createElement('label');field.textContent='Název ';
 const name=document.createElement('input');name.type='text';name.maxLength=120;name.value=set.name;field.append(name);content.append(field);
 let cover=set.cover,iconItem=set.iconItem,revision=0;
 const preview=document.createElement('div');preview.className='work-set-preview work-tile';content.append(preview);
 const grid=document.createElement('div');grid.className='work-set-candidates';content.append(grid);
 const message=workText('',content);
 function renderPreview(){
  preview.replaceChildren(libraryIcon({...set,cover,iconItem}),document.createTextNode(name.value||'Název sady'));
  for(const button of grid.children)button.setAttribute('aria-pressed',String(button.dataset.item===iconItem&&!cover));
 }
 name.oninput=renderPreview;
 for(const item of set.items){
  const b=workButton('',()=>{revision++;cover=undefined;iconItem=item.id;renderPreview();},grid);
  b.title=item.name;b.setAttribute('aria-label','Motiv '+item.name);b.dataset.item=item.id;
  b.append(motifThumbnail(item.model?libraryModel(item):item.motif));
 }
 const upload=document.createElement('input');upload.type='file';upload.accept='.svg,image/svg+xml';upload.hidden=true;content.append(upload);
 const actions=document.createElement('div');actions.className='work-actions';content.append(actions);
 workButton('Nahrát SVG ikonu',()=>upload.click(),actions);
 workButton('Obnovit výchozí ikonu',()=>{revision++;cover=iconItem=undefined;renderPreview();},actions);
 workButton('Zrušit',backToSets,actions);
 if(!set.builtin&&workshopGroups.some(group=>group.id===set.id))workButton('Přidat SVG',()=>setTool(()=>showLibraryAdd(set.id,()=>openWorkSettings('sets'))),actions);
 const save=workButton('Uložit',async()=>{
  if(!libraryName(name.value)){message.textContent='Zadej název sady.';return;}
  const data={name:name.value.trim(),cover,iconItem};
  save.disabled=true;
  try{
   if(set.builtin){
    const next={...builtinOverrides,[set.id.slice(8)]:data};
    await window.ArcadeHost.storageAsync.batch([{key:builtInSetKey,value:next}]);builtinOverrides=next;
   }else await storeGroups([...workshopGroups.filter(group=>group.id!==set.id),{...set,...data}]);
   backToSets();
  }catch(error){message.textContent=error.message;save.disabled=false;}
 },actions);
 upload.onchange=async()=>{
  const file=upload.files[0],request=++revision;upload.value='';
  if(!file)return;
  save.disabled=true;
  try{
   if(file.size>maxAssetSize)throw Error('SVG smí mít nejvýše 2 MB.');
   const source=await file.text();
   await svgModel('Titulní ikona',source);
   if(request!==revision)return;
   cover=new XMLSerializer().serializeToString(safeSvg(source));iconItem=undefined;renderPreview();message.textContent='';
  }catch(error){if(request===revision)message.textContent=error.message;}
  finally{save.disabled=false;}
 };
 renderPreview();
}

const workShortcuts={
 composition:['Kompozice','Nový',showWorkshopComposition],
 objects:['Objekty','Objekty',showWorkshopObjects],
 add:['Přidat objekt','Přidat objekt',showWorkshopAdd],
 view:['Pohled','Pohled',showWorkshopView],
 files:['Soubory','Uložit',showWorkshopFiles],
 tools:['Další nástroje',null,workshopMenu],
 new:['Nová kompozice','Nový',()=>triggerTool('project-new')],
 templates:['Šablony','Šablony',showWorkshopTemplates],
 dimensions:['Rozměry plátna','Rozměry plátna',()=>triggerTool('page-open')],
 frame:['Rám a horizont','Rám a horizont',showWorkshopFrame],
 base:['Podstava','Podstava',()=>triggerTool('toggle-base')],
 lock:['Zámek kompozice','Zamknout kompozici',()=>triggerTool('scene-lock')],
 move:['Posun celé kompozice','Posun celé kompozice',()=>{if(!sceneLocked&&objects.length)closeThen(beginWorkshopGroupMove);else showWorkshopComposition();}],
 fit:['Celé plátno','Celé plátno',fitScene],
 zoomOut:['Oddálit','−',()=>zoomScene(-sceneZoom*.2)],
 zoomIn:['Přiblížit','+',()=>zoomScene(sceneZoom*.25)],
 hand:['Ruka','Ruka',()=>{closeThen(()=>{});setWorkshopHand(!viewHand);}],
 colors:['Barvy a obrysy','Barvy, obrysy a inverze',()=>triggerTool('appearance-open')],
 dimensionsView:['Zobrazení kót','Kóty',()=>{showWorkshopView();workContent.querySelector('[data-dimensions-toggle]')?.click();}],
 open:['Otevřít projekt','Otevřít',()=>triggerTool('project-load')],
 save:['Uložit projekt','Uložit',()=>{if(projectHasName)saveProjectFile(projectFileStem);else triggerTool('project-save');}],
 saveAs:['Uložit jako','Uložit jako',()=>triggerTool('project-save')],
 png:['Export PNG','PNG',()=>triggerTool('png')],
 svg:['Export SVG','SVG',()=>triggerTool('svg')],
 export:['Nastavení exportu','Nastavení exportu',()=>openWorkSettings('png')],
 cut:['Kontrola řezání','Kontrola řezání',showCutCheck],
 repair:['Opravit siluetu','Opravit siluetu',()=>triggerTool('repair-open')],
 cutSettings:['Nastavení řezu','Nastavení řezu',()=>triggerTool('setup-open')],
 sets:['Sady objektů','Sady objektů',()=>openWorkSettings('sets')],
 settings:['Nastavení dílny','Nastavení dílny',()=>openWorkSettings()],
 update:['Aktualizace modulu','Zkontrolovat aktualizaci',()=>openWorkSettings('system')],
 exit:['Zpět do aplikace','Zpět do aplikace',()=>closeThen(()=>window.ArcadeHost.back())]
};
function currentShortcut(){
 return Object.hasOwn(workShortcuts,workPreferences.shortcut)?workShortcuts[workPreferences.shortcut]:workShortcuts.composition;
}
function updateShortcutButton(){
 const [label,icon]=currentShortcut(),button=$('work-fit');
 button.innerHTML=actionGlyph(icon??'')||workIcon(icon==='Pohled'?'eye':icon==='Objekty'?'objects':'more');
 button.title=label;button.setAttribute('aria-label',label);
}
updateShortcutButton();
const refreshDraftKey='vanocni-dilna-refresh-draft-v1';
const refreshStatus=document.createElement('output');refreshStatus.className='work-refresh-status';refreshStatus.hidden=true;refreshStatus.setAttribute('role','status');document.body.append(refreshStatus);
let pull=null,refreshing=false;
function performWorkshopRefresh(){
 if(refreshing)return;
 if(workshopUpdateDownloading){refreshStatus.textContent='Počkej na dokončení stahování.';setTimeout(()=>{refreshStatus.hidden=true;},2800);return;}
 if(!$('object-mode').hidden)return;
 try{
  sessionStorage.setItem(refreshDraftKey,JSON.stringify({project:snapshotProject(),name:projectFileStem,named:projectHasName,zoom:sceneZoom,viewX,viewY,selected}));
 }catch{
  refreshStatus.hidden=false;refreshStatus.textContent='Návrh se nepodařilo zachovat. Ulož projekt a zkus to znovu.';
  setTimeout(()=>{refreshStatus.hidden=true;},3000);return;
 }
 refreshing=true;refreshStatus.hidden=false;refreshStatus.textContent='Obnovuji dílnu…';
 if(parent!==window&&parent.history.state?.arcadeCore){
  const state=parent.history.state;
  parent.history.replaceState({...state,dialog:null},'');
  parent.location.reload();
 }else location.reload();
}
function pullSurface(target,y){
 if(target.closest('button,input,select,textarea,summary,a,.work-guide'))return false;
 const dialog=target.closest('dialog');
 if(dialog&&dialog!==settings)return false;
 if(dialog===settings){
  const scroller=target.closest('section,nav');
  return !scroller||scroller.scrollTop<=1;
 }
 if(document.querySelector('dialog[open]')||$('scene-mode').hidden)return false;
 const bounds=sceneScroll.getBoundingClientRect();
 return y<=bounds.top+48&&!target.closest('.composition-stage');
}
document.addEventListener('touchstart',event=>{
 if(event.touches.length!==1||refreshing){pull=null;refreshStatus.hidden=true;return;}
 const touch=event.touches[0];
 if(pullSurface(event.target,touch.clientY))pull={x:touch.clientX,y:touch.clientY,distance:0};
},{passive:true});
document.addEventListener('touchmove',event=>{
 if(!pull||event.touches.length!==1)return;
 const touch=event.touches[0],dy=touch.clientY-pull.y,dx=touch.clientX-pull.x;
 if(dy<-8||Math.abs(dx)>Math.max(22,dy*.65)){pull=null;refreshStatus.hidden=true;return;}
 if(dy<16)return;
 if(event.cancelable)event.preventDefault();
 pull.distance=dy;refreshStatus.hidden=false;
 refreshStatus.textContent=dy>=84?'Uvolni pro obnovení':'Táhni dolů pro obnovení';
},{passive:false});
document.addEventListener('touchend',()=>{
 if(pull?.distance>=84)performWorkshopRefresh();else refreshStatus.hidden=true;
 pull=null;
});
document.addEventListener('touchcancel',()=>{pull=null;refreshStatus.hidden=true;},{passive:true});
window.ArcadeHost.register({start(){
 reset();
 try{
  const stored=sessionStorage.getItem(refreshDraftKey);
  if(stored){
   sessionStorage.removeItem(refreshDraftKey);
   const draft=JSON.parse(stored);
   openProject(readProject(JSON.stringify(draft.project)));
   projectFileStem=draft.name;projectHasName=draft.named??draft.name!==defaultProjectFileStem;
   selected=draft.selected;
   sceneZoom=draft.zoom;viewX=draft.viewX;viewY=draft.viewY;layoutView();refresh();
  }
 }catch(error){console.warn('Obnovení návrhu se nezdařilo.',error);}
 refreshWorkDimensions();
}});

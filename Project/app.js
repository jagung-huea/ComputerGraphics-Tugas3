(function previewControls() {
 const buttons=(selector)=>[...document.querySelectorAll(selector)];
 const byId=(id)=>document.getElementById(id);
 for (const key of ['view','object','axis','time']) {
  const group=buttons('button[data-'+key+']');
  for (const button of group) button.addEventListener('click',()=>{
   for (const item of group) item.setAttribute('aria-pressed',String(item===button));
   if (key==='object') byId('object-name').textContent=button.textContent;
   if (key==='view') byId('view-name').textContent=button.textContent;
  });
 }
 for (const tab of buttons('[role="tab"]')) tab.addEventListener('click',()=>{
  for (const item of buttons('[role="tab"]')) {
   item.setAttribute('aria-selected',String(item===tab));
   item.tabIndex=item===tab?0:-1;
   byId(item.getAttribute('aria-controls')).hidden=item!==tab;
  }
 });
 for (const input of buttons('input[type="range"]')) {
  const display=()=>{byId(input.id+'-value').value=input.value;};
  input.addEventListener('input',display);
  display();
 }
 byId('open-guide').addEventListener('click',()=>byId('guide-dialog').showModal());
})();
(function drawBlockout() {
 const viewport=document.getElementById('viewport');
 const message=document.getElementById('scene-message');
 try {
  const renderer=new THREE.WebGLRenderer({antialias:true});
  viewport.prepend(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xdce4da);
  createWorld(scene);
  const main=new THREE.DirectionalLight(0xffefd8,2.4);
  main.position.set(-7,11,6);
  scene.add(main,new THREE.HemisphereLight(0xffffff,0x697446,1.42));
  const camera=new THREE.PerspectiveCamera(44,1,.1,125);
  camera.position.set(6.4,6.05,12.65);
  camera.lookAt(0,1.63,-.7);
  const resize=()=>{
   const {clientWidth:width,clientHeight:height}=viewport;
   camera.aspect=width/Math.max(1,height);
   camera.updateProjectionMatrix();
   renderer.setSize(width,height,false);
   renderer.render(scene,camera);
  };
  new ResizeObserver(resize).observe(viewport);
  resize();
  viewport.setAttribute('aria-busy','false');
  message.hidden=true;
 } catch (error) {
  viewport.setAttribute('aria-busy','false');
  message.textContent='WebGL 2 diperlukan untuk membuka adegan.';
  console.error(error);
 }
})();

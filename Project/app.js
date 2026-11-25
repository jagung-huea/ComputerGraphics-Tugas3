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

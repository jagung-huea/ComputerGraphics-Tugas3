const THREE = window.Atlas3D;

function createWorld(scene) {
 const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true});
 const pieces=[
  ['gate','Gerbang Batu',new THREE.BoxGeometry(2.3,3.2,.8),[-.55,1.65,-3.55],0x718476,3.35],
  ['ocarina','Ocarina Biru',new THREE.BoxGeometry(1.4,1.3,1.4),[-.2,.74,.25],0x356ab1,1.65],
  ['chest','Peti Kayu',new THREE.BoxGeometry(1.7,1.05,1.05),[-3.45,.61,2.1],0x8e6849,1.23],
  ['lantern','Lentera Hutan',new THREE.CylinderGeometry(.26,.35,2.7,6),[3.62,1.44,-1.44],0xc78c41,2.9],
  ['photo','Bingkai Foto',new THREE.BoxGeometry(1.5,1.65,.35),[2.64,.91,2.54],0x9f8368,1.88],
 ];
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(6.36,6.55,.25,20),material(0x929e79));
 floor.position.set(0,-.13,-.7);
 floor.receiveShadow=true;
 scene.add(floor);
 const objects=new Map();
 for (const [id,name,geometry,position,color,height] of pieces) {
  const group=new THREE.Group();
  group.position.set(position[0],.09,position[2]);
  group.userData.artifactId=id;
  const mesh=new THREE.Mesh(geometry,material(color));
  mesh.position.y=position[1]-.09;
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  group.add(mesh);
  scene.add(group);
  objects.set(id,{name,group,markerHeight:height,position:group.position.clone(),rotation:group.rotation.clone()});
 }
 const ocarinaLight=new THREE.PointLight(0x70abff,2.3,4.1);
 ocarinaLight.position.set(-.2,1.82,.25);
 const lanternLight=new THREE.PointLight(0xffaa52,7,7);
 lanternLight.position.set(3.62,2.7,-1.44);
 scene.add(ocarinaLight,lanternLight);
 return {objects,ocarinaLight,lanternLight};
}

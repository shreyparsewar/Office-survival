import * as THREE from "three"
import { employees } from "./roster"
import { stations } from "./world"
import { officeBounds } from "./camera"
import { voxel, texture, surface, sign, batch, binders, papers, cup, plant, monitor, desk, chair, partition, printer, glass, bookshelf } from "./detailed-models"

/** One furnished interior, composed for a close game camera rather than a floor plan. */
export function officeModel() {
  const world = new THREE.Group()
  const wood = surface("wood"), carpet = surface("carpet"), fabric = surface("fabric")
  const roomWidth = officeBounds.right - officeBounds.left
  const roomDepth = officeBounds.front - officeBounds.back
  const middleX = (officeBounds.left + officeBounds.right) / 2
  const middleZ = (officeBounds.back + officeBounds.front) / 2
  voxel(world, carpet, middleX, -.05, middleZ, roomWidth, .1, roomDepth).castShadow=false
  // A complete room replaces the two-sided set and the empty exterior floor.
  for (const z of [officeBounds.back, officeBounds.front]) {
    voxel(world,"#d7c6a8",middleX,officeBounds.height / 2,z,roomWidth,officeBounds.height,.15).castShadow=false
    voxel(world,"#ece2c6",middleX,.12,z + (z === officeBounds.back ? .1 : -.1),roomWidth,.2,.08)
    voxel(world,"#eee4ca",middleX,officeBounds.height - .12,z,roomWidth,.16,.24).castShadow=false
  }
  for (const x of [officeBounds.left, officeBounds.right]) {
    voxel(world,"#c5b494",x,officeBounds.height / 2,middleZ,.15,officeBounds.height,roomDepth).castShadow=false
    voxel(world,"#ece2c6",x + (x === officeBounds.left ? .1 : -.1),.12,middleZ,.08,.2,roomDepth)
    voxel(world,"#eee4ca",x,officeBounds.height - .12,middleZ,.24,.16,roomDepth).castShadow=false
  }
  voxel(world,"#e5ddc9",middleX,officeBounds.height + .035,middleZ,roomWidth,.07,roomDepth).castShadow=false
  const city=texture("interior-city",ctx=>{
    const sky=ctx.createLinearGradient(0,0,0,256);sky.addColorStop(0,"#bbd3d5");sky.addColorStop(1,"#ead9b8");ctx.fillStyle=sky;ctx.fillRect(0,0,256,256)
    for(let i=0;i<13;i++){const h=35+(i*37)%65;ctx.fillStyle=i%2?"#9eaaa8":"#b6bbb0";ctx.fillRect(i*22,256-h,17,h);ctx.fillStyle="#d9cbb0";for(let y=256-h+8;y<256;y+=12)ctx.fillRect(i*22+5,y,3,4)}
  })
  const view=new THREE.MeshStandardMaterial({map:city,emissive:"#e8d2a3",emissiveIntensity:.7})
  function windowAt(x:number,z:number,side=false,reverse=false){
    const win=new THREE.Group();win.position.set(x,0,z);win.rotation.y=(side ? Math.PI/2 : 0)+(reverse ? Math.PI : 0);world.add(win)
    voxel(win,"#8b7251",0,2.42,0,2.65,3.14,.075).castShadow=false
    voxel(win,view,0,2.42,.04,2.5,2.99,.035).castShadow=false
    for(const xx of [-1.28,0,1.28])voxel(win,"#f5ead1",xx,2.42,.08,.055,3.04,.045)
    for(let i=0;i<19;i++){const blind=voxel(win,"#eddcbd",0,3.87-i*.155,.14,2.51,.028,.13);blind.rotation.x=.35}
    for(const xx of [-1.04,1.04])voxel(win,"#bfae89",xx,2.4,.17,.016,2.97,.018)
    voxel(win,"#e6d7b9",0,.86,.14,2.77,.08,.38)
  }
  for(const x of [1.9,4.65,7.4,10.15,12.9,15.65])windowAt(x,.45)
  for(const z of [2.05,4.8,7.55,10.3,13.05])windowAt(.47,z,true)
  for(const x of [2,4.75,7.5])windowAt(x,officeBounds.front - .12,false,true)
  for(const z of [9.8,12.55])windowAt(officeBounds.right - .12,z,true,true)
  // Overhead fixtures give every camera angle a finished interior backdrop.
  for(const x of [3.5,8.5,13.5])for(const z of [4,9,13]){
    voxel(world,"#a4a69b",x,officeBounds.height - .12,z,1.75,.06,.68).castShadow=false
    const diffuser=new THREE.MeshStandardMaterial({color:"#fff4d6",emissive:"#fff0c7",emissiveIntensity:.55,roughness:1})
    voxel(world,diffuser,x,officeBounds.height - .16,z,1.62,.035,.55).castShadow=false
  }
  for(const x of [1.1,3.8,6.8,12.3]){const p=plant(world,x,.86,.47);p.position.y=.87}
  for(const z of [2.6,5.5,8.5]){const p=plant(world,.9,z,.5);p.position.y=.87}

  // Manager's room is behind the action, with an open glass doorway.
  const glazing=new THREE.MeshStandardMaterial({color:"#96b4b1",transparent:true,opacity:.075,roughness:.15,depthWrite:false})
  glass(world,8.05,2.9,.065,5.15,glazing)
  glass(world,9.1,5.4,2.03,.065,glazing)
  glass(world,12.25,5.4,2.8,.065,glazing)
  glass(world,13.65,2.9,.065,5.15,glazing)
  sign(world,"MANAGER",12.15,2.75,5.46,1.1,.26)
  desk(world,10.4,2.15,wood);chair(world,10.4,2.95,fabric)
  bookshelf(world,12.75,.84,wood)
  plant(world,12.9,4.8,.96)
  const lamp=voxel(world,"#f3d79a",11.5,1.3,2.1,.35,.28,.35)
  voxel(world,"#6d5e46",11.5,1.03,2.1,.045,.42,.045)
  const warm=new THREE.PointLight("#ffd993",3,4);warm.position.copy(lamp.position);world.add(warm)
  voxel(world,"#584834",12.3,1.7,1.5,.055,3.4,.055)
  voxel(world,"#343b3d",12.3,2.22,1.58,.38,1.1,.24)
  for(let i=0;i<3;i++){const hook=voxel(world,"#765b38",12.3,3.1-i*.15,1.5,.55,.045,.045);hook.rotation.y=i*Math.PI/3}

  // Spacious work areas leave the central aisle and characters readable.
  for(const e of employees){
    if(["michael","pam","jim"].includes(e.id))continue
    desk(world,e.home[0],e.home[1]-.8,wood)
    chair(world,e.home[0],e.home[1]+.24,fabric)
  }
  desk(world,3,5.75,wood);chair(world,3,6.5,fabric)
  for(const [x,z,w,d] of [[5.5,6.7,4.95,.1],[5.85,7.48,.1,1.55],[9.1,7.5,.1,1.65],[9.1,10.7,8.1,.1],[2,10.75,.1,2]])partition(world,x,z,w,d)
  printer(world,5.25,8.8)
  plant(world,5.6,6.4,.55)
  plant(world,8.55,5.85,.8)
  plant(world,12.8,8.25,1.16)
  plant(world,2,5.5,.9)

  // Reception stays on the right, as in the reference image.
  desk(world,14,6.25,wood);chair(world,14,7.1,fabric)
  const reception=new THREE.Group();reception.position.set(14,0,8.0);world.add(reception)
  voxel(reception,wood,0,1.0,0,3.05,.15,1.15)
  voxel(reception,"#c7b18b",0,.47,.52,2.96,.96,.1)
  voxel(reception,"#a88a62",0,.47,.58,2.98,.075,.02)
  sign(reception,"RECEPTION",0,.78,.595,1.32,.25)
  monitor(reception,-.82,1.08,-.02);papers(reception,.55,1.1,.02);binders(reception,1,1.28,-.23);cup(reception,-1.25,1.08,.2)
  voxel(reception,"#31414a",.15,1.15,0,.34,.12,.22)
  voxel(reception,"#202f39",.15,1.25,0,.44,.085,.095)
  for(let i=0;i<6;i++)voxel(reception,"#d1d2bd",.04+(i%3)*.055,1.216,-.04+Math.floor(i/3)*.055,.025,.015,.025)
  plant(world,15.8,7.65,.9)
  voxel(world,"#899387",16.25,.83,5.8,.82,1.66,.55)
  for(let i=0;i<4;i++){voxel(world,"#bfc0ab",16.25,.25+i*.38,6.09,.73,.29,.035);voxel(world,"#4b5a51",16.25,.31+i*.38,6.12,.21,.035,.024)}

  // Coffee corner, whiteboard and a meeting table add depth behind the main desks.
  voxel(world,"#b4a180",6.2,.54,1.5,2.1,1.08,.64);voxel(world,wood,6.2,1.1,1.5,2.2,.085,.72)
  voxel(world,"#232f34",6.7,1.39,1.5,.47,.55,.45);voxel(world,"#454d48",6.7,1.4,1.745,.3,.3,.028)
  cup(world,6.7,1.13,1.83);cup(world,5.95,1.15,1.5)
  for(let i=0;i<9;i++)voxel(world,"#eee0c2",5.8,1.18+i*.035,1.4,.2,.035,.2)
  const board=new THREE.Group();board.position.set(5.6,0,3.8);world.add(board)
  voxel(board,"#7c7d6f",0,2.12,0,1.65,1.26,.08);voxel(board,"#e4e1d2",0,2.12,.06,1.5,1.1,.045)
  sign(board,"Q3 / BETTER PEOPLE",0,2.42,.086,1.38,.21,"#e5e2d3","#405b69")
  sign(board,"BETTER WORK / BRIGHTER 2000",0,2.18,.086,1.4,.15,"#e5e2d3","#405b69")
  for(let i=0;i<4;i++)voxel(board,"#6b7e82",.16+i*.12,1.86+i*.055,.09,.07,.12+i*.11,.016)
  for(const x of [-.58,.58])voxel(board,"#656e68",x,1.09,0,.04,2.18,.04)
  voxel(world,wood,2.6,.79,2.4,2.6,.14,1.35);chair(world,1.5,3.1,fabric);chair(world,2.8,3.1,fabric);papers(world,2.8,.9,2.5)
  const cork=voxel(world,"#b49565",15.65,2.45,.52,1.9,1.25,.08)
  sign(world,"A HAPPIER OFFICE",15.65,2.78,.57,1.75,.26,"#b49565","#233744")
  sign(world,"A BRIGHTER TOMORROW",15.65,2.45,.57,1.75,.19,"#b49565","#233744")
  for(let i=0;i<3;i++)voxel(world,"#eee7d1",15.06+i*.38,2.06,.58,.27,.29,.012)
  void cork
  voxel(world,"#d1ccba",16.15,1.1,2.15,.82,2.2,.79)
  voxel(world,"#676f64",15.715,1.45,2.15,.035,.3,.065)
  // The foreground continues beyond the camera; there are no exposed floor-plan edges.
  desk(world,4,12.5,wood);partition(world,4,13.22,4.2,.12);plant(world,2,12,.85)
  desk(world,10,13.2,wood);partition(world,10.1,14,4.3,.12)
  papers(world,9.45,1.1,13.3);binders(world,9,1.17,13.1)
  // Reception and storage complete the walls revealed by orbiting the camera.
  bookshelf(world,16.65,14.35,wood)
  bookshelf(world,12.4,14.45,wood)
  plant(world,16.8,8.65,.9)
  plant(world,1.15,14.45,.75)
  const entrance=new THREE.Group();entrance.position.set(officeBounds.right - .1,0,4.45);entrance.rotation.y=-Math.PI/2;world.add(entrance)
  voxel(entrance,"#4e493b",0,1.45,0,1.65,2.9,.08)
  voxel(entrance,wood,0,1.4,.065,1.45,2.8,.07)
  voxel(entrance,"#b3c6bd",0,1.97,.11,1.07,1.08,.025)
  voxel(entrance,"#d9c083",.53,1.1,.15,.05,.22,.045)
  sign(entrance,"DUNDER MIFFLIN",0,2.08,.13,.94,.17,"#b3c6bd","#233744")
  const notice=new THREE.Group();notice.position.set(officeBounds.right-.13,0,7);notice.rotation.y=-Math.PI/2;world.add(notice)
  voxel(notice,"#987341",0,2.15,0,1.6,1.12,.07)
  for(const x of [-.48,0,.48])voxel(notice,"#eee7d1",x,2.14,.06,.35,.72,.015)
  sign(world,"CLIENT ACCOUNTS / 1999",13.25,2.9,officeBounds.front-.13,2.25,.4,"#e9dfc4","#233744").rotation.y=Math.PI
  sign(world,"09:00",8.05,2.93,5.47,.39,.2,"#e8dfc7","#1b3240")

  world.updateMatrixWorld(true)
  const flat=new THREE.Group()
  world.traverse(o=>{if(o instanceof THREE.Mesh){const copy=o.clone();o.matrixWorld.decompose(copy.position,copy.quaternion,copy.scale);flat.add(copy)}else if(o instanceof THREE.Light){const copy=o.clone();o.getWorldPosition(copy.position);flat.add(copy)}})
  batch(flat)
  for(const station of stations){const target=new THREE.Mesh(new THREE.BoxGeometry(.95,1.7,.95),new THREE.MeshBasicMaterial({visible:false}));target.position.set(station.position[0],.95,station.position[1]);target.userData.station=station.id;flat.add(target)}
  return flat
}

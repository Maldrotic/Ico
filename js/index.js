
var MOVEMENT_SPEED = 10;
var SHOT_MOVEMENT_SPEED = 8;
var SHOT_PERCENT = 0.90;

var cannonShots = [];

var date = new Date();

var fieldOfView = 75,
    aspectRatio = window.innerWidth / window.innerHeight,
    nearClippingPane = 0.1,
    farClippingPane = 1000;

var GAME_STATE = {
  start : 0,
  running : 1
}

var moveState = {
  forward: 0,
  left: 0,
  right: 0,
  back: 0
}
var moveVector = new THREE.Vector3(0,0,0);


var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var clock = new THREE.Clock();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, nearClippingPane, farClippingPane );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.set( 0, 0, 25)
camera.lookAt(scene.position)



var icoGeometry = new THREE.IcosahedronGeometry( 1, 0 );
var icoMaterial = new THREE.MeshBasicMaterial( { color: 0x00000 } );
var icoMesh = new THREE.Mesh( icoGeometry, icoMaterial );
var icoEdges = new THREE.EdgesHelper( icoMesh, 0xFFFFFF );

scene.add( icoMesh );
scene.add( icoEdges );



var shipGeometry = new THREE.CylinderGeometry( 0.5, 0, 1, 3);
var shipMaterial = new THREE.MeshBasicMaterial( { color : 0x000000 } );
var shipMesh = new THREE.Mesh( shipGeometry, shipMaterial );
var shipEdges = new THREE.EdgesHelper( shipMesh, 0xFFFFFF );

scene.add( shipMesh );
scene.add( shipEdges );

shipMesh.translateY(-15);
shipMesh.rotation.set(0,0,Math.PI);

window.addEventListener( 'mousemove', onMouseMove, false);
window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);


function render() {
  requestAnimationFrame( render );

  var delta = clock.getDelta();

  icoMesh.rotation.x += 0.4 * delta;
  icoMesh.rotation.y += 0.4 * delta;

  // shipMesh.rotation.y += 0.4 * delta;


  updateShipPosition(delta);

  if (Math.random() > SHOT_PERCENT) {
    addShot();
  }

  moveShots(delta);

  // for (var i = 0; i < cannonShots.length; i++) {
  //   var cannonShotMesh = cannonShots[i].cannonMesh;
  //   for (var v = 0; v < cannonShotMesh.geometry.vertices.length; v++) {
  //     var localVertex = cannonShotMesh.geometry.vertices[v].clone();
  //     var globalVertex = cannonShotMesh.matrix.multiplyVector3(localVertex);
  //     var directionVector = globalVertex.subSelf(cannonShotMesh.position);

  //     var ray = new THREE.Ray(cannonShotMesh.position, directionVector.clone().normalize());
  //     var collisionResults = ray.intersectObjects( shipMesh );
  //     if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
  //       console.log('HIT');
  //     }
  //   }
  // }


  renderer.render( scene, camera );
}
render();

function addShot() {
  var vector = new THREE.Vector3();
  var cannonGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5);
  var cannonMaterial = new THREE.MeshBasicMaterial( {color: 0xFFFFFF } );
  var cannonMesh = new THREE.Mesh( cannonGeometry, cannonMaterial );

  var shot = {};
  shot.cannonMesh = cannonMesh;
  shot.vector = new THREE.Vector3((Math.random()*2)-1, (Math.random()*2)-1, 0).normalize();

  scene.add( cannonMesh );
  cannonShots.push(shot);
}

function moveShots(delta) {
  var moveMult = delta * SHOT_MOVEMENT_SPEED;
  for (var i = 0; i < cannonShots.length; i++) {
    var cannonShotMesh = cannonShots[i].cannonMesh;
    cannonShotMesh.applyMatrix(new THREE.Matrix4().makeTranslation(cannonShots[i].vector.x*moveMult, cannonShots[i].vector.y*moveMult, 0));
    cannonShotMesh.rotation.x += 0.3*moveMult;
    cannonShotMesh.rotation.y += 0.3*moveMult;
    cannonShotMesh.rotation.z += 0.3*moveMult;    
  }
}

function updateShipPosition(delta) {
  var moveMult = delta * MOVEMENT_SPEED;

  // shipMesh.translateOnAxis(shipMesh.localToWorld(new THREE.Vector3(1,0,0)).normalize(), );
  // shipMesh.translateOnAxis(shipMesh.localToWorld(new THREE.Vector3(0,1,0)).normalize(), );

  shipMesh.applyMatrix(new THREE.Matrix4().makeTranslation(moveVector.x*moveMult, -moveVector.y*moveMult, 0) );

  var mouseVec = new THREE.Vector3();
  mouseVec.set(mouse.x, mouse.y, 0);
  mouseVec.unproject(camera);

  var dir = mouseVec.sub(camera.position).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));

  var vec = new THREE.Vector2(mouseVec.x-shipMesh.position.x, mouseVec.y-shipMesh.position.y);
  var yAxis = new THREE.Vector2(0,1);

  var angleInRads = Math.atan2(yAxis.y, yAxis.x) - Math.atan2(vec.y, vec.x);

  shipMesh.rotation.z = -angleInRads-Math.PI; 
}

function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function keydown(e) {
  var key = e.keyCode ? e.keyCode : e.which;

  switch (key) {
    case 87: // W
      moveState.forward = 1;
      break;
    case 83: // S
      moveState.back = 1;
      break;
    case 65: // A
      moveState.left = 1;
      break;
    case 68:
      moveState.right = 1;
      break;
  }
  updateMovementVector();
}

function keyup(e) {
  var key = e.keyCode ? e.keyCode : e.which;

  switch (key) {
    case 87: // W
      moveState.forward = 0;
      break;
    case 83: // S
      moveState.back = 0;
      break;
    case 65: // A
      moveState.left = 0;
      break;
    case 68:
      moveState.right = 0;
      break;
  }
  updateMovementVector();
}

function updateMovementVector() {
  moveVector.x = (-moveState.left + moveState.right);
  moveVector.y = (-moveState.forward + moveState.back);
}
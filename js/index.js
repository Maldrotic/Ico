
var MOVEMENT_SPEED = 10;
var SHOT_MOVEMENT_SPEED = 8;
var SHOT_PERCENT = 0.90;

var cannonShots = [];

var date = new Date();

var timeText = document.getElementById("time");
var time;

var fieldOfView = 75,
    aspectRatio = window.innerWidth / window.innerHeight,
    nearClippingPane = 0.1,
    farClippingPane = 1000;

var GAME_STATE = {
  start : 0,
  running : 1,
  over: 2
}
var gameState = GAME_STATE.start;

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

shipMesh.translateY(-15);
shipMesh.rotation.set(0,0,Math.PI);

scene.add( shipMesh );
scene.add( shipEdges );

window.addEventListener( 'mousemove', onMouseMove, false);
window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);

var doRandomShots;
var randomTime;
var doCircleShots;
var circleToggleTime;
var circleTime;
var doWaveShots;
var waveTime;
var waveStartAngle;


function render() {
  requestAnimationFrame( render );

  var delta = clock.getDelta();

  icoMesh.rotation.x += 0.4 * delta;
  icoMesh.rotation.y += 0.4 * delta;

  if (gameState == GAME_STATE.start) {
    SHOT_PERCENT = 0;
    removeShots();
    time = 0.0;
    doRandomShots = false;
    randomTime = 0.0;
    doCircleShots = true;
    circleToggleTime = 0.0;
    circleTime = 0.0;
    doWaveShots = false;
    waveTime = 0.0;
    waveStartAngle = Math.random()*Math.PI*2;
    timeText.innerHTML = "Time: " + parseFloat(Math.round(time * 100) / 100).toFixed(2);
    shipMesh.position.set(0,-15,0);
    shipMesh.rotation.set(0,0,Math.PI);
  } else if (gameState == GAME_STATE.running) {

    console.log(SHOT_PERCENT)
    if (time > 20) {
      SHOT_PERCENT = 0.95;
    } else if (time > 15) {
      SHOT_PERCENT = 0.75;
    } else if (time > 11.0) {
      SHOT_PERCENT = 0.4;
    } else if (time > 6.0) {
      SHOT_PERCENT = 0.25;
    } else if (time > 3.0) {
      SHOT_PERCENT = 0.15;
    } else {
      SHOT_PERCENT = 0.1;
    }

    time += delta;
    timeText.innerHTML = "Time: " + parseFloat(Math.round(time * 100) / 100).toFixed(2);;

    updateShipPosition(delta);

    updateShots(delta);

    for (var i = 0; i < cannonShots.length; i++) {

      var cannonShotMesh = cannonShots[i].mesh;

      if (cannonShotMesh.visible) {
        var originPoint = cannonShotMesh.position.clone();
        for (var v = 0; v < cannonShotMesh.geometry.vertices.length; v++) {
          var localVertex = cannonShotMesh.geometry.vertices[v].clone();
          var globalVertex = localVertex.applyMatrix4(cannonShotMesh.matrix);
          var directionVector = globalVertex.sub(cannonShotMesh.position);

          var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
          var collisionArray = [];
          collisionArray.push(shipMesh);
          var collisionResults = ray.intersectObjects(collisionArray);

          if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            gameState = GAME_STATE.over;
          }
        }
      }
    }

  }
  renderer.render( scene, camera );
}
render();




var frustum = new THREE.Frustum();
var cameraViewProjectionMatrix = new THREE.Matrix4();
// every time the camera or objects change position (or every frame)

camera.updateMatrixWorld(); // make sure the camera matrix is updated
camera.matrixWorldInverse.getInverse( camera.matrixWorld );
cameraViewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
frustum.setFromMatrix( cameraViewProjectionMatrix );
function updateShots(delta) {

  randomTime += delta;
  circleToggleTime += delta;
  circleTime += delta;
  waveTime += delta;

  // Random shot
  if (randomTime > 5) {
    doRandomShots = !doRandomShots;
    randomTime = 0.0;
  }
  if (doRandomShots) {
    randomShot();
  }

  if (circleToggleTime-3 > 8) {
    doCircleShots = !doCircleShots;
    circleToggleTime = 0.0;
  }
  if (doCircleShots) {
    circleShot();
  }

  if (waveTime > 10) {
    doWaveShots = !doWaveShots;
    waveStartAngle = Math.random()*2;
    waveTime = 0.0;
  }
  if (doWaveShots) {
    waveShot(waveStartAngle, delta);
  }

  var moveMult = delta * SHOT_MOVEMENT_SPEED;
  for (var i = 0; i < cannonShots.length; i++) {
    if (!frustum.intersectsObject(cannonShots[i].mesh)) {
      scene.remove(cannonShots[i].mesh);
      scene.remove(cannonShots[i].edges);
      cannonShots.splice(i,1);
      i--;
    } else {
      var cannonShotMesh = cannonShots[i].mesh;
      cannonShotMesh.applyMatrix(new THREE.Matrix4().makeTranslation(cannonShots[i].vector.x*moveMult, cannonShots[i].vector.y*moveMult, 0));
      cannonShotMesh.rotation.x += 0.3*moveMult;
      cannonShotMesh.rotation.y += 0.3*moveMult;
      cannonShotMesh.rotation.z += 0.3*moveMult;
    }
  }
}

function randomShot() {
  if (Math.random()+0.2 < SHOT_PERCENT) {
    addShot((Math.random()*2)-1, (Math.random()*2)-1, 0);
  }
}

function circleShot(delta) {
  if (circleTime > 2-SHOT_PERCENT) {
    for (var i = 0; i < 50*SHOT_PERCENT; i++) {
      addShot((Math.random()*2)-1,(Math.random()*2)-1,0);
    }
    circleTime = 0.0;
  }
}

var waveVariation = 0.0;
var waveGoRight = true;
function waveShot(startAngle, delta) {

  if (waveVariation > 1) {
    waveGoRight = false;
  } else if (waveVariation < -1){
    waveGoRight = true;
  }

  if (waveGoRight) {
    waveVariation+=delta;
  } else {
    waveVariation-=delta;
  }

  var numOfWaves = 3;
  var waveSpacing = (Math.PI*2.0)/numOfWaves;

  // if (time%1 < 0.1) {
    for (var i = 0; i < numOfWaves; i++) {
      var angle = startAngle+waveVariation+(i*waveSpacing);
      var xDir = Math.cos(startAngle+waveVariation+(i*waveSpacing));
      var yDir = Math.sin(startAngle+waveVariation+(i*waveSpacing));

      addShot(xDir, yDir, 0);
    }
  // }
}

function switchShotType(type) {
  var currentIndex = ICO_SHOT_TYPE.indexOf(icoShotType);
  if (currentIndex+1 >= ICO_SHOT_TYPE.length) {
    icoShotType = ICO_SHOT_TYPE[0];
  } else {
    icoShotType = ICO_SHOT_TYPE[currentIndex+1];
  }
  console.log(icoShotType);
}

function addShot(xDir, yDir, zDir) {
  var vector = new THREE.Vector3();
  var cannonGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5);
  var cannonMaterial = new THREE.MeshBasicMaterial( {color: 0x000000 } );
  var cannonMesh = new THREE.Mesh( cannonGeometry, cannonMaterial );
  var cannonEdges = new THREE.EdgesHelper( cannonMesh, 0xFFFFFF)

  var shot = {};
  shot.mesh = cannonMesh;
  shot.edges = cannonEdges;
  shot.vector = new THREE.Vector3(xDir, yDir, zDir).normalize();

  scene.add( cannonMesh );
  scene.add( cannonEdges );
  cannonShots.push(shot);
}

function removeShots() {
  var arrayLength = cannonShots.length;
  for (var i = 0; i < arrayLength; i++) {
    if (scene.children.indexOf(cannonShots[i].mesh) !== -1) {
      scene.remove(cannonShots[i].mesh);
      scene.remove(cannonShots[i].edges);
    }
  }
  cannonShots = [];
}

function updateShipPosition(delta) {
  var moveMult = delta * MOVEMENT_SPEED;

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
    case 32: // Space
      if (gameState == GAME_STATE.start) {
        gameState = GAME_STATE.running;
      } else if (gameState == GAME_STATE.over) {
        gameState = GAME_STATE.start;
      }
      break;
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

var fieldOfView = 75,
    aspectRatio = window.innerWidth / window.innerHeight,
    nearClippingPane = 0.1,
    farClippingPane = 1000;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, nearClippingPane, farClippingPane );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function render() {
  requestAnimationFrame( render );
  
  cube.rotation.x += 0.1;
  cube.rotation.y += 0.1;

  renderer.render( scene, camera );
}
render();
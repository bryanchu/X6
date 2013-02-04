//Bryan Chu | XWing Fighter Simulation
(navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && alert("Please use Chrome for optimal WebGL.");

window['requestAnimFrame'] = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

X6 = {};
//SINGLETONS
X6.GlobalControl = function() {
    var renderer, camera,
        COLORENUM = {Red: 0xFF0000,
                    RedHighlight: 0xFF5252,
                    Orange: 0xFF8600,
                    Blue: 0x1F7CFF,
                    BlueHighlight: 0x6EAAFF,
                    Brown: 0x8B2500,
                    Gold: 0xFFB90F,
                    Pink: 0xFF52CB,
                    Black: 0x000000,
                    White: 0xFFFFFF,
                    Yellow: 0xFAFF6B,
                    Green: 0x00DE1A};
    var self = {};
    self.initScene = function() {
        // PB.AudioManager.sounds.themeSound.addEventListener('ended', function() {
        //     this.currentTime = 0;
        //     this.themeSound.play();
        // }, false);
        // PB.AudioManager.play("themeSound");
        
        // Renderer
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById( 'container' ).appendChild( renderer.domElement );
        
        // Scene
        self.scene = new THREE.Scene();

        //the XWing
        // self.xwing =  new PB.Pinball();

        //Make critical AJAX calls early
        
        // var loader = new THREE.JSONLoader();
        // waitingAJAXCalls = 2;
        // storeMesh({color: COLORENUM.White, useQuat: true}, "flipperLeft.js", "leftWiper");
        // storeMesh({color: COLORENUM.White, useQuat: true}, "flipperRight.js", "rightWiper");

        //Load the meshes.
        var baseURL = "meshes/";
        var loader = new THREE.JSONLoader();
        loader.load(baseURL + "xwing.js", createBlender);

        // Light
        light = new THREE.DirectionalLight( 0xFFFFFF );
        light.position.set( 0, 700, 220 );
        light.target.position.copy( self.scene.position );
        light.castShadow = true;
        light.shadowCameraLeft = -25;
        light.shadowCameraTop = -25;
        light.shadowCameraRight = 25;
        light.shadowCameraBottom = 25;
        light.shadowBias = -.0001;
        self.scene.add( light );
        
        // Camera
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            1,
            5000000
        );
        camera.position.set( 0, 800, 300 );
        camera.lookAt( self.scene.position );
        self.scene.add( camera );

        //trackball controls
        controls = new THREE.TrackballControls(camera, container);
        controls.dynamicDampingFactor = 0.1;
        controls.staticMoving = true;
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.keys = [65, 83, 68];

        function loadMesh(config, url) {
            return loader.load(config, baseURL + url, createBlender);
        }

        // function storeMesh(config, url, name) {
        //     loader.load(config, baseURL + url, function(geometry, config) {
        //         waitingAJAXCalls -= 1;
        //         animMeshes[name] = createBlender(geometry, config);
        //         initAnim();
        //     });
        // }

        function createBlender(geometry, config) {
            geometry.mergeVertices();
            var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
            var material = new Meshtype({specular: 0x888888, color: config.color});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
            var mesh = new THREE.Mesh( geometry, material );
            mesh.useQuaternion = true;//config.useQuat;
            mesh.scale.set(50, 50, 50);
            X6.GlobalControl.scene.add(mesh);
            return mesh;
        }
        //skybox
        var urls = [
          'img/space_right1.png',
          'img/space_left2.png',
          'img/space_top3.png',
          'img/space_bottom4.png',
          'img/space_front5.png',
          'img/space_back6.png'
        ],
        textureCube = THREE.ImageUtils.loadTextureCube(urls);
        var shader = THREE.ShaderLib["cube"];
        shader.uniforms["tCube"].value = textureCube;
        var material = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            side: THREE.BackSide,
        });
        var skybox = new THREE.Mesh( new THREE.CubeGeometry( 51200, 51200, 51200 ), material );
        self.scene.add(skybox);

        // initControls();

        requestAnimFrame(main);
    };

    function render() {
        renderer.render(self.scene, camera);
    };

    function main() {
        updatePhysics();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };

    function updatePhysics() {
    };

    return self;
}();


 
window.onload = X6.GlobalControl.initScene;

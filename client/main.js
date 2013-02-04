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
        midX = window.innerWidth / 2, midY = window.innerHeight / 2,
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
    self.waitingAJAXCalls = 0,
    self.initScene = function() {
        X6.Navigation.altBar = document.getElementById('altBar');
        X6.Navigation.altHeight = parseInt(getComputedStyle(document.getElementById('altitude')).getPropertyValue('height').replace('px', ''));
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
        self.xWing = new X6.XWing();
        loadAndTrack("xwing.js", function(geometry) {self.xWing.addPiece(geometry, "defaultGrey");});

        function loadAndTrack(url, func) {
            self.waitingAJAXCalls++;
            loader.load(baseURL + url, func);
        };

        // Lights
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
        self.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            1,
            5000000
        );
        var camY = 1,
            camZ = -4;
        self.camera.position.set( 0, camY, camZ );
        // self.camera.lookAt( self.scene.position );
        // self.scene.add( self.camera );

        //trackball controls
        controls = new THREE.TrackballControls(self.camera, container);
        controls.dynamicDampingFactor = 0.1;
        controls.staticMoving = true;
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.keys = [65, 83, 68];

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
        var skybox = new THREE.Mesh( new THREE.CubeGeometry( 51200000, 51200000, 51200000 ), material );
        self.scene.add(skybox);

        initControls();

        (function checkAjaxFinish() {
            if (self.waitingAJAXCalls == 0) {
                self.xWing.pieces[0].add(self.camera);
                // self.scene.add(self.camera);
                requestAnimFrame(main);
            } else {
                setTimeout(checkAjaxFinish, 200);
            } 
        })();
        
    };
    var nextRotX = 0, nextRotY = 0;
    function initControls() {
        document.addEventListener('mousemove', function(event) {
            var x = event.layerX,
                y = event.layerY;
            nextRotX = .0001 * (x - midX);
            nextRotY = .0001 * (y - midY);
        });
    };

    function render() {
        renderer.render(self.scene, self.camera);
    };

    function main() {
        updateScene();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };

    function updateScene() {
        // self.camera.position.set(pos.x, pos.y, pos.z - 1400);
        // self.camera.lookAt(pos);
        // console.log(nextRotX);
        // console.log(nextRotY);
        self.xWing.rotatePieces(nextRotX, nextRotY, 0);
        var currRot = self.xWing.pieces[0].rotation,
            speed = self.xWing.normalSpeed;
        // self.xWing.movePieces(speed * Math.cos(currRot.x), speed * Math.sin(currRot.y), speed * Math.sin(currRot.x));
        //down/up, back/forth, left/right
        self.xWing.movePieces(speed * Math.sin(currRot.y), 
                              speed * -Math.sin(currRot.x),
                              speed * Math.cos(currRot.x));
        X6.Navigation.moveAltBar(self.xWing.pieces[0].rotation.y);
    };

    return self;
}();
X6.Navigation = function() {
    var self = {};
    self.moveAltBar = function(rot) {
        self.altBar.style.bottom = ((rot - (Math.PI / 2)) / -Math.PI) * parseInt(self.altHeight);
    };
    return self;
}();
//CLASSES
X6.StarShip = function() {
    this.pieces = [];
};
X6.StarShip.prototype.addPiece = function(geometry, material) {
    geometry.mergeVertices();
    // var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
    var material = new THREE.MeshPhongMaterial({specular: 0x888888, color: this.COLORMAP[material]});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
    var mesh = new THREE.Mesh( geometry, material );
    mesh.rotation.z = Math.PI / 2;
    mesh.rotation.x = Math.PI / 2;
    // mesh.useQuaternion = true;//config.useQuat;
    mesh.scale.set(500, 500, 500);
    X6.GlobalControl.scene.add(mesh);
    this.pieces.push(mesh);
    X6.GlobalControl.waitingAJAXCalls--;
};
X6.StarShip.prototype.movePieces = function(x, y, z) {
    for (var i = 0; i < this.pieces.length; i++) {
        var pos = this.pieces[i].position;
        pos.x += x;
        pos.y += y;
        pos.z += z;
    }
};
X6.StarShip.prototype.rotatePieces = function(x, y, z) {
    for (var i = 0; i < this.pieces.length; i++) {
        var rot = this.pieces[i].rotation;
        
        rot.x += x;
        ((rot.y < Math.PI / 2 || y < 0) && (rot.y > -Math.PI / 2 || y > 0)) && (rot.y += y);
        // rot.y += y;
        rot.z += z;
    }
};
X6.XWing = function() {
    self = new X6.StarShip();
    self.COLORMAP = {
        defaultGrey: 0xcccccc
    };
    self.normalSpeed = 5000;
    return self;
};
X6.XWing.prototype = X6.StarShip.prototype;


window.onload = X6.GlobalControl.initScene;

//Bryan Chu | XWing Fighter Simulation
//TODO refactor, modularize junk in globalcontrol
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
    var renderer, camera, container,
        NUMOFTIES = 10,
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
    self.sceneLimit = 40000000;
    self.ties = [];
    self.waitingAJAXCalls = 0;
    self.initScene = function() {
        X6.Navigation.altBar = document.getElementById('altBar');
        X6.Navigation.altHeight = parseInt(getComputedStyle(document.getElementById('altitude')).getPropertyValue('height').replace('px', ''));
        X6.Navigation.player = document.getElementsByClassName('player')[0];

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
        // renderer.setClearColor(new THREE.Color(0, 1));
        container = document.getElementById('container');
        container.appendChild( renderer.domElement );
        
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
        var tieGeo;
        self.xWing = new X6.XWing();
        loadAndTrack("xwing.js", function(geometry) {self.xWing.addPiece(geometry, "defaultGrey", 500);});
        loadAndTrack("tie.js", function(geometry) {
            tieGeo = geometry;
            for (var i = 0; i < NUMOFTIES; i++) {
                // var material = new THREE.MeshBasicMaterial({specular: 0x888888, color: 0x111111});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
                // var mesh = new THREE.Mesh( geometry, material );
                // mesh.rotation.z = Math.PI / 2;
                // mesh.rotation.x = Math.PI / 2;
                // // mesh.useQuaternion = true;//config.useQuat;
                // mesh.scale.set(500000, 500000, 500000);
                // mesh.position = new THREE.Vector3(0, 0, 0);
                // X6.GlobalControl.scene.add(mesh);

                var newTie = new X6.Tie();
                self.ties.push(newTie);
                newTie.addPiece(tieGeo, "defaultGrey", 50000);
                newTie.displacePieces(Math.random() * self.sceneLimit - (self.sceneLimit / 2), Math.random() * self.sceneLimit - (self.sceneLimit / 2), Math.random() * self.sceneLimit - (self.sceneLimit / 2));

                var minimapEl = document.createElement('div');
                minimapEl.className += "arrow tie";
                document.getElementById('minimap').appendChild(minimapEl);
                X6.Navigation.tieDots.push(minimapEl);
            }
        });

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
        // controls.dynamicDampingFactor = 0.1;
        // controls.staticMoving = true;
        controls.rotateSpeed = 0;
        // controls.zoomSpeed = 1.2;
        // controls.panSpeed = 0.8;
        // controls.noZoom = false;
        // controls.noPan = false;
        // controls.keys = [65, 83, 68];

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
        var skybox = new THREE.Mesh( new THREE.CubeGeometry( self.sceneLimit, self.sceneLimit, self.sceneLimit ), material );
        self.scene.add(skybox);

        initControls();

        (function checkAjaxFinish() {
            if (self.waitingAJAXCalls < 1) {
                self.xWing.pieces[0].add(self.camera);
                self.xWing.addLight(0xff0000);
                // self.scene.add(self.camera);
                requestAnimFrame(main);
            } else {
                setTimeout(checkAjaxFinish, 200);
            } 
        })();
        
    };
    var nextRotX = 0, nextRotY = 0;
    function initControls() {
        document.onmousemove = function(event) {
            var x = event.layerX,
                y = event.layerY;
            nextRotX = .00005 * (x - midX);
            nextRotY = .00005 * (y - midY);
        };
        container.onmousedown = function() {
            self.xWing.firing = true;
            (function fireLoop() {
                self.xWing.fire();
                self.xWing.firing && setTimeout(fireLoop, 50);
            })();
        };
        container.onmouseup = function() {
            self.xWing.firing = false;
        };
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
    var limit = (self.sceneLimit / 2);
    var buffer = 3000;
    function updateScene() {
        // self.camera.position.set(pos.x, pos.y, pos.z - 1400);
        // self.camera.lookAt(pos);
        // console.log(nextRotX);
        // console.log(nextRotY);
        self.xWing.rotatePieces(nextRotX, nextRotY, 0);
        // self.camera.rotation.x += 10 * nextRotX;
        var basePiece = self.xWing.pieces[0],
            currRot = basePiece.rotation,
            currPos = basePiece.position,
            speed = X6.XWing.normalSpeed,
            tSpeed = X6.Tie.normalSpeed;
        // self.xWing.movePieces(speed * Math.cos(currRot.x), speed * Math.sin(currRot.y), speed * Math.sin(currRot.x));
        //down/up, back/forth, left/right
        var xMove = speed * Math.sin(currRot.y), 
            yMove = speed * -Math.sin(currRot.x),
            zMove = speed * Math.cos(currRot.x);
        ((currPos.x + xMove < limit && currPos.x + xMove > -limit) &&
        (currPos.y + yMove < limit && currPos.y + yMove > -limit) &&
        (currPos.z + zMove < limit && currPos.z + zMove > -limit)) &&
            self.xWing.movePieces(speed * Math.sin(currRot.y), //z
                                  speed * -Math.sin(currRot.x),//x
                                  speed * Math.cos(currRot.x));//y
        for (var i = 0; i < self.ties.length; i++) {
            var tRot = self.ties[i].pieces[0].rotation;
            var tPos = self.ties[i].pieces[0].position;
            if (tPos.x < currPos.x && tRot.y < Math.PI / 2) {
                tRot.y += .01;
            } else if (tPos.x > currPos.x && tRot.y > -Math.PI / 2){
                tRot.y -= .01;
            }
            var angle = Math.atan2(currPos.z - tPos.z, tPos.y - currPos.y);
            currPos.z - tPos.z < 0 && (angle += 2 * Math.PI);
            var tRotAdj = (3 * Math.PI / 2) - tRot.x;
            if ((angle < Math.PI && tRotAdj > angle && tRotAdj < angle + Math.PI) || 
                (angle >= Math.PI && (tRotAdj > angle || tRotAdj < angle - Math.PI))) {
                tRot.x -= .01;
                if (tRotAdj > 2 * Math.PI) {
                    tRot.x += 2 * Math.PI;
                }
            } else {
                tRot.x += .005;
                if (tRotAdj < 0) {
                    tRot.x -= 2 * Math.PI;
                }
            }
            self.ties[i].movePieces(tSpeed * Math.sin(tRot.y),
                                    tSpeed * -Math.sin(tRot.x),
                                    tSpeed * Math.cos(tRot.x));
        }
        X6.Navigation.moveAltBar(self.xWing.pieces[0].rotation.y);
        X6.Navigation.moveShips();
        // ((currPos.x > limit || currPos.x < -limit) ||
        // (currPos.y > limit || currPos.y < -limit) ||
        // (currPos.z > limit || currPos.z < -limit)) && self.xWing.displacePieces(0, 0, 0);
        self.xWing.moveLasers(5);
        // self.ties[0].pieces[0].position = self.xWing.pieces[0].position;
    };
    function greaterAngle(x, y) {

    };

    return self;
}();
X6.Navigation = function() {
    var self = {};
    self.tieDots = [];
    self.moveAltBar = function(rot) {
        self.altBar.style.bottom = ((rot - (Math.PI / 2)) / -Math.PI) * parseInt(self.altHeight);
    };
    self.moveShips = function() {
        self.player.style.top = 100 + ((X6.GlobalControl.xWing.pieces[0].position.z / (X6.GlobalControl.sceneLimit / 2)) * 100);
        self.player.style.left = 100 + ((X6.GlobalControl.xWing.pieces[0].position.y / (X6.GlobalControl.sceneLimit / 2)) * 100);
        for (var i = 0; i < self.tieDots.length; i++) {
            self.tieDots[i].style.top = 100 + ((X6.GlobalControl.ties[i].pieces[0].position.z / (X6.GlobalControl.sceneLimit / 2)) * 100);
            self.tieDots[i].style.left = 100 + ((X6.GlobalControl.ties[i].pieces[0].position.y / (X6.GlobalControl.sceneLimit / 2)) * 100);
        }
    }
    return self;
}();
//CLASSES
X6.Missile = function() {
    //do this later
};
X6.StarShip = function() {
    this.pieces = [];
    this.firing = false;
    this.activeLasers = [];
    self.activeGun = 0;
    this.COLORMAP = {
        defaultGrey: 0xcccccc
    };
};
X6.StarShip.prototype.addPiece = function(geometry, material, scale) {
    geometry.mergeVertices();
    // var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
    var material = new THREE.MeshPhongMaterial({specular: 0x888888, color: this.COLORMAP[material]});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
    var mesh = new THREE.Mesh( geometry, material );
    mesh.rotation.z = Math.PI / 2;
    mesh.rotation.x = Math.PI / 2;
    // mesh.useQuaternion = true;//config.useQuat;
    mesh.scale.set(scale, scale, scale);
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
X6.StarShip.prototype.displacePieces = function(x, y, z) {
    for (var i = 0; i < this.pieces.length; i++) {
        this.pieces[i].position = new THREE.Vector3(x, y, z);
    }
};
X6.StarShip.prototype.moveLasers = function(speed) {
    for (var i = 0; i < this.activeLasers.length; i++) {
        var pos = this.activeLasers[i].position;
        pos.z += speed;
    }
};
X6.StarShip.prototype.addLight = function(color) {
    this.pieces[0].add(new THREE.PointLight(color, 19.0, 100));
};
X6.StarShip.prototype.fire = function() {
    // var particles = new THREE.Geometry();
    // var material = new THREE.ParticleBasicMaterial({
    //     color: 0xffffff,
    //     size: 200,
    //     map: THREE.ImageUtils.loadTexture("img/particle.png"),
    //     blending: THREE.AdditiveBlending,
    //     transparent: true
    // });
    // for(var p = 0; p < 100; p++) {
    
    //     // create a particle with random
    //     // position values, -250 -> 250
    //     var pX = Math.random() * 1 ,
    //         pY = Math.random() * 1 ,
    //         pZ = Math.random() * 1 ,
    //         particle = new THREE.Vector3(
    //             new THREE.Vector3(pX, pY, pZ)
    //         );
    //     // create a velocity vector
    //     particle.velocity = new THREE.Vector3(
    //         0,              // x
    //         -Math.random(), // y
    //         0);             // z

    //     // add it to the geometry
    //     particles.vertices.push(particle);
    // }
    // var particleSystem = new THREE.ParticleSystem(particles, material);
    // this.pieces[0].add(particleSystem);
    // X6.GlobalControl.scene.add(particleSystem);
    var geometry = new THREE.CubeGeometry(.1, 3, .1, 10, 10, 10);
    var material = new THREE.MeshBasicMaterial({color: 0xff0000});
    var mesh = new THREE.Mesh(geometry, material);
    var xStart = 1.4,
        yStart = .5,
        zStart = -1.5;
    switch (this.activeGun) {
        case 0:
            mesh.position = new THREE.Vector3(xStart, yStart, zStart);
            break;
        case 1:
            mesh.position = new THREE.Vector3(-xStart, -yStart, zStart);
            break;
        case 2:
            mesh.position = new THREE.Vector3(xStart, -yStart, zStart);
            break;
        case 3:
            mesh.position = new THREE.Vector3(-xStart, yStart, zStart);
            break;
        default:
            console.warn("Broken switch!");
    }
    mesh.rotation.x = Math.PI / 2;
    this.pieces[0].add(mesh);
    this.activeLasers.push(mesh);
    if (this.activeLasers.length > 10) {
        this.pieces[0].remove(this.activeLasers.splice(0, 1)[0]);
    } 
    this.activeGun += (this.activeGun == 3 ? -3 : 1);
};
X6.XWing = function() {
    self = new X6.StarShip();
    return self;
};
X6.XWing.normalSpeed = 7000;
X6.XWing.prototype = X6.StarShip.prototype;
X6.Tie = function() {
    self = new X6.StarShip();
    return self;
};
X6.Tie.normalSpeed = 15000;
X6.Tie.prototype = X6.StarShip.prototype;

window.onload = X6.GlobalControl.initScene;

//Bryan Chu | XWing Fighter Simulation
//TODO refactor, modularize junk in globalcontrol
if (navigator.userAgent.toLowerCase().indexOf('chrome') < 0) {
    alert("This experiment was built to run in Chrome.");
    document.body.innerHTML = "";
}

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
    self.sceneLimit = 400000;
    self.ties = [];
    self.waitingAJAXCalls = 0;
    self.activeExplosions = [];
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
                newTie.addPiece(tieGeo, "defaultGrey", 500);
                newTie.displacePieces(Math.random() * self.sceneLimit - (self.sceneLimit / 2), Math.random() * self.sceneLimit - (self.sceneLimit / 2), Math.random() * self.sceneLimit - (self.sceneLimit / 2));
                // newTie.displacePieces(0, -100000, 0);
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
        // controls.noZoom = true;
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
                self.xWing.getBase().add(self.camera);
                self.xWing.addLight(0xff0000);
                // self.xWing.thrust();
                // self.scene.add(self.camera);
                var playButton = document.getElementById('play');
                playButton.innerHTML = "Play";
                playButton.style["border-color"] = "white";
                playButton.style.color = "white";
                var splashPage = document.getElementById('splash');
                splashPage.addEventListener('click', function() {
                    splashPage.parentNode.removeChild(splashPage);
                    window.requestAnimFrame(main);
                });
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
                self.xWing.fire(0xff0000, 100);
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
        controls.update();
        updateScene();
        render();
        window.requestAnimFrame(main);
    };
    var limit = (self.sceneLimit / 2);
    var buffer = 3000;
    function updateScene() {
        var xWing = self.xWing;
        xWing.rotatePieces(nextRotX, nextRotY, 0);
        var basePiece = xWing.getBase(),
            currRot = basePiece.rotation,
            currPos = basePiece.position,
            speed = X6.XWing.normalSpeed,
            tSpeed = X6.Tie.normalSpeed;
        //down/up, back/forth, left/right
        xWing.movePieces(speed * Math.sin(currRot.y), //z
                          speed * -Math.sin(currRot.x),//x
                          speed * Math.cos(currRot.x));//y
        self.camera.rotation.z = (nextRotX * 3) + Math.PI;
        self.camera.rotation.x = (nextRotY * 4) + 3.3;
        for (var i = 0; i < self.ties.length; i++) {
            var currentTie = self.ties[i];
            if (!currentTie) {
                continue;
            }
            var currentTieBase = currentTie.getBase();
            var tRot = currentTieBase.rotation;
            var tPos = currentTieBase.position;
            if (tPos.x < currPos.x && tRot.y < Math.PI / 2) {
                tRot.y += .0000005 * (currPos.x - tPos.x);
            } else if (tPos.x > currPos.x && tRot.y > -Math.PI / 2){
                tRot.y -= .0000005 * (tPos.x - currPos.x);
            }
            var angle = Math.atan2(currPos.z - tPos.z, tPos.y - currPos.y);
            currPos.z - tPos.z < 0 && (angle += 2 * Math.PI);
            var tRotAdj = (3 * Math.PI / 2) - tRot.x;
            if ((angle < Math.PI && tRotAdj > angle && tRotAdj < angle + Math.PI) || 
                (angle >= Math.PI && (tRotAdj > angle || tRotAdj < angle - Math.PI))) {
                tRot.x -= .01;//< .02
                if (tRotAdj > 2 * Math.PI) {
                    tRot.x += 2 * Math.PI;
                }
            } else {
                tRot.x += .01;
                if (tRotAdj < 0) {
                    tRot.x -= 2 * Math.PI;
                }
            }
            currentTie.movePieces(tSpeed * Math.sin(tRot.y),
                                tSpeed * -Math.sin(tRot.x),
                                tSpeed * Math.cos(tRot.x));
            if (currentTie.inDistance(self.xWing.getBase().position, tPos, 20000)) {
                if (currentTie.canFire) {
                    currentTie.canFire = false;
                    currentTie.fire(0x00ff00, 5);
                    (function(tieClosure) {
                        setTimeout(function() {
                            tieClosure.canFire = true;
                        }, 200);
                    })(currentTie);
                }
            }
            currentTie.moveLasers(10);
        }
        X6.Navigation.moveAltBar(self.xWing.getBase().rotation.y);
        X6.Navigation.moveShips();
        ((currPos.x > limit || currPos.x < -limit) ||
        (currPos.y > limit || currPos.y < -limit) ||
        (currPos.z > limit || currPos.z < -limit)) && self.xWing.displacePieces(0, 0, 0);
        xWing.moveLasers(5);
        for (var i = 0; i < self.activeExplosions.length; i++) {
            try {
                var vertices = self.activeExplosions[i].geometry.vertices;
                for (var j = 0; j < vertices.length; j++) {
                    vertices[j].x *= 1 + (Math.random() / 5);
                    vertices[j].y *= 1 + (Math.random() / 5);
                    vertices[j].z *= 1 + (Math.random() / 5);
                }
            }
            catch(e){}
        }
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
        self.player.style["-webkit-transform"] = "rotate(" + ((X6.GlobalControl.xWing.getBase().rotation.x * 360 / (2 * Math.PI)) + 180) + "deg)";
        self.player.style.top = 100 + ((X6.GlobalControl.xWing.getBase().position.z / (X6.GlobalControl.sceneLimit / 2)) * 100);
        self.player.style.left = 100 + ((X6.GlobalControl.xWing.getBase().position.y / (X6.GlobalControl.sceneLimit / 2)) * 100);
        for (var i in self.tieDots) {
            if (!self.tieDots[i]) {
                continue;
            }
            if (!X6.GlobalControl.ties[i]) {
                self.tieDots[i].style.visibility = 'hidden';
                self.tieDots[i] = null;
                continue;
            }
            self.tieDots[i].style.top = 100 + ((X6.GlobalControl.ties[i].getBase().position.z / (X6.GlobalControl.sceneLimit / 2)) * 100);
            self.tieDots[i].style.left = 100 + ((X6.GlobalControl.ties[i].getBase().position.y / (X6.GlobalControl.sceneLimit / 2)) * 100);
        }
    }
    return self;
}();
//CLASSES
X6.StarShip = function() {
    this.pieces = [];
    this.firing = false;
    this.activeLasers = [];
    this.activeGun = 0;
    this.COLORMAP = {
        defaultGrey: 0xcccccc
    };
};
X6.StarShip.prototype.getBase = function() {
    return this.pieces[0];
}
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
X6.StarShip.prototype.addLight = function(color) {
    this.getBase().add(new THREE.PointLight(color, 19.0, 2));
};
X6.StarShip.prototype.thrust = function(color) {
    this.thruster && this.getBase().remove(this.thruster);
    var geometry = new THREE.CylinderGeometry(1, 1, 5);
    var material = new THREE.MeshBasicMaterial({color: 0xff0000});
    this.thruster = new THREE.Mesh(geometry, material);
    this.getBase().add(this.thruster);
};
X6.StarShip.prototype.fire = function(color, cacheLimit) {
    var geometry = new THREE.CubeGeometry(.1, 3, .1, 10, 10, 10);
    var material = new THREE.MeshBasicMaterial({color: color});
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
    this.getBase().add(mesh);
    this.activeLasers.push(mesh);
    if (this.activeLasers.length > cacheLimit) {
        this.getBase().remove(this.activeLasers.splice(0, 1)[0]);
    } 
    this.activeGun += (this.activeGun == 3 ? -3 : 1);
};
X6.StarShip.prototype.inDistance = function(laserPos, tiePos, hitRadius) {
    // var hitRadius = 1000;//works
    var laserPos;
    // console.log(Math.abs(tiePos.x - laserPos.x));
    if (Math.abs(tiePos.x - laserPos.x) < hitRadius && Math.abs(tiePos.y - laserPos.y) < hitRadius && Math.abs(tiePos.z - laserPos.z) < hitRadius) {
        return true;
    }
    return false;
};
X6.XWing = function() {
    X6.StarShip.call(this);
};
X6.XWing.normalSpeed = 150;
X6.XWing.prototype = new X6.StarShip();
X6.XWing.prototype.moveLasers = function(speed) {
    var globalPos;
    for (var i = 0; i < this.activeLasers.length; i++) {
        var pos = this.activeLasers[i].position;
        // console.log(pos.z);
        // if (pos.z > 300000) {
        //     this.getBase().remove(this.activeLasers.splice(i, i + 1)[0]);
        //     continue;
        // } else {
            pos.z += speed;
        // }
        if (pos.x == 0 && pos.y == 0 && pos.z == 0) {
            continue;
        }
        globalLaserPos = new THREE.Vector3();
        globalLaserPos.applyMatrix4(this.activeLasers[i].matrixWorld);


        for (var tie = 0; tie < X6.GlobalControl.ties.length; tie++) {
            if (!X6.GlobalControl.ties[tie]) {
                continue;
            }
            // debugger;
            // console.log(globalLaserPos.x);
            // console.log(globalLaserPos.y);
            // console.log(globalLaserPos.z);
            // console.log("----");
            // console.log(X6.GlobalControl.ties[tie].getBase().position.x);
            // console.log(X6.GlobalControl.ties[tie].getBase().position.y);
            // console.log(X6.GlobalControl.ties[tie].getBase().position.z);
            // console.log("----");
            if (this.inDistance(globalLaserPos, X6.GlobalControl.ties[tie].getBase().position, 1000)) {
                console.log("HITTTT!!!!");
                console.log();
                // tie++;
                // debugger;
                X6.GlobalControl.ties[tie].destroy(tie);
            }
        }
    }
};
X6.Tie = function() {
    X6.StarShip.call(this);
    this.canFire = true;
};
X6.Tie.normalSpeed = 300;
X6.Tie.prototype = new X6.StarShip();
X6.Tie.prototype.sprite = THREE.ImageUtils.loadTexture( "/img/particle.png" );
X6.Tie.prototype.destroy = function(index) {
    var geometry = new THREE.Geometry();
    var sprite = this.sprite;
    for ( i = 0; i < 300; i ++ ) {
      var vertex = new THREE.Vector3();
      vertex.x = 2000 * Math.random() - 500;
      vertex.y = 2000 * Math.random() - 500;
      vertex.z = 2000 * Math.random() - 500;
      geometry.vertices.push( vertex );
    }
    // geometry = new THREE.SphereGeometry(500);
    material = new THREE.ParticleBasicMaterial( { size: 12, sizeAttenuation: true, map: sprite, transparent: true } );
    // material = new THREE.MeshBasicMaterial({color: 0xff0000});
    material.color.setRGB( (Math.random() + 1) / 2, (Math.random() + 1) / 2, (Math.random() + 1) / 2);

    particles = new THREE.ParticleSystem( geometry, material );
    X6.GlobalControl.activeExplosions.push(particles);
    (function (index) {
        setTimeout(function() {
            X6.GlobalControl.scene.remove(particles);
            X6.GlobalControl.activeExplosions.splice(index, index + 1);
        }, 1000);
    })(X6.GlobalControl.activeExplosions.length);
    particles.sortParticles = true;
    particles.position = X6.GlobalControl.ties[index].getBase().position;
    // self.scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
    X6.GlobalControl.scene.add( particles );
    X6.GlobalControl.ties[index] = null;
    for (piece in this.pieces) {
        X6.GlobalControl.scene.remove(this.pieces[piece]);
    }
};
X6.Tie.prototype.moveLasers = function(speed) {
    for (var i = 0; i < this.activeLasers.length; i++) {
        var pos = this.activeLasers[i].position;
        pos.z += speed;
    }
};

window.onload = X6.GlobalControl.initScene;

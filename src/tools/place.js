/*
Place new entity tool
*/
var colours = ['#DA6369', '#4191A6', '#5AA89A', '#5AA89A', '#F39C85'];

var primitives = [
  {
    name: 'box',
    defaults: {
      geometry: 'primitive: box; width: 2; height: 2; depth: 2',
      material: 'color: ' + colours[0]
    }
  },
  {
    name: 'sphere',
    defaults: {
      geometry: 'primitive: sphere; radius: 1',
      material: 'color: ' + colours[1]
    }
  },
  {
    name: 'torus',
    defaults: {
      geometry: 'primitive: torus; radius: 1.6; tube: .5; segments: 32; tubularSegments: 10',
      material: 'color: ' + colours[2]
    }
  }
];

Tool = {
  name: 'Place',

  start: function () {
    var scene = this.scene = document.querySelector('a-scene');
    this.camera = this.scene.cameraEl;

    this.setupCursor();
    this.addListeners();
  },

  end: function () {
    if (this.selectedEntity) {
      this.drop();
    }
    this.removeListeners();
    this.removeCursor();
  },

  addListeners: function() {
    this.onContextmenu = this.use.bind(this);
    this.onKeypress = this.handleKeypress.bind(this);
    this.scene.canvas.addEventListener('contextmenu', this.onContextmenu);
    window.addEventListener('keypress', this.onKeypress);
  },

  removeListeners: function() {
    this.scene.canvas.removeEventListener('contextmenu', this.onContextmenu);
  },

  setupCursor: function () {
    this.cursor = document.createElement('a-entity');
    this.cursor.setAttribute('id', 'editor-select-cursor');
    this.cursor.setAttribute('position', '0 0 -10');
    this.cursor.setAttribute('cursor', 'maxDistance: 30');
    this.cursor.setAttribute('geometry', 'primitive: sphere; radius: 0.3');
    this.cursor.setAttribute('material', 'color: green; receiveLight: false;');
    this.camera.appendChild(this.cursor);
  },

  removeCursor: function() {
    this.cursor.parentNode.removeChild(this.cursor);
    this.cursor = null;
  },

  handleKeypress: function(e) {
    switch(e.charCode) {
      case 91: // [
        this.prev();
        break;
      case 93: // ]
        this.next();
        break;
    }
  },

  prev: function() {
    if (!this.selectedEntity) {
      return;
    }

    this.index--;
    if (this.index < 0) {
      this.index = primitives.length - 1;
    }

    this.clear();
    this.new(this.index);
  },

  next: function() {
    if (!this.selectedEntity) {
      return;
    }

    this.index++;
    if (this.index > primitives.length - 1) {
      this.index = 0;
    }
    this.clear();
    this.new(this.index);
  },

  clear: function() {
    if (this.selectedEntity) {
      this.selectedEntity.parentNode.removeChild(this.selectedEntity);
      this.selectedEntity = null;
    }
  },

  new: function(i) {
    if (!i) {
      i = this.index ? this.index : 0;
    }

    var primitive = primitives[i];

    // todo: use templates here.
    var entity = document.createElement('a-entity');

    // load default attributes
    for (var attr in primitive.defaults) {
      entity.setAttribute(attr, primitive.defaults[attr]);
    }

    entity.setAttribute('rotation', '0 0 0');
    entity.setAttribute('position', '0 0 -10');

    this.selectedEntity = entity;

    this.camera.appendChild(entity);

    this.index = i;
  },

  drop: function() {
    if (!this.selectedEntity) {
      return;
    }
    var object3D = this.selectedEntity.object3D;
    object3D.updateMatrixWorld();

    // set objects to world rotation.
    var euler = new THREE.Euler();
    euler.setFromRotationMatrix(object3D.matrixWorld);

    var rotation = {
      x: 0,
      y: euler.y * (180 / Math.PI),
      z: 0
    }

    // position
    var position = new THREE.Vector3();
    position.setFromMatrixPosition(object3D.matrixWorld);

    var clone = this.selectedEntity.cloneNode();
    clone.setAttribute('rotation', rotation);
    clone.setAttribute('position', position);

    this.scene.appendChild(clone);

    this.selectedEntity.parentNode.removeChild(this.selectedEntity);

    this.selectedEntity = null;
  },

  use: function (e) {
    e.preventDefault();
    if (!this.selectedEntity) {
      this.new();
    } else {
      this.drop();
    }
  }
}

module.exports = Tool;
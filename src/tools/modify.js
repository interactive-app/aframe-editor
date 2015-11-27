/* global THREE */

/*
Modify entity tool
*/
module.exports = {
  name: 'Modify',

  start: function () {
    this.scene = document.querySelector('a-scene');
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

  addListeners: function () {
    this.onContextmenu = this.use.bind(this);
    this.onIntersection = this.handleIntersection.bind(this);
    this.onIntersectionClear = this.handleIntersectionClear.bind(this);
    this.onMousewheel = this.handleMousewheel.bind(this);

    this.scene.canvas.addEventListener('contextmenu', this.onContextmenu);
    this.cursor.addEventListener('intersection', this.onIntersection);
    this.cursor.addEventListener('intersectioncleared', this.onIntersectionClear);
    window.addEventListener('wheel', this.onMousewheel);
  },

  removeListeners: function () {
    this.scene.canvas.removeEventListener('contextmenu', this.onContextmenu);
    this.cursor.removeEventListener('intersection', this.onIntersection);
    this.cursor.removeEventListener('intersectioncleared', this.onIntersectionClear);
  },

  setupCursor: function () {
    this.cursor = document.createElement('a-entity');
    this.cursor.setAttribute('id', 'editor-select-cursor');
    this.cursor.setAttribute('position', '0 0 -10');
    this.cursor.setAttribute('cursor', 'maxDistance: 30');
    this.cursor.setAttribute('geometry', 'primitive: ring; outerRadius: 0.30; innerRadius: 0.20;');
    this.cursor.setAttribute('material', 'color: red; receiveLight: false;');
    this.camera.appendChild(this.cursor);
  },

  removeCursor: function () {
    this.cursor.parentNode.removeChild(this.cursor);
    this.cursor = null;
  },

  handleMousewheel: function (e) {
    var entity = this.selectedEntity;

    if (!entity) { return; }

    var parent = entity.parentNode;
    if (parent.hasAttribute('camera')) {
      var position = entity.getAttribute('position');
      position.z += e.deltaY;
      entity.setAttribute('position', position);
    }
  },

  handleIntersection: function (e) {
    this.currentIntersection = e.detail;
  },

  handleIntersectionClear: function (e) {
    this.currentIntersection = null;
  },

  pick: function () {
    if (!this.currentIntersection) {
      return;
    }
    var entity = this.currentIntersection.el;
    var distance = this.currentIntersection.distance;
    var clone = entity.cloneNode();

    clone.setAttribute('position', {x: 0, y: 0, z: -distance});
    this.camera.appendChild(clone);
    entity.parentNode.removeChild(entity);

    this.selectedEntity = clone;
  },

  drop: function () {
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
    };

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
      this.pick();
    } else {
      this.drop();
    }
  }
};

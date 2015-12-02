/* global THREE */
var Panels = require('./panels');

function Editor () {
  document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
}

Editor.prototype = {

  onDomLoaded: function () {
    this.tools = require('./tools');
    this.panels = new Panels();

    this.scene = document.querySelector('a-scene');
    this.camera = this.scene.cameraEl;

    if (this.scene.hasLoaded) {
      this.initUI();
    } else {
      this.scene.addEventListener('loaded', this.initUI.bind(this));
    }
  },

  initUI: function () {
    this.scene3D = this.scene.object3D;
    this.initHelpers();
  },

  initHelpers: function () {
    this.sceneHelpers = new THREE.Group(); // Scene
    this.scene3D.add(this.sceneHelpers);

    // Grid
    var grid = new THREE.GridHelper(10, 1);
    this.sceneHelpers.add(grid);
  }
};

module.exports = new Editor();

/* global THREE */
function Helpers (editor) {
  this.sceneHelpers = new THREE.Group();
  this.sceneHelpers.visible = false;
  editor.scene.add(this.sceneHelpers);

  // Grid
  this.grid = new THREE.GridHelper(10, 1);
  this.add(this.grid);
}

Helpers.prototype = {
  add: function (helper) {
    this.sceneHelpers.add(helper);
  },
  hide: function () {
    this.sceneHelpers.visible = false;
  },

  show: function () {
    this.sceneHelpers.visible = true;
  }
};

module.exports = Helpers;

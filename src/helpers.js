function Helpers(editor) {
    this.sceneHelpers = new THREE.Group();
    this.sceneHelpers.visible=false;
    editor.scene.add(this.sceneHelpers);

    // Grid
    this.grid = new THREE.GridHelper(10, 1);
    this.sceneHelpers.add(this.grid);
}

Helpers.prototype = {

  hide: function() {
    this.sceneHelpers.visible = false;
  },

  show: function() {
    this.sceneHelpers.visible = true;
  },
}

module.exports = Helpers;

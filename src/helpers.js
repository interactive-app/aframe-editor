/* global THREE */
function Helpers (editor) {
  this.editor = editor;

  this.defaultSize = 0.5;

  // threejs Helpers
  this.sceneHelpers = new THREE.Group();
  this.sceneHelpers.visible = false;
  editor.scene.add(this.sceneHelpers);
  this.helpers = {};

  this.addGridHelper();
  this.findHelpers();
}

Helpers.prototype = {
  addGridHelper: function () {
    this.grid = new THREE.GridHelper(10, 1);
    this.add(this.grid);
  },

  removeHelper: function (object) {
    if (this.sceneHelpers[object.id] !== undefined) {
      var helper = this.helpers[ object.id ];
      helper.parent.remove(helper);
      delete this.helpers[ object.id ];
      this.signals.helperRemoved.dispatch(helper);
    }
  },

  guessHelperType: function (entity) {
    if (entity.components['light']) {
      var object = entity.components['light'].light;

      if (object instanceof THREE.PointLight) {
        return THREE.PointLightHelper;
      } else if (object instanceof THREE.DirectionalLight) {
        return THREE.DirectionalLightHelper;
      } else if (object instanceof THREE.SpotLight) {
        return THREE.SpotLightHelper;
      } else if (object instanceof THREE.HemisphereLight) {
        return THREE.HemisphereLightHelper;
      } else {
        // no helper for this object type
        return null;
      }
    }
  },

  addHelper: function (entity) {
    if (entity.dataset && !entity.dataset.isEditor) {
      var HelperType = this.guessHelperType(entity);
      if (HelperType == null) {
        return;
      }
      var object = entity.components['light'].light;
      var helper = new HelperType(object, this.defaultSize);

      entity.helper = helper;
      this.helpers[ entity.object3D.id ] = helper;
      this.add(helper);
    }
  },

  findHelpers: function () {
    var scene = this.editor.sceneEl;
    var $this = this;

    (function treeIterate (element) {
      var children = element.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        $this.addHelper(child);
        treeIterate(child);
      }
    })(scene);
  },

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

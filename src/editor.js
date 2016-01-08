/* global aframeEditor THREE */
var Panels = require('./panels');
var Viewport = require('./viewport');
var Events = require('./events.js');

function Editor () {
  window.aframeCore = window.aframeCore || window.AFRAME.aframeCore || window.AFRAME;

  // Detect if the scene is already loaded
  if (document.readyState === 'complete' || document.readyState === 'loaded') {
    this.onDomLoaded();
  } else {
    document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
  }
}

Editor.prototype = {
  /**
   * Callback once the DOM is completely loaded so we could query the scene
   */
  onDomLoaded: function () {
    this.sceneEl = document.querySelector('a-scene');
    if (this.sceneEl.hasLoaded) {
      this.onSceneLoaded();
    } else {
      this.sceneEl.addEventListener('loaded', this.onSceneLoaded.bind(this));
    }
  },

  onSceneLoaded: function () {
    this.container = document.querySelector('.a-canvas');
    this.defaultCameraEl = document.querySelector('[camera]');
    this.initUI();
  },

  initUI: function () {
    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    this.DEFAULT_CAMERA.name = 'Camera';
    this.DEFAULT_CAMERA.position.set(20, 10, 20);
    this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

    this.camera = this.DEFAULT_CAMERA.clone();

    this.initEvents();

    this.selected = null;
    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    this.helpers = {};
    this.sceneHelpers = new THREE.Scene();
    this.sceneHelpers.visible = false;
    this.scene.add(this.sceneHelpers);
    this.editorActive = false;

    var scope = this;
    function addObjects (object) {
      if (object.children.length > 0) {
        for (var i = 0; i < object.children.length; i++) {
          var obj = object.children[i];
          if (obj instanceof THREE.Mesh) {
            scope.addObject(obj);
          }
        }
      }
    }
    this.viewport = new Viewport(this);
    this.signals.windowResize.dispatch();

    addObjects(this.sceneEl.object3D);
  },

  removeObject: function (object) {
    if (object.parent === null) return; // avoid deleting the camera or scene

    var scope = this;

    object.traverse(function (child) {
      scope.removeHelper(child);
    });

    object.parent.remove(object);

    this.signals.objectRemoved.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  },

  addHelper: (function () {
    var geometry = new THREE.SphereBufferGeometry(2, 4, 2);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

    return function (object) {
      var helper;
      if (object instanceof THREE.Camera) {
        helper = new THREE.CameraHelper(object, 1);
      } else if (object instanceof THREE.PointLight) {
        helper = new THREE.PointLightHelper(object, 1);
      } else if (object instanceof THREE.DirectionalLight) {
        helper = new THREE.DirectionalLightHelper(object, 1);
      } else if (object instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(object, 1);
      } else if (object instanceof THREE.HemisphereLight) {
        helper = new THREE.HemisphereLightHelper(object, 1);
      } else if (object instanceof THREE.SkinnedMesh) {
        helper = new THREE.SkeletonHelper(object);
      } else {
        // no helper for this object type
        return;
      }

      var picker = new THREE.Mesh(geometry, material);
      picker.name = 'picker';
      picker.userData.object = object;
      helper.add(picker);

      this.sceneHelpers.add(helper);
      this.helpers[ object.id ] = helper;

      this.signals.helperAdded.dispatch(helper);
    };
  })(),

  removeHelper: function (object) {
    if (this.helpers[ object.id ] !== undefined) {
      var helper = this.helpers[ object.id ];
      helper.parent.remove(helper);

      delete this.helpers[ object.id ];

      this.signals.helperRemoved.dispatch(helper);
    }
  },

  selectEntity: function (entity) {
    this.selectedEntity = entity;
    if (entity) {
      this.select(entity.object3D);
    } else {
      this.select(null);
    }

    this.signals.entitySelected.dispatch(entity);
  },

  initEvents: function () {
    // Find better name :)
    this.signals = Events;
    this.signals.editorModeChanged.add(function (active) {
      this.editorActive = active;

      this.sceneHelpers.visible = this.editorActive;
    }.bind(this));

    window.addEventListener('resize', this.signals.windowResize.dispatch, false);

    var entities = document.querySelectorAll('a-entity');
    for (var i = 0; i < entities.length; ++i) {
      var entity = entities[i];
      entity.addEventListener('componentchanged',
        function (evt) {
          if (this.selected && evt.srcElement === this.selected.el) {
            aframeEditor.editor.signals.componentChanged.dispatch(evt);
          }
        }.bind(this));
    }
  },

  selectById: function (id) {
    if (id === this.camera.id) {
      this.select(this.camera);
      return;
    }
    this.select(this.scene.getObjectById(id, true));
  },

  // Change to select object
  select: function (object) {
    if (this.selected === object) {
      return;
    }

    this.selected = object;
    this.signals.objectSelected.dispatch(object);
  },

  deselect: function () {
    this.select(null);
  },

  clear: function () {
    this.camera.copy(this.DEFAULT_CAMERA);
    this.deselect();
    document.querySelector('a-scene').innerHTML = '';
    this.signals.editorCleared.dispatch();
  },

  addEntity: function (entity) {
    this.addObject(entity.object3D);
    this.selectEntity(entity);
  },

  enable: function () {
    this.panels.sidebar.show();
    this.panels.menubar.show();
    this.signals.editorModeChanged.dispatch(true);
    this.sceneEl.pause();
  },

  disable: function () {
    this.panels.sidebar.hide();
    this.panels.menubar.hide();
    this.signals.editorModeChanged.dispatch(false);
    this.sceneEl.play();
  // @todo Removelisteners
  },

  addObject: function (object) {
    var scope = this;
    object.traverse(function (child) {
      scope.addHelper(child);
    });

    this.signals.objectAdded.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  }
};

module.exports = new Editor();

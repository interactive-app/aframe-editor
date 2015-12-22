/* global aframeEditor THREE */
var Panels = require('./panels');
var Signals = require('signals');
var Viewport = require('./viewport');
var Helpers = require('./helpers');

function Editor () {
  document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
}

Editor.prototype = {
  onDomLoaded: function () {
    this.tools = require('./tools');
    this.sceneEl = document.querySelector('a-scene');
    this.container = document.querySelector('.a-canvas');

    if (this.sceneEl.hasLoaded) {
      this.initUI();
    } else {
      this.sceneEl.addEventListener('loaded', this.initUI.bind(this));
    }
  },

  initUI: function () {

    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    this.DEFAULT_CAMERA.name = 'Camera';
    this.DEFAULT_CAMERA.position.set(20, 10, 20);
    this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

    this.camera = this.DEFAULT_CAMERA;

    this.initEvents();

    this.selected = null;
    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    //this.helpers = new Helpers(this);
    this.helpers = {};
    this.sceneHelpers = new THREE.Scene();
    this.sceneHelpers.visible = false;
    this.scene.add(this.sceneHelpers);
    this.editorActive = false;

    var objects = [];
    function addObjects(object) {
      if (object.children.length > 0) {
        for (var i = 0; i < object.children.length; i++) {
          var obj = object.children[i];
          if (obj instanceof THREE.Mesh) {
            objects.push(obj);
          }
          addObjects(obj);
        }
      }
    }
    addObjects(this.sceneEl.object3D);

    this.viewport = new Viewport(this, objects);
  },

  selectEntity: function(entity) {
      this.selectedEntity = entity;
      if (entity) {
        this.select(entity.object3D);
      } else {
        this.select(null);
      }

      this.signals.entitySelected.dispatch(entity);
  },

  initEvents: function () {
    this.signals = {

      sceneGraphChanged: new Signals.Signal(),
      objectSelected: new Signals.Signal(),
      entitySelected: new Signals.Signal(),
      objectChanged: new Signals.Signal(),
      componentChanged: new Signals.Signal(),

      // custom
      editorModeChanged: new Signals.Signal(),

      // threejs
      windowResize: new Signals.Signal()
    };

    this.signals.editorModeChanged.add(function(active) {
      this.editorActive = active;

      this.sceneHelpers.visible = this.editorActive;
    }.bind(this));

    window.addEventListener('resize', this.signals.windowResize.dispatch, false);
    this.signals.windowResize.dispatch();

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

  select: function (object) {
    if (this.selected === object) {
      return;
    }

    this.selected = object;
    this.signals.objectSelected.dispatch(object);
  }

};

module.exports = new Editor();

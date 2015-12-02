/* global THREE */
var Panels = require('./panels');
var Signals = require('signals');
var Viewport = require('./viewport');
var THREE = require('@mozvr/aframe').aframeCore.THREE;

function Editor () {
  document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
}

Editor.prototype = {

  onDomLoaded: function () {
    this.tools = require('./tools');
    this.sceneEl = document.querySelector('a-scene');

    this.sceneEl.addEventListener('loaded', this.initUI.bind(this));
  },

  initUI: function () {

    this.cameraEl = this.sceneEl.cameraEl;
    this.camera = this.cameraEl.object3D;

    this.signals = {
      sceneGraphChanged: new Signals.Signal(),
      objectSelected: new Signals.Signal(),
      entitySelected: new Signals.Signal()
    }

    this.signals.entitySelected.add(function(entity){
      this.selectedEntity = entity;
      if (entity)
        this.signals.objectSelected.dispatch(entity.object3D);
      else
        this.signals.objectSelected.dispatch(null);
    });

    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    this.initHelpers();
    
    this.viewport = new Viewport( this );

  },

  initHelpers: function () {

    this.sceneHelpers = new THREE.Group(); // Scene
    this.scene.add(this.sceneHelpers);

    // Grid
    var grid = new THREE.GridHelper(10, 1);
    this.sceneHelpers.add(grid);
  },

  selectById: function(id) {
    if ( id === this.camera.id ) {
      this.select( this.camera );
      return;
    }
    this.select( this.scene.getObjectById( id, true ) );
  },

  select: function ( object ) {
    if ( this.selected === object ) return;

    var uuid = null;

    if ( object !== null ) {
      uuid = object.uuid;
    }

    this.selected = object;

    this.signals.objectSelected.dispatch( object );
  },

};

module.exports = new Editor();
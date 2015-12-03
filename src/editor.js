/* global THREE */
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

    this.sceneEl.addEventListener('loaded', this.initUI.bind(this));
  },

  initUI: function () {

    this.cameraEl = this.sceneEl.cameraEl;
    this.camera = this.cameraEl.object3D;

    this.signals = {
      sceneGraphChanged: new Signals.Signal(),
      objectSelected: new Signals.Signal(),
      entitySelected: new Signals.Signal(),
      objectChanged: new Signals.Signal()
    }

    this.signals.entitySelected.add((function(entity){
      this.selectedEntity = entity;
      if (entity)
        this.select(entity.object3D);
      else
        this.select(null);
    }).bind(this));

    this.selected=null;
    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    this.helpers = new Helpers(this);
    
    this.viewport = new Viewport( this );

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

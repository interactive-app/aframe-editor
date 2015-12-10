/* global aframeEditor aframeCore */
var Panels = require('./panels');
var Signals = require('signals');
var Viewport = require('./viewport');
var Helpers = require('./helpers');

function Editor () {
  document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
}

Editor.prototype = {
  onDomLoaded: function () {
    // Megahack
    aframeCore.components.geometry.schema['primitive'].oneOf.push("");

    aframeCore.components.geometry.schema['width']['if'] = {'primitive': ['box']};

    aframeCore.components.geometry.schema['arc']['if'] = {'primitive': ['torus']};
    aframeCore.components.geometry.schema['depth']['if'] = {'primitive': ['box']};
    aframeCore.components.geometry.schema['height']['if'] = {'primitive': ['box', 'cylinder', 'plane']};
    aframeCore.components.geometry.schema['openEnded']['if'] = {'primitive': ['cylinder']};
    aframeCore.components.geometry.schema['p']['if'] = {'primitive': ['torusKnot']};
    aframeCore.components.geometry.schema['q']['if'] = {'primitive': ['torusKnot']};
    aframeCore.components.geometry.schema['radius']['if'] = {'primitive': ['circle','cylinder','ring','sphere','torus','torusKnot']};
    aframeCore.components.geometry.schema['radiusBottom']['if'] = {'primitive': ['cylinder']};
    aframeCore.components.geometry.schema['radiusInner']['if'] = {'primitive': ['ring']};
    aframeCore.components.geometry.schema['radiusOuter']['if'] = {'primitive': ['ring']};
    aframeCore.components.geometry.schema['radiusTop']['if'] = {'primitive': ['cylinder']};
    aframeCore.components.geometry.schema['radiusTubular']['if'] = {'primitive': ['torus']};
    aframeCore.components.geometry.schema['scaleHeight']['if'] = {'primitive': ['torusKnot']};
    aframeCore.components.geometry.schema['segments']['if'] = {'primitive': ['circle']};
    aframeCore.components.geometry.schema['segmentsHeight']['if'] = {'primitive': ['cylinder','sphere']};
    aframeCore.components.geometry.schema['segmentsPhi']['if'] = {'primitive': ['ring']};
    aframeCore.components.geometry.schema['segmentsRadial']['if'] = {'primitive': ['cylinder']};
    aframeCore.components.geometry.schema['segmentsTheta']['if'] = {'primitive': ['ring']};
    aframeCore.components.geometry.schema['segmentsTubular']['if'] = {'primitive': ['torus','torusKnot']};
    aframeCore.components.geometry.schema['segmentsWidth']['if'] = {'primitive': ['sphere']};
    aframeCore.components.geometry.schema['thetaLength']['if'] = {'primitive': ['circle','cylinder','ring']};
    aframeCore.components.geometry.schema['thetaStart']['if'] = {'primitive': ['circle','cylinder','ring']};

/*
  "arc":{"default":360 }
  "openEnded":{"default":false}
  "p":{"default":2}
  "translate":{"default":{"x":0,"y":0,"z":0}}
  "primitive":{"default":"","oneOf": ["box","circle","cylinder","plane","ring","sphere","torus","torusKnot"]}
  "q":{"default":3}
  "radius":{"default":1,"min":0, "if": {"primitive": ["circle","cylinder","disc"]}}
  "radiusBottom":{"default":1,"min":0}
  "radiusInner":{"default":0.8,"min":0}
  "radiusOuter":{"default":1.2,"min":0}
  "radiusTop":{"default":1}
  "radiusTubular":{"default":0.2,"min":0}
  "scaleHeight":{"default":1,"min":0}
  "segments":{"default":8,"min":0}
  "segmentsHeight":{"default":18,"min":0}
  "segmentsPhi":{"default":8,"min":0}
  "segmentsRadial":{"default":36,"min":0}
  "segmentsTheta":{"default":8,"min":0}
  "segmentsTubular":{"default":8,"min":0}
  "segmentsWidth":{"default":36,"min":0}
  "thetaLength":{"default":360,"min":0}
  "thetaStart":{"default":0}



 */
    this.tools = require('./tools');
    this.sceneEl = document.querySelector('a-scene');

    if (this.sceneEl.hasLoaded) {
      this.initUI();
    } else {
      this.sceneEl.addEventListener('loaded', this.initUI.bind(this));
    }
  },

  initUI: function () {
    this.cameraEl = this.sceneEl.cameraEl;
    this.camera = this.cameraEl.object3D;

    this.initEvents();

    this.selected = null;
    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    this.helpers = new Helpers(this);
    this.viewport = new Viewport(this);
  },

  initEvents: function () {
    this.signals = {
      sceneGraphChanged: new Signals.Signal(),
      objectSelected: new Signals.Signal(),
      entitySelected: new Signals.Signal(),
      objectChanged: new Signals.Signal(),
      componentChanged: new Signals.Signal()
    };

    this.signals.entitySelected.add(function (entity) {
      this.selectedEntity = entity;
      if (entity) {
        this.select(entity.object3D);
      } else {
        this.select(null);
      }
    }.bind(this));

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

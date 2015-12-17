/* global THREE */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');
var MouseControls = require('./mousecontrols.js');

function Viewport (editor) {

  this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 1, 10000);
  this.DEFAULT_CAMERA.name = 'Camera';
  this.DEFAULT_CAMERA.position.set(20, 10, 20);
  this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

  this.camera = this.DEFAULT_CAMERA;
  //editor.sceneEl.camera = this.camera;

  var signals = editor.signals;

  var selectionBox = new THREE.BoxHelper();
  selectionBox.material.depthTest = false;
  selectionBox.material.transparent = true;
  selectionBox.visible = false;
  editor.helpers.add(selectionBox);

  var objectPositionOnDown = null;
  var objectRotationOnDown = null;
  var objectScaleOnDown = null;
  var transformControls = new THREE.TransformControls(this.camera, editor.container);

  transformControls.addEventListener('change', function () {

    var object = transformControls.object;
    if (object !== undefined) {
      selectionBox.update(object);
      if (editor.helpers[ object.id ] !== undefined) {
        editor.helpers[ object.id ].update();
      }

      console.log(object.position.x,object.position.y,object.position.z);
      object.el.setAttribute('position',object.position.x.toFixed(2)+' '+object.position.y.toFixed(2)+' '+object.position.z.toFixed(2));
      
      // !!!editor.signals.refreshSidebarObject3D.dispatch(object);
    }
  });
  transformControls.addEventListener('mouseDown', function () {

    var object = transformControls.object;

    objectPositionOnDown = object.position.clone();
    objectRotationOnDown = object.rotation.clone();
    objectScaleOnDown = object.scale.clone();

    controls.enabled = false;
  });

  transformControls.addEventListener('mouseUp', function () {
    var object = transformControls.object;
    if (object !== null) {
      switch (transformControls.getMode()) {
        case 'translate':

          if (!objectPositionOnDown.equals(object.position)) {
            /*
            object.el.setAttribute('position','x', object.position.x);
            object.el.setAttribute('position','y', object.position.y);
            object.el.setAttribute('position','z', object.position.z);
            */
          }
          break;

        case 'rotate':
          function rad2deg(angle) {
            return angle * 57.29577951308232; // angle / Math.PI * 180
          }
          if (! objectRotationOnDown.equals(object.rotation)) {
            //object.el.setAttribute('rotation','x', object.rotation.x);
            //object.el.setAttribute('rotation','y', object.rotation.y);
            /*object.el.setAttribute('rotation','x', rad2deg(object.rotation.x));
            object.el.setAttribute('rotation','y', rad2deg(object.rotation.y));
            object.el.setAttribute('rotation','z', rad2deg(object.rotation.z));
            */
          }
          break;

        case 'scale':
          if (! objectScaleOnDown.equals(object.scale)) {
            object.el.setAttribute('scale','x', object.scale.x);
            object.el.setAttribute('scale','y', object.scale.y);
            object.el.setAttribute('scale','z', object.scale.z);
          }
          break;
      }
    }
    controls.enabled = true;
  });

  editor.helpers.add(transformControls);

  signals.objectSelected.add(function (object) {
    selectionBox.visible = false;
    if (!editor.selected || editor.selected.el.helper) {
      return;
    }

    if (object !== null) {
      if (object.geometry !== undefined &&
        object instanceof THREE.Sprite === false) {
        selectionBox.update(object);
        selectionBox.visible = true;
      }

      transformControls.attach(object);
    }
  });

  signals.objectChanged.add(function () {
    if (editor.selected.el.helper) {
      return;
    }
    selectionBox.update(editor.selected);
  });

//  transformControls.setMode('rotate');
  // controls need to be added *after* main logic,
  // otherwise controls.enabled doesn't work.

  var controls = new THREE.EditorControls(this.camera, editor.container);
  controls.addEventListener('change', function () {
    transformControls.update();
    //!!!editor.signals.cameraChanged.dispatch(this.camera);
  });
};

module.exports = Viewport;

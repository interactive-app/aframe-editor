/* global THREE */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');
var MouseControls = require('./mousecontrols.js');

function Viewport (editor) {
  var signals = editor.signals;

  var selectionBox = new THREE.BoxHelper();
  selectionBox.material.depthTest = false;
  selectionBox.material.transparent = true;
  selectionBox.visible = false;
  editor.helpers.add(selectionBox);

  var objectPositionOnDown = null;
  var objectRotationOnDown = null;
  var objectScaleOnDown = null;
  var transformControls = new THREE.TransformControls(editor.camera, editor.container);

  transformControls.addEventListener('change', function () {
    var object = transformControls.object;
    if (object !== undefined) {
      selectionBox.update(object);
      if (editor.helpers[ object.id ] !== undefined) {
        editor.helpers[ object.id ].update();
      }
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
        /*
        case 'translate':

          if (!objectPositionOnDown.equals(object.position)) {
            editor.execute(new SetPositionCommand(object, object.position, objectPositionOnDown));
          }
          break;

        case 'rotate':
          if (! objectRotationOnDown.equals(object.rotation)) {
            editor.execute(new SetRotationCommand(object, object.rotation, objectRotationOnDown));
          }
          break;

        case 'scale':
          if (! objectScaleOnDown.equals(object.scale)) {
            editor.execute(new SetScaleCommand(object, object.scale, objectScaleOnDown));
          }
          break;
          */
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

  // controls need to be added *after* main logic,
  // otherwise controls.enabled doesn't work.

  var controls = new THREE.EditorControls(editor.camera, editor.container);
  controls.addEventListener('change', function () {
    transformControls.update();
    //!!!editor.signals.cameraChanged.dispatch(editor.camera);
  });
};

module.exports = Viewport;

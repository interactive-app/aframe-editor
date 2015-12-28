/* global aframeEditor THREE */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');

function Viewport (editor) {
  var signals = editor.signals;

  var container = {
    dom: editor.container
  };

  // helpers
  var sceneHelpers = editor.sceneHelpers;
  var objects = [];

  var grid = new THREE.GridHelper(30, 1);
  sceneHelpers.add(grid);

  var camera = editor.camera;

  var selectionBox = new THREE.BoxHelper();
  selectionBox.material.depthTest = false;
  selectionBox.material.transparent = true;
  selectionBox.visible = false;
  sceneHelpers.add(selectionBox);

  var objectPositionOnDown = null;
  var objectRotationOnDown = null;
  var objectScaleOnDown = null;

  var transformControls = new THREE.TransformControls(camera, editor.container);
  transformControls.addEventListener('change', function () {
    var object = transformControls.object;
    if (object !== undefined) {
      var objectId = object.id;

      // Hack because object3D always has geometry :(
      if (object.geometry && object.geometry.vertices && object.geometry.vertices.length > 0) {
        selectionBox.update(object);
      } else if (object.children[0]) {
        objectId = object.children[0].id;
      }

      // Hacks
      if (editor.helpers[ objectId ] !== undefined) {
        editor.helpers[ objectId ].update();
      }

      switch (transformControls.getMode()) {
        case 'translate':
          object.el.setAttribute('position', {x: object.position.x.toFixed(2), y: object.position.y.toFixed(2), z: object.position.z.toFixed(2)});
          break;
        case 'rotate':
          object.el.setAttribute('rotation', {
            x: THREE.Math.radToDeg(object.rotation.x.toFixed(2)),
            y: THREE.Math.radToDeg(object.rotation.y.toFixed(2)),
            z: THREE.Math.radToDeg(object.rotation.z.toFixed(2))});
          break;
        case 'scale':
          object.el.setAttribute('scale', {x: object.scale.x.toFixed(2), y: object.scale.y.toFixed(2), z: object.scale.z.toFixed(2)});
          break;
      }
      editor.signals.refreshSidebarObject3D.dispatch(object);
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
            // @todo
          }
          break;

        case 'rotate':
          if (!objectRotationOnDown.equals(object.rotation)) {
            // @todo
          }
          break;

        case 'scale':
          if (!objectScaleOnDown.equals(object.scale)) {
            // @todo
          }
          break;
      }
    }
    controls.enabled = true;
  });

  sceneHelpers.add(transformControls);
/*
  signals.objectSelected.add(function (object) {
    selectionBox.visible = false;
    if (!editor.selected) {
      // if (!editor.selected || editor.selected.el.helper) {
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
*/
  signals.objectChanged.add(function () {
    // Uberhack because of object3D mesh for lights
    if (editor.selected.geometry && editor.selected.geometry.vertices && editor.selected.geometry.vertices.length > 0) {
      selectionBox.update(editor.selected);
    }
  });

  // object picking
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  // events
  function getIntersects (point, objects) {
    mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(objects);
  }

  var onDownPosition = new THREE.Vector2();
  var onUpPosition = new THREE.Vector2();
  var onDoubleClickPosition = new THREE.Vector2();

  function getMousePosition (dom, x, y) {
    var rect = dom.getBoundingClientRect();
    return [ (x - rect.left) / rect.width, (y - rect.top) / rect.height ];
  }

  function handleClick () {
    if (onDownPosition.distanceTo(onUpPosition) === 0) {
      var intersects = getIntersects(onUpPosition, objects);
      if (intersects.length > 0) {
        var object = intersects[ 0 ].object;
        if (object.userData.object !== undefined) {
          // helper
          editor.selectEntity(object.userData.object.el);
        } else {
          editor.selectEntity(object.el);
        }
      } else {
        editor.selectEntity(null);
      }
    }
  }

  function onMouseDown (event) {
    event.preventDefault();

    var array = getMousePosition(editor.container, event.clientX, event.clientY);
    onDownPosition.fromArray(array);

    document.addEventListener('mouseup', onMouseUp, false);
  }

  function onMouseUp (event) {
    var array = getMousePosition(editor.container, event.clientX, event.clientY);
    onUpPosition.fromArray(array);
    handleClick();

    document.removeEventListener('mouseup', onMouseUp, false);
  }

  function onTouchStart (event) {
    var touch = event.changedTouches[ 0 ];
    var array = getMousePosition(editor.container, touch.clientX, touch.clientY);
    onDownPosition.fromArray(array);

    document.addEventListener('touchend', onTouchEnd, false);
  }

  function onTouchEnd (event) {
    var touch = event.changedTouches[ 0 ];
    var array = getMousePosition(editor.container, touch.clientX, touch.clientY);
    onUpPosition.fromArray(array);
    handleClick();
    document.removeEventListener('touchend', onTouchEnd, false);
  }

  function onDoubleClick (event) {
    var array = getMousePosition(editor.container, event.clientX, event.clientY);
    onDoubleClickPosition.fromArray(array);

    var intersects = getIntersects(onDoubleClickPosition, objects);

    if (intersects.length > 0) {
      var intersect = intersects[ 0 ];
      signals.objectFocused.dispatch(intersect.object);
    }
  }

  editor.container.addEventListener('mousedown', onMouseDown, false);
  editor.container.addEventListener('touchstart', onTouchStart, false);
  editor.container.addEventListener('dblclick', onDoubleClick, false);

  // controls need to be added *after* main logic,
  // otherwise controls.enabled doesn't work.

  var controls = new THREE.EditorControls(camera, editor.container);
  controls.addEventListener('change', function () {
    transformControls.update();
    // editor.signals.cameraChanged.dispatch(camera);
  });

  signals.editorCleared.add(function () {
    controls.center.set(0, 0, 0);
  });

  signals.transformModeChanged.add(function (mode) {
    transformControls.setMode(mode);
  });

  signals.snapChanged.add(function (dist) {
    transformControls.setTranslationSnap(dist);
  });

  signals.spaceChanged.add(function (space) {
    transformControls.setSpace(space);
  });

  signals.objectSelected.add(function (object) {
    selectionBox.visible = false;
    transformControls.detach();
    if (object !== null) {
      if (object.geometry !== undefined &&
         object instanceof THREE.Sprite === false &&
         object.geometry.vertices && // hack
         object.geometry.vertices.length > 0
         ) {
        // Hack because object3D always has geometry :(
        if (object.geometry && object.geometry.vertices && object.geometry.vertices.length > 0) {
          selectionBox.update(object);
        }
        selectionBox.visible = true;
      }
      transformControls.attach(object);
    }
  });
/*
  signals.objectFocused.add(function (object) {
    controls.focus(object);
  });

  signals.geometryChanged.add(function (object) {
    if (object !== null) {
      selectionBox.update(object);
    }
  });
*/
  signals.objectAdded.add(function (object) {
    object.traverse(function (child) {
      objects.push(child);
    });
  });

  signals.objectChanged.add(function (object) {
    if (editor.selected === object) {
      // Hack because object3D always has geometry :(
      if (object.geometry && object.geometry.vertices && object.geometry.vertices.length > 0) {
        selectionBox.update(object);
      }
      transformControls.update();
    }

    if (object instanceof THREE.PerspectiveCamera) {
      object.updateProjectionMatrix();
    }

    if (editor.helpers[ object.id ] !== undefined) {
      editor.helpers[ object.id ].update();
    }
  });

  signals.objectRemoved.add(function (object) {
    object.traverse(function (child) {
      objects.splice(objects.indexOf(child), 1);
    });
  });
  signals.helperAdded.add(function (object) {
    objects.push(object.getObjectByName('picker'));
  });

  signals.helperRemoved.add(function (object) {
    objects.splice(objects.indexOf(object.getObjectByName('picker')), 1);
  });
  signals.windowResize.add(function () {
    camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
    camera.updateProjectionMatrix();
    // renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
  });

  signals.showGridChanged.add(function (showGrid) {
    grid.visible = showGrid;
  });

  signals.editorModeChanged.add(function (active) {
    if (active) {
      aframeEditor.editor.sceneEl.setActiveCamera(camera);
      document.querySelector('.a-enter-vr').style.display = 'none';
    } else {
      aframeEditor.editor.defaultCameraEl.setAttribute('camera', 'active', 'true');
      document.querySelector('.a-enter-vr').style.display = 'block';
    }
  });
}

module.exports = Viewport;

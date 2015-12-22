/* global aframeEditor THREE */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');
//var MouseControls = require('./mousecontrols.js');

function Viewport (editor, objects) {
  var signals = editor.signals;

  var container = {
    dom: editor.container
  };
  // helpers
  var scene = editor.scene;
  var sceneHelpers = editor.sceneHelpers;

  //var objects = [];

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
      selectionBox.update(object);
      if (editor.helpers[ object.id ] !== undefined) {
        editor.helpers[ object.id ].update();
      }

      console.log(transformControls.getMode());
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

  sceneHelpers.add(transformControls);

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

  // Removed: fog

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
          // ????
          //editor.selectEntity(object.userData.object);
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
    //!!!editor.signals.cameraChanged.dispatch(camera);
  });

  // signals
/*
  signals.editorCleared.add(function () {

    controls.center.set(0, 0, 0);
    //render();

  });
/*
  var clearColor;

  signals.themeChanged.add(function (value) {

    switch (value) {

      case 'css/light.css':
        grid.setColors(0x444444, 0x888888);
        clearColor = 0xaaaaaa;
        break;
      case 'css/dark.css':
        grid.setColors(0xbbbbbb, 0x888888);
        clearColor = 0x333333;
        break;

    }

    renderer.setClearColor(clearColor);

    render();

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

  signals.rendererChanged.add(function (newRenderer) {

    if (renderer !== null) {

      container.dom.removeChild(renderer.domElement);

    }

    renderer = newRenderer;

    renderer.autoClear = false;
    renderer.autoUpdateScene = false;
    renderer.setClearColor(clearColor);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);

    container.dom.appendChild(renderer.domElement);

    render();

  });

  signals.sceneGraphChanged.add(function () {

    render();

  });

  var saveTimeout;

  signals.cameraChanged.add(function () {

    render();

  });

  signals.objectSelected.add(function (object) {

    selectionBox.visible = false;
    transformControls.detach();

    if (object !== null) {

      if (object.geometry !== undefined &&
         object instanceof THREE.Sprite === false) {

        selectionBox.update(object);
        selectionBox.visible = true;

      }

      transformControls.attach(object);

    }

    render();

  });

  signals.objectFocused.add(function (object) {

    controls.focus(object);

  });

  signals.geometryChanged.add(function (object) {

    if (object !== null) {

      selectionBox.update(object);

    }

    render();

  });

  signals.objectAdded.add(function (object) {

    object.traverse(function (child) {

      objects.push(child);

    });

  });

  signals.objectChanged.add(function (object) {

    if (editor.selected === object) {

      selectionBox.update(object);
      transformControls.update();

    }

    if (object instanceof THREE.PerspectiveCamera) {

      object.updateProjectionMatrix();

    }

    if (editor.helpers[ object.id ] !== undefined) {

      editor.helpers[ object.id ].update();

    }

    render();

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

  signals.materialChanged.add(function (material) {

    render();

  });

  signals.fogTypeChanged.add(function (fogType) {

    if (fogType !== oldFogType) {

      if (fogType === "None") {

        scene.fog = null;

      } else if (fogType === "Fog") {

        scene.fog = new THREE.Fog(oldFogColor, oldFogNear, oldFogFar);

      } else if (fogType === "FogExp2") {

        scene.fog = new THREE.FogExp2(oldFogColor, oldFogDensity);

      }

      oldFogType = fogType;

    }

    render();

  });

  signals.fogColorChanged.add(function (fogColor) {

    oldFogColor = fogColor;

    updateFog(scene);

    render();

  });

  signals.fogParametersChanged.add(function (near, far, density) {

    oldFogNear = near;
    oldFogFar = far;
    oldFogDensity = density;

    updateFog(scene);

    render();

  });
*/
  signals.windowResize.add(function () {

    camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
    camera.updateProjectionMatrix();
    //renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
    //render();

  });
/*
  signals.showGridChanged.add(function (showGrid) {

    grid.visible = showGrid;
    render();

  });
*/

  signals.editorModeChanged.add(function (active) {

    if (active) {
      aframeEditor.editor.sceneEl.camera = camera;
    } else {
      aframeEditor.editor.sceneEl.camera = null;
    }
  });

};

module.exports = Viewport;

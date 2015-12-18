/* global THREE */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');
//var MouseControls = require('./mousecontrols.js');

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

  var objects=[];
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


  // object picking

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  // events

  var camera = this.camera; //?
  function getIntersects( point, objects ) {

    mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

    raycaster.setFromCamera( mouse, camera );

    return raycaster.intersectObjects( objects );

  }

  var onDownPosition = new THREE.Vector2();
  var onUpPosition = new THREE.Vector2();
  var onDoubleClickPosition = new THREE.Vector2();

  function getMousePosition( dom, x, y ) {

    var rect = dom.getBoundingClientRect();
    console.log(rect, x, y);
    return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

  }

  function handleClick() {
    console.log(onDownPosition,onUpPosition);
    if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

      var intersects = getIntersects( onUpPosition, objects );
      console.info(intersects);

      if ( intersects.length > 0 ) {

        var object = intersects[ 0 ].object;
        console.log(object);

        if ( object.userData.object !== undefined ) {

          // helper
          editor.select( object.userData.object );

        } else {

          editor.select( object );

        }

      } else {

        editor.select( null );

      }

//      render();

    }

  }

  function onMouseDown( event ) {
    event.preventDefault();

    var array = getMousePosition( editor.container, event.clientX, event.clientY );
    onDownPosition.fromArray( array );

    document.addEventListener( 'mouseup', onMouseUp, false );

  }

  function onMouseUp( event ) {
    console.error(event);
    var array = getMousePosition( editor.container, event.clientX, event.clientY );
    onUpPosition.fromArray( array );
    handleClick();

    document.removeEventListener( 'mouseup', onMouseUp, false );

  }

  function onTouchStart( event ) {

    var touch = event.changedTouches[ 0 ];

    var array = getMousePosition( editor.container, touch.clientX, touch.clientY );
    onDownPosition.fromArray( array );

    document.addEventListener( 'touchend', onTouchEnd, false );

  }

  function onTouchEnd( event ) {

    var touch = event.changedTouches[ 0 ];

    var array = getMousePosition( editor.container, touch.clientX, touch.clientY );
    onUpPosition.fromArray( array );

    handleClick();

    document.removeEventListener( 'touchend', onTouchEnd, false );

  }

  function onDoubleClick( event ) {

    var array = getMousePosition( editor.container, event.clientX, event.clientY );
    onDoubleClickPosition.fromArray( array );

    var intersects = getIntersects( onDoubleClickPosition, objects );

    if ( intersects.length > 0 ) {

      var intersect = intersects[ 0 ];

      signals.objectFocused.dispatch( intersect.object );

    }

  }

  editor.container.addEventListener( 'mousedown', onMouseDown, false );
  editor.container.addEventListener( 'touchstart', onTouchStart, false );
  editor.container.addEventListener( 'dblclick', onDoubleClick, false );

  var controls = new THREE.EditorControls(this.camera, editor.container);
  controls.addEventListener('change', function () {
    transformControls.update();
    //!!!editor.signals.cameraChanged.dispatch(this.camera);
  });
};

module.exports = Viewport;

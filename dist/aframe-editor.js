(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.aframeEditor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.EditorControls = function ( object, domElement ) {

	domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;
	this.center = new THREE.Vector3();

	// internals

	var scope = this;
	var vector = new THREE.Vector3();

	var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	var center = this.center;
	var normalMatrix = new THREE.Matrix3();
	var pointer = new THREE.Vector2();
	var pointerOld = new THREE.Vector2();

	// events

	var changeEvent = { type: 'change' };

	this.focus = function ( target, frame ) {

		var scale = new THREE.Vector3();
		target.matrixWorld.decompose( center, new THREE.Quaternion(), scale );

		if ( frame && target.geometry ) {

			scale = ( scale.x + scale.y + scale.z ) / 3;
			center.add( target.geometry.boundingSphere.center.clone().multiplyScalar( scale ) );
			var radius = target.geometry.boundingSphere.radius * ( scale );
			var pos = object.position.clone().sub( center ).normalize().multiplyScalar( radius * 2 );
			object.position.copy( center ).add( pos );

		}

		object.lookAt( center );

		scope.dispatchEvent( changeEvent );

	};

	this.pan = function ( delta ) {

		var distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );
		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );
		center.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.zoom = function ( delta ) {

		var distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );
/*
    console.log(object.position);
    object.zoom+=delta.z;
    console.log(object.zoom,delta);
    object.updateProjectionMatrix();
*/
		object.position.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.rotate = function ( delta ) {

		vector.copy( object.position ).sub( center );

		var theta = Math.atan2( vector.x, vector.z );
		var phi = Math.atan2( Math.sqrt( vector.x * vector.x + vector.z * vector.z ), vector.y );

		theta += delta.x;
		phi += delta.y;

		var EPS = 0.000001;

		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = vector.length();

		vector.x = radius * Math.sin( phi ) * Math.sin( theta );
		vector.y = radius * Math.cos( phi );
		vector.z = radius * Math.sin( phi ) * Math.cos( theta );

		object.position.copy( center ).add( vector );

		object.lookAt( center );

		scope.dispatchEvent( changeEvent );

	};

	// mouse

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		if ( event.button === 0 ) {

			state = STATE.ROTATE;

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

		} else if ( event.button === 2 ) {

			state = STATE.PAN;

		}

		pointerOld.set( event.clientX, event.clientY );

		domElement.addEventListener( 'mousemove', onMouseMove, false );
		domElement.addEventListener( 'mouseup', onMouseUp, false );
		domElement.addEventListener( 'mouseout', onMouseUp, false );
		domElement.addEventListener( 'dblclick', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		pointer.set( event.clientX, event.clientY );

		var movementX = pointer.x - pointerOld.x;
		var movementY = pointer.y - pointerOld.y;

		if ( state === STATE.ROTATE ) {

			scope.rotate( new THREE.Vector3( - movementX * 0.005, - movementY * 0.005, 0 ) );

		} else if ( state === STATE.ZOOM ) {

			scope.zoom( new THREE.Vector3( 0, 0, movementY ) );

		} else if ( state === STATE.PAN ) {

			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

		}

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseUp( event ) {

		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		event.preventDefault();

		// if ( scope.enabled === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) {

			// WebKit / Opera / Explorer 9

			delta = - event.wheelDelta;

		} else if ( event.detail ) {

			// Firefox

			delta = event.detail * 10;

		}

		scope.zoom( new THREE.Vector3( 0, 0, delta ) );

	}

	function contextmenu( event ) {

		event.preventDefault();

	}

	this.dispose = function() {

		domElement.removeEventListener( 'contextmenu', contextmenu, false );
		domElement.removeEventListener( 'mousedown', onMouseDown, false );
		domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
		domElement.removeEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );

		domElement.removeEventListener( 'touchstart', touchStart, false );
		domElement.removeEventListener( 'touchmove', touchMove, false );

	}

	domElement.addEventListener( 'contextmenu', contextmenu, false );
	domElement.addEventListener( 'mousedown', onMouseDown, false );
	domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	domElement.addEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

	// touch

	var touch = new THREE.Vector3();

	var touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	var prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	var prevDistance = null;

	function touchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				prevDistance = touches[ 0 ].distanceTo( touches[ 1 ] );
				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}


	function touchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		function getClosest( touch, touches ) {

			var closest = touches[ 0 ];

			for ( var i in touches ) {

				if ( closest.distanceTo( touch ) > touches[ i ].distanceTo( touch ) ) closest = touches[ i ];

			}

			return closest;

		}

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ], prevTouches ) ).multiplyScalar( - 0.005 ) );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				distance = touches[ 0 ].distanceTo( touches[ 1 ] );
				scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
				prevDistance = distance;


				var offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ], prevTouches ) );
				var offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ], prevTouches ) );
				offset0.x = - offset0.x;
				offset1.x = - offset1.x;

				scope.pan( offset0.add( offset1 ).multiplyScalar( 0.5 ) );

				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}

	domElement.addEventListener( 'touchstart', touchStart, false );
	domElement.addEventListener( 'touchmove', touchMove, false );

};

THREE.EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.EditorControls.prototype.constructor = THREE.EditorControls;

},{}],2:[function(require,module,exports){
/**
 * @author arodic / https://github.com/arodic
 */
 /*jshint sub:true*/

( function () {

	'use strict';


	var GizmoMaterial = function ( parameters ) {

		THREE.MeshBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.side = THREE.FrontSide;
		this.transparent = true;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setRGB( 1, 1, 0 );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;

			}

		};

	};

	GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );
	GizmoMaterial.prototype.constructor = GizmoMaterial;


	var GizmoLineMaterial = function ( parameters ) {

		THREE.LineBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.transparent = true;
		this.linewidth = 1;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setRGB( 1, 1, 0 );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;

			}

		};

	};

	GizmoLineMaterial.prototype = Object.create( THREE.LineBasicMaterial.prototype );
	GizmoLineMaterial.prototype.constructor = GizmoLineMaterial;


	var pickerMaterial = new GizmoMaterial( { visible: false, transparent: false } );


	THREE.TransformGizmo = function () {

		var scope = this;

		this.init = function () {

			THREE.Object3D.call( this );

			this.handles = new THREE.Object3D();
			this.pickers = new THREE.Object3D();
			this.planes = new THREE.Object3D();

			this.add( this.handles );
			this.add( this.pickers );
			this.add( this.planes );

			//// PLANES

			var planeGeometry = new THREE.PlaneBufferGeometry( 50, 50, 2, 2 );
			var planeMaterial = new THREE.MeshBasicMaterial( { visible: false, side: THREE.DoubleSide } );

			var planes = {
				"XY":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"YZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XYZE": new THREE.Mesh( planeGeometry, planeMaterial )
			};

			this.activePlane = planes[ "XYZE" ];

			planes[ "YZ" ].rotation.set( 0, Math.PI / 2, 0 );
			planes[ "XZ" ].rotation.set( - Math.PI / 2, 0, 0 );

			for ( var i in planes ) {

				planes[ i ].name = i;
				this.planes.add( planes[ i ] );
				this.planes[ i ] = planes[ i ];

			}

			//// HANDLES AND PICKERS

			var setupGizmos = function( gizmoMap, parent ) {

				for ( var name in gizmoMap ) {

					for ( i = gizmoMap[ name ].length; i --; ) {

						var object = gizmoMap[ name ][ i ][ 0 ];
						var position = gizmoMap[ name ][ i ][ 1 ];
						var rotation = gizmoMap[ name ][ i ][ 2 ];

						object.name = name;

						if ( position ) object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] );
						if ( rotation ) object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] );

						parent.add( object );

					}

				}

			};

			setupGizmos( this.handleGizmos, this.handles );
			setupGizmos( this.pickerGizmos, this.pickers );

			// reset Transformations

			this.traverse( function ( child ) {

				if ( child instanceof THREE.Mesh ) {

					child.updateMatrix();

					var tempGeometry = child.geometry.clone();
					tempGeometry.applyMatrix( child.matrix );
					child.geometry = tempGeometry;

					child.position.set( 0, 0, 0 );
					child.rotation.set( 0, 0, 0 );
					child.scale.set( 1, 1, 1 );

				}

			} );

		};

		this.highlight = function ( axis ) {

			this.traverse( function( child ) {

				if ( child.material && child.material.highlight ) {

					if ( child.name === axis ) {

						child.material.highlight( true );

					} else {

						child.material.highlight( false );

					}

				}

			} );

		};

	};

	THREE.TransformGizmo.prototype = Object.create( THREE.Object3D.prototype );
	THREE.TransformGizmo.prototype.constructor = THREE.TransformGizmo;

	THREE.TransformGizmo.prototype.update = function ( rotation, eye ) {

		var vec1 = new THREE.Vector3( 0, 0, 0 );
		var vec2 = new THREE.Vector3( 0, 1, 0 );
		var lookAtMatrix = new THREE.Matrix4();

		this.traverse( function( child ) {

			if ( child.name.search( "E" ) !== - 1 ) {

				child.quaternion.setFromRotationMatrix( lookAtMatrix.lookAt( eye, vec1, vec2 ) );

			} else if ( child.name.search( "X" ) !== - 1 || child.name.search( "Y" ) !== - 1 || child.name.search( "Z" ) !== - 1 ) {

				child.quaternion.setFromEuler( rotation );

			}

		} );

	};

	THREE.TransformGizmoTranslate = function () {

		THREE.TransformGizmo.call( this );

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, 0.05, 0.2, 12, 1, false ) );
		mesh.position.y = 0.5;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );

		var lineXGeometry = new THREE.BufferGeometry();
		lineXGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  1, 0, 0 ], 3 ) );

		var lineYGeometry = new THREE.BufferGeometry();
		lineYGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  0, 1, 0 ], 3 ) );

		var lineZGeometry = new THREE.BufferGeometry();
		lineZGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  0, 0, 1 ], 3 ) );

		this.handleGizmos = {

			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],

			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 0.5, 0 ] ],
				[	new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],

			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],

			XYZ: [
				[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.1, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, 0 ] ]
			],

			XY: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ), [ 0.15, 0.15, 0 ] ]
			],

			YZ: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ), [ 0, 0.15, 0.15 ], [ 0, Math.PI / 2, 0 ] ]
			],

			XZ: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ), [ 0.15, 0, 0.15 ], [ - Math.PI / 2, 0, 0 ] ]
			]

		};

		this.pickerGizmos = {

			X: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0.6, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]
			],

			Y: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0.6, 0 ] ]
			],

			Z: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, 0.6 ], [ Math.PI / 2, 0, 0 ] ]
			],

			XYZ: [
				[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.2, 0 ), pickerMaterial ) ]
			],

			XY: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0.2, 0.2, 0 ] ]
			],

			YZ: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0, 0.2, 0.2 ], [ 0, Math.PI / 2, 0 ] ]
			],

			XZ: [
				[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0.2, 0, 0.2 ], [ - Math.PI / 2, 0, 0 ] ]
			]

		};

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis === "X" ) {

				this.activePlane = this.planes[ "XY" ];

				if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];

			}

			if ( axis === "Y" ) {

				this.activePlane = this.planes[ "XY" ];

				if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];

			}

			if ( axis === "Z" ) {

				this.activePlane = this.planes[ "XZ" ];

				if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];

			}

			if ( axis === "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

			if ( axis === "XY" ) this.activePlane = this.planes[ "XY" ];

			if ( axis === "YZ" ) this.activePlane = this.planes[ "YZ" ];

			if ( axis === "XZ" ) this.activePlane = this.planes[ "XZ" ];

		};

		this.init();

	};

	THREE.TransformGizmoTranslate.prototype = Object.create( THREE.TransformGizmo.prototype );
	THREE.TransformGizmoTranslate.prototype.constructor = THREE.TransformGizmoTranslate;

	THREE.TransformGizmoRotate = function () {

		THREE.TransformGizmo.call( this );

		var CircleGeometry = function ( radius, facing, arc ) {

			var geometry = new THREE.BufferGeometry();
			var vertices = [];
			arc = arc ? arc : 1;

			for ( var i = 0; i <= 64 * arc; ++ i ) {

				if ( facing === 'x' ) vertices.push( 0, Math.cos( i / 32 * Math.PI ) * radius, Math.sin( i / 32 * Math.PI ) * radius );
				if ( facing === 'y' ) vertices.push( Math.cos( i / 32 * Math.PI ) * radius, 0, Math.sin( i / 32 * Math.PI ) * radius );
				if ( facing === 'z' ) vertices.push( Math.sin( i / 32 * Math.PI ) * radius, Math.cos( i / 32 * Math.PI ) * radius, 0 );

			}

			geometry.addAttribute( 'position', new THREE.Float32Attribute( vertices, 3 ) );
			return geometry;

		};

		this.handleGizmos = {

			X: [
				[ new THREE.Line( new CircleGeometry( 1, 'x', 0.5 ), new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],

			Y: [
				[ new THREE.Line( new CircleGeometry( 1, 'y', 0.5 ), new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],

			Z: [
				[ new THREE.Line( new CircleGeometry( 1, 'z', 0.5 ), new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],

			E: [
				[ new THREE.Line( new CircleGeometry( 1.25, 'z', 1 ), new GizmoLineMaterial( { color: 0xcccc00 } ) ) ]
			],

			XYZE: [
				[ new THREE.Line( new CircleGeometry( 1, 'z', 1 ), new GizmoLineMaterial( { color: 0x787878 } ) ) ]
			]

		};

		this.pickerGizmos = {

			X: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), pickerMaterial ), [ 0, 0, 0 ], [ 0, - Math.PI / 2, - Math.PI / 2 ] ]
			],

			Y: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), pickerMaterial ), [ 0, 0, 0 ], [ Math.PI / 2, 0, 0 ] ]
			],

			Z: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), pickerMaterial ), [ 0, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]
			],

			E: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 1.25, 0.12, 2, 24 ), pickerMaterial ) ]
			],

			XYZE: [
				[ new THREE.Mesh( new THREE.Geometry() ) ]// TODO
			]

		};

		this.setActivePlane = function ( axis ) {

			if ( axis === "E" ) this.activePlane = this.planes[ "XYZE" ];

			if ( axis === "X" ) this.activePlane = this.planes[ "YZ" ];

			if ( axis === "Y" ) this.activePlane = this.planes[ "XZ" ];

			if ( axis === "Z" ) this.activePlane = this.planes[ "XY" ];

		};

		this.update = function ( rotation, eye2 ) {

			THREE.TransformGizmo.prototype.update.apply( this, arguments );

			var group = {

				handles: this[ "handles" ],
				pickers: this[ "pickers" ],

			};

			var tempMatrix = new THREE.Matrix4();
			var worldRotation = new THREE.Euler( 0, 0, 1 );
			var tempQuaternion = new THREE.Quaternion();
			var unitX = new THREE.Vector3( 1, 0, 0 );
			var unitY = new THREE.Vector3( 0, 1, 0 );
			var unitZ = new THREE.Vector3( 0, 0, 1 );
			var quaternionX = new THREE.Quaternion();
			var quaternionY = new THREE.Quaternion();
			var quaternionZ = new THREE.Quaternion();
			var eye = eye2.clone();

			worldRotation.copy( this.planes[ "XY" ].rotation );
			tempQuaternion.setFromEuler( worldRotation );

			tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
			eye.applyMatrix4( tempMatrix );

			this.traverse( function( child ) {

				tempQuaternion.setFromEuler( worldRotation );

				if ( child.name === "X" ) {

					quaternionX.setFromAxisAngle( unitX, Math.atan2( - eye.y, eye.z ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					child.quaternion.copy( tempQuaternion );

				}

				if ( child.name === "Y" ) {

					quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
					child.quaternion.copy( tempQuaternion );

				}

				if ( child.name === "Z" ) {

					quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
					child.quaternion.copy( tempQuaternion );

				}

			} );

		};

		this.init();

	};

	THREE.TransformGizmoRotate.prototype = Object.create( THREE.TransformGizmo.prototype );
	THREE.TransformGizmoRotate.prototype.constructor = THREE.TransformGizmoRotate;

	THREE.TransformGizmoScale = function () {

		THREE.TransformGizmo.call( this );

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ) );
		mesh.position.y = 0.5;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );

		var lineXGeometry = new THREE.BufferGeometry();
		lineXGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  1, 0, 0 ], 3 ) );

		var lineYGeometry = new THREE.BufferGeometry();
		lineYGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  0, 1, 0 ], 3 ) );

		var lineZGeometry = new THREE.BufferGeometry();
		lineZGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0,  0, 0, 1 ], 3 ) );

		this.handleGizmos = {

			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],

			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 0.5, 0 ] ],
				[ new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],

			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],

			XYZ: [
				[ new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			]

		};

		this.pickerGizmos = {

			X: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0.6, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]
			],

			Y: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0.6, 0 ] ]
			],

			Z: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, 0.6 ], [ Math.PI / 2, 0, 0 ] ]
			],

			XYZ: [
				[ new THREE.Mesh( new THREE.BoxGeometry( 0.4, 0.4, 0.4 ), pickerMaterial ) ]
			]

		};

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis === "X" ) {

				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];

			}

			if ( axis === "Y" ) {

				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];

			}

			if ( axis === "Z" ) {

				this.activePlane = this.planes[ "XZ" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];

			}

			if ( axis === "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

		};

		this.init();

	};

	THREE.TransformGizmoScale.prototype = Object.create( THREE.TransformGizmo.prototype );
	THREE.TransformGizmoScale.prototype.constructor = THREE.TransformGizmoScale;

	THREE.TransformControls = function ( camera, domElement ) {

		// TODO: Make non-uniform scale and rotate play nice in hierarchies
		// TODO: ADD RXYZ contol

		THREE.Object3D.call( this );

		domElement = ( domElement !== undefined ) ? domElement : document;

		this.object = undefined;
		this.visible = false;
		this.translationSnap = null;
		this.rotationSnap = null;
		this.space = "world";
		this.size = 1;
		this.axis = null;

		var scope = this;

		var _mode = "translate";
		var _dragging = false;
		var _plane = "XY";
		var _gizmo = {

			"translate": new THREE.TransformGizmoTranslate(),
			"rotate": new THREE.TransformGizmoRotate(),
			"scale": new THREE.TransformGizmoScale()
		};

		for ( var type in _gizmo ) {

			var gizmoObj = _gizmo[ type ];

			gizmoObj.visible = ( type === _mode );
			this.add( gizmoObj );

		}

		var changeEvent = { type: "change" };
		var mouseDownEvent = { type: "mouseDown" };
		var mouseUpEvent = { type: "mouseUp", mode: _mode };
		var objectChangeEvent = { type: "objectChange" };

		var ray = new THREE.Raycaster();
		var pointerVector = new THREE.Vector2();

		var point = new THREE.Vector3();
		var offset = new THREE.Vector3();

		var rotation = new THREE.Vector3();
		var offsetRotation = new THREE.Vector3();
		var scale = 1;

		var lookAtMatrix = new THREE.Matrix4();
		var eye = new THREE.Vector3();

		var tempMatrix = new THREE.Matrix4();
		var tempVector = new THREE.Vector3();
		var tempQuaternion = new THREE.Quaternion();
		var unitX = new THREE.Vector3( 1, 0, 0 );
		var unitY = new THREE.Vector3( 0, 1, 0 );
		var unitZ = new THREE.Vector3( 0, 0, 1 );

		var quaternionXYZ = new THREE.Quaternion();
		var quaternionX = new THREE.Quaternion();
		var quaternionY = new THREE.Quaternion();
		var quaternionZ = new THREE.Quaternion();
		var quaternionE = new THREE.Quaternion();

		var oldPosition = new THREE.Vector3();
		var oldScale = new THREE.Vector3();
		var oldRotationMatrix = new THREE.Matrix4();

		var parentRotationMatrix  = new THREE.Matrix4();
		var parentScale = new THREE.Vector3();

		var worldPosition = new THREE.Vector3();
		var worldRotation = new THREE.Euler();
		var worldRotationMatrix  = new THREE.Matrix4();
		var camPosition = new THREE.Vector3();
		var camRotation = new THREE.Euler();

		domElement.addEventListener( "mousedown", onPointerDown, false );
		domElement.addEventListener( "touchstart", onPointerDown, false );

		domElement.addEventListener( "mousemove", onPointerHover, false );
		domElement.addEventListener( "touchmove", onPointerHover, false );

		domElement.addEventListener( "mousemove", onPointerMove, false );
		domElement.addEventListener( "touchmove", onPointerMove, false );

		domElement.addEventListener( "mouseup", onPointerUp, false );
		domElement.addEventListener( "mouseout", onPointerUp, false );
		domElement.addEventListener( "touchend", onPointerUp, false );
		domElement.addEventListener( "touchcancel", onPointerUp, false );
		domElement.addEventListener( "touchleave", onPointerUp, false );

		this.dispose = function () {

			domElement.removeEventListener( "mousedown", onPointerDown );
			domElement.removeEventListener( "touchstart", onPointerDown );

			domElement.removeEventListener( "mousemove", onPointerHover );
			domElement.removeEventListener( "touchmove", onPointerHover );

			domElement.removeEventListener( "mousemove", onPointerMove );
			domElement.removeEventListener( "touchmove", onPointerMove );

			domElement.removeEventListener( "mouseup", onPointerUp );
			domElement.removeEventListener( "mouseout", onPointerUp );
			domElement.removeEventListener( "touchend", onPointerUp );
			domElement.removeEventListener( "touchcancel", onPointerUp );
			domElement.removeEventListener( "touchleave", onPointerUp );

		};

		this.attach = function ( object ) {

			this.object = object;
			this.visible = true;
			this.update();

		};

		this.detach = function () {

			this.object = undefined;
			this.visible = false;
			this.axis = null;

		};

		this.getMode = function () {

			return _mode;

		};

		this.setMode = function ( mode ) {

			_mode = mode ? mode : _mode;

			if ( _mode === "scale" ) scope.space = "local";

			for ( var type in _gizmo ) _gizmo[ type ].visible = ( type === _mode );

			this.update();
			scope.dispatchEvent( changeEvent );

		};

		this.setTranslationSnap = function ( translationSnap ) {

			scope.translationSnap = translationSnap;

		};

		this.setRotationSnap = function ( rotationSnap ) {

			scope.rotationSnap = rotationSnap;

		};

		this.setSize = function ( size ) {

			scope.size = size;
			this.update();
			scope.dispatchEvent( changeEvent );

		};

		this.setSpace = function ( space ) {

			scope.space = space;
			this.update();
			scope.dispatchEvent( changeEvent );

		};

		this.update = function () {

			if ( scope.object !== undefined ) {
				scope.object.updateMatrixWorld();
				worldPosition.setFromMatrixPosition( scope.object.matrixWorld );
				worldRotation.setFromRotationMatrix( tempMatrix.extractRotation( scope.object.matrixWorld ) );
			}

			camera.updateMatrixWorld();
			camPosition.setFromMatrixPosition( camera.matrixWorld );
			camRotation.setFromRotationMatrix( tempMatrix.extractRotation( camera.matrixWorld ) );

			scale = worldPosition.distanceTo( camPosition ) / 6 * scope.size;
			this.position.copy( worldPosition );
			this.scale.set( scale, scale, scale );

			eye.copy( camPosition ).sub( worldPosition ).normalize();

			if ( scope.space === "local" ) {

				_gizmo[ _mode ].update( worldRotation, eye );

			} else if ( scope.space === "world" ) {

				_gizmo[ _mode ].update( new THREE.Euler(), eye );

			}

			_gizmo[ _mode ].highlight( scope.axis );

		};

		function onPointerHover( event ) {
			if ( scope.object === undefined || _dragging === true || ( event.button !== undefined && event.button !== 0 ) ) return;

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );
			var axis = null;

			if ( intersect ) {

				axis = intersect.object.name;

				event.preventDefault();

			}

			if ( scope.axis !== axis ) {

				scope.axis = axis;
				scope.update();
				scope.dispatchEvent( changeEvent );

			}

		}

		function onPointerDown( event ) {

			if ( scope.object === undefined || _dragging === true || ( event.button !== undefined && event.button !== 0 ) ) return;

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			if ( pointer.button === 0 || pointer.button === undefined ) {

				var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );

				if ( intersect ) {

					event.preventDefault();
					event.stopPropagation();

					scope.dispatchEvent( mouseDownEvent );

					scope.axis = intersect.object.name;

					scope.update();

					eye.copy( camPosition ).sub( worldPosition ).normalize();

					_gizmo[ _mode ].setActivePlane( scope.axis, eye );

					var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

					if ( planeIntersect ) {

						oldPosition.copy( scope.object.position );
						oldScale.copy( scope.object.scale );

						oldRotationMatrix.extractRotation( scope.object.matrix );
						worldRotationMatrix.extractRotation( scope.object.matrixWorld );

						parentRotationMatrix.extractRotation( scope.object.parent.matrixWorld );
						parentScale.setFromMatrixScale( tempMatrix.getInverse( scope.object.parent.matrixWorld ) );

						offset.copy( planeIntersect.point );

					}

				}

			}

			_dragging = true;

		}

		function onPointerMove( event ) {

			if ( scope.object === undefined || scope.axis === null || _dragging === false || ( event.button !== undefined && event.button !== 0 ) ) return;

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

			if ( planeIntersect === false ) return;

			event.preventDefault();
			event.stopPropagation();

			point.copy( planeIntersect.point );

			if ( _mode === "translate" ) {

				point.sub( offset );
				point.multiply( parentScale );

				if ( scope.space === "local" ) {

					point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					if ( scope.axis.search( "X" ) === - 1 ) point.x = 0;
					if ( scope.axis.search( "Y" ) === - 1 ) point.y = 0;
					if ( scope.axis.search( "Z" ) === - 1 ) point.z = 0;

					point.applyMatrix4( oldRotationMatrix );

					scope.object.position.copy( oldPosition );
					scope.object.position.add( point );

				}

				if ( scope.space === "world" || scope.axis.search( "XYZ" ) !== - 1 ) {

					if ( scope.axis.search( "X" ) === - 1 ) point.x = 0;
					if ( scope.axis.search( "Y" ) === - 1 ) point.y = 0;
					if ( scope.axis.search( "Z" ) === - 1 ) point.z = 0;

					point.applyMatrix4( tempMatrix.getInverse( parentRotationMatrix ) );

					scope.object.position.copy( oldPosition );
					scope.object.position.add( point );

				}

				if ( scope.translationSnap !== null ) {

					if ( scope.space === "local" ) {

						scope.object.position.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					}

					if ( scope.axis.search( "X" ) !== - 1 ) scope.object.position.x = Math.round( scope.object.position.x / scope.translationSnap ) * scope.translationSnap;
					if ( scope.axis.search( "Y" ) !== - 1 ) scope.object.position.y = Math.round( scope.object.position.y / scope.translationSnap ) * scope.translationSnap;
					if ( scope.axis.search( "Z" ) !== - 1 ) scope.object.position.z = Math.round( scope.object.position.z / scope.translationSnap ) * scope.translationSnap;

					if ( scope.space === "local" ) {

						scope.object.position.applyMatrix4( worldRotationMatrix );

					}

				}

			} else if ( _mode === "scale" ) {

				point.sub( offset );
				point.multiply( parentScale );

				if ( scope.space === "local" ) {

					if ( scope.axis === "XYZ" ) {

						scale = 1 + ( ( point.y ) / 50 );

						scope.object.scale.x = oldScale.x * scale;
						scope.object.scale.y = oldScale.y * scale;
						scope.object.scale.z = oldScale.z * scale;

					} else {

						point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

						if ( scope.axis === "X" ) scope.object.scale.x = oldScale.x * ( 1 + point.x / 50 );
						if ( scope.axis === "Y" ) scope.object.scale.y = oldScale.y * ( 1 + point.y / 50 );
						if ( scope.axis === "Z" ) scope.object.scale.z = oldScale.z * ( 1 + point.z / 50 );

					}

				}

			} else if ( _mode === "rotate" ) {

				point.sub( worldPosition );
				point.multiply( parentScale );
				tempVector.copy( offset ).sub( worldPosition );
				tempVector.multiply( parentScale );

				if ( scope.axis === "E" ) {

					point.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );
					tempVector.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

					quaternionE.setFromAxisAngle( eye, rotation.z - offsetRotation.z );
					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionE );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				} else if ( scope.axis === "XYZE" ) {

					quaternionE.setFromEuler( point.clone().cross( tempVector ).normalize() ); // rotation axis

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );
					quaternionX.setFromAxisAngle( quaternionE, - point.clone().angleTo( tempVector ) );
					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				} else if ( scope.space === "local" ) {

					point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					tempVector.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

					quaternionXYZ.setFromRotationMatrix( oldRotationMatrix );

					if ( scope.rotationSnap !== null ) {

						quaternionX.setFromAxisAngle( unitX, Math.round( ( rotation.x - offsetRotation.x ) / scope.rotationSnap ) * scope.rotationSnap );
						quaternionY.setFromAxisAngle( unitY, Math.round( ( rotation.y - offsetRotation.y ) / scope.rotationSnap ) * scope.rotationSnap );
						quaternionZ.setFromAxisAngle( unitZ, Math.round( ( rotation.z - offsetRotation.z ) / scope.rotationSnap ) * scope.rotationSnap );

					} else {

						quaternionX.setFromAxisAngle( unitX, rotation.x - offsetRotation.x );
						quaternionY.setFromAxisAngle( unitY, rotation.y - offsetRotation.y );
						quaternionZ.setFromAxisAngle( unitZ, rotation.z - offsetRotation.z );

					}

					if ( scope.axis === "X" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionX );
					if ( scope.axis === "Y" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionY );
					if ( scope.axis === "Z" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionZ );

					scope.object.quaternion.copy( quaternionXYZ );

				} else if ( scope.space === "world" ) {

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

					if ( scope.rotationSnap !== null ) {

						quaternionX.setFromAxisAngle( unitX, Math.round( ( rotation.x - offsetRotation.x ) / scope.rotationSnap ) * scope.rotationSnap );
						quaternionY.setFromAxisAngle( unitY, Math.round( ( rotation.y - offsetRotation.y ) / scope.rotationSnap ) * scope.rotationSnap );
						quaternionZ.setFromAxisAngle( unitZ, Math.round( ( rotation.z - offsetRotation.z ) / scope.rotationSnap ) * scope.rotationSnap );

					} else {

						quaternionX.setFromAxisAngle( unitX, rotation.x - offsetRotation.x );
						quaternionY.setFromAxisAngle( unitY, rotation.y - offsetRotation.y );
						quaternionZ.setFromAxisAngle( unitZ, rotation.z - offsetRotation.z );

					}

					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					if ( scope.axis === "X" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					if ( scope.axis === "Y" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
					if ( scope.axis === "Z" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				}

			}

			scope.update();
			scope.dispatchEvent( changeEvent );
			scope.dispatchEvent( objectChangeEvent );

		}

		function onPointerUp( event ) {

			if ( event.button !== undefined && event.button !== 0 ) return;

			if ( _dragging && ( scope.axis !== null ) ) {

				mouseUpEvent.mode = _mode;
				scope.dispatchEvent( mouseUpEvent )

			}

			_dragging = false;
			onPointerHover( event );

		}

		function intersectObjects( pointer, objects ) {

			var rect = domElement.getBoundingClientRect();
			var x = ( pointer.clientX - rect.left ) / rect.width;
			var y = ( pointer.clientY - rect.top ) / rect.height;
			pointerVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1 );
			ray.setFromCamera( pointerVector, camera );

			var intersections = ray.intersectObjects( objects, true );
			return intersections[ 0 ] ? intersections[ 0 ] : false;

		}

	};

	THREE.TransformControls.prototype = Object.create( THREE.Object3D.prototype );
	THREE.TransformControls.prototype.constructor = THREE.TransformControls;

}() );

},{}],3:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

var Sortable = require('sortablejs');

var UI = {};

UI.Element = function ( dom ) {

  this.dom = dom;

};

UI.Element.prototype = {

  add: function () {

    for ( var i = 0; i < arguments.length; i ++ ) {

      var argument = arguments[ i ];

      if ( argument instanceof UI.Element ) {

        this.dom.appendChild( argument.dom );

      } else {

        console.error( 'UI.Element:', argument, 'is not an instance of UI.Element.' );

      }

    }

    return this;

  },

  remove: function () {

    for ( var i = 0; i < arguments.length; i ++ ) {

      var argument = arguments[ i ];

      if ( argument instanceof UI.Element ) {

        this.dom.removeChild( argument.dom );

      } else {

        console.error( 'UI.Element:', argument, 'is not an instance of UI.Element.' );

      }

    }

    return this;

  },

  clear: function () {

    while ( this.dom.children.length ) {

      this.dom.removeChild( this.dom.lastChild );

    }

  },

  setId: function ( id ) {

    this.dom.id = id;

    return this;

  },

  getId: function () {

    return this.dom.id;

  },

  setClass: function ( name ) {

    this.dom.className = name;

    return this;

  },

  setStyle: function ( style, array ) {

    for ( var i = 0; i < array.length; i ++ ) {

      this.dom.style[ style ] = array[ i ];

    }

    return this;

  },

  show: function () {

      this.dom.style.display = 'block';
      this.visible = true;

  },

  hide: function () {

      this.dom.style.display = 'none';
      this.visible = false;

  },

  setDisabled: function ( value ) {

    this.dom.disabled = value;

    return this;

  },

  setTextContent: function ( value ) {

    this.dom.textContent = value;

    return this;

  }

};

// properties

var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

properties.forEach( function ( property ) {

  var method = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

  UI.Element.prototype[ method ] = function () {

    this.setStyle( property, arguments );

    return this;

  };

} );

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'DblClick', 'Change' ];

events.forEach( function ( event ) {

  var method = 'on' + event;

  UI.Element.prototype[ method ] = function ( callback ) {

    this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );

    return this;

  };

} );

// Span

UI.Span = function () {

  UI.Element.call( this );

  this.dom = document.createElement( 'span' );

  return this;

};

UI.Span.prototype = Object.create( UI.Element.prototype );
UI.Span.prototype.constructor = UI.Span;

// Div

UI.Div = function () {

  UI.Element.call( this );

  this.dom = document.createElement( 'div' );

  return this;

};

UI.Div.prototype = Object.create( UI.Element.prototype );
UI.Div.prototype.constructor = UI.Div;

// Row

UI.Row = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Row';

  this.dom = dom;

  return this;

};

UI.Row.prototype = Object.create( UI.Element.prototype );
UI.Row.prototype.constructor = UI.Row;

// Panel

UI.Panel = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Panel';

  this.dom = dom;

  return this;

};

UI.Panel.prototype = Object.create( UI.Element.prototype );
UI.Panel.prototype.constructor = UI.Panel;


// Collapsible Panel

UI.CollapsiblePanel = function () {

  UI.Panel.call( this );

  this.setClass( 'Panel Collapsible' );

  var scope = this;

  this.static = new UI.Panel();
  this.static.setClass( 'Static' );
  this.static.onClick( function () {

    scope.toggle();

  } );
  this.dom.appendChild( this.static.dom );

  this.contents = new UI.Panel();
  this.contents.setClass( 'Content' );
  this.dom.appendChild( this.contents.dom );

  var button = new UI.Panel();
  button.setClass( 'Button' );
  this.static.add( button );

  this.isCollapsed = false;

  return this;

};

UI.CollapsiblePanel.prototype = Object.create( UI.Panel.prototype );
UI.CollapsiblePanel.prototype.constructor = UI.CollapsiblePanel;

UI.CollapsiblePanel.prototype.addStatic = function () {

  this.static.add.apply( this.static, arguments );
  return this;

};

UI.CollapsiblePanel.prototype.removeStatic = function () {

  this.static.remove.apply( this.static, arguments );
  return this;

};

UI.CollapsiblePanel.prototype.clearStatic = function () {

  this.static.clear();
  return this;

};

UI.CollapsiblePanel.prototype.add = function () {

  this.contents.add.apply( this.contents, arguments );
  return this;

};

UI.CollapsiblePanel.prototype.remove = function () {

  this.contents.remove.apply( this.contents, arguments );
  return this;

};

UI.CollapsiblePanel.prototype.clear = function () {

  this.contents.clear();
  return this;

};

UI.CollapsiblePanel.prototype.toggle = function() {

  this.setCollapsed( ! this.isCollapsed );

};

UI.CollapsiblePanel.prototype.collapse = function() {

  this.setCollapsed( true );

};

UI.CollapsiblePanel.prototype.expand = function() {

  this.setCollapsed( false );

};

UI.CollapsiblePanel.prototype.setCollapsed = function( boolean ) {

  if ( boolean ) {

    this.dom.classList.add( 'collapsed' );

  } else {

    this.dom.classList.remove( 'collapsed' );

  }

  this.isCollapsed = boolean;

  if ( this.onCollapsedChangeCallback !== undefined ) {

    this.onCollapsedChangeCallback( boolean );

  }

};

UI.CollapsiblePanel.prototype.onCollapsedChange = function ( callback ) {

  this.onCollapsedChangeCallback = callback;

};

// Text

UI.Text = function ( text ) {

  UI.Element.call( this );

  var dom = document.createElement( 'span' );
  dom.className = 'Text';
  dom.style.cursor = 'default';
  dom.style.display = 'inline-block';
  dom.style.verticalAlign = 'middle';

  this.dom = dom;
  this.setValue( text );

  return this;

};

UI.Text.prototype = Object.create( UI.Element.prototype );
UI.Text.prototype.constructor = UI.Text;

UI.Text.prototype.getValue = function () {

  return this.dom.textContent;

};

UI.Text.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.textContent = value;

  }

  return this;

};


// Input

UI.Input = function ( text ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Input';
  dom.style.padding = '2px';
  dom.style.border = '1px solid transparent';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;
  this.setValue( text );

  return this;

};

UI.Input.prototype = Object.create( UI.Element.prototype );
UI.Input.prototype.constructor = UI.Input;

UI.Input.prototype.getValue = function () {

  return this.dom.value;

};

UI.Input.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};


// TextArea

UI.TextArea = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'textarea' );
  dom.className = 'TextArea';
  dom.style.padding = '2px';
  dom.spellcheck = false;

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

    if ( event.keyCode === 9 ) {

      event.preventDefault();

      var cursor = dom.selectionStart;

      dom.value = dom.value.substring( 0, cursor ) + '\t' + dom.value.substring( cursor );
      dom.selectionStart = cursor + 1;
      dom.selectionEnd = dom.selectionStart;

    }

  }, false );

  this.dom = dom;

  return this;

};

UI.TextArea.prototype = Object.create( UI.Element.prototype );
UI.TextArea.prototype.constructor = UI.TextArea;

UI.TextArea.prototype.getValue = function () {

  return this.dom.value;

};

UI.TextArea.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};


// Select

UI.Select = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'select' );
  dom.className = 'Select';
  dom.style.padding = '2px';

  this.dom = dom;

  return this;

};

UI.Select.prototype = Object.create( UI.Element.prototype );
UI.Select.prototype.constructor = UI.Select;

UI.Select.prototype.setMultiple = function ( boolean ) {

  this.dom.multiple = boolean;

  return this;

};

UI.Select.prototype.setOptions = function ( options ) {

  var selected = this.dom.value;

  while ( this.dom.children.length > 0 ) {

    this.dom.removeChild( this.dom.firstChild );

  }

  for ( var key in options ) {

    var option = document.createElement( 'option' );
    option.value = key;
    option.innerHTML = options[ key ];
    this.dom.appendChild( option );

  }

  this.dom.value = selected;

  return this;

};

UI.Select.prototype.getValue = function () {

  return this.dom.value;

};

UI.Select.prototype.setValue = function ( value ) {

  value = String( value );

  if ( this.dom.value !== value ) {

    this.dom.value = value;

  }

  return this;

};

// Checkbox

UI.Checkbox = function ( boolean ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Checkbox';
  dom.type = 'checkbox';

  this.dom = dom;
  this.setValue( boolean );

  return this;

};

UI.Checkbox.prototype = Object.create( UI.Element.prototype );
UI.Checkbox.prototype.constructor = UI.Checkbox;

UI.Checkbox.prototype.getValue = function () {

  return this.dom.checked;

};

UI.Checkbox.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.checked = value;

  }

  return this;

};


// Color

UI.Color = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Color';
  dom.style.width = '64px';
  dom.style.height = '17px';
  dom.style.border = '0px';
  dom.style.padding = '2px';
  dom.style.backgroundColor = 'transparent';

  try {

    dom.type = 'color';
    dom.value = '#ffffff';

  } catch ( exception ) {}

  this.dom = dom;

  return this;

};

UI.Color.prototype = Object.create( UI.Element.prototype );
UI.Color.prototype.constructor = UI.Color;

UI.Color.prototype.getValue = function () {

  return this.dom.value;

};

UI.Color.prototype.getHexValue = function () {

  return parseInt( this.dom.value.substr( 1 ), 16 );

};

UI.Color.prototype.setValue = function ( value ) {

  if ( value.length === 4 ) {
    value = '#' + value[ 1 ] + value[ 1 ] + value[ 2 ] + value[ 2 ] + value[ 3 ] + value[ 3 ];
  }

  this.dom.value = value;

  return this;

};

UI.Color.prototype.setHexValue = function ( hex ) {

  this.dom.value = '#' + ( '000000' + hex.toString( 16 ) ).slice( - 6 );

  return this;

};


// Number

UI.Number = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0.00';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

    if ( event.keyCode === 13 ) dom.blur();

  }, false );

  this.value = 0;

  this.min = - Infinity;
  this.max = Infinity;

  this.precision = 2;
  this.step = 1;

  this.dom = dom;

  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = [ 0, 0 ];
  var prevPointer = [ 0, 0 ];

  function onMouseDown( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = scope.value;

    prevPointer = [ event.clientX, event.clientY ];

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  }

  function onMouseMove( event ) {

    var currentValue = scope.value;

    pointer = [ event.clientX, event.clientY ];

    distance += ( pointer[ 0 ] - prevPointer[ 0 ] ) - ( pointer[ 1 ] - prevPointer[ 1 ] );

    var value = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;
    value = Math.min( scope.max, Math.max( scope.min, value ) );

    if ( currentValue !== value ) {

      scope.setValue( value );
      dom.dispatchEvent( changeEvent );

    }

    prevPointer = [ event.clientX, event.clientY ];

  }

  function onMouseUp( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  }

  function onChange( event ) {

    var value = 0;

    try {

      value = eval( dom.value );

    } catch ( error ) {

      console.error( error.message );

    }

    scope.setValue( parseFloat( value ) );

  }

  function onFocus( event ) {

    dom.style.backgroundColor = '';
    dom.style.cursor = '';

  }

  function onBlur( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.cursor = 'col-resize';

  }

  onBlur();

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};

UI.Number.prototype = Object.create( UI.Element.prototype );
UI.Number.prototype.constructor = UI.Number;

UI.Number.prototype.getValue = function () {

  return this.value;

};

UI.Number.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    value = parseFloat(value);
    if (value < this.min)
      value = this.min;
    if (value > this.max)
      value = this.max;

    this.value = value;
    this.dom.value = value.toFixed( this.precision );

  }

  return this;

};

UI.Number.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};

UI.Number.prototype.setPrecision = function ( precision ) {

  this.precision = precision;

  return this;

};


// Integer

UI.Integer = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.value = 0;

  this.min = - Infinity;
  this.max = Infinity;

  this.step = 1;

  this.dom = dom;

  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = [ 0, 0 ];
  var prevPointer = [ 0, 0 ];

  function onMouseDown( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = scope.value;

    prevPointer = [ event.clientX, event.clientY ];

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  }

  function onMouseMove( event ) {

    var currentValue = scope.value;

    pointer = [ event.clientX, event.clientY ];

    distance += ( pointer[ 0 ] - prevPointer[ 0 ] ) - ( pointer[ 1 ] - prevPointer[ 1 ] );

    var value = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;
    value = Math.min( scope.max, Math.max( scope.min, value ) ) | 0;

    if ( currentValue !== value ) {

      scope.setValue( value );
      dom.dispatchEvent( changeEvent );

    }

    prevPointer = [ event.clientX, event.clientY ];

  }

  function onMouseUp( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  }

  function onChange( event ) {

    var value = 0;

    try {

      value = eval( dom.value );

    } catch ( error ) {

      console.error( error.message );

    }

    scope.setValue( value );

  }

  function onFocus( event ) {

    dom.style.backgroundColor = '';
    dom.style.cursor = '';

  }

  function onBlur( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.cursor = 'col-resize';

  }

  onBlur();

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};

UI.Integer.prototype = Object.create( UI.Element.prototype );
UI.Integer.prototype.constructor = UI.Integer;

UI.Integer.prototype.getValue = function () {

  return this.value;

};

UI.Integer.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.value = value | 0;
    this.dom.value = value | 0;

  }

  return this;

};

UI.Integer.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};


// Break

UI.Break = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'br' );
  dom.className = 'Break';

  this.dom = dom;

  return this;

};

UI.Break.prototype = Object.create( UI.Element.prototype );
UI.Break.prototype.constructor = UI.Break;


// HorizontalRule

UI.HorizontalRule = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'hr' );
  dom.className = 'HorizontalRule';

  this.dom = dom;

  return this;

};

UI.HorizontalRule.prototype = Object.create( UI.Element.prototype );
UI.HorizontalRule.prototype.constructor = UI.HorizontalRule;


// Button

UI.Button = function ( value ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'button' );
  dom.className = 'Button';

  this.dom = dom;
  this.dom.textContent = value;

  return this;

};

UI.Button.prototype = Object.create( UI.Element.prototype );
UI.Button.prototype.constructor = UI.Button;

UI.Button.prototype.setLabel = function ( value ) {

  this.dom.textContent = value;

  return this;

};


// Modal

UI.Modal = function ( value ) {

  var scope = this;

  var dom = document.createElement( 'div' );

  dom.style.position = 'absolute';
  dom.style.width = '100%';
  dom.style.height = '100%';
  dom.style.backgroundColor = 'rgba(0,0,0,0.5)';
  dom.style.display = 'none';
  dom.style.alignItems = 'center';
  dom.style.justifyContent = 'center';
  dom.addEventListener( 'click', function ( event ) {

    //scope.hide();

  } );

  this.dom = dom;

  this.container = new UI.Panel();
  this.container.dom.style.width = '600px';
  this.container.dom.style.height = '600px';
  this.container.dom.style.overflow = 'auto';

  this.container.dom.style.padding = '20px';
  this.container.dom.style.backgroundColor = '#ffffff';
  this.container.dom.style.boxShadow = '0px 5px 10px rgba(0,0,0,0.5)';

  this.add( this.container );

  return this;

};

UI.Modal.prototype = Object.create( UI.Element.prototype );
UI.Modal.prototype.constructor = UI.Modal;

UI.Modal.prototype.show = function ( content ) {

  this.container.clear();
  this.container.add( content );

  this.dom.style.display = 'flex';

  return this;

};

UI.Modal.prototype.hide = function () {

  this.dom.style.display = 'none';

  return this;

};

UI.ContextMenu = function () {
  var nav = document.createElement( 'nav' );
  nav.className = 'context-menu';
  var ul = document.createElement('ul');
  ul.className = 'context-menu__items';
  nav.appendChild(ul);

  function addOption(text, onClick) {

  }
/*
<nav id="context-menu" class="context-menu">
    <ul class="context-menu__items">
      <li class="context-menu__item">
        <a href="#" class="context-menu__link" data-action="View"><i class="fa fa-eye"></i> View Task</a>
      </li>
      <li class="context-menu__item">
        <a href="#" class="context-menu__link" data-action="Edit"><i class="fa fa-edit"></i> Edit Task</a>
      </li>
      <li class="context-menu__item">
        <a href="#" class="context-menu__link" data-action="Delete"><i class="fa fa-times"></i> Delete Task</a>
      </li>
    </ul>
  </nav>
*/

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'button' );
  dom.className = 'Button';

  this.dom = dom;
  this.dom.textContent = value;

  return this;

};

UI.Button.prototype = Object.create( UI.Element.prototype );
UI.Button.prototype.constructor = UI.Button;

UI.Button.prototype.setLabel = function ( value ) {

  this.dom.textContent = value;

  return this;

};


// ----- UI.THREEJS

// Outliner

UI.Outliner = function ( editor ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'div' );
  dom.className = 'Outliner';
  dom.tabIndex = 0; // keyup event is ignored without setting tabIndex

  var scene = editor.scene;

  var sortable = Sortable.create( dom, {
    draggable: '.draggable',
    onUpdate: function ( event ) {

      var item = event.item;

      var object = scene.getObjectById( item.value );

      if ( item.nextSibling === null ) {

        editor.execute( new MoveObjectCommand( object, editor.scene ) );

      } else {

        var nextObject = scene.getObjectById( item.nextSibling.value );
        editor.execute( new MoveObjectCommand( object, nextObject.parent, nextObject ) );

      }

    }
  } );

  // Broadcast for object selection after arrow navigation
  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  // Prevent native scroll behavior
  dom.addEventListener( 'keydown', function ( event ) {

    switch ( event.keyCode ) {
      case 38: // up
      case 40: // down
        event.preventDefault();
        event.stopPropagation();
        break;
    }

  }, false );

  // Keybindings to support arrow navigation
  dom.addEventListener( 'keyup', function ( event ) {

    function select( index ) {

      if ( index >= 0 && index < scope.options.length ) {

        scope.selectedIndex = index;

        // Highlight selected dom elem and scroll parent if needed
        scope.setValue( scope.options[ index ].value );
        scope.dom.dispatchEvent( changeEvent );

      }

    }

    switch ( event.keyCode ) {
      case 38: // up
        select( scope.selectedIndex - 1 );
        break;
      case 40: // down
        select( scope.selectedIndex + 1 );
        break;
    }

  }, false );

  this.dom = dom;

  this.options = [];
  this.selectedIndex = - 1;
  this.selectedValue = null;

  return this;

};

UI.Outliner.prototype = Object.create( UI.Element.prototype );
UI.Outliner.prototype.constructor = UI.Outliner;

UI.Outliner.prototype.setOptions = function ( options ) {

  var scope = this;

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  while ( scope.dom.children.length > 0 ) {

    scope.dom.removeChild( scope.dom.firstChild );

  }

  scope.options = [];

  for ( var i = 0; i < options.length; i ++ ) {

    var option = options[ i ];

    var div = document.createElement( 'div' );
    div.className = 'option ' + ( option.static === true ? '' : 'draggable' );
    div.innerHTML = option.html;
    div.value = option.value;
    scope.dom.appendChild( div );

    scope.options.push( div );

    div.addEventListener( 'click', function ( event ) {

      scope.setValue( this.value );
      scope.dom.dispatchEvent( changeEvent );

    }, false );

  }

  return scope;

};

UI.Outliner.prototype.getValue = function () {

  return this.selectedValue;

};

UI.Outliner.prototype.setValue = function ( value ) {

  for ( var i = 0; i < this.options.length; i ++ ) {

    var element = this.options[ i ];

    if ( element.value === value ) {

      element.classList.add( 'active' );

      // scroll into view

      var y = element.offsetTop - this.dom.offsetTop;
      var bottomY = y + element.offsetHeight;
      var minScroll = bottomY - this.dom.offsetHeight;

      if ( this.dom.scrollTop > y ) {

        this.dom.scrollTop = y;

      } else if ( this.dom.scrollTop < minScroll ) {

        this.dom.scrollTop = minScroll;

      }

      this.selectedIndex = i;

    } else {

      element.classList.remove( 'active' );

    }

  }

  this.selectedValue = value;

  return this;

};

UI.THREE = {};

UI.THREE.Boolean = function ( boolean, text ) {

  UI.Span.call( this );

  this.setMarginRight( '10px' );

  this.checkbox = new UI.Checkbox( boolean );
  this.text = new UI.Text( text ).setMarginLeft( '3px' );

  this.add( this.checkbox );
  this.add( this.text );

};

UI.THREE.Boolean.prototype = Object.create( UI.Span.prototype );
UI.THREE.Boolean.prototype.constructor = UI.THREE.Boolean;

UI.THREE.Boolean.prototype.getValue = function () {

  return this.checkbox.getValue();

};

UI.THREE.Boolean.prototype.setValue = function ( value ) {

  return this.checkbox.setValue( value );

};

UI.Vector3 = function ( vector3 ) {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Row';

  this.dom = dom;

  var scope=this;

  this.vector={
    'x': new UI.Number().setWidth('50px'),
    'y': new UI.Number().setWidth('50px'),
    'z': new UI.Number().setWidth('50px'),
  }

  this.add(this.vector['x'] ,this.vector['y'] ,this.vector['z']);
};

UI.Vector3.prototype = Object.create( UI.Element.prototype );
UI.Vector3.prototype.constructor = UI.Vector3;

UI.Vector3.prototype.setWidth=function(value) {
  return this;
};

UI.Vector3.prototype.setValue=function(value) {
  for (var val in value) {
    this.vector[val].setValue(value[val]);
  }
  return this;
};

UI.Vector3.prototype.getValue=function() {
  return {
    'x': this.vector['x'].getValue(),
    'y': this.vector['y'].getValue(),
    'z': this.vector['z'].getValue()
  }
}



UI.Map = function ( vector3 ) {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Row';

  this.dom = dom;

  var scope=this;

  this.vector={
    'x': new UI.Number().setWidth('50px'),
    'y': new UI.Number().setWidth('50px'),
    'z': new UI.Number().setWidth('50px'),
  }

  this.add(this.vector['x'] ,this.vector['y'] ,this.vector['z']);
};

UI.Vector3.prototype = Object.create( UI.Element.prototype );
UI.Vector3.prototype.constructor = UI.Vector3;

UI.Vector3.prototype.setWidth=function(value) {
  return this;
};

UI.Vector3.prototype.setValue=function(value) {
  for (var val in value) {
    this.vector[val].setValue(value[val]);
  }
  return this;
};

UI.Vector3.prototype.getValue=function() {
  return {
    'x': this.vector['x'].getValue(),
    'y': this.vector['y'].getValue(),
    'z': this.vector['z'].getValue()
  }
}


UI.Texture = function ( mapping ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'span' );
/*
  var input = document.createElement( 'input' );
  input.type = 'file';
  input.addEventListener( 'change', function ( event ) {

    loadFile( event.target.files[ 0 ] );

  } );
*/
  var icon = document.createElement( 'span' );
  icon.style.paddingRight = '2px';
  dom.appendChild( icon );

  var canvas = document.createElement( 'canvas' );
  canvas.width = 32;
  canvas.height = 16;
  canvas.style.cursor = 'pointer';
  canvas.style.marginRight = '5px';
  canvas.style.border = '1px solid #888';
  canvas.addEventListener( 'click', function ( event ) {
    aframeEditor.editor.signals.showAssetsDialog.dispatch(scope);
    //aframeEditor.editor.dialogs.assets.show(scope);
  }, false );
/*  canvas.addEventListener( 'drop', function ( event ) {

    event.preventDefault();
    event.stopPropagation();
    loadFile( event.dataTransfer.files[ 0 ] );

  }, false );
*/
  dom.appendChild( canvas );
/*
  var name = document.createElement( 'input' );
  name.disabled = true;
  name.style.width = '64px';
  name.style.border = '1px solid #ccc';
  dom.appendChild( name );
*/

  var remove = document.createElement( 'input' );
  remove.type = 'button';
  remove.value = 'remove';
  remove.addEventListener('click', function(event){
    scope.setValue('');
    if ( scope.onChangeCallback ) scope.onChangeCallback();
  });

  dom.appendChild( remove );

  var loadFile = function ( file ) {

    if ( file.type.match( 'image.*' ) ) {

      var reader = new FileReader();
      reader.addEventListener( 'load', function ( event ) {

        var image = document.createElement( 'img' );
        image.addEventListener( 'load', function( event ) {

          var texture = new THREE.Texture( this, mapping );
          texture.sourceFile = file.name;
          texture.needsUpdate = true;

          scope.setValue( texture );

          if ( scope.onChangeCallback ) scope.onChangeCallback();

        }, false );

        image.src = event.target.result;

      }, false );

      reader.readAsDataURL( file );

    }

  };

  this.dom = dom;
  this.texture = null;
  this.onChangeCallback = null;

  return this;

};

UI.Texture.prototype = Object.create( UI.Element.prototype );
UI.Texture.prototype.constructor = UI.Texture;

UI.Texture.prototype.getValue = function () {

  return this.texture;

};

UI.Texture.prototype.setValue = function ( mapValue ) {

  var icon = this.dom.children[ 0 ];
  var canvas = this.dom.children[ 1 ];
  var context = canvas.getContext( '2d' );

  function paintPreview(texture) {
    var image = texture.image;
    var filename = image.src.replace(/^.*[\\\/]/, '')
    if ( image !== undefined && image.width > 0 ) {

      canvas.title = filename;
      var scale = canvas.width / image.width;
      context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

    } else {

      //name.value = filename + ' (error)';
      context.clearRect( 0, 0, canvas.width, canvas.height );

    }
  }

  var url = AFRAME.utils.srcLoader.parseUrl(mapValue);
  if (url) {
    icon.className = 'fa fa-external-link';
    var textureCache = aframeEditor.editor.sceneEl.systems.material.textureCache[url];
    if (textureCache) {
      textureCache[Object.keys(textureCache)[0]].then(paintPreview);
    } else {
      console.warn("No texture in cache", url, mapValue);
    }
  } else if (mapValue[0] == '#') {
    icon.className = 'fa fa-link';
    var url = document.querySelector(mapValue).getAttribute('src');
    var textureCache = aframeEditor.editor.sceneEl.systems.material.textureCache[url];
    if (textureCache) {
      var url = document.getElementById(mapValue.substr(1)).attributes['src'].value;
      textureCache[Object.keys(textureCache)[0]].then(paintPreview);
    } else {
      console.warn("No texture in cache", url, mapValue);
    }
  } else {
    context.clearRect( 0, 0, canvas.width, canvas.height );
    icon.className = '';
  }

  this.texture = mapValue;
  return;

  if ( texture !== null ) {

    var image = texture.image;

    if ( image !== undefined && image.width > 0 ) {

      name.value = texture.sourceFile;

      var scale = canvas.width / image.width;
      context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

    } else {

      name.value = texture.sourceFile + ' (error)';
      context.clearRect( 0, 0, canvas.width, canvas.height );

    }

  } else {

    name.value = '';
    context.clearRect( 0, 0, canvas.width, canvas.height );

  }

  this.texture = texture;

};

UI.Texture.prototype.onChange = function ( callback ) {

  this.onChangeCallback = callback;

  return this;

};

module.exports = UI;

},{"sortablejs":15}],4:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }
        
        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            head.appendChild(style);
        } else if (style.styleSheet) { // for IE8 and below
            head.appendChild(style);
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            head.appendChild(style);
        }
    }
};

},{}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _select = require('select');

var _select2 = _interopRequireDefault(_select);

/**
 * Inner class which performs selection from either `text` or `target`
 * properties and then executes copy or cut operations.
 */

var ClipboardAction = (function () {
    /**
     * @param {Object} options
     */

    function ClipboardAction(options) {
        _classCallCheck(this, ClipboardAction);

        this.resolveOptions(options);
        this.initSelection();
    }

    /**
     * Defines base properties passed from constructor.
     * @param {Object} options
     */

    ClipboardAction.prototype.resolveOptions = function resolveOptions() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.action = options.action;
        this.emitter = options.emitter;
        this.target = options.target;
        this.text = options.text;
        this.trigger = options.trigger;

        this.selectedText = '';
    };

    /**
     * Decides which selection strategy is going to be applied based
     * on the existence of `text` and `target` properties.
     */

    ClipboardAction.prototype.initSelection = function initSelection() {
        if (this.text && this.target) {
            throw new Error('Multiple attributes declared, use either "target" or "text"');
        } else if (this.text) {
            this.selectFake();
        } else if (this.target) {
            this.selectTarget();
        } else {
            throw new Error('Missing required attributes, use either "target" or "text"');
        }
    };

    /**
     * Creates a fake textarea element, sets its value from `text` property,
     * and makes a selection on it.
     */

    ClipboardAction.prototype.selectFake = function selectFake() {
        var _this = this;

        var isRTL = document.documentElement.getAttribute('dir') == 'rtl';

        this.removeFake();

        this.fakeHandler = document.body.addEventListener('click', function () {
            return _this.removeFake();
        });

        this.fakeElem = document.createElement('textarea');
        // Prevent zooming on iOS
        this.fakeElem.style.fontSize = '12pt';
        // Reset box model
        this.fakeElem.style.border = '0';
        this.fakeElem.style.padding = '0';
        this.fakeElem.style.margin = '0';
        // Move element out of screen horizontally
        this.fakeElem.style.position = 'absolute';
        this.fakeElem.style[isRTL ? 'right' : 'left'] = '-9999px';
        // Move element to the same position vertically
        this.fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
        this.fakeElem.setAttribute('readonly', '');
        this.fakeElem.value = this.text;

        document.body.appendChild(this.fakeElem);

        this.selectedText = _select2['default'](this.fakeElem);
        this.copyText();
    };

    /**
     * Only removes the fake element after another click event, that way
     * a user can hit `Ctrl+C` to copy because selection still exists.
     */

    ClipboardAction.prototype.removeFake = function removeFake() {
        if (this.fakeHandler) {
            document.body.removeEventListener('click');
            this.fakeHandler = null;
        }

        if (this.fakeElem) {
            document.body.removeChild(this.fakeElem);
            this.fakeElem = null;
        }
    };

    /**
     * Selects the content from element passed on `target` property.
     */

    ClipboardAction.prototype.selectTarget = function selectTarget() {
        this.selectedText = _select2['default'](this.target);
        this.copyText();
    };

    /**
     * Executes the copy operation based on the current selection.
     */

    ClipboardAction.prototype.copyText = function copyText() {
        var succeeded = undefined;

        try {
            succeeded = document.execCommand(this.action);
        } catch (err) {
            succeeded = false;
        }

        this.handleResult(succeeded);
    };

    /**
     * Fires an event based on the copy operation result.
     * @param {Boolean} succeeded
     */

    ClipboardAction.prototype.handleResult = function handleResult(succeeded) {
        if (succeeded) {
            this.emitter.emit('success', {
                action: this.action,
                text: this.selectedText,
                trigger: this.trigger,
                clearSelection: this.clearSelection.bind(this)
            });
        } else {
            this.emitter.emit('error', {
                action: this.action,
                trigger: this.trigger,
                clearSelection: this.clearSelection.bind(this)
            });
        }
    };

    /**
     * Removes current selection and focus from `target` element.
     */

    ClipboardAction.prototype.clearSelection = function clearSelection() {
        if (this.target) {
            this.target.blur();
        }

        window.getSelection().removeAllRanges();
    };

    /**
     * Sets the `action` to be performed which can be either 'copy' or 'cut'.
     * @param {String} action
     */

    /**
     * Destroy lifecycle.
     */

    ClipboardAction.prototype.destroy = function destroy() {
        this.removeFake();
    };

    _createClass(ClipboardAction, [{
        key: 'action',
        set: function set() {
            var action = arguments.length <= 0 || arguments[0] === undefined ? 'copy' : arguments[0];

            this._action = action;

            if (this._action !== 'copy' && this._action !== 'cut') {
                throw new Error('Invalid "action" value, use either "copy" or "cut"');
            }
        },

        /**
         * Gets the `action` property.
         * @return {String}
         */
        get: function get() {
            return this._action;
        }

        /**
         * Sets the `target` property using an element
         * that will be have its content copied.
         * @param {Element} target
         */
    }, {
        key: 'target',
        set: function set(target) {
            if (target !== undefined) {
                if (target && typeof target === 'object' && target.nodeType === 1) {
                    this._target = target;
                } else {
                    throw new Error('Invalid "target" value, use a valid Element');
                }
            }
        },

        /**
         * Gets the `target` property.
         * @return {String|HTMLElement}
         */
        get: function get() {
            return this._target;
        }
    }]);

    return ClipboardAction;
})();

exports['default'] = ClipboardAction;
module.exports = exports['default'];
},{"select":12}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _clipboardAction = require('./clipboard-action');

var _clipboardAction2 = _interopRequireDefault(_clipboardAction);

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _goodListener = require('good-listener');

var _goodListener2 = _interopRequireDefault(_goodListener);

/**
 * Base class which takes one or more elements, adds event listeners to them,
 * and instantiates a new `ClipboardAction` on each click.
 */

var Clipboard = (function (_Emitter) {
    _inherits(Clipboard, _Emitter);

    /**
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     * @param {Object} options
     */

    function Clipboard(trigger, options) {
        _classCallCheck(this, Clipboard);

        _Emitter.call(this);

        this.resolveOptions(options);
        this.listenClick(trigger);
    }

    /**
     * Helper function to retrieve attribute value.
     * @param {String} suffix
     * @param {Element} element
     */

    /**
     * Defines if attributes would be resolved using internal setter functions
     * or custom functions that were passed in the constructor.
     * @param {Object} options
     */

    Clipboard.prototype.resolveOptions = function resolveOptions() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.action = typeof options.action === 'function' ? options.action : this.defaultAction;
        this.target = typeof options.target === 'function' ? options.target : this.defaultTarget;
        this.text = typeof options.text === 'function' ? options.text : this.defaultText;
    };

    /**
     * Adds a click event listener to the passed trigger.
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     */

    Clipboard.prototype.listenClick = function listenClick(trigger) {
        var _this = this;

        this.listener = _goodListener2['default'](trigger, 'click', function (e) {
            return _this.onClick(e);
        });
    };

    /**
     * Defines a new `ClipboardAction` on each click event.
     * @param {Event} e
     */

    Clipboard.prototype.onClick = function onClick(e) {
        var trigger = e.delegateTarget || e.currentTarget;

        if (this.clipboardAction) {
            this.clipboardAction = null;
        }

        this.clipboardAction = new _clipboardAction2['default']({
            action: this.action(trigger),
            target: this.target(trigger),
            text: this.text(trigger),
            trigger: trigger,
            emitter: this
        });
    };

    /**
     * Default `action` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultAction = function defaultAction(trigger) {
        return getAttributeValue('action', trigger);
    };

    /**
     * Default `target` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultTarget = function defaultTarget(trigger) {
        var selector = getAttributeValue('target', trigger);

        if (selector) {
            return document.querySelector(selector);
        }
    };

    /**
     * Default `text` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultText = function defaultText(trigger) {
        return getAttributeValue('text', trigger);
    };

    /**
     * Destroy lifecycle.
     */

    Clipboard.prototype.destroy = function destroy() {
        this.listener.destroy();

        if (this.clipboardAction) {
            this.clipboardAction.destroy();
            this.clipboardAction = null;
        }
    };

    return Clipboard;
})(_tinyEmitter2['default']);

exports['default'] = Clipboard;
function getAttributeValue(suffix, element) {
    var attribute = 'data-clipboard-' + suffix;

    if (!element.hasAttribute(attribute)) {
        return;
    }

    return element.getAttribute(attribute);
}
module.exports = exports['default'];
},{"./clipboard-action":5,"good-listener":11,"tiny-emitter":13}],7:[function(require,module,exports){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf) {
  var parent = checkYoSelf ? element : element.parentNode

  while (parent && parent !== document) {
    if (matches(parent, selector)) return parent;
    parent = parent.parentNode
  }
}

},{"matches-selector":8}],8:[function(require,module,exports){

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],9:[function(require,module,exports){
var closest = require('closest');

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function delegate(element, selector, type, callback, useCapture) {
    var listenerFn = listener.apply(this, arguments);

    element.addEventListener(type, listenerFn, useCapture);

    return {
        destroy: function() {
            element.removeEventListener(type, listenerFn, useCapture);
        }
    }
}

/**
 * Finds closest match and invokes callback.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Function}
 */
function listener(element, selector, type, callback) {
    return function(e) {
        e.delegateTarget = closest(e.target, selector, true);

        if (e.delegateTarget) {
            callback.call(element, e);
        }
    }
}

module.exports = delegate;

},{"closest":7}],10:[function(require,module,exports){
/**
 * Check if argument is a HTML element.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.node = function(value) {
    return value !== undefined
        && value instanceof HTMLElement
        && value.nodeType === 1;
};

/**
 * Check if argument is a list of HTML elements.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.nodeList = function(value) {
    var type = Object.prototype.toString.call(value);

    return value !== undefined
        && (type === '[object NodeList]' || type === '[object HTMLCollection]')
        && ('length' in value)
        && (value.length === 0 || exports.node(value[0]));
};

/**
 * Check if argument is a string.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.string = function(value) {
    return typeof value === 'string'
        || value instanceof String;
};

/**
 * Check if argument is a function.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.fn = function(value) {
    var type = Object.prototype.toString.call(value);

    return type === '[object Function]';
};

},{}],11:[function(require,module,exports){
var is = require('./is');
var delegate = require('delegate');

/**
 * Validates all params and calls the right
 * listener function based on its target type.
 *
 * @param {String|HTMLElement|HTMLCollection|NodeList} target
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listen(target, type, callback) {
    if (!target && !type && !callback) {
        throw new Error('Missing required arguments');
    }

    if (!is.string(type)) {
        throw new TypeError('Second argument must be a String');
    }

    if (!is.fn(callback)) {
        throw new TypeError('Third argument must be a Function');
    }

    if (is.node(target)) {
        return listenNode(target, type, callback);
    }
    else if (is.nodeList(target)) {
        return listenNodeList(target, type, callback);
    }
    else if (is.string(target)) {
        return listenSelector(target, type, callback);
    }
    else {
        throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
    }
}

/**
 * Adds an event listener to a HTML element
 * and returns a remove listener function.
 *
 * @param {HTMLElement} node
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenNode(node, type, callback) {
    node.addEventListener(type, callback);

    return {
        destroy: function() {
            node.removeEventListener(type, callback);
        }
    }
}

/**
 * Add an event listener to a list of HTML elements
 * and returns a remove listener function.
 *
 * @param {NodeList|HTMLCollection} nodeList
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenNodeList(nodeList, type, callback) {
    Array.prototype.forEach.call(nodeList, function(node) {
        node.addEventListener(type, callback);
    });

    return {
        destroy: function() {
            Array.prototype.forEach.call(nodeList, function(node) {
                node.removeEventListener(type, callback);
            });
        }
    }
}

/**
 * Add an event listener to a selector
 * and returns a remove listener function.
 *
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenSelector(selector, type, callback) {
    return delegate(document.body, selector, type, callback);
}

module.exports = listen;

},{"./is":10,"delegate":9}],12:[function(require,module,exports){
function select(element) {
    var selectedText;

    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        element.focus();
        element.setSelectionRange(0, element.value.length);

        selectedText = element.value;
    }
    else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        selectedText = selection.toString();
    }

    return selectedText;
}

module.exports = select;

},{}],13:[function(require,module,exports){
function E () {
	// Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
	on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;

},{}],14:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}],15:[function(require,module,exports){
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */


(function (factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(factory);
	}
	else if (typeof module != "undefined" && typeof module.exports != "undefined") {
		module.exports = factory();
	}
	else if (typeof Package !== "undefined") {
		Sortable = factory();  // export for Meteor.js
	}
	else {
		/* jshint sub:true */
		window["Sortable"] = factory();
	}
})(function () {
	"use strict";

	var dragEl,
		parentEl,
		ghostEl,
		cloneEl,
		rootEl,
		nextEl,

		scrollEl,
		scrollParentEl,

		lastEl,
		lastCSS,
		lastParentCSS,

		oldIndex,
		newIndex,

		activeGroup,
		autoScroll = {},

		tapEvt,
		touchEvt,

		moved,

		/** @const */
		RSPACE = /\s+/g,

		expando = 'Sortable' + (new Date).getTime(),

		win = window,
		document = win.document,
		parseInt = win.parseInt,

		supportDraggable = !!('draggable' in document.createElement('div')),
		supportCssPointerEvents = (function (el) {
			el = document.createElement('x');
			el.style.cssText = 'pointer-events:auto';
			return el.style.pointerEvents === 'auto';
		})(),

		_silent = false,

		abs = Math.abs,
		slice = [].slice,

		touchDragOverListeners = [],

		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
			if (rootEl && options.scroll) {
				var el,
					rect,
					sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					x = evt.clientX,
					y = evt.clientY,

					winWidth = window.innerWidth,
					winHeight = window.innerHeight,

					vx,
					vy
				;

				// Delect scrollEl
				if (scrollParentEl !== rootEl) {
					scrollEl = options.scroll;
					scrollParentEl = rootEl;

					if (scrollEl === true) {
						scrollEl = rootEl;

						do {
							if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
								(scrollEl.offsetHeight < scrollEl.scrollHeight)
							) {
								break;
							}
							/* jshint boss:true */
						} while (scrollEl = scrollEl.parentNode);
					}
				}

				if (scrollEl) {
					el = scrollEl;
					rect = scrollEl.getBoundingClientRect();
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
				}


				if (!(vx || vy)) {
					vx = (winWidth - x <= sens) - (x <= sens);
					vy = (winHeight - y <= sens) - (y <= sens);

					/* jshint expr:true */
					(vx || vy) && (el = win);
				}


				if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
					autoScroll.el = el;
					autoScroll.vx = vx;
					autoScroll.vy = vy;

					clearInterval(autoScroll.pid);

					if (el) {
						autoScroll.pid = setInterval(function () {
							if (el === win) {
								win.scrollTo(win.pageXOffset + vx * speed, win.pageYOffset + vy * speed);
							} else {
								vy && (el.scrollTop += vy * speed);
								vx && (el.scrollLeft += vx * speed);
							}
						}, 24);
					}
				}
			}
		}, 30),

		_prepareGroup = function (options) {
			var group = options.group;

			if (!group || typeof group != 'object') {
				group = options.group = {name: group};
			}

			['pull', 'put'].forEach(function (key) {
				if (!(key in group)) {
					group[key] = true;
				}
			});

			options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';
		}
	;



	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */
	function Sortable(el, options) {
		if (!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
		}

		this.el = el; // root element
		this.options = options = _extend({}, options);


		// Export instance
		el[expando] = this;


		// Default options
		var defaults = {
			group: Math.random(),
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			ignore: 'a, img',
			filter: null,
			animation: 0,
			setData: function (dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false
		};


		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}

		_prepareGroup(options);

		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_') {
				this[fn] = this[fn].bind(this);
			}
		}

		// Setup drag mode
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;

		// Bind events
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);

		if (this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}

		touchDragOverListeners.push(this._onDragOver);

		// Restore sorting
		options.store && this.sort(options.store.get(this));
	}


	Sortable.prototype = /** @lends Sortable.prototype */ {
		constructor: Sortable,

		_onTapStart: function (/** Event|TouchEvent */evt) {
			var _this = this,
				el = this.el,
				options = this.options,
				type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = target,
				filter = options.filter;


			if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
				return; // only left button or enabled
			}

			target = _closest(target, options.draggable, el);

			if (!target) {
				return;
			}

			// get the index of the dragged element within its parent
			oldIndex = _index(target);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, oldIndex);
					evt.preventDefault();
					return; // cancel dnd
				}
			}
			else if (filter) {
				filter = filter.split(',').some(function (criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el);

					if (criteria) {
						_dispatchEvent(_this, criteria, 'filter', target, el, oldIndex);
						return true;
					}
				});

				if (filter) {
					evt.preventDefault();
					return; // cancel dnd
				}
			}


			if (options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}


			// Prepare `dragstart`
			this._prepareDragStart(evt, touch, target);
		},

		_prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target) {
			var _this = this,
				el = _this.el,
				options = _this.options,
				ownerDocument = el.ownerDocument,
				dragStartFn;

			if (target && !dragEl && (target.parentNode === el)) {
				tapEvt = evt;

				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				activeGroup = options.group;

				dragStartFn = function () {
					// Delayed drag has been triggered
					// we can re-enable the events: touchmove/mousemove
					_this._disableDelayedDrag();

					// Make the element draggable
					dragEl.draggable = true;

					// Chosen item
					_toggleClass(dragEl, _this.options.chosenClass, true);

					// Bind the events: dragstart/dragend
					_this._triggerDragStart(touch);
				};

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});

				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);

				if (options.delay) {
					// If the user moves the pointer or let go the click or touch
					// before the delay has been reached:
					// disable the delayed drag
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchmove', _this._disableDelayedDrag);

					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}
			}
		},

		_disableDelayedDrag: function () {
			var ownerDocument = this.el.ownerDocument;

			clearTimeout(this._dragStartTimer);
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);
		},

		_triggerDragStart: function (/** Touch */touch) {
			if (touch) {
				// Touch device support
				tapEvt = {
					target: dragEl,
					clientX: touch.clientX,
					clientY: touch.clientY
				};

				this._onDragStart(tapEvt, 'touch');
			}
			else if (!this.nativeDraggable) {
				this._onDragStart(tapEvt, true);
			}
			else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}

			try {
				if (document.selection) {
					document.selection.empty();
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {
			}
		},

		_dragStarted: function () {
			if (rootEl && dragEl) {
				// Apply effect
				_toggleClass(dragEl, this.options.ghostClass, true);

				Sortable.active = this;

				// Drag start event
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);
			}
		},

		_emulateDragOver: function () {
			if (touchEvt) {
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
					return;
				}

				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', 'none');
				}

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
					parent = target,
					groupName = ' ' + this.options.group.name + '',
					i = touchDragOverListeners.length;

				if (parent) {
					do {
						if (parent[expando] && parent[expando].options.groups.indexOf(groupName) > -1) {
							while (i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}

							break;
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', '');
				}
			}
		},


		_onTouchMove: function (/**TouchEvent*/evt) {
			if (tapEvt) {
				// only set the status to dragging, when we are actually dragging
				if (!Sortable.active) {
					this._dragStarted();
				}

				// as well as creating the ghost element on the document body
				this._appendGhost();

				var touch = evt.touches ? evt.touches[0] : evt,
					dx = touch.clientX - tapEvt.clientX,
					dy = touch.clientY - tapEvt.clientY,
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				moved = true;
				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.preventDefault();
			}
		},

		_appendGhost: function () {
			if (!ghostEl) {
				var rect = dragEl.getBoundingClientRect(),
					css = _css(dragEl),
					options = this.options,
					ghostRect;

				ghostEl = dragEl.cloneNode(true);

				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);

				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');

				options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

				// Fixing dimensions.
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
			}
		},

		_onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
			var dataTransfer = evt.dataTransfer,
				options = this.options;

			this._offUpEvents();

			if (activeGroup.pull == 'clone') {
				cloneEl = dragEl.cloneNode(true);
				_css(cloneEl, 'display', 'none');
				rootEl.insertBefore(cloneEl, dragEl);
			}

			if (useFallback) {

				if (useFallback === 'touch') {
					// Bind touch events
					_on(document, 'touchmove', this._onTouchMove);
					_on(document, 'touchend', this._onDrop);
					_on(document, 'touchcancel', this._onDrop);
				} else {
					// Old brwoser
					_on(document, 'mousemove', this._onTouchMove);
					_on(document, 'mouseup', this._onDrop);
				}

				this._loopId = setInterval(this._emulateDragOver, 50);
			}
			else {
				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(this, dataTransfer, dragEl);
				}

				_on(document, 'drop', this);
				setTimeout(this._dragStarted, 0);
			}
		},

		_onDragOver: function (/**Event*/evt) {
			var el = this.el,
				target,
				dragRect,
				revert,
				options = this.options,
				group = options.group,
				groupPut = group.put,
				isOwner = (activeGroup === group),
				canSort = options.sort;

			if (evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}

			moved = true;

			if (activeGroup && !options.disabled &&
				(isOwner
					? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
					: activeGroup.pull && groupPut && (
						(activeGroup.name === group.name) || // by Name
						(groupPut.indexOf && ~groupPut.indexOf(activeGroup.name)) // by Array
					)
				) &&
				(evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
			) {
				// Smart auto-scrolling
				_autoScroll(evt, options, this.el);

				if (_silent) {
					return;
				}

				target = _closest(evt.target, options.draggable, el);
				dragRect = dragEl.getBoundingClientRect();

				if (revert) {
					_cloneHide(true);

					if (cloneEl || nextEl) {
						rootEl.insertBefore(dragEl, cloneEl || nextEl);
					}
					else if (!canSort) {
						rootEl.appendChild(dragEl);
					}

					return;
				}


				if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
					(el === evt.target) && (target = _ghostIsLast(el, evt))
				) {

					if (target) {
						if (target.animated) {
							return;
						}

						targetRect = target.getBoundingClientRect();
					}

					_cloneHide(isOwner);

					if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect) !== false) {
						if (!dragEl.contains(el)) {
							el.appendChild(dragEl);
							parentEl = el; // actualization
						}

						this._animate(dragRect, dragEl);
						target && this._animate(targetRect, target);
					}
				}
				else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
					if (lastEl !== target) {
						lastEl = target;
						lastCSS = _css(target);
						lastParentCSS = _css(target.parentNode);
					}


					var targetRect = target.getBoundingClientRect(),
						width = targetRect.right - targetRect.left,
						height = targetRect.bottom - targetRect.top,
						floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)
							|| (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
						isWide = (target.offsetWidth > dragEl.offsetWidth),
						isLong = (target.offsetHeight > dragEl.offsetHeight),
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						nextSibling = target.nextElementSibling,
						moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect),
						after
					;

					if (moveVector !== false) {
						_silent = true;
						setTimeout(_unsilent, 30);

						_cloneHide(isOwner);

						if (moveVector === 1 || moveVector === -1) {
							after = (moveVector === 1);
						}
						else if (floating) {
							var elTop = dragEl.offsetTop,
								tgTop = target.offsetTop;

							if (elTop === tgTop) {
								after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
							} else {
								after = tgTop > elTop;
							}
						} else {
							after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
						}

						if (!dragEl.contains(el)) {
							if (after && !nextSibling) {
								el.appendChild(dragEl);
							} else {
								target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
							}
						}

						parentEl = dragEl.parentNode; // actualization

						this._animate(dragRect, dragEl);
						this._animate(targetRect, target);
					}
				}
			}
		},

		_animate: function (prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = target.getBoundingClientRect();

				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d('
					+ (prevRect.left - currentRect.left) + 'px,'
					+ (prevRect.top - currentRect.top) + 'px,0)'
				);

				target.offsetWidth; // repaint

				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');

				clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_offUpEvents: function () {
			var ownerDocument = this.el.ownerDocument;

			_off(document, 'touchmove', this._onTouchMove);
			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
		},

		_onDrop: function (/**Event*/evt) {
			var el = this.el,
				options = this.options;

			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);
			clearTimeout(this._dragStartTimer);

			// Unbind events
			_off(document, 'mousemove', this._onTouchMove);

			if (this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
			}

			this._offUpEvents();

			if (evt) {
				if (moved) {
					evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}

				ghostEl && ghostEl.parentNode.removeChild(ghostEl);

				if (dragEl) {
					if (this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}

					_disableDraggable(dragEl);

					// Remove class's
					_toggleClass(dragEl, this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);

					if (rootEl !== parentEl) {
						newIndex = _index(dragEl);

						if (newIndex >= 0) {
							// drag from one list and drop into another
							_dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);

							// Add event
							_dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);

							// Remove event
							_dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);
						}
					}
					else {
						// Remove clone
						cloneEl && cloneEl.parentNode.removeChild(cloneEl);

						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl);

							if (newIndex >= 0) {
								// drag & drop within the same list
								_dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
								_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							}
						}
					}

					if (Sortable.active) {
						if (newIndex === null || newIndex === -1) {
							newIndex = oldIndex;
						}

						_dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);

						// Save sorting
						this.save();
					}
				}

				// Nulling
				rootEl =
				dragEl =
				parentEl =
				ghostEl =
				nextEl =
				cloneEl =

				scrollEl =
				scrollParentEl =

				tapEvt =
				touchEvt =

				moved =
				newIndex =

				lastEl =
				lastCSS =

				activeGroup =
				Sortable.active = null;
			}
		},


		handleEvent: function (/**Event*/evt) {
			var type = evt.type;

			if (type === 'dragover' || type === 'dragenter') {
				if (dragEl) {
					this._onDragOver(evt);
					_globalDragOver(evt);
				}
			}
			else if (type === 'drop' || type === 'dragend') {
				this._onDrop(evt);
			}
		},


		/**
		 * Serializes the item into an array of string.
		 * @returns {String[]}
		 */
		toArray: function () {
			var order = [],
				el,
				children = this.el.children,
				i = 0,
				n = children.length,
				options = this.options;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, options.draggable, this.el)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}

			return order;
		},


		/**
		 * Sorts the elements according to the array.
		 * @param  {String[]}  order  order of the items
		 */
		sort: function (order) {
			var items = {}, rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},


		/**
		 * Save the current sorting
		 */
		save: function () {
			var store = this.options.store;
			store && store.set(this);
		},


		/**
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el
		 * @param   {String}       [selector]  default: `options.draggable`
		 * @returns {HTMLElement|null}
		 */
		closest: function (el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},


		/**
		 * Set/get option
		 * @param   {string} name
		 * @param   {*}      [value]
		 * @returns {*}
		 */
		option: function (name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;

				if (name === 'group') {
					_prepareGroup(options);
				}
			}
		},


		/**
		 * Destroy
		 */
		destroy: function () {
			var el = this.el;

			el[expando] = null;

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);

			if (this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}

			// Remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

			this._onDrop();

			this.el = el = null;
		}
	};


	function _cloneHide(state) {
		if (cloneEl && (cloneEl.state !== state)) {
			_css(cloneEl, 'display', state ? 'none' : '');
			!state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
			cloneEl.state = state;
		}
	}


	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
		if (el) {
			ctx = ctx || document;
			selector = selector.split('.');

			var tag = selector.shift().toUpperCase(),
				re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

			do {
				if (
					(tag === '>*' && el.parentNode === ctx) || (
						(tag === '' || el.nodeName.toUpperCase() == tag) &&
						(!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
					)
				) {
					return el;
				}
			}
			while (el !== ctx && (el = el.parentNode));
		}

		return null;
	}


	function _globalDragOver(/**Event*/evt) {
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.preventDefault();
	}


	function _on(el, event, fn) {
		el.addEventListener(event, fn, false);
	}


	function _off(el, event, fn) {
		el.removeEventListener(event, fn, false);
	}


	function _toggleClass(el, name, state) {
		if (el) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			}
			else {
				var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');
			}
		}
	}


	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				}
				else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			}
			else {
				if (!(prop in style)) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}


	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}



	function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
		var evt = document.createEvent('Event'),
			options = (sortable || rootEl[expando]).options,
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

		evt.initEvent(name, true, true);

		evt.to = rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;

		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;

		rootEl.dispatchEvent(evt);

		if (options[onName]) {
			options[onName].call(sortable, evt);
		}
	}


	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect) {
		var evt,
			sortable = fromEl[expando],
			onMoveFn = sortable.options.onMove,
			retVal;

		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);

		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();

		fromEl.dispatchEvent(evt);

		if (onMoveFn) {
			retVal = onMoveFn.call(sortable, evt);
		}

		return retVal;
	}


	function _disableDraggable(el) {
		el.draggable = false;
	}


	function _unsilent() {
		_silent = false;
	}


	/** @returns {HTMLElement|false} */
	function _ghostIsLast(el, evt) {
		var lastEl = el.lastElementChild,
				rect = lastEl.getBoundingClientRect();

		return ((evt.clientY - (rect.top + rect.height) > 5) || (evt.clientX - (rect.right + rect.width) > 5)) && lastEl; // min delta
	}


	/**
	 * Generate id
	 * @param   {HTMLElement} el
	 * @returns {String}
	 * @private
	 */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
	 * Returns the index of an element within its parent
	 * @param  {HTMLElement} el
	 * @return {number}
	 */
	function _index(el) {
		var index = 0;

		if (!el || !el.parentNode) {
			return -1;
		}

		while (el && (el = el.previousElementSibling)) {
			if (el.nodeName.toUpperCase() !== 'TEMPLATE') {
				index++;
			}
		}

		return index;
	}

	function _throttle(callback, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					args = void 0;
				}, ms);
			}
		};
	}

	function _extend(dst, src) {
		if (dst && src) {
			for (var key in src) {
				if (src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}

		return dst;
	}


	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function (el, selector) {
			return !!_closest(el, selector, el);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		index: _index
	};


	/**
	 * Create sortable instance
	 * @param {HTMLElement}  el
	 * @param {Object}      [options]
	 */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};


	// Export
	Sortable.version = '1.4.2';
	return Sortable;
});

},{}],16:[function(require,module,exports){
function ComponentLoader () {
  this.components = null;
  this.loadComponentsData();
}

ComponentLoader.prototype = {
  loadComponentsData: function () {
    var xhr = new window.XMLHttpRequest();
    // @todo Remove the sync call and use a callback
    xhr.open('GET', 'https://raw.githubusercontent.com/aframevr/aframe-components/master/components.json', false);
    xhr.onload = function () {
      this.components = window.JSON.parse(xhr.responseText);
      console.info('Loaded components:', Object.keys(this.components).length);
    }.bind(this);
    xhr.onerror = function () {
      // process error
    };
    xhr.send();
  },
  addComponentToScene: function (componentName, onLoaded) {
    var component = this.components[componentName];
    if (component && !component.included) {
      var script = document.createElement('script');
      script.src = component.url;
      script.setAttribute('data-component-name', componentName);
      script.setAttribute('data-component-description', component.description);
      script.onload = script.onreadystatechange = function () {
        script.onreadystatechange = script.onload = null;
        onLoaded();
      };
      var head = document.getElementsByTagName('head')[0];
      (head || document.body).appendChild(script);

      var link = document.createElement('script');
      link.href = component.url;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.getElementsByTagName('head')[0].appendChild(link);
      component.included = true;
    } else {
      onLoaded();
    }
  }
};

module.exports = ComponentLoader;

},{}],17:[function(require,module,exports){
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var samples = {
  "textures": [
    '758px-Canestra_di_frutta_Caravaggio.jpg',
    '2294472375_24a3b8ef46_o.jpg',
    'brick_bump.jpg',
    'brick_diffuse.jpg',
    'checkerboard.jpg',
    'crate.gif',
    'envmap.png',
    'grasslight-big.jpg',
    'sprite0.png',
    'UV_Grid_Sm.jpg'
  ]
};

function GetFilename(url) {
   if (url)
   {
      var m = url.toString().match(/.*\/(.+?)\./);
      if (m && m.length > 1)
      {
         return m[1];
      }
   }
   return '';
}

function AssetsDialog (editor) {
  var container = new UI.Panel();
  container.setClass('assets-dialog');

  // -------------------------------------
  var tabs = new UI.Div();
  tabs.setId('tabs');

  function insertNewAsset(type, id, src) {
    var element = null;
    switch (type) {
      case 'img': {
          element = document.createElement("img");
          element.id = id;

          element.src = src;
      } break;
    }
    if (element)
      document.getElementsByTagName("a-assets")[0].appendChild(element);
  }

  function insertOrGetAsset(type, src) {
    var id = GetFilename(src);
    // Search for already loaded asset by src
    var element = document.querySelector("a-assets > img[src='" + src + "']");
    if (element) {
      id = element.id;
    } else {
      // Check if first char of the ID is a number (Non a valid ID)
      // In that case a 'i' preffix will be added
      if (!isNaN(parseInt(id[0], 10))) {
        id='i' + id;
      }
      if (document.getElementById(id)) {
        var i = 1;
        while (document.getElementById(id + '_' + i)) {
          i++;
        }
        id += '_' + i;
      }
      insertNewAsset('img', id, src);
    }

    return id;
  }

  var assetsTab = new UI.Text('ASSETS').onClick(onClick);
  var samplesTab = new UI.Text('SAMPLES').onClick(onClick);
  var newTab = new UI.Text('NEW').onClick(onClick);
  // var assetsTab = new UI.Text('UPLOAD').onClick(onClick);

  tabs.add(assetsTab, samplesTab, newTab);

  container.add(tabs);

  function onClick (event) {
    select(event.target.textContent);
  }
  var assetsContent = new UI.Panel();
  var samplesContent = new UI.Panel();
  var newContent = new UI.Panel();

  var tabsContent = new UI.Span().add(assetsContent);
  container.add(tabsContent);
  container.add(samplesContent);
  container.add(newContent);

  function getImageWidget(texture, mapWidget) {
    var row = new UI.Row();
    var img = document.createElement('img');
    img.src = texture;
    img.style.width = '100px';
    img.style.height = '100px';
    row.dom.appendChild(img);

    var text = document.createTextNode(texture);
    row.dom.appendChild(text);

    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'select');
    (function (_texture) {
      button.addEventListener('click', function (event) {
        mapWidget.setValue('#'+insertOrGetAsset('img',_texture));
        if (mapWidget.onChangeCallback) {
          mapWidget.onChangeCallback();
        }
        editor.signals.hideModal.dispatch(assetsContent);
      });
    })(texture);
    row.dom.appendChild(button);
    return row;
  }

  editor.signals.showAssetsDialog.add(function (mapWidget) {
    // Assets content
    assetsContent.clear();
    for (var texture in editor.sceneEl.systems.material.textureCache) {
      var row = getImageWidget(texture, mapWidget);
      assetsContent.add(row);
    }

    // Assets content
    samplesContent.clear();
    for (var i in samples['textures']) {
      var row = getImageWidget('../assets/textures/'+samples['textures'][i], mapWidget);
      samplesContent.add(row);
    }

    // New content
    // Add new ID
    newContent.clear();
    var newUrl = new UI.Input('').setWidth('150px').setFontSize('12px').onChange(function () {
      // handleEntityChange(editor.selected.el, 'id', null, newUrl.getValue());
      // editor.signals.sceneGraphChanged.dispatch();
    });
    newContent.add(newUrl);

    var buttonAddNew = document.createElement('input');
    buttonAddNew.setAttribute('type', 'button');
    buttonAddNew.setAttribute('value', 'Add');
    buttonAddNew.addEventListener('click', function (event) {
      mapWidget.setValue('#'+insertOrGetAsset('img',newUrl.getValue()));
      //mapWidget.setValue('#'+insertOrGetAsset('img',_texture));
      //mapWidget.setValue('url(' + newUrl.getValue() + ')');
      if (mapWidget.onChangeCallback) {
        mapWidget.onChangeCallback();
      }
      editor.signals.hideModal.dispatch(assetsContent);
    });

    newContent.dom.appendChild(buttonAddNew);
    editor.signals.showModal.dispatch(container);
  });

  function select (section) {
    samplesTab.setClass('');
    assetsTab.setClass('');
    samplesTab.setClass('');

    assetsContent.setDisplay('none');
    samplesContent.setDisplay('none');
    newContent.setDisplay('none');

    switch (section) {
      case 'SAMPLES':
        samplesTab.setClass('selected');
        samplesContent.setDisplay('');
        break;
      case 'ASSETS':
        assetsTab.setClass('selected');
        assetsContent.setDisplay('');
        break;
      case 'NEW':
        newTab.setClass('selected');
        newContent.setDisplay('');
        break;
    }
  }

  select('ASSETS');
}

module.exports = AssetsDialog;

},{"../../lib/vendor/ui.js":3}],18:[function(require,module,exports){
var AssetsDialog = require('./assets');

function Dialogs (editor) {
  this.assets = new AssetsDialog(editor);
}

module.exports = Dialogs;

},{"./assets":17}],19:[function(require,module,exports){
/* global aframeEditor THREE */
var Panels = require('./panels');
var Dialogs = require('./dialogs');
var Viewport = require('./viewport');
var Events = require('./events.js');
var ComponentLoader = require('./componentloader.js');
var ShaderLoader = require('./shaderloader.js');

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
    this.componentLoader = new ComponentLoader();
    this.shaderLoader = new ShaderLoader();

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
    this.DEFAULT_CAMERA.updateMatrixWorld();

    this.camera = this.DEFAULT_CAMERA;

    this.initEvents();

    this.selected = null;
    this.dialogs = new Dialogs(this);
    this.panels = new Panels(this);
    this.scene = this.sceneEl.object3D;
    this.helpers = {};
    this.sceneHelpers = new THREE.Scene();
    this.sceneHelpers.visible = false;
    this.editorActive = false;

    this.viewport = new Viewport(this);
    this.signals.windowResize.dispatch();

    var scope = this;

    function addObjects (object) {
      for (var i = 0; i < object.children.length; i++) {
        var obj = object.children[i];
        scope.addObject(obj.children[0]);
      }
    }
    addObjects(this.sceneEl.object3D);

    this.scene.add(this.sceneHelpers);
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

    this.signals.showModal.add(function (content) {
      this.panels.modal.show(content);
    }.bind(this));
    this.signals.hideModal.add(function () {
      this.panels.modal.hide();
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
    //this.sceneEl.pause();
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

},{"./componentloader.js":16,"./dialogs":18,"./events.js":20,"./panels":28,"./shaderloader.js":38,"./viewport":39}],20:[function(require,module,exports){
var SIGNALS = require('signals');

module.exports = {
  generateComponentsPanels: new SIGNALS.Signal(),

  editorCleared: new SIGNALS.Signal(),
  transformModeChanged: new SIGNALS.Signal(),
  snapChanged: new SIGNALS.Signal(),
  spaceChanged: new SIGNALS.Signal(),
  rendererChanged: new SIGNALS.Signal(),

  sceneGraphChanged: new SIGNALS.Signal(),

  cameraChanged: new SIGNALS.Signal(),

  geometryChanged: new SIGNALS.Signal(),

  objectSelected: new SIGNALS.Signal(),
  objectFocused: new SIGNALS.Signal(),

  objectAdded: new SIGNALS.Signal(),
  objectChanged: new SIGNALS.Signal(),
  objectRemoved: new SIGNALS.Signal(),

  helperAdded: new SIGNALS.Signal(),
  helperRemoved: new SIGNALS.Signal(),

  materialChanged: new SIGNALS.Signal(),

  windowResize: new SIGNALS.Signal(),

  showGridChanged: new SIGNALS.Signal(),
  refreshSidebarObject3D: new SIGNALS.Signal(),
  refreshScriptEditor: new SIGNALS.Signal(),

  // A-FRAME
  entitySelected: new SIGNALS.Signal(),
  componentChanged: new SIGNALS.Signal(),
  editorModeChanged: new SIGNALS.Signal(),
  showModal: new SIGNALS.Signal(),
  hideModal: new SIGNALS.Signal(),
  showAssetsDialog: new SIGNALS.Signal()

};

},{"signals":14}],21:[function(require,module,exports){
module.exports = {
  parser: new window.DOMParser(),
  generateHtml: function () {
    var xmlDoc = this.parser.parseFromString(document.documentElement.innerHTML, 'text/html');

    // Remove all the components that are being injected by aframe-editor or aframe
    // @todo Use custom class to prevent this hack
    Array.prototype.forEach.call(xmlDoc.querySelectorAll('.a-enter-vr,.a-orientation-modal,.Panel,.editor-tools,.rs-base,.a-canvas,.a-enter-vr-button,style[data-href="style/rStats.css"],style[data-href^="src/panels"],style[data-href="style/aframe-core.css"],link[href^="https://maxcdn.bootstrapcdn.com"]'), function (el) {
      el.parentNode.removeChild(el);
    });

    return this.xmlToString(xmlDoc);
  },
  xmlToString: function (xmlData) {
    var xmlString;
    // IE
    if (window.ActiveXObject) {
      xmlString = xmlData.xml;
    } else {
      // Mozilla, Firefox, Opera, etc.
      xmlString = (new window.XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
  }
};

},{}],22:[function(require,module,exports){
var editor = require('./editor.js');

module.exports = {
  editor: editor
};

},{"./editor.js":19}],23:[function(require,module,exports){
/* global aframeCore */
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var WidgetsFactory = require('./widgetsfactory.js'); // @todo will be replaced with the npm package

function trim (s) {
  s = s.replace(/(^\s*)|(\s*$)/gi, '');
  s = s.replace(/[ ]{2,}/gi, ' ');
  s = s.replace(/\n /, '\n');
  return s;
}

function Attributes (editor) {
  var objectId, objectType, objectCustomRow;
  var componentsList, mixinsContainer;
  var ignoreComponentsChange = false;
  var commonComponents = ['position', 'rotation', 'scale', 'visible'];

  /**
   * Update the entity component value
   * @param  {Element} entity   Entity to modify
   * @param  {string} component     Name of the component
   * @param  {string} property Property name
   * @param  {string|number} value    New value
   */
  function handleEntityChange (entity, componentName, propertyName, value) {
    if (propertyName) {
      if (!value) {
        var parameters = entity.getAttribute(componentName);
        delete parameters[propertyName];
        entity.setAttribute(componentName, parameters);
      } else {
        entity.setAttribute(componentName, propertyName, value);
      }
    } else {
      if (!value) {
        entity.removeAttribute(componentName);
      } else {
        entity.setAttribute(componentName, value);
      }
    }
  }

  function generateMixinsPanel () {
    var container = new UI.CollapsiblePanel();

    container.addStatic(new UI.Text('Mixins').setTextTransform('uppercase'));
    container.add(new UI.Break());

    mixinsContainer = new UI.Row();
    container.add(mixinsContainer);

    var mixins = document.querySelectorAll('a-mixin');
    var mixinsOptions = {};

    for (var i = 0; i < mixins.length; i++) {
      mixinsOptions[ mixins[i].id ] = mixins[i].id;
    }

    var mixinsList = new UI.Select().setId('componentlist').setOptions(mixinsOptions).setWidth('150px');
    container.add(new UI.Text('Add').setWidth('90px'));
    container.add(mixinsList);
    var button = new UI.Button('+').onClick(function () {
      editor.selected.el.setAttribute('mixin', trim(editor.selected.el.getAttribute('mixin') + ' ' + mixinsList.getValue()));
    });
    container.add(button.setWidth('20px'));

    var newMixin = new UI.Button('New');
    newMixin.onClick(function () {
      window.alert('This button should create a mixin based on the current entity components values');
    });
    container.add(newMixin);

    return container;
  }

  /**
   * Generates a container with the common attributes and components for each entity:
   *   - type
   *   - ID
   *   - position
   *   - rotation
   *   - scale
   *   - visible
   * @return {UI.CollapsiblePanel} Panel containing all the widgets
   */
  function generateCommonComponentsPanel () {
    var container = new UI.CollapsiblePanel();

    container.addStatic(new UI.Text('Common attributes').setTextTransform('uppercase'));
    container.add(new UI.Break());

    // type
    var objectTypeRow = new UI.Row();
    objectType = new UI.Text();

    objectTypeRow.add(new UI.Text('Type').setWidth('90px'));
    objectTypeRow.add(objectType);

    container.add(objectTypeRow);

    // ID
    var objectIdRow = new UI.Row();
    objectId = new UI.Input().setWidth('150px').setFontSize('12px').onChange(function () {
      handleEntityChange(editor.selected.el, 'id', null, objectId.getValue());
      editor.signals.sceneGraphChanged.dispatch();
    });

    objectIdRow.add(new UI.Text('ID').setWidth('90px'));
    objectIdRow.add(objectId);
    container.add(objectIdRow);

    // Add the parameter rows for the common components
    for (var i = 0; i < commonComponents.length; i++) {
      container.add(getPropertyRow(commonComponents[i], null, aframeCore.components[commonComponents[i]].schema));
    }

    return container;
  }

  /**
   * Add component to the entity
   * @param {Element} entity        Entity
   * @param {string} componentName Component name
   */
  function addComponentToEntity (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
  }

  /**
   * Generate a row including a combobox with the available components to add to
   * the current entity
   */
  function generateAddComponentRow () {
    var container = new UI.CollapsiblePanel();

    container.addStatic(new UI.Text('COMPONENTS'));
    container.add(new UI.Break());

    var componentsRow = new UI.Row();
    container.add(componentsRow);

    var componentsOptions = {};
    for (var name in aframeCore.components) {
      if (commonComponents.indexOf(name) === -1) {
        componentsOptions[name] = name;
      }
    }

    for (name in editor.componentLoader.components) {
      componentsOptions[name] = name;
    }

    componentsList = new UI.Select().setId('componentlist').setOptions(componentsOptions).setWidth('150px');

    componentsRow.add(new UI.Text('Add').setWidth('90px'));
    componentsRow.add(componentsList);
    var button = new UI.Button('+').onClick(function () {
      editor.componentLoader.addComponentToScene(componentsList.getValue(), function () {
        // Add the selected component from the combobox to the current active entity
        addComponentToEntity(editor.selected.el, componentsList.getValue());
      });
    });
    componentsRow.add(button.setWidth('20px'));
    return container;
  }

  /**
   * Update the UI widgets based on the current entity & components values
   * @param  {Element} entity Entity currently selected
   */
  function updateUI (entity) {
    if (ignoreComponentsChange) {
      return;
    }

    objectType.setValue(entity.tagName);
    objectId.setValue(entity.id);

    // Disable the components already used form the list of available
    // components to add to this entity
    var availableComponents = componentsList.dom.querySelectorAll('option');
    for (var i = 0; i < availableComponents.length; i++) {
      availableComponents[i].disabled = entity.getAttribute(availableComponents[i].value);
    }

    // Set the common properties & components to default as they're not recreated
    // as the entity changed
    for (i = 0; i < commonComponents.length; i++) {
      var componentName = commonComponents[i];
      var component = aframeCore.components[componentName];
      if (component.schema.hasOwnProperty('default')) {
        WidgetsFactory.updateWidgetValue(componentName, component.schema.default);
      } else {
        for (var propertyName in component.schema) {
          WidgetsFactory.updateWidgetValue(componentName + '.' + propertyName, component.schema[propertyName].default);
        }
      }
    }

    // Set the widget values for each components' attributes
    var entityComponents = Array.prototype.slice.call(entity.attributes);
    entityComponents.forEach(function (component) {
      var properties = entity.getAttribute(component.name);

      // The attributeIf the properties refer to a single value or multivalue like position {x:0, y:0, z:0}
      if (WidgetsFactory.widgets[component.name] || typeof properties !== 'object') {
        WidgetsFactory.updateWidgetValue(component.name, properties);
      } else {
        // Some components has multiple attributes like geometry {primitive: box}
        for (var property in properties) {
          var id = component.name + '.' + property;
          WidgetsFactory.updateWidgetValue(id, properties[property]);
        }
      }
    });

    // Update mixins list
    mixinsContainer.dom.innerHTML = '';
    entity.mixinEls.forEach(function (mixin) {
      var name = new UI.Text(mixin.id).setWidth('160px').setFontSize('12px');
      mixinsContainer.add(name);

      var edit = new UI.Button('Edit').setDisabled(true);
      edit.setMarginLeft('4px');
      edit.onClick(function () {
        //  signals.editScript.dispatch( object, script );
      });
      mixinsContainer.add(edit);

      var remove = new UI.Button('Remove');
      remove.setMarginLeft('4px');
      remove.onClick(function () {
        entity.setAttribute('mixin', trim(entity.getAttribute('mixin').replace(mixin.id, '')));
      });
      mixinsContainer.add(remove);

      mixinsContainer.add(new UI.Break());
    });
    WidgetsFactory.updateWidgetVisibility(entity);
  }

  /**
   * Reset to default (clear) one entity's component
   * @param {Element} entity        Entity
   * @param {string} componentName Component name to clear
   */
  function setEmptyComponent (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  }

  /**
   * Generates a row containing the parameter label and its widget
   * @param {string} componentName   Component name
   * @param {string} propertyName   Property name
   * @param {object} propertySchema Property schema
   */
  function getPropertyRow (componentName, propertyName, propertySchema) {
    var propertyRow = new UI.Row();
    var panelName = propertyName || componentName;
    var label = new UI.Text(panelName);
    propertyRow.add(label);

    label.setWidth('120px');
    var newWidget = WidgetsFactory.getWidgetFromProperty(componentName, null, propertyName, updateEntityValue, propertySchema);
    newWidget.propertyRow = propertyRow;
    propertyRow.add(newWidget);

    return propertyRow;
  }

  /**
   * Generate an UI.CollapsiblePanel for each entity's component
   * @param  {Element} entity Current selected entity
   */
  function generateComponentsPanels (entity) {
    objectCustomRow.clear();

    for (var componentName in entity.components) {
      // Ignore the components that we've already included on the common attributes panel
      if (commonComponents.indexOf(componentName) !== -1) {
        continue;
      }

      var component = entity.components[componentName];

      // Add a context menu to delete or reset the component
      var objectActions = new UI.Select()
        .setId(componentName)
        .setPosition('absolute')
        .setRight('8px')
        .setFontSize('11px')
        .setOptions({
          'Actions': 'Actions',
          'Delete': 'Delete',
          'Clear': 'Clear'
        })
        .onClick(function (event) {
          event.stopPropagation(); // Avoid panel collapsing
        })
        .onChange(function (event, component) {
          var action = this.getValue();
          switch (action) {
            case 'Delete':
              entity.removeAttribute(this.getId());
              break;

            case 'Clear':
              setEmptyComponent(entity, this.getId());
              break;

            default:
              return;
          }
          this.setValue('Actions');
          generateComponentsPanels(entity);
          updateUI(entity);
          editor.signals.objectChanged.dispatch(entity.object3D);
        });

      // Collapsible panel with component name as title
      var container = new UI.CollapsiblePanel();
      container.addStatic(new UI.Text(componentName).setTextTransform('uppercase'), objectActions);
      container.add(new UI.Break());

      // Add a widget's row for each parameter on the component
      for (var propertyName in component.schema) {
        container.add(getPropertyRow(componentName, propertyName, component.schema[propertyName]));
      }

      container.add(new UI.Break());
      objectCustomRow.add(container);
    }
  }

  /**
   * Callback when a widget value is updated so we could update the entity attributes
   * @param  {EventTarget} event         Event generated by the onChange listener
   * @param  {string} componentName Component name being modified (eg: 'geometry')
   * @param  {string} attributeName Attribute name being modified (eg: 'primitive')
   * @param  {string} property      Property name, if any, being modified (eg: 'x')
   */
  function updateEntityValue (event, componentName, attributeName, property) {
    ignoreComponentsChange = true;
    var entity = editor.selected.el;
    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
    var widget = WidgetsFactory.widgets[id];

    handleEntityChange(entity, componentName, property, widget.getValue());

    WidgetsFactory.updateWidgetVisibility(entity);

    editor.signals.objectChanged.dispatch(entity.object3D);
    ignoreComponentsChange = false;
  }

  // Generate main attributes panel
  var container = new UI.Panel();
  container.setBorderTop('0');
  container.setPaddingTop('20px');
  container.setDisplay('none');

  // Add common attributes panel (type, id, position, rotation, scale, visible)
  container.add(generateCommonComponentsPanel());

  // Add common attributes panel (type, id, position, rotation, scale, visible)
  container.add(generateMixinsPanel());

  // Append the components list that the user can add to the selected entity
  container.add(generateAddComponentRow());

  // Empty row used to append the panels from each component
  objectCustomRow = new UI.Row();
  container.add(objectCustomRow);

  // Signal dispatchers
  editor.signals.entitySelected.add(function (entity) {
    if (entity) {
      container.show();
      generateComponentsPanels(entity);
      updateUI(entity);
    } else {
      container.hide();
    }
  });
  editor.signals.componentChanged.add(function (evt) {
    var entity = evt.detail.target;

    /*
    if (evt.detail.newData.shader && evt.detail.newData.shader !== evt.detail.oldData.shader) {
      aframeEditor.editor.shaderLoader.addShaderToScene(evt.detail.newData.shader, function () {
        entity.components.material.update(evt.detail.oldData);
        generateComponentsPanels(editor.selected.el);
        ignoreComponentsChange = false;
        updateUI(entity);
        editor.signals.objectChanged.dispatch(entity.object3D);
      });
      return;
    }
    */

    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  });

  editor.signals.generateComponentsPanels.add(function () {
    generateComponentsPanels(editor.selected.el);
    ignoreComponentsChange = false;
    updateUI(editor.selected.el);
  });

  return container;
}

module.exports = Attributes;

},{"../../lib/vendor/ui.js":3,"./widgetsfactory.js":37}],24:[function(require,module,exports){
var css = ".Outliner{height:300px}.Entity{color:#88e}.Template{color:#8e8}.Animation{color:#e88}.assets-dialog .Input{border:1px solid #999!important}"; (require("browserify-css").createStyle(css, { "href": "src\\panels\\css\\custom.css"})); module.exports = css;
},{"browserify-css":4}],25:[function(require,module,exports){
var css = ".Outliner{color:#444;background:#fff;padding:0;width:100%;height:140px;font-size:12px;cursor:default;overflow:auto;outline:0}.Outliner .option{padding:4px;color:#666;white-space:nowrap}.Outliner .option.active{background-color:#f8f8f8}input.Number{color:#0080f0!important;font-size:12px;border:0;padding:2px;cursor:col-resize}#viewport{position:absolute;top:32px;left:0;right:300px;bottom:32px}#viewport #info{text-shadow:1px 1px 0 rgba(0,0,0,.25);pointer-events:none}#script{position:absolute;top:32px;left:0;right:300px;bottom:32px;opacity:.9}#player{position:absolute;top:32px;left:0;right:300px;bottom:32px}#menubar{position:absolute;width:100%;height:32px;background:#eee;padding:0;margin:0;right:0;top:0}#menubar .menu{float:left;cursor:pointer;padding-right:8px}#menubar .menu.right{float:right;cursor:auto;padding-right:0;text-align:right}#menubar .menu .title{display:inline-block;color:#888;margin:0;padding:8px}#menubar .menu .options{position:absolute;display:none;padding:5px 0;background:#eee;width:150px}#menubar .menu:hover .options{display:block}#menubar .menu .options hr{border-color:#ddd}#menubar .menu .options .option{color:#666;background-color:transparent;padding:5px 10px;margin:0!important}#menubar .menu .options .option:hover{color:#fff;background-color:#08f}#menubar .menu .options .option:active{color:#666;background:0 0}#menubar .menu .options .inactive{color:#bbb;background-color:transparent;padding:5px 10px;margin:0!important}#sidebar{position:absolute;right:0;top:32px;bottom:0;width:300px;background:#eee;overflow:auto}#sidebar *{vertical-align:middle}#sidebar input,#sidebar select,#sidebar textarea{border:1px solid transparent;color:#444}#sidebar .Panel{color:#888;padding:10px;border-top:1px solid #ccc}#sidebar .Panel.collapsed{margin-bottom:0}#sidebar .Row{min-height:20px;margin-bottom:10px}#tabs{background-color:#ddd;border-top:1px solid #ccc}#tabs span{color:#aaa;border-right:1px solid #ccc;padding:10px}#tabs span.selected{color:#888;background-color:#eee}#toolbar{position:absolute;left:0;right:300px;bottom:0;height:32px;background:#eee;color:#333}#toolbar *{vertical-align:middle}#toolbar .Panel{padding:4px;color:#888}#toolbar button{margin-right:6px}"; (require("browserify-css").createStyle(css, { "href": "src\\panels\\css\\light.css"})); module.exports = css;
},{"browserify-css":4}],26:[function(require,module,exports){
var css = "body{font-family:Helvetica,Arial,sans-serif;font-size:14px;margin:0;overflow:hidden}hr{border:0;border-top:1px solid #ccc}button{position:relative}textarea{tab-size:4;white-space:pre;word-wrap:normal}textarea.success{border-color:#8b8!important}textarea.fail{border-color:red!important;background-color:rgba(255,0,0,.05)}input,textarea{outline:0}.Panel{-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-o-user-select:none;user-select:none}.Panel.Collapsible .Static{margin:0}.Panel.Collapsible .Static .Button{float:left;margin-right:6px;width:0;height:0;border:6px solid transparent}.Panel.Collapsible.collapsed .Static .Button{margin-top:2px;border-left-color:#bbb}.Panel.Collapsible:not(.collapsed) .Static .Button{margin-top:6px;border-top-color:#bbb}.Panel.Collapsible.collapsed .Content{display:none}.CodeMirror{position:absolute!important;top:37px;width:100%!important;height:calc(100% - 37px)!important}.CodeMirror .errorLine{background:rgba(255,0,0,.25)}.CodeMirror .esprima-error{color:red;text-align:right;padding:0 20px}.type{position:relative;top:-2px;padding:0 2px;color:#ddd}.type:after{content:'■'}.Scene{color:#ccf}.Object3D{color:#aae}.Mesh{color:#88e}.Line,.LineSegments{color:#8e8}.Points{color:#e88}.PointLight{color:#dd0}.Geometry{color:#8f8}.BoxGeometry{color:#beb}.TorusGeometry{color:#aea}.Material{color:#f88}.MeshPhongMaterial{color:#fa8}"; (require("browserify-css").createStyle(css, { "href": "src\\panels\\css\\main.css"})); module.exports = css;
},{"browserify-css":4}],27:[function(require,module,exports){
var css = ".editor-tools{position:absolute;bottom:0;background:rgba(255,255,255,.8)}.editor-tools button{float:left}"; (require("browserify-css").createStyle(css, { "href": "src\\panels\\css\\toolbar.css"})); module.exports = css;
},{"browserify-css":4}],28:[function(require,module,exports){
require('./css/main.css');
require('./css/light.css');
require('./css/custom.css');
require('./css/toolbar.css');

var ToolPanel = require('./tools');
var Sidebar = require('./sidebar.js');
var Menubar = require('./menubar/index.js');
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function Panels (editor) {
  this.toolPanel = new ToolPanel(editor);
  document.body.appendChild(this.toolPanel.el);

  this.sidebar = new Sidebar(editor);
  this.sidebar.hide();
  document.body.appendChild(this.sidebar.dom);

  this.menubar = new Menubar(editor);
  this.menubar.hide();
  document.body.appendChild(this.menubar.dom);

  this.modal = new UI.Modal();
  document.body.appendChild(this.modal.dom);
}

module.exports = Panels;

},{"../../lib/vendor/ui.js":3,"./css/custom.css":24,"./css/light.css":25,"./css/main.css":26,"./css/toolbar.css":27,"./menubar/index.js":30,"./sidebar.js":35,"./tools":36}],29:[function(require,module,exports){
var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function MenuAssets (editor) {
  var container = new UI.Panel();
  container.setClass('menu');

  var title = new UI.Panel();
  title.setClass('title');
  title.setTextContent('Assets');
  container.add(title);
/*
  var options = new UI.Panel();
  options.setClass('options');
  container.add(options);

  // --------------------------------------------
  // Add texture
  // --------------------------------------------
  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Add Texture');
  option.onClick(function () {
    var text = new UI.Text('Hello from UI modal');
    editor.signals.showModal.dispatch(text);
  });
  options.add(option);

  // --------------------------------------------
  // Add texture
  // --------------------------------------------
  option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Add 3d Model');
  option.onClick(function () {});
  options.add(option);
*/
  return container;
}

module.exports = MenuAssets;

},{"../../../lib/vendor/ui.js":3}],30:[function(require,module,exports){
var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var MenuObjects = require('./objects.js');
var MenuScene = require('./scene.js');
var MenuStatus = require('./status.js');
var MenuAssets = require('./assets.js');

function Menubar (editor) {
  var container = new UI.Panel();
  container.setId('menubar');

  container.add(new MenuScene(editor));
  container.add(new MenuObjects(editor));
  container.add(new MenuAssets(editor));

  container.add(new MenuStatus(editor));

  return container;
}

module.exports = Menubar;

},{"../../../lib/vendor/ui.js":3,"./assets.js":29,"./objects.js":31,"./scene.js":32,"./status.js":33}],31:[function(require,module,exports){
var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function MenuObjects (editor) {
  var container = new UI.Panel();
  container.setClass('menu');

  var title = new UI.Panel();
  title.setClass('title');
  title.setTextContent('Add');
  container.add(title);

  var options = new UI.Panel();
  options.setClass('options');
  container.add(options);

  // --------------------------------------------
  // New
  // --------------------------------------------

  /**
   * Helper function to add a new entity with a list of components
   * @param  {object} definition Entity definition to add:
   *                             {element: 'a-entity', components: {geometry: 'primitive:box'}}
   * @return {Element}            Entity created
   */
  function createNewEntity (definition) {
    var entity = document.createElement(definition.element);

    // load default attributes
    for (var attr in definition.components) {
      entity.setAttribute(attr, definition.components[attr]);
    }

    // Ensure the components are loaded before update the UI
    entity.addEventListener('loaded', function () {
      editor.addEntity(entity);
    });

    editor.sceneEl.appendChild(entity);

    return entity;
  }

  // List of definitions to add in the menu. A line break is added everytime 'group' attribute changes.
  var primitivesDefinitions = {
    'Entity': {group: 'entities', element: 'a-entity', components: {}},

    'Box': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:box', material: 'color:#f00'}},
    'Sphere': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:sphere', material: 'color:#ff0'}},
    'Cylinder': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:cylinder', material: 'color:#00f'}},
    'Plane': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:plane', material: 'color:#fff'}},
    'Torus': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:torus', material: 'color:#0f0'}},
    'TorusKnot': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:torusKnot', material: 'color:#f0f'}},
    'Circle': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:circle', material: 'color:#f0f'}},
    'Ring': {group: 'primitives', element: 'a-entity', components: {geometry: 'primitive:ring', material: 'color:#0ff'}},

    'Ambient': {group: 'lights', element: 'a-entity', components: {light: 'type:ambient'}},
    'Directional': {group: 'lights', element: 'a-entity', components: {light: 'type:directional'}},
    'Hemisphere': {group: 'lights', element: 'a-entity', components: {light: 'type:hemisphere'}},
    'Point': {group: 'lights', element: 'a-entity', components: {light: 'type:point'}},
    'Spot': {group: 'lights', element: 'a-entity', components: {light: 'type:spot'}},

    'Camera': {group: 'cameras', element: 'a-entity', components: {camera: ''}}
  };

  var prevGroup = null;
  for (var definition in primitivesDefinitions) {
    // Add a line break if the group changes
    if (prevGroup === null) {
      prevGroup = primitivesDefinitions[definition].group;
    } else if (prevGroup !== primitivesDefinitions[definition].group) {
      prevGroup = primitivesDefinitions[definition].group;
      options.add(new UI.HorizontalRule());
    }

    // Generate a new option in the menu
    var option = new UI.Row();
    option.setClass('option');
    option.setTextContent(definition);
    option.dom.onclick = (function (def) {
      return function () {
        createNewEntity(def);
      };
    })(primitivesDefinitions[definition]);
    options.add(option);
  }

  return container;
}

module.exports = MenuObjects;

},{"../../../lib/vendor/ui.js":3}],32:[function(require,module,exports){
/* global URL Blob */
var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var Clipboard = require('clipboard');
var Exporter = require('../../exporter.js');

function MenuScene (editor) {
  var container = new UI.Panel();
  container.setClass('menu');

  var title = new UI.Panel();
  title.setClass('title');
  title.setTextContent('Scene');
  container.add(title);

  var options = new UI.Panel();
  options.setClass('options');
  container.add(options);

  // --------------------------------------------
  // New
  // --------------------------------------------
/*  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('New');
  option.onClick(function () {
    if (window.confirm('Any unsaved data will be lost. Are you sure?')) {
      editor.clear();
    }
  });
  options.add(option);
*/

  // --------------------------------------------
  // Save HTML
  // --------------------------------------------
  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Save HTML');
  option.onClick(function () {
    saveString(Exporter.generateHtml(), 'ascene.html');
  });
  options.add(option);

  // --------------------------------------------
  // Save HTML
  // --------------------------------------------
  option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Copy to clipboard');
  option.setId('copy-scene');
  options.add(option);

  var clipboard = new Clipboard('#copy-scene', {
    text: function (trigger) {
      return Exporter.generateHtml();
    }
  });

  //
  var link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link); // Firefox workaround, see #6594
  function save (blob, filename) {
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'data.json';
    link.click();
    // URL.revokeObjectURL(url); breaks Firefox...
  }

  function saveString (text, filename) {
    save(new Blob([ text ], { type: 'text/plain' }), filename);
  }

  return container;
}

module.exports = MenuScene;

},{"../../../lib/vendor/ui.js":3,"../../exporter.js":21,"clipboard":6}],33:[function(require,module,exports){
/* global aframeCore */
var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function MenuStatus (editor) {
  var container = new UI.Panel();
  container.setClass('menu right');

  var version = new UI.Text('aframe v' + aframeCore.version);

  version.setClass('title');
  version.setOpacity(0.5);
  container.add(version);

  return container;
}

module.exports = MenuStatus;

},{"../../../lib/vendor/ui.js":3}],34:[function(require,module,exports){
/* global aframeEditor */
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function SceneGraph (editor) {
  // Megahack to include font-awesome
  // -------------
  var link = document.createElement('link');
  link.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css';
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.media = 'screen,print';
  document.getElementsByTagName('head')[0].appendChild(link);
  // ------------

  this.scene = editor.sceneEl;

  var signals = editor.signals;
  var container = new UI.Panel();
  var ignoreObjectSelectedSignal = false;
  var outliner = this.outliner = new UI.Outliner(editor);

  // handle entity selection change in panel
  outliner.onChange(function (e) {
    ignoreObjectSelectedSignal = true;
    aframeEditor.editor.selectEntity(outliner.getValue());
    ignoreObjectSelectedSignal = false;
  });

  // handle enttiy change selection from scene.
  signals.objectSelected.add(function (object) {
    // ignore automated selection of object in scene triggered from outliner.
    if (ignoreObjectSelectedSignal === true) { return; }
    // set outliner to current selected object
    outliner.setValue(object !== null ? object.el : null);
  });

  signals.sceneGraphChanged.add(this.refresh, this);

  container.add(outliner);
  var buttonRemove = new UI.Button('Delete').onClick(function () {
    if (editor.selectedEntity) {
      editor.selectedEntity.parentNode.removeChild(editor.selectedEntity);
      editor.selectEntity(null);
      this.refresh();
    }
  }.bind(this));
  container.add(buttonRemove);
  container.add(new UI.Break());

  this.refresh();

  return container;
}

SceneGraph.prototype.refresh = function () {
  var options = [];
  options.push({ static: true, value: this.scene, html: '<span class="type"></span> a-scene' });

  function treeIterate (element, depth) {
    if (!element) {
      return;
    }

    if (depth === undefined) {
      depth = 1;
    } else {
      depth += 1;
    }
    var children = element.children;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      // filter out all entities added by editor and the canvas added by aframe-core
      if (!child.dataset.isEditor && child.isEntity) {
        var extra = '';

        var icons = {'camera': 'fa-video-camera', 'light': 'fa-lightbulb-o', 'geometry': 'fa-cube', 'material': 'fa-picture-o'};
        for (var icon in icons) {
          if (child.components && child.components[icon]) {
            extra += ' <i class="fa ' + icons[icon] + '"></i>';
          }
        }

        var typeClass = 'Entity';
        switch (child.tagName.toLowerCase()) {
          case 'a-animation':
            typeClass = 'Animation';
            break;
          case 'a-entity':
            typeClass = 'Entity';
            break;
          default:
            typeClass = 'Template';
        }

        var type = '<span class="type ' + typeClass + '"></span>';
        var pad = '&nbsp;&nbsp;&nbsp;'.repeat(depth);
        var label = child.id ? child.id : child.tagName.toLowerCase();

        options.push({
          static: true,
          value: child,
          html: pad + type + label + extra
        });

        if (child.tagName.toLowerCase() !== 'a-entity') {
          continue;
        }
        treeIterate(child, depth);
      }
    }
  }
  treeIterate(this.scene);
  this.outliner.setOptions(options);
};

module.exports = SceneGraph;

},{"../../lib/vendor/ui.js":3}],35:[function(require,module,exports){
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var SceneGraph = require('./scenegraph');
var Attributes = require('./attributes');

function Sidebar (editor) {
  var container = new UI.Panel();
  container.setId('sidebar');

  // @todo This must taken out from here and put in another panel
  // -------------------------------------
  var buttons = new UI.Panel();
  container.add(buttons);

  // translate / rotate / scale
  var translate = new UI.Button('translate').onClick(function () {
    editor.signals.transformModeChanged.dispatch('translate');
  });
  buttons.add(translate);

  var rotate = new UI.Button('rotate').onClick(function () {
    editor.signals.transformModeChanged.dispatch('rotate');
  });
  buttons.add(rotate);

  var scale = new UI.Button('scale').onClick(function () {
    editor.signals.transformModeChanged.dispatch('scale');
  });
  buttons.add(scale);
  // -------------------------------------

  var tabs = new UI.Div();
  tabs.setId('tabs');

  var sceneTab = new UI.Text('SCENE').onClick(onClick);
  var assetsTab = new UI.Text('ASSETS').onClick(onClick);

  tabs.add(sceneTab, assetsTab);
  container.add(tabs);

  function onClick (event) {
    select(event.target.textContent);
  }

  this.sceneGraph = new SceneGraph(editor);
  this.attributes = new Attributes(editor);

  var scene = new UI.Span().add(
    this.sceneGraph,
    this.attributes
  );

  container.add(scene);

  function select (section) {
    sceneTab.setClass('');
    assetsTab.setClass('');

    scene.setDisplay('none');
    // assets.setDisplay('none');

    switch (section) {
      case 'SCENE':
        sceneTab.setClass('selected');
        scene.setDisplay('');
        break;
      case 'ASSETS':
        assetsTab.setClass('selected');
        // assets.setDisplay('');
        break;
    }
  }

  select('SCENE');

  return container;
}

module.exports = Sidebar;

},{"../../lib/vendor/ui.js":3,"./attributes":23,"./scenegraph":34}],36:[function(require,module,exports){
function Panel (editor) {
  this.el = document.createElement('div');
  this.el.classList.add('editor-tools');
  this.editor = editor;
  this.active = false;
  this.editToggle();
}

Panel.prototype.editToggle = function () {
  this.toggleButton = document.createElement('button');
  this.toggleButton.innerHTML = 'Edit';
  this.el.appendChild(this.toggleButton);
  this.toggleButton.addEventListener('click', this.onToggleClick.bind(this));
};

Panel.prototype.onToggleClick = function (e) {
  this.active = this.active === false;

  if (this.active) {
    this.editor.enable();
    this.toggleButton.innerHTML = 'Exit';
  } else {
    this.editor.disable();
    this.toggleButton.innerHTML = 'Edit';
  }
};

module.exports = Panel;

},{}],37:[function(require,module,exports){
/* global aframeCore aframeEditor */
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

module.exports = {
  widgets: {},
  knownWidgetsType: ['select', 'boolean', 'number', 'int', 'string', 'map', 'color', 'vec3'],

  /**
   * [updateWidgetValue description]
   * @param  {[type]} id    [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  updateWidgetValue: function (id, value) {
    if (this.widgets[id]) {
      this.widgets[id].setValue(value);
      return true;
    }
    return false;
  },

  /**
   * Given an propertySchema it will returns the infered by the default value in case
   * that 'type' attribute is not defined
   * @param  {object} propertySchema JSON schema for the attribute
   * @return {string}                 Property type
   */
  getPropertyType: function (propertySchema) {
    var defaultValue = propertySchema.default;
    if (propertySchema.oneOf) {
      return 'select';
    } else if (propertySchema.type && this.knownWidgetsType.indexOf(propertySchema.type) !== -1) {
      return propertySchema.type;
    } else {
      switch (typeof defaultValue) {
        case 'boolean':
          return 'boolean';
        case 'number':
          return 'number';
        case 'object':
          return 'vec3';
        case 'string':
          return (defaultValue.indexOf('#') === -1) ? 'string' : 'color';
        default:
          console.warn('Unknown attribute', propertySchema);
          return null;
      }
    }
  },

  /**
   * Creates and returns a widget based on the type of the attribute
   * If a schema is provided it's used to set min/max values or populate the combobox values.
   * @param {string} componentName   Name of the component that has this attribute (e.g: 'geometry')
   * @param {string} propertyName   Property name in the component (e.g: 'primitive')
   * @param {string} property        Property name in case of multivalues attributes (e.g: 'x')
   * @param {string} type            Type of the widget to generate (e.g: 'checkbox')
   * @param {JSON} propertySchema [Optional] JSON with the schema definition of the attribute.
   * @return {UI.Widget} Returns an UI.js widget based on the type and schema of the attribute.
   */
  getWidgetFromProperty: function (componentName, propertyName, property, onUpdateEntityValue, propertySchema) {
    var widget = null;
    if (typeof propertySchema === 'undefined') {
      propertySchema = {};
    } else if (typeof propertySchema !== 'object') {
      console.error(componentName, propertyName, property, propertySchema);
    }

    var type = this.getPropertyType(propertySchema);
    var onChange = null;

    switch (type) {
      case 'select':
        var options = {};
        // Convert array to object
        for (var key in propertySchema.oneOf) {
          options[propertySchema.oneOf[key]] = propertySchema.oneOf[key];
        }

        if (componentName === 'material' && property === 'shader') {
          // @fixme Better access to shaders
          for (var shader in aframeEditor.editor.shaderLoader.shaders) {
            options[shader] = shader;
          }

          onChange = function (event) {
            aframeEditor.editor.shaderLoader.addShaderToScene(event.target.options[event.target.selectedIndex].value, function () {
              onUpdateEntityValue(event, componentName, propertyName, property);
              aframeEditor.editor.signals.generateComponentsPanels.dispatch();
            });
          };
        }

        widget = new UI.Select().setOptions(options);
        break;
      case 'boolean':
        widget = new UI.Checkbox().setWidth('50px');
        break;
      case 'number':
        widget = new UI.Number().setWidth('50px');
        break;
      case 'int':
        widget = new UI.Number().setWidth('50px').setPrecision(0);
        break;
      case 'string':
        widget = new UI.Input('').setWidth('50px');
        break;
      case 'color':
        widget = new UI.Color().setWidth('50px');
        break;
      case 'map':
        widget = new UI.Texture();
        break;
      case 'vec3':
        widget = new UI.Vector3().setWidth('150px');
        break;
      default:
        console.warn('Unknown component type', componentName, propertyName, property, type);
        widget = new UI.Input('');
    }
    if (propertySchema.hasOwnProperty('min')) {
      widget.min = propertySchema.min;
    }
    if (propertySchema.hasOwnProperty('max')) {
      widget.max = propertySchema.max;
    }
    widget.schema = propertySchema;

    if (onChange) {
      widget.onChange(onChange);
    } else {
      widget.onChange(function (event) {
        onUpdateEntityValue(event, componentName, propertyName, property);
      });
    }

    // Generate an unique ID for this attribute (e.g: geometry.primitive)
    // and save it on the widgets variable so we could easily access to it in the following functions
    var id = propertyName ? componentName + '.' + propertyName + '.' + property : property ? (componentName + '.' + property) : componentName;
    widget.setId(id);
    widget.setValue(propertySchema.default);

    this.widgets[id] = widget;
    return widget;
  },

  /**
   * Update the widgets visibility based on the 'if' attribute from theirs attribute' schema
   * @param  {Element} entity Entity currently selected
   */
  updateWidgetVisibility: function (entity) {
    for (var componentName in entity.components) {
      var properties = aframeCore.components[componentName].schema;
      for (var property in properties) {
        var id = componentName + '.' + property;
        var widget = this.widgets[id];
        if (widget && widget.propertyRow) {
          var visible = true;
          if (widget.schema.if) {
            for (var condition in widget.schema.if) {
              var ifWidget = this.widgets[componentName + '.' + condition];
              if (widget.schema.if[condition].indexOf(ifWidget.getValue()) === -1) {
                visible = false;
              }
            }
          }
          if (visible) {
            widget.propertyRow.show();
          } else {
            widget.propertyRow.hide();
          }
        }
      }
    }
  }

};

},{"../../lib/vendor/ui.js":3}],38:[function(require,module,exports){
// Reuse componentLoader and create just one loader for both types
function ShaderLoader () {
  this.shaders = null;
  this.loadShadersData();
}

ShaderLoader.prototype = {
  loadShadersData: function () {
    var xhr = new window.XMLHttpRequest();
    // @todo Remove the sync call and use a callback
    xhr.open('GET', 'https://raw.githubusercontent.com/fernandojsg/aframe-shaders/master/shaders.json', false);
    // xhr.open('GET', 'https://raw.githubusercontent.com/aframevr/aframe-shaders/master/shaders.json', false);
    xhr.onload = function () {
      this.shaders = window.JSON.parse(xhr.responseText);
      console.info('Loaded Shaders:', Object.keys(this.shaders).length);
    }.bind(this);
    xhr.onerror = function () {
      // process error
    };
    xhr.send();
  },
  addShaderToScene: function (shaderName, onLoaded) {
    var shader = this.shaders[shaderName];
    if (shader && !shader.included) {
      console.log('Shader', shaderName, 'loaded!');
      var script = document.createElement('script');
      script.src = shader.url;
      script.setAttribute('data-shader-name', shaderName);
      script.setAttribute('data-shader-description', shader.description);
      script.onload = script.onreadystatechange = function () {
        script.onreadystatechange = script.onload = null;
        onLoaded();
      };
      var head = document.getElementsByTagName('head')[0];
      (head || document.body).appendChild(script);

      var link = document.createElement('script');
      link.href = shader.url;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.getElementsByTagName('head')[0].appendChild(link);
      shader.included = true;
    } else {
      onLoaded();
    }
  }
};

module.exports = ShaderLoader;

},{}],39:[function(require,module,exports){
/* global aframeEditor THREE CustomEvent */
var TransformControls = require('../../lib/vendor/threejs/TransformControls.js');
var EditorControls = require('../../lib/vendor/threejs/EditorControls.js');

function getNumber (value) {
  return parseFloat(value.toFixed(2));
}

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
  var cameraEl = document.createElement('a-entity');
  cameraEl.setObject3D('camera', camera);
  cameraEl.load();

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

      selectionBox.update(object);

      if (editor.helpers[ objectId ] !== undefined) {
        editor.helpers[ objectId ].update();
      }

      switch (transformControls.getMode()) {
        case 'translate':
          object.el.setAttribute('position', {x: getNumber(object.position.x), y: getNumber(object.position.y), z: getNumber(object.position.z)});
          break;
        case 'rotate':
          object.el.setAttribute('rotation', {
            x: THREE.Math.radToDeg(getNumber(object.rotation.x)),
            y: THREE.Math.radToDeg(getNumber(object.rotation.y)),
            z: THREE.Math.radToDeg(getNumber(object.rotation.z))});
          break;
        case 'scale':
          object.el.setAttribute('scale', {x: getNumber(object.scale.x), y: getNumber(object.scale.y), z: getNumber(object.scale.z)});
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
    if (aframeEditor.editor.selectedEntity.object3DMap['mesh']) {
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
    if (event instanceof CustomEvent) {
      return;
    }

    event.preventDefault();

    var array = getMousePosition(editor.container, event.clientX, event.clientY);
    onDownPosition.fromArray(array);

    document.addEventListener('mouseup', onMouseUp, false);
  }

  function onMouseUp (event) {
    if (event instanceof CustomEvent) {
      return;
    }

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
    console.log("ASDF");
    selectionBox.visible = false;
    transformControls.detach();
    if (object !== null) {
      selectionBox.update(object);
      selectionBox.visible = true;

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
      aframeEditor.editor.sceneEl.systems.camera.setActiveCamera(cameraEl);
      document.querySelector('.a-enter-vr,.rs-base').style.display = 'none';
    } else {
      aframeEditor.editor.defaultCameraEl.setAttribute('camera', 'active', 'true');
      document.querySelector('.a-enter-vr,.rs-base').style.display = 'block';
    }
  });

}

module.exports = Viewport;

},{"../../lib/vendor/threejs/EditorControls.js":1,"../../lib/vendor/threejs/TransformControls.js":2}]},{},[22])(22)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvdmVuZG9yL3RocmVlanMvRWRpdG9yQ29udHJvbHMuanMiLCJsaWIvdmVuZG9yL3RocmVlanMvVHJhbnNmb3JtQ29udHJvbHMuanMiLCJsaWIvdmVuZG9yL3VpLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnktY3NzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvY2xpcGJvYXJkL2xpYi9jbGlwYm9hcmQtYWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBib2FyZC9saWIvY2xpcGJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBib2FyZC9ub2RlX21vZHVsZXMvZ29vZC1saXN0ZW5lci9ub2RlX21vZHVsZXMvZGVsZWdhdGUvbm9kZV9tb2R1bGVzL2Nsb3Nlc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2xpcGJvYXJkL25vZGVfbW9kdWxlcy9nb29kLWxpc3RlbmVyL25vZGVfbW9kdWxlcy9kZWxlZ2F0ZS9ub2RlX21vZHVsZXMvY2xvc2VzdC9ub2RlX21vZHVsZXMvbWF0Y2hlcy1zZWxlY3Rvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGlwYm9hcmQvbm9kZV9tb2R1bGVzL2dvb2QtbGlzdGVuZXIvbm9kZV9tb2R1bGVzL2RlbGVnYXRlL3NyYy9kZWxlZ2F0ZS5qcyIsIm5vZGVfbW9kdWxlcy9jbGlwYm9hcmQvbm9kZV9tb2R1bGVzL2dvb2QtbGlzdGVuZXIvc3JjL2lzLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBib2FyZC9ub2RlX21vZHVsZXMvZ29vZC1saXN0ZW5lci9zcmMvbGlzdGVuLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBib2FyZC9ub2RlX21vZHVsZXMvc2VsZWN0L3NyYy9zZWxlY3QuanMiLCJub2RlX21vZHVsZXMvY2xpcGJvYXJkL25vZGVfbW9kdWxlcy90aW55LWVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2lnbmFscy9kaXN0L3NpZ25hbHMuanMiLCJub2RlX21vZHVsZXMvc29ydGFibGVqcy9Tb3J0YWJsZS5qcyIsInNyYy9jb21wb25lbnRsb2FkZXIuanMiLCJzcmMvZGlhbG9ncy9hc3NldHMuanMiLCJzcmMvZGlhbG9ncy9pbmRleC5qcyIsInNyYy9lZGl0b3IuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2V4cG9ydGVyLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3BhbmVscy9hdHRyaWJ1dGVzLmpzIiwic3JjL3BhbmVscy9jc3MvY3VzdG9tLmNzcyIsInNyYy9wYW5lbHMvY3NzL2xpZ2h0LmNzcyIsInNyYy9wYW5lbHMvY3NzL21haW4uY3NzIiwic3JjL3BhbmVscy9jc3MvdG9vbGJhci5jc3MiLCJzcmMvcGFuZWxzL2luZGV4LmpzIiwic3JjL3BhbmVscy9tZW51YmFyL2Fzc2V0cy5qcyIsInNyYy9wYW5lbHMvbWVudWJhci9pbmRleC5qcyIsInNyYy9wYW5lbHMvbWVudWJhci9vYmplY3RzLmpzIiwic3JjL3BhbmVscy9tZW51YmFyL3NjZW5lLmpzIiwic3JjL3BhbmVscy9tZW51YmFyL3N0YXR1cy5qcyIsInNyYy9wYW5lbHMvc2NlbmVncmFwaC5qcyIsInNyYy9wYW5lbHMvc2lkZWJhci5qcyIsInNyYy9wYW5lbHMvdG9vbHMuanMiLCJzcmMvcGFuZWxzL3dpZGdldHNmYWN0b3J5LmpzIiwic3JjL3NoYWRlcmxvYWRlci5qcyIsInNyYy92aWV3cG9ydC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvbUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqdUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmFBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb21cbiAqIEBhdXRob3IgYWx0ZXJlZHEgLyBodHRwOi8vYWx0ZXJlZHF1YWxpYS5jb20vXG4gKiBAYXV0aG9yIFdlc3RMYW5nbGV5IC8gaHR0cDovL2dpdGh1Yi5jb20vV2VzdExhbmdsZXlcbiAqL1xuXG5USFJFRS5FZGl0b3JDb250cm9scyA9IGZ1bmN0aW9uICggb2JqZWN0LCBkb21FbGVtZW50ICkge1xuXG5cdGRvbUVsZW1lbnQgPSAoIGRvbUVsZW1lbnQgIT09IHVuZGVmaW5lZCApID8gZG9tRWxlbWVudCA6IGRvY3VtZW50O1xuXG5cdC8vIEFQSVxuXG5cdHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cdHRoaXMuY2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHQvLyBpbnRlcm5hbHNcblxuXHR2YXIgc2NvcGUgPSB0aGlzO1xuXHR2YXIgdmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgU1RBVEUgPSB7IE5PTkU6IC0gMSwgUk9UQVRFOiAwLCBaT09NOiAxLCBQQU46IDIgfTtcblx0dmFyIHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHR2YXIgY2VudGVyID0gdGhpcy5jZW50ZXI7XG5cdHZhciBub3JtYWxNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4MygpO1xuXHR2YXIgcG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBwb2ludGVyT2xkID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuXHQvLyBldmVudHNcblxuXHR2YXIgY2hhbmdlRXZlbnQgPSB7IHR5cGU6ICdjaGFuZ2UnIH07XG5cblx0dGhpcy5mb2N1cyA9IGZ1bmN0aW9uICggdGFyZ2V0LCBmcmFtZSApIHtcblxuXHRcdHZhciBzY2FsZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dGFyZ2V0Lm1hdHJpeFdvcmxkLmRlY29tcG9zZSggY2VudGVyLCBuZXcgVEhSRUUuUXVhdGVybmlvbigpLCBzY2FsZSApO1xuXG5cdFx0aWYgKCBmcmFtZSAmJiB0YXJnZXQuZ2VvbWV0cnkgKSB7XG5cblx0XHRcdHNjYWxlID0gKCBzY2FsZS54ICsgc2NhbGUueSArIHNjYWxlLnogKSAvIDM7XG5cdFx0XHRjZW50ZXIuYWRkKCB0YXJnZXQuZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUuY2VudGVyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoIHNjYWxlICkgKTtcblx0XHRcdHZhciByYWRpdXMgPSB0YXJnZXQuZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUucmFkaXVzICogKCBzY2FsZSApO1xuXHRcdFx0dmFyIHBvcyA9IG9iamVjdC5wb3NpdGlvbi5jbG9uZSgpLnN1YiggY2VudGVyICkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoIHJhZGl1cyAqIDIgKTtcblx0XHRcdG9iamVjdC5wb3NpdGlvbi5jb3B5KCBjZW50ZXIgKS5hZGQoIHBvcyApO1xuXG5cdFx0fVxuXG5cdFx0b2JqZWN0Lmxvb2tBdCggY2VudGVyICk7XG5cblx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBjaGFuZ2VFdmVudCApO1xuXG5cdH07XG5cblx0dGhpcy5wYW4gPSBmdW5jdGlvbiAoIGRlbHRhICkge1xuXG5cdFx0dmFyIGRpc3RhbmNlID0gb2JqZWN0LnBvc2l0aW9uLmRpc3RhbmNlVG8oIGNlbnRlciApO1xuXG5cdFx0ZGVsdGEubXVsdGlwbHlTY2FsYXIoIGRpc3RhbmNlICogMC4wMDEgKTtcblx0XHRkZWx0YS5hcHBseU1hdHJpeDMoIG5vcm1hbE1hdHJpeC5nZXROb3JtYWxNYXRyaXgoIG9iamVjdC5tYXRyaXggKSApO1xuXG5cdFx0b2JqZWN0LnBvc2l0aW9uLmFkZCggZGVsdGEgKTtcblx0XHRjZW50ZXIuYWRkKCBkZWx0YSApO1xuXG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuXHR9O1xuXG5cdHRoaXMuem9vbSA9IGZ1bmN0aW9uICggZGVsdGEgKSB7XG5cblx0XHR2YXIgZGlzdGFuY2UgPSBvYmplY3QucG9zaXRpb24uZGlzdGFuY2VUbyggY2VudGVyICk7XG5cblx0XHRkZWx0YS5tdWx0aXBseVNjYWxhciggZGlzdGFuY2UgKiAwLjAwMSApO1xuXG5cdFx0aWYgKCBkZWx0YS5sZW5ndGgoKSA+IGRpc3RhbmNlICkgcmV0dXJuO1xuXG5cdFx0ZGVsdGEuYXBwbHlNYXRyaXgzKCBub3JtYWxNYXRyaXguZ2V0Tm9ybWFsTWF0cml4KCBvYmplY3QubWF0cml4ICkgKTtcbi8qXG4gICAgY29uc29sZS5sb2cob2JqZWN0LnBvc2l0aW9uKTtcbiAgICBvYmplY3Quem9vbSs9ZGVsdGEuejtcbiAgICBjb25zb2xlLmxvZyhvYmplY3Quem9vbSxkZWx0YSk7XG4gICAgb2JqZWN0LnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiovXG5cdFx0b2JqZWN0LnBvc2l0aW9uLmFkZCggZGVsdGEgKTtcblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGNoYW5nZUV2ZW50ICk7XG5cblx0fTtcblxuXHR0aGlzLnJvdGF0ZSA9IGZ1bmN0aW9uICggZGVsdGEgKSB7XG5cblx0XHR2ZWN0b3IuY29weSggb2JqZWN0LnBvc2l0aW9uICkuc3ViKCBjZW50ZXIgKTtcblxuXHRcdHZhciB0aGV0YSA9IE1hdGguYXRhbjIoIHZlY3Rvci54LCB2ZWN0b3IueiApO1xuXHRcdHZhciBwaGkgPSBNYXRoLmF0YW4yKCBNYXRoLnNxcnQoIHZlY3Rvci54ICogdmVjdG9yLnggKyB2ZWN0b3IueiAqIHZlY3Rvci56ICksIHZlY3Rvci55ICk7XG5cblx0XHR0aGV0YSArPSBkZWx0YS54O1xuXHRcdHBoaSArPSBkZWx0YS55O1xuXG5cdFx0dmFyIEVQUyA9IDAuMDAwMDAxO1xuXG5cdFx0cGhpID0gTWF0aC5tYXgoIEVQUywgTWF0aC5taW4oIE1hdGguUEkgLSBFUFMsIHBoaSApICk7XG5cblx0XHR2YXIgcmFkaXVzID0gdmVjdG9yLmxlbmd0aCgpO1xuXG5cdFx0dmVjdG9yLnggPSByYWRpdXMgKiBNYXRoLnNpbiggcGhpICkgKiBNYXRoLnNpbiggdGhldGEgKTtcblx0XHR2ZWN0b3IueSA9IHJhZGl1cyAqIE1hdGguY29zKCBwaGkgKTtcblx0XHR2ZWN0b3IueiA9IHJhZGl1cyAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguY29zKCB0aGV0YSApO1xuXG5cdFx0b2JqZWN0LnBvc2l0aW9uLmNvcHkoIGNlbnRlciApLmFkZCggdmVjdG9yICk7XG5cblx0XHRvYmplY3QubG9va0F0KCBjZW50ZXIgKTtcblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGNoYW5nZUV2ZW50ICk7XG5cblx0fTtcblxuXHQvLyBtb3VzZVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VEb3duKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMCApIHtcblxuXHRcdFx0c3RhdGUgPSBTVEFURS5ST1RBVEU7XG5cblx0XHR9IGVsc2UgaWYgKCBldmVudC5idXR0b24gPT09IDEgKSB7XG5cblx0XHRcdHN0YXRlID0gU1RBVEUuWk9PTTtcblxuXHRcdH0gZWxzZSBpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMiApIHtcblxuXHRcdFx0c3RhdGUgPSBTVEFURS5QQU47XG5cblx0XHR9XG5cblx0XHRwb2ludGVyT2xkLnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZW91dCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdkYmxjbGljaycsIG9uTW91c2VVcCwgZmFsc2UgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZU1vdmUoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdHBvaW50ZXIuc2V0KCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZICk7XG5cblx0XHR2YXIgbW92ZW1lbnRYID0gcG9pbnRlci54IC0gcG9pbnRlck9sZC54O1xuXHRcdHZhciBtb3ZlbWVudFkgPSBwb2ludGVyLnkgLSBwb2ludGVyT2xkLnk7XG5cblx0XHRpZiAoIHN0YXRlID09PSBTVEFURS5ST1RBVEUgKSB7XG5cblx0XHRcdHNjb3BlLnJvdGF0ZSggbmV3IFRIUkVFLlZlY3RvcjMoIC0gbW92ZW1lbnRYICogMC4wMDUsIC0gbW92ZW1lbnRZICogMC4wMDUsIDAgKSApO1xuXG5cdFx0fSBlbHNlIGlmICggc3RhdGUgPT09IFNUQVRFLlpPT00gKSB7XG5cblx0XHRcdHNjb3BlLnpvb20oIG5ldyBUSFJFRS5WZWN0b3IzKCAwLCAwLCBtb3ZlbWVudFkgKSApO1xuXG5cdFx0fSBlbHNlIGlmICggc3RhdGUgPT09IFNUQVRFLlBBTiApIHtcblxuXHRcdFx0c2NvcGUucGFuKCBuZXcgVEhSRUUuVmVjdG9yMyggLSBtb3ZlbWVudFgsIG1vdmVtZW50WSwgMCApICk7XG5cblx0XHR9XG5cblx0XHRwb2ludGVyT2xkLnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBvbk1vdXNlVXAoIGV2ZW50ICkge1xuXG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZW91dCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdkYmxjbGljaycsIG9uTW91c2VVcCwgZmFsc2UgKTtcblxuXHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZVdoZWVsKCBldmVudCApIHtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHQvLyBpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXG5cdFx0dmFyIGRlbHRhID0gMDtcblxuXHRcdGlmICggZXZlbnQud2hlZWxEZWx0YSApIHtcblxuXHRcdFx0Ly8gV2ViS2l0IC8gT3BlcmEgLyBFeHBsb3JlciA5XG5cblx0XHRcdGRlbHRhID0gLSBldmVudC53aGVlbERlbHRhO1xuXG5cdFx0fSBlbHNlIGlmICggZXZlbnQuZGV0YWlsICkge1xuXG5cdFx0XHQvLyBGaXJlZm94XG5cblx0XHRcdGRlbHRhID0gZXZlbnQuZGV0YWlsICogMTA7XG5cblx0XHR9XG5cblx0XHRzY29wZS56b29tKCBuZXcgVEhSRUUuVmVjdG9yMyggMCwgMCwgZGVsdGEgKSApO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBjb250ZXh0bWVudSggZXZlbnQgKSB7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdH1cblxuXHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblxuXHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NvbnRleHRtZW51JywgY29udGV4dG1lbnUsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgb25Nb3VzZURvd24sIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2V3aGVlbCcsIG9uTW91c2VXaGVlbCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdNb3pNb3VzZVBpeGVsU2Nyb2xsJywgb25Nb3VzZVdoZWVsLCBmYWxzZSApOyAvLyBmaXJlZm94XG5cblx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXVwJywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlb3V0Jywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2RibGNsaWNrJywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgdG91Y2hNb3ZlLCBmYWxzZSApO1xuXG5cdH1cblxuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdjb250ZXh0bWVudScsIGNvbnRleHRtZW51LCBmYWxzZSApO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBvbk1vdXNlRG93biwgZmFsc2UgKTtcblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V3aGVlbCcsIG9uTW91c2VXaGVlbCwgZmFsc2UgKTtcblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnTW96TW91c2VQaXhlbFNjcm9sbCcsIG9uTW91c2VXaGVlbCwgZmFsc2UgKTsgLy8gZmlyZWZveFxuXG5cdC8vIHRvdWNoXG5cblx0dmFyIHRvdWNoID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgdG91Y2hlcyA9IFsgbmV3IFRIUkVFLlZlY3RvcjMoKSwgbmV3IFRIUkVFLlZlY3RvcjMoKSwgbmV3IFRIUkVFLlZlY3RvcjMoKSBdO1xuXHR2YXIgcHJldlRvdWNoZXMgPSBbIG5ldyBUSFJFRS5WZWN0b3IzKCksIG5ldyBUSFJFRS5WZWN0b3IzKCksIG5ldyBUSFJFRS5WZWN0b3IzKCkgXTtcblxuXHR2YXIgcHJldkRpc3RhbmNlID0gbnVsbDtcblxuXHRmdW5jdGlvbiB0b3VjaFN0YXJ0KCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRzd2l0Y2ggKCBldmVudC50b3VjaGVzLmxlbmd0aCApIHtcblxuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0b3VjaGVzWyAwIF0uc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHR0b3VjaGVzWyAxIF0uc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0b3VjaGVzWyAwIF0uc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHR0b3VjaGVzWyAxIF0uc2V0KCBldmVudC50b3VjaGVzWyAxIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDEgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHRwcmV2RGlzdGFuY2UgPSB0b3VjaGVzWyAwIF0uZGlzdGFuY2VUbyggdG91Y2hlc1sgMSBdICk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0fVxuXG5cdFx0cHJldlRvdWNoZXNbIDAgXS5jb3B5KCB0b3VjaGVzWyAwIF0gKTtcblx0XHRwcmV2VG91Y2hlc1sgMSBdLmNvcHkoIHRvdWNoZXNbIDEgXSApO1xuXG5cdH1cblxuXG5cdGZ1bmN0aW9uIHRvdWNoTW92ZSggZXZlbnQgKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdGZ1bmN0aW9uIGdldENsb3Nlc3QoIHRvdWNoLCB0b3VjaGVzICkge1xuXG5cdFx0XHR2YXIgY2xvc2VzdCA9IHRvdWNoZXNbIDAgXTtcblxuXHRcdFx0Zm9yICggdmFyIGkgaW4gdG91Y2hlcyApIHtcblxuXHRcdFx0XHRpZiAoIGNsb3Nlc3QuZGlzdGFuY2VUbyggdG91Y2ggKSA+IHRvdWNoZXNbIGkgXS5kaXN0YW5jZVRvKCB0b3VjaCApICkgY2xvc2VzdCA9IHRvdWNoZXNbIGkgXTtcblxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY2xvc2VzdDtcblxuXHRcdH1cblxuXHRcdHN3aXRjaCAoIGV2ZW50LnRvdWNoZXMubGVuZ3RoICkge1xuXG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRvdWNoZXNbIDAgXS5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZLCAwICk7XG5cdFx0XHRcdHRvdWNoZXNbIDEgXS5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZLCAwICk7XG5cdFx0XHRcdHNjb3BlLnJvdGF0ZSggdG91Y2hlc1sgMCBdLnN1YiggZ2V0Q2xvc2VzdCggdG91Y2hlc1sgMCBdLCBwcmV2VG91Y2hlcyApICkubXVsdGlwbHlTY2FsYXIoIC0gMC4wMDUgKSApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0b3VjaGVzWyAwIF0uc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHR0b3VjaGVzWyAxIF0uc2V0KCBldmVudC50b3VjaGVzWyAxIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDEgXS5wYWdlWSwgMCApO1xuXHRcdFx0XHRkaXN0YW5jZSA9IHRvdWNoZXNbIDAgXS5kaXN0YW5jZVRvKCB0b3VjaGVzWyAxIF0gKTtcblx0XHRcdFx0c2NvcGUuem9vbSggbmV3IFRIUkVFLlZlY3RvcjMoIDAsIDAsIHByZXZEaXN0YW5jZSAtIGRpc3RhbmNlICkgKTtcblx0XHRcdFx0cHJldkRpc3RhbmNlID0gZGlzdGFuY2U7XG5cblxuXHRcdFx0XHR2YXIgb2Zmc2V0MCA9IHRvdWNoZXNbIDAgXS5jbG9uZSgpLnN1YiggZ2V0Q2xvc2VzdCggdG91Y2hlc1sgMCBdLCBwcmV2VG91Y2hlcyApICk7XG5cdFx0XHRcdHZhciBvZmZzZXQxID0gdG91Y2hlc1sgMSBdLmNsb25lKCkuc3ViKCBnZXRDbG9zZXN0KCB0b3VjaGVzWyAxIF0sIHByZXZUb3VjaGVzICkgKTtcblx0XHRcdFx0b2Zmc2V0MC54ID0gLSBvZmZzZXQwLng7XG5cdFx0XHRcdG9mZnNldDEueCA9IC0gb2Zmc2V0MS54O1xuXG5cdFx0XHRcdHNjb3BlLnBhbiggb2Zmc2V0MC5hZGQoIG9mZnNldDEgKS5tdWx0aXBseVNjYWxhciggMC41ICkgKTtcblxuXHRcdFx0XHRicmVhaztcblxuXHRcdH1cblxuXHRcdHByZXZUb3VjaGVzWyAwIF0uY29weSggdG91Y2hlc1sgMCBdICk7XG5cdFx0cHJldlRvdWNoZXNbIDEgXS5jb3B5KCB0b3VjaGVzWyAxIF0gKTtcblxuXHR9XG5cblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQsIGZhbHNlICk7XG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIHRvdWNoTW92ZSwgZmFsc2UgKTtcblxufTtcblxuVEhSRUUuRWRpdG9yQ29udHJvbHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZSApO1xuVEhSRUUuRWRpdG9yQ29udHJvbHMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuRWRpdG9yQ29udHJvbHM7XG4iLCIvKipcbiAqIEBhdXRob3IgYXJvZGljIC8gaHR0cHM6Ly9naXRodWIuY29tL2Fyb2RpY1xuICovXG4gLypqc2hpbnQgc3ViOnRydWUqL1xuXG4oIGZ1bmN0aW9uICgpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblxuXHR2YXIgR2l6bW9NYXRlcmlhbCA9IGZ1bmN0aW9uICggcGFyYW1ldGVycyApIHtcblxuXHRcdFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsLmNhbGwoIHRoaXMgKTtcblxuXHRcdHRoaXMuZGVwdGhUZXN0ID0gZmFsc2U7XG5cdFx0dGhpcy5kZXB0aFdyaXRlID0gZmFsc2U7XG5cdFx0dGhpcy5zaWRlID0gVEhSRUUuRnJvbnRTaWRlO1xuXHRcdHRoaXMudHJhbnNwYXJlbnQgPSB0cnVlO1xuXG5cdFx0dGhpcy5zZXRWYWx1ZXMoIHBhcmFtZXRlcnMgKTtcblxuXHRcdHRoaXMub2xkQ29sb3IgPSB0aGlzLmNvbG9yLmNsb25lKCk7XG5cdFx0dGhpcy5vbGRPcGFjaXR5ID0gdGhpcy5vcGFjaXR5O1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBmdW5jdGlvbiggaGlnaGxpZ2h0ZWQgKSB7XG5cblx0XHRcdGlmICggaGlnaGxpZ2h0ZWQgKSB7XG5cblx0XHRcdFx0dGhpcy5jb2xvci5zZXRSR0IoIDEsIDEsIDAgKTtcblx0XHRcdFx0dGhpcy5vcGFjaXR5ID0gMTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHR0aGlzLmNvbG9yLmNvcHkoIHRoaXMub2xkQ29sb3IgKTtcblx0XHRcdFx0dGhpcy5vcGFjaXR5ID0gdGhpcy5vbGRPcGFjaXR5O1xuXG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdH07XG5cblx0R2l6bW9NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbC5wcm90b3R5cGUgKTtcblx0R2l6bW9NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHaXptb01hdGVyaWFsO1xuXG5cblx0dmFyIEdpem1vTGluZU1hdGVyaWFsID0gZnVuY3Rpb24gKCBwYXJhbWV0ZXJzICkge1xuXG5cdFx0VEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwuY2FsbCggdGhpcyApO1xuXG5cdFx0dGhpcy5kZXB0aFRlc3QgPSBmYWxzZTtcblx0XHR0aGlzLmRlcHRoV3JpdGUgPSBmYWxzZTtcblx0XHR0aGlzLnRyYW5zcGFyZW50ID0gdHJ1ZTtcblx0XHR0aGlzLmxpbmV3aWR0aCA9IDE7XG5cblx0XHR0aGlzLnNldFZhbHVlcyggcGFyYW1ldGVycyApO1xuXG5cdFx0dGhpcy5vbGRDb2xvciA9IHRoaXMuY29sb3IuY2xvbmUoKTtcblx0XHR0aGlzLm9sZE9wYWNpdHkgPSB0aGlzLm9wYWNpdHk7XG5cblx0XHR0aGlzLmhpZ2hsaWdodCA9IGZ1bmN0aW9uKCBoaWdobGlnaHRlZCApIHtcblxuXHRcdFx0aWYgKCBoaWdobGlnaHRlZCApIHtcblxuXHRcdFx0XHR0aGlzLmNvbG9yLnNldFJHQiggMSwgMSwgMCApO1xuXHRcdFx0XHR0aGlzLm9wYWNpdHkgPSAxO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHRoaXMuY29sb3IuY29weSggdGhpcy5vbGRDb2xvciApO1xuXHRcdFx0XHR0aGlzLm9wYWNpdHkgPSB0aGlzLm9sZE9wYWNpdHk7XG5cblx0XHRcdH1cblxuXHRcdH07XG5cblx0fTtcblxuXHRHaXptb0xpbmVNYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbC5wcm90b3R5cGUgKTtcblx0R2l6bW9MaW5lTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gR2l6bW9MaW5lTWF0ZXJpYWw7XG5cblxuXHR2YXIgcGlja2VyTWF0ZXJpYWwgPSBuZXcgR2l6bW9NYXRlcmlhbCggeyB2aXNpYmxlOiBmYWxzZSwgdHJhbnNwYXJlbnQ6IGZhbHNlIH0gKTtcblxuXG5cdFRIUkVFLlRyYW5zZm9ybUdpem1vID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNjb3BlID0gdGhpcztcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0VEhSRUUuT2JqZWN0M0QuY2FsbCggdGhpcyApO1xuXG5cdFx0XHR0aGlzLmhhbmRsZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblx0XHRcdHRoaXMucGlja2VycyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXHRcdFx0dGhpcy5wbGFuZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuXHRcdFx0dGhpcy5hZGQoIHRoaXMuaGFuZGxlcyApO1xuXHRcdFx0dGhpcy5hZGQoIHRoaXMucGlja2VycyApO1xuXHRcdFx0dGhpcy5hZGQoIHRoaXMucGxhbmVzICk7XG5cblx0XHRcdC8vLy8gUExBTkVTXG5cblx0XHRcdHZhciBwbGFuZUdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoIDUwLCA1MCwgMiwgMiApO1xuXHRcdFx0dmFyIHBsYW5lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoIHsgdmlzaWJsZTogZmFsc2UsIHNpZGU6IFRIUkVFLkRvdWJsZVNpZGUgfSApO1xuXG5cdFx0XHR2YXIgcGxhbmVzID0ge1xuXHRcdFx0XHRcIlhZXCI6ICAgbmV3IFRIUkVFLk1lc2goIHBsYW5lR2VvbWV0cnksIHBsYW5lTWF0ZXJpYWwgKSxcblx0XHRcdFx0XCJZWlwiOiAgIG5ldyBUSFJFRS5NZXNoKCBwbGFuZUdlb21ldHJ5LCBwbGFuZU1hdGVyaWFsICksXG5cdFx0XHRcdFwiWFpcIjogICBuZXcgVEhSRUUuTWVzaCggcGxhbmVHZW9tZXRyeSwgcGxhbmVNYXRlcmlhbCApLFxuXHRcdFx0XHRcIlhZWkVcIjogbmV3IFRIUkVFLk1lc2goIHBsYW5lR2VvbWV0cnksIHBsYW5lTWF0ZXJpYWwgKVxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5hY3RpdmVQbGFuZSA9IHBsYW5lc1sgXCJYWVpFXCIgXTtcblxuXHRcdFx0cGxhbmVzWyBcIllaXCIgXS5yb3RhdGlvbi5zZXQoIDAsIE1hdGguUEkgLyAyLCAwICk7XG5cdFx0XHRwbGFuZXNbIFwiWFpcIiBdLnJvdGF0aW9uLnNldCggLSBNYXRoLlBJIC8gMiwgMCwgMCApO1xuXG5cdFx0XHRmb3IgKCB2YXIgaSBpbiBwbGFuZXMgKSB7XG5cblx0XHRcdFx0cGxhbmVzWyBpIF0ubmFtZSA9IGk7XG5cdFx0XHRcdHRoaXMucGxhbmVzLmFkZCggcGxhbmVzWyBpIF0gKTtcblx0XHRcdFx0dGhpcy5wbGFuZXNbIGkgXSA9IHBsYW5lc1sgaSBdO1xuXG5cdFx0XHR9XG5cblx0XHRcdC8vLy8gSEFORExFUyBBTkQgUElDS0VSU1xuXG5cdFx0XHR2YXIgc2V0dXBHaXptb3MgPSBmdW5jdGlvbiggZ2l6bW9NYXAsIHBhcmVudCApIHtcblxuXHRcdFx0XHRmb3IgKCB2YXIgbmFtZSBpbiBnaXptb01hcCApIHtcblxuXHRcdFx0XHRcdGZvciAoIGkgPSBnaXptb01hcFsgbmFtZSBdLmxlbmd0aDsgaSAtLTsgKSB7XG5cblx0XHRcdFx0XHRcdHZhciBvYmplY3QgPSBnaXptb01hcFsgbmFtZSBdWyBpIF1bIDAgXTtcblx0XHRcdFx0XHRcdHZhciBwb3NpdGlvbiA9IGdpem1vTWFwWyBuYW1lIF1bIGkgXVsgMSBdO1xuXHRcdFx0XHRcdFx0dmFyIHJvdGF0aW9uID0gZ2l6bW9NYXBbIG5hbWUgXVsgaSBdWyAyIF07XG5cblx0XHRcdFx0XHRcdG9iamVjdC5uYW1lID0gbmFtZTtcblxuXHRcdFx0XHRcdFx0aWYgKCBwb3NpdGlvbiApIG9iamVjdC5wb3NpdGlvbi5zZXQoIHBvc2l0aW9uWyAwIF0sIHBvc2l0aW9uWyAxIF0sIHBvc2l0aW9uWyAyIF0gKTtcblx0XHRcdFx0XHRcdGlmICggcm90YXRpb24gKSBvYmplY3Qucm90YXRpb24uc2V0KCByb3RhdGlvblsgMCBdLCByb3RhdGlvblsgMSBdLCByb3RhdGlvblsgMiBdICk7XG5cblx0XHRcdFx0XHRcdHBhcmVudC5hZGQoIG9iamVjdCApO1xuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0fTtcblxuXHRcdFx0c2V0dXBHaXptb3MoIHRoaXMuaGFuZGxlR2l6bW9zLCB0aGlzLmhhbmRsZXMgKTtcblx0XHRcdHNldHVwR2l6bW9zKCB0aGlzLnBpY2tlckdpem1vcywgdGhpcy5waWNrZXJzICk7XG5cblx0XHRcdC8vIHJlc2V0IFRyYW5zZm9ybWF0aW9uc1xuXG5cdFx0XHR0aGlzLnRyYXZlcnNlKCBmdW5jdGlvbiAoIGNoaWxkICkge1xuXG5cdFx0XHRcdGlmICggY2hpbGQgaW5zdGFuY2VvZiBUSFJFRS5NZXNoICkge1xuXG5cdFx0XHRcdFx0Y2hpbGQudXBkYXRlTWF0cml4KCk7XG5cblx0XHRcdFx0XHR2YXIgdGVtcEdlb21ldHJ5ID0gY2hpbGQuZ2VvbWV0cnkuY2xvbmUoKTtcblx0XHRcdFx0XHR0ZW1wR2VvbWV0cnkuYXBwbHlNYXRyaXgoIGNoaWxkLm1hdHJpeCApO1xuXHRcdFx0XHRcdGNoaWxkLmdlb21ldHJ5ID0gdGVtcEdlb21ldHJ5O1xuXG5cdFx0XHRcdFx0Y2hpbGQucG9zaXRpb24uc2V0KCAwLCAwLCAwICk7XG5cdFx0XHRcdFx0Y2hpbGQucm90YXRpb24uc2V0KCAwLCAwLCAwICk7XG5cdFx0XHRcdFx0Y2hpbGQuc2NhbGUuc2V0KCAxLCAxLCAxICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBmdW5jdGlvbiAoIGF4aXMgKSB7XG5cblx0XHRcdHRoaXMudHJhdmVyc2UoIGZ1bmN0aW9uKCBjaGlsZCApIHtcblxuXHRcdFx0XHRpZiAoIGNoaWxkLm1hdGVyaWFsICYmIGNoaWxkLm1hdGVyaWFsLmhpZ2hsaWdodCApIHtcblxuXHRcdFx0XHRcdGlmICggY2hpbGQubmFtZSA9PT0gYXhpcyApIHtcblxuXHRcdFx0XHRcdFx0Y2hpbGQubWF0ZXJpYWwuaGlnaGxpZ2h0KCB0cnVlICk7XG5cblx0XHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0XHRjaGlsZC5tYXRlcmlhbC5oaWdobGlnaHQoIGZhbHNlICk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9O1xuXG5cdH07XG5cblx0VEhSRUUuVHJhbnNmb3JtR2l6bW8ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuT2JqZWN0M0QucHJvdG90eXBlICk7XG5cdFRIUkVFLlRyYW5zZm9ybUdpem1vLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLlRyYW5zZm9ybUdpem1vO1xuXG5cdFRIUkVFLlRyYW5zZm9ybUdpem1vLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoIHJvdGF0aW9uLCBleWUgKSB7XG5cblx0XHR2YXIgdmVjMSA9IG5ldyBUSFJFRS5WZWN0b3IzKCAwLCAwLCAwICk7XG5cdFx0dmFyIHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMyggMCwgMSwgMCApO1xuXHRcdHZhciBsb29rQXRNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG5cdFx0dGhpcy50cmF2ZXJzZSggZnVuY3Rpb24oIGNoaWxkICkge1xuXG5cdFx0XHRpZiAoIGNoaWxkLm5hbWUuc2VhcmNoKCBcIkVcIiApICE9PSAtIDEgKSB7XG5cblx0XHRcdFx0Y2hpbGQucXVhdGVybmlvbi5zZXRGcm9tUm90YXRpb25NYXRyaXgoIGxvb2tBdE1hdHJpeC5sb29rQXQoIGV5ZSwgdmVjMSwgdmVjMiApICk7XG5cblx0XHRcdH0gZWxzZSBpZiAoIGNoaWxkLm5hbWUuc2VhcmNoKCBcIlhcIiApICE9PSAtIDEgfHwgY2hpbGQubmFtZS5zZWFyY2goIFwiWVwiICkgIT09IC0gMSB8fCBjaGlsZC5uYW1lLnNlYXJjaCggXCJaXCIgKSAhPT0gLSAxICkge1xuXG5cdFx0XHRcdGNoaWxkLnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKCByb3RhdGlvbiApO1xuXG5cdFx0XHR9XG5cblx0XHR9ICk7XG5cblx0fTtcblxuXHRUSFJFRS5UcmFuc2Zvcm1HaXptb1RyYW5zbGF0ZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFRIUkVFLlRyYW5zZm9ybUdpem1vLmNhbGwoIHRoaXMgKTtcblxuXHRcdHZhciBhcnJvd0dlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cdFx0dmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoIDAsIDAuMDUsIDAuMiwgMTIsIDEsIGZhbHNlICkgKTtcblx0XHRtZXNoLnBvc2l0aW9uLnkgPSAwLjU7XG5cdFx0bWVzaC51cGRhdGVNYXRyaXgoKTtcblxuXHRcdGFycm93R2VvbWV0cnkubWVyZ2UoIG1lc2guZ2VvbWV0cnksIG1lc2gubWF0cml4ICk7XG5cblx0XHR2YXIgbGluZVhHZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuXHRcdGxpbmVYR2VvbWV0cnkuYWRkQXR0cmlidXRlKCAncG9zaXRpb24nLCBuZXcgVEhSRUUuRmxvYXQzMkF0dHJpYnV0ZSggWyAwLCAwLCAwLCAgMSwgMCwgMCBdLCAzICkgKTtcblxuXHRcdHZhciBsaW5lWUdlb21ldHJ5ID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCk7XG5cdFx0bGluZVlHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoICdwb3NpdGlvbicsIG5ldyBUSFJFRS5GbG9hdDMyQXR0cmlidXRlKCBbIDAsIDAsIDAsICAwLCAxLCAwIF0sIDMgKSApO1xuXG5cdFx0dmFyIGxpbmVaR2VvbWV0cnkgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKTtcblx0XHRsaW5lWkdlb21ldHJ5LmFkZEF0dHJpYnV0ZSggJ3Bvc2l0aW9uJywgbmV3IFRIUkVFLkZsb2F0MzJBdHRyaWJ1dGUoIFsgMCwgMCwgMCwgIDAsIDAsIDEgXSwgMyApICk7XG5cblx0XHR0aGlzLmhhbmRsZUdpem1vcyA9IHtcblxuXHRcdFx0WDogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBhcnJvd0dlb21ldHJ5LCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHhmZjAwMDAgfSApICksIFsgMC41LCAwLCAwIF0sIFsgMCwgMCwgLSBNYXRoLlBJIC8gMiBdIF0sXG5cdFx0XHRcdFsgbmV3IFRIUkVFLkxpbmUoIGxpbmVYR2VvbWV0cnksIG5ldyBHaXptb0xpbmVNYXRlcmlhbCggeyBjb2xvcjogMHhmZjAwMDAgfSApICkgXVxuXHRcdFx0XSxcblxuXHRcdFx0WTogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBhcnJvd0dlb21ldHJ5LCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHgwMGZmMDAgfSApICksIFsgMCwgMC41LCAwIF0gXSxcblx0XHRcdFx0W1x0bmV3IFRIUkVFLkxpbmUoIGxpbmVZR2VvbWV0cnksIG5ldyBHaXptb0xpbmVNYXRlcmlhbCggeyBjb2xvcjogMHgwMGZmMDAgfSApICkgXVxuXHRcdFx0XSxcblxuXHRcdFx0WjogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBhcnJvd0dlb21ldHJ5LCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHgwMDAwZmYgfSApICksIFsgMCwgMCwgMC41IF0sIFsgTWF0aC5QSSAvIDIsIDAsIDAgXSBdLFxuXHRcdFx0XHRbIG5ldyBUSFJFRS5MaW5lKCBsaW5lWkdlb21ldHJ5LCBuZXcgR2l6bW9MaW5lTWF0ZXJpYWwoIHsgY29sb3I6IDB4MDAwMGZmIH0gKSApIF1cblx0XHRcdF0sXG5cblx0XHRcdFhZWjogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBuZXcgVEhSRUUuT2N0YWhlZHJvbkdlb21ldHJ5KCAwLjEsIDAgKSwgbmV3IEdpem1vTWF0ZXJpYWwoIHsgY29sb3I6IDB4ZmZmZmZmLCBvcGFjaXR5OiAwLjI1IH0gKSApLCBbIDAsIDAsIDAgXSwgWyAwLCAwLCAwIF0gXVxuXHRcdFx0XSxcblxuXHRcdFx0WFk6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoIDAuMjksIDAuMjkgKSwgbmV3IEdpem1vTWF0ZXJpYWwoIHsgY29sb3I6IDB4ZmZmZjAwLCBvcGFjaXR5OiAwLjI1IH0gKSApLCBbIDAuMTUsIDAuMTUsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRZWjogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBuZXcgVEhSRUUuUGxhbmVCdWZmZXJHZW9tZXRyeSggMC4yOSwgMC4yOSApLCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHgwMGZmZmYsIG9wYWNpdHk6IDAuMjUgfSApICksIFsgMCwgMC4xNSwgMC4xNSBdLCBbIDAsIE1hdGguUEkgLyAyLCAwIF0gXVxuXHRcdFx0XSxcblxuXHRcdFx0WFo6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoIDAuMjksIDAuMjkgKSwgbmV3IEdpem1vTWF0ZXJpYWwoIHsgY29sb3I6IDB4ZmYwMGZmLCBvcGFjaXR5OiAwLjI1IH0gKSApLCBbIDAuMTUsIDAsIDAuMTUgXSwgWyAtIE1hdGguUEkgLyAyLCAwLCAwIF0gXVxuXHRcdFx0XVxuXG5cdFx0fTtcblxuXHRcdHRoaXMucGlja2VyR2l6bW9zID0ge1xuXG5cdFx0XHRYOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KCAwLjIsIDAsIDEsIDQsIDEsIGZhbHNlICksIHBpY2tlck1hdGVyaWFsICksIFsgMC42LCAwLCAwIF0sIFsgMCwgMCwgLSBNYXRoLlBJIC8gMiBdIF1cblx0XHRcdF0sXG5cblx0XHRcdFk6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoIDAuMiwgMCwgMSwgNCwgMSwgZmFsc2UgKSwgcGlja2VyTWF0ZXJpYWwgKSwgWyAwLCAwLjYsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRaOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KCAwLjIsIDAsIDEsIDQsIDEsIGZhbHNlICksIHBpY2tlck1hdGVyaWFsICksIFsgMCwgMCwgMC42IF0sIFsgTWF0aC5QSSAvIDIsIDAsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRYWVo6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLk9jdGFoZWRyb25HZW9tZXRyeSggMC4yLCAwICksIHBpY2tlck1hdGVyaWFsICkgXVxuXHRcdFx0XSxcblxuXHRcdFx0WFk6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoIDAuNCwgMC40ICksIHBpY2tlck1hdGVyaWFsICksIFsgMC4yLCAwLjIsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRZWjogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBuZXcgVEhSRUUuUGxhbmVCdWZmZXJHZW9tZXRyeSggMC40LCAwLjQgKSwgcGlja2VyTWF0ZXJpYWwgKSwgWyAwLCAwLjIsIDAuMiBdLCBbIDAsIE1hdGguUEkgLyAyLCAwIF0gXVxuXHRcdFx0XSxcblxuXHRcdFx0WFo6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoIDAuNCwgMC40ICksIHBpY2tlck1hdGVyaWFsICksIFsgMC4yLCAwLCAwLjIgXSwgWyAtIE1hdGguUEkgLyAyLCAwLCAwIF0gXVxuXHRcdFx0XVxuXG5cdFx0fTtcblxuXHRcdHRoaXMuc2V0QWN0aXZlUGxhbmUgPSBmdW5jdGlvbiAoIGF4aXMsIGV5ZSApIHtcblxuXHRcdFx0dmFyIHRlbXBNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdFx0ZXllLmFwcGx5TWF0cml4NCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCB0ZW1wTWF0cml4LmV4dHJhY3RSb3RhdGlvbiggdGhpcy5wbGFuZXNbIFwiWFlcIiBdLm1hdHJpeFdvcmxkICkgKSApO1xuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFwiICkge1xuXG5cdFx0XHRcdHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWVwiIF07XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggZXllLnkgKSA+IE1hdGguYWJzKCBleWUueiApICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIlhaXCIgXTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWVwiICkge1xuXG5cdFx0XHRcdHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWVwiIF07XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggZXllLnggKSA+IE1hdGguYWJzKCBleWUueiApICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIllaXCIgXTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWlwiICkge1xuXG5cdFx0XHRcdHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWlwiIF07XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggZXllLnggKSA+IE1hdGguYWJzKCBleWUueSApICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIllaXCIgXTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFlaXCIgKSB0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWFlaRVwiIF07XG5cblx0XHRcdGlmICggYXhpcyA9PT0gXCJYWVwiICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIlhZXCIgXTtcblxuXHRcdFx0aWYgKCBheGlzID09PSBcIllaXCIgKSB0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWVpcIiBdO1xuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFpcIiApIHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWlwiIF07XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0KCk7XG5cblx0fTtcblxuXHRUSFJFRS5UcmFuc2Zvcm1HaXptb1RyYW5zbGF0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5UcmFuc2Zvcm1HaXptby5wcm90b3R5cGUgKTtcblx0VEhSRUUuVHJhbnNmb3JtR2l6bW9UcmFuc2xhdGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuVHJhbnNmb3JtR2l6bW9UcmFuc2xhdGU7XG5cblx0VEhSRUUuVHJhbnNmb3JtR2l6bW9Sb3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRUSFJFRS5UcmFuc2Zvcm1HaXptby5jYWxsKCB0aGlzICk7XG5cblx0XHR2YXIgQ2lyY2xlR2VvbWV0cnkgPSBmdW5jdGlvbiAoIHJhZGl1cywgZmFjaW5nLCBhcmMgKSB7XG5cblx0XHRcdHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIHZlcnRpY2VzID0gW107XG5cdFx0XHRhcmMgPSBhcmMgPyBhcmMgOiAxO1xuXG5cdFx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPD0gNjQgKiBhcmM7ICsrIGkgKSB7XG5cblx0XHRcdFx0aWYgKCBmYWNpbmcgPT09ICd4JyApIHZlcnRpY2VzLnB1c2goIDAsIE1hdGguY29zKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMsIE1hdGguc2luKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMgKTtcblx0XHRcdFx0aWYgKCBmYWNpbmcgPT09ICd5JyApIHZlcnRpY2VzLnB1c2goIE1hdGguY29zKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMsIDAsIE1hdGguc2luKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMgKTtcblx0XHRcdFx0aWYgKCBmYWNpbmcgPT09ICd6JyApIHZlcnRpY2VzLnB1c2goIE1hdGguc2luKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMsIE1hdGguY29zKCBpIC8gMzIgKiBNYXRoLlBJICkgKiByYWRpdXMsIDAgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRnZW9tZXRyeS5hZGRBdHRyaWJ1dGUoICdwb3NpdGlvbicsIG5ldyBUSFJFRS5GbG9hdDMyQXR0cmlidXRlKCB2ZXJ0aWNlcywgMyApICk7XG5cdFx0XHRyZXR1cm4gZ2VvbWV0cnk7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5oYW5kbGVHaXptb3MgPSB7XG5cblx0XHRcdFg6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTGluZSggbmV3IENpcmNsZUdlb21ldHJ5KCAxLCAneCcsIDAuNSApLCBuZXcgR2l6bW9MaW5lTWF0ZXJpYWwoIHsgY29sb3I6IDB4ZmYwMDAwIH0gKSApIF1cblx0XHRcdF0sXG5cblx0XHRcdFk6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTGluZSggbmV3IENpcmNsZUdlb21ldHJ5KCAxLCAneScsIDAuNSApLCBuZXcgR2l6bW9MaW5lTWF0ZXJpYWwoIHsgY29sb3I6IDB4MDBmZjAwIH0gKSApIF1cblx0XHRcdF0sXG5cblx0XHRcdFo6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTGluZSggbmV3IENpcmNsZUdlb21ldHJ5KCAxLCAneicsIDAuNSApLCBuZXcgR2l6bW9MaW5lTWF0ZXJpYWwoIHsgY29sb3I6IDB4MDAwMGZmIH0gKSApIF1cblx0XHRcdF0sXG5cblx0XHRcdEU6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTGluZSggbmV3IENpcmNsZUdlb21ldHJ5KCAxLjI1LCAneicsIDEgKSwgbmV3IEdpem1vTGluZU1hdGVyaWFsKCB7IGNvbG9yOiAweGNjY2MwMCB9ICkgKSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRYWVpFOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLkxpbmUoIG5ldyBDaXJjbGVHZW9tZXRyeSggMSwgJ3onLCAxICksIG5ldyBHaXptb0xpbmVNYXRlcmlhbCggeyBjb2xvcjogMHg3ODc4NzggfSApICkgXVxuXHRcdFx0XVxuXG5cdFx0fTtcblxuXHRcdHRoaXMucGlja2VyR2l6bW9zID0ge1xuXG5cdFx0XHRYOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5Ub3J1c0dlb21ldHJ5KCAxLCAwLjEyLCA0LCAxMiwgTWF0aC5QSSApLCBwaWNrZXJNYXRlcmlhbCApLCBbIDAsIDAsIDAgXSwgWyAwLCAtIE1hdGguUEkgLyAyLCAtIE1hdGguUEkgLyAyIF0gXVxuXHRcdFx0XSxcblxuXHRcdFx0WTogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBuZXcgVEhSRUUuVG9ydXNHZW9tZXRyeSggMSwgMC4xMiwgNCwgMTIsIE1hdGguUEkgKSwgcGlja2VyTWF0ZXJpYWwgKSwgWyAwLCAwLCAwIF0sIFsgTWF0aC5QSSAvIDIsIDAsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRaOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5Ub3J1c0dlb21ldHJ5KCAxLCAwLjEyLCA0LCAxMiwgTWF0aC5QSSApLCBwaWNrZXJNYXRlcmlhbCApLCBbIDAsIDAsIDAgXSwgWyAwLCAwLCAtIE1hdGguUEkgLyAyIF0gXVxuXHRcdFx0XSxcblxuXHRcdFx0RTogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBuZXcgVEhSRUUuVG9ydXNHZW9tZXRyeSggMS4yNSwgMC4xMiwgMiwgMjQgKSwgcGlja2VyTWF0ZXJpYWwgKSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRYWVpFOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5HZW9tZXRyeSgpICkgXS8vIFRPRE9cblx0XHRcdF1cblxuXHRcdH07XG5cblx0XHR0aGlzLnNldEFjdGl2ZVBsYW5lID0gZnVuY3Rpb24gKCBheGlzICkge1xuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiRVwiICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIlhZWkVcIiBdO1xuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFwiICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIllaXCIgXTtcblxuXHRcdFx0aWYgKCBheGlzID09PSBcIllcIiApIHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWlwiIF07XG5cblx0XHRcdGlmICggYXhpcyA9PT0gXCJaXCIgKSB0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWFlcIiBdO1xuXG5cdFx0fTtcblxuXHRcdHRoaXMudXBkYXRlID0gZnVuY3Rpb24gKCByb3RhdGlvbiwgZXllMiApIHtcblxuXHRcdFx0VEhSRUUuVHJhbnNmb3JtR2l6bW8ucHJvdG90eXBlLnVwZGF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRcdHZhciBncm91cCA9IHtcblxuXHRcdFx0XHRoYW5kbGVzOiB0aGlzWyBcImhhbmRsZXNcIiBdLFxuXHRcdFx0XHRwaWNrZXJzOiB0aGlzWyBcInBpY2tlcnNcIiBdLFxuXG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgdGVtcE1hdHJpeCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG5cdFx0XHR2YXIgd29ybGRSb3RhdGlvbiA9IG5ldyBUSFJFRS5FdWxlciggMCwgMCwgMSApO1xuXHRcdFx0dmFyIHRlbXBRdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblx0XHRcdHZhciB1bml0WCA9IG5ldyBUSFJFRS5WZWN0b3IzKCAxLCAwLCAwICk7XG5cdFx0XHR2YXIgdW5pdFkgPSBuZXcgVEhSRUUuVmVjdG9yMyggMCwgMSwgMCApO1xuXHRcdFx0dmFyIHVuaXRaID0gbmV3IFRIUkVFLlZlY3RvcjMoIDAsIDAsIDEgKTtcblx0XHRcdHZhciBxdWF0ZXJuaW9uWCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cdFx0XHR2YXIgcXVhdGVybmlvblkgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXHRcdFx0dmFyIHF1YXRlcm5pb25aID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblx0XHRcdHZhciBleWUgPSBleWUyLmNsb25lKCk7XG5cblx0XHRcdHdvcmxkUm90YXRpb24uY29weSggdGhpcy5wbGFuZXNbIFwiWFlcIiBdLnJvdGF0aW9uICk7XG5cdFx0XHR0ZW1wUXVhdGVybmlvbi5zZXRGcm9tRXVsZXIoIHdvcmxkUm90YXRpb24gKTtcblxuXHRcdFx0dGVtcE1hdHJpeC5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiggdGVtcFF1YXRlcm5pb24gKS5nZXRJbnZlcnNlKCB0ZW1wTWF0cml4ICk7XG5cdFx0XHRleWUuYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4ICk7XG5cblx0XHRcdHRoaXMudHJhdmVyc2UoIGZ1bmN0aW9uKCBjaGlsZCApIHtcblxuXHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5zZXRGcm9tRXVsZXIoIHdvcmxkUm90YXRpb24gKTtcblxuXHRcdFx0XHRpZiAoIGNoaWxkLm5hbWUgPT09IFwiWFwiICkge1xuXG5cdFx0XHRcdFx0cXVhdGVybmlvblguc2V0RnJvbUF4aXNBbmdsZSggdW5pdFgsIE1hdGguYXRhbjIoIC0gZXllLnksIGV5ZS56ICkgKTtcblx0XHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblggKTtcblx0XHRcdFx0XHRjaGlsZC5xdWF0ZXJuaW9uLmNvcHkoIHRlbXBRdWF0ZXJuaW9uICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggY2hpbGQubmFtZSA9PT0gXCJZXCIgKSB7XG5cblx0XHRcdFx0XHRxdWF0ZXJuaW9uWS5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0WSwgTWF0aC5hdGFuMiggZXllLngsIGV5ZS56ICkgKTtcblx0XHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblkgKTtcblx0XHRcdFx0XHRjaGlsZC5xdWF0ZXJuaW9uLmNvcHkoIHRlbXBRdWF0ZXJuaW9uICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggY2hpbGQubmFtZSA9PT0gXCJaXCIgKSB7XG5cblx0XHRcdFx0XHRxdWF0ZXJuaW9uWi5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0WiwgTWF0aC5hdGFuMiggZXllLnksIGV5ZS54ICkgKTtcblx0XHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblogKTtcblx0XHRcdFx0XHRjaGlsZC5xdWF0ZXJuaW9uLmNvcHkoIHRlbXBRdWF0ZXJuaW9uICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0KCk7XG5cblx0fTtcblxuXHRUSFJFRS5UcmFuc2Zvcm1HaXptb1JvdGF0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5UcmFuc2Zvcm1HaXptby5wcm90b3R5cGUgKTtcblx0VEhSRUUuVHJhbnNmb3JtR2l6bW9Sb3RhdGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuVHJhbnNmb3JtR2l6bW9Sb3RhdGU7XG5cblx0VEhSRUUuVHJhbnNmb3JtR2l6bW9TY2FsZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFRIUkVFLlRyYW5zZm9ybUdpem1vLmNhbGwoIHRoaXMgKTtcblxuXHRcdHZhciBhcnJvd0dlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cdFx0dmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLkJveEdlb21ldHJ5KCAwLjEyNSwgMC4xMjUsIDAuMTI1ICkgKTtcblx0XHRtZXNoLnBvc2l0aW9uLnkgPSAwLjU7XG5cdFx0bWVzaC51cGRhdGVNYXRyaXgoKTtcblxuXHRcdGFycm93R2VvbWV0cnkubWVyZ2UoIG1lc2guZ2VvbWV0cnksIG1lc2gubWF0cml4ICk7XG5cblx0XHR2YXIgbGluZVhHZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuXHRcdGxpbmVYR2VvbWV0cnkuYWRkQXR0cmlidXRlKCAncG9zaXRpb24nLCBuZXcgVEhSRUUuRmxvYXQzMkF0dHJpYnV0ZSggWyAwLCAwLCAwLCAgMSwgMCwgMCBdLCAzICkgKTtcblxuXHRcdHZhciBsaW5lWUdlb21ldHJ5ID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCk7XG5cdFx0bGluZVlHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoICdwb3NpdGlvbicsIG5ldyBUSFJFRS5GbG9hdDMyQXR0cmlidXRlKCBbIDAsIDAsIDAsICAwLCAxLCAwIF0sIDMgKSApO1xuXG5cdFx0dmFyIGxpbmVaR2VvbWV0cnkgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKTtcblx0XHRsaW5lWkdlb21ldHJ5LmFkZEF0dHJpYnV0ZSggJ3Bvc2l0aW9uJywgbmV3IFRIUkVFLkZsb2F0MzJBdHRyaWJ1dGUoIFsgMCwgMCwgMCwgIDAsIDAsIDEgXSwgMyApICk7XG5cblx0XHR0aGlzLmhhbmRsZUdpem1vcyA9IHtcblxuXHRcdFx0WDogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBhcnJvd0dlb21ldHJ5LCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHhmZjAwMDAgfSApICksIFsgMC41LCAwLCAwIF0sIFsgMCwgMCwgLSBNYXRoLlBJIC8gMiBdIF0sXG5cdFx0XHRcdFsgbmV3IFRIUkVFLkxpbmUoIGxpbmVYR2VvbWV0cnksIG5ldyBHaXptb0xpbmVNYXRlcmlhbCggeyBjb2xvcjogMHhmZjAwMDAgfSApICkgXVxuXHRcdFx0XSxcblxuXHRcdFx0WTogW1xuXHRcdFx0XHRbIG5ldyBUSFJFRS5NZXNoKCBhcnJvd0dlb21ldHJ5LCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHgwMGZmMDAgfSApICksIFsgMCwgMC41LCAwIF0gXSxcblx0XHRcdFx0WyBuZXcgVEhSRUUuTGluZSggbGluZVlHZW9tZXRyeSwgbmV3IEdpem1vTGluZU1hdGVyaWFsKCB7IGNvbG9yOiAweDAwZmYwMCB9ICkgKSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRaOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIGFycm93R2VvbWV0cnksIG5ldyBHaXptb01hdGVyaWFsKCB7IGNvbG9yOiAweDAwMDBmZiB9ICkgKSwgWyAwLCAwLCAwLjUgXSwgWyBNYXRoLlBJIC8gMiwgMCwgMCBdIF0sXG5cdFx0XHRcdFsgbmV3IFRIUkVFLkxpbmUoIGxpbmVaR2VvbWV0cnksIG5ldyBHaXptb0xpbmVNYXRlcmlhbCggeyBjb2xvcjogMHgwMDAwZmYgfSApICkgXVxuXHRcdFx0XSxcblxuXHRcdFx0WFlaOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSggMC4xMjUsIDAuMTI1LCAwLjEyNSApLCBuZXcgR2l6bW9NYXRlcmlhbCggeyBjb2xvcjogMHhmZmZmZmYsIG9wYWNpdHk6IDAuMjUgfSApICkgXVxuXHRcdFx0XVxuXG5cdFx0fTtcblxuXHRcdHRoaXMucGlja2VyR2l6bW9zID0ge1xuXG5cdFx0XHRYOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KCAwLjIsIDAsIDEsIDQsIDEsIGZhbHNlICksIHBpY2tlck1hdGVyaWFsICksIFsgMC42LCAwLCAwIF0sIFsgMCwgMCwgLSBNYXRoLlBJIC8gMiBdIF1cblx0XHRcdF0sXG5cblx0XHRcdFk6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoIDAuMiwgMCwgMSwgNCwgMSwgZmFsc2UgKSwgcGlja2VyTWF0ZXJpYWwgKSwgWyAwLCAwLjYsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRaOiBbXG5cdFx0XHRcdFsgbmV3IFRIUkVFLk1lc2goIG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KCAwLjIsIDAsIDEsIDQsIDEsIGZhbHNlICksIHBpY2tlck1hdGVyaWFsICksIFsgMCwgMCwgMC42IF0sIFsgTWF0aC5QSSAvIDIsIDAsIDAgXSBdXG5cdFx0XHRdLFxuXG5cdFx0XHRYWVo6IFtcblx0XHRcdFx0WyBuZXcgVEhSRUUuTWVzaCggbmV3IFRIUkVFLkJveEdlb21ldHJ5KCAwLjQsIDAuNCwgMC40ICksIHBpY2tlck1hdGVyaWFsICkgXVxuXHRcdFx0XVxuXG5cdFx0fTtcblxuXHRcdHRoaXMuc2V0QWN0aXZlUGxhbmUgPSBmdW5jdGlvbiAoIGF4aXMsIGV5ZSApIHtcblxuXHRcdFx0dmFyIHRlbXBNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdFx0ZXllLmFwcGx5TWF0cml4NCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCB0ZW1wTWF0cml4LmV4dHJhY3RSb3RhdGlvbiggdGhpcy5wbGFuZXNbIFwiWFlcIiBdLm1hdHJpeFdvcmxkICkgKSApO1xuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFwiICkge1xuXG5cdFx0XHRcdHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWVwiIF07XG5cdFx0XHRcdGlmICggTWF0aC5hYnMoIGV5ZS55ICkgPiBNYXRoLmFicyggZXllLnogKSApIHRoaXMuYWN0aXZlUGxhbmUgPSB0aGlzLnBsYW5lc1sgXCJYWlwiIF07XG5cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBheGlzID09PSBcIllcIiApIHtcblxuXHRcdFx0XHR0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWFlcIiBdO1xuXHRcdFx0XHRpZiAoIE1hdGguYWJzKCBleWUueCApID4gTWF0aC5hYnMoIGV5ZS56ICkgKSB0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWVpcIiBdO1xuXG5cdFx0XHR9XG5cblx0XHRcdGlmICggYXhpcyA9PT0gXCJaXCIgKSB7XG5cblx0XHRcdFx0dGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIlhaXCIgXTtcblx0XHRcdFx0aWYgKCBNYXRoLmFicyggZXllLnggKSA+IE1hdGguYWJzKCBleWUueSApICkgdGhpcy5hY3RpdmVQbGFuZSA9IHRoaXMucGxhbmVzWyBcIllaXCIgXTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGF4aXMgPT09IFwiWFlaXCIgKSB0aGlzLmFjdGl2ZVBsYW5lID0gdGhpcy5wbGFuZXNbIFwiWFlaRVwiIF07XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0KCk7XG5cblx0fTtcblxuXHRUSFJFRS5UcmFuc2Zvcm1HaXptb1NjYWxlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFRIUkVFLlRyYW5zZm9ybUdpem1vLnByb3RvdHlwZSApO1xuXHRUSFJFRS5UcmFuc2Zvcm1HaXptb1NjYWxlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLlRyYW5zZm9ybUdpem1vU2NhbGU7XG5cblx0VEhSRUUuVHJhbnNmb3JtQ29udHJvbHMgPSBmdW5jdGlvbiAoIGNhbWVyYSwgZG9tRWxlbWVudCApIHtcblxuXHRcdC8vIFRPRE86IE1ha2Ugbm9uLXVuaWZvcm0gc2NhbGUgYW5kIHJvdGF0ZSBwbGF5IG5pY2UgaW4gaGllcmFyY2hpZXNcblx0XHQvLyBUT0RPOiBBREQgUlhZWiBjb250b2xcblxuXHRcdFRIUkVFLk9iamVjdDNELmNhbGwoIHRoaXMgKTtcblxuXHRcdGRvbUVsZW1lbnQgPSAoIGRvbUVsZW1lbnQgIT09IHVuZGVmaW5lZCApID8gZG9tRWxlbWVudCA6IGRvY3VtZW50O1xuXG5cdFx0dGhpcy5vYmplY3QgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy52aXNpYmxlID0gZmFsc2U7XG5cdFx0dGhpcy50cmFuc2xhdGlvblNuYXAgPSBudWxsO1xuXHRcdHRoaXMucm90YXRpb25TbmFwID0gbnVsbDtcblx0XHR0aGlzLnNwYWNlID0gXCJ3b3JsZFwiO1xuXHRcdHRoaXMuc2l6ZSA9IDE7XG5cdFx0dGhpcy5heGlzID0gbnVsbDtcblxuXHRcdHZhciBzY29wZSA9IHRoaXM7XG5cblx0XHR2YXIgX21vZGUgPSBcInRyYW5zbGF0ZVwiO1xuXHRcdHZhciBfZHJhZ2dpbmcgPSBmYWxzZTtcblx0XHR2YXIgX3BsYW5lID0gXCJYWVwiO1xuXHRcdHZhciBfZ2l6bW8gPSB7XG5cblx0XHRcdFwidHJhbnNsYXRlXCI6IG5ldyBUSFJFRS5UcmFuc2Zvcm1HaXptb1RyYW5zbGF0ZSgpLFxuXHRcdFx0XCJyb3RhdGVcIjogbmV3IFRIUkVFLlRyYW5zZm9ybUdpem1vUm90YXRlKCksXG5cdFx0XHRcInNjYWxlXCI6IG5ldyBUSFJFRS5UcmFuc2Zvcm1HaXptb1NjYWxlKClcblx0XHR9O1xuXG5cdFx0Zm9yICggdmFyIHR5cGUgaW4gX2dpem1vICkge1xuXG5cdFx0XHR2YXIgZ2l6bW9PYmogPSBfZ2l6bW9bIHR5cGUgXTtcblxuXHRcdFx0Z2l6bW9PYmoudmlzaWJsZSA9ICggdHlwZSA9PT0gX21vZGUgKTtcblx0XHRcdHRoaXMuYWRkKCBnaXptb09iaiApO1xuXG5cdFx0fVxuXG5cdFx0dmFyIGNoYW5nZUV2ZW50ID0geyB0eXBlOiBcImNoYW5nZVwiIH07XG5cdFx0dmFyIG1vdXNlRG93bkV2ZW50ID0geyB0eXBlOiBcIm1vdXNlRG93blwiIH07XG5cdFx0dmFyIG1vdXNlVXBFdmVudCA9IHsgdHlwZTogXCJtb3VzZVVwXCIsIG1vZGU6IF9tb2RlIH07XG5cdFx0dmFyIG9iamVjdENoYW5nZUV2ZW50ID0geyB0eXBlOiBcIm9iamVjdENoYW5nZVwiIH07XG5cblx0XHR2YXIgcmF5ID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXHRcdHZhciBwb2ludGVyVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuXHRcdHZhciBwb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0XHR2YXIgcm90YXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHRcdHZhciBvZmZzZXRSb3RhdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIHNjYWxlID0gMTtcblxuXHRcdHZhciBsb29rQXRNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdHZhciBleWUgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0dmFyIHRlbXBNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdHZhciB0ZW1wVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblx0XHR2YXIgdGVtcFF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXHRcdHZhciB1bml0WCA9IG5ldyBUSFJFRS5WZWN0b3IzKCAxLCAwLCAwICk7XG5cdFx0dmFyIHVuaXRZID0gbmV3IFRIUkVFLlZlY3RvcjMoIDAsIDEsIDAgKTtcblx0XHR2YXIgdW5pdFogPSBuZXcgVEhSRUUuVmVjdG9yMyggMCwgMCwgMSApO1xuXG5cdFx0dmFyIHF1YXRlcm5pb25YWVogPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXHRcdHZhciBxdWF0ZXJuaW9uWCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cdFx0dmFyIHF1YXRlcm5pb25ZID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblx0XHR2YXIgcXVhdGVybmlvblogPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXHRcdHZhciBxdWF0ZXJuaW9uRSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cblx0XHR2YXIgb2xkUG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHRcdHZhciBvbGRTY2FsZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIG9sZFJvdGF0aW9uTWF0cml4ID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcblxuXHRcdHZhciBwYXJlbnRSb3RhdGlvbk1hdHJpeCAgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdHZhciBwYXJlbnRTY2FsZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0XHR2YXIgd29ybGRQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIHdvcmxkUm90YXRpb24gPSBuZXcgVEhSRUUuRXVsZXIoKTtcblx0XHR2YXIgd29ybGRSb3RhdGlvbk1hdHJpeCAgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdHZhciBjYW1Qb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIGNhbVJvdGF0aW9uID0gbmV3IFRIUkVFLkV1bGVyKCk7XG5cblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2Vkb3duXCIsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNoc3RhcnRcIiwgb25Qb2ludGVyRG93biwgZmFsc2UgKTtcblxuXHRcdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVySG92ZXIsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNobW92ZVwiLCBvblBvaW50ZXJIb3ZlciwgZmFsc2UgKTtcblxuXHRcdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVyTW92ZSwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwidG91Y2htb3ZlXCIsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2V1cFwiLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2VvdXRcIiwgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNoZW5kXCIsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJ0b3VjaGNhbmNlbFwiLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwidG91Y2hsZWF2ZVwiLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblxuXHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCBcIm1vdXNlZG93blwiLCBvblBvaW50ZXJEb3duICk7XG5cdFx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIFwidG91Y2hzdGFydFwiLCBvblBvaW50ZXJEb3duICk7XG5cblx0XHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVySG92ZXIgKTtcblx0XHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggXCJ0b3VjaG1vdmVcIiwgb25Qb2ludGVySG92ZXIgKTtcblxuXHRcdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCBcIm1vdXNlbW92ZVwiLCBvblBvaW50ZXJNb3ZlICk7XG5cdFx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIFwidG91Y2htb3ZlXCIsIG9uUG9pbnRlck1vdmUgKTtcblxuXHRcdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCBcIm1vdXNldXBcIiwgb25Qb2ludGVyVXAgKTtcblx0XHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggXCJtb3VzZW91dFwiLCBvblBvaW50ZXJVcCApO1xuXHRcdFx0ZG9tRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCBcInRvdWNoZW5kXCIsIG9uUG9pbnRlclVwICk7XG5cdFx0XHRkb21FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIFwidG91Y2hjYW5jZWxcIiwgb25Qb2ludGVyVXAgKTtcblx0XHRcdGRvbUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggXCJ0b3VjaGxlYXZlXCIsIG9uUG9pbnRlclVwICk7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5hdHRhY2ggPSBmdW5jdGlvbiAoIG9iamVjdCApIHtcblxuXHRcdFx0dGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cdFx0XHR0aGlzLnZpc2libGUgPSB0cnVlO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblxuXHRcdH07XG5cblx0XHR0aGlzLmRldGFjaCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0dGhpcy5vYmplY3QgPSB1bmRlZmluZWQ7XG5cdFx0XHR0aGlzLnZpc2libGUgPSBmYWxzZTtcblx0XHRcdHRoaXMuYXhpcyA9IG51bGw7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRNb2RlID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRyZXR1cm4gX21vZGU7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5zZXRNb2RlID0gZnVuY3Rpb24gKCBtb2RlICkge1xuXG5cdFx0XHRfbW9kZSA9IG1vZGUgPyBtb2RlIDogX21vZGU7XG5cblx0XHRcdGlmICggX21vZGUgPT09IFwic2NhbGVcIiApIHNjb3BlLnNwYWNlID0gXCJsb2NhbFwiO1xuXG5cdFx0XHRmb3IgKCB2YXIgdHlwZSBpbiBfZ2l6bW8gKSBfZ2l6bW9bIHR5cGUgXS52aXNpYmxlID0gKCB0eXBlID09PSBfbW9kZSApO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuXHRcdH07XG5cblx0XHR0aGlzLnNldFRyYW5zbGF0aW9uU25hcCA9IGZ1bmN0aW9uICggdHJhbnNsYXRpb25TbmFwICkge1xuXG5cdFx0XHRzY29wZS50cmFuc2xhdGlvblNuYXAgPSB0cmFuc2xhdGlvblNuYXA7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5zZXRSb3RhdGlvblNuYXAgPSBmdW5jdGlvbiAoIHJvdGF0aW9uU25hcCApIHtcblxuXHRcdFx0c2NvcGUucm90YXRpb25TbmFwID0gcm90YXRpb25TbmFwO1xuXG5cdFx0fTtcblxuXHRcdHRoaXMuc2V0U2l6ZSA9IGZ1bmN0aW9uICggc2l6ZSApIHtcblxuXHRcdFx0c2NvcGUuc2l6ZSA9IHNpemU7XG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuXHRcdH07XG5cblx0XHR0aGlzLnNldFNwYWNlID0gZnVuY3Rpb24gKCBzcGFjZSApIHtcblxuXHRcdFx0c2NvcGUuc3BhY2UgPSBzcGFjZTtcblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBjaGFuZ2VFdmVudCApO1xuXG5cdFx0fTtcblxuXHRcdHRoaXMudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRpZiAoIHNjb3BlLm9iamVjdCAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRzY29wZS5vYmplY3QudXBkYXRlTWF0cml4V29ybGQoKTtcblx0XHRcdFx0d29ybGRQb3NpdGlvbi5zZXRGcm9tTWF0cml4UG9zaXRpb24oIHNjb3BlLm9iamVjdC5tYXRyaXhXb3JsZCApO1xuXHRcdFx0XHR3b3JsZFJvdGF0aW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggdGVtcE1hdHJpeC5leHRyYWN0Um90YXRpb24oIHNjb3BlLm9iamVjdC5tYXRyaXhXb3JsZCApICk7XG5cdFx0XHR9XG5cblx0XHRcdGNhbWVyYS51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXHRcdFx0Y2FtUG9zaXRpb24uc2V0RnJvbU1hdHJpeFBvc2l0aW9uKCBjYW1lcmEubWF0cml4V29ybGQgKTtcblx0XHRcdGNhbVJvdGF0aW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggdGVtcE1hdHJpeC5leHRyYWN0Um90YXRpb24oIGNhbWVyYS5tYXRyaXhXb3JsZCApICk7XG5cblx0XHRcdHNjYWxlID0gd29ybGRQb3NpdGlvbi5kaXN0YW5jZVRvKCBjYW1Qb3NpdGlvbiApIC8gNiAqIHNjb3BlLnNpemU7XG5cdFx0XHR0aGlzLnBvc2l0aW9uLmNvcHkoIHdvcmxkUG9zaXRpb24gKTtcblx0XHRcdHRoaXMuc2NhbGUuc2V0KCBzY2FsZSwgc2NhbGUsIHNjYWxlICk7XG5cblx0XHRcdGV5ZS5jb3B5KCBjYW1Qb3NpdGlvbiApLnN1Yiggd29ybGRQb3NpdGlvbiApLm5vcm1hbGl6ZSgpO1xuXG5cdFx0XHRpZiAoIHNjb3BlLnNwYWNlID09PSBcImxvY2FsXCIgKSB7XG5cblx0XHRcdFx0X2dpem1vWyBfbW9kZSBdLnVwZGF0ZSggd29ybGRSb3RhdGlvbiwgZXllICk7XG5cblx0XHRcdH0gZWxzZSBpZiAoIHNjb3BlLnNwYWNlID09PSBcIndvcmxkXCIgKSB7XG5cblx0XHRcdFx0X2dpem1vWyBfbW9kZSBdLnVwZGF0ZSggbmV3IFRIUkVFLkV1bGVyKCksIGV5ZSApO1xuXG5cdFx0XHR9XG5cblx0XHRcdF9naXptb1sgX21vZGUgXS5oaWdobGlnaHQoIHNjb3BlLmF4aXMgKTtcblxuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBvblBvaW50ZXJIb3ZlciggZXZlbnQgKSB7XG5cdFx0XHRpZiAoIHNjb3BlLm9iamVjdCA9PT0gdW5kZWZpbmVkIHx8IF9kcmFnZ2luZyA9PT0gdHJ1ZSB8fCAoIGV2ZW50LmJ1dHRvbiAhPT0gdW5kZWZpbmVkICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCApICkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgcG9pbnRlciA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzID8gZXZlbnQuY2hhbmdlZFRvdWNoZXNbIDAgXSA6IGV2ZW50O1xuXG5cdFx0XHR2YXIgaW50ZXJzZWN0ID0gaW50ZXJzZWN0T2JqZWN0cyggcG9pbnRlciwgX2dpem1vWyBfbW9kZSBdLnBpY2tlcnMuY2hpbGRyZW4gKTtcblx0XHRcdHZhciBheGlzID0gbnVsbDtcblxuXHRcdFx0aWYgKCBpbnRlcnNlY3QgKSB7XG5cblx0XHRcdFx0YXhpcyA9IGludGVyc2VjdC5vYmplY3QubmFtZTtcblxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHR9XG5cblx0XHRcdGlmICggc2NvcGUuYXhpcyAhPT0gYXhpcyApIHtcblxuXHRcdFx0XHRzY29wZS5heGlzID0gYXhpcztcblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGNoYW5nZUV2ZW50ICk7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG9uUG9pbnRlckRvd24oIGV2ZW50ICkge1xuXG5cdFx0XHRpZiAoIHNjb3BlLm9iamVjdCA9PT0gdW5kZWZpbmVkIHx8IF9kcmFnZ2luZyA9PT0gdHJ1ZSB8fCAoIGV2ZW50LmJ1dHRvbiAhPT0gdW5kZWZpbmVkICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCApICkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgcG9pbnRlciA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzID8gZXZlbnQuY2hhbmdlZFRvdWNoZXNbIDAgXSA6IGV2ZW50O1xuXG5cdFx0XHRpZiAoIHBvaW50ZXIuYnV0dG9uID09PSAwIHx8IHBvaW50ZXIuYnV0dG9uID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0dmFyIGludGVyc2VjdCA9IGludGVyc2VjdE9iamVjdHMoIHBvaW50ZXIsIF9naXptb1sgX21vZGUgXS5waWNrZXJzLmNoaWxkcmVuICk7XG5cblx0XHRcdFx0aWYgKCBpbnRlcnNlY3QgKSB7XG5cblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHRcdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggbW91c2VEb3duRXZlbnQgKTtcblxuXHRcdFx0XHRcdHNjb3BlLmF4aXMgPSBpbnRlcnNlY3Qub2JqZWN0Lm5hbWU7XG5cblx0XHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblxuXHRcdFx0XHRcdGV5ZS5jb3B5KCBjYW1Qb3NpdGlvbiApLnN1Yiggd29ybGRQb3NpdGlvbiApLm5vcm1hbGl6ZSgpO1xuXG5cdFx0XHRcdFx0X2dpem1vWyBfbW9kZSBdLnNldEFjdGl2ZVBsYW5lKCBzY29wZS5heGlzLCBleWUgKTtcblxuXHRcdFx0XHRcdHZhciBwbGFuZUludGVyc2VjdCA9IGludGVyc2VjdE9iamVjdHMoIHBvaW50ZXIsIFsgX2dpem1vWyBfbW9kZSBdLmFjdGl2ZVBsYW5lIF0gKTtcblxuXHRcdFx0XHRcdGlmICggcGxhbmVJbnRlcnNlY3QgKSB7XG5cblx0XHRcdFx0XHRcdG9sZFBvc2l0aW9uLmNvcHkoIHNjb3BlLm9iamVjdC5wb3NpdGlvbiApO1xuXHRcdFx0XHRcdFx0b2xkU2NhbGUuY29weSggc2NvcGUub2JqZWN0LnNjYWxlICk7XG5cblx0XHRcdFx0XHRcdG9sZFJvdGF0aW9uTWF0cml4LmV4dHJhY3RSb3RhdGlvbiggc2NvcGUub2JqZWN0Lm1hdHJpeCApO1xuXHRcdFx0XHRcdFx0d29ybGRSb3RhdGlvbk1hdHJpeC5leHRyYWN0Um90YXRpb24oIHNjb3BlLm9iamVjdC5tYXRyaXhXb3JsZCApO1xuXG5cdFx0XHRcdFx0XHRwYXJlbnRSb3RhdGlvbk1hdHJpeC5leHRyYWN0Um90YXRpb24oIHNjb3BlLm9iamVjdC5wYXJlbnQubWF0cml4V29ybGQgKTtcblx0XHRcdFx0XHRcdHBhcmVudFNjYWxlLnNldEZyb21NYXRyaXhTY2FsZSggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCBzY29wZS5vYmplY3QucGFyZW50Lm1hdHJpeFdvcmxkICkgKTtcblxuXHRcdFx0XHRcdFx0b2Zmc2V0LmNvcHkoIHBsYW5lSW50ZXJzZWN0LnBvaW50ICk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdF9kcmFnZ2luZyA9IHRydWU7XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvblBvaW50ZXJNb3ZlKCBldmVudCApIHtcblxuXHRcdFx0aWYgKCBzY29wZS5vYmplY3QgPT09IHVuZGVmaW5lZCB8fCBzY29wZS5heGlzID09PSBudWxsIHx8IF9kcmFnZ2luZyA9PT0gZmFsc2UgfHwgKCBldmVudC5idXR0b24gIT09IHVuZGVmaW5lZCAmJiBldmVudC5idXR0b24gIT09IDAgKSApIHJldHVybjtcblxuXHRcdFx0dmFyIHBvaW50ZXIgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyA/IGV2ZW50LmNoYW5nZWRUb3VjaGVzWyAwIF0gOiBldmVudDtcblxuXHRcdFx0dmFyIHBsYW5lSW50ZXJzZWN0ID0gaW50ZXJzZWN0T2JqZWN0cyggcG9pbnRlciwgWyBfZ2l6bW9bIF9tb2RlIF0uYWN0aXZlUGxhbmUgXSApO1xuXG5cdFx0XHRpZiAoIHBsYW5lSW50ZXJzZWN0ID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHRwb2ludC5jb3B5KCBwbGFuZUludGVyc2VjdC5wb2ludCApO1xuXG5cdFx0XHRpZiAoIF9tb2RlID09PSBcInRyYW5zbGF0ZVwiICkge1xuXG5cdFx0XHRcdHBvaW50LnN1Yiggb2Zmc2V0ICk7XG5cdFx0XHRcdHBvaW50Lm11bHRpcGx5KCBwYXJlbnRTY2FsZSApO1xuXG5cdFx0XHRcdGlmICggc2NvcGUuc3BhY2UgPT09IFwibG9jYWxcIiApIHtcblxuXHRcdFx0XHRcdHBvaW50LmFwcGx5TWF0cml4NCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCB3b3JsZFJvdGF0aW9uTWF0cml4ICkgKTtcblxuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWFwiICkgPT09IC0gMSApIHBvaW50LnggPSAwO1xuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWVwiICkgPT09IC0gMSApIHBvaW50LnkgPSAwO1xuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWlwiICkgPT09IC0gMSApIHBvaW50LnogPSAwO1xuXG5cdFx0XHRcdFx0cG9pbnQuYXBwbHlNYXRyaXg0KCBvbGRSb3RhdGlvbk1hdHJpeCApO1xuXG5cdFx0XHRcdFx0c2NvcGUub2JqZWN0LnBvc2l0aW9uLmNvcHkoIG9sZFBvc2l0aW9uICk7XG5cdFx0XHRcdFx0c2NvcGUub2JqZWN0LnBvc2l0aW9uLmFkZCggcG9pbnQgKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBzY29wZS5zcGFjZSA9PT0gXCJ3b3JsZFwiIHx8IHNjb3BlLmF4aXMuc2VhcmNoKCBcIlhZWlwiICkgIT09IC0gMSApIHtcblxuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWFwiICkgPT09IC0gMSApIHBvaW50LnggPSAwO1xuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWVwiICkgPT09IC0gMSApIHBvaW50LnkgPSAwO1xuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWlwiICkgPT09IC0gMSApIHBvaW50LnogPSAwO1xuXG5cdFx0XHRcdFx0cG9pbnQuYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIHBhcmVudFJvdGF0aW9uTWF0cml4ICkgKTtcblxuXHRcdFx0XHRcdHNjb3BlLm9iamVjdC5wb3NpdGlvbi5jb3B5KCBvbGRQb3NpdGlvbiApO1xuXHRcdFx0XHRcdHNjb3BlLm9iamVjdC5wb3NpdGlvbi5hZGQoIHBvaW50ICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggc2NvcGUudHJhbnNsYXRpb25TbmFwICE9PSBudWxsICkge1xuXG5cdFx0XHRcdFx0aWYgKCBzY29wZS5zcGFjZSA9PT0gXCJsb2NhbFwiICkge1xuXG5cdFx0XHRcdFx0XHRzY29wZS5vYmplY3QucG9zaXRpb24uYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIHdvcmxkUm90YXRpb25NYXRyaXggKSApO1xuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCBzY29wZS5heGlzLnNlYXJjaCggXCJYXCIgKSAhPT0gLSAxICkgc2NvcGUub2JqZWN0LnBvc2l0aW9uLnggPSBNYXRoLnJvdW5kKCBzY29wZS5vYmplY3QucG9zaXRpb24ueCAvIHNjb3BlLnRyYW5zbGF0aW9uU25hcCApICogc2NvcGUudHJhbnNsYXRpb25TbmFwO1xuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcy5zZWFyY2goIFwiWVwiICkgIT09IC0gMSApIHNjb3BlLm9iamVjdC5wb3NpdGlvbi55ID0gTWF0aC5yb3VuZCggc2NvcGUub2JqZWN0LnBvc2l0aW9uLnkgLyBzY29wZS50cmFuc2xhdGlvblNuYXAgKSAqIHNjb3BlLnRyYW5zbGF0aW9uU25hcDtcblx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMuc2VhcmNoKCBcIlpcIiApICE9PSAtIDEgKSBzY29wZS5vYmplY3QucG9zaXRpb24ueiA9IE1hdGgucm91bmQoIHNjb3BlLm9iamVjdC5wb3NpdGlvbi56IC8gc2NvcGUudHJhbnNsYXRpb25TbmFwICkgKiBzY29wZS50cmFuc2xhdGlvblNuYXA7XG5cblx0XHRcdFx0XHRpZiAoIHNjb3BlLnNwYWNlID09PSBcImxvY2FsXCIgKSB7XG5cblx0XHRcdFx0XHRcdHNjb3BlLm9iamVjdC5wb3NpdGlvbi5hcHBseU1hdHJpeDQoIHdvcmxkUm90YXRpb25NYXRyaXggKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZiAoIF9tb2RlID09PSBcInNjYWxlXCIgKSB7XG5cblx0XHRcdFx0cG9pbnQuc3ViKCBvZmZzZXQgKTtcblx0XHRcdFx0cG9pbnQubXVsdGlwbHkoIHBhcmVudFNjYWxlICk7XG5cblx0XHRcdFx0aWYgKCBzY29wZS5zcGFjZSA9PT0gXCJsb2NhbFwiICkge1xuXG5cdFx0XHRcdFx0aWYgKCBzY29wZS5heGlzID09PSBcIlhZWlwiICkge1xuXG5cdFx0XHRcdFx0XHRzY2FsZSA9IDEgKyAoICggcG9pbnQueSApIC8gNTAgKTtcblxuXHRcdFx0XHRcdFx0c2NvcGUub2JqZWN0LnNjYWxlLnggPSBvbGRTY2FsZS54ICogc2NhbGU7XG5cdFx0XHRcdFx0XHRzY29wZS5vYmplY3Quc2NhbGUueSA9IG9sZFNjYWxlLnkgKiBzY2FsZTtcblx0XHRcdFx0XHRcdHNjb3BlLm9iamVjdC5zY2FsZS56ID0gb2xkU2NhbGUueiAqIHNjYWxlO1xuXG5cdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0cG9pbnQuYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIHdvcmxkUm90YXRpb25NYXRyaXggKSApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMgPT09IFwiWFwiICkgc2NvcGUub2JqZWN0LnNjYWxlLnggPSBvbGRTY2FsZS54ICogKCAxICsgcG9pbnQueCAvIDUwICk7XG5cdFx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMgPT09IFwiWVwiICkgc2NvcGUub2JqZWN0LnNjYWxlLnkgPSBvbGRTY2FsZS55ICogKCAxICsgcG9pbnQueSAvIDUwICk7XG5cdFx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMgPT09IFwiWlwiICkgc2NvcGUub2JqZWN0LnNjYWxlLnogPSBvbGRTY2FsZS56ICogKCAxICsgcG9pbnQueiAvIDUwICk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYgKCBfbW9kZSA9PT0gXCJyb3RhdGVcIiApIHtcblxuXHRcdFx0XHRwb2ludC5zdWIoIHdvcmxkUG9zaXRpb24gKTtcblx0XHRcdFx0cG9pbnQubXVsdGlwbHkoIHBhcmVudFNjYWxlICk7XG5cdFx0XHRcdHRlbXBWZWN0b3IuY29weSggb2Zmc2V0ICkuc3ViKCB3b3JsZFBvc2l0aW9uICk7XG5cdFx0XHRcdHRlbXBWZWN0b3IubXVsdGlwbHkoIHBhcmVudFNjYWxlICk7XG5cblx0XHRcdFx0aWYgKCBzY29wZS5heGlzID09PSBcIkVcIiApIHtcblxuXHRcdFx0XHRcdHBvaW50LmFwcGx5TWF0cml4NCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCBsb29rQXRNYXRyaXggKSApO1xuXHRcdFx0XHRcdHRlbXBWZWN0b3IuYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIGxvb2tBdE1hdHJpeCApICk7XG5cblx0XHRcdFx0XHRyb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHBvaW50LnosIHBvaW50LnkgKSwgTWF0aC5hdGFuMiggcG9pbnQueCwgcG9pbnQueiApLCBNYXRoLmF0YW4yKCBwb2ludC55LCBwb2ludC54ICkgKTtcblx0XHRcdFx0XHRvZmZzZXRSb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueiwgdGVtcFZlY3Rvci55ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueCwgdGVtcFZlY3Rvci56ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueSwgdGVtcFZlY3Rvci54ICkgKTtcblxuXHRcdFx0XHRcdHRlbXBRdWF0ZXJuaW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCBwYXJlbnRSb3RhdGlvbk1hdHJpeCApICk7XG5cblx0XHRcdFx0XHRxdWF0ZXJuaW9uRS5zZXRGcm9tQXhpc0FuZ2xlKCBleWUsIHJvdGF0aW9uLnogLSBvZmZzZXRSb3RhdGlvbi56ICk7XG5cdFx0XHRcdFx0cXVhdGVybmlvblhZWi5zZXRGcm9tUm90YXRpb25NYXRyaXgoIHdvcmxkUm90YXRpb25NYXRyaXggKTtcblxuXHRcdFx0XHRcdHRlbXBRdWF0ZXJuaW9uLm11bHRpcGx5UXVhdGVybmlvbnMoIHRlbXBRdWF0ZXJuaW9uLCBxdWF0ZXJuaW9uRSApO1xuXHRcdFx0XHRcdHRlbXBRdWF0ZXJuaW9uLm11bHRpcGx5UXVhdGVybmlvbnMoIHRlbXBRdWF0ZXJuaW9uLCBxdWF0ZXJuaW9uWFlaICk7XG5cblx0XHRcdFx0XHRzY29wZS5vYmplY3QucXVhdGVybmlvbi5jb3B5KCB0ZW1wUXVhdGVybmlvbiApO1xuXG5cdFx0XHRcdH0gZWxzZSBpZiAoIHNjb3BlLmF4aXMgPT09IFwiWFlaRVwiICkge1xuXG5cdFx0XHRcdFx0cXVhdGVybmlvbkUuc2V0RnJvbUV1bGVyKCBwb2ludC5jbG9uZSgpLmNyb3NzKCB0ZW1wVmVjdG9yICkubm9ybWFsaXplKCkgKTsgLy8gcm90YXRpb24gYXhpc1xuXG5cdFx0XHRcdFx0dGVtcFF1YXRlcm5pb24uc2V0RnJvbVJvdGF0aW9uTWF0cml4KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIHBhcmVudFJvdGF0aW9uTWF0cml4ICkgKTtcblx0XHRcdFx0XHRxdWF0ZXJuaW9uWC5zZXRGcm9tQXhpc0FuZ2xlKCBxdWF0ZXJuaW9uRSwgLSBwb2ludC5jbG9uZSgpLmFuZ2xlVG8oIHRlbXBWZWN0b3IgKSApO1xuXHRcdFx0XHRcdHF1YXRlcm5pb25YWVouc2V0RnJvbVJvdGF0aW9uTWF0cml4KCB3b3JsZFJvdGF0aW9uTWF0cml4ICk7XG5cblx0XHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblggKTtcblx0XHRcdFx0XHR0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblhZWiApO1xuXG5cdFx0XHRcdFx0c2NvcGUub2JqZWN0LnF1YXRlcm5pb24uY29weSggdGVtcFF1YXRlcm5pb24gKTtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKCBzY29wZS5zcGFjZSA9PT0gXCJsb2NhbFwiICkge1xuXG5cdFx0XHRcdFx0cG9pbnQuYXBwbHlNYXRyaXg0KCB0ZW1wTWF0cml4LmdldEludmVyc2UoIHdvcmxkUm90YXRpb25NYXRyaXggKSApO1xuXG5cdFx0XHRcdFx0dGVtcFZlY3Rvci5hcHBseU1hdHJpeDQoIHRlbXBNYXRyaXguZ2V0SW52ZXJzZSggd29ybGRSb3RhdGlvbk1hdHJpeCApICk7XG5cblx0XHRcdFx0XHRyb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHBvaW50LnosIHBvaW50LnkgKSwgTWF0aC5hdGFuMiggcG9pbnQueCwgcG9pbnQueiApLCBNYXRoLmF0YW4yKCBwb2ludC55LCBwb2ludC54ICkgKTtcblx0XHRcdFx0XHRvZmZzZXRSb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueiwgdGVtcFZlY3Rvci55ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueCwgdGVtcFZlY3Rvci56ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueSwgdGVtcFZlY3Rvci54ICkgKTtcblxuXHRcdFx0XHRcdHF1YXRlcm5pb25YWVouc2V0RnJvbVJvdGF0aW9uTWF0cml4KCBvbGRSb3RhdGlvbk1hdHJpeCApO1xuXG5cdFx0XHRcdFx0aWYgKCBzY29wZS5yb3RhdGlvblNuYXAgIT09IG51bGwgKSB7XG5cblx0XHRcdFx0XHRcdHF1YXRlcm5pb25YLnNldEZyb21BeGlzQW5nbGUoIHVuaXRYLCBNYXRoLnJvdW5kKCAoIHJvdGF0aW9uLnggLSBvZmZzZXRSb3RhdGlvbi54ICkgLyBzY29wZS5yb3RhdGlvblNuYXAgKSAqIHNjb3BlLnJvdGF0aW9uU25hcCApO1xuXHRcdFx0XHRcdFx0cXVhdGVybmlvblkuc2V0RnJvbUF4aXNBbmdsZSggdW5pdFksIE1hdGgucm91bmQoICggcm90YXRpb24ueSAtIG9mZnNldFJvdGF0aW9uLnkgKSAvIHNjb3BlLnJvdGF0aW9uU25hcCApICogc2NvcGUucm90YXRpb25TbmFwICk7XG5cdFx0XHRcdFx0XHRxdWF0ZXJuaW9uWi5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0WiwgTWF0aC5yb3VuZCggKCByb3RhdGlvbi56IC0gb2Zmc2V0Um90YXRpb24ueiApIC8gc2NvcGUucm90YXRpb25TbmFwICkgKiBzY29wZS5yb3RhdGlvblNuYXAgKTtcblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdHF1YXRlcm5pb25YLnNldEZyb21BeGlzQW5nbGUoIHVuaXRYLCByb3RhdGlvbi54IC0gb2Zmc2V0Um90YXRpb24ueCApO1xuXHRcdFx0XHRcdFx0cXVhdGVybmlvblkuc2V0RnJvbUF4aXNBbmdsZSggdW5pdFksIHJvdGF0aW9uLnkgLSBvZmZzZXRSb3RhdGlvbi55ICk7XG5cdFx0XHRcdFx0XHRxdWF0ZXJuaW9uWi5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0Wiwgcm90YXRpb24ueiAtIG9mZnNldFJvdGF0aW9uLnogKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcyA9PT0gXCJYXCIgKSBxdWF0ZXJuaW9uWFlaLm11bHRpcGx5UXVhdGVybmlvbnMoIHF1YXRlcm5pb25YWVosIHF1YXRlcm5pb25YICk7XG5cdFx0XHRcdFx0aWYgKCBzY29wZS5heGlzID09PSBcIllcIiApIHF1YXRlcm5pb25YWVoubXVsdGlwbHlRdWF0ZXJuaW9ucyggcXVhdGVybmlvblhZWiwgcXVhdGVybmlvblkgKTtcblx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMgPT09IFwiWlwiICkgcXVhdGVybmlvblhZWi5tdWx0aXBseVF1YXRlcm5pb25zKCBxdWF0ZXJuaW9uWFlaLCBxdWF0ZXJuaW9uWiApO1xuXG5cdFx0XHRcdFx0c2NvcGUub2JqZWN0LnF1YXRlcm5pb24uY29weSggcXVhdGVybmlvblhZWiApO1xuXG5cdFx0XHRcdH0gZWxzZSBpZiAoIHNjb3BlLnNwYWNlID09PSBcIndvcmxkXCIgKSB7XG5cblx0XHRcdFx0XHRyb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHBvaW50LnosIHBvaW50LnkgKSwgTWF0aC5hdGFuMiggcG9pbnQueCwgcG9pbnQueiApLCBNYXRoLmF0YW4yKCBwb2ludC55LCBwb2ludC54ICkgKTtcblx0XHRcdFx0XHRvZmZzZXRSb3RhdGlvbi5zZXQoIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueiwgdGVtcFZlY3Rvci55ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueCwgdGVtcFZlY3Rvci56ICksIE1hdGguYXRhbjIoIHRlbXBWZWN0b3IueSwgdGVtcFZlY3Rvci54ICkgKTtcblxuXHRcdFx0XHRcdHRlbXBRdWF0ZXJuaW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggdGVtcE1hdHJpeC5nZXRJbnZlcnNlKCBwYXJlbnRSb3RhdGlvbk1hdHJpeCApICk7XG5cblx0XHRcdFx0XHRpZiAoIHNjb3BlLnJvdGF0aW9uU25hcCAhPT0gbnVsbCApIHtcblxuXHRcdFx0XHRcdFx0cXVhdGVybmlvblguc2V0RnJvbUF4aXNBbmdsZSggdW5pdFgsIE1hdGgucm91bmQoICggcm90YXRpb24ueCAtIG9mZnNldFJvdGF0aW9uLnggKSAvIHNjb3BlLnJvdGF0aW9uU25hcCApICogc2NvcGUucm90YXRpb25TbmFwICk7XG5cdFx0XHRcdFx0XHRxdWF0ZXJuaW9uWS5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0WSwgTWF0aC5yb3VuZCggKCByb3RhdGlvbi55IC0gb2Zmc2V0Um90YXRpb24ueSApIC8gc2NvcGUucm90YXRpb25TbmFwICkgKiBzY29wZS5yb3RhdGlvblNuYXAgKTtcblx0XHRcdFx0XHRcdHF1YXRlcm5pb25aLnNldEZyb21BeGlzQW5nbGUoIHVuaXRaLCBNYXRoLnJvdW5kKCAoIHJvdGF0aW9uLnogLSBvZmZzZXRSb3RhdGlvbi56ICkgLyBzY29wZS5yb3RhdGlvblNuYXAgKSAqIHNjb3BlLnJvdGF0aW9uU25hcCApO1xuXG5cdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0cXVhdGVybmlvblguc2V0RnJvbUF4aXNBbmdsZSggdW5pdFgsIHJvdGF0aW9uLnggLSBvZmZzZXRSb3RhdGlvbi54ICk7XG5cdFx0XHRcdFx0XHRxdWF0ZXJuaW9uWS5zZXRGcm9tQXhpc0FuZ2xlKCB1bml0WSwgcm90YXRpb24ueSAtIG9mZnNldFJvdGF0aW9uLnkgKTtcblx0XHRcdFx0XHRcdHF1YXRlcm5pb25aLnNldEZyb21BeGlzQW5nbGUoIHVuaXRaLCByb3RhdGlvbi56IC0gb2Zmc2V0Um90YXRpb24ueiApO1xuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cXVhdGVybmlvblhZWi5zZXRGcm9tUm90YXRpb25NYXRyaXgoIHdvcmxkUm90YXRpb25NYXRyaXggKTtcblxuXHRcdFx0XHRcdGlmICggc2NvcGUuYXhpcyA9PT0gXCJYXCIgKSB0ZW1wUXVhdGVybmlvbi5tdWx0aXBseVF1YXRlcm5pb25zKCB0ZW1wUXVhdGVybmlvbiwgcXVhdGVybmlvblggKTtcblx0XHRcdFx0XHRpZiAoIHNjb3BlLmF4aXMgPT09IFwiWVwiICkgdGVtcFF1YXRlcm5pb24ubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGVtcFF1YXRlcm5pb24sIHF1YXRlcm5pb25ZICk7XG5cdFx0XHRcdFx0aWYgKCBzY29wZS5heGlzID09PSBcIlpcIiApIHRlbXBRdWF0ZXJuaW9uLm11bHRpcGx5UXVhdGVybmlvbnMoIHRlbXBRdWF0ZXJuaW9uLCBxdWF0ZXJuaW9uWiApO1xuXG5cdFx0XHRcdFx0dGVtcFF1YXRlcm5pb24ubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGVtcFF1YXRlcm5pb24sIHF1YXRlcm5pb25YWVogKTtcblxuXHRcdFx0XHRcdHNjb3BlLm9iamVjdC5xdWF0ZXJuaW9uLmNvcHkoIHRlbXBRdWF0ZXJuaW9uICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblx0XHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIG9iamVjdENoYW5nZUV2ZW50ICk7XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvblBvaW50ZXJVcCggZXZlbnQgKSB7XG5cblx0XHRcdGlmICggZXZlbnQuYnV0dG9uICE9PSB1bmRlZmluZWQgJiYgZXZlbnQuYnV0dG9uICE9PSAwICkgcmV0dXJuO1xuXG5cdFx0XHRpZiAoIF9kcmFnZ2luZyAmJiAoIHNjb3BlLmF4aXMgIT09IG51bGwgKSApIHtcblxuXHRcdFx0XHRtb3VzZVVwRXZlbnQubW9kZSA9IF9tb2RlO1xuXHRcdFx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBtb3VzZVVwRXZlbnQgKVxuXG5cdFx0XHR9XG5cblx0XHRcdF9kcmFnZ2luZyA9IGZhbHNlO1xuXHRcdFx0b25Qb2ludGVySG92ZXIoIGV2ZW50ICk7XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpbnRlcnNlY3RPYmplY3RzKCBwb2ludGVyLCBvYmplY3RzICkge1xuXG5cdFx0XHR2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHR2YXIgeCA9ICggcG9pbnRlci5jbGllbnRYIC0gcmVjdC5sZWZ0ICkgLyByZWN0LndpZHRoO1xuXHRcdFx0dmFyIHkgPSAoIHBvaW50ZXIuY2xpZW50WSAtIHJlY3QudG9wICkgLyByZWN0LmhlaWdodDtcblx0XHRcdHBvaW50ZXJWZWN0b3Iuc2V0KCAoIHggKiAyICkgLSAxLCAtICggeSAqIDIgKSArIDEgKTtcblx0XHRcdHJheS5zZXRGcm9tQ2FtZXJhKCBwb2ludGVyVmVjdG9yLCBjYW1lcmEgKTtcblxuXHRcdFx0dmFyIGludGVyc2VjdGlvbnMgPSByYXkuaW50ZXJzZWN0T2JqZWN0cyggb2JqZWN0cywgdHJ1ZSApO1xuXHRcdFx0cmV0dXJuIGludGVyc2VjdGlvbnNbIDAgXSA/IGludGVyc2VjdGlvbnNbIDAgXSA6IGZhbHNlO1xuXG5cdFx0fVxuXG5cdH07XG5cblx0VEhSRUUuVHJhbnNmb3JtQ29udHJvbHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuT2JqZWN0M0QucHJvdG90eXBlICk7XG5cdFRIUkVFLlRyYW5zZm9ybUNvbnRyb2xzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLlRyYW5zZm9ybUNvbnRyb2xzO1xuXG59KCkgKTtcbiIsIi8qKlxuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqL1xuXG52YXIgU29ydGFibGUgPSByZXF1aXJlKCdzb3J0YWJsZWpzJyk7XG5cbnZhciBVSSA9IHt9O1xuXG5VSS5FbGVtZW50ID0gZnVuY3Rpb24gKCBkb20gKSB7XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbn07XG5cblVJLkVsZW1lbnQucHJvdG90eXBlID0ge1xuXG4gIGFkZDogZnVuY3Rpb24gKCkge1xuXG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArKyApIHtcblxuICAgICAgdmFyIGFyZ3VtZW50ID0gYXJndW1lbnRzWyBpIF07XG5cbiAgICAgIGlmICggYXJndW1lbnQgaW5zdGFuY2VvZiBVSS5FbGVtZW50ICkge1xuXG4gICAgICAgIHRoaXMuZG9tLmFwcGVuZENoaWxkKCBhcmd1bWVudC5kb20gKTtcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICBjb25zb2xlLmVycm9yKCAnVUkuRWxlbWVudDonLCBhcmd1bWVudCwgJ2lzIG5vdCBhbiBpbnN0YW5jZSBvZiBVSS5FbGVtZW50LicgKTtcblxuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKysgKSB7XG5cbiAgICAgIHZhciBhcmd1bWVudCA9IGFyZ3VtZW50c1sgaSBdO1xuXG4gICAgICBpZiAoIGFyZ3VtZW50IGluc3RhbmNlb2YgVUkuRWxlbWVudCApIHtcblxuICAgICAgICB0aGlzLmRvbS5yZW1vdmVDaGlsZCggYXJndW1lbnQuZG9tICk7XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgY29uc29sZS5lcnJvciggJ1VJLkVsZW1lbnQ6JywgYXJndW1lbnQsICdpcyBub3QgYW4gaW5zdGFuY2Ugb2YgVUkuRWxlbWVudC4nICk7XG5cbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH0sXG5cbiAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcblxuICAgIHdoaWxlICggdGhpcy5kb20uY2hpbGRyZW4ubGVuZ3RoICkge1xuXG4gICAgICB0aGlzLmRvbS5yZW1vdmVDaGlsZCggdGhpcy5kb20ubGFzdENoaWxkICk7XG5cbiAgICB9XG5cbiAgfSxcblxuICBzZXRJZDogZnVuY3Rpb24gKCBpZCApIHtcblxuICAgIHRoaXMuZG9tLmlkID0gaWQ7XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIGdldElkOiBmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4gdGhpcy5kb20uaWQ7XG5cbiAgfSxcblxuICBzZXRDbGFzczogZnVuY3Rpb24gKCBuYW1lICkge1xuXG4gICAgdGhpcy5kb20uY2xhc3NOYW1lID0gbmFtZTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH0sXG5cbiAgc2V0U3R5bGU6IGZ1bmN0aW9uICggc3R5bGUsIGFycmF5ICkge1xuXG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICsrICkge1xuXG4gICAgICB0aGlzLmRvbS5zdHlsZVsgc3R5bGUgXSA9IGFycmF5WyBpIF07XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdGhpcy5kb20uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuXG4gIH0sXG5cbiAgaGlkZTogZnVuY3Rpb24gKCkge1xuXG4gICAgICB0aGlzLmRvbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG5cbiAgfSxcblxuICBzZXREaXNhYmxlZDogZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuICAgIHRoaXMuZG9tLmRpc2FibGVkID0gdmFsdWU7XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG4gICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSB2YWx1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH1cblxufTtcblxuLy8gcHJvcGVydGllc1xuXG52YXIgcHJvcGVydGllcyA9IFsgJ3Bvc2l0aW9uJywgJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICd3aWR0aCcsICdoZWlnaHQnLCAnYm9yZGVyJywgJ2JvcmRlckxlZnQnLFxuJ2JvcmRlclRvcCcsICdib3JkZXJSaWdodCcsICdib3JkZXJCb3R0b20nLCAnYm9yZGVyQ29sb3InLCAnZGlzcGxheScsICdvdmVyZmxvdycsICdtYXJnaW4nLCAnbWFyZ2luTGVmdCcsICdtYXJnaW5Ub3AnLCAnbWFyZ2luUmlnaHQnLCAnbWFyZ2luQm90dG9tJywgJ3BhZGRpbmcnLCAncGFkZGluZ0xlZnQnLCAncGFkZGluZ1RvcCcsICdwYWRkaW5nUmlnaHQnLCAncGFkZGluZ0JvdHRvbScsICdjb2xvcicsXG4nYmFja2dyb3VuZENvbG9yJywgJ29wYWNpdHknLCAnZm9udFNpemUnLCAnZm9udFdlaWdodCcsICd0ZXh0QWxpZ24nLCAndGV4dERlY29yYXRpb24nLCAndGV4dFRyYW5zZm9ybScsICdjdXJzb3InLCAnekluZGV4JyBdO1xuXG5wcm9wZXJ0aWVzLmZvckVhY2goIGZ1bmN0aW9uICggcHJvcGVydHkgKSB7XG5cbiAgdmFyIG1ldGhvZCA9ICdzZXQnICsgcHJvcGVydHkuc3Vic3RyKCAwLCAxICkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnN1YnN0ciggMSwgcHJvcGVydHkubGVuZ3RoICk7XG5cbiAgVUkuRWxlbWVudC5wcm90b3R5cGVbIG1ldGhvZCBdID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdGhpcy5zZXRTdHlsZSggcHJvcGVydHksIGFyZ3VtZW50cyApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfTtcblxufSApO1xuXG4vLyBldmVudHNcblxudmFyIGV2ZW50cyA9IFsgJ0tleVVwJywgJ0tleURvd24nLCAnTW91c2VPdmVyJywgJ01vdXNlT3V0JywgJ0NsaWNrJywgJ0RibENsaWNrJywgJ0NoYW5nZScgXTtcblxuZXZlbnRzLmZvckVhY2goIGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cbiAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudDtcblxuICBVSS5FbGVtZW50LnByb3RvdHlwZVsgbWV0aG9kIF0gPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkge1xuXG4gICAgdGhpcy5kb20uYWRkRXZlbnRMaXN0ZW5lciggZXZlbnQudG9Mb3dlckNhc2UoKSwgY2FsbGJhY2suYmluZCggdGhpcyApLCBmYWxzZSApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfTtcblxufSApO1xuXG4vLyBTcGFuXG5cblVJLlNwYW4gPSBmdW5jdGlvbiAoKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdGhpcy5kb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuU3Bhbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuU3Bhbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5TcGFuO1xuXG4vLyBEaXZcblxuVUkuRGl2ID0gZnVuY3Rpb24gKCkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHRoaXMuZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuRGl2LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5EaXYucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuRGl2O1xuXG4vLyBSb3dcblxuVUkuUm93ID0gZnVuY3Rpb24gKCkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICBkb20uY2xhc3NOYW1lID0gJ1Jvdyc7XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLlJvdy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuUm93LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLlJvdztcblxuLy8gUGFuZWxcblxuVUkuUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnUGFuZWwnO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5QYW5lbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuUGFuZWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuUGFuZWw7XG5cblxuLy8gQ29sbGFwc2libGUgUGFuZWxcblxuVUkuQ29sbGFwc2libGVQYW5lbCA9IGZ1bmN0aW9uICgpIHtcblxuICBVSS5QYW5lbC5jYWxsKCB0aGlzICk7XG5cbiAgdGhpcy5zZXRDbGFzcyggJ1BhbmVsIENvbGxhcHNpYmxlJyApO1xuXG4gIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgdGhpcy5zdGF0aWMgPSBuZXcgVUkuUGFuZWwoKTtcbiAgdGhpcy5zdGF0aWMuc2V0Q2xhc3MoICdTdGF0aWMnICk7XG4gIHRoaXMuc3RhdGljLm9uQ2xpY2soIGZ1bmN0aW9uICgpIHtcblxuICAgIHNjb3BlLnRvZ2dsZSgpO1xuXG4gIH0gKTtcbiAgdGhpcy5kb20uYXBwZW5kQ2hpbGQoIHRoaXMuc3RhdGljLmRvbSApO1xuXG4gIHRoaXMuY29udGVudHMgPSBuZXcgVUkuUGFuZWwoKTtcbiAgdGhpcy5jb250ZW50cy5zZXRDbGFzcyggJ0NvbnRlbnQnICk7XG4gIHRoaXMuZG9tLmFwcGVuZENoaWxkKCB0aGlzLmNvbnRlbnRzLmRvbSApO1xuXG4gIHZhciBidXR0b24gPSBuZXcgVUkuUGFuZWwoKTtcbiAgYnV0dG9uLnNldENsYXNzKCAnQnV0dG9uJyApO1xuICB0aGlzLnN0YXRpYy5hZGQoIGJ1dHRvbiApO1xuXG4gIHRoaXMuaXNDb2xsYXBzZWQgPSBmYWxzZTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5QYW5lbC5wcm90b3R5cGUgKTtcblVJLkNvbGxhcHNpYmxlUGFuZWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuQ29sbGFwc2libGVQYW5lbDtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUuYWRkU3RhdGljID0gZnVuY3Rpb24gKCkge1xuXG4gIHRoaXMuc3RhdGljLmFkZC5hcHBseSggdGhpcy5zdGF0aWMsIGFyZ3VtZW50cyApO1xuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUucmVtb3ZlU3RhdGljID0gZnVuY3Rpb24gKCkge1xuXG4gIHRoaXMuc3RhdGljLnJlbW92ZS5hcHBseSggdGhpcy5zdGF0aWMsIGFyZ3VtZW50cyApO1xuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUuY2xlYXJTdGF0aWMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgdGhpcy5zdGF0aWMuY2xlYXIoKTtcbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLkNvbGxhcHNpYmxlUGFuZWwucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICgpIHtcblxuICB0aGlzLmNvbnRlbnRzLmFkZC5hcHBseSggdGhpcy5jb250ZW50cywgYXJndW1lbnRzICk7XG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5Db2xsYXBzaWJsZVBhbmVsLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgdGhpcy5jb250ZW50cy5yZW1vdmUuYXBwbHkoIHRoaXMuY29udGVudHMsIGFyZ3VtZW50cyApO1xuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgdGhpcy5jb250ZW50cy5jbGVhcigpO1xuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ29sbGFwc2libGVQYW5lbC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG5cbiAgdGhpcy5zZXRDb2xsYXBzZWQoICEgdGhpcy5pc0NvbGxhcHNlZCApO1xuXG59O1xuXG5VSS5Db2xsYXBzaWJsZVBhbmVsLnByb3RvdHlwZS5jb2xsYXBzZSA9IGZ1bmN0aW9uKCkge1xuXG4gIHRoaXMuc2V0Q29sbGFwc2VkKCB0cnVlICk7XG5cbn07XG5cblVJLkNvbGxhcHNpYmxlUGFuZWwucHJvdG90eXBlLmV4cGFuZCA9IGZ1bmN0aW9uKCkge1xuXG4gIHRoaXMuc2V0Q29sbGFwc2VkKCBmYWxzZSApO1xuXG59O1xuXG5VSS5Db2xsYXBzaWJsZVBhbmVsLnByb3RvdHlwZS5zZXRDb2xsYXBzZWQgPSBmdW5jdGlvbiggYm9vbGVhbiApIHtcblxuICBpZiAoIGJvb2xlYW4gKSB7XG5cbiAgICB0aGlzLmRvbS5jbGFzc0xpc3QuYWRkKCAnY29sbGFwc2VkJyApO1xuXG4gIH0gZWxzZSB7XG5cbiAgICB0aGlzLmRvbS5jbGFzc0xpc3QucmVtb3ZlKCAnY29sbGFwc2VkJyApO1xuXG4gIH1cblxuICB0aGlzLmlzQ29sbGFwc2VkID0gYm9vbGVhbjtcblxuICBpZiAoIHRoaXMub25Db2xsYXBzZWRDaGFuZ2VDYWxsYmFjayAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgdGhpcy5vbkNvbGxhcHNlZENoYW5nZUNhbGxiYWNrKCBib29sZWFuICk7XG5cbiAgfVxuXG59O1xuXG5VSS5Db2xsYXBzaWJsZVBhbmVsLnByb3RvdHlwZS5vbkNvbGxhcHNlZENoYW5nZSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSB7XG5cbiAgdGhpcy5vbkNvbGxhcHNlZENoYW5nZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cbn07XG5cbi8vIFRleHRcblxuVUkuVGV4dCA9IGZ1bmN0aW9uICggdGV4dCApIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnVGV4dCc7XG4gIGRvbS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gIGRvbS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XG4gIGRvbS5zdHlsZS52ZXJ0aWNhbEFsaWduID0gJ21pZGRsZSc7XG5cbiAgdGhpcy5kb20gPSBkb207XG4gIHRoaXMuc2V0VmFsdWUoIHRleHQgKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuVGV4dC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5UZXh0O1xuXG5VSS5UZXh0LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuICByZXR1cm4gdGhpcy5kb20udGV4dENvbnRlbnQ7XG5cbn07XG5cblVJLlRleHQucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuICBpZiAoIHZhbHVlICE9PSB1bmRlZmluZWQgKSB7XG5cbiAgICB0aGlzLmRvbS50ZXh0Q29udGVudCA9IHZhbHVlO1xuXG4gIH1cblxuICByZXR1cm4gdGhpcztcblxufTtcblxuXG4vLyBJbnB1dFxuXG5VSS5JbnB1dCA9IGZ1bmN0aW9uICggdGV4dCApIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnSW5wdXQnO1xuICBkb20uc3R5bGUucGFkZGluZyA9ICcycHgnO1xuICBkb20uc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCB0cmFuc3BhcmVudCc7XG5cbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gIH0sIGZhbHNlICk7XG5cbiAgdGhpcy5kb20gPSBkb207XG4gIHRoaXMuc2V0VmFsdWUoIHRleHQgKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuSW5wdXQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVUkuRWxlbWVudC5wcm90b3R5cGUgKTtcblVJLklucHV0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLklucHV0O1xuXG5VSS5JbnB1dC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgcmV0dXJuIHRoaXMuZG9tLnZhbHVlO1xuXG59O1xuXG5VSS5JbnB1dC5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG4gIHRoaXMuZG9tLnZhbHVlID0gdmFsdWU7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblxuLy8gVGV4dEFyZWFcblxuVUkuVGV4dEFyZWEgPSBmdW5jdGlvbiAoKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIHNjb3BlID0gdGhpcztcblxuICB2YXIgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3RleHRhcmVhJyApO1xuICBkb20uY2xhc3NOYW1lID0gJ1RleHRBcmVhJztcbiAgZG9tLnN0eWxlLnBhZGRpbmcgPSAnMnB4JztcbiAgZG9tLnNwZWxsY2hlY2sgPSBmYWxzZTtcblxuICBkb20uYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICBpZiAoIGV2ZW50LmtleUNvZGUgPT09IDkgKSB7XG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHZhciBjdXJzb3IgPSBkb20uc2VsZWN0aW9uU3RhcnQ7XG5cbiAgICAgIGRvbS52YWx1ZSA9IGRvbS52YWx1ZS5zdWJzdHJpbmcoIDAsIGN1cnNvciApICsgJ1xcdCcgKyBkb20udmFsdWUuc3Vic3RyaW5nKCBjdXJzb3IgKTtcbiAgICAgIGRvbS5zZWxlY3Rpb25TdGFydCA9IGN1cnNvciArIDE7XG4gICAgICBkb20uc2VsZWN0aW9uRW5kID0gZG9tLnNlbGVjdGlvblN0YXJ0O1xuXG4gICAgfVxuXG4gIH0sIGZhbHNlICk7XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLlRleHRBcmVhLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5UZXh0QXJlYS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5UZXh0QXJlYTtcblxuVUkuVGV4dEFyZWEucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gIHJldHVybiB0aGlzLmRvbS52YWx1ZTtcblxufTtcblxuVUkuVGV4dEFyZWEucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuICB0aGlzLmRvbS52YWx1ZSA9IHZhbHVlO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5cbi8vIFNlbGVjdFxuXG5VSS5TZWxlY3QgPSBmdW5jdGlvbiAoKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIHNjb3BlID0gdGhpcztcblxuICB2YXIgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NlbGVjdCcgKTtcbiAgZG9tLmNsYXNzTmFtZSA9ICdTZWxlY3QnO1xuICBkb20uc3R5bGUucGFkZGluZyA9ICcycHgnO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5TZWxlY3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVUkuRWxlbWVudC5wcm90b3R5cGUgKTtcblVJLlNlbGVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5TZWxlY3Q7XG5cblVJLlNlbGVjdC5wcm90b3R5cGUuc2V0TXVsdGlwbGUgPSBmdW5jdGlvbiAoIGJvb2xlYW4gKSB7XG5cbiAgdGhpcy5kb20ubXVsdGlwbGUgPSBib29sZWFuO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5TZWxlY3QucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG5cbiAgdmFyIHNlbGVjdGVkID0gdGhpcy5kb20udmFsdWU7XG5cbiAgd2hpbGUgKCB0aGlzLmRvbS5jaGlsZHJlbi5sZW5ndGggPiAwICkge1xuXG4gICAgdGhpcy5kb20ucmVtb3ZlQ2hpbGQoIHRoaXMuZG9tLmZpcnN0Q2hpbGQgKTtcblxuICB9XG5cbiAgZm9yICggdmFyIGtleSBpbiBvcHRpb25zICkge1xuXG4gICAgdmFyIG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdvcHRpb24nICk7XG4gICAgb3B0aW9uLnZhbHVlID0ga2V5O1xuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBvcHRpb25zWyBrZXkgXTtcbiAgICB0aGlzLmRvbS5hcHBlbmRDaGlsZCggb3B0aW9uICk7XG5cbiAgfVxuXG4gIHRoaXMuZG9tLnZhbHVlID0gc2VsZWN0ZWQ7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLlNlbGVjdC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgcmV0dXJuIHRoaXMuZG9tLnZhbHVlO1xuXG59O1xuXG5VSS5TZWxlY3QucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuICB2YWx1ZSA9IFN0cmluZyggdmFsdWUgKTtcblxuICBpZiAoIHRoaXMuZG9tLnZhbHVlICE9PSB2YWx1ZSApIHtcblxuICAgIHRoaXMuZG9tLnZhbHVlID0gdmFsdWU7XG5cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG4vLyBDaGVja2JveFxuXG5VSS5DaGVja2JveCA9IGZ1bmN0aW9uICggYm9vbGVhbiApIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnQ2hlY2tib3gnO1xuICBkb20udHlwZSA9ICdjaGVja2JveCc7XG5cbiAgdGhpcy5kb20gPSBkb207XG4gIHRoaXMuc2V0VmFsdWUoIGJvb2xlYW4gKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuQ2hlY2tib3gucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVUkuRWxlbWVudC5wcm90b3R5cGUgKTtcblVJLkNoZWNrYm94LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLkNoZWNrYm94O1xuXG5VSS5DaGVja2JveC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgcmV0dXJuIHRoaXMuZG9tLmNoZWNrZWQ7XG5cbn07XG5cblVJLkNoZWNrYm94LnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgaWYgKCB2YWx1ZSAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgdGhpcy5kb20uY2hlY2tlZCA9IHZhbHVlO1xuXG4gIH1cblxuICByZXR1cm4gdGhpcztcblxufTtcblxuXG4vLyBDb2xvclxuXG5VSS5Db2xvciA9IGZ1bmN0aW9uICgpIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnQ29sb3InO1xuICBkb20uc3R5bGUud2lkdGggPSAnNjRweCc7XG4gIGRvbS5zdHlsZS5oZWlnaHQgPSAnMTdweCc7XG4gIGRvbS5zdHlsZS5ib3JkZXIgPSAnMHB4JztcbiAgZG9tLnN0eWxlLnBhZGRpbmcgPSAnMnB4JztcbiAgZG9tLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG5cbiAgdHJ5IHtcblxuICAgIGRvbS50eXBlID0gJ2NvbG9yJztcbiAgICBkb20udmFsdWUgPSAnI2ZmZmZmZic7XG5cbiAgfSBjYXRjaCAoIGV4Y2VwdGlvbiApIHt9XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLkNvbG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5Db2xvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5Db2xvcjtcblxuVUkuQ29sb3IucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gIHJldHVybiB0aGlzLmRvbS52YWx1ZTtcblxufTtcblxuVUkuQ29sb3IucHJvdG90eXBlLmdldEhleFZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gIHJldHVybiBwYXJzZUludCggdGhpcy5kb20udmFsdWUuc3Vic3RyKCAxICksIDE2ICk7XG5cbn07XG5cblVJLkNvbG9yLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgaWYgKCB2YWx1ZS5sZW5ndGggPT09IDQgKSB7XG4gICAgdmFsdWUgPSAnIycgKyB2YWx1ZVsgMSBdICsgdmFsdWVbIDEgXSArIHZhbHVlWyAyIF0gKyB2YWx1ZVsgMiBdICsgdmFsdWVbIDMgXSArIHZhbHVlWyAzIF07XG4gIH1cblxuICB0aGlzLmRvbS52YWx1ZSA9IHZhbHVlO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5Db2xvci5wcm90b3R5cGUuc2V0SGV4VmFsdWUgPSBmdW5jdGlvbiAoIGhleCApIHtcblxuICB0aGlzLmRvbS52YWx1ZSA9ICcjJyArICggJzAwMDAwMCcgKyBoZXgudG9TdHJpbmcoIDE2ICkgKS5zbGljZSggLSA2ICk7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblxuLy8gTnVtYmVyXG5cblVJLk51bWJlciA9IGZ1bmN0aW9uICggbnVtYmVyICkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbnB1dCcgKTtcbiAgZG9tLmNsYXNzTmFtZSA9ICdOdW1iZXInO1xuICBkb20udmFsdWUgPSAnMC4wMCc7XG5cbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKCBldmVudC5rZXlDb2RlID09PSAxMyApIGRvbS5ibHVyKCk7XG5cbiAgfSwgZmFsc2UgKTtcblxuICB0aGlzLnZhbHVlID0gMDtcblxuICB0aGlzLm1pbiA9IC0gSW5maW5pdHk7XG4gIHRoaXMubWF4ID0gSW5maW5pdHk7XG5cbiAgdGhpcy5wcmVjaXNpb24gPSAyO1xuICB0aGlzLnN0ZXAgPSAxO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHRoaXMuc2V0VmFsdWUoIG51bWJlciApO1xuXG4gIHZhciBjaGFuZ2VFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCAnSFRNTEV2ZW50cycgKTtcbiAgY2hhbmdlRXZlbnQuaW5pdEV2ZW50KCAnY2hhbmdlJywgdHJ1ZSwgdHJ1ZSApO1xuXG4gIHZhciBkaXN0YW5jZSA9IDA7XG4gIHZhciBvbk1vdXNlRG93blZhbHVlID0gMDtcblxuICB2YXIgcG9pbnRlciA9IFsgMCwgMCBdO1xuICB2YXIgcHJldlBvaW50ZXIgPSBbIDAsIDAgXTtcblxuICBmdW5jdGlvbiBvbk1vdXNlRG93biggZXZlbnQgKSB7XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgZGlzdGFuY2UgPSAwO1xuXG4gICAgb25Nb3VzZURvd25WYWx1ZSA9IHNjb3BlLnZhbHVlO1xuXG4gICAgcHJldlBvaW50ZXIgPSBbIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgXTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZU1vdmUoIGV2ZW50ICkge1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IHNjb3BlLnZhbHVlO1xuXG4gICAgcG9pbnRlciA9IFsgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSBdO1xuXG4gICAgZGlzdGFuY2UgKz0gKCBwb2ludGVyWyAwIF0gLSBwcmV2UG9pbnRlclsgMCBdICkgLSAoIHBvaW50ZXJbIDEgXSAtIHByZXZQb2ludGVyWyAxIF0gKTtcblxuICAgIHZhciB2YWx1ZSA9IG9uTW91c2VEb3duVmFsdWUgKyAoIGRpc3RhbmNlIC8gKCBldmVudC5zaGlmdEtleSA/IDUgOiA1MCApICkgKiBzY29wZS5zdGVwO1xuICAgIHZhbHVlID0gTWF0aC5taW4oIHNjb3BlLm1heCwgTWF0aC5tYXgoIHNjb3BlLm1pbiwgdmFsdWUgKSApO1xuXG4gICAgaWYgKCBjdXJyZW50VmFsdWUgIT09IHZhbHVlICkge1xuXG4gICAgICBzY29wZS5zZXRWYWx1ZSggdmFsdWUgKTtcbiAgICAgIGRvbS5kaXNwYXRjaEV2ZW50KCBjaGFuZ2VFdmVudCApO1xuXG4gICAgfVxuXG4gICAgcHJldlBvaW50ZXIgPSBbIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgXTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZVVwKCBldmVudCApIHtcblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblxuICAgIGlmICggTWF0aC5hYnMoIGRpc3RhbmNlICkgPCAyICkge1xuXG4gICAgICBkb20uZm9jdXMoKTtcbiAgICAgIGRvbS5zZWxlY3QoKTtcblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoIGV2ZW50ICkge1xuXG4gICAgdmFyIHZhbHVlID0gMDtcblxuICAgIHRyeSB7XG5cbiAgICAgIHZhbHVlID0gZXZhbCggZG9tLnZhbHVlICk7XG5cbiAgICB9IGNhdGNoICggZXJyb3IgKSB7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoIGVycm9yLm1lc3NhZ2UgKTtcblxuICAgIH1cblxuICAgIHNjb3BlLnNldFZhbHVlKCBwYXJzZUZsb2F0KCB2YWx1ZSApICk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRm9jdXMoIGV2ZW50ICkge1xuXG4gICAgZG9tLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgIGRvbS5zdHlsZS5jdXJzb3IgPSAnJztcblxuICB9XG5cbiAgZnVuY3Rpb24gb25CbHVyKCBldmVudCApIHtcblxuICAgIGRvbS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGRvbS5zdHlsZS5jdXJzb3IgPSAnY29sLXJlc2l6ZSc7XG5cbiAgfVxuXG4gIG9uQmx1cigpO1xuXG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgb25Nb3VzZURvd24sIGZhbHNlICk7XG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAnY2hhbmdlJywgb25DaGFuZ2UsIGZhbHNlICk7XG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAnZm9jdXMnLCBvbkZvY3VzLCBmYWxzZSApO1xuICBkb20uYWRkRXZlbnRMaXN0ZW5lciggJ2JsdXInLCBvbkJsdXIsIGZhbHNlICk7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLk51bWJlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuTnVtYmVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLk51bWJlcjtcblxuVUkuTnVtYmVyLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuICByZXR1cm4gdGhpcy52YWx1ZTtcblxufTtcblxuVUkuTnVtYmVyLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgaWYgKCB2YWx1ZSAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPCB0aGlzLm1pbilcbiAgICAgIHZhbHVlID0gdGhpcy5taW47XG4gICAgaWYgKHZhbHVlID4gdGhpcy5tYXgpXG4gICAgICB2YWx1ZSA9IHRoaXMubWF4O1xuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuZG9tLnZhbHVlID0gdmFsdWUudG9GaXhlZCggdGhpcy5wcmVjaXNpb24gKTtcblxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLk51bWJlci5wcm90b3R5cGUuc2V0UmFuZ2UgPSBmdW5jdGlvbiAoIG1pbiwgbWF4ICkge1xuXG4gIHRoaXMubWluID0gbWluO1xuICB0aGlzLm1heCA9IG1heDtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuTnVtYmVyLnByb3RvdHlwZS5zZXRQcmVjaXNpb24gPSBmdW5jdGlvbiAoIHByZWNpc2lvbiApIHtcblxuICB0aGlzLnByZWNpc2lvbiA9IHByZWNpc2lvbjtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuXG4vLyBJbnRlZ2VyXG5cblVJLkludGVnZXIgPSBmdW5jdGlvbiAoIG51bWJlciApIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnTnVtYmVyJztcbiAgZG9tLnZhbHVlID0gJzAnO1xuXG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICB9LCBmYWxzZSApO1xuXG4gIHRoaXMudmFsdWUgPSAwO1xuXG4gIHRoaXMubWluID0gLSBJbmZpbml0eTtcbiAgdGhpcy5tYXggPSBJbmZpbml0eTtcblxuICB0aGlzLnN0ZXAgPSAxO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHRoaXMuc2V0VmFsdWUoIG51bWJlciApO1xuXG4gIHZhciBjaGFuZ2VFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCAnSFRNTEV2ZW50cycgKTtcbiAgY2hhbmdlRXZlbnQuaW5pdEV2ZW50KCAnY2hhbmdlJywgdHJ1ZSwgdHJ1ZSApO1xuXG4gIHZhciBkaXN0YW5jZSA9IDA7XG4gIHZhciBvbk1vdXNlRG93blZhbHVlID0gMDtcblxuICB2YXIgcG9pbnRlciA9IFsgMCwgMCBdO1xuICB2YXIgcHJldlBvaW50ZXIgPSBbIDAsIDAgXTtcblxuICBmdW5jdGlvbiBvbk1vdXNlRG93biggZXZlbnQgKSB7XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgZGlzdGFuY2UgPSAwO1xuXG4gICAgb25Nb3VzZURvd25WYWx1ZSA9IHNjb3BlLnZhbHVlO1xuXG4gICAgcHJldlBvaW50ZXIgPSBbIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgXTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZU1vdmUoIGV2ZW50ICkge1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IHNjb3BlLnZhbHVlO1xuXG4gICAgcG9pbnRlciA9IFsgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSBdO1xuXG4gICAgZGlzdGFuY2UgKz0gKCBwb2ludGVyWyAwIF0gLSBwcmV2UG9pbnRlclsgMCBdICkgLSAoIHBvaW50ZXJbIDEgXSAtIHByZXZQb2ludGVyWyAxIF0gKTtcblxuICAgIHZhciB2YWx1ZSA9IG9uTW91c2VEb3duVmFsdWUgKyAoIGRpc3RhbmNlIC8gKCBldmVudC5zaGlmdEtleSA/IDUgOiA1MCApICkgKiBzY29wZS5zdGVwO1xuICAgIHZhbHVlID0gTWF0aC5taW4oIHNjb3BlLm1heCwgTWF0aC5tYXgoIHNjb3BlLm1pbiwgdmFsdWUgKSApIHwgMDtcblxuICAgIGlmICggY3VycmVudFZhbHVlICE9PSB2YWx1ZSApIHtcblxuICAgICAgc2NvcGUuc2V0VmFsdWUoIHZhbHVlICk7XG4gICAgICBkb20uZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuICAgIH1cblxuICAgIHByZXZQb2ludGVyID0gWyBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZIF07XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcCggZXZlbnQgKSB7XG5cbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlICk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNldXAnLCBvbk1vdXNlVXAsIGZhbHNlICk7XG5cbiAgICBpZiAoIE1hdGguYWJzKCBkaXN0YW5jZSApIDwgMiApIHtcblxuICAgICAgZG9tLmZvY3VzKCk7XG4gICAgICBkb20uc2VsZWN0KCk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKCBldmVudCApIHtcblxuICAgIHZhciB2YWx1ZSA9IDA7XG5cbiAgICB0cnkge1xuXG4gICAgICB2YWx1ZSA9IGV2YWwoIGRvbS52YWx1ZSApO1xuXG4gICAgfSBjYXRjaCAoIGVycm9yICkge1xuXG4gICAgICBjb25zb2xlLmVycm9yKCBlcnJvci5tZXNzYWdlICk7XG5cbiAgICB9XG5cbiAgICBzY29wZS5zZXRWYWx1ZSggdmFsdWUgKTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Gb2N1cyggZXZlbnQgKSB7XG5cbiAgICBkb20uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgZG9tLnN0eWxlLmN1cnNvciA9ICcnO1xuXG4gIH1cblxuICBmdW5jdGlvbiBvbkJsdXIoIGV2ZW50ICkge1xuXG4gICAgZG9tLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgZG9tLnN0eWxlLmN1cnNvciA9ICdjb2wtcmVzaXplJztcblxuICB9XG5cbiAgb25CbHVyKCk7XG5cbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBvbk1vdXNlRG93biwgZmFsc2UgKTtcbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdjaGFuZ2UnLCBvbkNoYW5nZSwgZmFsc2UgKTtcbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdmb2N1cycsIG9uRm9jdXMsIGZhbHNlICk7XG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAnYmx1cicsIG9uQmx1ciwgZmFsc2UgKTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuVUkuSW50ZWdlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuSW50ZWdlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5JbnRlZ2VyO1xuXG5VSS5JbnRlZ2VyLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuICByZXR1cm4gdGhpcy52YWx1ZTtcblxufTtcblxuVUkuSW50ZWdlci5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG4gIGlmICggdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZSB8IDA7XG4gICAgdGhpcy5kb20udmFsdWUgPSB2YWx1ZSB8IDA7XG5cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5JbnRlZ2VyLnByb3RvdHlwZS5zZXRSYW5nZSA9IGZ1bmN0aW9uICggbWluLCBtYXggKSB7XG5cbiAgdGhpcy5taW4gPSBtaW47XG4gIHRoaXMubWF4ID0gbWF4O1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5cbi8vIEJyZWFrXG5cblVJLkJyZWFrID0gZnVuY3Rpb24gKCkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnYnInICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnQnJlYWsnO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5CcmVhay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuQnJlYWsucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuQnJlYWs7XG5cblxuLy8gSG9yaXpvbnRhbFJ1bGVcblxuVUkuSG9yaXpvbnRhbFJ1bGUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdocicgKTtcbiAgZG9tLmNsYXNzTmFtZSA9ICdIb3Jpem9udGFsUnVsZSc7XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLkhvcml6b250YWxSdWxlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5Ib3Jpem9udGFsUnVsZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5Ib3Jpem9udGFsUnVsZTtcblxuXG4vLyBCdXR0b25cblxuVUkuQnV0dG9uID0gZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuICBVSS5FbGVtZW50LmNhbGwoIHRoaXMgKTtcblxuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnYnV0dG9uJyApO1xuICBkb20uY2xhc3NOYW1lID0gJ0J1dHRvbic7XG5cbiAgdGhpcy5kb20gPSBkb207XG4gIHRoaXMuZG9tLnRleHRDb250ZW50ID0gdmFsdWU7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLkJ1dHRvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuQnV0dG9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLkJ1dHRvbjtcblxuVUkuQnV0dG9uLnByb3RvdHlwZS5zZXRMYWJlbCA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgdGhpcy5kb20udGV4dENvbnRlbnQgPSB2YWx1ZTtcblxuICByZXR1cm4gdGhpcztcblxufTtcblxuXG4vLyBNb2RhbFxuXG5VSS5Nb2RhbCA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgdmFyIHNjb3BlID0gdGhpcztcblxuICB2YXIgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblxuICBkb20uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBkb20uc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGRvbS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gIGRvbS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgwLDAsMCwwLjUpJztcbiAgZG9tLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGRvbS5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gIGRvbS5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICBkb20uYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIC8vc2NvcGUuaGlkZSgpO1xuXG4gIH0gKTtcblxuICB0aGlzLmRvbSA9IGRvbTtcblxuICB0aGlzLmNvbnRhaW5lciA9IG5ldyBVSS5QYW5lbCgpO1xuICB0aGlzLmNvbnRhaW5lci5kb20uc3R5bGUud2lkdGggPSAnNjAwcHgnO1xuICB0aGlzLmNvbnRhaW5lci5kb20uc3R5bGUuaGVpZ2h0ID0gJzYwMHB4JztcbiAgdGhpcy5jb250YWluZXIuZG9tLnN0eWxlLm92ZXJmbG93ID0gJ2F1dG8nO1xuXG4gIHRoaXMuY29udGFpbmVyLmRvbS5zdHlsZS5wYWRkaW5nID0gJzIwcHgnO1xuICB0aGlzLmNvbnRhaW5lci5kb20uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmZmZmZmYnO1xuICB0aGlzLmNvbnRhaW5lci5kb20uc3R5bGUuYm94U2hhZG93ID0gJzBweCA1cHggMTBweCByZ2JhKDAsMCwwLDAuNSknO1xuXG4gIHRoaXMuYWRkKCB0aGlzLmNvbnRhaW5lciApO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5Nb2RhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5FbGVtZW50LnByb3RvdHlwZSApO1xuVUkuTW9kYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuTW9kYWw7XG5cblVJLk1vZGFsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCBjb250ZW50ICkge1xuXG4gIHRoaXMuY29udGFpbmVyLmNsZWFyKCk7XG4gIHRoaXMuY29udGFpbmVyLmFkZCggY29udGVudCApO1xuXG4gIHRoaXMuZG9tLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLk1vZGFsLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuXG4gIHRoaXMuZG9tLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLkNvbnRleHRNZW51ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ25hdicgKTtcbiAgbmF2LmNsYXNzTmFtZSA9ICdjb250ZXh0LW1lbnUnO1xuICB2YXIgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICB1bC5jbGFzc05hbWUgPSAnY29udGV4dC1tZW51X19pdGVtcyc7XG4gIG5hdi5hcHBlbmRDaGlsZCh1bCk7XG5cbiAgZnVuY3Rpb24gYWRkT3B0aW9uKHRleHQsIG9uQ2xpY2spIHtcblxuICB9XG4vKlxuPG5hdiBpZD1cImNvbnRleHQtbWVudVwiIGNsYXNzPVwiY29udGV4dC1tZW51XCI+XG4gICAgPHVsIGNsYXNzPVwiY29udGV4dC1tZW51X19pdGVtc1wiPlxuICAgICAgPGxpIGNsYXNzPVwiY29udGV4dC1tZW51X19pdGVtXCI+XG4gICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJjb250ZXh0LW1lbnVfX2xpbmtcIiBkYXRhLWFjdGlvbj1cIlZpZXdcIj48aSBjbGFzcz1cImZhIGZhLWV5ZVwiPjwvaT4gVmlldyBUYXNrPC9hPlxuICAgICAgPC9saT5cbiAgICAgIDxsaSBjbGFzcz1cImNvbnRleHQtbWVudV9faXRlbVwiPlxuICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwiY29udGV4dC1tZW51X19saW5rXCIgZGF0YS1hY3Rpb249XCJFZGl0XCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0XCI+PC9pPiBFZGl0IFRhc2s8L2E+XG4gICAgICA8L2xpPlxuICAgICAgPGxpIGNsYXNzPVwiY29udGV4dC1tZW51X19pdGVtXCI+XG4gICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJjb250ZXh0LW1lbnVfX2xpbmtcIiBkYXRhLWFjdGlvbj1cIkRlbGV0ZVwiPjxpIGNsYXNzPVwiZmEgZmEtdGltZXNcIj48L2k+IERlbGV0ZSBUYXNrPC9hPlxuICAgICAgPC9saT5cbiAgICA8L3VsPlxuICA8L25hdj5cbiovXG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIHNjb3BlID0gdGhpcztcblxuICB2YXIgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2J1dHRvbicgKTtcbiAgZG9tLmNsYXNzTmFtZSA9ICdCdXR0b24nO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuICB0aGlzLmRvbS50ZXh0Q29udGVudCA9IHZhbHVlO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5CdXR0b24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVUkuRWxlbWVudC5wcm90b3R5cGUgKTtcblVJLkJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5CdXR0b247XG5cblVJLkJ1dHRvbi5wcm90b3R5cGUuc2V0TGFiZWwgPSBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG4gIHRoaXMuZG9tLnRleHRDb250ZW50ID0gdmFsdWU7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblxuLy8gLS0tLS0gVUkuVEhSRUVKU1xuXG4vLyBPdXRsaW5lclxuXG5VSS5PdXRsaW5lciA9IGZ1bmN0aW9uICggZWRpdG9yICkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnT3V0bGluZXInO1xuICBkb20udGFiSW5kZXggPSAwOyAvLyBrZXl1cCBldmVudCBpcyBpZ25vcmVkIHdpdGhvdXQgc2V0dGluZyB0YWJJbmRleFxuXG4gIHZhciBzY2VuZSA9IGVkaXRvci5zY2VuZTtcblxuICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoIGRvbSwge1xuICAgIGRyYWdnYWJsZTogJy5kcmFnZ2FibGUnLFxuICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXG4gICAgICB2YXIgaXRlbSA9IGV2ZW50Lml0ZW07XG5cbiAgICAgIHZhciBvYmplY3QgPSBzY2VuZS5nZXRPYmplY3RCeUlkKCBpdGVtLnZhbHVlICk7XG5cbiAgICAgIGlmICggaXRlbS5uZXh0U2libGluZyA9PT0gbnVsbCApIHtcblxuICAgICAgICBlZGl0b3IuZXhlY3V0ZSggbmV3IE1vdmVPYmplY3RDb21tYW5kKCBvYmplY3QsIGVkaXRvci5zY2VuZSApICk7XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG5leHRPYmplY3QgPSBzY2VuZS5nZXRPYmplY3RCeUlkKCBpdGVtLm5leHRTaWJsaW5nLnZhbHVlICk7XG4gICAgICAgIGVkaXRvci5leGVjdXRlKCBuZXcgTW92ZU9iamVjdENvbW1hbmQoIG9iamVjdCwgbmV4dE9iamVjdC5wYXJlbnQsIG5leHRPYmplY3QgKSApO1xuXG4gICAgICB9XG5cbiAgICB9XG4gIH0gKTtcblxuICAvLyBCcm9hZGNhc3QgZm9yIG9iamVjdCBzZWxlY3Rpb24gYWZ0ZXIgYXJyb3cgbmF2aWdhdGlvblxuICB2YXIgY2hhbmdlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0hUTUxFdmVudHMnICk7XG4gIGNoYW5nZUV2ZW50LmluaXRFdmVudCggJ2NoYW5nZScsIHRydWUsIHRydWUgKTtcblxuICAvLyBQcmV2ZW50IG5hdGl2ZSBzY3JvbGwgYmVoYXZpb3JcbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gIH0sIGZhbHNlICk7XG5cbiAgLy8gS2V5YmluZGluZ3MgdG8gc3VwcG9ydCBhcnJvdyBuYXZpZ2F0aW9uXG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKCAna2V5dXAnLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXG4gICAgZnVuY3Rpb24gc2VsZWN0KCBpbmRleCApIHtcblxuICAgICAgaWYgKCBpbmRleCA+PSAwICYmIGluZGV4IDwgc2NvcGUub3B0aW9ucy5sZW5ndGggKSB7XG5cbiAgICAgICAgc2NvcGUuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuXG4gICAgICAgIC8vIEhpZ2hsaWdodCBzZWxlY3RlZCBkb20gZWxlbSBhbmQgc2Nyb2xsIHBhcmVudCBpZiBuZWVkZWRcbiAgICAgICAgc2NvcGUuc2V0VmFsdWUoIHNjb3BlLm9wdGlvbnNbIGluZGV4IF0udmFsdWUgKTtcbiAgICAgICAgc2NvcGUuZG9tLmRpc3BhdGNoRXZlbnQoIGNoYW5nZUV2ZW50ICk7XG5cbiAgICAgIH1cblxuICAgIH1cblxuICAgIHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICBzZWxlY3QoIHNjb3BlLnNlbGVjdGVkSW5kZXggLSAxICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICBzZWxlY3QoIHNjb3BlLnNlbGVjdGVkSW5kZXggKyAxICk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICB9LCBmYWxzZSApO1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuXG4gIHRoaXMub3B0aW9ucyA9IFtdO1xuICB0aGlzLnNlbGVjdGVkSW5kZXggPSAtIDE7XG4gIHRoaXMuc2VsZWN0ZWRWYWx1ZSA9IG51bGw7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbn07XG5cblVJLk91dGxpbmVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5PdXRsaW5lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5PdXRsaW5lcjtcblxuVUkuT3V0bGluZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG5cbiAgdmFyIHNjb3BlID0gdGhpcztcblxuICB2YXIgY2hhbmdlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0hUTUxFdmVudHMnICk7XG4gIGNoYW5nZUV2ZW50LmluaXRFdmVudCggJ2NoYW5nZScsIHRydWUsIHRydWUgKTtcblxuICB3aGlsZSAoIHNjb3BlLmRvbS5jaGlsZHJlbi5sZW5ndGggPiAwICkge1xuXG4gICAgc2NvcGUuZG9tLnJlbW92ZUNoaWxkKCBzY29wZS5kb20uZmlyc3RDaGlsZCApO1xuXG4gIH1cblxuICBzY29wZS5vcHRpb25zID0gW107XG5cbiAgZm9yICggdmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkgKysgKSB7XG5cbiAgICB2YXIgb3B0aW9uID0gb3B0aW9uc1sgaSBdO1xuXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gICAgZGl2LmNsYXNzTmFtZSA9ICdvcHRpb24gJyArICggb3B0aW9uLnN0YXRpYyA9PT0gdHJ1ZSA/ICcnIDogJ2RyYWdnYWJsZScgKTtcbiAgICBkaXYuaW5uZXJIVE1MID0gb3B0aW9uLmh0bWw7XG4gICAgZGl2LnZhbHVlID0gb3B0aW9uLnZhbHVlO1xuICAgIHNjb3BlLmRvbS5hcHBlbmRDaGlsZCggZGl2ICk7XG5cbiAgICBzY29wZS5vcHRpb25zLnB1c2goIGRpdiApO1xuXG4gICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cbiAgICAgIHNjb3BlLnNldFZhbHVlKCB0aGlzLnZhbHVlICk7XG4gICAgICBzY29wZS5kb20uZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuICAgIH0sIGZhbHNlICk7XG5cbiAgfVxuXG4gIHJldHVybiBzY29wZTtcblxufTtcblxuVUkuT3V0bGluZXIucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gIHJldHVybiB0aGlzLnNlbGVjdGVkVmFsdWU7XG5cbn07XG5cblVJLk91dGxpbmVyLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaSArKyApIHtcblxuICAgIHZhciBlbGVtZW50ID0gdGhpcy5vcHRpb25zWyBpIF07XG5cbiAgICBpZiAoIGVsZW1lbnQudmFsdWUgPT09IHZhbHVlICkge1xuXG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoICdhY3RpdmUnICk7XG5cbiAgICAgIC8vIHNjcm9sbCBpbnRvIHZpZXdcblxuICAgICAgdmFyIHkgPSBlbGVtZW50Lm9mZnNldFRvcCAtIHRoaXMuZG9tLm9mZnNldFRvcDtcbiAgICAgIHZhciBib3R0b21ZID0geSArIGVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgICAgdmFyIG1pblNjcm9sbCA9IGJvdHRvbVkgLSB0aGlzLmRvbS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgIGlmICggdGhpcy5kb20uc2Nyb2xsVG9wID4geSApIHtcblxuICAgICAgICB0aGlzLmRvbS5zY3JvbGxUb3AgPSB5O1xuXG4gICAgICB9IGVsc2UgaWYgKCB0aGlzLmRvbS5zY3JvbGxUb3AgPCBtaW5TY3JvbGwgKSB7XG5cbiAgICAgICAgdGhpcy5kb20uc2Nyb2xsVG9wID0gbWluU2Nyb2xsO1xuXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdhY3RpdmUnICk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIHRoaXMuc2VsZWN0ZWRWYWx1ZSA9IHZhbHVlO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5USFJFRSA9IHt9O1xuXG5VSS5USFJFRS5Cb29sZWFuID0gZnVuY3Rpb24gKCBib29sZWFuLCB0ZXh0ICkge1xuXG4gIFVJLlNwYW4uY2FsbCggdGhpcyApO1xuXG4gIHRoaXMuc2V0TWFyZ2luUmlnaHQoICcxMHB4JyApO1xuXG4gIHRoaXMuY2hlY2tib3ggPSBuZXcgVUkuQ2hlY2tib3goIGJvb2xlYW4gKTtcbiAgdGhpcy50ZXh0ID0gbmV3IFVJLlRleHQoIHRleHQgKS5zZXRNYXJnaW5MZWZ0KCAnM3B4JyApO1xuXG4gIHRoaXMuYWRkKCB0aGlzLmNoZWNrYm94ICk7XG4gIHRoaXMuYWRkKCB0aGlzLnRleHQgKTtcblxufTtcblxuVUkuVEhSRUUuQm9vbGVhbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBVSS5TcGFuLnByb3RvdHlwZSApO1xuVUkuVEhSRUUuQm9vbGVhbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSS5USFJFRS5Cb29sZWFuO1xuXG5VSS5USFJFRS5Cb29sZWFuLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuICByZXR1cm4gdGhpcy5jaGVja2JveC5nZXRWYWx1ZSgpO1xuXG59O1xuXG5VSS5USFJFRS5Cb29sZWFuLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cbiAgcmV0dXJuIHRoaXMuY2hlY2tib3guc2V0VmFsdWUoIHZhbHVlICk7XG5cbn07XG5cblVJLlZlY3RvcjMgPSBmdW5jdGlvbiAoIHZlY3RvcjMgKSB7XG5cbiAgVUkuRWxlbWVudC5jYWxsKCB0aGlzICk7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gIGRvbS5jbGFzc05hbWUgPSAnUm93JztcblxuICB0aGlzLmRvbSA9IGRvbTtcblxuICB2YXIgc2NvcGU9dGhpcztcblxuICB0aGlzLnZlY3Rvcj17XG4gICAgJ3gnOiBuZXcgVUkuTnVtYmVyKCkuc2V0V2lkdGgoJzUwcHgnKSxcbiAgICAneSc6IG5ldyBVSS5OdW1iZXIoKS5zZXRXaWR0aCgnNTBweCcpLFxuICAgICd6JzogbmV3IFVJLk51bWJlcigpLnNldFdpZHRoKCc1MHB4JyksXG4gIH1cblxuICB0aGlzLmFkZCh0aGlzLnZlY3RvclsneCddICx0aGlzLnZlY3RvclsneSddICx0aGlzLnZlY3RvclsneiddKTtcbn07XG5cblVJLlZlY3RvcjMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVUkuRWxlbWVudC5wcm90b3R5cGUgKTtcblVJLlZlY3RvcjMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUkuVmVjdG9yMztcblxuVUkuVmVjdG9yMy5wcm90b3R5cGUuc2V0V2lkdGg9ZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5VSS5WZWN0b3IzLnByb3RvdHlwZS5zZXRWYWx1ZT1mdW5jdGlvbih2YWx1ZSkge1xuICBmb3IgKHZhciB2YWwgaW4gdmFsdWUpIHtcbiAgICB0aGlzLnZlY3Rvclt2YWxdLnNldFZhbHVlKHZhbHVlW3ZhbF0pO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuVUkuVmVjdG9yMy5wcm90b3R5cGUuZ2V0VmFsdWU9ZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgJ3gnOiB0aGlzLnZlY3RvclsneCddLmdldFZhbHVlKCksXG4gICAgJ3knOiB0aGlzLnZlY3RvclsneSddLmdldFZhbHVlKCksXG4gICAgJ3onOiB0aGlzLnZlY3RvclsneiddLmdldFZhbHVlKClcbiAgfVxufVxuXG5cblxuVUkuTWFwID0gZnVuY3Rpb24gKCB2ZWN0b3IzICkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICBkb20uY2xhc3NOYW1lID0gJ1Jvdyc7XG5cbiAgdGhpcy5kb20gPSBkb207XG5cbiAgdmFyIHNjb3BlPXRoaXM7XG5cbiAgdGhpcy52ZWN0b3I9e1xuICAgICd4JzogbmV3IFVJLk51bWJlcigpLnNldFdpZHRoKCc1MHB4JyksXG4gICAgJ3knOiBuZXcgVUkuTnVtYmVyKCkuc2V0V2lkdGgoJzUwcHgnKSxcbiAgICAneic6IG5ldyBVSS5OdW1iZXIoKS5zZXRXaWR0aCgnNTBweCcpLFxuICB9XG5cbiAgdGhpcy5hZGQodGhpcy52ZWN0b3JbJ3gnXSAsdGhpcy52ZWN0b3JbJ3knXSAsdGhpcy52ZWN0b3JbJ3onXSk7XG59O1xuXG5VSS5WZWN0b3IzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5WZWN0b3IzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLlZlY3RvcjM7XG5cblVJLlZlY3RvcjMucHJvdG90eXBlLnNldFdpZHRoPWZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuVUkuVmVjdG9yMy5wcm90b3R5cGUuc2V0VmFsdWU9ZnVuY3Rpb24odmFsdWUpIHtcbiAgZm9yICh2YXIgdmFsIGluIHZhbHVlKSB7XG4gICAgdGhpcy52ZWN0b3JbdmFsXS5zZXRWYWx1ZSh2YWx1ZVt2YWxdKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cblVJLlZlY3RvcjMucHJvdG90eXBlLmdldFZhbHVlPWZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgICd4JzogdGhpcy52ZWN0b3JbJ3gnXS5nZXRWYWx1ZSgpLFxuICAgICd5JzogdGhpcy52ZWN0b3JbJ3knXS5nZXRWYWx1ZSgpLFxuICAgICd6JzogdGhpcy52ZWN0b3JbJ3onXS5nZXRWYWx1ZSgpXG4gIH1cbn1cblxuXG5VSS5UZXh0dXJlID0gZnVuY3Rpb24gKCBtYXBwaW5nICkge1xuXG4gIFVJLkVsZW1lbnQuY2FsbCggdGhpcyApO1xuXG4gIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuLypcbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lucHV0JyApO1xuICBpbnB1dC50eXBlID0gJ2ZpbGUnO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCAnY2hhbmdlJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIGxvYWRGaWxlKCBldmVudC50YXJnZXQuZmlsZXNbIDAgXSApO1xuXG4gIH0gKTtcbiovXG4gIHZhciBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG4gIGljb24uc3R5bGUucGFkZGluZ1JpZ2h0ID0gJzJweCc7XG4gIGRvbS5hcHBlbmRDaGlsZCggaWNvbiApO1xuXG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICBjYW52YXMud2lkdGggPSAzMjtcbiAgY2FudmFzLmhlaWdodCA9IDE2O1xuICBjYW52YXMuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICBjYW52YXMuc3R5bGUubWFyZ2luUmlnaHQgPSAnNXB4JztcbiAgY2FudmFzLnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgIzg4OCc7XG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xuICAgIGFmcmFtZUVkaXRvci5lZGl0b3Iuc2lnbmFscy5zaG93QXNzZXRzRGlhbG9nLmRpc3BhdGNoKHNjb3BlKTtcbiAgICAvL2FmcmFtZUVkaXRvci5lZGl0b3IuZGlhbG9ncy5hc3NldHMuc2hvdyhzY29wZSk7XG4gIH0sIGZhbHNlICk7XG4vKiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoICdkcm9wJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgbG9hZEZpbGUoIGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1sgMCBdICk7XG5cbiAgfSwgZmFsc2UgKTtcbiovXG4gIGRvbS5hcHBlbmRDaGlsZCggY2FudmFzICk7XG4vKlxuICB2YXIgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbnB1dCcgKTtcbiAgbmFtZS5kaXNhYmxlZCA9IHRydWU7XG4gIG5hbWUuc3R5bGUud2lkdGggPSAnNjRweCc7XG4gIG5hbWUuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCAjY2NjJztcbiAgZG9tLmFwcGVuZENoaWxkKCBuYW1lICk7XG4qL1xuXG4gIHZhciByZW1vdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG4gIHJlbW92ZS50eXBlID0gJ2J1dHRvbic7XG4gIHJlbW92ZS52YWx1ZSA9ICdyZW1vdmUnO1xuICByZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCl7XG4gICAgc2NvcGUuc2V0VmFsdWUoJycpO1xuICAgIGlmICggc2NvcGUub25DaGFuZ2VDYWxsYmFjayApIHNjb3BlLm9uQ2hhbmdlQ2FsbGJhY2soKTtcbiAgfSk7XG5cbiAgZG9tLmFwcGVuZENoaWxkKCByZW1vdmUgKTtcblxuICB2YXIgbG9hZEZpbGUgPSBmdW5jdGlvbiAoIGZpbGUgKSB7XG5cbiAgICBpZiAoIGZpbGUudHlwZS5tYXRjaCggJ2ltYWdlLionICkgKSB7XG5cbiAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW1nJyApO1xuICAgICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uKCBldmVudCApIHtcblxuICAgICAgICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUoIHRoaXMsIG1hcHBpbmcgKTtcbiAgICAgICAgICB0ZXh0dXJlLnNvdXJjZUZpbGUgPSBmaWxlLm5hbWU7XG4gICAgICAgICAgdGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cbiAgICAgICAgICBzY29wZS5zZXRWYWx1ZSggdGV4dHVyZSApO1xuXG4gICAgICAgICAgaWYgKCBzY29wZS5vbkNoYW5nZUNhbGxiYWNrICkgc2NvcGUub25DaGFuZ2VDYWxsYmFjaygpO1xuXG4gICAgICAgIH0sIGZhbHNlICk7XG5cbiAgICAgICAgaW1hZ2Uuc3JjID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgfSwgZmFsc2UgKTtcblxuICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIGZpbGUgKTtcblxuICAgIH1cblxuICB9O1xuXG4gIHRoaXMuZG9tID0gZG9tO1xuICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2sgPSBudWxsO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5VSS5UZXh0dXJlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFVJLkVsZW1lbnQucHJvdG90eXBlICk7XG5VSS5UZXh0dXJlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJLlRleHR1cmU7XG5cblVJLlRleHR1cmUucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gIHJldHVybiB0aGlzLnRleHR1cmU7XG5cbn07XG5cblVJLlRleHR1cmUucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24gKCBtYXBWYWx1ZSApIHtcblxuICB2YXIgaWNvbiA9IHRoaXMuZG9tLmNoaWxkcmVuWyAwIF07XG4gIHZhciBjYW52YXMgPSB0aGlzLmRvbS5jaGlsZHJlblsgMSBdO1xuICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICk7XG5cbiAgZnVuY3Rpb24gcGFpbnRQcmV2aWV3KHRleHR1cmUpIHtcbiAgICB2YXIgaW1hZ2UgPSB0ZXh0dXJlLmltYWdlO1xuICAgIHZhciBmaWxlbmFtZSA9IGltYWdlLnNyYy5yZXBsYWNlKC9eLipbXFxcXFxcL10vLCAnJylcbiAgICBpZiAoIGltYWdlICE9PSB1bmRlZmluZWQgJiYgaW1hZ2Uud2lkdGggPiAwICkge1xuXG4gICAgICBjYW52YXMudGl0bGUgPSBmaWxlbmFtZTtcbiAgICAgIHZhciBzY2FsZSA9IGNhbnZhcy53aWR0aCAvIGltYWdlLndpZHRoO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLCAwLCAwLCBpbWFnZS53aWR0aCAqIHNjYWxlLCBpbWFnZS5oZWlnaHQgKiBzY2FsZSApO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy9uYW1lLnZhbHVlID0gZmlsZW5hbWUgKyAnIChlcnJvciknO1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xuXG4gICAgfVxuICB9XG5cbiAgdmFyIHVybCA9IEFGUkFNRS51dGlscy5zcmNMb2FkZXIucGFyc2VVcmwobWFwVmFsdWUpO1xuICBpZiAodXJsKSB7XG4gICAgaWNvbi5jbGFzc05hbWUgPSAnZmEgZmEtZXh0ZXJuYWwtbGluayc7XG4gICAgdmFyIHRleHR1cmVDYWNoZSA9IGFmcmFtZUVkaXRvci5lZGl0b3Iuc2NlbmVFbC5zeXN0ZW1zLm1hdGVyaWFsLnRleHR1cmVDYWNoZVt1cmxdO1xuICAgIGlmICh0ZXh0dXJlQ2FjaGUpIHtcbiAgICAgIHRleHR1cmVDYWNoZVtPYmplY3Qua2V5cyh0ZXh0dXJlQ2FjaGUpWzBdXS50aGVuKHBhaW50UHJldmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk5vIHRleHR1cmUgaW4gY2FjaGVcIiwgdXJsLCBtYXBWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKG1hcFZhbHVlWzBdID09ICcjJykge1xuICAgIGljb24uY2xhc3NOYW1lID0gJ2ZhIGZhLWxpbmsnO1xuICAgIHZhciB1cmwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG1hcFZhbHVlKS5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgIHZhciB0ZXh0dXJlQ2FjaGUgPSBhZnJhbWVFZGl0b3IuZWRpdG9yLnNjZW5lRWwuc3lzdGVtcy5tYXRlcmlhbC50ZXh0dXJlQ2FjaGVbdXJsXTtcbiAgICBpZiAodGV4dHVyZUNhY2hlKSB7XG4gICAgICB2YXIgdXJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFwVmFsdWUuc3Vic3RyKDEpKS5hdHRyaWJ1dGVzWydzcmMnXS52YWx1ZTtcbiAgICAgIHRleHR1cmVDYWNoZVtPYmplY3Qua2V5cyh0ZXh0dXJlQ2FjaGUpWzBdXS50aGVuKHBhaW50UHJldmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk5vIHRleHR1cmUgaW4gY2FjaGVcIiwgdXJsLCBtYXBWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKTtcbiAgICBpY29uLmNsYXNzTmFtZSA9ICcnO1xuICB9XG5cbiAgdGhpcy50ZXh0dXJlID0gbWFwVmFsdWU7XG4gIHJldHVybjtcblxuICBpZiAoIHRleHR1cmUgIT09IG51bGwgKSB7XG5cbiAgICB2YXIgaW1hZ2UgPSB0ZXh0dXJlLmltYWdlO1xuXG4gICAgaWYgKCBpbWFnZSAhPT0gdW5kZWZpbmVkICYmIGltYWdlLndpZHRoID4gMCApIHtcblxuICAgICAgbmFtZS52YWx1ZSA9IHRleHR1cmUuc291cmNlRmlsZTtcblxuICAgICAgdmFyIHNjYWxlID0gY2FudmFzLndpZHRoIC8gaW1hZ2Uud2lkdGg7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZSggaW1hZ2UsIDAsIDAsIGltYWdlLndpZHRoICogc2NhbGUsIGltYWdlLmhlaWdodCAqIHNjYWxlICk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBuYW1lLnZhbHVlID0gdGV4dHVyZS5zb3VyY2VGaWxlICsgJyAoZXJyb3IpJztcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKTtcblxuICAgIH1cblxuICB9IGVsc2Uge1xuXG4gICAgbmFtZS52YWx1ZSA9ICcnO1xuICAgIGNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKTtcblxuICB9XG5cbiAgdGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcblxufTtcblxuVUkuVGV4dHVyZS5wcm90b3R5cGUub25DaGFuZ2UgPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkge1xuXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuXG4gIHJldHVybiB0aGlzO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgYnJvd3NlciBmaWVsZCwgY2hlY2sgb3V0IHRoZSBicm93c2VyIGZpZWxkIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9zdWJzdGFjay9icm93c2VyaWZ5LWhhbmRib29rI2Jyb3dzZXItZmllbGQuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vIENyZWF0ZSBhIDxsaW5rPiB0YWcgd2l0aCBvcHRpb25hbCBkYXRhIGF0dHJpYnV0ZXNcbiAgICBjcmVhdGVMaW5rOiBmdW5jdGlvbihocmVmLCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHZhciBoZWFkID0gZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgICAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcblxuICAgICAgICBsaW5rLmhyZWYgPSBocmVmO1xuICAgICAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgaWYgKCAhIGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbHVlID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICB9LFxuICAgIC8vIENyZWF0ZSBhIDxzdHlsZT4gdGFnIHdpdGggb3B0aW9uYWwgZGF0YSBhdHRyaWJ1dGVzXG4gICAgY3JlYXRlU3R5bGU6IGZ1bmN0aW9uKGNzc1RleHQsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIGhlYWQgPSBkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICAgICAgICBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICAgICAgc3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGlmICggISBhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChzdHlsZS5zaGVldCkgeyAvLyBmb3IganNkb20gYW5kIElFOStcbiAgICAgICAgICAgIHN0eWxlLmlubmVySFRNTCA9IGNzc1RleHQ7XG4gICAgICAgICAgICBzdHlsZS5zaGVldC5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHsgLy8gZm9yIElFOCBhbmQgYmVsb3dcbiAgICAgICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfSBlbHNlIHsgLy8gZm9yIENocm9tZSwgRmlyZWZveCwgYW5kIFNhZmFyaVxuICAgICAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzVGV4dCkpO1xuICAgICAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgX3NlbGVjdCA9IHJlcXVpcmUoJ3NlbGVjdCcpO1xuXG52YXIgX3NlbGVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zZWxlY3QpO1xuXG4vKipcbiAqIElubmVyIGNsYXNzIHdoaWNoIHBlcmZvcm1zIHNlbGVjdGlvbiBmcm9tIGVpdGhlciBgdGV4dGAgb3IgYHRhcmdldGBcbiAqIHByb3BlcnRpZXMgYW5kIHRoZW4gZXhlY3V0ZXMgY29weSBvciBjdXQgb3BlcmF0aW9ucy5cbiAqL1xuXG52YXIgQ2xpcGJvYXJkQWN0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gQ2xpcGJvYXJkQWN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIENsaXBib2FyZEFjdGlvbik7XG5cbiAgICAgICAgdGhpcy5yZXNvbHZlT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pbml0U2VsZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVmaW5lcyBiYXNlIHByb3BlcnRpZXMgcGFzc2VkIGZyb20gY29uc3RydWN0b3IuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKi9cblxuICAgIENsaXBib2FyZEFjdGlvbi5wcm90b3R5cGUucmVzb2x2ZU9wdGlvbnMgPSBmdW5jdGlvbiByZXNvbHZlT3B0aW9ucygpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICB0aGlzLmFjdGlvbiA9IG9wdGlvbnMuYWN0aW9uO1xuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBvcHRpb25zLmVtaXR0ZXI7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gb3B0aW9ucy50YXJnZXQ7XG4gICAgICAgIHRoaXMudGV4dCA9IG9wdGlvbnMudGV4dDtcbiAgICAgICAgdGhpcy50cmlnZ2VyID0gb3B0aW9ucy50cmlnZ2VyO1xuXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUZXh0ID0gJyc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlY2lkZXMgd2hpY2ggc2VsZWN0aW9uIHN0cmF0ZWd5IGlzIGdvaW5nIHRvIGJlIGFwcGxpZWQgYmFzZWRcbiAgICAgKiBvbiB0aGUgZXhpc3RlbmNlIG9mIGB0ZXh0YCBhbmQgYHRhcmdldGAgcHJvcGVydGllcy5cbiAgICAgKi9cblxuICAgIENsaXBib2FyZEFjdGlvbi5wcm90b3R5cGUuaW5pdFNlbGVjdGlvbiA9IGZ1bmN0aW9uIGluaXRTZWxlY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnRleHQgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTXVsdGlwbGUgYXR0cmlidXRlcyBkZWNsYXJlZCwgdXNlIGVpdGhlciBcInRhcmdldFwiIG9yIFwidGV4dFwiJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50ZXh0KSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZha2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RUYXJnZXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBhdHRyaWJ1dGVzLCB1c2UgZWl0aGVyIFwidGFyZ2V0XCIgb3IgXCJ0ZXh0XCInKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZmFrZSB0ZXh0YXJlYSBlbGVtZW50LCBzZXRzIGl0cyB2YWx1ZSBmcm9tIGB0ZXh0YCBwcm9wZXJ0eSxcbiAgICAgKiBhbmQgbWFrZXMgYSBzZWxlY3Rpb24gb24gaXQuXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmRBY3Rpb24ucHJvdG90eXBlLnNlbGVjdEZha2UgPSBmdW5jdGlvbiBzZWxlY3RGYWtlKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBpc1JUTCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RpcicpID09ICdydGwnO1xuXG4gICAgICAgIHRoaXMucmVtb3ZlRmFrZSgpO1xuXG4gICAgICAgIHRoaXMuZmFrZUhhbmRsZXIgPSBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJlbW92ZUZha2UoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mYWtlRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICAgIC8vIFByZXZlbnQgem9vbWluZyBvbiBpT1NcbiAgICAgICAgdGhpcy5mYWtlRWxlbS5zdHlsZS5mb250U2l6ZSA9ICcxMnB0JztcbiAgICAgICAgLy8gUmVzZXQgYm94IG1vZGVsXG4gICAgICAgIHRoaXMuZmFrZUVsZW0uc3R5bGUuYm9yZGVyID0gJzAnO1xuICAgICAgICB0aGlzLmZha2VFbGVtLnN0eWxlLnBhZGRpbmcgPSAnMCc7XG4gICAgICAgIHRoaXMuZmFrZUVsZW0uc3R5bGUubWFyZ2luID0gJzAnO1xuICAgICAgICAvLyBNb3ZlIGVsZW1lbnQgb3V0IG9mIHNjcmVlbiBob3Jpem9udGFsbHlcbiAgICAgICAgdGhpcy5mYWtlRWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRoaXMuZmFrZUVsZW0uc3R5bGVbaXNSVEwgPyAncmlnaHQnIDogJ2xlZnQnXSA9ICctOTk5OXB4JztcbiAgICAgICAgLy8gTW92ZSBlbGVtZW50IHRvIHRoZSBzYW1lIHBvc2l0aW9uIHZlcnRpY2FsbHlcbiAgICAgICAgdGhpcy5mYWtlRWxlbS5zdHlsZS50b3AgPSAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApICsgJ3B4JztcbiAgICAgICAgdGhpcy5mYWtlRWxlbS5zZXRBdHRyaWJ1dGUoJ3JlYWRvbmx5JywgJycpO1xuICAgICAgICB0aGlzLmZha2VFbGVtLnZhbHVlID0gdGhpcy50ZXh0O1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5mYWtlRWxlbSk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RlZFRleHQgPSBfc2VsZWN0MlsnZGVmYXVsdCddKHRoaXMuZmFrZUVsZW0pO1xuICAgICAgICB0aGlzLmNvcHlUZXh0KCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9ubHkgcmVtb3ZlcyB0aGUgZmFrZSBlbGVtZW50IGFmdGVyIGFub3RoZXIgY2xpY2sgZXZlbnQsIHRoYXQgd2F5XG4gICAgICogYSB1c2VyIGNhbiBoaXQgYEN0cmwrQ2AgdG8gY29weSBiZWNhdXNlIHNlbGVjdGlvbiBzdGlsbCBleGlzdHMuXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmRBY3Rpb24ucHJvdG90eXBlLnJlbW92ZUZha2UgPSBmdW5jdGlvbiByZW1vdmVGYWtlKCkge1xuICAgICAgICBpZiAodGhpcy5mYWtlSGFuZGxlcikge1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycpO1xuICAgICAgICAgICAgdGhpcy5mYWtlSGFuZGxlciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5mYWtlRWxlbSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmZha2VFbGVtKTtcbiAgICAgICAgICAgIHRoaXMuZmFrZUVsZW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNlbGVjdHMgdGhlIGNvbnRlbnQgZnJvbSBlbGVtZW50IHBhc3NlZCBvbiBgdGFyZ2V0YCBwcm9wZXJ0eS5cbiAgICAgKi9cblxuICAgIENsaXBib2FyZEFjdGlvbi5wcm90b3R5cGUuc2VsZWN0VGFyZ2V0ID0gZnVuY3Rpb24gc2VsZWN0VGFyZ2V0KCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkVGV4dCA9IF9zZWxlY3QyWydkZWZhdWx0J10odGhpcy50YXJnZXQpO1xuICAgICAgICB0aGlzLmNvcHlUZXh0KCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBjb3B5IG9wZXJhdGlvbiBiYXNlZCBvbiB0aGUgY3VycmVudCBzZWxlY3Rpb24uXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmRBY3Rpb24ucHJvdG90eXBlLmNvcHlUZXh0ID0gZnVuY3Rpb24gY29weVRleHQoKSB7XG4gICAgICAgIHZhciBzdWNjZWVkZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN1Y2NlZWRlZCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKHRoaXMuYWN0aW9uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBzdWNjZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGFuZGxlUmVzdWx0KHN1Y2NlZWRlZCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIGFuIGV2ZW50IGJhc2VkIG9uIHRoZSBjb3B5IG9wZXJhdGlvbiByZXN1bHQuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBzdWNjZWVkZWRcbiAgICAgKi9cblxuICAgIENsaXBib2FyZEFjdGlvbi5wcm90b3R5cGUuaGFuZGxlUmVzdWx0ID0gZnVuY3Rpb24gaGFuZGxlUmVzdWx0KHN1Y2NlZWRlZCkge1xuICAgICAgICBpZiAoc3VjY2VlZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc3VjY2VzcycsIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IHRoaXMuYWN0aW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuc2VsZWN0ZWRUZXh0LFxuICAgICAgICAgICAgICAgIHRyaWdnZXI6IHRoaXMudHJpZ2dlcixcbiAgICAgICAgICAgICAgICBjbGVhclNlbGVjdGlvbjogdGhpcy5jbGVhclNlbGVjdGlvbi5iaW5kKHRoaXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IHRoaXMuYWN0aW9uLFxuICAgICAgICAgICAgICAgIHRyaWdnZXI6IHRoaXMudHJpZ2dlcixcbiAgICAgICAgICAgICAgICBjbGVhclNlbGVjdGlvbjogdGhpcy5jbGVhclNlbGVjdGlvbi5iaW5kKHRoaXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGN1cnJlbnQgc2VsZWN0aW9uIGFuZCBmb2N1cyBmcm9tIGB0YXJnZXRgIGVsZW1lbnQuXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmRBY3Rpb24ucHJvdG90eXBlLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24gY2xlYXJTZWxlY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuYmx1cigpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBgYWN0aW9uYCB0byBiZSBwZXJmb3JtZWQgd2hpY2ggY2FuIGJlIGVpdGhlciAnY29weScgb3IgJ2N1dCcuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvblxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBsaWZlY3ljbGUuXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmRBY3Rpb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLnJlbW92ZUZha2UoKTtcbiAgICB9O1xuXG4gICAgX2NyZWF0ZUNsYXNzKENsaXBib2FyZEFjdGlvbiwgW3tcbiAgICAgICAga2V5OiAnYWN0aW9uJyxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQoKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJ2NvcHknIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgICB0aGlzLl9hY3Rpb24gPSBhY3Rpb247XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hY3Rpb24gIT09ICdjb3B5JyAmJiB0aGlzLl9hY3Rpb24gIT09ICdjdXQnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFwiYWN0aW9uXCIgdmFsdWUsIHVzZSBlaXRoZXIgXCJjb3B5XCIgb3IgXCJjdXRcIicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBgYWN0aW9uYCBwcm9wZXJ0eS5cbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYWN0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldHMgdGhlIGB0YXJnZXRgIHByb3BlcnR5IHVzaW5nIGFuIGVsZW1lbnRcbiAgICAgICAgICogdGhhdCB3aWxsIGJlIGhhdmUgaXRzIGNvbnRlbnQgY29waWVkLlxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldFxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3RhcmdldCcsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHRhcmdldCkge1xuICAgICAgICAgICAgaWYgKHRhcmdldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyAmJiB0YXJnZXQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBcInRhcmdldFwiIHZhbHVlLCB1c2UgYSB2YWxpZCBFbGVtZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBgdGFyZ2V0YCBwcm9wZXJ0eS5cbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfEhUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGFyZ2V0O1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIENsaXBib2FyZEFjdGlvbjtcbn0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IENsaXBib2FyZEFjdGlvbjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9jbGlwYm9hcmRBY3Rpb24gPSByZXF1aXJlKCcuL2NsaXBib2FyZC1hY3Rpb24nKTtcblxudmFyIF9jbGlwYm9hcmRBY3Rpb24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xpcGJvYXJkQWN0aW9uKTtcblxudmFyIF90aW55RW1pdHRlciA9IHJlcXVpcmUoJ3RpbnktZW1pdHRlcicpO1xuXG52YXIgX3RpbnlFbWl0dGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3RpbnlFbWl0dGVyKTtcblxudmFyIF9nb29kTGlzdGVuZXIgPSByZXF1aXJlKCdnb29kLWxpc3RlbmVyJyk7XG5cbnZhciBfZ29vZExpc3RlbmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dvb2RMaXN0ZW5lcik7XG5cbi8qKlxuICogQmFzZSBjbGFzcyB3aGljaCB0YWtlcyBvbmUgb3IgbW9yZSBlbGVtZW50cywgYWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlbSxcbiAqIGFuZCBpbnN0YW50aWF0ZXMgYSBuZXcgYENsaXBib2FyZEFjdGlvbmAgb24gZWFjaCBjbGljay5cbiAqL1xuXG52YXIgQ2xpcGJvYXJkID0gKGZ1bmN0aW9uIChfRW1pdHRlcikge1xuICAgIF9pbmhlcml0cyhDbGlwYm9hcmQsIF9FbWl0dGVyKTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfEhUTUxFbGVtZW50fEhUTUxDb2xsZWN0aW9ufE5vZGVMaXN0fSB0cmlnZ2VyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIENsaXBib2FyZCh0cmlnZ2VyLCBvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDbGlwYm9hcmQpO1xuXG4gICAgICAgIF9FbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgICAgICAgdGhpcy5yZXNvbHZlT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5saXN0ZW5DbGljayh0cmlnZ2VyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmV0cmlldmUgYXR0cmlidXRlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdWZmaXhcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgaWYgYXR0cmlidXRlcyB3b3VsZCBiZSByZXNvbHZlZCB1c2luZyBpbnRlcm5hbCBzZXR0ZXIgZnVuY3Rpb25zXG4gICAgICogb3IgY3VzdG9tIGZ1bmN0aW9ucyB0aGF0IHdlcmUgcGFzc2VkIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqL1xuXG4gICAgQ2xpcGJvYXJkLnByb3RvdHlwZS5yZXNvbHZlT3B0aW9ucyA9IGZ1bmN0aW9uIHJlc29sdmVPcHRpb25zKCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIHRoaXMuYWN0aW9uID0gdHlwZW9mIG9wdGlvbnMuYWN0aW9uID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5hY3Rpb24gOiB0aGlzLmRlZmF1bHRBY3Rpb247XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdHlwZW9mIG9wdGlvbnMudGFyZ2V0ID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy50YXJnZXQgOiB0aGlzLmRlZmF1bHRUYXJnZXQ7XG4gICAgICAgIHRoaXMudGV4dCA9IHR5cGVvZiBvcHRpb25zLnRleHQgPT09ICdmdW5jdGlvbicgPyBvcHRpb25zLnRleHQgOiB0aGlzLmRlZmF1bHRUZXh0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgY2xpY2sgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIHBhc3NlZCB0cmlnZ2VyLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfEhUTUxFbGVtZW50fEhUTUxDb2xsZWN0aW9ufE5vZGVMaXN0fSB0cmlnZ2VyXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmQucHJvdG90eXBlLmxpc3RlbkNsaWNrID0gZnVuY3Rpb24gbGlzdGVuQ2xpY2sodHJpZ2dlcikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBfZ29vZExpc3RlbmVyMlsnZGVmYXVsdCddKHRyaWdnZXIsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMub25DbGljayhlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgYSBuZXcgYENsaXBib2FyZEFjdGlvbmAgb24gZWFjaCBjbGljayBldmVudC5cbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmQucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbiBvbkNsaWNrKGUpIHtcbiAgICAgICAgdmFyIHRyaWdnZXIgPSBlLmRlbGVnYXRlVGFyZ2V0IHx8IGUuY3VycmVudFRhcmdldDtcblxuICAgICAgICBpZiAodGhpcy5jbGlwYm9hcmRBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY2xpcGJvYXJkQWN0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xpcGJvYXJkQWN0aW9uID0gbmV3IF9jbGlwYm9hcmRBY3Rpb24yWydkZWZhdWx0J10oe1xuICAgICAgICAgICAgYWN0aW9uOiB0aGlzLmFjdGlvbih0cmlnZ2VyKSxcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy50YXJnZXQodHJpZ2dlciksXG4gICAgICAgICAgICB0ZXh0OiB0aGlzLnRleHQodHJpZ2dlciksXG4gICAgICAgICAgICB0cmlnZ2VyOiB0cmlnZ2VyLFxuICAgICAgICAgICAgZW1pdHRlcjogdGhpc1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCBgYWN0aW9uYCBsb29rdXAgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSB0cmlnZ2VyXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmQucHJvdG90eXBlLmRlZmF1bHRBY3Rpb24gPSBmdW5jdGlvbiBkZWZhdWx0QWN0aW9uKHRyaWdnZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKCdhY3Rpb24nLCB0cmlnZ2VyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCBgdGFyZ2V0YCBsb29rdXAgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSB0cmlnZ2VyXG4gICAgICovXG5cbiAgICBDbGlwYm9hcmQucHJvdG90eXBlLmRlZmF1bHRUYXJnZXQgPSBmdW5jdGlvbiBkZWZhdWx0VGFyZ2V0KHRyaWdnZXIpIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gZ2V0QXR0cmlidXRlVmFsdWUoJ3RhcmdldCcsIHRyaWdnZXIpO1xuXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgYHRleHRgIGxvb2t1cCBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHRyaWdnZXJcbiAgICAgKi9cblxuICAgIENsaXBib2FyZC5wcm90b3R5cGUuZGVmYXVsdFRleHQgPSBmdW5jdGlvbiBkZWZhdWx0VGV4dCh0cmlnZ2VyKSB7XG4gICAgICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZSgndGV4dCcsIHRyaWdnZXIpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95IGxpZmVjeWNsZS5cbiAgICAgKi9cblxuICAgIENsaXBib2FyZC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuZGVzdHJveSgpO1xuXG4gICAgICAgIGlmICh0aGlzLmNsaXBib2FyZEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jbGlwYm9hcmRBY3Rpb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5jbGlwYm9hcmRBY3Rpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDbGlwYm9hcmQ7XG59KShfdGlueUVtaXR0ZXIyWydkZWZhdWx0J10pO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBDbGlwYm9hcmQ7XG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGVWYWx1ZShzdWZmaXgsIGVsZW1lbnQpIHtcbiAgICB2YXIgYXR0cmlidXRlID0gJ2RhdGEtY2xpcGJvYXJkLScgKyBzdWZmaXg7XG5cbiAgICBpZiAoIWVsZW1lbnQuaGFzQXR0cmlidXRlKGF0dHJpYnV0ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwidmFyIG1hdGNoZXMgPSByZXF1aXJlKCdtYXRjaGVzLXNlbGVjdG9yJylcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBjaGVja1lvU2VsZikge1xyXG4gIHZhciBwYXJlbnQgPSBjaGVja1lvU2VsZiA/IGVsZW1lbnQgOiBlbGVtZW50LnBhcmVudE5vZGVcclxuXHJcbiAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT09IGRvY3VtZW50KSB7XHJcbiAgICBpZiAobWF0Y2hlcyhwYXJlbnQsIHNlbGVjdG9yKSkgcmV0dXJuIHBhcmVudDtcclxuICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlXHJcbiAgfVxyXG59XHJcbiIsIlxyXG4vKipcclxuICogRWxlbWVudCBwcm90b3R5cGUuXHJcbiAqL1xyXG5cclxudmFyIHByb3RvID0gRWxlbWVudC5wcm90b3R5cGU7XHJcblxyXG4vKipcclxuICogVmVuZG9yIGZ1bmN0aW9uLlxyXG4gKi9cclxuXHJcbnZhciB2ZW5kb3IgPSBwcm90by5tYXRjaGVzU2VsZWN0b3JcclxuICB8fCBwcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3JcclxuICB8fCBwcm90by5tb3pNYXRjaGVzU2VsZWN0b3JcclxuICB8fCBwcm90by5tc01hdGNoZXNTZWxlY3RvclxyXG4gIHx8IHByb3RvLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG4vKipcclxuICogRXhwb3NlIGBtYXRjaCgpYC5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoO1xyXG5cclxuLyoqXHJcbiAqIE1hdGNoIGBlbGAgdG8gYHNlbGVjdG9yYC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3JcclxuICogQHJldHVybiB7Qm9vbGVhbn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBtYXRjaChlbCwgc2VsZWN0b3IpIHtcclxuICBpZiAodmVuZG9yKSByZXR1cm4gdmVuZG9yLmNhbGwoZWwsIHNlbGVjdG9yKTtcclxuICB2YXIgbm9kZXMgPSBlbC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kpIHtcclxuICAgIGlmIChub2Rlc1tpXSA9PSBlbCkgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsInZhciBjbG9zZXN0ID0gcmVxdWlyZSgnY2xvc2VzdCcpO1xuXG4vKipcbiAqIERlbGVnYXRlcyBldmVudCB0byBhIHNlbGVjdG9yLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdXNlQ2FwdHVyZVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBkZWxlZ2F0ZShlbGVtZW50LCBzZWxlY3RvciwgdHlwZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgbGlzdGVuZXJGbiA9IGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBGaW5kcyBjbG9zZXN0IG1hdGNoIGFuZCBpbnZva2VzIGNhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBsaXN0ZW5lcihlbGVtZW50LCBzZWxlY3RvciwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICBlLmRlbGVnYXRlVGFyZ2V0ID0gY2xvc2VzdChlLnRhcmdldCwgc2VsZWN0b3IsIHRydWUpO1xuXG4gICAgICAgIGlmIChlLmRlbGVnYXRlVGFyZ2V0KSB7XG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGVsZW1lbnQsIGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlbGVnYXRlO1xuIiwiLyoqXG4gKiBDaGVjayBpZiBhcmd1bWVudCBpcyBhIEhUTUwgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmV4cG9ydHMubm9kZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWRcbiAgICAgICAgJiYgdmFsdWUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudFxuICAgICAgICAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYXJndW1lbnQgaXMgYSBsaXN0IG9mIEhUTUwgZWxlbWVudHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5leHBvcnRzLm5vZGVMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG5cbiAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZFxuICAgICAgICAmJiAodHlwZSA9PT0gJ1tvYmplY3QgTm9kZUxpc3RdJyB8fCB0eXBlID09PSAnW29iamVjdCBIVE1MQ29sbGVjdGlvbl0nKVxuICAgICAgICAmJiAoJ2xlbmd0aCcgaW4gdmFsdWUpXG4gICAgICAgICYmICh2YWx1ZS5sZW5ndGggPT09IDAgfHwgZXhwb3J0cy5ub2RlKHZhbHVlWzBdKSk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGFyZ3VtZW50IGlzIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZXhwb3J0cy5zdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZXhwb3J0cy5mbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuXG4gICAgcmV0dXJuIHR5cGUgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59O1xuIiwidmFyIGlzID0gcmVxdWlyZSgnLi9pcycpO1xudmFyIGRlbGVnYXRlID0gcmVxdWlyZSgnZGVsZWdhdGUnKTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgYWxsIHBhcmFtcyBhbmQgY2FsbHMgdGhlIHJpZ2h0XG4gKiBsaXN0ZW5lciBmdW5jdGlvbiBiYXNlZCBvbiBpdHMgdGFyZ2V0IHR5cGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8SFRNTEVsZW1lbnR8SFRNTENvbGxlY3Rpb258Tm9kZUxpc3R9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmZ1bmN0aW9uIGxpc3Rlbih0YXJnZXQsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0YXJnZXQgJiYgIXR5cGUgJiYgIWNhbGxiYWNrKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBhcmd1bWVudHMnKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzLnN0cmluZyh0eXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhIFN0cmluZycpO1xuICAgIH1cblxuICAgIGlmICghaXMuZm4oY2FsbGJhY2spKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoaXJkIGFyZ3VtZW50IG11c3QgYmUgYSBGdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmIChpcy5ub2RlKHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rlbk5vZGUodGFyZ2V0LCB0eXBlLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLm5vZGVMaXN0KHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rlbk5vZGVMaXN0KHRhcmdldCwgdHlwZSwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBlbHNlIGlmIChpcy5zdHJpbmcodGFyZ2V0KSkge1xuICAgICAgICByZXR1cm4gbGlzdGVuU2VsZWN0b3IodGFyZ2V0LCB0eXBlLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgU3RyaW5nLCBIVE1MRWxlbWVudCwgSFRNTENvbGxlY3Rpb24sIG9yIE5vZGVMaXN0Jyk7XG4gICAgfVxufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSBIVE1MIGVsZW1lbnRcbiAqIGFuZCByZXR1cm5zIGEgcmVtb3ZlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBsaXN0ZW5Ob2RlKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSBsaXN0IG9mIEhUTUwgZWxlbWVudHNcbiAqIGFuZCByZXR1cm5zIGEgcmVtb3ZlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7Tm9kZUxpc3R8SFRNTENvbGxlY3Rpb259IG5vZGVMaXN0XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuZnVuY3Rpb24gbGlzdGVuTm9kZUxpc3Qobm9kZUxpc3QsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChub2RlTGlzdCwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKG5vZGVMaXN0LCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhIHNlbGVjdG9yXG4gKiBhbmQgcmV0dXJucyBhIHJlbW92ZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3JcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBsaXN0ZW5TZWxlY3RvcihzZWxlY3RvciwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZGVsZWdhdGUoZG9jdW1lbnQuYm9keSwgc2VsZWN0b3IsIHR5cGUsIGNhbGxiYWNrKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaXN0ZW47XG4iLCJmdW5jdGlvbiBzZWxlY3QoZWxlbWVudCkge1xuICAgIHZhciBzZWxlY3RlZFRleHQ7XG5cbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbGVtZW50Lm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSgwLCBlbGVtZW50LnZhbHVlLmxlbmd0aCk7XG5cbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gZWxlbWVudC52YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJykpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG5cbiAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGVsZW1lbnQpO1xuICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG5cbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGVjdGVkVGV4dDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZWxlY3Q7XG4iLCJmdW5jdGlvbiBFICgpIHtcblx0Ly8gS2VlcCB0aGlzIGVtcHR5IHNvIGl0J3MgZWFzaWVyIHRvIGluaGVyaXQgZnJvbVxuICAvLyAodmlhIGh0dHBzOi8vZ2l0aHViLmNvbS9saXBzbWFjayBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zY290dGNvcmdhbi90aW55LWVtaXR0ZXIvaXNzdWVzLzMpXG59XG5cbkUucHJvdG90eXBlID0ge1xuXHRvbjogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrLCBjdHgpIHtcbiAgICB2YXIgZSA9IHRoaXMuZSB8fCAodGhpcy5lID0ge30pO1xuXG4gICAgKGVbbmFtZV0gfHwgKGVbbmFtZV0gPSBbXSkpLnB1c2goe1xuICAgICAgZm46IGNhbGxiYWNrLFxuICAgICAgY3R4OiBjdHhcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG9uY2U6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaywgY3R4KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGxpc3RlbmVyICgpIHtcbiAgICAgIHNlbGYub2ZmKG5hbWUsIGxpc3RlbmVyKTtcbiAgICAgIGNhbGxiYWNrLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgbGlzdGVuZXIuXyA9IGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMub24obmFtZSwgbGlzdGVuZXIsIGN0eCk7XG4gIH0sXG5cbiAgZW1pdDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgZGF0YSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZXZ0QXJyID0gKCh0aGlzLmUgfHwgKHRoaXMuZSA9IHt9KSlbbmFtZV0gfHwgW10pLnNsaWNlKCk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsZW4gPSBldnRBcnIubGVuZ3RoO1xuXG4gICAgZm9yIChpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGV2dEFycltpXS5mbi5hcHBseShldnRBcnJbaV0uY3R4LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBvZmY6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBlID0gdGhpcy5lIHx8ICh0aGlzLmUgPSB7fSk7XG4gICAgdmFyIGV2dHMgPSBlW25hbWVdO1xuICAgIHZhciBsaXZlRXZlbnRzID0gW107XG5cbiAgICBpZiAoZXZ0cyAmJiBjYWxsYmFjaykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGV2dHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKGV2dHNbaV0uZm4gIT09IGNhbGxiYWNrICYmIGV2dHNbaV0uZm4uXyAhPT0gY2FsbGJhY2spXG4gICAgICAgICAgbGl2ZUV2ZW50cy5wdXNoKGV2dHNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBldmVudCBmcm9tIHF1ZXVlIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtcbiAgICAvLyBTdWdnZXN0ZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2xhemRcbiAgICAvLyBSZWY6IGh0dHBzOi8vZ2l0aHViLmNvbS9zY290dGNvcmdhbi90aW55LWVtaXR0ZXIvY29tbWl0L2M2ZWJmYWE5YmM5NzNiMzNkMTEwYTg0YTMwNzc0MmI3Y2Y5NGM5NTMjY29tbWl0Y29tbWVudC01MDI0OTEwXG5cbiAgICAobGl2ZUV2ZW50cy5sZW5ndGgpXG4gICAgICA/IGVbbmFtZV0gPSBsaXZlRXZlbnRzXG4gICAgICA6IGRlbGV0ZSBlW25hbWVdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRTtcbiIsIi8qanNsaW50IG9uZXZhcjp0cnVlLCB1bmRlZjp0cnVlLCBuZXdjYXA6dHJ1ZSwgcmVnZXhwOnRydWUsIGJpdHdpc2U6dHJ1ZSwgbWF4ZXJyOjUwLCBpbmRlbnQ6NCwgd2hpdGU6ZmFsc2UsIG5vbWVuOmZhbHNlLCBwbHVzcGx1czpmYWxzZSAqL1xuLypnbG9iYWwgZGVmaW5lOmZhbHNlLCByZXF1aXJlOmZhbHNlLCBleHBvcnRzOmZhbHNlLCBtb2R1bGU6ZmFsc2UsIHNpZ25hbHM6ZmFsc2UgKi9cblxuLyoqIEBsaWNlbnNlXG4gKiBKUyBTaWduYWxzIDxodHRwOi8vbWlsbGVybWVkZWlyb3MuZ2l0aHViLmNvbS9qcy1zaWduYWxzLz5cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogQXV0aG9yOiBNaWxsZXIgTWVkZWlyb3NcbiAqIFZlcnNpb246IDEuMC4wIC0gQnVpbGQ6IDI2OCAoMjAxMi8xMS8yOSAwNTo0OCBQTSlcbiAqL1xuXG4oZnVuY3Rpb24oZ2xvYmFsKXtcblxuICAgIC8vIFNpZ25hbEJpbmRpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogT2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgYmV0d2VlbiBhIFNpZ25hbCBhbmQgYSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAgICAgKiA8YnIgLz4tIDxzdHJvbmc+VGhpcyBpcyBhbiBpbnRlcm5hbCBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkbid0IGJlIGNhbGxlZCBieSByZWd1bGFyIHVzZXJzLjwvc3Ryb25nPlxuICAgICAqIDxiciAvPi0gaW5zcGlyZWQgYnkgSm9hIEViZXJ0IEFTMyBTaWduYWxCaW5kaW5nIGFuZCBSb2JlcnQgUGVubmVyJ3MgU2xvdCBjbGFzc2VzLlxuICAgICAqIEBhdXRob3IgTWlsbGVyIE1lZGVpcm9zXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGludGVybmFsXG4gICAgICogQG5hbWUgU2lnbmFsQmluZGluZ1xuICAgICAqIEBwYXJhbSB7U2lnbmFsfSBzaWduYWwgUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiAoZGVmYXVsdCA9IDApLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbEJpbmRpbmcoc2lnbmFsLCBsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyID0gbGlzdGVuZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faXNPbmNlID0gaXNPbmNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAbWVtYmVyT2YgU2lnbmFsQmluZGluZy5wcm90b3R5cGVcbiAgICAgICAgICogQG5hbWUgY29udGV4dFxuICAgICAgICAgKiBAdHlwZSBPYmplY3R8dW5kZWZpbmVkfG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGxpc3RlbmVyQ29udGV4dDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqIEB0eXBlIFNpZ25hbFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2lnbmFsID0gc2lnbmFsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0ZW5lciBwcmlvcml0eVxuICAgICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3ByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICB9XG5cbiAgICBTaWduYWxCaW5kaW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYmluZGluZyBpcyBhY3RpdmUgYW5kIHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYWN0aXZlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBwYXJhbWV0ZXJzIHBhc3NlZCB0byBsaXN0ZW5lciBkdXJpbmcgYFNpZ25hbC5kaXNwYXRjaGAgYW5kIGBTaWduYWxCaW5kaW5nLmV4ZWN1dGVgLiAoY3VycmllZCBwYXJhbWV0ZXJzKVxuICAgICAgICAgKiBAdHlwZSBBcnJheXxudWxsXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbXMgOiBudWxsLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIGxpc3RlbmVyIHBhc3NpbmcgYXJiaXRyYXJ5IHBhcmFtZXRlcnMuXG4gICAgICAgICAqIDxwPklmIGJpbmRpbmcgd2FzIGFkZGVkIHVzaW5nIGBTaWduYWwuYWRkT25jZSgpYCBpdCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBmcm9tIHNpZ25hbCBkaXNwYXRjaCBxdWV1ZSwgdGhpcyBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IGZvciB0aGUgc2lnbmFsIGRpc3BhdGNoLjwvcD5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gW3BhcmFtc0Fycl0gQXJyYXkgb2YgcGFyYW1ldGVycyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyXG4gICAgICAgICAqIEByZXR1cm4geyp9IFZhbHVlIHJldHVybmVkIGJ5IHRoZSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGV4ZWN1dGUgOiBmdW5jdGlvbiAocGFyYW1zQXJyKSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlclJldHVybiwgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aXZlICYmICEhdGhpcy5fbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB0aGlzLnBhcmFtcz8gdGhpcy5wYXJhbXMuY29uY2F0KHBhcmFtc0FycikgOiBwYXJhbXNBcnI7XG4gICAgICAgICAgICAgICAgaGFuZGxlclJldHVybiA9IHRoaXMuX2xpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNPbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXJSZXR1cm47XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGFjaCBiaW5kaW5nIGZyb20gc2lnbmFsLlxuICAgICAgICAgKiAtIGFsaWFzIHRvOiBteVNpZ25hbC5yZW1vdmUobXlCaW5kaW5nLmdldExpc3RlbmVyKCkpO1xuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbnxudWxsfSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwgb3IgYG51bGxgIGlmIGJpbmRpbmcgd2FzIHByZXZpb3VzbHkgZGV0YWNoZWQuXG4gICAgICAgICAqL1xuICAgICAgICBkZXRhY2ggOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0JvdW5kKCk/IHRoaXMuX3NpZ25hbC5yZW1vdmUodGhpcy5fbGlzdGVuZXIsIHRoaXMuY29udGV4dCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYmluZGluZyBpcyBzdGlsbCBib3VuZCB0byB0aGUgc2lnbmFsIGFuZCBoYXZlIGEgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBpc0JvdW5kIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICghIXRoaXMuX3NpZ25hbCAmJiAhIXRoaXMuX2xpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gSWYgU2lnbmFsQmluZGluZyB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgb25jZS5cbiAgICAgICAgICovXG4gICAgICAgIGlzT25jZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc09uY2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXRMaXN0ZW5lciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsfSBTaWduYWwgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqL1xuICAgICAgICBnZXRTaWduYWwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2lnbmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGUgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2Rlc3Ryb3kgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc2lnbmFsO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29udGV4dDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbU2lnbmFsQmluZGluZyBpc09uY2U6JyArIHRoaXMuX2lzT25jZSArJywgaXNCb3VuZDonKyB0aGlzLmlzQm91bmQoKSArJywgYWN0aXZlOicgKyB0aGlzLmFjdGl2ZSArICddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4vKmdsb2JhbCBTaWduYWxCaW5kaW5nOmZhbHNlKi9cblxuICAgIC8vIFNpZ25hbCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgZm5OYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2xpc3RlbmVyIGlzIGEgcmVxdWlyZWQgcGFyYW0gb2Yge2ZufSgpIGFuZCBzaG91bGQgYmUgYSBGdW5jdGlvbi4nLnJlcGxhY2UoJ3tmbn0nLCBmbk5hbWUpICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiA8YnIgLz4tIGluc3BpcmVkIGJ5IFJvYmVydCBQZW5uZXIncyBBUzMgU2lnbmFscy5cbiAgICAgKiBAbmFtZSBTaWduYWxcbiAgICAgKiBAYXV0aG9yIE1pbGxlciBNZWRlaXJvc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbCgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIEFycmF5LjxTaWduYWxCaW5kaW5nPlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYmluZGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG5cbiAgICAgICAgLy8gZW5mb3JjZSBkaXNwYXRjaCB0byBhd2F5cyB3b3JrIG9uIHNhbWUgY29udGV4dCAoIzQ3KVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2ggPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgU2lnbmFsLnByb3RvdHlwZS5kaXNwYXRjaC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIFNpZ25hbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpZ25hbHMgVmVyc2lvbiBOdW1iZXJcbiAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAqIEBjb25zdFxuICAgICAgICAgKi9cbiAgICAgICAgVkVSU0lPTiA6ICcxLjAuMCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIFNpZ25hbCBzaG91bGQga2VlcCByZWNvcmQgb2YgcHJldmlvdXNseSBkaXNwYXRjaGVkIHBhcmFtZXRlcnMgYW5kXG4gICAgICAgICAqIGF1dG9tYXRpY2FsbHkgZXhlY3V0ZSBsaXN0ZW5lciBkdXJpbmcgYGFkZCgpYC9gYWRkT25jZSgpYCBpZiBTaWduYWwgd2FzXG4gICAgICAgICAqIGFscmVhZHkgZGlzcGF0Y2hlZCBiZWZvcmUuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIG1lbW9yaXplIDogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9zaG91bGRQcm9wYWdhdGUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBTaWduYWwgaXMgYWN0aXZlIGFuZCBzaG91bGQgYnJvYWRjYXN0IGV2ZW50cy5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IFNldHRpbmcgdGhpcyBwcm9wZXJ0eSBkdXJpbmcgYSBkaXNwYXRjaCB3aWxsIG9ubHkgYWZmZWN0IHRoZSBuZXh0IGRpc3BhdGNoLCBpZiB5b3Ugd2FudCB0byBzdG9wIHRoZSBwcm9wYWdhdGlvbiBvZiBhIHNpZ25hbCB1c2UgYGhhbHQoKWAgaW5zdGVhZC48L3A+XG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIGFjdGl2ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XVxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXIgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuXG4gICAgICAgICAgICB2YXIgcHJldkluZGV4ID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQpLFxuICAgICAgICAgICAgICAgIGJpbmRpbmc7XG5cbiAgICAgICAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IHRoaXMuX2JpbmRpbmdzW3ByZXZJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGJpbmRpbmcuaXNPbmNlKCkgIT09IGlzT25jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgYWRkJysgKGlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlbiBhZGQnKyAoIWlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlIHNhbWUgbGlzdGVuZXIgd2l0aG91dCByZW1vdmluZyB0aGUgcmVsYXRpb25zaGlwIGZpcnN0LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IG5ldyBTaWduYWxCaW5kaW5nKHRoaXMsIGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZEJpbmRpbmcoYmluZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMubWVtb3JpemUgJiYgdGhpcy5fcHJldlBhcmFtcyl7XG4gICAgICAgICAgICAgICAgYmluZGluZy5leGVjdXRlKHRoaXMuX3ByZXZQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtTaWduYWxCaW5kaW5nfSBiaW5kaW5nXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfYWRkQmluZGluZyA6IGZ1bmN0aW9uIChiaW5kaW5nKSB7XG4gICAgICAgICAgICAvL3NpbXBsaWZpZWQgaW5zZXJ0aW9uIHNvcnRcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgZG8geyAtLW47IH0gd2hpbGUgKHRoaXMuX2JpbmRpbmdzW25dICYmIGJpbmRpbmcuX3ByaW9yaXR5IDw9IHRoaXMuX2JpbmRpbmdzW25dLl9wcmlvcml0eSk7XG4gICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5zcGxpY2UobiArIDEsIDAsIGJpbmRpbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfaW5kZXhPZkxpc3RlbmVyIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjdXI7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgY3VyID0gdGhpcy5fYmluZGluZ3Nbbl07XG4gICAgICAgICAgICAgICAgaWYgKGN1ci5fbGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGN1ci5jb250ZXh0ID09PSBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgaWYgbGlzdGVuZXIgd2FzIGF0dGFjaGVkIHRvIFNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBpZiBTaWduYWwgaGFzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBoYXMgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGNvbnRleHQpICE9PSAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGEgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgU2lnbmFsIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiBMaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBleGVjdXRlZCBiZWZvcmUgbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuIExpc3RlbmVycyB3aXRoIHNhbWUgcHJpb3JpdHkgbGV2ZWwgd2lsbCBiZSBleGVjdXRlZCBhdCB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgYWRkZWQuIChkZWZhdWx0ID0gMClcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ30gQW4gT2JqZWN0IHJlcHJlc2VudGluZyB0aGUgYmluZGluZyBiZXR3ZWVuIHRoZSBTaWduYWwgYW5kIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lciwgZmFsc2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbCB0aGF0IHNob3VsZCBiZSByZW1vdmVkIGFmdGVyIGZpcnN0IGV4ZWN1dGlvbiAod2lsbCBiZSBleGVjdXRlZCBvbmx5IG9uY2UpLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBTaWduYWwgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIExpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZSBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eS4gTGlzdGVuZXJzIHdpdGggc2FtZSBwcmlvcml0eSBsZXZlbCB3aWxsIGJlIGV4ZWN1dGVkIGF0IHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSBhZGRlZC4gKGRlZmF1bHQgPSAwKVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfSBBbiBPYmplY3QgcmVwcmVzZW50aW5nIHRoZSBiaW5kaW5nIGJldHdlZW4gdGhlIFNpZ25hbCBhbmQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBhZGRPbmNlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkT25jZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIsIHRydWUsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYSBzaW5nbGUgbGlzdGVuZXIgZnJvbSB0aGUgZGlzcGF0Y2ggcXVldWUuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIEhhbmRsZXIgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgcmVtb3ZlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSBFeGVjdXRpb24gY29udGV4dCAoc2luY2UgeW91IGNhbiBhZGQgdGhlIHNhbWUgaGFuZGxlciBtdWx0aXBsZSB0aW1lcyBpZiBleGVjdXRpbmcgaW4gYSBkaWZmZXJlbnQgY29udGV4dCkuXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBMaXN0ZW5lciBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAncmVtb3ZlJyk7XG5cbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzW2ldLl9kZXN0cm95KCk7IC8vbm8gcmVhc29uIHRvIGEgU2lnbmFsQmluZGluZyBleGlzdCBpZiBpdCBpc24ndCBhdHRhY2hlZCB0byBhIHNpZ25hbFxuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZnJvbSB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlQWxsIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Nbbl0uX2Rlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLmxlbmd0aCA9IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gTnVtYmVyIG9mIGxpc3RlbmVycyBhdHRhY2hlZCB0byB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TnVtTGlzdGVuZXJzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RvcCBwcm9wYWdhdGlvbiBvZiB0aGUgZXZlbnQsIGJsb2NraW5nIHRoZSBkaXNwYXRjaCB0byBuZXh0IGxpc3RlbmVycyBvbiB0aGUgcXVldWUuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBzaG91bGQgYmUgY2FsbGVkIG9ubHkgZHVyaW5nIHNpZ25hbCBkaXNwYXRjaCwgY2FsbGluZyBpdCBiZWZvcmUvYWZ0ZXIgZGlzcGF0Y2ggd29uJ3QgYWZmZWN0IHNpZ25hbCBicm9hZGNhc3QuPC9wPlxuICAgICAgICAgKiBAc2VlIFNpZ25hbC5wcm90b3R5cGUuZGlzYWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgaGFsdCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaC9Ccm9hZGNhc3QgU2lnbmFsIHRvIGFsbCBsaXN0ZW5lcnMgYWRkZWQgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgKiBAcGFyYW0gey4uLip9IFtwYXJhbXNdIFBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIGVhY2ggaGFuZGxlci5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3BhdGNoIDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKCEgdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXNBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgICAgIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYmluZGluZ3M7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1lbW9yaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IHBhcmFtc0FycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEgbikge1xuICAgICAgICAgICAgICAgIC8vc2hvdWxkIGNvbWUgYWZ0ZXIgbWVtb3JpemVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJpbmRpbmdzID0gdGhpcy5fYmluZGluZ3Muc2xpY2UoKTsgLy9jbG9uZSBhcnJheSBpbiBjYXNlIGFkZC9yZW1vdmUgaXRlbXMgZHVyaW5nIGRpc3BhdGNoXG4gICAgICAgICAgICB0aGlzLl9zaG91bGRQcm9wYWdhdGUgPSB0cnVlOyAvL2luIGNhc2UgYGhhbHRgIHdhcyBjYWxsZWQgYmVmb3JlIGRpc3BhdGNoIG9yIGR1cmluZyB0aGUgcHJldmlvdXMgZGlzcGF0Y2guXG5cbiAgICAgICAgICAgIC8vZXhlY3V0ZSBhbGwgY2FsbGJhY2tzIHVudGlsIGVuZCBvZiB0aGUgbGlzdCBvciB1bnRpbCBhIGNhbGxiYWNrIHJldHVybnMgYGZhbHNlYCBvciBzdG9wcyBwcm9wYWdhdGlvblxuICAgICAgICAgICAgLy9yZXZlcnNlIGxvb3Agc2luY2UgbGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgYWRkZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdFxuICAgICAgICAgICAgZG8geyBuLS07IH0gd2hpbGUgKGJpbmRpbmdzW25dICYmIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSAmJiBiaW5kaW5nc1tuXS5leGVjdXRlKHBhcmFtc0FycikgIT09IGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9yZ2V0IG1lbW9yaXplZCBhcmd1bWVudHMuXG4gICAgICAgICAqIEBzZWUgU2lnbmFsLm1lbW9yaXplXG4gICAgICAgICAqL1xuICAgICAgICBmb3JnZXQgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgYmluZGluZ3MgZnJvbSBzaWduYWwgYW5kIGRlc3Ryb3kgYW55IHJlZmVyZW5jZSB0byBleHRlcm5hbCBvYmplY3RzIChkZXN0cm95IFNpZ25hbCBvYmplY3QpLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gY2FsbGluZyBhbnkgbWV0aG9kIG9uIHRoZSBzaWduYWwgaW5zdGFuY2UgYWZ0ZXIgY2FsbGluZyBkaXNwb3NlIHdpbGwgdGhyb3cgZXJyb3JzLjwvcD5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3Bvc2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2JpbmRpbmdzO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3ByZXZQYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1NpZ25hbCBhY3RpdmU6JysgdGhpcy5hY3RpdmUgKycgbnVtTGlzdGVuZXJzOicrIHRoaXMuZ2V0TnVtTGlzdGVuZXJzKCkgKyddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4gICAgLy8gTmFtZXNwYWNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBTaWduYWxzIG5hbWVzcGFjZVxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbmFtZSBzaWduYWxzXG4gICAgICovXG4gICAgdmFyIHNpZ25hbHMgPSBTaWduYWw7XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiBAc2VlIFNpZ25hbFxuICAgICAqL1xuICAgIC8vIGFsaWFzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAoc2VlICNnaC00NClcbiAgICBzaWduYWxzLlNpZ25hbCA9IFNpZ25hbDtcblxuXG5cbiAgICAvL2V4cG9ydHMgdG8gbXVsdGlwbGUgZW52aXJvbm1lbnRzXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKXsgLy9BTURcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNpZ25hbHM7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpeyAvL25vZGVcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzaWduYWxzO1xuICAgIH0gZWxzZSB7IC8vYnJvd3NlclxuICAgICAgICAvL3VzZSBzdHJpbmcgYmVjYXVzZSBvZiBHb29nbGUgY2xvc3VyZSBjb21waWxlciBBRFZBTkNFRF9NT0RFXG4gICAgICAgIC8qanNsaW50IHN1Yjp0cnVlICovXG4gICAgICAgIGdsb2JhbFsnc2lnbmFscyddID0gc2lnbmFscztcbiAgICB9XG5cbn0odGhpcykpO1xuIiwiLyoqIVxuICogU29ydGFibGVcbiAqIEBhdXRob3JcdFJ1YmFYYSAgIDx0cmFzaEBydWJheGEub3JnPlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZhY3RvcnkpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBQYWNrYWdlICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0U29ydGFibGUgPSBmYWN0b3J5KCk7ICAvLyBleHBvcnQgZm9yIE1ldGVvci5qc1xuXHR9XG5cdGVsc2Uge1xuXHRcdC8qIGpzaGludCBzdWI6dHJ1ZSAqL1xuXHRcdHdpbmRvd1tcIlNvcnRhYmxlXCJdID0gZmFjdG9yeSgpO1xuXHR9XG59KShmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBkcmFnRWwsXG5cdFx0cGFyZW50RWwsXG5cdFx0Z2hvc3RFbCxcblx0XHRjbG9uZUVsLFxuXHRcdHJvb3RFbCxcblx0XHRuZXh0RWwsXG5cblx0XHRzY3JvbGxFbCxcblx0XHRzY3JvbGxQYXJlbnRFbCxcblxuXHRcdGxhc3RFbCxcblx0XHRsYXN0Q1NTLFxuXHRcdGxhc3RQYXJlbnRDU1MsXG5cblx0XHRvbGRJbmRleCxcblx0XHRuZXdJbmRleCxcblxuXHRcdGFjdGl2ZUdyb3VwLFxuXHRcdGF1dG9TY3JvbGwgPSB7fSxcblxuXHRcdHRhcEV2dCxcblx0XHR0b3VjaEV2dCxcblxuXHRcdG1vdmVkLFxuXG5cdFx0LyoqIEBjb25zdCAqL1xuXHRcdFJTUEFDRSA9IC9cXHMrL2csXG5cblx0XHRleHBhbmRvID0gJ1NvcnRhYmxlJyArIChuZXcgRGF0ZSkuZ2V0VGltZSgpLFxuXG5cdFx0d2luID0gd2luZG93LFxuXHRcdGRvY3VtZW50ID0gd2luLmRvY3VtZW50LFxuXHRcdHBhcnNlSW50ID0gd2luLnBhcnNlSW50LFxuXG5cdFx0c3VwcG9ydERyYWdnYWJsZSA9ICEhKCdkcmFnZ2FibGUnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKSxcblx0XHRzdXBwb3J0Q3NzUG9pbnRlckV2ZW50cyA9IChmdW5jdGlvbiAoZWwpIHtcblx0XHRcdGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpO1xuXHRcdFx0ZWwuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJztcblx0XHRcdHJldHVybiBlbC5zdHlsZS5wb2ludGVyRXZlbnRzID09PSAnYXV0byc7XG5cdFx0fSkoKSxcblxuXHRcdF9zaWxlbnQgPSBmYWxzZSxcblxuXHRcdGFicyA9IE1hdGguYWJzLFxuXHRcdHNsaWNlID0gW10uc2xpY2UsXG5cblx0XHR0b3VjaERyYWdPdmVyTGlzdGVuZXJzID0gW10sXG5cblx0XHRfYXV0b1Njcm9sbCA9IF90aHJvdHRsZShmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCwgLyoqT2JqZWN0Ki9vcHRpb25zLCAvKipIVE1MRWxlbWVudCovcm9vdEVsKSB7XG5cdFx0XHQvLyBCdWc6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwNTUyMVxuXHRcdFx0aWYgKHJvb3RFbCAmJiBvcHRpb25zLnNjcm9sbCkge1xuXHRcdFx0XHR2YXIgZWwsXG5cdFx0XHRcdFx0cmVjdCxcblx0XHRcdFx0XHRzZW5zID0gb3B0aW9ucy5zY3JvbGxTZW5zaXRpdml0eSxcblx0XHRcdFx0XHRzcGVlZCA9IG9wdGlvbnMuc2Nyb2xsU3BlZWQsXG5cblx0XHRcdFx0XHR4ID0gZXZ0LmNsaWVudFgsXG5cdFx0XHRcdFx0eSA9IGV2dC5jbGllbnRZLFxuXG5cdFx0XHRcdFx0d2luV2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCxcblx0XHRcdFx0XHR3aW5IZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQsXG5cblx0XHRcdFx0XHR2eCxcblx0XHRcdFx0XHR2eVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0Ly8gRGVsZWN0IHNjcm9sbEVsXG5cdFx0XHRcdGlmIChzY3JvbGxQYXJlbnRFbCAhPT0gcm9vdEVsKSB7XG5cdFx0XHRcdFx0c2Nyb2xsRWwgPSBvcHRpb25zLnNjcm9sbDtcblx0XHRcdFx0XHRzY3JvbGxQYXJlbnRFbCA9IHJvb3RFbDtcblxuXHRcdFx0XHRcdGlmIChzY3JvbGxFbCA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0c2Nyb2xsRWwgPSByb290RWw7XG5cblx0XHRcdFx0XHRcdGRvIHtcblx0XHRcdFx0XHRcdFx0aWYgKChzY3JvbGxFbC5vZmZzZXRXaWR0aCA8IHNjcm9sbEVsLnNjcm9sbFdpZHRoKSB8fFxuXHRcdFx0XHRcdFx0XHRcdChzY3JvbGxFbC5vZmZzZXRIZWlnaHQgPCBzY3JvbGxFbC5zY3JvbGxIZWlnaHQpXG5cdFx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdC8qIGpzaGludCBib3NzOnRydWUgKi9cblx0XHRcdFx0XHRcdH0gd2hpbGUgKHNjcm9sbEVsID0gc2Nyb2xsRWwucGFyZW50Tm9kZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHNjcm9sbEVsKSB7XG5cdFx0XHRcdFx0ZWwgPSBzY3JvbGxFbDtcblx0XHRcdFx0XHRyZWN0ID0gc2Nyb2xsRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRcdFx0dnggPSAoYWJzKHJlY3QucmlnaHQgLSB4KSA8PSBzZW5zKSAtIChhYnMocmVjdC5sZWZ0IC0geCkgPD0gc2Vucyk7XG5cdFx0XHRcdFx0dnkgPSAoYWJzKHJlY3QuYm90dG9tIC0geSkgPD0gc2VucykgLSAoYWJzKHJlY3QudG9wIC0geSkgPD0gc2Vucyk7XG5cdFx0XHRcdH1cblxuXG5cdFx0XHRcdGlmICghKHZ4IHx8IHZ5KSkge1xuXHRcdFx0XHRcdHZ4ID0gKHdpbldpZHRoIC0geCA8PSBzZW5zKSAtICh4IDw9IHNlbnMpO1xuXHRcdFx0XHRcdHZ5ID0gKHdpbkhlaWdodCAtIHkgPD0gc2VucykgLSAoeSA8PSBzZW5zKTtcblxuXHRcdFx0XHRcdC8qIGpzaGludCBleHByOnRydWUgKi9cblx0XHRcdFx0XHQodnggfHwgdnkpICYmIChlbCA9IHdpbik7XG5cdFx0XHRcdH1cblxuXG5cdFx0XHRcdGlmIChhdXRvU2Nyb2xsLnZ4ICE9PSB2eCB8fCBhdXRvU2Nyb2xsLnZ5ICE9PSB2eSB8fCBhdXRvU2Nyb2xsLmVsICE9PSBlbCkge1xuXHRcdFx0XHRcdGF1dG9TY3JvbGwuZWwgPSBlbDtcblx0XHRcdFx0XHRhdXRvU2Nyb2xsLnZ4ID0gdng7XG5cdFx0XHRcdFx0YXV0b1Njcm9sbC52eSA9IHZ5O1xuXG5cdFx0XHRcdFx0Y2xlYXJJbnRlcnZhbChhdXRvU2Nyb2xsLnBpZCk7XG5cblx0XHRcdFx0XHRpZiAoZWwpIHtcblx0XHRcdFx0XHRcdGF1dG9TY3JvbGwucGlkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoZWwgPT09IHdpbikge1xuXHRcdFx0XHRcdFx0XHRcdHdpbi5zY3JvbGxUbyh3aW4ucGFnZVhPZmZzZXQgKyB2eCAqIHNwZWVkLCB3aW4ucGFnZVlPZmZzZXQgKyB2eSAqIHNwZWVkKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHR2eSAmJiAoZWwuc2Nyb2xsVG9wICs9IHZ5ICogc3BlZWQpO1xuXHRcdFx0XHRcdFx0XHRcdHZ4ICYmIChlbC5zY3JvbGxMZWZ0ICs9IHZ4ICogc3BlZWQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LCAyNCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSwgMzApLFxuXG5cdFx0X3ByZXBhcmVHcm91cCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdFx0XHR2YXIgZ3JvdXAgPSBvcHRpb25zLmdyb3VwO1xuXG5cdFx0XHRpZiAoIWdyb3VwIHx8IHR5cGVvZiBncm91cCAhPSAnb2JqZWN0Jykge1xuXHRcdFx0XHRncm91cCA9IG9wdGlvbnMuZ3JvdXAgPSB7bmFtZTogZ3JvdXB9O1xuXHRcdFx0fVxuXG5cdFx0XHRbJ3B1bGwnLCAncHV0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRcdGlmICghKGtleSBpbiBncm91cCkpIHtcblx0XHRcdFx0XHRncm91cFtrZXldID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdG9wdGlvbnMuZ3JvdXBzID0gJyAnICsgZ3JvdXAubmFtZSArIChncm91cC5wdXQuam9pbiA/ICcgJyArIGdyb3VwLnB1dC5qb2luKCcgJykgOiAnJykgKyAnICc7XG5cdFx0fVxuXHQ7XG5cblxuXG5cdC8qKlxuXHQgKiBAY2xhc3MgIFNvcnRhYmxlXG5cdCAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgZWxcblx0ICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9uc11cblx0ICovXG5cdGZ1bmN0aW9uIFNvcnRhYmxlKGVsLCBvcHRpb25zKSB7XG5cdFx0aWYgKCEoZWwgJiYgZWwubm9kZVR5cGUgJiYgZWwubm9kZVR5cGUgPT09IDEpKSB7XG5cdFx0XHR0aHJvdyAnU29ydGFibGU6IGBlbGAgbXVzdCBiZSBIVE1MRWxlbWVudCwgYW5kIG5vdCAnICsge30udG9TdHJpbmcuY2FsbChlbCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5lbCA9IGVsOyAvLyByb290IGVsZW1lbnRcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gX2V4dGVuZCh7fSwgb3B0aW9ucyk7XG5cblxuXHRcdC8vIEV4cG9ydCBpbnN0YW5jZVxuXHRcdGVsW2V4cGFuZG9dID0gdGhpcztcblxuXG5cdFx0Ly8gRGVmYXVsdCBvcHRpb25zXG5cdFx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdFx0Z3JvdXA6IE1hdGgucmFuZG9tKCksXG5cdFx0XHRzb3J0OiB0cnVlLFxuXHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0c3RvcmU6IG51bGwsXG5cdFx0XHRoYW5kbGU6IG51bGwsXG5cdFx0XHRzY3JvbGw6IHRydWUsXG5cdFx0XHRzY3JvbGxTZW5zaXRpdml0eTogMzAsXG5cdFx0XHRzY3JvbGxTcGVlZDogMTAsXG5cdFx0XHRkcmFnZ2FibGU6IC9bdW9dbC9pLnRlc3QoZWwubm9kZU5hbWUpID8gJ2xpJyA6ICc+KicsXG5cdFx0XHRnaG9zdENsYXNzOiAnc29ydGFibGUtZ2hvc3QnLFxuXHRcdFx0Y2hvc2VuQ2xhc3M6ICdzb3J0YWJsZS1jaG9zZW4nLFxuXHRcdFx0aWdub3JlOiAnYSwgaW1nJyxcblx0XHRcdGZpbHRlcjogbnVsbCxcblx0XHRcdGFuaW1hdGlvbjogMCxcblx0XHRcdHNldERhdGE6IGZ1bmN0aW9uIChkYXRhVHJhbnNmZXIsIGRyYWdFbCkge1xuXHRcdFx0XHRkYXRhVHJhbnNmZXIuc2V0RGF0YSgnVGV4dCcsIGRyYWdFbC50ZXh0Q29udGVudCk7XG5cdFx0XHR9LFxuXHRcdFx0ZHJvcEJ1YmJsZTogZmFsc2UsXG5cdFx0XHRkcmFnb3ZlckJ1YmJsZTogZmFsc2UsXG5cdFx0XHRkYXRhSWRBdHRyOiAnZGF0YS1pZCcsXG5cdFx0XHRkZWxheTogMCxcblx0XHRcdGZvcmNlRmFsbGJhY2s6IGZhbHNlLFxuXHRcdFx0ZmFsbGJhY2tDbGFzczogJ3NvcnRhYmxlLWZhbGxiYWNrJyxcblx0XHRcdGZhbGxiYWNrT25Cb2R5OiBmYWxzZVxuXHRcdH07XG5cblxuXHRcdC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcblx0XHRmb3IgKHZhciBuYW1lIGluIGRlZmF1bHRzKSB7XG5cdFx0XHQhKG5hbWUgaW4gb3B0aW9ucykgJiYgKG9wdGlvbnNbbmFtZV0gPSBkZWZhdWx0c1tuYW1lXSk7XG5cdFx0fVxuXG5cdFx0X3ByZXBhcmVHcm91cChvcHRpb25zKTtcblxuXHRcdC8vIEJpbmQgYWxsIHByaXZhdGUgbWV0aG9kc1xuXHRcdGZvciAodmFyIGZuIGluIHRoaXMpIHtcblx0XHRcdGlmIChmbi5jaGFyQXQoMCkgPT09ICdfJykge1xuXHRcdFx0XHR0aGlzW2ZuXSA9IHRoaXNbZm5dLmJpbmQodGhpcyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gU2V0dXAgZHJhZyBtb2RlXG5cdFx0dGhpcy5uYXRpdmVEcmFnZ2FibGUgPSBvcHRpb25zLmZvcmNlRmFsbGJhY2sgPyBmYWxzZSA6IHN1cHBvcnREcmFnZ2FibGU7XG5cblx0XHQvLyBCaW5kIGV2ZW50c1xuXHRcdF9vbihlbCwgJ21vdXNlZG93bicsIHRoaXMuX29uVGFwU3RhcnQpO1xuXHRcdF9vbihlbCwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblRhcFN0YXJ0KTtcblxuXHRcdGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuXHRcdFx0X29uKGVsLCAnZHJhZ292ZXInLCB0aGlzKTtcblx0XHRcdF9vbihlbCwgJ2RyYWdlbnRlcicsIHRoaXMpO1xuXHRcdH1cblxuXHRcdHRvdWNoRHJhZ092ZXJMaXN0ZW5lcnMucHVzaCh0aGlzLl9vbkRyYWdPdmVyKTtcblxuXHRcdC8vIFJlc3RvcmUgc29ydGluZ1xuXHRcdG9wdGlvbnMuc3RvcmUgJiYgdGhpcy5zb3J0KG9wdGlvbnMuc3RvcmUuZ2V0KHRoaXMpKTtcblx0fVxuXG5cblx0U29ydGFibGUucHJvdG90eXBlID0gLyoqIEBsZW5kcyBTb3J0YWJsZS5wcm90b3R5cGUgKi8ge1xuXHRcdGNvbnN0cnVjdG9yOiBTb3J0YWJsZSxcblxuXHRcdF9vblRhcFN0YXJ0OiBmdW5jdGlvbiAoLyoqIEV2ZW50fFRvdWNoRXZlbnQgKi9ldnQpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXMsXG5cdFx0XHRcdGVsID0gdGhpcy5lbCxcblx0XHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdFx0dHlwZSA9IGV2dC50eXBlLFxuXHRcdFx0XHR0b3VjaCA9IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdLFxuXHRcdFx0XHR0YXJnZXQgPSAodG91Y2ggfHwgZXZ0KS50YXJnZXQsXG5cdFx0XHRcdG9yaWdpbmFsVGFyZ2V0ID0gdGFyZ2V0LFxuXHRcdFx0XHRmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcblxuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ21vdXNlZG93bicgJiYgZXZ0LmJ1dHRvbiAhPT0gMCB8fCBvcHRpb25zLmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybjsgLy8gb25seSBsZWZ0IGJ1dHRvbiBvciBlbmFibGVkXG5cdFx0XHR9XG5cblx0XHRcdHRhcmdldCA9IF9jbG9zZXN0KHRhcmdldCwgb3B0aW9ucy5kcmFnZ2FibGUsIGVsKTtcblxuXHRcdFx0aWYgKCF0YXJnZXQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBnZXQgdGhlIGluZGV4IG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgd2l0aGluIGl0cyBwYXJlbnRcblx0XHRcdG9sZEluZGV4ID0gX2luZGV4KHRhcmdldCk7XG5cblx0XHRcdC8vIENoZWNrIGZpbHRlclxuXHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0aWYgKGZpbHRlci5jYWxsKHRoaXMsIGV2dCwgdGFyZ2V0LCB0aGlzKSkge1xuXHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KF90aGlzLCBvcmlnaW5hbFRhcmdldCwgJ2ZpbHRlcicsIHRhcmdldCwgZWwsIG9sZEluZGV4KTtcblx0XHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRyZXR1cm47IC8vIGNhbmNlbCBkbmRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZmlsdGVyKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlci5zcGxpdCgnLCcpLnNvbWUoZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG5cdFx0XHRcdFx0Y3JpdGVyaWEgPSBfY2xvc2VzdChvcmlnaW5hbFRhcmdldCwgY3JpdGVyaWEudHJpbSgpLCBlbCk7XG5cblx0XHRcdFx0XHRpZiAoY3JpdGVyaWEpIHtcblx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KF90aGlzLCBjcml0ZXJpYSwgJ2ZpbHRlcicsIHRhcmdldCwgZWwsIG9sZEluZGV4KTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKGZpbHRlcikge1xuXHRcdFx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybjsgLy8gY2FuY2VsIGRuZFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYgKG9wdGlvbnMuaGFuZGxlICYmICFfY2xvc2VzdChvcmlnaW5hbFRhcmdldCwgb3B0aW9ucy5oYW5kbGUsIGVsKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0Ly8gUHJlcGFyZSBgZHJhZ3N0YXJ0YFxuXHRcdFx0dGhpcy5fcHJlcGFyZURyYWdTdGFydChldnQsIHRvdWNoLCB0YXJnZXQpO1xuXHRcdH0sXG5cblx0XHRfcHJlcGFyZURyYWdTdGFydDogZnVuY3Rpb24gKC8qKiBFdmVudCAqL2V2dCwgLyoqIFRvdWNoICovdG91Y2gsIC8qKiBIVE1MRWxlbWVudCAqL3RhcmdldCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcyxcblx0XHRcdFx0ZWwgPSBfdGhpcy5lbCxcblx0XHRcdFx0b3B0aW9ucyA9IF90aGlzLm9wdGlvbnMsXG5cdFx0XHRcdG93bmVyRG9jdW1lbnQgPSBlbC5vd25lckRvY3VtZW50LFxuXHRcdFx0XHRkcmFnU3RhcnRGbjtcblxuXHRcdFx0aWYgKHRhcmdldCAmJiAhZHJhZ0VsICYmICh0YXJnZXQucGFyZW50Tm9kZSA9PT0gZWwpKSB7XG5cdFx0XHRcdHRhcEV2dCA9IGV2dDtcblxuXHRcdFx0XHRyb290RWwgPSBlbDtcblx0XHRcdFx0ZHJhZ0VsID0gdGFyZ2V0O1xuXHRcdFx0XHRwYXJlbnRFbCA9IGRyYWdFbC5wYXJlbnROb2RlO1xuXHRcdFx0XHRuZXh0RWwgPSBkcmFnRWwubmV4dFNpYmxpbmc7XG5cdFx0XHRcdGFjdGl2ZUdyb3VwID0gb3B0aW9ucy5ncm91cDtcblxuXHRcdFx0XHRkcmFnU3RhcnRGbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQvLyBEZWxheWVkIGRyYWcgaGFzIGJlZW4gdHJpZ2dlcmVkXG5cdFx0XHRcdFx0Ly8gd2UgY2FuIHJlLWVuYWJsZSB0aGUgZXZlbnRzOiB0b3VjaG1vdmUvbW91c2Vtb3ZlXG5cdFx0XHRcdFx0X3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZygpO1xuXG5cdFx0XHRcdFx0Ly8gTWFrZSB0aGUgZWxlbWVudCBkcmFnZ2FibGVcblx0XHRcdFx0XHRkcmFnRWwuZHJhZ2dhYmxlID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIENob3NlbiBpdGVtXG5cdFx0XHRcdFx0X3RvZ2dsZUNsYXNzKGRyYWdFbCwgX3RoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgdHJ1ZSk7XG5cblx0XHRcdFx0XHQvLyBCaW5kIHRoZSBldmVudHM6IGRyYWdzdGFydC9kcmFnZW5kXG5cdFx0XHRcdFx0X3RoaXMuX3RyaWdnZXJEcmFnU3RhcnQodG91Y2gpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIERpc2FibGUgXCJkcmFnZ2FibGVcIlxuXHRcdFx0XHRvcHRpb25zLmlnbm9yZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG5cdFx0XHRcdFx0X2ZpbmQoZHJhZ0VsLCBjcml0ZXJpYS50cmltKCksIF9kaXNhYmxlRHJhZ2dhYmxlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX29uRHJvcCk7XG5cdFx0XHRcdF9vbihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCBfdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9vbkRyb3ApO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLmRlbGF5KSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIHVzZXIgbW92ZXMgdGhlIHBvaW50ZXIgb3IgbGV0IGdvIHRoZSBjbGljayBvciB0b3VjaFxuXHRcdFx0XHRcdC8vIGJlZm9yZSB0aGUgZGVsYXkgaGFzIGJlZW4gcmVhY2hlZDpcblx0XHRcdFx0XHQvLyBkaXNhYmxlIHRoZSBkZWxheWVkIGRyYWdcblx0XHRcdFx0XHRfb24ob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdFx0XHRfb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuXHRcdFx0XHRcdF9vbihvd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblxuXHRcdFx0XHRcdF90aGlzLl9kcmFnU3RhcnRUaW1lciA9IHNldFRpbWVvdXQoZHJhZ1N0YXJ0Rm4sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRyYWdTdGFydEZuKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2Rpc2FibGVEZWxheWVkRHJhZzogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG93bmVyRG9jdW1lbnQgPSB0aGlzLmVsLm93bmVyRG9jdW1lbnQ7XG5cblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLl9kcmFnU3RhcnRUaW1lcik7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuXHRcdH0sXG5cblx0XHRfdHJpZ2dlckRyYWdTdGFydDogZnVuY3Rpb24gKC8qKiBUb3VjaCAqL3RvdWNoKSB7XG5cdFx0XHRpZiAodG91Y2gpIHtcblx0XHRcdFx0Ly8gVG91Y2ggZGV2aWNlIHN1cHBvcnRcblx0XHRcdFx0dGFwRXZ0ID0ge1xuXHRcdFx0XHRcdHRhcmdldDogZHJhZ0VsLFxuXHRcdFx0XHRcdGNsaWVudFg6IHRvdWNoLmNsaWVudFgsXG5cdFx0XHRcdFx0Y2xpZW50WTogdG91Y2guY2xpZW50WVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHRoaXMuX29uRHJhZ1N0YXJ0KHRhcEV2dCwgJ3RvdWNoJyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICghdGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcblx0XHRcdFx0dGhpcy5fb25EcmFnU3RhcnQodGFwRXZ0LCB0cnVlKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRfb24oZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuXHRcdFx0XHRfb24ocm9vdEVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0d2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2RyYWdTdGFydGVkOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAocm9vdEVsICYmIGRyYWdFbCkge1xuXHRcdFx0XHQvLyBBcHBseSBlZmZlY3Rcblx0XHRcdFx0X3RvZ2dsZUNsYXNzKGRyYWdFbCwgdGhpcy5vcHRpb25zLmdob3N0Q2xhc3MsIHRydWUpO1xuXG5cdFx0XHRcdFNvcnRhYmxlLmFjdGl2ZSA9IHRoaXM7XG5cblx0XHRcdFx0Ly8gRHJhZyBzdGFydCBldmVudFxuXHRcdFx0XHRfZGlzcGF0Y2hFdmVudCh0aGlzLCByb290RWwsICdzdGFydCcsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9lbXVsYXRlRHJhZ092ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh0b3VjaEV2dCkge1xuXHRcdFx0XHRpZiAodGhpcy5fbGFzdFggPT09IHRvdWNoRXZ0LmNsaWVudFggJiYgdGhpcy5fbGFzdFkgPT09IHRvdWNoRXZ0LmNsaWVudFkpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl9sYXN0WCA9IHRvdWNoRXZ0LmNsaWVudFg7XG5cdFx0XHRcdHRoaXMuX2xhc3RZID0gdG91Y2hFdnQuY2xpZW50WTtcblxuXHRcdFx0XHRpZiAoIXN1cHBvcnRDc3NQb2ludGVyRXZlbnRzKSB7XG5cdFx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnZGlzcGxheScsICdub25lJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaEV2dC5jbGllbnRYLCB0b3VjaEV2dC5jbGllbnRZKSxcblx0XHRcdFx0XHRwYXJlbnQgPSB0YXJnZXQsXG5cdFx0XHRcdFx0Z3JvdXBOYW1lID0gJyAnICsgdGhpcy5vcHRpb25zLmdyb3VwLm5hbWUgKyAnJyxcblx0XHRcdFx0XHRpID0gdG91Y2hEcmFnT3Zlckxpc3RlbmVycy5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKHBhcmVudCkge1xuXHRcdFx0XHRcdGRvIHtcblx0XHRcdFx0XHRcdGlmIChwYXJlbnRbZXhwYW5kb10gJiYgcGFyZW50W2V4cGFuZG9dLm9wdGlvbnMuZ3JvdXBzLmluZGV4T2YoZ3JvdXBOYW1lKSA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHRcdFx0XHR0b3VjaERyYWdPdmVyTGlzdGVuZXJzW2ldKHtcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWVudFg6IHRvdWNoRXZ0LmNsaWVudFgsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGllbnRZOiB0b3VjaEV2dC5jbGllbnRZLFxuXHRcdFx0XHRcdFx0XHRcdFx0dGFyZ2V0OiB0YXJnZXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRyb290RWw6IHBhcmVudFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRhcmdldCA9IHBhcmVudDsgLy8gc3RvcmUgbGFzdCBlbGVtZW50XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8qIGpzaGludCBib3NzOnRydWUgKi9cblx0XHRcdFx0XHR3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFzdXBwb3J0Q3NzUG9pbnRlckV2ZW50cykge1xuXHRcdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ2Rpc3BsYXknLCAnJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cblx0XHRfb25Ub3VjaE1vdmU6IGZ1bmN0aW9uICgvKipUb3VjaEV2ZW50Ki9ldnQpIHtcblx0XHRcdGlmICh0YXBFdnQpIHtcblx0XHRcdFx0Ly8gb25seSBzZXQgdGhlIHN0YXR1cyB0byBkcmFnZ2luZywgd2hlbiB3ZSBhcmUgYWN0dWFsbHkgZHJhZ2dpbmdcblx0XHRcdFx0aWYgKCFTb3J0YWJsZS5hY3RpdmUpIHtcblx0XHRcdFx0XHR0aGlzLl9kcmFnU3RhcnRlZCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gYXMgd2VsbCBhcyBjcmVhdGluZyB0aGUgZ2hvc3QgZWxlbWVudCBvbiB0aGUgZG9jdW1lbnQgYm9keVxuXHRcdFx0XHR0aGlzLl9hcHBlbmRHaG9zdCgpO1xuXG5cdFx0XHRcdHZhciB0b3VjaCA9IGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQsXG5cdFx0XHRcdFx0ZHggPSB0b3VjaC5jbGllbnRYIC0gdGFwRXZ0LmNsaWVudFgsXG5cdFx0XHRcdFx0ZHkgPSB0b3VjaC5jbGllbnRZIC0gdGFwRXZ0LmNsaWVudFksXG5cdFx0XHRcdFx0dHJhbnNsYXRlM2QgPSBldnQudG91Y2hlcyA/ICd0cmFuc2xhdGUzZCgnICsgZHggKyAncHgsJyArIGR5ICsgJ3B4LDApJyA6ICd0cmFuc2xhdGUoJyArIGR4ICsgJ3B4LCcgKyBkeSArICdweCknO1xuXG5cdFx0XHRcdG1vdmVkID0gdHJ1ZTtcblx0XHRcdFx0dG91Y2hFdnQgPSB0b3VjaDtcblxuXHRcdFx0XHRfY3NzKGdob3N0RWwsICd3ZWJraXRUcmFuc2Zvcm0nLCB0cmFuc2xhdGUzZCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ21velRyYW5zZm9ybScsIHRyYW5zbGF0ZTNkKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnbXNUcmFuc2Zvcm0nLCB0cmFuc2xhdGUzZCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ3RyYW5zZm9ybScsIHRyYW5zbGF0ZTNkKTtcblxuXHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2FwcGVuZEdob3N0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIWdob3N0RWwpIHtcblx0XHRcdFx0dmFyIHJlY3QgPSBkcmFnRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG5cdFx0XHRcdFx0Y3NzID0gX2NzcyhkcmFnRWwpLFxuXHRcdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdFx0Z2hvc3RSZWN0O1xuXG5cdFx0XHRcdGdob3N0RWwgPSBkcmFnRWwuY2xvbmVOb2RlKHRydWUpO1xuXG5cdFx0XHRcdF90b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmdob3N0Q2xhc3MsIGZhbHNlKTtcblx0XHRcdFx0X3RvZ2dsZUNsYXNzKGdob3N0RWwsIG9wdGlvbnMuZmFsbGJhY2tDbGFzcywgdHJ1ZSk7XG5cblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAndG9wJywgcmVjdC50b3AgLSBwYXJzZUludChjc3MubWFyZ2luVG9wLCAxMCkpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICdsZWZ0JywgcmVjdC5sZWZ0IC0gcGFyc2VJbnQoY3NzLm1hcmdpbkxlZnQsIDEwKSk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ3dpZHRoJywgcmVjdC53aWR0aCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ2hlaWdodCcsIHJlY3QuaGVpZ2h0KTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnb3BhY2l0eScsICcwLjgnKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAncG9zaXRpb24nLCAnZml4ZWQnKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnekluZGV4JywgJzEwMDAwMCcpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICdwb2ludGVyRXZlbnRzJywgJ25vbmUnKTtcblxuXHRcdFx0XHRvcHRpb25zLmZhbGxiYWNrT25Cb2R5ICYmIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZ2hvc3RFbCkgfHwgcm9vdEVsLmFwcGVuZENoaWxkKGdob3N0RWwpO1xuXG5cdFx0XHRcdC8vIEZpeGluZyBkaW1lbnNpb25zLlxuXHRcdFx0XHRnaG9zdFJlY3QgPSBnaG9zdEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICd3aWR0aCcsIHJlY3Qud2lkdGggKiAyIC0gZ2hvc3RSZWN0LndpZHRoKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnaGVpZ2h0JywgcmVjdC5oZWlnaHQgKiAyIC0gZ2hvc3RSZWN0LmhlaWdodCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9vbkRyYWdTdGFydDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQsIC8qKmJvb2xlYW4qL3VzZUZhbGxiYWNrKSB7XG5cdFx0XHR2YXIgZGF0YVRyYW5zZmVyID0gZXZ0LmRhdGFUcmFuc2Zlcixcblx0XHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdFx0dGhpcy5fb2ZmVXBFdmVudHMoKTtcblxuXHRcdFx0aWYgKGFjdGl2ZUdyb3VwLnB1bGwgPT0gJ2Nsb25lJykge1xuXHRcdFx0XHRjbG9uZUVsID0gZHJhZ0VsLmNsb25lTm9kZSh0cnVlKTtcblx0XHRcdFx0X2NzcyhjbG9uZUVsLCAnZGlzcGxheScsICdub25lJyk7XG5cdFx0XHRcdHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgZHJhZ0VsKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVzZUZhbGxiYWNrKSB7XG5cblx0XHRcdFx0aWYgKHVzZUZhbGxiYWNrID09PSAndG91Y2gnKSB7XG5cdFx0XHRcdFx0Ly8gQmluZCB0b3VjaCBldmVudHNcblx0XHRcdFx0XHRfb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG5cdFx0XHRcdFx0X29uKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9vbkRyb3ApO1xuXHRcdFx0XHRcdF9vbihkb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBPbGQgYnJ3b3NlclxuXHRcdFx0XHRcdF9vbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcblx0XHRcdFx0XHRfb24oZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuX2xvb3BJZCA9IHNldEludGVydmFsKHRoaXMuX2VtdWxhdGVEcmFnT3ZlciwgNTApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmIChkYXRhVHJhbnNmZXIpIHtcblx0XHRcdFx0XHRkYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJztcblx0XHRcdFx0XHRvcHRpb25zLnNldERhdGEgJiYgb3B0aW9ucy5zZXREYXRhLmNhbGwodGhpcywgZGF0YVRyYW5zZmVyLCBkcmFnRWwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0X29uKGRvY3VtZW50LCAnZHJvcCcsIHRoaXMpO1xuXHRcdFx0XHRzZXRUaW1lb3V0KHRoaXMuX2RyYWdTdGFydGVkLCAwKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X29uRHJhZ092ZXI6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG5cdFx0XHR2YXIgZWwgPSB0aGlzLmVsLFxuXHRcdFx0XHR0YXJnZXQsXG5cdFx0XHRcdGRyYWdSZWN0LFxuXHRcdFx0XHRyZXZlcnQsXG5cdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdGdyb3VwID0gb3B0aW9ucy5ncm91cCxcblx0XHRcdFx0Z3JvdXBQdXQgPSBncm91cC5wdXQsXG5cdFx0XHRcdGlzT3duZXIgPSAoYWN0aXZlR3JvdXAgPT09IGdyb3VwKSxcblx0XHRcdFx0Y2FuU29ydCA9IG9wdGlvbnMuc29ydDtcblxuXHRcdFx0aWYgKGV2dC5wcmV2ZW50RGVmYXVsdCAhPT0gdm9pZCAwKSB7XG5cdFx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHQhb3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9XG5cblx0XHRcdG1vdmVkID0gdHJ1ZTtcblxuXHRcdFx0aWYgKGFjdGl2ZUdyb3VwICYmICFvcHRpb25zLmRpc2FibGVkICYmXG5cdFx0XHRcdChpc093bmVyXG5cdFx0XHRcdFx0PyBjYW5Tb3J0IHx8IChyZXZlcnQgPSAhcm9vdEVsLmNvbnRhaW5zKGRyYWdFbCkpIC8vIFJldmVydGluZyBpdGVtIGludG8gdGhlIG9yaWdpbmFsIGxpc3Rcblx0XHRcdFx0XHQ6IGFjdGl2ZUdyb3VwLnB1bGwgJiYgZ3JvdXBQdXQgJiYgKFxuXHRcdFx0XHRcdFx0KGFjdGl2ZUdyb3VwLm5hbWUgPT09IGdyb3VwLm5hbWUpIHx8IC8vIGJ5IE5hbWVcblx0XHRcdFx0XHRcdChncm91cFB1dC5pbmRleE9mICYmIH5ncm91cFB1dC5pbmRleE9mKGFjdGl2ZUdyb3VwLm5hbWUpKSAvLyBieSBBcnJheVxuXHRcdFx0XHRcdClcblx0XHRcdFx0KSAmJlxuXHRcdFx0XHQoZXZ0LnJvb3RFbCA9PT0gdm9pZCAwIHx8IGV2dC5yb290RWwgPT09IHRoaXMuZWwpIC8vIHRvdWNoIGZhbGxiYWNrXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gU21hcnQgYXV0by1zY3JvbGxpbmdcblx0XHRcdFx0X2F1dG9TY3JvbGwoZXZ0LCBvcHRpb25zLCB0aGlzLmVsKTtcblxuXHRcdFx0XHRpZiAoX3NpbGVudCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldCA9IF9jbG9zZXN0KGV2dC50YXJnZXQsIG9wdGlvbnMuZHJhZ2dhYmxlLCBlbCk7XG5cdFx0XHRcdGRyYWdSZWN0ID0gZHJhZ0VsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0XHRcdGlmIChyZXZlcnQpIHtcblx0XHRcdFx0XHRfY2xvbmVIaWRlKHRydWUpO1xuXG5cdFx0XHRcdFx0aWYgKGNsb25lRWwgfHwgbmV4dEVsKSB7XG5cdFx0XHRcdFx0XHRyb290RWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgY2xvbmVFbCB8fCBuZXh0RWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICghY2FuU29ydCkge1xuXHRcdFx0XHRcdFx0cm9vdEVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRpZiAoKGVsLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgfHwgKGVsLmNoaWxkcmVuWzBdID09PSBnaG9zdEVsKSB8fFxuXHRcdFx0XHRcdChlbCA9PT0gZXZ0LnRhcmdldCkgJiYgKHRhcmdldCA9IF9naG9zdElzTGFzdChlbCwgZXZ0KSlcblx0XHRcdFx0KSB7XG5cblx0XHRcdFx0XHRpZiAodGFyZ2V0KSB7XG5cdFx0XHRcdFx0XHRpZiAodGFyZ2V0LmFuaW1hdGVkKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfY2xvbmVIaWRlKGlzT3duZXIpO1xuXG5cdFx0XHRcdFx0aWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0KSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdGlmICghZHJhZ0VsLmNvbnRhaW5zKGVsKSkge1xuXHRcdFx0XHRcdFx0XHRlbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbCA9IGVsOyAvLyBhY3R1YWxpemF0aW9uXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMuX2FuaW1hdGUoZHJhZ1JlY3QsIGRyYWdFbCk7XG5cdFx0XHRcdFx0XHR0YXJnZXQgJiYgdGhpcy5fYW5pbWF0ZSh0YXJnZXRSZWN0LCB0YXJnZXQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICh0YXJnZXQgJiYgIXRhcmdldC5hbmltYXRlZCAmJiB0YXJnZXQgIT09IGRyYWdFbCAmJiAodGFyZ2V0LnBhcmVudE5vZGVbZXhwYW5kb10gIT09IHZvaWQgMCkpIHtcblx0XHRcdFx0XHRpZiAobGFzdEVsICE9PSB0YXJnZXQpIHtcblx0XHRcdFx0XHRcdGxhc3RFbCA9IHRhcmdldDtcblx0XHRcdFx0XHRcdGxhc3RDU1MgPSBfY3NzKHRhcmdldCk7XG5cdFx0XHRcdFx0XHRsYXN0UGFyZW50Q1NTID0gX2Nzcyh0YXJnZXQucGFyZW50Tm9kZSk7XG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcblx0XHRcdFx0XHRcdHdpZHRoID0gdGFyZ2V0UmVjdC5yaWdodCAtIHRhcmdldFJlY3QubGVmdCxcblx0XHRcdFx0XHRcdGhlaWdodCA9IHRhcmdldFJlY3QuYm90dG9tIC0gdGFyZ2V0UmVjdC50b3AsXG5cdFx0XHRcdFx0XHRmbG9hdGluZyA9IC9sZWZ0fHJpZ2h0fGlubGluZS8udGVzdChsYXN0Q1NTLmNzc0Zsb2F0ICsgbGFzdENTUy5kaXNwbGF5KVxuXHRcdFx0XHRcdFx0XHR8fCAobGFzdFBhcmVudENTUy5kaXNwbGF5ID09ICdmbGV4JyAmJiBsYXN0UGFyZW50Q1NTWydmbGV4LWRpcmVjdGlvbiddLmluZGV4T2YoJ3JvdycpID09PSAwKSxcblx0XHRcdFx0XHRcdGlzV2lkZSA9ICh0YXJnZXQub2Zmc2V0V2lkdGggPiBkcmFnRWwub2Zmc2V0V2lkdGgpLFxuXHRcdFx0XHRcdFx0aXNMb25nID0gKHRhcmdldC5vZmZzZXRIZWlnaHQgPiBkcmFnRWwub2Zmc2V0SGVpZ2h0KSxcblx0XHRcdFx0XHRcdGhhbGZ3YXkgPSAoZmxvYXRpbmcgPyAoZXZ0LmNsaWVudFggLSB0YXJnZXRSZWN0LmxlZnQpIC8gd2lkdGggOiAoZXZ0LmNsaWVudFkgLSB0YXJnZXRSZWN0LnRvcCkgLyBoZWlnaHQpID4gMC41LFxuXHRcdFx0XHRcdFx0bmV4dFNpYmxpbmcgPSB0YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nLFxuXHRcdFx0XHRcdFx0bW92ZVZlY3RvciA9IF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0KSxcblx0XHRcdFx0XHRcdGFmdGVyXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0aWYgKG1vdmVWZWN0b3IgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0XHRfc2lsZW50ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoX3Vuc2lsZW50LCAzMCk7XG5cblx0XHRcdFx0XHRcdF9jbG9uZUhpZGUoaXNPd25lcik7XG5cblx0XHRcdFx0XHRcdGlmIChtb3ZlVmVjdG9yID09PSAxIHx8IG1vdmVWZWN0b3IgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdGFmdGVyID0gKG1vdmVWZWN0b3IgPT09IDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoZmxvYXRpbmcpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGVsVG9wID0gZHJhZ0VsLm9mZnNldFRvcCxcblx0XHRcdFx0XHRcdFx0XHR0Z1RvcCA9IHRhcmdldC5vZmZzZXRUb3A7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGVsVG9wID09PSB0Z1RvcCkge1xuXHRcdFx0XHRcdFx0XHRcdGFmdGVyID0gKHRhcmdldC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nID09PSBkcmFnRWwpICYmICFpc1dpZGUgfHwgaGFsZndheSAmJiBpc1dpZGU7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YWZ0ZXIgPSB0Z1RvcCA+IGVsVG9wO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRhZnRlciA9IChuZXh0U2libGluZyAhPT0gZHJhZ0VsKSAmJiAhaXNMb25nIHx8IGhhbGZ3YXkgJiYgaXNMb25nO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWRyYWdFbC5jb250YWlucyhlbCkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGFmdGVyICYmICFuZXh0U2libGluZykge1xuXHRcdFx0XHRcdFx0XHRcdGVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgYWZ0ZXIgPyBuZXh0U2libGluZyA6IHRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cGFyZW50RWwgPSBkcmFnRWwucGFyZW50Tm9kZTsgLy8gYWN0dWFsaXphdGlvblxuXG5cdFx0XHRcdFx0XHR0aGlzLl9hbmltYXRlKGRyYWdSZWN0LCBkcmFnRWwpO1xuXHRcdFx0XHRcdFx0dGhpcy5fYW5pbWF0ZSh0YXJnZXRSZWN0LCB0YXJnZXQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRfYW5pbWF0ZTogZnVuY3Rpb24gKHByZXZSZWN0LCB0YXJnZXQpIHtcblx0XHRcdHZhciBtcyA9IHRoaXMub3B0aW9ucy5hbmltYXRpb247XG5cblx0XHRcdGlmIChtcykge1xuXHRcdFx0XHR2YXIgY3VycmVudFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJ1xuXHRcdFx0XHRcdCsgKHByZXZSZWN0LmxlZnQgLSBjdXJyZW50UmVjdC5sZWZ0KSArICdweCwnXG5cdFx0XHRcdFx0KyAocHJldlJlY3QudG9wIC0gY3VycmVudFJlY3QudG9wKSArICdweCwwKSdcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0YXJnZXQub2Zmc2V0V2lkdGg7IC8vIHJlcGFpbnRcblxuXHRcdFx0XHRfY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnYWxsICcgKyBtcyArICdtcycpO1xuXHRcdFx0XHRfY3NzKHRhcmdldCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUzZCgwLDAsMCknKTtcblxuXHRcdFx0XHRjbGVhclRpbWVvdXQodGFyZ2V0LmFuaW1hdGVkKTtcblx0XHRcdFx0dGFyZ2V0LmFuaW1hdGVkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2l0aW9uJywgJycpO1xuXHRcdFx0XHRcdF9jc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJycpO1xuXHRcdFx0XHRcdHRhcmdldC5hbmltYXRlZCA9IGZhbHNlO1xuXHRcdFx0XHR9LCBtcyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9vZmZVcEV2ZW50czogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG93bmVyRG9jdW1lbnQgPSB0aGlzLmVsLm93bmVyRG9jdW1lbnQ7XG5cblx0XHRcdF9vZmYoZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcblx0XHR9LFxuXG5cdFx0X29uRHJvcDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcblx0XHRcdHZhciBlbCA9IHRoaXMuZWwsXG5cdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cblx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fbG9vcElkKTtcblx0XHRcdGNsZWFySW50ZXJ2YWwoYXV0b1Njcm9sbC5waWQpO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcblxuXHRcdFx0Ly8gVW5iaW5kIGV2ZW50c1xuXHRcdFx0X29mZihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcblxuXHRcdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRcdF9vZmYoZG9jdW1lbnQsICdkcm9wJywgdGhpcyk7XG5cdFx0XHRcdF9vZmYoZWwsICdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdTdGFydCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX29mZlVwRXZlbnRzKCk7XG5cblx0XHRcdGlmIChldnQpIHtcblx0XHRcdFx0aWYgKG1vdmVkKSB7XG5cdFx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0IW9wdGlvbnMuZHJvcEJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRnaG9zdEVsICYmIGdob3N0RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChnaG9zdEVsKTtcblxuXHRcdFx0XHRpZiAoZHJhZ0VsKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRcdFx0XHRfb2ZmKGRyYWdFbCwgJ2RyYWdlbmQnLCB0aGlzKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfZGlzYWJsZURyYWdnYWJsZShkcmFnRWwpO1xuXG5cdFx0XHRcdFx0Ly8gUmVtb3ZlIGNsYXNzJ3Ncblx0XHRcdFx0XHRfdG9nZ2xlQ2xhc3MoZHJhZ0VsLCB0aGlzLm9wdGlvbnMuZ2hvc3RDbGFzcywgZmFsc2UpO1xuXHRcdFx0XHRcdF90b2dnbGVDbGFzcyhkcmFnRWwsIHRoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgZmFsc2UpO1xuXG5cdFx0XHRcdFx0aWYgKHJvb3RFbCAhPT0gcGFyZW50RWwpIHtcblx0XHRcdFx0XHRcdG5ld0luZGV4ID0gX2luZGV4KGRyYWdFbCk7XG5cblx0XHRcdFx0XHRcdGlmIChuZXdJbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0XHRcdC8vIGRyYWcgZnJvbSBvbmUgbGlzdCBhbmQgZHJvcCBpbnRvIGFub3RoZXJcblx0XHRcdFx0XHRcdFx0X2Rpc3BhdGNoRXZlbnQobnVsbCwgcGFyZW50RWwsICdzb3J0JywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KHRoaXMsIHJvb3RFbCwgJ3NvcnQnLCBkcmFnRWwsIHJvb3RFbCwgb2xkSW5kZXgsIG5ld0luZGV4KTtcblxuXHRcdFx0XHRcdFx0XHQvLyBBZGQgZXZlbnRcblx0XHRcdFx0XHRcdFx0X2Rpc3BhdGNoRXZlbnQobnVsbCwgcGFyZW50RWwsICdhZGQnLCBkcmFnRWwsIHJvb3RFbCwgb2xkSW5kZXgsIG5ld0luZGV4KTtcblxuXHRcdFx0XHRcdFx0XHQvLyBSZW1vdmUgZXZlbnRcblx0XHRcdFx0XHRcdFx0X2Rpc3BhdGNoRXZlbnQodGhpcywgcm9vdEVsLCAncmVtb3ZlJywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gUmVtb3ZlIGNsb25lXG5cdFx0XHRcdFx0XHRjbG9uZUVsICYmIGNsb25lRWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbG9uZUVsKTtcblxuXHRcdFx0XHRcdFx0aWYgKGRyYWdFbC5uZXh0U2libGluZyAhPT0gbmV4dEVsKSB7XG5cdFx0XHRcdFx0XHRcdC8vIEdldCB0aGUgaW5kZXggb2YgdGhlIGRyYWdnZWQgZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudFxuXHRcdFx0XHRcdFx0XHRuZXdJbmRleCA9IF9pbmRleChkcmFnRWwpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChuZXdJbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gZHJhZyAmIGRyb3Agd2l0aGluIHRoZSBzYW1lIGxpc3Rcblx0XHRcdFx0XHRcdFx0XHRfZGlzcGF0Y2hFdmVudCh0aGlzLCByb290RWwsICd1cGRhdGUnLCBkcmFnRWwsIHJvb3RFbCwgb2xkSW5kZXgsIG5ld0luZGV4KTtcblx0XHRcdFx0XHRcdFx0XHRfZGlzcGF0Y2hFdmVudCh0aGlzLCByb290RWwsICdzb3J0JywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoU29ydGFibGUuYWN0aXZlKSB7XG5cdFx0XHRcdFx0XHRpZiAobmV3SW5kZXggPT09IG51bGwgfHwgbmV3SW5kZXggPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdG5ld0luZGV4ID0gb2xkSW5kZXg7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KHRoaXMsIHJvb3RFbCwgJ2VuZCcsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCwgbmV3SW5kZXgpO1xuXG5cdFx0XHRcdFx0XHQvLyBTYXZlIHNvcnRpbmdcblx0XHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE51bGxpbmdcblx0XHRcdFx0cm9vdEVsID1cblx0XHRcdFx0ZHJhZ0VsID1cblx0XHRcdFx0cGFyZW50RWwgPVxuXHRcdFx0XHRnaG9zdEVsID1cblx0XHRcdFx0bmV4dEVsID1cblx0XHRcdFx0Y2xvbmVFbCA9XG5cblx0XHRcdFx0c2Nyb2xsRWwgPVxuXHRcdFx0XHRzY3JvbGxQYXJlbnRFbCA9XG5cblx0XHRcdFx0dGFwRXZ0ID1cblx0XHRcdFx0dG91Y2hFdnQgPVxuXG5cdFx0XHRcdG1vdmVkID1cblx0XHRcdFx0bmV3SW5kZXggPVxuXG5cdFx0XHRcdGxhc3RFbCA9XG5cdFx0XHRcdGxhc3RDU1MgPVxuXG5cdFx0XHRcdGFjdGl2ZUdyb3VwID1cblx0XHRcdFx0U29ydGFibGUuYWN0aXZlID0gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXG5cblx0XHRoYW5kbGVFdmVudDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcblx0XHRcdHZhciB0eXBlID0gZXZ0LnR5cGU7XG5cblx0XHRcdGlmICh0eXBlID09PSAnZHJhZ292ZXInIHx8IHR5cGUgPT09ICdkcmFnZW50ZXInKSB7XG5cdFx0XHRcdGlmIChkcmFnRWwpIHtcblx0XHRcdFx0XHR0aGlzLl9vbkRyYWdPdmVyKGV2dCk7XG5cdFx0XHRcdFx0X2dsb2JhbERyYWdPdmVyKGV2dCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGUgPT09ICdkcm9wJyB8fCB0eXBlID09PSAnZHJhZ2VuZCcpIHtcblx0XHRcdFx0dGhpcy5fb25Ecm9wKGV2dCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogU2VyaWFsaXplcyB0aGUgaXRlbSBpbnRvIGFuIGFycmF5IG9mIHN0cmluZy5cblx0XHQgKiBAcmV0dXJucyB7U3RyaW5nW119XG5cdFx0ICovXG5cdFx0dG9BcnJheTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG9yZGVyID0gW10sXG5cdFx0XHRcdGVsLFxuXHRcdFx0XHRjaGlsZHJlbiA9IHRoaXMuZWwuY2hpbGRyZW4sXG5cdFx0XHRcdGkgPSAwLFxuXHRcdFx0XHRuID0gY2hpbGRyZW4ubGVuZ3RoLFxuXHRcdFx0XHRvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG5cdFx0XHRmb3IgKDsgaSA8IG47IGkrKykge1xuXHRcdFx0XHRlbCA9IGNoaWxkcmVuW2ldO1xuXHRcdFx0XHRpZiAoX2Nsb3Nlc3QoZWwsIG9wdGlvbnMuZHJhZ2dhYmxlLCB0aGlzLmVsKSkge1xuXHRcdFx0XHRcdG9yZGVyLnB1c2goZWwuZ2V0QXR0cmlidXRlKG9wdGlvbnMuZGF0YUlkQXR0cikgfHwgX2dlbmVyYXRlSWQoZWwpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gb3JkZXI7XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogU29ydHMgdGhlIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgYXJyYXkuXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nW119ICBvcmRlciAgb3JkZXIgb2YgdGhlIGl0ZW1zXG5cdFx0ICovXG5cdFx0c29ydDogZnVuY3Rpb24gKG9yZGVyKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSB7fSwgcm9vdEVsID0gdGhpcy5lbDtcblxuXHRcdFx0dGhpcy50b0FycmF5KCkuZm9yRWFjaChmdW5jdGlvbiAoaWQsIGkpIHtcblx0XHRcdFx0dmFyIGVsID0gcm9vdEVsLmNoaWxkcmVuW2ldO1xuXG5cdFx0XHRcdGlmIChfY2xvc2VzdChlbCwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgcm9vdEVsKSkge1xuXHRcdFx0XHRcdGl0ZW1zW2lkXSA9IGVsO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0b3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcblx0XHRcdFx0aWYgKGl0ZW1zW2lkXSkge1xuXHRcdFx0XHRcdHJvb3RFbC5yZW1vdmVDaGlsZChpdGVtc1tpZF0pO1xuXHRcdFx0XHRcdHJvb3RFbC5hcHBlbmRDaGlsZChpdGVtc1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cblx0XHQvKipcblx0XHQgKiBTYXZlIHRoZSBjdXJyZW50IHNvcnRpbmdcblx0XHQgKi9cblx0XHRzYXZlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc3RvcmUgPSB0aGlzLm9wdGlvbnMuc3RvcmU7XG5cdFx0XHRzdG9yZSAmJiBzdG9yZS5zZXQodGhpcyk7XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogRm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0LCBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzZWxlY3RvciBieSB0ZXN0aW5nIHRoZSBlbGVtZW50IGl0c2VsZiBhbmQgdHJhdmVyc2luZyB1cCB0aHJvdWdoIGl0cyBhbmNlc3RvcnMgaW4gdGhlIERPTSB0cmVlLlxuXHRcdCAqIEBwYXJhbSAgIHtIVE1MRWxlbWVudH0gIGVsXG5cdFx0ICogQHBhcmFtICAge1N0cmluZ30gICAgICAgW3NlbGVjdG9yXSAgZGVmYXVsdDogYG9wdGlvbnMuZHJhZ2dhYmxlYFxuXHRcdCAqIEByZXR1cm5zIHtIVE1MRWxlbWVudHxudWxsfVxuXHRcdCAqL1xuXHRcdGNsb3Nlc3Q6IGZ1bmN0aW9uIChlbCwgc2VsZWN0b3IpIHtcblx0XHRcdHJldHVybiBfY2xvc2VzdChlbCwgc2VsZWN0b3IgfHwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5lbCk7XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogU2V0L2dldCBvcHRpb25cblx0XHQgKiBAcGFyYW0gICB7c3RyaW5nfSBuYW1lXG5cdFx0ICogQHBhcmFtICAgeyp9ICAgICAgW3ZhbHVlXVxuXHRcdCAqIEByZXR1cm5zIHsqfVxuXHRcdCAqL1xuXHRcdG9wdGlvbjogZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG5cdFx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdFx0aWYgKHZhbHVlID09PSB2b2lkIDApIHtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnNbbmFtZV07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvcHRpb25zW25hbWVdID0gdmFsdWU7XG5cblx0XHRcdFx0aWYgKG5hbWUgPT09ICdncm91cCcpIHtcblx0XHRcdFx0XHRfcHJlcGFyZUdyb3VwKG9wdGlvbnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogRGVzdHJveVxuXHRcdCAqL1xuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBlbCA9IHRoaXMuZWw7XG5cblx0XHRcdGVsW2V4cGFuZG9dID0gbnVsbDtcblxuXHRcdFx0X29mZihlbCwgJ21vdXNlZG93bicsIHRoaXMuX29uVGFwU3RhcnQpO1xuXHRcdFx0X29mZihlbCwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblRhcFN0YXJ0KTtcblxuXHRcdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRcdF9vZmYoZWwsICdkcmFnb3ZlcicsIHRoaXMpO1xuXHRcdFx0XHRfb2ZmKGVsLCAnZHJhZ2VudGVyJywgdGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlbW92ZSBkcmFnZ2FibGUgYXR0cmlidXRlc1xuXHRcdFx0QXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZHJhZ2dhYmxlXScpLCBmdW5jdGlvbiAoZWwpIHtcblx0XHRcdFx0ZWwucmVtb3ZlQXR0cmlidXRlKCdkcmFnZ2FibGUnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0b3VjaERyYWdPdmVyTGlzdGVuZXJzLnNwbGljZSh0b3VjaERyYWdPdmVyTGlzdGVuZXJzLmluZGV4T2YodGhpcy5fb25EcmFnT3ZlciksIDEpO1xuXG5cdFx0XHR0aGlzLl9vbkRyb3AoKTtcblxuXHRcdFx0dGhpcy5lbCA9IGVsID0gbnVsbDtcblx0XHR9XG5cdH07XG5cblxuXHRmdW5jdGlvbiBfY2xvbmVIaWRlKHN0YXRlKSB7XG5cdFx0aWYgKGNsb25lRWwgJiYgKGNsb25lRWwuc3RhdGUgIT09IHN0YXRlKSkge1xuXHRcdFx0X2NzcyhjbG9uZUVsLCAnZGlzcGxheScsIHN0YXRlID8gJ25vbmUnIDogJycpO1xuXHRcdFx0IXN0YXRlICYmIGNsb25lRWwuc3RhdGUgJiYgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZUVsLCBkcmFnRWwpO1xuXHRcdFx0Y2xvbmVFbC5zdGF0ZSA9IHN0YXRlO1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gX2Nsb3Nlc3QoLyoqSFRNTEVsZW1lbnQqL2VsLCAvKipTdHJpbmcqL3NlbGVjdG9yLCAvKipIVE1MRWxlbWVudCovY3R4KSB7XG5cdFx0aWYgKGVsKSB7XG5cdFx0XHRjdHggPSBjdHggfHwgZG9jdW1lbnQ7XG5cdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCcuJyk7XG5cblx0XHRcdHZhciB0YWcgPSBzZWxlY3Rvci5zaGlmdCgpLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdHJlID0gbmV3IFJlZ0V4cCgnXFxcXHMoJyArIHNlbGVjdG9yLmpvaW4oJ3wnKSArICcpKD89XFxcXHMpJywgJ2cnKTtcblxuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0KHRhZyA9PT0gJz4qJyAmJiBlbC5wYXJlbnROb2RlID09PSBjdHgpIHx8IChcblx0XHRcdFx0XHRcdCh0YWcgPT09ICcnIHx8IGVsLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPT0gdGFnKSAmJlxuXHRcdFx0XHRcdFx0KCFzZWxlY3Rvci5sZW5ndGggfHwgKCgnICcgKyBlbC5jbGFzc05hbWUgKyAnICcpLm1hdGNoKHJlKSB8fCBbXSkubGVuZ3RoID09IHNlbGVjdG9yLmxlbmd0aClcblx0XHRcdFx0XHQpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJldHVybiBlbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0d2hpbGUgKGVsICE9PSBjdHggJiYgKGVsID0gZWwucGFyZW50Tm9kZSkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBfZ2xvYmFsRHJhZ092ZXIoLyoqRXZlbnQqL2V2dCkge1xuXHRcdGlmIChldnQuZGF0YVRyYW5zZmVyKSB7XG5cdFx0XHRldnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnbW92ZSc7XG5cdFx0fVxuXHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBfb24oZWwsIGV2ZW50LCBmbikge1xuXHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCBmYWxzZSk7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9vZmYoZWwsIGV2ZW50LCBmbikge1xuXHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCBmYWxzZSk7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF90b2dnbGVDbGFzcyhlbCwgbmFtZSwgc3RhdGUpIHtcblx0XHRpZiAoZWwpIHtcblx0XHRcdGlmIChlbC5jbGFzc0xpc3QpIHtcblx0XHRcdFx0ZWwuY2xhc3NMaXN0W3N0YXRlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dmFyIGNsYXNzTmFtZSA9ICgnICcgKyBlbC5jbGFzc05hbWUgKyAnICcpLnJlcGxhY2UoUlNQQUNFLCAnICcpLnJlcGxhY2UoJyAnICsgbmFtZSArICcgJywgJyAnKTtcblx0XHRcdFx0ZWwuY2xhc3NOYW1lID0gKGNsYXNzTmFtZSArIChzdGF0ZSA/ICcgJyArIG5hbWUgOiAnJykpLnJlcGxhY2UoUlNQQUNFLCAnICcpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gX2NzcyhlbCwgcHJvcCwgdmFsKSB7XG5cdFx0dmFyIHN0eWxlID0gZWwgJiYgZWwuc3R5bGU7XG5cblx0XHRpZiAoc3R5bGUpIHtcblx0XHRcdGlmICh2YWwgPT09IHZvaWQgMCkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuXHRcdFx0XHRcdHZhbCA9IGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChlbC5jdXJyZW50U3R5bGUpIHtcblx0XHRcdFx0XHR2YWwgPSBlbC5jdXJyZW50U3R5bGU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcHJvcCA9PT0gdm9pZCAwID8gdmFsIDogdmFsW3Byb3BdO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmICghKHByb3AgaW4gc3R5bGUpKSB7XG5cdFx0XHRcdFx0cHJvcCA9ICctd2Via2l0LScgKyBwcm9wO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3R5bGVbcHJvcF0gPSB2YWwgKyAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgPyAnJyA6ICdweCcpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gX2ZpbmQoY3R4LCB0YWdOYW1lLCBpdGVyYXRvcikge1xuXHRcdGlmIChjdHgpIHtcblx0XHRcdHZhciBsaXN0ID0gY3R4LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpLCBpID0gMCwgbiA9IGxpc3QubGVuZ3RoO1xuXG5cdFx0XHRpZiAoaXRlcmF0b3IpIHtcblx0XHRcdFx0Zm9yICg7IGkgPCBuOyBpKyspIHtcblx0XHRcdFx0XHRpdGVyYXRvcihsaXN0W2ldLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbGlzdDtcblx0XHR9XG5cblx0XHRyZXR1cm4gW107XG5cdH1cblxuXG5cblx0ZnVuY3Rpb24gX2Rpc3BhdGNoRXZlbnQoc29ydGFibGUsIHJvb3RFbCwgbmFtZSwgdGFyZ2V0RWwsIGZyb21FbCwgc3RhcnRJbmRleCwgbmV3SW5kZXgpIHtcblx0XHR2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50JyksXG5cdFx0XHRvcHRpb25zID0gKHNvcnRhYmxlIHx8IHJvb3RFbFtleHBhbmRvXSkub3B0aW9ucyxcblx0XHRcdG9uTmFtZSA9ICdvbicgKyBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zdWJzdHIoMSk7XG5cblx0XHRldnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuXG5cdFx0ZXZ0LnRvID0gcm9vdEVsO1xuXHRcdGV2dC5mcm9tID0gZnJvbUVsIHx8IHJvb3RFbDtcblx0XHRldnQuaXRlbSA9IHRhcmdldEVsIHx8IHJvb3RFbDtcblx0XHRldnQuY2xvbmUgPSBjbG9uZUVsO1xuXG5cdFx0ZXZ0Lm9sZEluZGV4ID0gc3RhcnRJbmRleDtcblx0XHRldnQubmV3SW5kZXggPSBuZXdJbmRleDtcblxuXHRcdHJvb3RFbC5kaXNwYXRjaEV2ZW50KGV2dCk7XG5cblx0XHRpZiAob3B0aW9uc1tvbk5hbWVdKSB7XG5cdFx0XHRvcHRpb25zW29uTmFtZV0uY2FsbChzb3J0YWJsZSwgZXZ0KTtcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9vbk1vdmUoZnJvbUVsLCB0b0VsLCBkcmFnRWwsIGRyYWdSZWN0LCB0YXJnZXRFbCwgdGFyZ2V0UmVjdCkge1xuXHRcdHZhciBldnQsXG5cdFx0XHRzb3J0YWJsZSA9IGZyb21FbFtleHBhbmRvXSxcblx0XHRcdG9uTW92ZUZuID0gc29ydGFibGUub3B0aW9ucy5vbk1vdmUsXG5cdFx0XHRyZXRWYWw7XG5cblx0XHRldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRldnQuaW5pdEV2ZW50KCdtb3ZlJywgdHJ1ZSwgdHJ1ZSk7XG5cblx0XHRldnQudG8gPSB0b0VsO1xuXHRcdGV2dC5mcm9tID0gZnJvbUVsO1xuXHRcdGV2dC5kcmFnZ2VkID0gZHJhZ0VsO1xuXHRcdGV2dC5kcmFnZ2VkUmVjdCA9IGRyYWdSZWN0O1xuXHRcdGV2dC5yZWxhdGVkID0gdGFyZ2V0RWwgfHwgdG9FbDtcblx0XHRldnQucmVsYXRlZFJlY3QgPSB0YXJnZXRSZWN0IHx8IHRvRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRmcm9tRWwuZGlzcGF0Y2hFdmVudChldnQpO1xuXG5cdFx0aWYgKG9uTW92ZUZuKSB7XG5cdFx0XHRyZXRWYWwgPSBvbk1vdmVGbi5jYWxsKHNvcnRhYmxlLCBldnQpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXRWYWw7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9kaXNhYmxlRHJhZ2dhYmxlKGVsKSB7XG5cdFx0ZWwuZHJhZ2dhYmxlID0gZmFsc2U7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF91bnNpbGVudCgpIHtcblx0XHRfc2lsZW50ID0gZmFsc2U7XG5cdH1cblxuXG5cdC8qKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8ZmFsc2V9ICovXG5cdGZ1bmN0aW9uIF9naG9zdElzTGFzdChlbCwgZXZ0KSB7XG5cdFx0dmFyIGxhc3RFbCA9IGVsLmxhc3RFbGVtZW50Q2hpbGQsXG5cdFx0XHRcdHJlY3QgPSBsYXN0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRyZXR1cm4gKChldnQuY2xpZW50WSAtIChyZWN0LnRvcCArIHJlY3QuaGVpZ2h0KSA+IDUpIHx8IChldnQuY2xpZW50WCAtIChyZWN0LnJpZ2h0ICsgcmVjdC53aWR0aCkgPiA1KSkgJiYgbGFzdEVsOyAvLyBtaW4gZGVsdGFcblx0fVxuXG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlIGlkXG5cdCAqIEBwYXJhbSAgIHtIVE1MRWxlbWVudH0gZWxcblx0ICogQHJldHVybnMge1N0cmluZ31cblx0ICogQHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIF9nZW5lcmF0ZUlkKGVsKSB7XG5cdFx0dmFyIHN0ciA9IGVsLnRhZ05hbWUgKyBlbC5jbGFzc05hbWUgKyBlbC5zcmMgKyBlbC5ocmVmICsgZWwudGV4dENvbnRlbnQsXG5cdFx0XHRpID0gc3RyLmxlbmd0aCxcblx0XHRcdHN1bSA9IDA7XG5cblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRzdW0gKz0gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHN1bS50b1N0cmluZygzNik7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgaW5kZXggb2YgYW4gZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudFxuXHQgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxcblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0ZnVuY3Rpb24gX2luZGV4KGVsKSB7XG5cdFx0dmFyIGluZGV4ID0gMDtcblxuXHRcdGlmICghZWwgfHwgIWVsLnBhcmVudE5vZGUpIHtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cblx0XHR3aGlsZSAoZWwgJiYgKGVsID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZykpIHtcblx0XHRcdGlmIChlbC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9PSAnVEVNUExBVEUnKSB7XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluZGV4O1xuXHR9XG5cblx0ZnVuY3Rpb24gX3Rocm90dGxlKGNhbGxiYWNrLCBtcykge1xuXHRcdHZhciBhcmdzLCBfdGhpcztcblxuXHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoYXJncyA9PT0gdm9pZCAwKSB7XG5cdFx0XHRcdGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdF90aGlzID0gdGhpcztcblxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwoX3RoaXMsIGFyZ3NbMF0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjay5hcHBseShfdGhpcywgYXJncyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YXJncyA9IHZvaWQgMDtcblx0XHRcdFx0fSwgbXMpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBfZXh0ZW5kKGRzdCwgc3JjKSB7XG5cdFx0aWYgKGRzdCAmJiBzcmMpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBzcmMpIHtcblx0XHRcdFx0aWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0ZHN0W2tleV0gPSBzcmNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBkc3Q7XG5cdH1cblxuXG5cdC8vIEV4cG9ydCB1dGlsc1xuXHRTb3J0YWJsZS51dGlscyA9IHtcblx0XHRvbjogX29uLFxuXHRcdG9mZjogX29mZixcblx0XHRjc3M6IF9jc3MsXG5cdFx0ZmluZDogX2ZpbmQsXG5cdFx0aXM6IGZ1bmN0aW9uIChlbCwgc2VsZWN0b3IpIHtcblx0XHRcdHJldHVybiAhIV9jbG9zZXN0KGVsLCBzZWxlY3RvciwgZWwpO1xuXHRcdH0sXG5cdFx0ZXh0ZW5kOiBfZXh0ZW5kLFxuXHRcdHRocm90dGxlOiBfdGhyb3R0bGUsXG5cdFx0Y2xvc2VzdDogX2Nsb3Nlc3QsXG5cdFx0dG9nZ2xlQ2xhc3M6IF90b2dnbGVDbGFzcyxcblx0XHRpbmRleDogX2luZGV4XG5cdH07XG5cblxuXHQvKipcblx0ICogQ3JlYXRlIHNvcnRhYmxlIGluc3RhbmNlXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9ICBlbFxuXHQgKiBAcGFyYW0ge09iamVjdH0gICAgICBbb3B0aW9uc11cblx0ICovXG5cdFNvcnRhYmxlLmNyZWF0ZSA9IGZ1bmN0aW9uIChlbCwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgU29ydGFibGUoZWwsIG9wdGlvbnMpO1xuXHR9O1xuXG5cblx0Ly8gRXhwb3J0XG5cdFNvcnRhYmxlLnZlcnNpb24gPSAnMS40LjInO1xuXHRyZXR1cm4gU29ydGFibGU7XG59KTtcbiIsImZ1bmN0aW9uIENvbXBvbmVudExvYWRlciAoKSB7XG4gIHRoaXMuY29tcG9uZW50cyA9IG51bGw7XG4gIHRoaXMubG9hZENvbXBvbmVudHNEYXRhKCk7XG59XG5cbkNvbXBvbmVudExvYWRlci5wcm90b3R5cGUgPSB7XG4gIGxvYWRDb21wb25lbnRzRGF0YTogZnVuY3Rpb24gKCkge1xuICAgIHZhciB4aHIgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgLy8gQHRvZG8gUmVtb3ZlIHRoZSBzeW5jIGNhbGwgYW5kIHVzZSBhIGNhbGxiYWNrXG4gICAgeGhyLm9wZW4oJ0dFVCcsICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYWZyYW1ldnIvYWZyYW1lLWNvbXBvbmVudHMvbWFzdGVyL2NvbXBvbmVudHMuanNvbicsIGZhbHNlKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb21wb25lbnRzID0gd2luZG93LkpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICBjb25zb2xlLmluZm8oJ0xvYWRlZCBjb21wb25lbnRzOicsIE9iamVjdC5rZXlzKHRoaXMuY29tcG9uZW50cykubGVuZ3RoKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBwcm9jZXNzIGVycm9yXG4gICAgfTtcbiAgICB4aHIuc2VuZCgpO1xuICB9LFxuICBhZGRDb21wb25lbnRUb1NjZW5lOiBmdW5jdGlvbiAoY29tcG9uZW50TmFtZSwgb25Mb2FkZWQpIHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuICAgIGlmIChjb21wb25lbnQgJiYgIWNvbXBvbmVudC5pbmNsdWRlZCkge1xuICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0LnNyYyA9IGNvbXBvbmVudC51cmw7XG4gICAgICBzY3JpcHQuc2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudC1uYW1lJywgY29tcG9uZW50TmFtZSk7XG4gICAgICBzY3JpcHQuc2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudC1kZXNjcmlwdGlvbicsIGNvbXBvbmVudC5kZXNjcmlwdGlvbik7XG4gICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHNjcmlwdC5vbmxvYWQgPSBudWxsO1xuICAgICAgICBvbkxvYWRlZCgpO1xuICAgICAgfTtcbiAgICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICAgIChoZWFkIHx8IGRvY3VtZW50LmJvZHkpLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cbiAgICAgIHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICBsaW5rLmhyZWYgPSBjb21wb25lbnQudXJsO1xuICAgICAgbGluay50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICAgIGNvbXBvbmVudC5pbmNsdWRlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9uTG9hZGVkKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudExvYWRlcjtcbiIsInZhciBVSSA9IHJlcXVpcmUoJy4uLy4uL2xpYi92ZW5kb3IvdWkuanMnKTsgLy8gQHRvZG8gd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBucG0gcGFja2FnZVxudmFyIHNhbXBsZXMgPSB7XG4gIFwidGV4dHVyZXNcIjogW1xuICAgICc3NThweC1DYW5lc3RyYV9kaV9mcnV0dGFfQ2FyYXZhZ2dpby5qcGcnLFxuICAgICcyMjk0NDcyMzc1XzI0YTNiOGVmNDZfby5qcGcnLFxuICAgICdicmlja19idW1wLmpwZycsXG4gICAgJ2JyaWNrX2RpZmZ1c2UuanBnJyxcbiAgICAnY2hlY2tlcmJvYXJkLmpwZycsXG4gICAgJ2NyYXRlLmdpZicsXG4gICAgJ2Vudm1hcC5wbmcnLFxuICAgICdncmFzc2xpZ2h0LWJpZy5qcGcnLFxuICAgICdzcHJpdGUwLnBuZycsXG4gICAgJ1VWX0dyaWRfU20uanBnJ1xuICBdXG59O1xuXG5mdW5jdGlvbiBHZXRGaWxlbmFtZSh1cmwpIHtcbiAgIGlmICh1cmwpXG4gICB7XG4gICAgICB2YXIgbSA9IHVybC50b1N0cmluZygpLm1hdGNoKC8uKlxcLyguKz8pXFwuLyk7XG4gICAgICBpZiAobSAmJiBtLmxlbmd0aCA+IDEpXG4gICAgICB7XG4gICAgICAgICByZXR1cm4gbVsxXTtcbiAgICAgIH1cbiAgIH1cbiAgIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gQXNzZXRzRGlhbG9nIChlZGl0b3IpIHtcbiAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5QYW5lbCgpO1xuICBjb250YWluZXIuc2V0Q2xhc3MoJ2Fzc2V0cy1kaWFsb2cnKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHZhciB0YWJzID0gbmV3IFVJLkRpdigpO1xuICB0YWJzLnNldElkKCd0YWJzJyk7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0TmV3QXNzZXQodHlwZSwgaWQsIHNyYykge1xuICAgIHZhciBlbGVtZW50ID0gbnVsbDtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ2ltZyc6IHtcbiAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgICBlbGVtZW50LmlkID0gaWQ7XG5cbiAgICAgICAgICBlbGVtZW50LnNyYyA9IHNyYztcbiAgICAgIH0gYnJlYWs7XG4gICAgfVxuICAgIGlmIChlbGVtZW50KVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhLWFzc2V0c1wiKVswXS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluc2VydE9yR2V0QXNzZXQodHlwZSwgc3JjKSB7XG4gICAgdmFyIGlkID0gR2V0RmlsZW5hbWUoc3JjKTtcbiAgICAvLyBTZWFyY2ggZm9yIGFscmVhZHkgbG9hZGVkIGFzc2V0IGJ5IHNyY1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImEtYXNzZXRzID4gaW1nW3NyYz0nXCIgKyBzcmMgKyBcIiddXCIpO1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBpZCA9IGVsZW1lbnQuaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENoZWNrIGlmIGZpcnN0IGNoYXIgb2YgdGhlIElEIGlzIGEgbnVtYmVyIChOb24gYSB2YWxpZCBJRClcbiAgICAgIC8vIEluIHRoYXQgY2FzZSBhICdpJyBwcmVmZml4IHdpbGwgYmUgYWRkZWRcbiAgICAgIGlmICghaXNOYU4ocGFyc2VJbnQoaWRbMF0sIDEwKSkpIHtcbiAgICAgICAgaWQ9J2knICsgaWQ7XG4gICAgICB9XG4gICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKSB7XG4gICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgd2hpbGUgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ18nICsgaSkpIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgaWQgKz0gJ18nICsgaTtcbiAgICAgIH1cbiAgICAgIGluc2VydE5ld0Fzc2V0KCdpbWcnLCBpZCwgc3JjKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICB2YXIgYXNzZXRzVGFiID0gbmV3IFVJLlRleHQoJ0FTU0VUUycpLm9uQ2xpY2sob25DbGljayk7XG4gIHZhciBzYW1wbGVzVGFiID0gbmV3IFVJLlRleHQoJ1NBTVBMRVMnKS5vbkNsaWNrKG9uQ2xpY2spO1xuICB2YXIgbmV3VGFiID0gbmV3IFVJLlRleHQoJ05FVycpLm9uQ2xpY2sob25DbGljayk7XG4gIC8vIHZhciBhc3NldHNUYWIgPSBuZXcgVUkuVGV4dCgnVVBMT0FEJykub25DbGljayhvbkNsaWNrKTtcblxuICB0YWJzLmFkZChhc3NldHNUYWIsIHNhbXBsZXNUYWIsIG5ld1RhYik7XG5cbiAgY29udGFpbmVyLmFkZCh0YWJzKTtcblxuICBmdW5jdGlvbiBvbkNsaWNrIChldmVudCkge1xuICAgIHNlbGVjdChldmVudC50YXJnZXQudGV4dENvbnRlbnQpO1xuICB9XG4gIHZhciBhc3NldHNDb250ZW50ID0gbmV3IFVJLlBhbmVsKCk7XG4gIHZhciBzYW1wbGVzQ29udGVudCA9IG5ldyBVSS5QYW5lbCgpO1xuICB2YXIgbmV3Q29udGVudCA9IG5ldyBVSS5QYW5lbCgpO1xuXG4gIHZhciB0YWJzQ29udGVudCA9IG5ldyBVSS5TcGFuKCkuYWRkKGFzc2V0c0NvbnRlbnQpO1xuICBjb250YWluZXIuYWRkKHRhYnNDb250ZW50KTtcbiAgY29udGFpbmVyLmFkZChzYW1wbGVzQ29udGVudCk7XG4gIGNvbnRhaW5lci5hZGQobmV3Q29udGVudCk7XG5cbiAgZnVuY3Rpb24gZ2V0SW1hZ2VXaWRnZXQodGV4dHVyZSwgbWFwV2lkZ2V0KSB7XG4gICAgdmFyIHJvdyA9IG5ldyBVSS5Sb3coKTtcbiAgICB2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgaW1nLnNyYyA9IHRleHR1cmU7XG4gICAgaW1nLnN0eWxlLndpZHRoID0gJzEwMHB4JztcbiAgICBpbWcuc3R5bGUuaGVpZ2h0ID0gJzEwMHB4JztcbiAgICByb3cuZG9tLmFwcGVuZENoaWxkKGltZyk7XG5cbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHR1cmUpO1xuICAgIHJvdy5kb20uYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2J1dHRvbicpO1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgJ3NlbGVjdCcpO1xuICAgIChmdW5jdGlvbiAoX3RleHR1cmUpIHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBtYXBXaWRnZXQuc2V0VmFsdWUoJyMnK2luc2VydE9yR2V0QXNzZXQoJ2ltZycsX3RleHR1cmUpKTtcbiAgICAgICAgaWYgKG1hcFdpZGdldC5vbkNoYW5nZUNhbGxiYWNrKSB7XG4gICAgICAgICAgbWFwV2lkZ2V0Lm9uQ2hhbmdlQ2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBlZGl0b3Iuc2lnbmFscy5oaWRlTW9kYWwuZGlzcGF0Y2goYXNzZXRzQ29udGVudCk7XG4gICAgICB9KTtcbiAgICB9KSh0ZXh0dXJlKTtcbiAgICByb3cuZG9tLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgcmV0dXJuIHJvdztcbiAgfVxuXG4gIGVkaXRvci5zaWduYWxzLnNob3dBc3NldHNEaWFsb2cuYWRkKGZ1bmN0aW9uIChtYXBXaWRnZXQpIHtcbiAgICAvLyBBc3NldHMgY29udGVudFxuICAgIGFzc2V0c0NvbnRlbnQuY2xlYXIoKTtcbiAgICBmb3IgKHZhciB0ZXh0dXJlIGluIGVkaXRvci5zY2VuZUVsLnN5c3RlbXMubWF0ZXJpYWwudGV4dHVyZUNhY2hlKSB7XG4gICAgICB2YXIgcm93ID0gZ2V0SW1hZ2VXaWRnZXQodGV4dHVyZSwgbWFwV2lkZ2V0KTtcbiAgICAgIGFzc2V0c0NvbnRlbnQuYWRkKHJvdyk7XG4gICAgfVxuXG4gICAgLy8gQXNzZXRzIGNvbnRlbnRcbiAgICBzYW1wbGVzQ29udGVudC5jbGVhcigpO1xuICAgIGZvciAodmFyIGkgaW4gc2FtcGxlc1sndGV4dHVyZXMnXSkge1xuICAgICAgdmFyIHJvdyA9IGdldEltYWdlV2lkZ2V0KCcuLi9hc3NldHMvdGV4dHVyZXMvJytzYW1wbGVzWyd0ZXh0dXJlcyddW2ldLCBtYXBXaWRnZXQpO1xuICAgICAgc2FtcGxlc0NvbnRlbnQuYWRkKHJvdyk7XG4gICAgfVxuXG4gICAgLy8gTmV3IGNvbnRlbnRcbiAgICAvLyBBZGQgbmV3IElEXG4gICAgbmV3Q29udGVudC5jbGVhcigpO1xuICAgIHZhciBuZXdVcmwgPSBuZXcgVUkuSW5wdXQoJycpLnNldFdpZHRoKCcxNTBweCcpLnNldEZvbnRTaXplKCcxMnB4Jykub25DaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gaGFuZGxlRW50aXR5Q2hhbmdlKGVkaXRvci5zZWxlY3RlZC5lbCwgJ2lkJywgbnVsbCwgbmV3VXJsLmdldFZhbHVlKCkpO1xuICAgICAgLy8gZWRpdG9yLnNpZ25hbHMuc2NlbmVHcmFwaENoYW5nZWQuZGlzcGF0Y2goKTtcbiAgICB9KTtcbiAgICBuZXdDb250ZW50LmFkZChuZXdVcmwpO1xuXG4gICAgdmFyIGJ1dHRvbkFkZE5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgYnV0dG9uQWRkTmV3LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICBidXR0b25BZGROZXcuc2V0QXR0cmlidXRlKCd2YWx1ZScsICdBZGQnKTtcbiAgICBidXR0b25BZGROZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIG1hcFdpZGdldC5zZXRWYWx1ZSgnIycraW5zZXJ0T3JHZXRBc3NldCgnaW1nJyxuZXdVcmwuZ2V0VmFsdWUoKSkpO1xuICAgICAgLy9tYXBXaWRnZXQuc2V0VmFsdWUoJyMnK2luc2VydE9yR2V0QXNzZXQoJ2ltZycsX3RleHR1cmUpKTtcbiAgICAgIC8vbWFwV2lkZ2V0LnNldFZhbHVlKCd1cmwoJyArIG5ld1VybC5nZXRWYWx1ZSgpICsgJyknKTtcbiAgICAgIGlmIChtYXBXaWRnZXQub25DaGFuZ2VDYWxsYmFjaykge1xuICAgICAgICBtYXBXaWRnZXQub25DaGFuZ2VDYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgZWRpdG9yLnNpZ25hbHMuaGlkZU1vZGFsLmRpc3BhdGNoKGFzc2V0c0NvbnRlbnQpO1xuICAgIH0pO1xuXG4gICAgbmV3Q29udGVudC5kb20uYXBwZW5kQ2hpbGQoYnV0dG9uQWRkTmV3KTtcbiAgICBlZGl0b3Iuc2lnbmFscy5zaG93TW9kYWwuZGlzcGF0Y2goY29udGFpbmVyKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2VsZWN0IChzZWN0aW9uKSB7XG4gICAgc2FtcGxlc1RhYi5zZXRDbGFzcygnJyk7XG4gICAgYXNzZXRzVGFiLnNldENsYXNzKCcnKTtcbiAgICBzYW1wbGVzVGFiLnNldENsYXNzKCcnKTtcblxuICAgIGFzc2V0c0NvbnRlbnQuc2V0RGlzcGxheSgnbm9uZScpO1xuICAgIHNhbXBsZXNDb250ZW50LnNldERpc3BsYXkoJ25vbmUnKTtcbiAgICBuZXdDb250ZW50LnNldERpc3BsYXkoJ25vbmUnKTtcblxuICAgIHN3aXRjaCAoc2VjdGlvbikge1xuICAgICAgY2FzZSAnU0FNUExFUyc6XG4gICAgICAgIHNhbXBsZXNUYWIuc2V0Q2xhc3MoJ3NlbGVjdGVkJyk7XG4gICAgICAgIHNhbXBsZXNDb250ZW50LnNldERpc3BsYXkoJycpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0FTU0VUUyc6XG4gICAgICAgIGFzc2V0c1RhYi5zZXRDbGFzcygnc2VsZWN0ZWQnKTtcbiAgICAgICAgYXNzZXRzQ29udGVudC5zZXREaXNwbGF5KCcnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdORVcnOlxuICAgICAgICBuZXdUYWIuc2V0Q2xhc3MoJ3NlbGVjdGVkJyk7XG4gICAgICAgIG5ld0NvbnRlbnQuc2V0RGlzcGxheSgnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbGVjdCgnQVNTRVRTJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXNzZXRzRGlhbG9nO1xuIiwidmFyIEFzc2V0c0RpYWxvZyA9IHJlcXVpcmUoJy4vYXNzZXRzJyk7XG5cbmZ1bmN0aW9uIERpYWxvZ3MgKGVkaXRvcikge1xuICB0aGlzLmFzc2V0cyA9IG5ldyBBc3NldHNEaWFsb2coZWRpdG9yKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEaWFsb2dzO1xuIiwiLyogZ2xvYmFsIGFmcmFtZUVkaXRvciBUSFJFRSAqL1xudmFyIFBhbmVscyA9IHJlcXVpcmUoJy4vcGFuZWxzJyk7XG52YXIgRGlhbG9ncyA9IHJlcXVpcmUoJy4vZGlhbG9ncycpO1xudmFyIFZpZXdwb3J0ID0gcmVxdWlyZSgnLi92aWV3cG9ydCcpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgQ29tcG9uZW50TG9hZGVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRsb2FkZXIuanMnKTtcbnZhciBTaGFkZXJMb2FkZXIgPSByZXF1aXJlKCcuL3NoYWRlcmxvYWRlci5qcycpO1xuXG5mdW5jdGlvbiBFZGl0b3IgKCkge1xuICB3aW5kb3cuYWZyYW1lQ29yZSA9IHdpbmRvdy5hZnJhbWVDb3JlIHx8IHdpbmRvdy5BRlJBTUUuYWZyYW1lQ29yZSB8fCB3aW5kb3cuQUZSQU1FO1xuXG4gIC8vIERldGVjdCBpZiB0aGUgc2NlbmUgaXMgYWxyZWFkeSBsb2FkZWRcbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScgfHwgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRlZCcpIHtcbiAgICB0aGlzLm9uRG9tTG9hZGVkKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHRoaXMub25Eb21Mb2FkZWQuYmluZCh0aGlzKSk7XG4gIH1cbn1cblxuRWRpdG9yLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIENhbGxiYWNrIG9uY2UgdGhlIERPTSBpcyBjb21wbGV0ZWx5IGxvYWRlZCBzbyB3ZSBjb3VsZCBxdWVyeSB0aGUgc2NlbmVcbiAgICovXG4gIG9uRG9tTG9hZGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jb21wb25lbnRMb2FkZXIgPSBuZXcgQ29tcG9uZW50TG9hZGVyKCk7XG4gICAgdGhpcy5zaGFkZXJMb2FkZXIgPSBuZXcgU2hhZGVyTG9hZGVyKCk7XG5cbiAgICB0aGlzLnNjZW5lRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdhLXNjZW5lJyk7XG4gICAgaWYgKHRoaXMuc2NlbmVFbC5oYXNMb2FkZWQpIHtcbiAgICAgIHRoaXMub25TY2VuZUxvYWRlZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjZW5lRWwuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVkJywgdGhpcy5vblNjZW5lTG9hZGVkLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfSxcblxuICBvblNjZW5lTG9hZGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYS1jYW52YXMnKTtcbiAgICB0aGlzLmRlZmF1bHRDYW1lcmFFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tjYW1lcmFdJyk7XG4gICAgdGhpcy5pbml0VUkoKTtcbiAgfSxcblxuICBpbml0VUk6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLkRFRkFVTFRfQ0FNRVJBID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDUwLCAxLCAxLCAxMDAwMCk7XG4gICAgdGhpcy5ERUZBVUxUX0NBTUVSQS5uYW1lID0gJ0NhbWVyYSc7XG4gICAgdGhpcy5ERUZBVUxUX0NBTUVSQS5wb3NpdGlvbi5zZXQoMjAsIDEwLCAyMCk7XG4gICAgdGhpcy5ERUZBVUxUX0NBTUVSQS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoKSk7XG4gICAgdGhpcy5ERUZBVUxUX0NBTUVSQS51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSB0aGlzLkRFRkFVTFRfQ0FNRVJBO1xuXG4gICAgdGhpcy5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLnNlbGVjdGVkID0gbnVsbDtcbiAgICB0aGlzLmRpYWxvZ3MgPSBuZXcgRGlhbG9ncyh0aGlzKTtcbiAgICB0aGlzLnBhbmVscyA9IG5ldyBQYW5lbHModGhpcyk7XG4gICAgdGhpcy5zY2VuZSA9IHRoaXMuc2NlbmVFbC5vYmplY3QzRDtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLnNjZW5lSGVscGVycyA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgIHRoaXMuc2NlbmVIZWxwZXJzLnZpc2libGUgPSBmYWxzZTtcbiAgICB0aGlzLmVkaXRvckFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy52aWV3cG9ydCA9IG5ldyBWaWV3cG9ydCh0aGlzKTtcbiAgICB0aGlzLnNpZ25hbHMud2luZG93UmVzaXplLmRpc3BhdGNoKCk7XG5cbiAgICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gYWRkT2JqZWN0cyAob2JqZWN0KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgb2JqID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgICAgICBzY29wZS5hZGRPYmplY3Qob2JqLmNoaWxkcmVuWzBdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkT2JqZWN0cyh0aGlzLnNjZW5lRWwub2JqZWN0M0QpO1xuXG4gICAgdGhpcy5zY2VuZS5hZGQodGhpcy5zY2VuZUhlbHBlcnMpO1xuICB9LFxuXG4gIHJlbW92ZU9iamVjdDogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QucGFyZW50ID09PSBudWxsKSByZXR1cm47IC8vIGF2b2lkIGRlbGV0aW5nIHRoZSBjYW1lcmEgb3Igc2NlbmVcblxuICAgIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgICBvYmplY3QudHJhdmVyc2UoZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICBzY29wZS5yZW1vdmVIZWxwZXIoY2hpbGQpO1xuICAgIH0pO1xuXG4gICAgb2JqZWN0LnBhcmVudC5yZW1vdmUob2JqZWN0KTtcblxuICAgIHRoaXMuc2lnbmFscy5vYmplY3RSZW1vdmVkLmRpc3BhdGNoKG9iamVjdCk7XG4gICAgdGhpcy5zaWduYWxzLnNjZW5lR3JhcGhDaGFuZ2VkLmRpc3BhdGNoKCk7XG4gIH0sXG5cbiAgYWRkSGVscGVyOiAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVCdWZmZXJHZW9tZXRyeSgyLCA0LCAyKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBjb2xvcjogMHhmZjAwMDAsIHZpc2libGU6IGZhbHNlIH0pO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgIHZhciBoZWxwZXI7XG4gICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVEhSRUUuQ2FtZXJhKSB7XG4gICAgICAgIGhlbHBlciA9IG5ldyBUSFJFRS5DYW1lcmFIZWxwZXIob2JqZWN0LCAxKTtcbiAgICAgIH0gZWxzZSBpZiAob2JqZWN0IGluc3RhbmNlb2YgVEhSRUUuUG9pbnRMaWdodCkge1xuICAgICAgICBoZWxwZXIgPSBuZXcgVEhSRUUuUG9pbnRMaWdodEhlbHBlcihvYmplY3QsIDEpO1xuICAgICAgfSBlbHNlIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KSB7XG4gICAgICAgIGhlbHBlciA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0SGVscGVyKG9iamVjdCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFRIUkVFLlNwb3RMaWdodCkge1xuICAgICAgICBoZWxwZXIgPSBuZXcgVEhSRUUuU3BvdExpZ2h0SGVscGVyKG9iamVjdCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFRIUkVFLkhlbWlzcGhlcmVMaWdodCkge1xuICAgICAgICBoZWxwZXIgPSBuZXcgVEhSRUUuSGVtaXNwaGVyZUxpZ2h0SGVscGVyKG9iamVjdCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFRIUkVFLlNraW5uZWRNZXNoKSB7XG4gICAgICAgIGhlbHBlciA9IG5ldyBUSFJFRS5Ta2VsZXRvbkhlbHBlcihvYmplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm8gaGVscGVyIGZvciB0aGlzIG9iamVjdCB0eXBlXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBpY2tlciA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgICBwaWNrZXIubmFtZSA9ICdwaWNrZXInO1xuICAgICAgcGlja2VyLnVzZXJEYXRhLm9iamVjdCA9IG9iamVjdDtcbiAgICAgIGhlbHBlci5hZGQocGlja2VyKTtcblxuICAgICAgdGhpcy5zY2VuZUhlbHBlcnMuYWRkKGhlbHBlcik7XG4gICAgICB0aGlzLmhlbHBlcnNbIG9iamVjdC5pZCBdID0gaGVscGVyO1xuXG4gICAgICB0aGlzLnNpZ25hbHMuaGVscGVyQWRkZWQuZGlzcGF0Y2goaGVscGVyKTtcbiAgICB9O1xuICB9KSgpLFxuXG4gIHJlbW92ZUhlbHBlcjogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIGlmICh0aGlzLmhlbHBlcnNbIG9iamVjdC5pZCBdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciBoZWxwZXIgPSB0aGlzLmhlbHBlcnNbIG9iamVjdC5pZCBdO1xuICAgICAgaGVscGVyLnBhcmVudC5yZW1vdmUoaGVscGVyKTtcblxuICAgICAgZGVsZXRlIHRoaXMuaGVscGVyc1sgb2JqZWN0LmlkIF07XG5cbiAgICAgIHRoaXMuc2lnbmFscy5oZWxwZXJSZW1vdmVkLmRpc3BhdGNoKGhlbHBlcik7XG4gICAgfVxuICB9LFxuXG4gIHNlbGVjdEVudGl0eTogZnVuY3Rpb24gKGVudGl0eSkge1xuICAgIHRoaXMuc2VsZWN0ZWRFbnRpdHkgPSBlbnRpdHk7XG4gICAgaWYgKGVudGl0eSkge1xuICAgICAgdGhpcy5zZWxlY3QoZW50aXR5Lm9iamVjdDNEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWxlY3QobnVsbCk7XG4gICAgfVxuXG4gICAgdGhpcy5zaWduYWxzLmVudGl0eVNlbGVjdGVkLmRpc3BhdGNoKGVudGl0eSk7XG4gIH0sXG5cbiAgaW5pdEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgIC8vIEZpbmQgYmV0dGVyIG5hbWUgOilcbiAgICB0aGlzLnNpZ25hbHMgPSBFdmVudHM7XG4gICAgdGhpcy5zaWduYWxzLmVkaXRvck1vZGVDaGFuZ2VkLmFkZChmdW5jdGlvbiAoYWN0aXZlKSB7XG4gICAgICB0aGlzLmVkaXRvckFjdGl2ZSA9IGFjdGl2ZTtcbiAgICAgIHRoaXMuc2NlbmVIZWxwZXJzLnZpc2libGUgPSB0aGlzLmVkaXRvckFjdGl2ZTtcbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuc2lnbmFscy53aW5kb3dSZXNpemUuZGlzcGF0Y2gsIGZhbHNlKTtcblxuICAgIHRoaXMuc2lnbmFscy5zaG93TW9kYWwuYWRkKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICB0aGlzLnBhbmVscy5tb2RhbC5zaG93KGNvbnRlbnQpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5zaWduYWxzLmhpZGVNb2RhbC5hZGQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5wYW5lbHMubW9kYWwuaGlkZSgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB2YXIgZW50aXRpZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhLWVudGl0eScpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBlbnRpdHkgPSBlbnRpdGllc1tpXTtcbiAgICAgIGVudGl0eS5hZGRFdmVudExpc3RlbmVyKCdjb21wb25lbnRjaGFuZ2VkJyxcbiAgICAgICAgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkICYmIGV2dC5zcmNFbGVtZW50ID09PSB0aGlzLnNlbGVjdGVkLmVsKSB7XG4gICAgICAgICAgICBhZnJhbWVFZGl0b3IuZWRpdG9yLnNpZ25hbHMuY29tcG9uZW50Q2hhbmdlZC5kaXNwYXRjaChldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH0sXG5cbiAgc2VsZWN0QnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKGlkID09PSB0aGlzLmNhbWVyYS5pZCkge1xuICAgICAgdGhpcy5zZWxlY3QodGhpcy5jYW1lcmEpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdCh0aGlzLnNjZW5lLmdldE9iamVjdEJ5SWQoaWQsIHRydWUpKTtcbiAgfSxcblxuICAvLyBDaGFuZ2UgdG8gc2VsZWN0IG9iamVjdFxuICBzZWxlY3Q6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZCA9PT0gb2JqZWN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZWxlY3RlZCA9IG9iamVjdDtcbiAgICB0aGlzLnNpZ25hbHMub2JqZWN0U2VsZWN0ZWQuZGlzcGF0Y2gob2JqZWN0KTtcbiAgfSxcblxuICBkZXNlbGVjdDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2VsZWN0KG51bGwpO1xuICB9LFxuXG4gIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jYW1lcmEuY29weSh0aGlzLkRFRkFVTFRfQ0FNRVJBKTtcbiAgICB0aGlzLmRlc2VsZWN0KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYS1zY2VuZScpLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuc2lnbmFscy5lZGl0b3JDbGVhcmVkLmRpc3BhdGNoKCk7XG4gIH0sXG5cbiAgYWRkRW50aXR5OiBmdW5jdGlvbiAoZW50aXR5KSB7XG4gICAgdGhpcy5hZGRPYmplY3QoZW50aXR5Lm9iamVjdDNEKTtcbiAgICB0aGlzLnNlbGVjdEVudGl0eShlbnRpdHkpO1xuICB9LFxuXG4gIGVuYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGFuZWxzLnNpZGViYXIuc2hvdygpO1xuICAgIHRoaXMucGFuZWxzLm1lbnViYXIuc2hvdygpO1xuICAgIHRoaXMuc2lnbmFscy5lZGl0b3JNb2RlQ2hhbmdlZC5kaXNwYXRjaCh0cnVlKTtcbiAgICAvL3RoaXMuc2NlbmVFbC5wYXVzZSgpO1xuICB9LFxuXG4gIGRpc2FibGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBhbmVscy5zaWRlYmFyLmhpZGUoKTtcbiAgICB0aGlzLnBhbmVscy5tZW51YmFyLmhpZGUoKTtcbiAgICB0aGlzLnNpZ25hbHMuZWRpdG9yTW9kZUNoYW5nZWQuZGlzcGF0Y2goZmFsc2UpO1xuICAgIHRoaXMuc2NlbmVFbC5wbGF5KCk7XG4gIC8vIEB0b2RvIFJlbW92ZWxpc3RlbmVyc1xuICB9LFxuXG4gIGFkZE9iamVjdDogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBzY29wZSA9IHRoaXM7XG4gICAgb2JqZWN0LnRyYXZlcnNlKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgc2NvcGUuYWRkSGVscGVyKGNoaWxkKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2lnbmFscy5vYmplY3RBZGRlZC5kaXNwYXRjaChvYmplY3QpO1xuICAgIHRoaXMuc2lnbmFscy5zY2VuZUdyYXBoQ2hhbmdlZC5kaXNwYXRjaCgpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBFZGl0b3IoKTtcbiIsInZhciBTSUdOQUxTID0gcmVxdWlyZSgnc2lnbmFscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2VuZXJhdGVDb21wb25lbnRzUGFuZWxzOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcblxuICBlZGl0b3JDbGVhcmVkOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcbiAgdHJhbnNmb3JtTW9kZUNoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuICBzbmFwQ2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIHNwYWNlQ2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIHJlbmRlcmVyQ2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG5cbiAgc2NlbmVHcmFwaENoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuXG4gIGNhbWVyYUNoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuXG4gIGdlb21ldHJ5Q2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG5cbiAgb2JqZWN0U2VsZWN0ZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuICBvYmplY3RGb2N1c2VkOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcblxuICBvYmplY3RBZGRlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIG9iamVjdENoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuICBvYmplY3RSZW1vdmVkOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcblxuICBoZWxwZXJBZGRlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIGhlbHBlclJlbW92ZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuXG4gIG1hdGVyaWFsQ2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG5cbiAgd2luZG93UmVzaXplOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcblxuICBzaG93R3JpZENoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuICByZWZyZXNoU2lkZWJhck9iamVjdDNEOiBuZXcgU0lHTkFMUy5TaWduYWwoKSxcbiAgcmVmcmVzaFNjcmlwdEVkaXRvcjogbmV3IFNJR05BTFMuU2lnbmFsKCksXG5cbiAgLy8gQS1GUkFNRVxuICBlbnRpdHlTZWxlY3RlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIGNvbXBvbmVudENoYW5nZWQ6IG5ldyBTSUdOQUxTLlNpZ25hbCgpLFxuICBlZGl0b3JNb2RlQ2hhbmdlZDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIHNob3dNb2RhbDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIGhpZGVNb2RhbDogbmV3IFNJR05BTFMuU2lnbmFsKCksXG4gIHNob3dBc3NldHNEaWFsb2c6IG5ldyBTSUdOQUxTLlNpZ25hbCgpXG5cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGFyc2VyOiBuZXcgd2luZG93LkRPTVBhcnNlcigpLFxuICBnZW5lcmF0ZUh0bWw6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeG1sRG9jID0gdGhpcy5wYXJzZXIucGFyc2VGcm9tU3RyaW5nKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwsICd0ZXh0L2h0bWwnKTtcblxuICAgIC8vIFJlbW92ZSBhbGwgdGhlIGNvbXBvbmVudHMgdGhhdCBhcmUgYmVpbmcgaW5qZWN0ZWQgYnkgYWZyYW1lLWVkaXRvciBvciBhZnJhbWVcbiAgICAvLyBAdG9kbyBVc2UgY3VzdG9tIGNsYXNzIHRvIHByZXZlbnQgdGhpcyBoYWNrXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh4bWxEb2MucXVlcnlTZWxlY3RvckFsbCgnLmEtZW50ZXItdnIsLmEtb3JpZW50YXRpb24tbW9kYWwsLlBhbmVsLC5lZGl0b3ItdG9vbHMsLnJzLWJhc2UsLmEtY2FudmFzLC5hLWVudGVyLXZyLWJ1dHRvbixzdHlsZVtkYXRhLWhyZWY9XCJzdHlsZS9yU3RhdHMuY3NzXCJdLHN0eWxlW2RhdGEtaHJlZl49XCJzcmMvcGFuZWxzXCJdLHN0eWxlW2RhdGEtaHJlZj1cInN0eWxlL2FmcmFtZS1jb3JlLmNzc1wiXSxsaW5rW2hyZWZePVwiaHR0cHM6Ly9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbVwiXScpLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMueG1sVG9TdHJpbmcoeG1sRG9jKTtcbiAgfSxcbiAgeG1sVG9TdHJpbmc6IGZ1bmN0aW9uICh4bWxEYXRhKSB7XG4gICAgdmFyIHhtbFN0cmluZztcbiAgICAvLyBJRVxuICAgIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgICAgeG1sU3RyaW5nID0geG1sRGF0YS54bWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1vemlsbGEsIEZpcmVmb3gsIE9wZXJhLCBldGMuXG4gICAgICB4bWxTdHJpbmcgPSAobmV3IHdpbmRvdy5YTUxTZXJpYWxpemVyKCkpLnNlcmlhbGl6ZVRvU3RyaW5nKHhtbERhdGEpO1xuICAgIH1cbiAgICByZXR1cm4geG1sU3RyaW5nO1xuICB9XG59O1xuIiwidmFyIGVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlZGl0b3I6IGVkaXRvclxufTtcbiIsIi8qIGdsb2JhbCBhZnJhbWVDb3JlICovXG52YXIgVUkgPSByZXF1aXJlKCcuLi8uLi9saWIvdmVuZG9yL3VpLmpzJyk7IC8vIEB0b2RvIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgbnBtIHBhY2thZ2VcbnZhciBXaWRnZXRzRmFjdG9yeSA9IHJlcXVpcmUoJy4vd2lkZ2V0c2ZhY3RvcnkuanMnKTsgLy8gQHRvZG8gd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBucG0gcGFja2FnZVxuXG5mdW5jdGlvbiB0cmltIChzKSB7XG4gIHMgPSBzLnJlcGxhY2UoLyheXFxzKil8KFxccyokKS9naSwgJycpO1xuICBzID0gcy5yZXBsYWNlKC9bIF17Mix9L2dpLCAnICcpO1xuICBzID0gcy5yZXBsYWNlKC9cXG4gLywgJ1xcbicpO1xuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gQXR0cmlidXRlcyAoZWRpdG9yKSB7XG4gIHZhciBvYmplY3RJZCwgb2JqZWN0VHlwZSwgb2JqZWN0Q3VzdG9tUm93O1xuICB2YXIgY29tcG9uZW50c0xpc3QsIG1peGluc0NvbnRhaW5lcjtcbiAgdmFyIGlnbm9yZUNvbXBvbmVudHNDaGFuZ2UgPSBmYWxzZTtcbiAgdmFyIGNvbW1vbkNvbXBvbmVudHMgPSBbJ3Bvc2l0aW9uJywgJ3JvdGF0aW9uJywgJ3NjYWxlJywgJ3Zpc2libGUnXTtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBlbnRpdHkgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSAge0VsZW1lbnR9IGVudGl0eSAgIEVudGl0eSB0byBtb2RpZnlcbiAgICogQHBhcmFtICB7c3RyaW5nfSBjb21wb25lbnQgICAgIE5hbWUgb2YgdGhlIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHByb3BlcnR5IFByb3BlcnR5IG5hbWVcbiAgICogQHBhcmFtICB7c3RyaW5nfG51bWJlcn0gdmFsdWUgICAgTmV3IHZhbHVlXG4gICAqL1xuICBmdW5jdGlvbiBoYW5kbGVFbnRpdHlDaGFuZ2UgKGVudGl0eSwgY29tcG9uZW50TmFtZSwgcHJvcGVydHlOYW1lLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdmFyIHBhcmFtZXRlcnMgPSBlbnRpdHkuZ2V0QXR0cmlidXRlKGNvbXBvbmVudE5hbWUpO1xuICAgICAgICBkZWxldGUgcGFyYW1ldGVyc1twcm9wZXJ0eU5hbWVdO1xuICAgICAgICBlbnRpdHkuc2V0QXR0cmlidXRlKGNvbXBvbmVudE5hbWUsIHBhcmFtZXRlcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50aXR5LnNldEF0dHJpYnV0ZShjb21wb25lbnROYW1lLCBwcm9wZXJ0eU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICBlbnRpdHkucmVtb3ZlQXR0cmlidXRlKGNvbXBvbmVudE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50aXR5LnNldEF0dHJpYnV0ZShjb21wb25lbnROYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVNaXhpbnNQYW5lbCAoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5Db2xsYXBzaWJsZVBhbmVsKCk7XG5cbiAgICBjb250YWluZXIuYWRkU3RhdGljKG5ldyBVSS5UZXh0KCdNaXhpbnMnKS5zZXRUZXh0VHJhbnNmb3JtKCd1cHBlcmNhc2UnKSk7XG4gICAgY29udGFpbmVyLmFkZChuZXcgVUkuQnJlYWsoKSk7XG5cbiAgICBtaXhpbnNDb250YWluZXIgPSBuZXcgVUkuUm93KCk7XG4gICAgY29udGFpbmVyLmFkZChtaXhpbnNDb250YWluZXIpO1xuXG4gICAgdmFyIG1peGlucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EtbWl4aW4nKTtcbiAgICB2YXIgbWl4aW5zT3B0aW9ucyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtaXhpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1peGluc09wdGlvbnNbIG1peGluc1tpXS5pZCBdID0gbWl4aW5zW2ldLmlkO1xuICAgIH1cblxuICAgIHZhciBtaXhpbnNMaXN0ID0gbmV3IFVJLlNlbGVjdCgpLnNldElkKCdjb21wb25lbnRsaXN0Jykuc2V0T3B0aW9ucyhtaXhpbnNPcHRpb25zKS5zZXRXaWR0aCgnMTUwcHgnKTtcbiAgICBjb250YWluZXIuYWRkKG5ldyBVSS5UZXh0KCdBZGQnKS5zZXRXaWR0aCgnOTBweCcpKTtcbiAgICBjb250YWluZXIuYWRkKG1peGluc0xpc3QpO1xuICAgIHZhciBidXR0b24gPSBuZXcgVUkuQnV0dG9uKCcrJykub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBlZGl0b3Iuc2VsZWN0ZWQuZWwuc2V0QXR0cmlidXRlKCdtaXhpbicsIHRyaW0oZWRpdG9yLnNlbGVjdGVkLmVsLmdldEF0dHJpYnV0ZSgnbWl4aW4nKSArICcgJyArIG1peGluc0xpc3QuZ2V0VmFsdWUoKSkpO1xuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGQoYnV0dG9uLnNldFdpZHRoKCcyMHB4JykpO1xuXG4gICAgdmFyIG5ld01peGluID0gbmV3IFVJLkJ1dHRvbignTmV3Jyk7XG4gICAgbmV3TWl4aW4ub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ1RoaXMgYnV0dG9uIHNob3VsZCBjcmVhdGUgYSBtaXhpbiBiYXNlZCBvbiB0aGUgY3VycmVudCBlbnRpdHkgY29tcG9uZW50cyB2YWx1ZXMnKTtcbiAgICB9KTtcbiAgICBjb250YWluZXIuYWRkKG5ld01peGluKTtcblxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgY29udGFpbmVyIHdpdGggdGhlIGNvbW1vbiBhdHRyaWJ1dGVzIGFuZCBjb21wb25lbnRzIGZvciBlYWNoIGVudGl0eTpcbiAgICogICAtIHR5cGVcbiAgICogICAtIElEXG4gICAqICAgLSBwb3NpdGlvblxuICAgKiAgIC0gcm90YXRpb25cbiAgICogICAtIHNjYWxlXG4gICAqICAgLSB2aXNpYmxlXG4gICAqIEByZXR1cm4ge1VJLkNvbGxhcHNpYmxlUGFuZWx9IFBhbmVsIGNvbnRhaW5pbmcgYWxsIHRoZSB3aWRnZXRzXG4gICAqL1xuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbW1vbkNvbXBvbmVudHNQYW5lbCAoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5Db2xsYXBzaWJsZVBhbmVsKCk7XG5cbiAgICBjb250YWluZXIuYWRkU3RhdGljKG5ldyBVSS5UZXh0KCdDb21tb24gYXR0cmlidXRlcycpLnNldFRleHRUcmFuc2Zvcm0oJ3VwcGVyY2FzZScpKTtcbiAgICBjb250YWluZXIuYWRkKG5ldyBVSS5CcmVhaygpKTtcblxuICAgIC8vIHR5cGVcbiAgICB2YXIgb2JqZWN0VHlwZVJvdyA9IG5ldyBVSS5Sb3coKTtcbiAgICBvYmplY3RUeXBlID0gbmV3IFVJLlRleHQoKTtcblxuICAgIG9iamVjdFR5cGVSb3cuYWRkKG5ldyBVSS5UZXh0KCdUeXBlJykuc2V0V2lkdGgoJzkwcHgnKSk7XG4gICAgb2JqZWN0VHlwZVJvdy5hZGQob2JqZWN0VHlwZSk7XG5cbiAgICBjb250YWluZXIuYWRkKG9iamVjdFR5cGVSb3cpO1xuXG4gICAgLy8gSURcbiAgICB2YXIgb2JqZWN0SWRSb3cgPSBuZXcgVUkuUm93KCk7XG4gICAgb2JqZWN0SWQgPSBuZXcgVUkuSW5wdXQoKS5zZXRXaWR0aCgnMTUwcHgnKS5zZXRGb250U2l6ZSgnMTJweCcpLm9uQ2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgIGhhbmRsZUVudGl0eUNoYW5nZShlZGl0b3Iuc2VsZWN0ZWQuZWwsICdpZCcsIG51bGwsIG9iamVjdElkLmdldFZhbHVlKCkpO1xuICAgICAgZWRpdG9yLnNpZ25hbHMuc2NlbmVHcmFwaENoYW5nZWQuZGlzcGF0Y2goKTtcbiAgICB9KTtcblxuICAgIG9iamVjdElkUm93LmFkZChuZXcgVUkuVGV4dCgnSUQnKS5zZXRXaWR0aCgnOTBweCcpKTtcbiAgICBvYmplY3RJZFJvdy5hZGQob2JqZWN0SWQpO1xuICAgIGNvbnRhaW5lci5hZGQob2JqZWN0SWRSb3cpO1xuXG4gICAgLy8gQWRkIHRoZSBwYXJhbWV0ZXIgcm93cyBmb3IgdGhlIGNvbW1vbiBjb21wb25lbnRzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21tb25Db21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb250YWluZXIuYWRkKGdldFByb3BlcnR5Um93KGNvbW1vbkNvbXBvbmVudHNbaV0sIG51bGwsIGFmcmFtZUNvcmUuY29tcG9uZW50c1tjb21tb25Db21wb25lbnRzW2ldXS5zY2hlbWEpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBjb21wb25lbnQgdG8gdGhlIGVudGl0eVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVudGl0eSAgICAgICAgRW50aXR5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb21wb25lbnROYW1lIENvbXBvbmVudCBuYW1lXG4gICAqL1xuICBmdW5jdGlvbiBhZGRDb21wb25lbnRUb0VudGl0eSAoZW50aXR5LCBjb21wb25lbnROYW1lKSB7XG4gICAgZW50aXR5LnNldEF0dHJpYnV0ZShjb21wb25lbnROYW1lLCAnJyk7XG4gICAgZ2VuZXJhdGVDb21wb25lbnRzUGFuZWxzKGVudGl0eSk7XG4gICAgdXBkYXRlVUkoZW50aXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHJvdyBpbmNsdWRpbmcgYSBjb21ib2JveCB3aXRoIHRoZSBhdmFpbGFibGUgY29tcG9uZW50cyB0byBhZGQgdG9cbiAgICogdGhlIGN1cnJlbnQgZW50aXR5XG4gICAqL1xuICBmdW5jdGlvbiBnZW5lcmF0ZUFkZENvbXBvbmVudFJvdyAoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5Db2xsYXBzaWJsZVBhbmVsKCk7XG5cbiAgICBjb250YWluZXIuYWRkU3RhdGljKG5ldyBVSS5UZXh0KCdDT01QT05FTlRTJykpO1xuICAgIGNvbnRhaW5lci5hZGQobmV3IFVJLkJyZWFrKCkpO1xuXG4gICAgdmFyIGNvbXBvbmVudHNSb3cgPSBuZXcgVUkuUm93KCk7XG4gICAgY29udGFpbmVyLmFkZChjb21wb25lbnRzUm93KTtcblxuICAgIHZhciBjb21wb25lbnRzT3B0aW9ucyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWUgaW4gYWZyYW1lQ29yZS5jb21wb25lbnRzKSB7XG4gICAgICBpZiAoY29tbW9uQ29tcG9uZW50cy5pbmRleE9mKG5hbWUpID09PSAtMSkge1xuICAgICAgICBjb21wb25lbnRzT3B0aW9uc1tuYW1lXSA9IG5hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChuYW1lIGluIGVkaXRvci5jb21wb25lbnRMb2FkZXIuY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50c09wdGlvbnNbbmFtZV0gPSBuYW1lO1xuICAgIH1cblxuICAgIGNvbXBvbmVudHNMaXN0ID0gbmV3IFVJLlNlbGVjdCgpLnNldElkKCdjb21wb25lbnRsaXN0Jykuc2V0T3B0aW9ucyhjb21wb25lbnRzT3B0aW9ucykuc2V0V2lkdGgoJzE1MHB4Jyk7XG5cbiAgICBjb21wb25lbnRzUm93LmFkZChuZXcgVUkuVGV4dCgnQWRkJykuc2V0V2lkdGgoJzkwcHgnKSk7XG4gICAgY29tcG9uZW50c1Jvdy5hZGQoY29tcG9uZW50c0xpc3QpO1xuICAgIHZhciBidXR0b24gPSBuZXcgVUkuQnV0dG9uKCcrJykub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBlZGl0b3IuY29tcG9uZW50TG9hZGVyLmFkZENvbXBvbmVudFRvU2NlbmUoY29tcG9uZW50c0xpc3QuZ2V0VmFsdWUoKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBBZGQgdGhlIHNlbGVjdGVkIGNvbXBvbmVudCBmcm9tIHRoZSBjb21ib2JveCB0byB0aGUgY3VycmVudCBhY3RpdmUgZW50aXR5XG4gICAgICAgIGFkZENvbXBvbmVudFRvRW50aXR5KGVkaXRvci5zZWxlY3RlZC5lbCwgY29tcG9uZW50c0xpc3QuZ2V0VmFsdWUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBjb21wb25lbnRzUm93LmFkZChidXR0b24uc2V0V2lkdGgoJzIwcHgnKSk7XG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIFVJIHdpZGdldHMgYmFzZWQgb24gdGhlIGN1cnJlbnQgZW50aXR5ICYgY29tcG9uZW50cyB2YWx1ZXNcbiAgICogQHBhcmFtICB7RWxlbWVudH0gZW50aXR5IEVudGl0eSBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZVVJIChlbnRpdHkpIHtcbiAgICBpZiAoaWdub3JlQ29tcG9uZW50c0NoYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9iamVjdFR5cGUuc2V0VmFsdWUoZW50aXR5LnRhZ05hbWUpO1xuICAgIG9iamVjdElkLnNldFZhbHVlKGVudGl0eS5pZCk7XG5cbiAgICAvLyBEaXNhYmxlIHRoZSBjb21wb25lbnRzIGFscmVhZHkgdXNlZCBmb3JtIHRoZSBsaXN0IG9mIGF2YWlsYWJsZVxuICAgIC8vIGNvbXBvbmVudHMgdG8gYWRkIHRvIHRoaXMgZW50aXR5XG4gICAgdmFyIGF2YWlsYWJsZUNvbXBvbmVudHMgPSBjb21wb25lbnRzTGlzdC5kb20ucXVlcnlTZWxlY3RvckFsbCgnb3B0aW9uJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdmFpbGFibGVDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhdmFpbGFibGVDb21wb25lbnRzW2ldLmRpc2FibGVkID0gZW50aXR5LmdldEF0dHJpYnV0ZShhdmFpbGFibGVDb21wb25lbnRzW2ldLnZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGNvbW1vbiBwcm9wZXJ0aWVzICYgY29tcG9uZW50cyB0byBkZWZhdWx0IGFzIHRoZXkncmUgbm90IHJlY3JlYXRlZFxuICAgIC8vIGFzIHRoZSBlbnRpdHkgY2hhbmdlZFxuICAgIGZvciAoaSA9IDA7IGkgPCBjb21tb25Db21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29tcG9uZW50TmFtZSA9IGNvbW1vbkNvbXBvbmVudHNbaV07XG4gICAgICB2YXIgY29tcG9uZW50ID0gYWZyYW1lQ29yZS5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuICAgICAgaWYgKGNvbXBvbmVudC5zY2hlbWEuaGFzT3duUHJvcGVydHkoJ2RlZmF1bHQnKSkge1xuICAgICAgICBXaWRnZXRzRmFjdG9yeS51cGRhdGVXaWRnZXRWYWx1ZShjb21wb25lbnROYW1lLCBjb21wb25lbnQuc2NoZW1hLmRlZmF1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIGNvbXBvbmVudC5zY2hlbWEpIHtcbiAgICAgICAgICBXaWRnZXRzRmFjdG9yeS51cGRhdGVXaWRnZXRWYWx1ZShjb21wb25lbnROYW1lICsgJy4nICsgcHJvcGVydHlOYW1lLCBjb21wb25lbnQuc2NoZW1hW3Byb3BlcnR5TmFtZV0uZGVmYXVsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIHdpZGdldCB2YWx1ZXMgZm9yIGVhY2ggY29tcG9uZW50cycgYXR0cmlidXRlc1xuICAgIHZhciBlbnRpdHlDb21wb25lbnRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZW50aXR5LmF0dHJpYnV0ZXMpO1xuICAgIGVudGl0eUNvbXBvbmVudHMuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50KSB7XG4gICAgICB2YXIgcHJvcGVydGllcyA9IGVudGl0eS5nZXRBdHRyaWJ1dGUoY29tcG9uZW50Lm5hbWUpO1xuXG4gICAgICAvLyBUaGUgYXR0cmlidXRlSWYgdGhlIHByb3BlcnRpZXMgcmVmZXIgdG8gYSBzaW5nbGUgdmFsdWUgb3IgbXVsdGl2YWx1ZSBsaWtlIHBvc2l0aW9uIHt4OjAsIHk6MCwgejowfVxuICAgICAgaWYgKFdpZGdldHNGYWN0b3J5LndpZGdldHNbY29tcG9uZW50Lm5hbWVdIHx8IHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBXaWRnZXRzRmFjdG9yeS51cGRhdGVXaWRnZXRWYWx1ZShjb21wb25lbnQubmFtZSwgcHJvcGVydGllcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTb21lIGNvbXBvbmVudHMgaGFzIG11bHRpcGxlIGF0dHJpYnV0ZXMgbGlrZSBnZW9tZXRyeSB7cHJpbWl0aXZlOiBib3h9XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICB2YXIgaWQgPSBjb21wb25lbnQubmFtZSArICcuJyArIHByb3BlcnR5O1xuICAgICAgICAgIFdpZGdldHNGYWN0b3J5LnVwZGF0ZVdpZGdldFZhbHVlKGlkLCBwcm9wZXJ0aWVzW3Byb3BlcnR5XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSBtaXhpbnMgbGlzdFxuICAgIG1peGluc0NvbnRhaW5lci5kb20uaW5uZXJIVE1MID0gJyc7XG4gICAgZW50aXR5Lm1peGluRWxzLmZvckVhY2goZnVuY3Rpb24gKG1peGluKSB7XG4gICAgICB2YXIgbmFtZSA9IG5ldyBVSS5UZXh0KG1peGluLmlkKS5zZXRXaWR0aCgnMTYwcHgnKS5zZXRGb250U2l6ZSgnMTJweCcpO1xuICAgICAgbWl4aW5zQ29udGFpbmVyLmFkZChuYW1lKTtcblxuICAgICAgdmFyIGVkaXQgPSBuZXcgVUkuQnV0dG9uKCdFZGl0Jykuc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgICBlZGl0LnNldE1hcmdpbkxlZnQoJzRweCcpO1xuICAgICAgZWRpdC5vbkNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gIHNpZ25hbHMuZWRpdFNjcmlwdC5kaXNwYXRjaCggb2JqZWN0LCBzY3JpcHQgKTtcbiAgICAgIH0pO1xuICAgICAgbWl4aW5zQ29udGFpbmVyLmFkZChlZGl0KTtcblxuICAgICAgdmFyIHJlbW92ZSA9IG5ldyBVSS5CdXR0b24oJ1JlbW92ZScpO1xuICAgICAgcmVtb3ZlLnNldE1hcmdpbkxlZnQoJzRweCcpO1xuICAgICAgcmVtb3ZlLm9uQ2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBlbnRpdHkuc2V0QXR0cmlidXRlKCdtaXhpbicsIHRyaW0oZW50aXR5LmdldEF0dHJpYnV0ZSgnbWl4aW4nKS5yZXBsYWNlKG1peGluLmlkLCAnJykpKTtcbiAgICAgIH0pO1xuICAgICAgbWl4aW5zQ29udGFpbmVyLmFkZChyZW1vdmUpO1xuXG4gICAgICBtaXhpbnNDb250YWluZXIuYWRkKG5ldyBVSS5CcmVhaygpKTtcbiAgICB9KTtcbiAgICBXaWRnZXRzRmFjdG9yeS51cGRhdGVXaWRnZXRWaXNpYmlsaXR5KGVudGl0eSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdG8gZGVmYXVsdCAoY2xlYXIpIG9uZSBlbnRpdHkncyBjb21wb25lbnRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbnRpdHkgICAgICAgIEVudGl0eVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50TmFtZSBDb21wb25lbnQgbmFtZSB0byBjbGVhclxuICAgKi9cbiAgZnVuY3Rpb24gc2V0RW1wdHlDb21wb25lbnQgKGVudGl0eSwgY29tcG9uZW50TmFtZSkge1xuICAgIGVudGl0eS5zZXRBdHRyaWJ1dGUoY29tcG9uZW50TmFtZSwgJycpO1xuICAgIGdlbmVyYXRlQ29tcG9uZW50c1BhbmVscyhlbnRpdHkpO1xuICAgIHVwZGF0ZVVJKGVudGl0eSk7XG4gICAgZWRpdG9yLnNpZ25hbHMub2JqZWN0Q2hhbmdlZC5kaXNwYXRjaChlbnRpdHkub2JqZWN0M0QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHJvdyBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXIgbGFiZWwgYW5kIGl0cyB3aWRnZXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudE5hbWUgICBDb21wb25lbnQgbmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlOYW1lICAgUHJvcGVydHkgbmFtZVxuICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcGVydHlTY2hlbWEgUHJvcGVydHkgc2NoZW1hXG4gICAqL1xuICBmdW5jdGlvbiBnZXRQcm9wZXJ0eVJvdyAoY29tcG9uZW50TmFtZSwgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVNjaGVtYSkge1xuICAgIHZhciBwcm9wZXJ0eVJvdyA9IG5ldyBVSS5Sb3coKTtcbiAgICB2YXIgcGFuZWxOYW1lID0gcHJvcGVydHlOYW1lIHx8IGNvbXBvbmVudE5hbWU7XG4gICAgdmFyIGxhYmVsID0gbmV3IFVJLlRleHQocGFuZWxOYW1lKTtcbiAgICBwcm9wZXJ0eVJvdy5hZGQobGFiZWwpO1xuXG4gICAgbGFiZWwuc2V0V2lkdGgoJzEyMHB4Jyk7XG4gICAgdmFyIG5ld1dpZGdldCA9IFdpZGdldHNGYWN0b3J5LmdldFdpZGdldEZyb21Qcm9wZXJ0eShjb21wb25lbnROYW1lLCBudWxsLCBwcm9wZXJ0eU5hbWUsIHVwZGF0ZUVudGl0eVZhbHVlLCBwcm9wZXJ0eVNjaGVtYSk7XG4gICAgbmV3V2lkZ2V0LnByb3BlcnR5Um93ID0gcHJvcGVydHlSb3c7XG4gICAgcHJvcGVydHlSb3cuYWRkKG5ld1dpZGdldCk7XG5cbiAgICByZXR1cm4gcHJvcGVydHlSb3c7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYW4gVUkuQ29sbGFwc2libGVQYW5lbCBmb3IgZWFjaCBlbnRpdHkncyBjb21wb25lbnRcbiAgICogQHBhcmFtICB7RWxlbWVudH0gZW50aXR5IEN1cnJlbnQgc2VsZWN0ZWQgZW50aXR5XG4gICAqL1xuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbXBvbmVudHNQYW5lbHMgKGVudGl0eSkge1xuICAgIG9iamVjdEN1c3RvbVJvdy5jbGVhcigpO1xuXG4gICAgZm9yICh2YXIgY29tcG9uZW50TmFtZSBpbiBlbnRpdHkuY29tcG9uZW50cykge1xuICAgICAgLy8gSWdub3JlIHRoZSBjb21wb25lbnRzIHRoYXQgd2UndmUgYWxyZWFkeSBpbmNsdWRlZCBvbiB0aGUgY29tbW9uIGF0dHJpYnV0ZXMgcGFuZWxcbiAgICAgIGlmIChjb21tb25Db21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50TmFtZSkgIT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgY29tcG9uZW50ID0gZW50aXR5LmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cbiAgICAgIC8vIEFkZCBhIGNvbnRleHQgbWVudSB0byBkZWxldGUgb3IgcmVzZXQgdGhlIGNvbXBvbmVudFxuICAgICAgdmFyIG9iamVjdEFjdGlvbnMgPSBuZXcgVUkuU2VsZWN0KClcbiAgICAgICAgLnNldElkKGNvbXBvbmVudE5hbWUpXG4gICAgICAgIC5zZXRQb3NpdGlvbignYWJzb2x1dGUnKVxuICAgICAgICAuc2V0UmlnaHQoJzhweCcpXG4gICAgICAgIC5zZXRGb250U2l6ZSgnMTFweCcpXG4gICAgICAgIC5zZXRPcHRpb25zKHtcbiAgICAgICAgICAnQWN0aW9ucyc6ICdBY3Rpb25zJyxcbiAgICAgICAgICAnRGVsZXRlJzogJ0RlbGV0ZScsXG4gICAgICAgICAgJ0NsZWFyJzogJ0NsZWFyJ1xuICAgICAgICB9KVxuICAgICAgICAub25DbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgLy8gQXZvaWQgcGFuZWwgY29sbGFwc2luZ1xuICAgICAgICB9KVxuICAgICAgICAub25DaGFuZ2UoZnVuY3Rpb24gKGV2ZW50LCBjb21wb25lbnQpIHtcbiAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdEZWxldGUnOlxuICAgICAgICAgICAgICBlbnRpdHkucmVtb3ZlQXR0cmlidXRlKHRoaXMuZ2V0SWQoKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDbGVhcic6XG4gICAgICAgICAgICAgIHNldEVtcHR5Q29tcG9uZW50KGVudGl0eSwgdGhpcy5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zZXRWYWx1ZSgnQWN0aW9ucycpO1xuICAgICAgICAgIGdlbmVyYXRlQ29tcG9uZW50c1BhbmVscyhlbnRpdHkpO1xuICAgICAgICAgIHVwZGF0ZVVJKGVudGl0eSk7XG4gICAgICAgICAgZWRpdG9yLnNpZ25hbHMub2JqZWN0Q2hhbmdlZC5kaXNwYXRjaChlbnRpdHkub2JqZWN0M0QpO1xuICAgICAgICB9KTtcblxuICAgICAgLy8gQ29sbGFwc2libGUgcGFuZWwgd2l0aCBjb21wb25lbnQgbmFtZSBhcyB0aXRsZVxuICAgICAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5Db2xsYXBzaWJsZVBhbmVsKCk7XG4gICAgICBjb250YWluZXIuYWRkU3RhdGljKG5ldyBVSS5UZXh0KGNvbXBvbmVudE5hbWUpLnNldFRleHRUcmFuc2Zvcm0oJ3VwcGVyY2FzZScpLCBvYmplY3RBY3Rpb25zKTtcbiAgICAgIGNvbnRhaW5lci5hZGQobmV3IFVJLkJyZWFrKCkpO1xuXG4gICAgICAvLyBBZGQgYSB3aWRnZXQncyByb3cgZm9yIGVhY2ggcGFyYW1ldGVyIG9uIHRoZSBjb21wb25lbnRcbiAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBjb21wb25lbnQuc2NoZW1hKSB7XG4gICAgICAgIGNvbnRhaW5lci5hZGQoZ2V0UHJvcGVydHlSb3coY29tcG9uZW50TmFtZSwgcHJvcGVydHlOYW1lLCBjb21wb25lbnQuc2NoZW1hW3Byb3BlcnR5TmFtZV0pKTtcbiAgICAgIH1cblxuICAgICAgY29udGFpbmVyLmFkZChuZXcgVUkuQnJlYWsoKSk7XG4gICAgICBvYmplY3RDdXN0b21Sb3cuYWRkKGNvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHdoZW4gYSB3aWRnZXQgdmFsdWUgaXMgdXBkYXRlZCBzbyB3ZSBjb3VsZCB1cGRhdGUgdGhlIGVudGl0eSBhdHRyaWJ1dGVzXG4gICAqIEBwYXJhbSAge0V2ZW50VGFyZ2V0fSBldmVudCAgICAgICAgIEV2ZW50IGdlbmVyYXRlZCBieSB0aGUgb25DaGFuZ2UgbGlzdGVuZXJcbiAgICogQHBhcmFtICB7c3RyaW5nfSBjb21wb25lbnROYW1lIENvbXBvbmVudCBuYW1lIGJlaW5nIG1vZGlmaWVkIChlZzogJ2dlb21ldHJ5JylcbiAgICogQHBhcmFtICB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lIEF0dHJpYnV0ZSBuYW1lIGJlaW5nIG1vZGlmaWVkIChlZzogJ3ByaW1pdGl2ZScpXG4gICAqIEBwYXJhbSAge3N0cmluZ30gcHJvcGVydHkgICAgICBQcm9wZXJ0eSBuYW1lLCBpZiBhbnksIGJlaW5nIG1vZGlmaWVkIChlZzogJ3gnKVxuICAgKi9cbiAgZnVuY3Rpb24gdXBkYXRlRW50aXR5VmFsdWUgKGV2ZW50LCBjb21wb25lbnROYW1lLCBhdHRyaWJ1dGVOYW1lLCBwcm9wZXJ0eSkge1xuICAgIGlnbm9yZUNvbXBvbmVudHNDaGFuZ2UgPSB0cnVlO1xuICAgIHZhciBlbnRpdHkgPSBlZGl0b3Iuc2VsZWN0ZWQuZWw7XG4gICAgdmFyIGlkID0gYXR0cmlidXRlTmFtZSA/IGNvbXBvbmVudE5hbWUgKyAnLicgKyBhdHRyaWJ1dGVOYW1lICsgJy4nICsgcHJvcGVydHkgOiBwcm9wZXJ0eSA/IChjb21wb25lbnROYW1lICsgJy4nICsgcHJvcGVydHkpIDogY29tcG9uZW50TmFtZTtcbiAgICB2YXIgd2lkZ2V0ID0gV2lkZ2V0c0ZhY3Rvcnkud2lkZ2V0c1tpZF07XG5cbiAgICBoYW5kbGVFbnRpdHlDaGFuZ2UoZW50aXR5LCBjb21wb25lbnROYW1lLCBwcm9wZXJ0eSwgd2lkZ2V0LmdldFZhbHVlKCkpO1xuXG4gICAgV2lkZ2V0c0ZhY3RvcnkudXBkYXRlV2lkZ2V0VmlzaWJpbGl0eShlbnRpdHkpO1xuXG4gICAgZWRpdG9yLnNpZ25hbHMub2JqZWN0Q2hhbmdlZC5kaXNwYXRjaChlbnRpdHkub2JqZWN0M0QpO1xuICAgIGlnbm9yZUNvbXBvbmVudHNDaGFuZ2UgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIG1haW4gYXR0cmlidXRlcyBwYW5lbFxuICB2YXIgY29udGFpbmVyID0gbmV3IFVJLlBhbmVsKCk7XG4gIGNvbnRhaW5lci5zZXRCb3JkZXJUb3AoJzAnKTtcbiAgY29udGFpbmVyLnNldFBhZGRpbmdUb3AoJzIwcHgnKTtcbiAgY29udGFpbmVyLnNldERpc3BsYXkoJ25vbmUnKTtcblxuICAvLyBBZGQgY29tbW9uIGF0dHJpYnV0ZXMgcGFuZWwgKHR5cGUsIGlkLCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlLCB2aXNpYmxlKVxuICBjb250YWluZXIuYWRkKGdlbmVyYXRlQ29tbW9uQ29tcG9uZW50c1BhbmVsKCkpO1xuXG4gIC8vIEFkZCBjb21tb24gYXR0cmlidXRlcyBwYW5lbCAodHlwZSwgaWQsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIHZpc2libGUpXG4gIGNvbnRhaW5lci5hZGQoZ2VuZXJhdGVNaXhpbnNQYW5lbCgpKTtcblxuICAvLyBBcHBlbmQgdGhlIGNvbXBvbmVudHMgbGlzdCB0aGF0IHRoZSB1c2VyIGNhbiBhZGQgdG8gdGhlIHNlbGVjdGVkIGVudGl0eVxuICBjb250YWluZXIuYWRkKGdlbmVyYXRlQWRkQ29tcG9uZW50Um93KCkpO1xuXG4gIC8vIEVtcHR5IHJvdyB1c2VkIHRvIGFwcGVuZCB0aGUgcGFuZWxzIGZyb20gZWFjaCBjb21wb25lbnRcbiAgb2JqZWN0Q3VzdG9tUm93ID0gbmV3IFVJLlJvdygpO1xuICBjb250YWluZXIuYWRkKG9iamVjdEN1c3RvbVJvdyk7XG5cbiAgLy8gU2lnbmFsIGRpc3BhdGNoZXJzXG4gIGVkaXRvci5zaWduYWxzLmVudGl0eVNlbGVjdGVkLmFkZChmdW5jdGlvbiAoZW50aXR5KSB7XG4gICAgaWYgKGVudGl0eSkge1xuICAgICAgY29udGFpbmVyLnNob3coKTtcbiAgICAgIGdlbmVyYXRlQ29tcG9uZW50c1BhbmVscyhlbnRpdHkpO1xuICAgICAgdXBkYXRlVUkoZW50aXR5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGFpbmVyLmhpZGUoKTtcbiAgICB9XG4gIH0pO1xuICBlZGl0b3Iuc2lnbmFscy5jb21wb25lbnRDaGFuZ2VkLmFkZChmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIGVudGl0eSA9IGV2dC5kZXRhaWwudGFyZ2V0O1xuXG4gICAgLypcbiAgICBpZiAoZXZ0LmRldGFpbC5uZXdEYXRhLnNoYWRlciAmJiBldnQuZGV0YWlsLm5ld0RhdGEuc2hhZGVyICE9PSBldnQuZGV0YWlsLm9sZERhdGEuc2hhZGVyKSB7XG4gICAgICBhZnJhbWVFZGl0b3IuZWRpdG9yLnNoYWRlckxvYWRlci5hZGRTaGFkZXJUb1NjZW5lKGV2dC5kZXRhaWwubmV3RGF0YS5zaGFkZXIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZW50aXR5LmNvbXBvbmVudHMubWF0ZXJpYWwudXBkYXRlKGV2dC5kZXRhaWwub2xkRGF0YSk7XG4gICAgICAgIGdlbmVyYXRlQ29tcG9uZW50c1BhbmVscyhlZGl0b3Iuc2VsZWN0ZWQuZWwpO1xuICAgICAgICBpZ25vcmVDb21wb25lbnRzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIHVwZGF0ZVVJKGVudGl0eSk7XG4gICAgICAgIGVkaXRvci5zaWduYWxzLm9iamVjdENoYW5nZWQuZGlzcGF0Y2goZW50aXR5Lm9iamVjdDNEKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAqL1xuXG4gICAgdXBkYXRlVUkoZW50aXR5KTtcbiAgICBlZGl0b3Iuc2lnbmFscy5vYmplY3RDaGFuZ2VkLmRpc3BhdGNoKGVudGl0eS5vYmplY3QzRCk7XG4gIH0pO1xuXG4gIGVkaXRvci5zaWduYWxzLmdlbmVyYXRlQ29tcG9uZW50c1BhbmVscy5hZGQoZnVuY3Rpb24gKCkge1xuICAgIGdlbmVyYXRlQ29tcG9uZW50c1BhbmVscyhlZGl0b3Iuc2VsZWN0ZWQuZWwpO1xuICAgIGlnbm9yZUNvbXBvbmVudHNDaGFuZ2UgPSBmYWxzZTtcbiAgICB1cGRhdGVVSShlZGl0b3Iuc2VsZWN0ZWQuZWwpO1xuICB9KTtcblxuICByZXR1cm4gY29udGFpbmVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dHJpYnV0ZXM7XG4iLCJ2YXIgY3NzID0gXCIuT3V0bGluZXJ7aGVpZ2h0OjMwMHB4fS5FbnRpdHl7Y29sb3I6Izg4ZX0uVGVtcGxhdGV7Y29sb3I6IzhlOH0uQW5pbWF0aW9ue2NvbG9yOiNlODh9LmFzc2V0cy1kaWFsb2cgLklucHV0e2JvcmRlcjoxcHggc29saWQgIzk5OSFpbXBvcnRhbnR9XCI7IChyZXF1aXJlKFwiYnJvd3NlcmlmeS1jc3NcIikuY3JlYXRlU3R5bGUoY3NzLCB7IFwiaHJlZlwiOiBcInNyY1xcXFxwYW5lbHNcXFxcY3NzXFxcXGN1c3RvbS5jc3NcIn0pKTsgbW9kdWxlLmV4cG9ydHMgPSBjc3M7IiwidmFyIGNzcyA9IFwiLk91dGxpbmVye2NvbG9yOiM0NDQ7YmFja2dyb3VuZDojZmZmO3BhZGRpbmc6MDt3aWR0aDoxMDAlO2hlaWdodDoxNDBweDtmb250LXNpemU6MTJweDtjdXJzb3I6ZGVmYXVsdDtvdmVyZmxvdzphdXRvO291dGxpbmU6MH0uT3V0bGluZXIgLm9wdGlvbntwYWRkaW5nOjRweDtjb2xvcjojNjY2O3doaXRlLXNwYWNlOm5vd3JhcH0uT3V0bGluZXIgLm9wdGlvbi5hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjhmOGY4fWlucHV0Lk51bWJlcntjb2xvcjojMDA4MGYwIWltcG9ydGFudDtmb250LXNpemU6MTJweDtib3JkZXI6MDtwYWRkaW5nOjJweDtjdXJzb3I6Y29sLXJlc2l6ZX0jdmlld3BvcnR7cG9zaXRpb246YWJzb2x1dGU7dG9wOjMycHg7bGVmdDowO3JpZ2h0OjMwMHB4O2JvdHRvbTozMnB4fSN2aWV3cG9ydCAjaW5mb3t0ZXh0LXNoYWRvdzoxcHggMXB4IDAgcmdiYSgwLDAsMCwuMjUpO3BvaW50ZXItZXZlbnRzOm5vbmV9I3NjcmlwdHtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MzJweDtsZWZ0OjA7cmlnaHQ6MzAwcHg7Ym90dG9tOjMycHg7b3BhY2l0eTouOX0jcGxheWVye3Bvc2l0aW9uOmFic29sdXRlO3RvcDozMnB4O2xlZnQ6MDtyaWdodDozMDBweDtib3R0b206MzJweH0jbWVudWJhcntwb3NpdGlvbjphYnNvbHV0ZTt3aWR0aDoxMDAlO2hlaWdodDozMnB4O2JhY2tncm91bmQ6I2VlZTtwYWRkaW5nOjA7bWFyZ2luOjA7cmlnaHQ6MDt0b3A6MH0jbWVudWJhciAubWVudXtmbG9hdDpsZWZ0O2N1cnNvcjpwb2ludGVyO3BhZGRpbmctcmlnaHQ6OHB4fSNtZW51YmFyIC5tZW51LnJpZ2h0e2Zsb2F0OnJpZ2h0O2N1cnNvcjphdXRvO3BhZGRpbmctcmlnaHQ6MDt0ZXh0LWFsaWduOnJpZ2h0fSNtZW51YmFyIC5tZW51IC50aXRsZXtkaXNwbGF5OmlubGluZS1ibG9jaztjb2xvcjojODg4O21hcmdpbjowO3BhZGRpbmc6OHB4fSNtZW51YmFyIC5tZW51IC5vcHRpb25ze3Bvc2l0aW9uOmFic29sdXRlO2Rpc3BsYXk6bm9uZTtwYWRkaW5nOjVweCAwO2JhY2tncm91bmQ6I2VlZTt3aWR0aDoxNTBweH0jbWVudWJhciAubWVudTpob3ZlciAub3B0aW9uc3tkaXNwbGF5OmJsb2NrfSNtZW51YmFyIC5tZW51IC5vcHRpb25zIGhye2JvcmRlci1jb2xvcjojZGRkfSNtZW51YmFyIC5tZW51IC5vcHRpb25zIC5vcHRpb257Y29sb3I6IzY2NjtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O3BhZGRpbmc6NXB4IDEwcHg7bWFyZ2luOjAhaW1wb3J0YW50fSNtZW51YmFyIC5tZW51IC5vcHRpb25zIC5vcHRpb246aG92ZXJ7Y29sb3I6I2ZmZjtiYWNrZ3JvdW5kLWNvbG9yOiMwOGZ9I21lbnViYXIgLm1lbnUgLm9wdGlvbnMgLm9wdGlvbjphY3RpdmV7Y29sb3I6IzY2NjtiYWNrZ3JvdW5kOjAgMH0jbWVudWJhciAubWVudSAub3B0aW9ucyAuaW5hY3RpdmV7Y29sb3I6I2JiYjtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O3BhZGRpbmc6NXB4IDEwcHg7bWFyZ2luOjAhaW1wb3J0YW50fSNzaWRlYmFye3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjMycHg7Ym90dG9tOjA7d2lkdGg6MzAwcHg7YmFja2dyb3VuZDojZWVlO292ZXJmbG93OmF1dG99I3NpZGViYXIgKnt2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9I3NpZGViYXIgaW5wdXQsI3NpZGViYXIgc2VsZWN0LCNzaWRlYmFyIHRleHRhcmVhe2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnQ7Y29sb3I6IzQ0NH0jc2lkZWJhciAuUGFuZWx7Y29sb3I6Izg4ODtwYWRkaW5nOjEwcHg7Ym9yZGVyLXRvcDoxcHggc29saWQgI2NjY30jc2lkZWJhciAuUGFuZWwuY29sbGFwc2Vke21hcmdpbi1ib3R0b206MH0jc2lkZWJhciAuUm93e21pbi1oZWlnaHQ6MjBweDttYXJnaW4tYm90dG9tOjEwcHh9I3RhYnN7YmFja2dyb3VuZC1jb2xvcjojZGRkO2JvcmRlci10b3A6MXB4IHNvbGlkICNjY2N9I3RhYnMgc3Bhbntjb2xvcjojYWFhO2JvcmRlci1yaWdodDoxcHggc29saWQgI2NjYztwYWRkaW5nOjEwcHh9I3RhYnMgc3Bhbi5zZWxlY3RlZHtjb2xvcjojODg4O2JhY2tncm91bmQtY29sb3I6I2VlZX0jdG9vbGJhcntwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7cmlnaHQ6MzAwcHg7Ym90dG9tOjA7aGVpZ2h0OjMycHg7YmFja2dyb3VuZDojZWVlO2NvbG9yOiMzMzN9I3Rvb2xiYXIgKnt2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9I3Rvb2xiYXIgLlBhbmVse3BhZGRpbmc6NHB4O2NvbG9yOiM4ODh9I3Rvb2xiYXIgYnV0dG9ue21hcmdpbi1yaWdodDo2cHh9XCI7IChyZXF1aXJlKFwiYnJvd3NlcmlmeS1jc3NcIikuY3JlYXRlU3R5bGUoY3NzLCB7IFwiaHJlZlwiOiBcInNyY1xcXFxwYW5lbHNcXFxcY3NzXFxcXGxpZ2h0LmNzc1wifSkpOyBtb2R1bGUuZXhwb3J0cyA9IGNzczsiLCJ2YXIgY3NzID0gXCJib2R5e2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZToxNHB4O21hcmdpbjowO292ZXJmbG93OmhpZGRlbn1ocntib3JkZXI6MDtib3JkZXItdG9wOjFweCBzb2xpZCAjY2NjfWJ1dHRvbntwb3NpdGlvbjpyZWxhdGl2ZX10ZXh0YXJlYXt0YWItc2l6ZTo0O3doaXRlLXNwYWNlOnByZTt3b3JkLXdyYXA6bm9ybWFsfXRleHRhcmVhLnN1Y2Nlc3N7Ym9yZGVyLWNvbG9yOiM4YjghaW1wb3J0YW50fXRleHRhcmVhLmZhaWx7Ym9yZGVyLWNvbG9yOnJlZCFpbXBvcnRhbnQ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDI1NSwwLDAsLjA1KX1pbnB1dCx0ZXh0YXJlYXtvdXRsaW5lOjB9LlBhbmVsey1tb3otdXNlci1zZWxlY3Q6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7LW8tdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5QYW5lbC5Db2xsYXBzaWJsZSAuU3RhdGlje21hcmdpbjowfS5QYW5lbC5Db2xsYXBzaWJsZSAuU3RhdGljIC5CdXR0b257ZmxvYXQ6bGVmdDttYXJnaW4tcmlnaHQ6NnB4O3dpZHRoOjA7aGVpZ2h0OjA7Ym9yZGVyOjZweCBzb2xpZCB0cmFuc3BhcmVudH0uUGFuZWwuQ29sbGFwc2libGUuY29sbGFwc2VkIC5TdGF0aWMgLkJ1dHRvbnttYXJnaW4tdG9wOjJweDtib3JkZXItbGVmdC1jb2xvcjojYmJifS5QYW5lbC5Db2xsYXBzaWJsZTpub3QoLmNvbGxhcHNlZCkgLlN0YXRpYyAuQnV0dG9ue21hcmdpbi10b3A6NnB4O2JvcmRlci10b3AtY29sb3I6I2JiYn0uUGFuZWwuQ29sbGFwc2libGUuY29sbGFwc2VkIC5Db250ZW50e2Rpc3BsYXk6bm9uZX0uQ29kZU1pcnJvcntwb3NpdGlvbjphYnNvbHV0ZSFpbXBvcnRhbnQ7dG9wOjM3cHg7d2lkdGg6MTAwJSFpbXBvcnRhbnQ7aGVpZ2h0OmNhbGMoMTAwJSAtIDM3cHgpIWltcG9ydGFudH0uQ29kZU1pcnJvciAuZXJyb3JMaW5le2JhY2tncm91bmQ6cmdiYSgyNTUsMCwwLC4yNSl9LkNvZGVNaXJyb3IgLmVzcHJpbWEtZXJyb3J7Y29sb3I6cmVkO3RleHQtYWxpZ246cmlnaHQ7cGFkZGluZzowIDIwcHh9LnR5cGV7cG9zaXRpb246cmVsYXRpdmU7dG9wOi0ycHg7cGFkZGluZzowIDJweDtjb2xvcjojZGRkfS50eXBlOmFmdGVye2NvbnRlbnQ6J+KWoCd9LlNjZW5le2NvbG9yOiNjY2Z9Lk9iamVjdDNEe2NvbG9yOiNhYWV9Lk1lc2h7Y29sb3I6Izg4ZX0uTGluZSwuTGluZVNlZ21lbnRze2NvbG9yOiM4ZTh9LlBvaW50c3tjb2xvcjojZTg4fS5Qb2ludExpZ2h0e2NvbG9yOiNkZDB9Lkdlb21ldHJ5e2NvbG9yOiM4Zjh9LkJveEdlb21ldHJ5e2NvbG9yOiNiZWJ9LlRvcnVzR2VvbWV0cnl7Y29sb3I6I2FlYX0uTWF0ZXJpYWx7Y29sb3I6I2Y4OH0uTWVzaFBob25nTWF0ZXJpYWx7Y29sb3I6I2ZhOH1cIjsgKHJlcXVpcmUoXCJicm93c2VyaWZ5LWNzc1wiKS5jcmVhdGVTdHlsZShjc3MsIHsgXCJocmVmXCI6IFwic3JjXFxcXHBhbmVsc1xcXFxjc3NcXFxcbWFpbi5jc3NcIn0pKTsgbW9kdWxlLmV4cG9ydHMgPSBjc3M7IiwidmFyIGNzcyA9IFwiLmVkaXRvci10b29sc3twb3NpdGlvbjphYnNvbHV0ZTtib3R0b206MDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjgpfS5lZGl0b3ItdG9vbHMgYnV0dG9ue2Zsb2F0OmxlZnR9XCI7IChyZXF1aXJlKFwiYnJvd3NlcmlmeS1jc3NcIikuY3JlYXRlU3R5bGUoY3NzLCB7IFwiaHJlZlwiOiBcInNyY1xcXFxwYW5lbHNcXFxcY3NzXFxcXHRvb2xiYXIuY3NzXCJ9KSk7IG1vZHVsZS5leHBvcnRzID0gY3NzOyIsInJlcXVpcmUoJy4vY3NzL21haW4uY3NzJyk7XG5yZXF1aXJlKCcuL2Nzcy9saWdodC5jc3MnKTtcbnJlcXVpcmUoJy4vY3NzL2N1c3RvbS5jc3MnKTtcbnJlcXVpcmUoJy4vY3NzL3Rvb2xiYXIuY3NzJyk7XG5cbnZhciBUb29sUGFuZWwgPSByZXF1aXJlKCcuL3Rvb2xzJyk7XG52YXIgU2lkZWJhciA9IHJlcXVpcmUoJy4vc2lkZWJhci5qcycpO1xudmFyIE1lbnViYXIgPSByZXF1aXJlKCcuL21lbnViYXIvaW5kZXguanMnKTtcbnZhciBVSSA9IHJlcXVpcmUoJy4uLy4uL2xpYi92ZW5kb3IvdWkuanMnKTsgLy8gQHRvZG8gd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBucG0gcGFja2FnZVxuXG5mdW5jdGlvbiBQYW5lbHMgKGVkaXRvcikge1xuICB0aGlzLnRvb2xQYW5lbCA9IG5ldyBUb29sUGFuZWwoZWRpdG9yKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnRvb2xQYW5lbC5lbCk7XG5cbiAgdGhpcy5zaWRlYmFyID0gbmV3IFNpZGViYXIoZWRpdG9yKTtcbiAgdGhpcy5zaWRlYmFyLmhpZGUoKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnNpZGViYXIuZG9tKTtcblxuICB0aGlzLm1lbnViYXIgPSBuZXcgTWVudWJhcihlZGl0b3IpO1xuICB0aGlzLm1lbnViYXIuaGlkZSgpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubWVudWJhci5kb20pO1xuXG4gIHRoaXMubW9kYWwgPSBuZXcgVUkuTW9kYWwoKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm1vZGFsLmRvbSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxzO1xuIiwidmFyIFVJID0gcmVxdWlyZSgnLi4vLi4vLi4vbGliL3ZlbmRvci91aS5qcycpOyAvLyBAdG9kbyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIG5wbSBwYWNrYWdlXG5cbmZ1bmN0aW9uIE1lbnVBc3NldHMgKGVkaXRvcikge1xuICB2YXIgY29udGFpbmVyID0gbmV3IFVJLlBhbmVsKCk7XG4gIGNvbnRhaW5lci5zZXRDbGFzcygnbWVudScpO1xuXG4gIHZhciB0aXRsZSA9IG5ldyBVSS5QYW5lbCgpO1xuICB0aXRsZS5zZXRDbGFzcygndGl0bGUnKTtcbiAgdGl0bGUuc2V0VGV4dENvbnRlbnQoJ0Fzc2V0cycpO1xuICBjb250YWluZXIuYWRkKHRpdGxlKTtcbi8qXG4gIHZhciBvcHRpb25zID0gbmV3IFVJLlBhbmVsKCk7XG4gIG9wdGlvbnMuc2V0Q2xhc3MoJ29wdGlvbnMnKTtcbiAgY29udGFpbmVyLmFkZChvcHRpb25zKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBBZGQgdGV4dHVyZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB2YXIgb3B0aW9uID0gbmV3IFVJLlJvdygpO1xuICBvcHRpb24uc2V0Q2xhc3MoJ29wdGlvbicpO1xuICBvcHRpb24uc2V0VGV4dENvbnRlbnQoJ0FkZCBUZXh0dXJlJyk7XG4gIG9wdGlvbi5vbkNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGV4dCA9IG5ldyBVSS5UZXh0KCdIZWxsbyBmcm9tIFVJIG1vZGFsJyk7XG4gICAgZWRpdG9yLnNpZ25hbHMuc2hvd01vZGFsLmRpc3BhdGNoKHRleHQpO1xuICB9KTtcbiAgb3B0aW9ucy5hZGQob3B0aW9uKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBBZGQgdGV4dHVyZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBvcHRpb24gPSBuZXcgVUkuUm93KCk7XG4gIG9wdGlvbi5zZXRDbGFzcygnb3B0aW9uJyk7XG4gIG9wdGlvbi5zZXRUZXh0Q29udGVudCgnQWRkIDNkIE1vZGVsJyk7XG4gIG9wdGlvbi5vbkNsaWNrKGZ1bmN0aW9uICgpIHt9KTtcbiAgb3B0aW9ucy5hZGQob3B0aW9uKTtcbiovXG4gIHJldHVybiBjb250YWluZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudUFzc2V0cztcbiIsInZhciBVSSA9IHJlcXVpcmUoJy4uLy4uLy4uL2xpYi92ZW5kb3IvdWkuanMnKTsgLy8gQHRvZG8gd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBucG0gcGFja2FnZVxudmFyIE1lbnVPYmplY3RzID0gcmVxdWlyZSgnLi9vYmplY3RzLmpzJyk7XG52YXIgTWVudVNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZS5qcycpO1xudmFyIE1lbnVTdGF0dXMgPSByZXF1aXJlKCcuL3N0YXR1cy5qcycpO1xudmFyIE1lbnVBc3NldHMgPSByZXF1aXJlKCcuL2Fzc2V0cy5qcycpO1xuXG5mdW5jdGlvbiBNZW51YmFyIChlZGl0b3IpIHtcbiAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5QYW5lbCgpO1xuICBjb250YWluZXIuc2V0SWQoJ21lbnViYXInKTtcblxuICBjb250YWluZXIuYWRkKG5ldyBNZW51U2NlbmUoZWRpdG9yKSk7XG4gIGNvbnRhaW5lci5hZGQobmV3IE1lbnVPYmplY3RzKGVkaXRvcikpO1xuICBjb250YWluZXIuYWRkKG5ldyBNZW51QXNzZXRzKGVkaXRvcikpO1xuXG4gIGNvbnRhaW5lci5hZGQobmV3IE1lbnVTdGF0dXMoZWRpdG9yKSk7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51YmFyO1xuIiwidmFyIFVJID0gcmVxdWlyZSgnLi4vLi4vLi4vbGliL3ZlbmRvci91aS5qcycpOyAvLyBAdG9kbyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIG5wbSBwYWNrYWdlXG5cbmZ1bmN0aW9uIE1lbnVPYmplY3RzIChlZGl0b3IpIHtcbiAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5QYW5lbCgpO1xuICBjb250YWluZXIuc2V0Q2xhc3MoJ21lbnUnKTtcblxuICB2YXIgdGl0bGUgPSBuZXcgVUkuUGFuZWwoKTtcbiAgdGl0bGUuc2V0Q2xhc3MoJ3RpdGxlJyk7XG4gIHRpdGxlLnNldFRleHRDb250ZW50KCdBZGQnKTtcbiAgY29udGFpbmVyLmFkZCh0aXRsZSk7XG5cbiAgdmFyIG9wdGlvbnMgPSBuZXcgVUkuUGFuZWwoKTtcbiAgb3B0aW9ucy5zZXRDbGFzcygnb3B0aW9ucycpO1xuICBjb250YWluZXIuYWRkKG9wdGlvbnMpO1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIE5ld1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gYWRkIGEgbmV3IGVudGl0eSB3aXRoIGEgbGlzdCBvZiBjb21wb25lbnRzXG4gICAqIEBwYXJhbSAge29iamVjdH0gZGVmaW5pdGlvbiBFbnRpdHkgZGVmaW5pdGlvbiB0byBhZGQ6XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWxlbWVudDogJ2EtZW50aXR5JywgY29tcG9uZW50czoge2dlb21ldHJ5OiAncHJpbWl0aXZlOmJveCd9fVxuICAgKiBAcmV0dXJuIHtFbGVtZW50fSAgICAgICAgICAgIEVudGl0eSBjcmVhdGVkXG4gICAqL1xuICBmdW5jdGlvbiBjcmVhdGVOZXdFbnRpdHkgKGRlZmluaXRpb24pIHtcbiAgICB2YXIgZW50aXR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkZWZpbml0aW9uLmVsZW1lbnQpO1xuXG4gICAgLy8gbG9hZCBkZWZhdWx0IGF0dHJpYnV0ZXNcbiAgICBmb3IgKHZhciBhdHRyIGluIGRlZmluaXRpb24uY29tcG9uZW50cykge1xuICAgICAgZW50aXR5LnNldEF0dHJpYnV0ZShhdHRyLCBkZWZpbml0aW9uLmNvbXBvbmVudHNbYXR0cl0pO1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSB0aGUgY29tcG9uZW50cyBhcmUgbG9hZGVkIGJlZm9yZSB1cGRhdGUgdGhlIFVJXG4gICAgZW50aXR5LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGVkaXRvci5hZGRFbnRpdHkoZW50aXR5KTtcbiAgICB9KTtcblxuICAgIGVkaXRvci5zY2VuZUVsLmFwcGVuZENoaWxkKGVudGl0eSk7XG5cbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLy8gTGlzdCBvZiBkZWZpbml0aW9ucyB0byBhZGQgaW4gdGhlIG1lbnUuIEEgbGluZSBicmVhayBpcyBhZGRlZCBldmVyeXRpbWUgJ2dyb3VwJyBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgdmFyIHByaW1pdGl2ZXNEZWZpbml0aW9ucyA9IHtcbiAgICAnRW50aXR5Jzoge2dyb3VwOiAnZW50aXRpZXMnLCBlbGVtZW50OiAnYS1lbnRpdHknLCBjb21wb25lbnRzOiB7fX0sXG5cbiAgICAnQm94Jzoge2dyb3VwOiAncHJpbWl0aXZlcycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtnZW9tZXRyeTogJ3ByaW1pdGl2ZTpib3gnLCBtYXRlcmlhbDogJ2NvbG9yOiNmMDAnfX0sXG4gICAgJ1NwaGVyZSc6IHtncm91cDogJ3ByaW1pdGl2ZXMnLCBlbGVtZW50OiAnYS1lbnRpdHknLCBjb21wb25lbnRzOiB7Z2VvbWV0cnk6ICdwcmltaXRpdmU6c3BoZXJlJywgbWF0ZXJpYWw6ICdjb2xvcjojZmYwJ319LFxuICAgICdDeWxpbmRlcic6IHtncm91cDogJ3ByaW1pdGl2ZXMnLCBlbGVtZW50OiAnYS1lbnRpdHknLCBjb21wb25lbnRzOiB7Z2VvbWV0cnk6ICdwcmltaXRpdmU6Y3lsaW5kZXInLCBtYXRlcmlhbDogJ2NvbG9yOiMwMGYnfX0sXG4gICAgJ1BsYW5lJzoge2dyb3VwOiAncHJpbWl0aXZlcycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtnZW9tZXRyeTogJ3ByaW1pdGl2ZTpwbGFuZScsIG1hdGVyaWFsOiAnY29sb3I6I2ZmZid9fSxcbiAgICAnVG9ydXMnOiB7Z3JvdXA6ICdwcmltaXRpdmVzJywgZWxlbWVudDogJ2EtZW50aXR5JywgY29tcG9uZW50czoge2dlb21ldHJ5OiAncHJpbWl0aXZlOnRvcnVzJywgbWF0ZXJpYWw6ICdjb2xvcjojMGYwJ319LFxuICAgICdUb3J1c0tub3QnOiB7Z3JvdXA6ICdwcmltaXRpdmVzJywgZWxlbWVudDogJ2EtZW50aXR5JywgY29tcG9uZW50czoge2dlb21ldHJ5OiAncHJpbWl0aXZlOnRvcnVzS25vdCcsIG1hdGVyaWFsOiAnY29sb3I6I2YwZid9fSxcbiAgICAnQ2lyY2xlJzoge2dyb3VwOiAncHJpbWl0aXZlcycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtnZW9tZXRyeTogJ3ByaW1pdGl2ZTpjaXJjbGUnLCBtYXRlcmlhbDogJ2NvbG9yOiNmMGYnfX0sXG4gICAgJ1JpbmcnOiB7Z3JvdXA6ICdwcmltaXRpdmVzJywgZWxlbWVudDogJ2EtZW50aXR5JywgY29tcG9uZW50czoge2dlb21ldHJ5OiAncHJpbWl0aXZlOnJpbmcnLCBtYXRlcmlhbDogJ2NvbG9yOiMwZmYnfX0sXG5cbiAgICAnQW1iaWVudCc6IHtncm91cDogJ2xpZ2h0cycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtsaWdodDogJ3R5cGU6YW1iaWVudCd9fSxcbiAgICAnRGlyZWN0aW9uYWwnOiB7Z3JvdXA6ICdsaWdodHMnLCBlbGVtZW50OiAnYS1lbnRpdHknLCBjb21wb25lbnRzOiB7bGlnaHQ6ICd0eXBlOmRpcmVjdGlvbmFsJ319LFxuICAgICdIZW1pc3BoZXJlJzoge2dyb3VwOiAnbGlnaHRzJywgZWxlbWVudDogJ2EtZW50aXR5JywgY29tcG9uZW50czoge2xpZ2h0OiAndHlwZTpoZW1pc3BoZXJlJ319LFxuICAgICdQb2ludCc6IHtncm91cDogJ2xpZ2h0cycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtsaWdodDogJ3R5cGU6cG9pbnQnfX0sXG4gICAgJ1Nwb3QnOiB7Z3JvdXA6ICdsaWdodHMnLCBlbGVtZW50OiAnYS1lbnRpdHknLCBjb21wb25lbnRzOiB7bGlnaHQ6ICd0eXBlOnNwb3QnfX0sXG5cbiAgICAnQ2FtZXJhJzoge2dyb3VwOiAnY2FtZXJhcycsIGVsZW1lbnQ6ICdhLWVudGl0eScsIGNvbXBvbmVudHM6IHtjYW1lcmE6ICcnfX1cbiAgfTtcblxuICB2YXIgcHJldkdyb3VwID0gbnVsbDtcbiAgZm9yICh2YXIgZGVmaW5pdGlvbiBpbiBwcmltaXRpdmVzRGVmaW5pdGlvbnMpIHtcbiAgICAvLyBBZGQgYSBsaW5lIGJyZWFrIGlmIHRoZSBncm91cCBjaGFuZ2VzXG4gICAgaWYgKHByZXZHcm91cCA9PT0gbnVsbCkge1xuICAgICAgcHJldkdyb3VwID0gcHJpbWl0aXZlc0RlZmluaXRpb25zW2RlZmluaXRpb25dLmdyb3VwO1xuICAgIH0gZWxzZSBpZiAocHJldkdyb3VwICE9PSBwcmltaXRpdmVzRGVmaW5pdGlvbnNbZGVmaW5pdGlvbl0uZ3JvdXApIHtcbiAgICAgIHByZXZHcm91cCA9IHByaW1pdGl2ZXNEZWZpbml0aW9uc1tkZWZpbml0aW9uXS5ncm91cDtcbiAgICAgIG9wdGlvbnMuYWRkKG5ldyBVSS5Ib3Jpem9udGFsUnVsZSgpKTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBhIG5ldyBvcHRpb24gaW4gdGhlIG1lbnVcbiAgICB2YXIgb3B0aW9uID0gbmV3IFVJLlJvdygpO1xuICAgIG9wdGlvbi5zZXRDbGFzcygnb3B0aW9uJyk7XG4gICAgb3B0aW9uLnNldFRleHRDb250ZW50KGRlZmluaXRpb24pO1xuICAgIG9wdGlvbi5kb20ub25jbGljayA9IChmdW5jdGlvbiAoZGVmKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjcmVhdGVOZXdFbnRpdHkoZGVmKTtcbiAgICAgIH07XG4gICAgfSkocHJpbWl0aXZlc0RlZmluaXRpb25zW2RlZmluaXRpb25dKTtcbiAgICBvcHRpb25zLmFkZChvcHRpb24pO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51T2JqZWN0cztcbiIsIi8qIGdsb2JhbCBVUkwgQmxvYiAqL1xudmFyIFVJID0gcmVxdWlyZSgnLi4vLi4vLi4vbGliL3ZlbmRvci91aS5qcycpOyAvLyBAdG9kbyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIG5wbSBwYWNrYWdlXG52YXIgQ2xpcGJvYXJkID0gcmVxdWlyZSgnY2xpcGJvYXJkJyk7XG52YXIgRXhwb3J0ZXIgPSByZXF1aXJlKCcuLi8uLi9leHBvcnRlci5qcycpO1xuXG5mdW5jdGlvbiBNZW51U2NlbmUgKGVkaXRvcikge1xuICB2YXIgY29udGFpbmVyID0gbmV3IFVJLlBhbmVsKCk7XG4gIGNvbnRhaW5lci5zZXRDbGFzcygnbWVudScpO1xuXG4gIHZhciB0aXRsZSA9IG5ldyBVSS5QYW5lbCgpO1xuICB0aXRsZS5zZXRDbGFzcygndGl0bGUnKTtcbiAgdGl0bGUuc2V0VGV4dENvbnRlbnQoJ1NjZW5lJyk7XG4gIGNvbnRhaW5lci5hZGQodGl0bGUpO1xuXG4gIHZhciBvcHRpb25zID0gbmV3IFVJLlBhbmVsKCk7XG4gIG9wdGlvbnMuc2V0Q2xhc3MoJ29wdGlvbnMnKTtcbiAgY29udGFpbmVyLmFkZChvcHRpb25zKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBOZXdcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8qICB2YXIgb3B0aW9uID0gbmV3IFVJLlJvdygpO1xuICBvcHRpb24uc2V0Q2xhc3MoJ29wdGlvbicpO1xuICBvcHRpb24uc2V0VGV4dENvbnRlbnQoJ05ldycpO1xuICBvcHRpb24ub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHdpbmRvdy5jb25maXJtKCdBbnkgdW5zYXZlZCBkYXRhIHdpbGwgYmUgbG9zdC4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICBlZGl0b3IuY2xlYXIoKTtcbiAgICB9XG4gIH0pO1xuICBvcHRpb25zLmFkZChvcHRpb24pO1xuKi9cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTYXZlIEhUTUxcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdmFyIG9wdGlvbiA9IG5ldyBVSS5Sb3coKTtcbiAgb3B0aW9uLnNldENsYXNzKCdvcHRpb24nKTtcbiAgb3B0aW9uLnNldFRleHRDb250ZW50KCdTYXZlIEhUTUwnKTtcbiAgb3B0aW9uLm9uQ2xpY2soZnVuY3Rpb24gKCkge1xuICAgIHNhdmVTdHJpbmcoRXhwb3J0ZXIuZ2VuZXJhdGVIdG1sKCksICdhc2NlbmUuaHRtbCcpO1xuICB9KTtcbiAgb3B0aW9ucy5hZGQob3B0aW9uKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTYXZlIEhUTUxcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgb3B0aW9uID0gbmV3IFVJLlJvdygpO1xuICBvcHRpb24uc2V0Q2xhc3MoJ29wdGlvbicpO1xuICBvcHRpb24uc2V0VGV4dENvbnRlbnQoJ0NvcHkgdG8gY2xpcGJvYXJkJyk7XG4gIG9wdGlvbi5zZXRJZCgnY29weS1zY2VuZScpO1xuICBvcHRpb25zLmFkZChvcHRpb24pO1xuXG4gIHZhciBjbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkKCcjY29weS1zY2VuZScsIHtcbiAgICB0ZXh0OiBmdW5jdGlvbiAodHJpZ2dlcikge1xuICAgICAgcmV0dXJuIEV4cG9ydGVyLmdlbmVyYXRlSHRtbCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy9cbiAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIGxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rKTsgLy8gRmlyZWZveCB3b3JrYXJvdW5kLCBzZWUgIzY1OTRcbiAgZnVuY3Rpb24gc2F2ZSAoYmxvYiwgZmlsZW5hbWUpIHtcbiAgICBsaW5rLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGxpbmsuZG93bmxvYWQgPSBmaWxlbmFtZSB8fCAnZGF0YS5qc29uJztcbiAgICBsaW5rLmNsaWNrKCk7XG4gICAgLy8gVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpOyBicmVha3MgRmlyZWZveC4uLlxuICB9XG5cbiAgZnVuY3Rpb24gc2F2ZVN0cmluZyAodGV4dCwgZmlsZW5hbWUpIHtcbiAgICBzYXZlKG5ldyBCbG9iKFsgdGV4dCBdLCB7IHR5cGU6ICd0ZXh0L3BsYWluJyB9KSwgZmlsZW5hbWUpO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51U2NlbmU7XG4iLCIvKiBnbG9iYWwgYWZyYW1lQ29yZSAqL1xudmFyIFVJID0gcmVxdWlyZSgnLi4vLi4vLi4vbGliL3ZlbmRvci91aS5qcycpOyAvLyBAdG9kbyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIG5wbSBwYWNrYWdlXG5cbmZ1bmN0aW9uIE1lbnVTdGF0dXMgKGVkaXRvcikge1xuICB2YXIgY29udGFpbmVyID0gbmV3IFVJLlBhbmVsKCk7XG4gIGNvbnRhaW5lci5zZXRDbGFzcygnbWVudSByaWdodCcpO1xuXG4gIHZhciB2ZXJzaW9uID0gbmV3IFVJLlRleHQoJ2FmcmFtZSB2JyArIGFmcmFtZUNvcmUudmVyc2lvbik7XG5cbiAgdmVyc2lvbi5zZXRDbGFzcygndGl0bGUnKTtcbiAgdmVyc2lvbi5zZXRPcGFjaXR5KDAuNSk7XG4gIGNvbnRhaW5lci5hZGQodmVyc2lvbik7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51U3RhdHVzO1xuIiwiLyogZ2xvYmFsIGFmcmFtZUVkaXRvciAqL1xudmFyIFVJID0gcmVxdWlyZSgnLi4vLi4vbGliL3ZlbmRvci91aS5qcycpOyAvLyBAdG9kbyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIG5wbSBwYWNrYWdlXG5cbmZ1bmN0aW9uIFNjZW5lR3JhcGggKGVkaXRvcikge1xuICAvLyBNZWdhaGFjayB0byBpbmNsdWRlIGZvbnQtYXdlc29tZVxuICAvLyAtLS0tLS0tLS0tLS0tXG4gIHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICBsaW5rLmhyZWYgPSAnaHR0cHM6Ly9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9mb250LWF3ZXNvbWUvNC41LjAvY3NzL2ZvbnQtYXdlc29tZS5taW4uY3NzJztcbiAgbGluay50eXBlID0gJ3RleHQvY3NzJztcbiAgbGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG4gIGxpbmsubWVkaWEgPSAnc2NyZWVuLHByaW50JztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsaW5rKTtcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgdGhpcy5zY2VuZSA9IGVkaXRvci5zY2VuZUVsO1xuXG4gIHZhciBzaWduYWxzID0gZWRpdG9yLnNpZ25hbHM7XG4gIHZhciBjb250YWluZXIgPSBuZXcgVUkuUGFuZWwoKTtcbiAgdmFyIGlnbm9yZU9iamVjdFNlbGVjdGVkU2lnbmFsID0gZmFsc2U7XG4gIHZhciBvdXRsaW5lciA9IHRoaXMub3V0bGluZXIgPSBuZXcgVUkuT3V0bGluZXIoZWRpdG9yKTtcblxuICAvLyBoYW5kbGUgZW50aXR5IHNlbGVjdGlvbiBjaGFuZ2UgaW4gcGFuZWxcbiAgb3V0bGluZXIub25DaGFuZ2UoZnVuY3Rpb24gKGUpIHtcbiAgICBpZ25vcmVPYmplY3RTZWxlY3RlZFNpZ25hbCA9IHRydWU7XG4gICAgYWZyYW1lRWRpdG9yLmVkaXRvci5zZWxlY3RFbnRpdHkob3V0bGluZXIuZ2V0VmFsdWUoKSk7XG4gICAgaWdub3JlT2JqZWN0U2VsZWN0ZWRTaWduYWwgPSBmYWxzZTtcbiAgfSk7XG5cbiAgLy8gaGFuZGxlIGVudHRpeSBjaGFuZ2Ugc2VsZWN0aW9uIGZyb20gc2NlbmUuXG4gIHNpZ25hbHMub2JqZWN0U2VsZWN0ZWQuYWRkKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvLyBpZ25vcmUgYXV0b21hdGVkIHNlbGVjdGlvbiBvZiBvYmplY3QgaW4gc2NlbmUgdHJpZ2dlcmVkIGZyb20gb3V0bGluZXIuXG4gICAgaWYgKGlnbm9yZU9iamVjdFNlbGVjdGVkU2lnbmFsID09PSB0cnVlKSB7IHJldHVybjsgfVxuICAgIC8vIHNldCBvdXRsaW5lciB0byBjdXJyZW50IHNlbGVjdGVkIG9iamVjdFxuICAgIG91dGxpbmVyLnNldFZhbHVlKG9iamVjdCAhPT0gbnVsbCA/IG9iamVjdC5lbCA6IG51bGwpO1xuICB9KTtcblxuICBzaWduYWxzLnNjZW5lR3JhcGhDaGFuZ2VkLmFkZCh0aGlzLnJlZnJlc2gsIHRoaXMpO1xuXG4gIGNvbnRhaW5lci5hZGQob3V0bGluZXIpO1xuICB2YXIgYnV0dG9uUmVtb3ZlID0gbmV3IFVJLkJ1dHRvbignRGVsZXRlJykub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGVkaXRvci5zZWxlY3RlZEVudGl0eSkge1xuICAgICAgZWRpdG9yLnNlbGVjdGVkRW50aXR5LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWRpdG9yLnNlbGVjdGVkRW50aXR5KTtcbiAgICAgIGVkaXRvci5zZWxlY3RFbnRpdHkobnVsbCk7XG4gICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKSk7XG4gIGNvbnRhaW5lci5hZGQoYnV0dG9uUmVtb3ZlKTtcbiAgY29udGFpbmVyLmFkZChuZXcgVUkuQnJlYWsoKSk7XG5cbiAgdGhpcy5yZWZyZXNoKCk7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxuU2NlbmVHcmFwaC5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG9wdGlvbnMgPSBbXTtcbiAgb3B0aW9ucy5wdXNoKHsgc3RhdGljOiB0cnVlLCB2YWx1ZTogdGhpcy5zY2VuZSwgaHRtbDogJzxzcGFuIGNsYXNzPVwidHlwZVwiPjwvc3Bhbj4gYS1zY2VuZScgfSk7XG5cbiAgZnVuY3Rpb24gdHJlZUl0ZXJhdGUgKGVsZW1lbnQsIGRlcHRoKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGRlcHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlcHRoID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVwdGggKz0gMTtcbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gZWxlbWVudC5jaGlsZHJlbjtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuXG4gICAgICAvLyBmaWx0ZXIgb3V0IGFsbCBlbnRpdGllcyBhZGRlZCBieSBlZGl0b3IgYW5kIHRoZSBjYW52YXMgYWRkZWQgYnkgYWZyYW1lLWNvcmVcbiAgICAgIGlmICghY2hpbGQuZGF0YXNldC5pc0VkaXRvciAmJiBjaGlsZC5pc0VudGl0eSkge1xuICAgICAgICB2YXIgZXh0cmEgPSAnJztcblxuICAgICAgICB2YXIgaWNvbnMgPSB7J2NhbWVyYSc6ICdmYS12aWRlby1jYW1lcmEnLCAnbGlnaHQnOiAnZmEtbGlnaHRidWxiLW8nLCAnZ2VvbWV0cnknOiAnZmEtY3ViZScsICdtYXRlcmlhbCc6ICdmYS1waWN0dXJlLW8nfTtcbiAgICAgICAgZm9yICh2YXIgaWNvbiBpbiBpY29ucykge1xuICAgICAgICAgIGlmIChjaGlsZC5jb21wb25lbnRzICYmIGNoaWxkLmNvbXBvbmVudHNbaWNvbl0pIHtcbiAgICAgICAgICAgIGV4dHJhICs9ICcgPGkgY2xhc3M9XCJmYSAnICsgaWNvbnNbaWNvbl0gKyAnXCI+PC9pPic7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHR5cGVDbGFzcyA9ICdFbnRpdHknO1xuICAgICAgICBzd2l0Y2ggKGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIGNhc2UgJ2EtYW5pbWF0aW9uJzpcbiAgICAgICAgICAgIHR5cGVDbGFzcyA9ICdBbmltYXRpb24nO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYS1lbnRpdHknOlxuICAgICAgICAgICAgdHlwZUNsYXNzID0gJ0VudGl0eSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdHlwZUNsYXNzID0gJ1RlbXBsYXRlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0eXBlID0gJzxzcGFuIGNsYXNzPVwidHlwZSAnICsgdHlwZUNsYXNzICsgJ1wiPjwvc3Bhbj4nO1xuICAgICAgICB2YXIgcGFkID0gJyZuYnNwOyZuYnNwOyZuYnNwOycucmVwZWF0KGRlcHRoKTtcbiAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuaWQgPyBjaGlsZC5pZCA6IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBvcHRpb25zLnB1c2goe1xuICAgICAgICAgIHN0YXRpYzogdHJ1ZSxcbiAgICAgICAgICB2YWx1ZTogY2hpbGQsXG4gICAgICAgICAgaHRtbDogcGFkICsgdHlwZSArIGxhYmVsICsgZXh0cmFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ2EtZW50aXR5Jykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHRyZWVJdGVyYXRlKGNoaWxkLCBkZXB0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRyZWVJdGVyYXRlKHRoaXMuc2NlbmUpO1xuICB0aGlzLm91dGxpbmVyLnNldE9wdGlvbnMob3B0aW9ucyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lR3JhcGg7XG4iLCJ2YXIgVUkgPSByZXF1aXJlKCcuLi8uLi9saWIvdmVuZG9yL3VpLmpzJyk7IC8vIEB0b2RvIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgbnBtIHBhY2thZ2VcbnZhciBTY2VuZUdyYXBoID0gcmVxdWlyZSgnLi9zY2VuZWdyYXBoJyk7XG52YXIgQXR0cmlidXRlcyA9IHJlcXVpcmUoJy4vYXR0cmlidXRlcycpO1xuXG5mdW5jdGlvbiBTaWRlYmFyIChlZGl0b3IpIHtcbiAgdmFyIGNvbnRhaW5lciA9IG5ldyBVSS5QYW5lbCgpO1xuICBjb250YWluZXIuc2V0SWQoJ3NpZGViYXInKTtcblxuICAvLyBAdG9kbyBUaGlzIG11c3QgdGFrZW4gb3V0IGZyb20gaGVyZSBhbmQgcHV0IGluIGFub3RoZXIgcGFuZWxcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB2YXIgYnV0dG9ucyA9IG5ldyBVSS5QYW5lbCgpO1xuICBjb250YWluZXIuYWRkKGJ1dHRvbnMpO1xuXG4gIC8vIHRyYW5zbGF0ZSAvIHJvdGF0ZSAvIHNjYWxlXG4gIHZhciB0cmFuc2xhdGUgPSBuZXcgVUkuQnV0dG9uKCd0cmFuc2xhdGUnKS5vbkNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBlZGl0b3Iuc2lnbmFscy50cmFuc2Zvcm1Nb2RlQ2hhbmdlZC5kaXNwYXRjaCgndHJhbnNsYXRlJyk7XG4gIH0pO1xuICBidXR0b25zLmFkZCh0cmFuc2xhdGUpO1xuXG4gIHZhciByb3RhdGUgPSBuZXcgVUkuQnV0dG9uKCdyb3RhdGUnKS5vbkNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBlZGl0b3Iuc2lnbmFscy50cmFuc2Zvcm1Nb2RlQ2hhbmdlZC5kaXNwYXRjaCgncm90YXRlJyk7XG4gIH0pO1xuICBidXR0b25zLmFkZChyb3RhdGUpO1xuXG4gIHZhciBzY2FsZSA9IG5ldyBVSS5CdXR0b24oJ3NjYWxlJykub25DbGljayhmdW5jdGlvbiAoKSB7XG4gICAgZWRpdG9yLnNpZ25hbHMudHJhbnNmb3JtTW9kZUNoYW5nZWQuZGlzcGF0Y2goJ3NjYWxlJyk7XG4gIH0pO1xuICBidXR0b25zLmFkZChzY2FsZSk7XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICB2YXIgdGFicyA9IG5ldyBVSS5EaXYoKTtcbiAgdGFicy5zZXRJZCgndGFicycpO1xuXG4gIHZhciBzY2VuZVRhYiA9IG5ldyBVSS5UZXh0KCdTQ0VORScpLm9uQ2xpY2sob25DbGljayk7XG4gIHZhciBhc3NldHNUYWIgPSBuZXcgVUkuVGV4dCgnQVNTRVRTJykub25DbGljayhvbkNsaWNrKTtcblxuICB0YWJzLmFkZChzY2VuZVRhYiwgYXNzZXRzVGFiKTtcbiAgY29udGFpbmVyLmFkZCh0YWJzKTtcblxuICBmdW5jdGlvbiBvbkNsaWNrIChldmVudCkge1xuICAgIHNlbGVjdChldmVudC50YXJnZXQudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgdGhpcy5zY2VuZUdyYXBoID0gbmV3IFNjZW5lR3JhcGgoZWRpdG9yKTtcbiAgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IEF0dHJpYnV0ZXMoZWRpdG9yKTtcblxuICB2YXIgc2NlbmUgPSBuZXcgVUkuU3BhbigpLmFkZChcbiAgICB0aGlzLnNjZW5lR3JhcGgsXG4gICAgdGhpcy5hdHRyaWJ1dGVzXG4gICk7XG5cbiAgY29udGFpbmVyLmFkZChzY2VuZSk7XG5cbiAgZnVuY3Rpb24gc2VsZWN0IChzZWN0aW9uKSB7XG4gICAgc2NlbmVUYWIuc2V0Q2xhc3MoJycpO1xuICAgIGFzc2V0c1RhYi5zZXRDbGFzcygnJyk7XG5cbiAgICBzY2VuZS5zZXREaXNwbGF5KCdub25lJyk7XG4gICAgLy8gYXNzZXRzLnNldERpc3BsYXkoJ25vbmUnKTtcblxuICAgIHN3aXRjaCAoc2VjdGlvbikge1xuICAgICAgY2FzZSAnU0NFTkUnOlxuICAgICAgICBzY2VuZVRhYi5zZXRDbGFzcygnc2VsZWN0ZWQnKTtcbiAgICAgICAgc2NlbmUuc2V0RGlzcGxheSgnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnQVNTRVRTJzpcbiAgICAgICAgYXNzZXRzVGFiLnNldENsYXNzKCdzZWxlY3RlZCcpO1xuICAgICAgICAvLyBhc3NldHMuc2V0RGlzcGxheSgnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbGVjdCgnU0NFTkUnKTtcblxuICByZXR1cm4gY29udGFpbmVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNpZGViYXI7XG4iLCJmdW5jdGlvbiBQYW5lbCAoZWRpdG9yKSB7XG4gIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItdG9vbHMnKTtcbiAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIHRoaXMuZWRpdFRvZ2dsZSgpO1xufVxuXG5QYW5lbC5wcm90b3R5cGUuZWRpdFRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy50b2dnbGVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgdGhpcy50b2dnbGVCdXR0b24uaW5uZXJIVE1MID0gJ0VkaXQnO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMudG9nZ2xlQnV0dG9uKTtcbiAgdGhpcy50b2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uVG9nZ2xlQ2xpY2suYmluZCh0aGlzKSk7XG59O1xuXG5QYW5lbC5wcm90b3R5cGUub25Ub2dnbGVDbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gIHRoaXMuYWN0aXZlID0gdGhpcy5hY3RpdmUgPT09IGZhbHNlO1xuXG4gIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgIHRoaXMuZWRpdG9yLmVuYWJsZSgpO1xuICAgIHRoaXMudG9nZ2xlQnV0dG9uLmlubmVySFRNTCA9ICdFeGl0JztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVkaXRvci5kaXNhYmxlKCk7XG4gICAgdGhpcy50b2dnbGVCdXR0b24uaW5uZXJIVE1MID0gJ0VkaXQnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsO1xuIiwiLyogZ2xvYmFsIGFmcmFtZUNvcmUgYWZyYW1lRWRpdG9yICovXG52YXIgVUkgPSByZXF1aXJlKCcuLi8uLi9saWIvdmVuZG9yL3VpLmpzJyk7IC8vIEB0b2RvIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgbnBtIHBhY2thZ2VcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHdpZGdldHM6IHt9LFxuICBrbm93bldpZGdldHNUeXBlOiBbJ3NlbGVjdCcsICdib29sZWFuJywgJ251bWJlcicsICdpbnQnLCAnc3RyaW5nJywgJ21hcCcsICdjb2xvcicsICd2ZWMzJ10sXG5cbiAgLyoqXG4gICAqIFt1cGRhdGVXaWRnZXRWYWx1ZSBkZXNjcmlwdGlvbl1cbiAgICogQHBhcmFtICB7W3R5cGVdfSBpZCAgICBbZGVzY3JpcHRpb25dXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdmFsdWUgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIHVwZGF0ZVdpZGdldFZhbHVlOiBmdW5jdGlvbiAoaWQsIHZhbHVlKSB7XG4gICAgaWYgKHRoaXMud2lkZ2V0c1tpZF0pIHtcbiAgICAgIHRoaXMud2lkZ2V0c1tpZF0uc2V0VmFsdWUodmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogR2l2ZW4gYW4gcHJvcGVydHlTY2hlbWEgaXQgd2lsbCByZXR1cm5zIHRoZSBpbmZlcmVkIGJ5IHRoZSBkZWZhdWx0IHZhbHVlIGluIGNhc2VcbiAgICogdGhhdCAndHlwZScgYXR0cmlidXRlIGlzIG5vdCBkZWZpbmVkXG4gICAqIEBwYXJhbSAge29iamVjdH0gcHJvcGVydHlTY2hlbWEgSlNPTiBzY2hlbWEgZm9yIHRoZSBhdHRyaWJ1dGVcbiAgICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgUHJvcGVydHkgdHlwZVxuICAgKi9cbiAgZ2V0UHJvcGVydHlUeXBlOiBmdW5jdGlvbiAocHJvcGVydHlTY2hlbWEpIHtcbiAgICB2YXIgZGVmYXVsdFZhbHVlID0gcHJvcGVydHlTY2hlbWEuZGVmYXVsdDtcbiAgICBpZiAocHJvcGVydHlTY2hlbWEub25lT2YpIHtcbiAgICAgIHJldHVybiAnc2VsZWN0JztcbiAgICB9IGVsc2UgaWYgKHByb3BlcnR5U2NoZW1hLnR5cGUgJiYgdGhpcy5rbm93bldpZGdldHNUeXBlLmluZGV4T2YocHJvcGVydHlTY2hlbWEudHlwZSkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gcHJvcGVydHlTY2hlbWEudHlwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoICh0eXBlb2YgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgIHJldHVybiAnYm9vbGVhbic7XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgcmV0dXJuICdudW1iZXInO1xuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgIHJldHVybiAndmVjMyc7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgcmV0dXJuIChkZWZhdWx0VmFsdWUuaW5kZXhPZignIycpID09PSAtMSkgPyAnc3RyaW5nJyA6ICdjb2xvcic7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29uc29sZS53YXJuKCdVbmtub3duIGF0dHJpYnV0ZScsIHByb3BlcnR5U2NoZW1hKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSB3aWRnZXQgYmFzZWQgb24gdGhlIHR5cGUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgKiBJZiBhIHNjaGVtYSBpcyBwcm92aWRlZCBpdCdzIHVzZWQgdG8gc2V0IG1pbi9tYXggdmFsdWVzIG9yIHBvcHVsYXRlIHRoZSBjb21ib2JveCB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb21wb25lbnROYW1lICAgTmFtZSBvZiB0aGUgY29tcG9uZW50IHRoYXQgaGFzIHRoaXMgYXR0cmlidXRlIChlLmc6ICdnZW9tZXRyeScpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eU5hbWUgICBQcm9wZXJ0eSBuYW1lIGluIHRoZSBjb21wb25lbnQgKGUuZzogJ3ByaW1pdGl2ZScpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSAgICAgICAgUHJvcGVydHkgbmFtZSBpbiBjYXNlIG9mIG11bHRpdmFsdWVzIGF0dHJpYnV0ZXMgKGUuZzogJ3gnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAgICAgICAgICAgIFR5cGUgb2YgdGhlIHdpZGdldCB0byBnZW5lcmF0ZSAoZS5nOiAnY2hlY2tib3gnKVxuICAgKiBAcGFyYW0ge0pTT059IHByb3BlcnR5U2NoZW1hIFtPcHRpb25hbF0gSlNPTiB3aXRoIHRoZSBzY2hlbWEgZGVmaW5pdGlvbiBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcmV0dXJuIHtVSS5XaWRnZXR9IFJldHVybnMgYW4gVUkuanMgd2lkZ2V0IGJhc2VkIG9uIHRoZSB0eXBlIGFuZCBzY2hlbWEgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIGdldFdpZGdldEZyb21Qcm9wZXJ0eTogZnVuY3Rpb24gKGNvbXBvbmVudE5hbWUsIHByb3BlcnR5TmFtZSwgcHJvcGVydHksIG9uVXBkYXRlRW50aXR5VmFsdWUsIHByb3BlcnR5U2NoZW1hKSB7XG4gICAgdmFyIHdpZGdldCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0eVNjaGVtYSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHByb3BlcnR5U2NoZW1hID0ge307XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvcGVydHlTY2hlbWEgIT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGNvbXBvbmVudE5hbWUsIHByb3BlcnR5TmFtZSwgcHJvcGVydHksIHByb3BlcnR5U2NoZW1hKTtcbiAgICB9XG5cbiAgICB2YXIgdHlwZSA9IHRoaXMuZ2V0UHJvcGVydHlUeXBlKHByb3BlcnR5U2NoZW1hKTtcbiAgICB2YXIgb25DaGFuZ2UgPSBudWxsO1xuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgICAgICAvLyBDb252ZXJ0IGFycmF5IHRvIG9iamVjdFxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcHJvcGVydHlTY2hlbWEub25lT2YpIHtcbiAgICAgICAgICBvcHRpb25zW3Byb3BlcnR5U2NoZW1hLm9uZU9mW2tleV1dID0gcHJvcGVydHlTY2hlbWEub25lT2Zba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21wb25lbnROYW1lID09PSAnbWF0ZXJpYWwnICYmIHByb3BlcnR5ID09PSAnc2hhZGVyJykge1xuICAgICAgICAgIC8vIEBmaXhtZSBCZXR0ZXIgYWNjZXNzIHRvIHNoYWRlcnNcbiAgICAgICAgICBmb3IgKHZhciBzaGFkZXIgaW4gYWZyYW1lRWRpdG9yLmVkaXRvci5zaGFkZXJMb2FkZXIuc2hhZGVycykge1xuICAgICAgICAgICAgb3B0aW9uc1tzaGFkZXJdID0gc2hhZGVyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9uQ2hhbmdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBhZnJhbWVFZGl0b3IuZWRpdG9yLnNoYWRlckxvYWRlci5hZGRTaGFkZXJUb1NjZW5lKGV2ZW50LnRhcmdldC5vcHRpb25zW2V2ZW50LnRhcmdldC5zZWxlY3RlZEluZGV4XS52YWx1ZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBvblVwZGF0ZUVudGl0eVZhbHVlKGV2ZW50LCBjb21wb25lbnROYW1lLCBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgYWZyYW1lRWRpdG9yLmVkaXRvci5zaWduYWxzLmdlbmVyYXRlQ29tcG9uZW50c1BhbmVscy5kaXNwYXRjaCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5TZWxlY3QoKS5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICB3aWRnZXQgPSBuZXcgVUkuQ2hlY2tib3goKS5zZXRXaWR0aCgnNTBweCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5OdW1iZXIoKS5zZXRXaWR0aCgnNTBweCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2ludCc6XG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5OdW1iZXIoKS5zZXRXaWR0aCgnNTBweCcpLnNldFByZWNpc2lvbigwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICB3aWRnZXQgPSBuZXcgVUkuSW5wdXQoJycpLnNldFdpZHRoKCc1MHB4Jyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICB3aWRnZXQgPSBuZXcgVUkuQ29sb3IoKS5zZXRXaWR0aCgnNTBweCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21hcCc6XG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5UZXh0dXJlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndmVjMyc6XG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5WZWN0b3IzKCkuc2V0V2lkdGgoJzE1MHB4Jyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmtub3duIGNvbXBvbmVudCB0eXBlJywgY29tcG9uZW50TmFtZSwgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eSwgdHlwZSk7XG4gICAgICAgIHdpZGdldCA9IG5ldyBVSS5JbnB1dCgnJyk7XG4gICAgfVxuICAgIGlmIChwcm9wZXJ0eVNjaGVtYS5oYXNPd25Qcm9wZXJ0eSgnbWluJykpIHtcbiAgICAgIHdpZGdldC5taW4gPSBwcm9wZXJ0eVNjaGVtYS5taW47XG4gICAgfVxuICAgIGlmIChwcm9wZXJ0eVNjaGVtYS5oYXNPd25Qcm9wZXJ0eSgnbWF4JykpIHtcbiAgICAgIHdpZGdldC5tYXggPSBwcm9wZXJ0eVNjaGVtYS5tYXg7XG4gICAgfVxuICAgIHdpZGdldC5zY2hlbWEgPSBwcm9wZXJ0eVNjaGVtYTtcblxuICAgIGlmIChvbkNoYW5nZSkge1xuICAgICAgd2lkZ2V0Lm9uQ2hhbmdlKG9uQ2hhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkZ2V0Lm9uQ2hhbmdlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBvblVwZGF0ZUVudGl0eVZhbHVlKGV2ZW50LCBjb21wb25lbnROYW1lLCBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEdlbmVyYXRlIGFuIHVuaXF1ZSBJRCBmb3IgdGhpcyBhdHRyaWJ1dGUgKGUuZzogZ2VvbWV0cnkucHJpbWl0aXZlKVxuICAgIC8vIGFuZCBzYXZlIGl0IG9uIHRoZSB3aWRnZXRzIHZhcmlhYmxlIHNvIHdlIGNvdWxkIGVhc2lseSBhY2Nlc3MgdG8gaXQgaW4gdGhlIGZvbGxvd2luZyBmdW5jdGlvbnNcbiAgICB2YXIgaWQgPSBwcm9wZXJ0eU5hbWUgPyBjb21wb25lbnROYW1lICsgJy4nICsgcHJvcGVydHlOYW1lICsgJy4nICsgcHJvcGVydHkgOiBwcm9wZXJ0eSA/IChjb21wb25lbnROYW1lICsgJy4nICsgcHJvcGVydHkpIDogY29tcG9uZW50TmFtZTtcbiAgICB3aWRnZXQuc2V0SWQoaWQpO1xuICAgIHdpZGdldC5zZXRWYWx1ZShwcm9wZXJ0eVNjaGVtYS5kZWZhdWx0KTtcblxuICAgIHRoaXMud2lkZ2V0c1tpZF0gPSB3aWRnZXQ7XG4gICAgcmV0dXJuIHdpZGdldDtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB3aWRnZXRzIHZpc2liaWxpdHkgYmFzZWQgb24gdGhlICdpZicgYXR0cmlidXRlIGZyb20gdGhlaXJzIGF0dHJpYnV0ZScgc2NoZW1hXG4gICAqIEBwYXJhbSAge0VsZW1lbnR9IGVudGl0eSBFbnRpdHkgY3VycmVudGx5IHNlbGVjdGVkXG4gICAqL1xuICB1cGRhdGVXaWRnZXRWaXNpYmlsaXR5OiBmdW5jdGlvbiAoZW50aXR5KSB7XG4gICAgZm9yICh2YXIgY29tcG9uZW50TmFtZSBpbiBlbnRpdHkuY29tcG9uZW50cykge1xuICAgICAgdmFyIHByb3BlcnRpZXMgPSBhZnJhbWVDb3JlLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0uc2NoZW1hO1xuICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllcykge1xuICAgICAgICB2YXIgaWQgPSBjb21wb25lbnROYW1lICsgJy4nICsgcHJvcGVydHk7XG4gICAgICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldHNbaWRdO1xuICAgICAgICBpZiAod2lkZ2V0ICYmIHdpZGdldC5wcm9wZXJ0eVJvdykge1xuICAgICAgICAgIHZhciB2aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICBpZiAod2lkZ2V0LnNjaGVtYS5pZikge1xuICAgICAgICAgICAgZm9yICh2YXIgY29uZGl0aW9uIGluIHdpZGdldC5zY2hlbWEuaWYpIHtcbiAgICAgICAgICAgICAgdmFyIGlmV2lkZ2V0ID0gdGhpcy53aWRnZXRzW2NvbXBvbmVudE5hbWUgKyAnLicgKyBjb25kaXRpb25dO1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnNjaGVtYS5pZltjb25kaXRpb25dLmluZGV4T2YoaWZXaWRnZXQuZ2V0VmFsdWUoKSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgICAgICB3aWRnZXQucHJvcGVydHlSb3cuc2hvdygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aWRnZXQucHJvcGVydHlSb3cuaGlkZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG59O1xuIiwiLy8gUmV1c2UgY29tcG9uZW50TG9hZGVyIGFuZCBjcmVhdGUganVzdCBvbmUgbG9hZGVyIGZvciBib3RoIHR5cGVzXG5mdW5jdGlvbiBTaGFkZXJMb2FkZXIgKCkge1xuICB0aGlzLnNoYWRlcnMgPSBudWxsO1xuICB0aGlzLmxvYWRTaGFkZXJzRGF0YSgpO1xufVxuXG5TaGFkZXJMb2FkZXIucHJvdG90eXBlID0ge1xuICBsb2FkU2hhZGVyc0RhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeGhyID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpO1xuICAgIC8vIEB0b2RvIFJlbW92ZSB0aGUgc3luYyBjYWxsIGFuZCB1c2UgYSBjYWxsYmFja1xuICAgIHhoci5vcGVuKCdHRVQnLCAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2Zlcm5hbmRvanNnL2FmcmFtZS1zaGFkZXJzL21hc3Rlci9zaGFkZXJzLmpzb24nLCBmYWxzZSk7XG4gICAgLy8geGhyLm9wZW4oJ0dFVCcsICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYWZyYW1ldnIvYWZyYW1lLXNoYWRlcnMvbWFzdGVyL3NoYWRlcnMuanNvbicsIGZhbHNlKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zaGFkZXJzID0gd2luZG93LkpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICBjb25zb2xlLmluZm8oJ0xvYWRlZCBTaGFkZXJzOicsIE9iamVjdC5rZXlzKHRoaXMuc2hhZGVycykubGVuZ3RoKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBwcm9jZXNzIGVycm9yXG4gICAgfTtcbiAgICB4aHIuc2VuZCgpO1xuICB9LFxuICBhZGRTaGFkZXJUb1NjZW5lOiBmdW5jdGlvbiAoc2hhZGVyTmFtZSwgb25Mb2FkZWQpIHtcbiAgICB2YXIgc2hhZGVyID0gdGhpcy5zaGFkZXJzW3NoYWRlck5hbWVdO1xuICAgIGlmIChzaGFkZXIgJiYgIXNoYWRlci5pbmNsdWRlZCkge1xuICAgICAgY29uc29sZS5sb2coJ1NoYWRlcicsIHNoYWRlck5hbWUsICdsb2FkZWQhJyk7XG4gICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICBzY3JpcHQuc3JjID0gc2hhZGVyLnVybDtcbiAgICAgIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2hhZGVyLW5hbWUnLCBzaGFkZXJOYW1lKTtcbiAgICAgIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2hhZGVyLWRlc2NyaXB0aW9uJywgc2hhZGVyLmRlc2NyaXB0aW9uKTtcbiAgICAgIHNjcmlwdC5vbmxvYWQgPSBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gc2NyaXB0Lm9ubG9hZCA9IG51bGw7XG4gICAgICAgIG9uTG9hZGVkKCk7XG4gICAgICB9O1xuICAgICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgICAgKGhlYWQgfHwgZG9jdW1lbnQuYm9keSkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgIGxpbmsuaHJlZiA9IHNoYWRlci51cmw7XG4gICAgICBsaW5rLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxpbmspO1xuICAgICAgc2hhZGVyLmluY2x1ZGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb25Mb2FkZWQoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyTG9hZGVyO1xuIiwiLyogZ2xvYmFsIGFmcmFtZUVkaXRvciBUSFJFRSBDdXN0b21FdmVudCAqL1xudmFyIFRyYW5zZm9ybUNvbnRyb2xzID0gcmVxdWlyZSgnLi4vLi4vbGliL3ZlbmRvci90aHJlZWpzL1RyYW5zZm9ybUNvbnRyb2xzLmpzJyk7XG52YXIgRWRpdG9yQ29udHJvbHMgPSByZXF1aXJlKCcuLi8uLi9saWIvdmVuZG9yL3RocmVlanMvRWRpdG9yQ29udHJvbHMuanMnKTtcblxuZnVuY3Rpb24gZ2V0TnVtYmVyICh2YWx1ZSkge1xuICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZS50b0ZpeGVkKDIpKTtcbn1cblxuZnVuY3Rpb24gVmlld3BvcnQgKGVkaXRvcikge1xuICB2YXIgc2lnbmFscyA9IGVkaXRvci5zaWduYWxzO1xuXG4gIHZhciBjb250YWluZXIgPSB7XG4gICAgZG9tOiBlZGl0b3IuY29udGFpbmVyXG4gIH07XG5cbiAgLy8gaGVscGVyc1xuICB2YXIgc2NlbmVIZWxwZXJzID0gZWRpdG9yLnNjZW5lSGVscGVycztcbiAgdmFyIG9iamVjdHMgPSBbXTtcblxuICB2YXIgZ3JpZCA9IG5ldyBUSFJFRS5HcmlkSGVscGVyKDMwLCAxKTtcbiAgc2NlbmVIZWxwZXJzLmFkZChncmlkKTtcblxuICB2YXIgY2FtZXJhID0gZWRpdG9yLmNhbWVyYTtcbiAgdmFyIGNhbWVyYUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYS1lbnRpdHknKTtcbiAgY2FtZXJhRWwuc2V0T2JqZWN0M0QoJ2NhbWVyYScsIGNhbWVyYSk7XG4gIGNhbWVyYUVsLmxvYWQoKTtcblxuICB2YXIgc2VsZWN0aW9uQm94ID0gbmV3IFRIUkVFLkJveEhlbHBlcigpO1xuICBzZWxlY3Rpb25Cb3gubWF0ZXJpYWwuZGVwdGhUZXN0ID0gZmFsc2U7XG4gIHNlbGVjdGlvbkJveC5tYXRlcmlhbC50cmFuc3BhcmVudCA9IHRydWU7XG4gIHNlbGVjdGlvbkJveC52aXNpYmxlID0gZmFsc2U7XG4gIHNjZW5lSGVscGVycy5hZGQoc2VsZWN0aW9uQm94KTtcblxuICB2YXIgb2JqZWN0UG9zaXRpb25PbkRvd24gPSBudWxsO1xuICB2YXIgb2JqZWN0Um90YXRpb25PbkRvd24gPSBudWxsO1xuICB2YXIgb2JqZWN0U2NhbGVPbkRvd24gPSBudWxsO1xuXG4gIHZhciB0cmFuc2Zvcm1Db250cm9scyA9IG5ldyBUSFJFRS5UcmFuc2Zvcm1Db250cm9scyhjYW1lcmEsIGVkaXRvci5jb250YWluZXIpO1xuICB0cmFuc2Zvcm1Db250cm9scy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iamVjdCA9IHRyYW5zZm9ybUNvbnRyb2xzLm9iamVjdDtcbiAgICBpZiAob2JqZWN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciBvYmplY3RJZCA9IG9iamVjdC5pZDtcblxuICAgICAgc2VsZWN0aW9uQm94LnVwZGF0ZShvYmplY3QpO1xuXG4gICAgICBpZiAoZWRpdG9yLmhlbHBlcnNbIG9iamVjdElkIF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlZGl0b3IuaGVscGVyc1sgb2JqZWN0SWQgXS51cGRhdGUoKTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh0cmFuc2Zvcm1Db250cm9scy5nZXRNb2RlKCkpIHtcbiAgICAgICAgY2FzZSAndHJhbnNsYXRlJzpcbiAgICAgICAgICBvYmplY3QuZWwuc2V0QXR0cmlidXRlKCdwb3NpdGlvbicsIHt4OiBnZXROdW1iZXIob2JqZWN0LnBvc2l0aW9uLngpLCB5OiBnZXROdW1iZXIob2JqZWN0LnBvc2l0aW9uLnkpLCB6OiBnZXROdW1iZXIob2JqZWN0LnBvc2l0aW9uLnopfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JvdGF0ZSc6XG4gICAgICAgICAgb2JqZWN0LmVsLnNldEF0dHJpYnV0ZSgncm90YXRpb24nLCB7XG4gICAgICAgICAgICB4OiBUSFJFRS5NYXRoLnJhZFRvRGVnKGdldE51bWJlcihvYmplY3Qucm90YXRpb24ueCkpLFxuICAgICAgICAgICAgeTogVEhSRUUuTWF0aC5yYWRUb0RlZyhnZXROdW1iZXIob2JqZWN0LnJvdGF0aW9uLnkpKSxcbiAgICAgICAgICAgIHo6IFRIUkVFLk1hdGgucmFkVG9EZWcoZ2V0TnVtYmVyKG9iamVjdC5yb3RhdGlvbi56KSl9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2NhbGUnOlxuICAgICAgICAgIG9iamVjdC5lbC5zZXRBdHRyaWJ1dGUoJ3NjYWxlJywge3g6IGdldE51bWJlcihvYmplY3Quc2NhbGUueCksIHk6IGdldE51bWJlcihvYmplY3Quc2NhbGUueSksIHo6IGdldE51bWJlcihvYmplY3Quc2NhbGUueil9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGVkaXRvci5zaWduYWxzLnJlZnJlc2hTaWRlYmFyT2JqZWN0M0QuZGlzcGF0Y2gob2JqZWN0KTtcbiAgICB9XG4gIH0pO1xuXG4gIHRyYW5zZm9ybUNvbnRyb2xzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlRG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb2JqZWN0ID0gdHJhbnNmb3JtQ29udHJvbHMub2JqZWN0O1xuXG4gICAgb2JqZWN0UG9zaXRpb25PbkRvd24gPSBvYmplY3QucG9zaXRpb24uY2xvbmUoKTtcbiAgICBvYmplY3RSb3RhdGlvbk9uRG93biA9IG9iamVjdC5yb3RhdGlvbi5jbG9uZSgpO1xuICAgIG9iamVjdFNjYWxlT25Eb3duID0gb2JqZWN0LnNjYWxlLmNsb25lKCk7XG5cbiAgICBjb250cm9scy5lbmFibGVkID0gZmFsc2U7XG4gIH0pO1xuXG4gIHRyYW5zZm9ybUNvbnRyb2xzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlVXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iamVjdCA9IHRyYW5zZm9ybUNvbnRyb2xzLm9iamVjdDtcbiAgICBpZiAob2JqZWN0ICE9PSBudWxsKSB7XG4gICAgICBzd2l0Y2ggKHRyYW5zZm9ybUNvbnRyb2xzLmdldE1vZGUoKSkge1xuICAgICAgICBjYXNlICd0cmFuc2xhdGUnOlxuXG4gICAgICAgICAgaWYgKCFvYmplY3RQb3NpdGlvbk9uRG93bi5lcXVhbHMob2JqZWN0LnBvc2l0aW9uKSkge1xuICAgICAgICAgICAgLy8gQHRvZG9cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAncm90YXRlJzpcbiAgICAgICAgICBpZiAoIW9iamVjdFJvdGF0aW9uT25Eb3duLmVxdWFscyhvYmplY3Qucm90YXRpb24pKSB7XG4gICAgICAgICAgICAvLyBAdG9kb1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzY2FsZSc6XG4gICAgICAgICAgaWYgKCFvYmplY3RTY2FsZU9uRG93bi5lcXVhbHMob2JqZWN0LnNjYWxlKSkge1xuICAgICAgICAgICAgLy8gQHRvZG9cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRyb2xzLmVuYWJsZWQgPSB0cnVlO1xuICB9KTtcblxuICBzY2VuZUhlbHBlcnMuYWRkKHRyYW5zZm9ybUNvbnRyb2xzKTtcbi8qXG4gIHNpZ25hbHMub2JqZWN0U2VsZWN0ZWQuYWRkKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICBzZWxlY3Rpb25Cb3gudmlzaWJsZSA9IGZhbHNlO1xuICAgIGlmICghZWRpdG9yLnNlbGVjdGVkKSB7XG4gICAgICAvLyBpZiAoIWVkaXRvci5zZWxlY3RlZCB8fCBlZGl0b3Iuc2VsZWN0ZWQuZWwuaGVscGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdCAhPT0gbnVsbCkge1xuICAgICAgaWYgKG9iamVjdC5nZW9tZXRyeSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIG9iamVjdCBpbnN0YW5jZW9mIFRIUkVFLlNwcml0ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgc2VsZWN0aW9uQm94LnVwZGF0ZShvYmplY3QpO1xuICAgICAgICBzZWxlY3Rpb25Cb3gudmlzaWJsZSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRyYW5zZm9ybUNvbnRyb2xzLmF0dGFjaChvYmplY3QpO1xuICAgIH1cbiAgfSk7XG4qL1xuICBzaWduYWxzLm9iamVjdENoYW5nZWQuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYWZyYW1lRWRpdG9yLmVkaXRvci5zZWxlY3RlZEVudGl0eS5vYmplY3QzRE1hcFsnbWVzaCddKSB7XG4gICAgICBzZWxlY3Rpb25Cb3gudXBkYXRlKGVkaXRvci5zZWxlY3RlZCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBvYmplY3QgcGlja2luZ1xuICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG4gIC8vIGV2ZW50c1xuICBmdW5jdGlvbiBnZXRJbnRlcnNlY3RzIChwb2ludCwgb2JqZWN0cykge1xuICAgIG1vdXNlLnNldCgocG9pbnQueCAqIDIpIC0gMSwgLShwb2ludC55ICogMikgKyAxKTtcbiAgICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcbiAgICByZXR1cm4gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cyk7XG4gIH1cblxuICB2YXIgb25Eb3duUG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgb25VcFBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdmFyIG9uRG91YmxlQ2xpY2tQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbiAgZnVuY3Rpb24gZ2V0TW91c2VQb3NpdGlvbiAoZG9tLCB4LCB5KSB7XG4gICAgdmFyIHJlY3QgPSBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIFsgKHggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aCwgKHkgLSByZWN0LnRvcCkgLyByZWN0LmhlaWdodCBdO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlQ2xpY2sgKCkge1xuICAgIGlmIChvbkRvd25Qb3NpdGlvbi5kaXN0YW5jZVRvKG9uVXBQb3NpdGlvbikgPT09IDApIHtcbiAgICAgIHZhciBpbnRlcnNlY3RzID0gZ2V0SW50ZXJzZWN0cyhvblVwUG9zaXRpb24sIG9iamVjdHMpO1xuICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0c1sgMCBdLm9iamVjdDtcbiAgICAgICAgaWYgKG9iamVjdC51c2VyRGF0YS5vYmplY3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIGhlbHBlclxuICAgICAgICAgIGVkaXRvci5zZWxlY3RFbnRpdHkob2JqZWN0LnVzZXJEYXRhLm9iamVjdC5lbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWRpdG9yLnNlbGVjdEVudGl0eShvYmplY3QuZWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlZGl0b3Iuc2VsZWN0RW50aXR5KG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duIChldmVudCkge1xuICAgIGlmIChldmVudCBpbnN0YW5jZW9mIEN1c3RvbUV2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBhcnJheSA9IGdldE1vdXNlUG9zaXRpb24oZWRpdG9yLmNvbnRhaW5lciwgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XG4gICAgb25Eb3duUG9zaXRpb24uZnJvbUFycmF5KGFycmF5KTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXAsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcCAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhcnJheSA9IGdldE1vdXNlUG9zaXRpb24oZWRpdG9yLmNvbnRhaW5lciwgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XG4gICAgb25VcFBvc2l0aW9uLmZyb21BcnJheShhcnJheSk7XG4gICAgaGFuZGxlQ2xpY2soKTtcblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXAsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydCAoZXZlbnQpIHtcbiAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1sgMCBdO1xuICAgIHZhciBhcnJheSA9IGdldE1vdXNlUG9zaXRpb24oZWRpdG9yLmNvbnRhaW5lciwgdG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG4gICAgb25Eb3duUG9zaXRpb24uZnJvbUFycmF5KGFycmF5KTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCAoZXZlbnQpIHtcbiAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1sgMCBdO1xuICAgIHZhciBhcnJheSA9IGdldE1vdXNlUG9zaXRpb24oZWRpdG9yLmNvbnRhaW5lciwgdG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG4gICAgb25VcFBvc2l0aW9uLmZyb21BcnJheShhcnJheSk7XG4gICAgaGFuZGxlQ2xpY2soKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRG91YmxlQ2xpY2sgKGV2ZW50KSB7XG4gICAgdmFyIGFycmF5ID0gZ2V0TW91c2VQb3NpdGlvbihlZGl0b3IuY29udGFpbmVyLCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgICBvbkRvdWJsZUNsaWNrUG9zaXRpb24uZnJvbUFycmF5KGFycmF5KTtcblxuICAgIHZhciBpbnRlcnNlY3RzID0gZ2V0SW50ZXJzZWN0cyhvbkRvdWJsZUNsaWNrUG9zaXRpb24sIG9iamVjdHMpO1xuXG4gICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbIDAgXTtcbiAgICAgIHNpZ25hbHMub2JqZWN0Rm9jdXNlZC5kaXNwYXRjaChpbnRlcnNlY3Qub2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICBlZGl0b3IuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duLCBmYWxzZSk7XG4gIGVkaXRvci5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICBlZGl0b3IuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgb25Eb3VibGVDbGljaywgZmFsc2UpO1xuXG4gIC8vIGNvbnRyb2xzIG5lZWQgdG8gYmUgYWRkZWQgKmFmdGVyKiBtYWluIGxvZ2ljLFxuICAvLyBvdGhlcndpc2UgY29udHJvbHMuZW5hYmxlZCBkb2Vzbid0IHdvcmsuXG5cbiAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLkVkaXRvckNvbnRyb2xzKGNhbWVyYSwgZWRpdG9yLmNvbnRhaW5lcik7XG4gIGNvbnRyb2xzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICB0cmFuc2Zvcm1Db250cm9scy51cGRhdGUoKTtcbiAgICAvLyBlZGl0b3Iuc2lnbmFscy5jYW1lcmFDaGFuZ2VkLmRpc3BhdGNoKGNhbWVyYSk7XG4gIH0pO1xuXG4gIHNpZ25hbHMuZWRpdG9yQ2xlYXJlZC5hZGQoZnVuY3Rpb24gKCkge1xuICAgIGNvbnRyb2xzLmNlbnRlci5zZXQoMCwgMCwgMCk7XG4gIH0pO1xuXG4gIHNpZ25hbHMudHJhbnNmb3JtTW9kZUNoYW5nZWQuYWRkKGZ1bmN0aW9uIChtb2RlKSB7XG4gICAgdHJhbnNmb3JtQ29udHJvbHMuc2V0TW9kZShtb2RlKTtcbiAgfSk7XG5cbiAgc2lnbmFscy5zbmFwQ2hhbmdlZC5hZGQoZnVuY3Rpb24gKGRpc3QpIHtcbiAgICB0cmFuc2Zvcm1Db250cm9scy5zZXRUcmFuc2xhdGlvblNuYXAoZGlzdCk7XG4gIH0pO1xuXG4gIHNpZ25hbHMuc3BhY2VDaGFuZ2VkLmFkZChmdW5jdGlvbiAoc3BhY2UpIHtcbiAgICB0cmFuc2Zvcm1Db250cm9scy5zZXRTcGFjZShzcGFjZSk7XG4gIH0pO1xuXG4gIHNpZ25hbHMub2JqZWN0U2VsZWN0ZWQuYWRkKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICBjb25zb2xlLmxvZyhcIkFTREZcIik7XG4gICAgc2VsZWN0aW9uQm94LnZpc2libGUgPSBmYWxzZTtcbiAgICB0cmFuc2Zvcm1Db250cm9scy5kZXRhY2goKTtcbiAgICBpZiAob2JqZWN0ICE9PSBudWxsKSB7XG4gICAgICBzZWxlY3Rpb25Cb3gudXBkYXRlKG9iamVjdCk7XG4gICAgICBzZWxlY3Rpb25Cb3gudmlzaWJsZSA9IHRydWU7XG5cbiAgICAgIHRyYW5zZm9ybUNvbnRyb2xzLmF0dGFjaChvYmplY3QpO1xuICAgIH1cbiAgfSk7XG4vKlxuICBzaWduYWxzLm9iamVjdEZvY3VzZWQuYWRkKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICBjb250cm9scy5mb2N1cyhvYmplY3QpO1xuICB9KTtcblxuICBzaWduYWxzLmdlb21ldHJ5Q2hhbmdlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgIT09IG51bGwpIHtcbiAgICAgIHNlbGVjdGlvbkJveC51cGRhdGUob2JqZWN0KTtcbiAgICB9XG4gIH0pO1xuKi9cbiAgc2lnbmFscy5vYmplY3RBZGRlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIG9iamVjdC50cmF2ZXJzZShmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgIG9iamVjdHMucHVzaChjaGlsZCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHNpZ25hbHMub2JqZWN0Q2hhbmdlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIGlmIChlZGl0b3Iuc2VsZWN0ZWQgPT09IG9iamVjdCkge1xuICAgICAgLy8gSGFjayBiZWNhdXNlIG9iamVjdDNEIGFsd2F5cyBoYXMgZ2VvbWV0cnkgOihcbiAgICAgIGlmIChvYmplY3QuZ2VvbWV0cnkgJiYgb2JqZWN0Lmdlb21ldHJ5LnZlcnRpY2VzICYmIG9iamVjdC5nZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGVjdGlvbkJveC51cGRhdGUob2JqZWN0KTtcbiAgICAgIH1cbiAgICAgIHRyYW5zZm9ybUNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSkge1xuICAgICAgb2JqZWN0LnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICB9XG5cbiAgICBpZiAoZWRpdG9yLmhlbHBlcnNbIG9iamVjdC5pZCBdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVkaXRvci5oZWxwZXJzWyBvYmplY3QuaWQgXS51cGRhdGUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHNpZ25hbHMub2JqZWN0UmVtb3ZlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIG9iamVjdC50cmF2ZXJzZShmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgIG9iamVjdHMuc3BsaWNlKG9iamVjdHMuaW5kZXhPZihjaGlsZCksIDEpO1xuICAgIH0pO1xuICB9KTtcbiAgc2lnbmFscy5oZWxwZXJBZGRlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIG9iamVjdHMucHVzaChvYmplY3QuZ2V0T2JqZWN0QnlOYW1lKCdwaWNrZXInKSk7XG4gIH0pO1xuXG4gIHNpZ25hbHMuaGVscGVyUmVtb3ZlZC5hZGQoZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIG9iamVjdHMuc3BsaWNlKG9iamVjdHMuaW5kZXhPZihvYmplY3QuZ2V0T2JqZWN0QnlOYW1lKCdwaWNrZXInKSksIDEpO1xuICB9KTtcbiAgc2lnbmFscy53aW5kb3dSZXNpemUuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICBjYW1lcmEuYXNwZWN0ID0gY29udGFpbmVyLmRvbS5vZmZzZXRXaWR0aCAvIGNvbnRhaW5lci5kb20ub2Zmc2V0SGVpZ2h0O1xuICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgLy8gcmVuZGVyZXIuc2V0U2l6ZShjb250YWluZXIuZG9tLm9mZnNldFdpZHRoLCBjb250YWluZXIuZG9tLm9mZnNldEhlaWdodCk7XG4gIH0pO1xuXG4gIHNpZ25hbHMuc2hvd0dyaWRDaGFuZ2VkLmFkZChmdW5jdGlvbiAoc2hvd0dyaWQpIHtcbiAgICBncmlkLnZpc2libGUgPSBzaG93R3JpZDtcbiAgfSk7XG5cbiAgc2lnbmFscy5lZGl0b3JNb2RlQ2hhbmdlZC5hZGQoZnVuY3Rpb24gKGFjdGl2ZSkge1xuICAgIGlmIChhY3RpdmUpIHtcbiAgICAgIGFmcmFtZUVkaXRvci5lZGl0b3Iuc2NlbmVFbC5zeXN0ZW1zLmNhbWVyYS5zZXRBY3RpdmVDYW1lcmEoY2FtZXJhRWwpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmEtZW50ZXItdnIsLnJzLWJhc2UnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZnJhbWVFZGl0b3IuZWRpdG9yLmRlZmF1bHRDYW1lcmFFbC5zZXRBdHRyaWJ1dGUoJ2NhbWVyYScsICdhY3RpdmUnLCAndHJ1ZScpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmEtZW50ZXItdnIsLnJzLWJhc2UnKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9XG4gIH0pO1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7XG4iXX0=

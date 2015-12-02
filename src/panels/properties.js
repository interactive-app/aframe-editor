var UI = require('./ext/ui.js');

function Properties (editor) {

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	//container.setDisplay( 'none' );

	// type

	var objectTypeRow = new UI.Row();
	var objectType = new UI.Text();

	objectTypeRow.add( new UI.Text( 'Type' ).setWidth( '90px' ) );
	objectTypeRow.add( objectType );

	container.add( objectTypeRow );

	// name

	var objectIdRow = new UI.Row();
	var objectId = new UI.Input().setWidth( '150px' ).setFontSize( '12px' ).onChange( function () {

		//editor.execute( new SetValueCommand( editor.selected, 'name', objectId.getValue() ) );

	} );

	objectIdRow.add( new UI.Text( 'ID' ).setWidth( '90px' ) );
	objectIdRow.add( objectId );

	container.add( objectIdRow );



	// position


	var objectPositionRow = new UI.Row();
	var objectPositionX = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectPositionY = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectPositionZ = new UI.Number().setWidth( '50px' ).onChange( update );

	objectPositionRow.add( new UI.Text( 'Position' ).setWidth( '90px' ) );
	objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );

	container.add( objectPositionRow );


	var objectOrientationRow = new UI.Row();
	var objectRotationX = new UI.Number().setWidth( '50px' ).setValue(45).onChange( update );
	var objectRotationY = new UI.Number().setWidth( '50px' ).setValue(30).onChange( update );
	var objectRotationZ = new UI.Number().setWidth( '50px' ).onChange( update );

	objectOrientationRow.add( new UI.Text( 'Rotation' ).setWidth( '90px' ) );
	objectOrientationRow.add( objectRotationX, objectRotationY, objectRotationZ );

	container.add( objectOrientationRow );

	var objectScaleRow = new UI.Row();
	var objectScaleX = new UI.Number().setWidth( '50px' ).setValue(1).onChange( update );
	var objectScaleY = new UI.Number().setWidth( '50px' ).setValue(1).onChange( update );
	var objectScaleZ = new UI.Number().setWidth( '50px' ).setValue(1).onChange( update );

	objectScaleRow.add( new UI.Text( 'Scale' ).setWidth( '90px' ) );
	objectScaleRow.add( objectScaleX, objectScaleY, objectScaleZ );

	container.add( objectScaleRow );


	// color

	var objectColorRow = new UI.Row();
	var objectColor = new UI.Color().onChange( update );

	objectColorRow.add( new UI.Text( 'Color' ).setWidth( '90px' ) );
	objectColorRow.add( objectColor );

	container.add( objectColorRow );

/*
	editor.signals.objectSelected.add( function ( object ) {

		if ( object !== null ) {

			container.setDisplay( 'block' );

			//updateRows( object );
			updateUI( object );
			//update(object);

		} else {

			container.setDisplay( 'none' );

		}

	} );
*/

	function updateUI( object ) {

//		objectType.setValue( object.type );

//		objectUUID.setValue( object.uuid );
//		objectName.setValue( object.name );

		/*
		if ( object.parent !== null ) {

			objectParent.setValue( object.parent.id );

		}
		*/

		objectPositionX.setValue( object.position.x );
		objectPositionY.setValue( object.position.y );
		objectPositionZ.setValue( object.position.z );

		objectRotationX.setValue( object.rotation.x );
		objectRotationY.setValue( object.rotation.y );
		objectRotationZ.setValue( object.rotation.z );

		objectScaleX.setValue( object.scale.x );
		objectScaleY.setValue( object.scale.y );
		objectScaleZ.setValue( object.scale.z );
/*
		if ( object.fov !== undefined ) {

			objectFov.setValue( object.fov );

		}

		if ( object.near !== undefined ) {

			objectNear.setValue( object.near );

		}

		if ( object.far !== undefined ) {

			objectFar.setValue( object.far );

		}

		if ( object.intensity !== undefined ) {

			objectIntensity.setValue( object.intensity );

		}
*/

	   	var entity = object.el;

	    var properties = entity.getAttribute("material");
		console.log();

		if ( properties["color"] !== undefined ) {

			objectColor.setHexValue( properties["color"] );

		}
/*
		if ( object.groundColor !== undefined ) {

			objectGroundColor.setHexValue( object.groundColor.getHexString() );

		}

		if ( object.distance !== undefined ) {

			objectDistance.setValue( object.distance );

		}

		if ( object.angle !== undefined ) {

			objectAngle.setValue( object.angle );

		}

		if ( object.exponent !== undefined ) {

			objectExponent.setValue( object.exponent );

		}

		if ( object.decay !== undefined ) {

			objectDecay.setValue( object.decay );

		}

		if ( object.castShadow !== undefined ) {

			objectCastShadow.setValue( object.castShadow );

		}

		if ( object.receiveShadow !== undefined ) {

			objectReceiveShadow.setValue( object.receiveShadow );

		}

		objectVisible.setValue( object.visible );

		try {

			objectUserData.setValue( JSON.stringify( object.userData, null, '  ' ) );

		} catch ( error ) {

			console.log( error );

		}

		objectUserData.setBorderColor( 'transparent' );
		objectUserData.setBackgroundColor( '' );

		updateTransformRows( object );
*/
	}

	function update(object) {
		
		function handleEntityChange (name, property, value) {
		   	
		   	var entity = editor.selected.el;

		    if (property) {
		      // multiple attribute properties
		      var properties = entity.getAttribute(name);
		      properties[property] = value;
		      entity.setAttribute(name, properties);
		    } else {
		      // single attribute value
		      entity.setAttribute(name, value);
		    }
	  	}

	  	handleEntityChange("position","x",objectPositionX.getValue());
	  	handleEntityChange("position","y",objectPositionY.getValue());
	  	handleEntityChange("position","z",objectPositionZ.getValue());
/*
	  	handleEntityChange("scale","x",objectScaleX.getValue());
	  	handleEntityChange("scale","y",objectScaleY.getValue());
	  	handleEntityChange("scale","z",objectScaleZ.getValue());
*/
	  	handleEntityChange("material","color",objectColor.getValue());

		editor.signals.objectSelected.dispatch( editor.selected ); //??

	}


	return container;
}

module.exports = Properties;

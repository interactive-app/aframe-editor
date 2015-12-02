var UI = require('./ext/ui.js');

function handleEntityChange (entity, name, property, value) {

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


function Properties (editor) {

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay( 'none' );


	this.widgets = {};

	// type

	var objectTypeRow = new UI.Row();
	var objectType = new UI.Text();

	objectTypeRow.add( new UI.Text( 'Type' ).setWidth( '90px' ) );
	objectTypeRow.add( objectType );

	container.add( objectTypeRow );

	// name

	var objectIdRow = new UI.Row();
	var objectId = new UI.Input().setWidth( '150px' ).setFontSize( '12px' ).onChange( function () {

		handleEntityChange(editor.selected.el,"id",null,objectId.getValue());
		editor.signals.sceneGraphChanged.dispatch( object );

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
	var objectRotationX = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectRotationY = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectRotationZ = new UI.Number().setWidth( '50px' ).onChange( update );

	objectOrientationRow.add( new UI.Text( 'Rotation' ).setWidth( '90px' ) );
	objectOrientationRow.add( objectRotationX, objectRotationY, objectRotationZ );

	container.add( objectOrientationRow );

	var objectScaleRow = new UI.Row();
	var objectScaleX = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectScaleY = new UI.Number().setWidth( '50px' ).onChange( update );
	var objectScaleZ = new UI.Number().setWidth( '50px' ).onChange( update );

	objectScaleRow.add( new UI.Text( 'Scale' ).setWidth( '90px' ) );
	objectScaleRow.add( objectScaleX, objectScaleY, objectScaleZ );

	container.add( objectScaleRow );

	container.add(new UI.Break());

	// --- CUSTOM
	var objectCustomRow = new UI.Row();
	container.add( objectCustomRow );

/*
	// color

	var objectColorRow = new UI.Row();
	var objectColor = new UI.Color().onChange( update );

	objectColorRow.add( new UI.Text( 'Color' ).setWidth( '90px' ) );
	objectColorRow.add( objectColor );

	container.add( objectColorRow );
*/

	editor.signals.entitySelected.add( function ( entity ) {
		if ( entity !== null ) {

			container.setDisplay( 'block' );

			updateRows(entity);
			updateUI(entity);

		} else {

			container.setDisplay( 'none' );

		}

	} );

	function updateUI( entity ) {

		objectType.setValue( entity.tagName );

		objectId.setValue( entity.id );

		object = entity.object3D;

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

		if ( object.color !== undefined ) {

			objectColor.setHexValue( object.color.getHexString() );

		}

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

	function updateRows( entity ) {

		var properties = {
			// 'parent': objectParentRow,
			/*
			'fov': objectFovRow,
			'near': objectNearRow,
			'far': objectFarRow,
			'intensity': objectIntensityRow,
			'color': objectColorRow,
			'groundColor': objectGroundColorRow,
			'distance' : objectDistanceRow,
			'angle' : objectAngleRow,
			'exponent' : objectExponentRow,
			'decay' : objectDecayRow,
			'castShadow' : objectShadowRow,
			'receiveShadow' : objectReceiveShadow*/
		};

		var componentsToIgnore = [
			"position","rotation","scale","visible"
		];

		objectCustomRow.clear();

		for ( var componentName in entity.components) {

			if (componentsToIgnore.indexOf(componentName)!==-1)
				continue;

			var component = entity.components[componentName];
			var newRow = new UI.Row();
			var objectType = new UI.Text();

			newRow.add( new UI.Text( componentName ).setWidth( '120px' ) );
			newRow.add( objectType );

			for (var parameterName in component.defaults) {
					
				var newParamRow = new UI.Row();

				newParamRow.add( new UI.Text( parameterName ).setWidth( '120px' ) );

				var defaultValue = component.defaults[parameterName];
				switch (typeof defaultValue) {
					case "number":
						newParamRow.add( new UI.Number().setWidth( '50px' ).onChange( update ) );
						break;
					case "string":
						if (defaultValue.indexOf("#")==-1)
							newParamRow.add( new UI.Input("").setWidth( '50px' ).onChange( update ) );
						else 
							newParamRow.add( new UI.Color().setWidth( '50px' ).onChange( update ) );
						break;
					default:
						console.log(parameterName,component.defaults[parameterName]);
				}
				newRow.add( newParamRow );

			}
			newRow.add( new UI.Break() );

			objectCustomRow.add( newRow );


		}

		//for ( var property in properties ) {

			//properties[ property ].setDisplay( object[ property ] !== undefined ? '' : 'none' );

		//}

		console.log(entity.components);

	}

	function updateUI2( object ) {

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

		if ( properties["color"] !== undefined ) {

			objectColor.setHexValue( properties["color"] );
			var container = new UI.Panel();
			container.setBorderTop( '0' );
			container.setPaddingTop( '20px' );
			container.setDisplay( 'none' );

			// type

			var objectTypeRow = new UI.Row();
			var objectType = new UI.Text();

			objectTypeRow.add( new UI.Text( 'Type' ).setWidth( '90px' ) );
			objectTypeRow.add( objectType );

			container.add( objectTypeRow );

			// name

			var objectIdRow = new UI.Row();
			var objectId = new UI.Input().setWidth( '150px' ).setFontSize( '12px' ).onChange( function () {

				handleEntityChange(editor.selected.el,"id",null,objectId.getValue());
				editor.signals.sceneGraphChanged.dispatch( object );

			} );

			objectIdRow.add( new UI.Text( 'ID' ).setWidth( '90px' ) );
			objectIdRow.add( objectId );

			container.add( objectIdRow );



		}

		editor.signals.objectChanged.dispatch( object );

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
		
		var entity = editor.selected.el;
	  	
	  	handleEntityChange(entity,"position","x",objectPositionX.getValue());
	  	handleEntityChange(entity,"position","y",objectPositionY.getValue());
	  	handleEntityChange(entity,"position","z",objectPositionZ.getValue());
/*
	  	handleEntityChange("scale","x",objectScaleX.getValue());
	  	handleEntityChange("scale","y",objectScaleY.getValue());
	  	handleEntityChange("scale","z",objectScaleZ.getValue());
*/
	  	
	  	//handleEntityChange("material","color",objectColor.getValue());

		//editor.signals.objectSelected.dispatch( editor.selected ); //??
		editor.signals.objectChanged.dispatch( object );

	}


	return container;
}

module.exports = Properties;

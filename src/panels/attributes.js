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

function Attributes (editor) {

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay( 'none' );

	widgets = {};
	function addAttribute(componentName, attributeName, property, type) {
		
		var widget = null;
		switch (type) {
			case "checkbox":
				widget =new UI.Checkbox();
				break;
			case "number":
				widget =new UI.Number();
				break;
			case "input":
				widget =new UI.Input("");
				break;
			case "color":
				widget =new UI.Color();
				break;
			default:
				console.warn(componentName, attributeName, property, type);
				widget =new UI.Input("");
		}

		widget.setWidth( '50px' ).onChange(function(event){
			update(event, componentName, attributeName, property);
		});

		var id = attributeName ? componentName+"."+attributeName+"."+property: componentName+"."+property;
		widgets[id] = widget;

		return widget;
	}

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
	var objectPositionX= addAttribute("position", null, "x", "number");
	var objectPositionY= addAttribute("position", null, "y", "number");
	var objectPositionZ= addAttribute("position", null, "z", "number");

	objectPositionRow.add( new UI.Text( 'Position' ).setWidth( '90px' ) );
	objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );

	container.add( objectPositionRow );


	var objectOrientationRow = new UI.Row();
	var objectRotationX = addAttribute("rotation", null, "x", "number");
	var objectRotationY = addAttribute("rotation", null, "y", "number");
	var objectRotationZ = addAttribute("rotation", null, "z", "number");

	objectOrientationRow.add( new UI.Text( 'Rotation' ).setWidth( '90px' ) );
	objectOrientationRow.add( objectRotationX, objectRotationY, objectRotationZ );

	container.add( objectOrientationRow );

	var objectScaleRow = new UI.Row();
	var objectScaleX = addAttribute("scale", null, "x", "number");
	var objectScaleY = addAttribute("scale", null, "y", "number");
	var objectScaleZ = addAttribute("scale", null, "z", "number");

	objectScaleRow.add( new UI.Text( 'Scale' ).setWidth( '90px' ) );
	objectScaleRow.add( objectScaleX, objectScaleY, objectScaleZ );

	container.add( objectScaleRow );

	container.add(new UI.Break());

	// --- CUSTOM
	var objectCustomRow = new UI.Row();
	container.add( objectCustomRow );

	editor.signals.entitySelected.add( function ( entity ) {
		if ( entity !== null ) {

			container.show();

			updateRows(entity);
			updateUI(entity);

		} else {

			container.hide();

		}

	} );

	function updateUI( entity ) {

		objectType.setValue( entity.tagName );

		objectId.setValue( entity.id );

		object = entity.object3D;
		
/*
		var id = attributeName ? componentName+"."+attributeName+"."+property: componentName+"."+property;
		widget = widgets[id];

/*
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

				var type = null;
				switch (typeof defaultValue) {
					case "boolean":
						type = "checkbox";
						break;
					case "number":
						type = "number";
						break;
					case "string":
						if (defaultValue.indexOf("#")==-1)
							type = "input";
						else 
							type = "color";
						break;
					default:
						console.log(parameterName,component.defaults[parameterName],typeof component.defaults[parameterName]);
				}
				var newWidget = addAttribute(componentName, null,parameterName, type);
				newWidget.setValue(defaultValue);
				newParamRow.add(newWidget);

				newRow.add( newParamRow );

			}
			newRow.add( new UI.Break() );

			objectCustomRow.add( newRow );


		}

		//for ( var property in properties ) {

			//properties[ property ].setDisplay( object[ property ] !== undefined ? '' : 'none' );

		//}

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

	function update(event, componentName, attributeName, property) {
		//console.log(componentName, attributeName, property);
		var entity = editor.selected.el;

		var id = attributeName ? componentName+"."+attributeName+"."+property: componentName+"."+property;
		widget = widgets[id];

	  	handleEntityChange(entity,componentName,property,widget.getValue());

		editor.signals.objectChanged.dispatch( object );

	}


	return container;
}

module.exports = Attributes;

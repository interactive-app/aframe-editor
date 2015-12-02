function Viewport(editor) {

	var signals = editor.signals;

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	//editor.sceneHelpers.add( selectionBox );
	editor.scene.add( selectionBox );
	signals.objectSelected.add( function ( object ) {

		selectionBox.visible = false;
//		transformControls.detach();

		if ( object !== null ) {

			if ( object.geometry !== undefined &&
				 object instanceof THREE.Sprite === false ) {

				selectionBox.update( object );
				selectionBox.visible = true;

			}

//			transformControls.attach( object );

		}

//		render();

	} );
	
	signals.objectChanged.add( function(){
		selectionBox.update(editor.selected);
	});


}

Viewport.prototype = {

}

module.exports = Viewport;
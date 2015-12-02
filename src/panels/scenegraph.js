var UI = require('./ext/ui.js');

function SceneGraph (editor) {

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	console.log(editor);
	var outliner = new UI.Outliner( editor );
	outliner.onChange( function () {

		//ignoreObjectSelectedSignal = true;

		editor.selectById( parseInt( outliner.getValue() ) );

		//ignoreObjectSelectedSignal = false;
	} );
	outliner.onDblClick( function () {

//		editor.focusById( parseInt( outliner.getValue() ) );

	} );
	container.add( outliner );
	container.add( new UI.Break() );

	function refreshUI() {

		var scene = document.querySelector('a-scene');
		var options = [];

		options.push( { static: true, value: "-1", html: '<span class="type ' + "a-scene" + '"></span> ' + "a-scene" } );


		function treeIterate (element, depth) {
			if (depth === undefined) {
				depth = 1;
			} else {
				depth += 1;
			}

			var children = element.children;
			for (var i = 0; i < children.length; i++) {
				var child = children[i];

				// filter out all entities added by editor
				if (!child.dataset.isEditor) {
					var type ="Mesh";
					var pad = '&nbsp;&nbsp;&nbsp;'.repeat(depth);
					options.push( { static: true, value: child.object3D.id, html: pad + '<span class="type ' + type + '"></span> ' + (child.id ? child.id : 'a-entity') } );
				}

				treeIterate(child, depth);
			}
		}
		
		treeIterate(scene);

		outliner.setOptions( options );

	}

	refreshUI();
	
	editor.signals.sceneGraphChanged.add( refreshUI );

	return container;
}

module.exports = SceneGraph;
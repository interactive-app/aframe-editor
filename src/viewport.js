/* global THREE */
function Viewport (editor) {
  var signals = editor.signals;

  var selectionBox = new THREE.BoxHelper();
  selectionBox.material.depthTest = false;
  selectionBox.material.transparent = true;
  selectionBox.visible = false;
  editor.helpers.add(selectionBox);
  signals.objectSelected.add(function (object) {
    selectionBox.visible = false;
    if (object !== null) {
      if (object.geometry !== undefined &&
        object instanceof THREE.Sprite === false) {
        selectionBox.update(object);
        selectionBox.visible = true;
      }
    }
  });

  signals.objectChanged.add(function () {
    selectionBox.update(editor.selected);
  });
}

module.exports = Viewport;

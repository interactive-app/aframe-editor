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

  this.scene = document.querySelector('a-scene');

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

  signals.sceneGraphChanged.add(this.refresh);

  container.add(outliner);
  var buttonRemove = new UI.Button('-').onClick(function () {
    if (editor.selectedEntity) {
      editor.selectedEntity.parentNode.removeChild(editor.selectedEntity);
      editor.signals.entitySelected.dispatch(null);
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
        var extra = '';

        var icons = {'camera': 'fa-video-camera', 'light': 'fa-lightbulb-o', 'geometry': 'fa-cube', 'material': 'fa-picture-o'};
        for (var icon in icons) {
          if (child.components[icon]) {
            extra += ' <i class="fa ' + icons[icon] + '"></i>';
          }
        }

        var type = '<span class="type Mesh"></span>';
        var pad = '&nbsp;&nbsp;&nbsp;'.repeat(depth);
        var label = child.id ? child.id : 'a-entity';

        options.push({
          static: true,
          value: child,
          html: pad + type + label + extra
        });
      }
      treeIterate(child, depth);
    }
  }
  treeIterate(this.scene);

  this.outliner.setOptions(options);
};

module.exports = SceneGraph;

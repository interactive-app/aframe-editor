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

  var signals = editor.signals;

  var container = new UI.Panel();
  container.setBorderTop('0');
  container.setPaddingTop('20px');

  var ignoreObjectSelectedSignal = false;

  var outliner = new UI.Outliner(editor);
  outliner.onChange(function () {
    ignoreObjectSelectedSignal = true;
    aframeEditor.editor.signals.entitySelected.dispatch(outliner.getValue());
    ignoreObjectSelectedSignal = false;
  });
  container.add(outliner);
  container.add(new UI.Break());

  function refreshUI () {
    var scene = document.querySelector('a-scene');
    var options = [];

    options.push({ static: true, value: scene, html: '<span class="type"></span> a-scene' });

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

          var type = 'Mesh';
          var pad = '&nbsp;&nbsp;&nbsp;'.repeat(depth);
          options.push({static: true, value: child, html: pad + '<span class="type ' + type + '"></span> ' + (child.id ? child.id : 'a-entity') + extra});
        }

        treeIterate(child, depth);
      }
    }
    treeIterate(scene);
    outliner.setOptions(options);
  }

  refreshUI();

  signals.sceneGraphChanged.add(refreshUI);

  signals.objectSelected.add(function (object) {
    if (ignoreObjectSelectedSignal === true) return;
    outliner.setValue(object !== null ? object.el : null);
  });

  return container;
}

module.exports = SceneGraph;

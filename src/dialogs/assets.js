var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function AssetsDialog (editor) {
  var container = new UI.Panel();

  // -------------------------------------
  var tabs = new UI.Div();
  tabs.setId('tabs');

  var assetsTab = new UI.Text('ASSETS').onClick(onClick);
  var samplesTab = new UI.Text('SAMPLES').onClick(onClick);
  var newTab = new UI.Text('NEW').onClick(onClick);
  // var assetsTab = new UI.Text('UPLOAD').onClick(onClick);

  tabs.add(assetsTab, samplesTab, newTab);

  container.add(tabs);
  // container.add(newUrl);

  function onClick (event) {
    select(event.target.textContent);
  }
  var assetsContent = new UI.Panel();

  var tabsContent = new UI.Span().add(assetsContent);

  container.add(tabsContent);

  editor.signals.showAssetsDialog.add(function (mapWidget) {
    assetsContent.clear();
    for (var texture in editor.sceneEl.systems.material.textureCache) {
      var row = new UI.Row();
      var img = document.createElement('img');
      img.src = texture;

      // @todo use class
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
          mapWidget.setValue('url(' + _texture + ')');
          if (mapWidget.onChangeCallback) {
            mapWidget.onChangeCallback();
          }
          editor.signals.hideModal.dispatch(assetsContent);
        });
      })(texture);
      row.dom.appendChild(button);

      assetsContent.add(row);
    }

    // assetsContent.add(panel);

    editor.signals.showModal.dispatch(container);
  });
/*
  this.sceneGraph = new SceneGraph(editor);
  this.attributes = new Attributes(editor);

  var scene = new UI.Span().add(
    this.sceneGraph,
    this.attributes
  );

  container.add(scene);
*/


  var newUrl = new UI.Input('').setWidth('150px').setFontSize('12px').onChange(function () {
    console.log(newUrl.getValue());
    // handleEntityChange(editor.selected.el, 'id', null, newUrl.getValue());
    // editor.signals.sceneGraphChanged.dispatch();
  });
  newUrl.setBorder('1px');
  var newContent = new UI.Panel();
  newContent.add(newUrl);
  container.add(newContent);


  function select (section) {
    samplesTab.setClass('');
    assetsTab.setClass('');

    assetsContent.setDisplay('none');
    newContent.setDisplay('none');

    switch (section) {
      case 'SAMPLES':
        samplesTab.setClass('selected');
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

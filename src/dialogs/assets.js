var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var samples = {
  "textures": [
    '758px-Canestra_di_frutta_(Caravaggio).jpg',
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
        mapWidget.setValue('url(' + _texture + ')');
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
      console.log('../assets/textures/'+samples['textures'][i]);
      var row = getImageWidget('../assets/textures/'+samples['textures'][i], mapWidget);
      samplesContent.add(row);
    }

    // New content
    // Add new ID
    newContent.clear();
    var newUrl = new UI.Input('').setWidth('150px').setFontSize('12px').onChange(function () {
      console.log(newUrl.getValue());
      // handleEntityChange(editor.selected.el, 'id', null, newUrl.getValue());
      // editor.signals.sceneGraphChanged.dispatch();
    });
    newContent.add(newUrl);

    var buttonAddNew = document.createElement('input');
    buttonAddNew.setAttribute('type', 'button');
    buttonAddNew.setAttribute('value', 'Add');
    buttonAddNew.addEventListener('click', function (event) {
      mapWidget.setValue('url(' + newUrl.getValue() + ')');
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

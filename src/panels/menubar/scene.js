var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function MenuScene (editor) {

  var container = new UI.Panel();
  container.setClass('menu');

  var title = new UI.Panel();
  title.setClass('title');
  title.setTextContent('Scene');
  container.add(title);

  var options = new UI.Panel();
  options.setClass('options');
  container.add(options);

  // --------------------------------------------
  // New
  // --------------------------------------------
  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('New');
  option.onClick( function () {

    if (confirm('Any unsaved data will be lost. Are you sure?')){
      editor.clear();
    }
  });
  options.add(option);

  return container;

};

module.exports = MenuScene;
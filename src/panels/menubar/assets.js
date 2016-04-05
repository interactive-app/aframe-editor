var UI = require('../../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function MenuAssets (editor) {
  var container = new UI.Panel();
  container.setClass('menu');

  var title = new UI.Panel();
  title.setClass('title');
  title.setTextContent('Assets');
  container.add(title);

  var options = new UI.Panel();
  options.setClass('options');
  container.add(options);

  // --------------------------------------------
  // Add texture
  // --------------------------------------------
  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Add Texture');
  option.onClick(function () {
    var text = new UI.Text("Hello from UI modal");
    editor.signals.showModal.dispatch(text);
  });
  options.add(option);

  // --------------------------------------------
  // Add texture
  // --------------------------------------------
  var option = new UI.Row();
  option.setClass('option');
  option.setTextContent('Add 3d Model');
  option.onClick(function () {
  });
  options.add(option);


  // --------------------------------------------
  // New
  // --------------------------------------------
  /*
    var prevGroup = null;
    for (var definition in primitivesDefinitions) {
      // Add a line break if the group changes
      if (prevGroup === null) {
        prevGroup = primitivesDefinitions[definition].group;
      } else if (prevGroup !== primitivesDefinitions[definition].group) {
        prevGroup = primitivesDefinitions[definition].group;
        options.add(new UI.HorizontalRule());
      }

      // Generate a new option in the menu
      var option = new UI.Row();
      option.setClass('option');
      option.setTextContent(definition);
      option.dom.onclick = (function (def) {
        return function () {
          createNewEntity(def);
        };
      })(primitivesDefinitions[definition]);
      options.add(option);
    }
  */
  return container;
}

module.exports = MenuAssets;

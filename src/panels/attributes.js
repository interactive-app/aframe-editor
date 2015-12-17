/* global aframeCore */
var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package
var WidgetsFactory = require('./widgetsfactory.js'); // @todo will be replaced with the npm package

function Attributes (editor) {
  var objectId, objectType, objectCustomRow;
  var componentsList;
  var ignoreComponentsChange = false;
  var commonComponents = ['position', 'rotation', 'scale', 'visible'];

  /**
   * Update the entity component value
   * @param  {Element} entity   Entity to modify
   * @param  {string} component     Name of the component
   * @param  {string} property Property name
   * @param  {string|number} value    New value
   */
  function handleEntityChange (entity, componentName, propertyName, value) {
    if (propertyName) {
      entity.setAttribute(componentName, propertyName, value);
    } else {
      entity.setAttribute(componentName, value);
    }
  }

  /**
   * Generates a container with the common attributes and components for each entity:
   *   - type
   *   - ID
   *   - position
   *   - rotation
   *   - scale
   *   - visible
   * @return {UI.CollapsiblePanel} Panel containing all the widgets
   */
  function generateCommonComponentsPanel () {
    var container = new UI.CollapsiblePanel();

    container.addStatic(new UI.Text('Common attributes').setTextTransform('uppercase'));
    container.add(new UI.Break());

    // type
    var objectTypeRow = new UI.Row();
    objectType = new UI.Text();

    objectTypeRow.add(new UI.Text('Type').setWidth('90px'));
    objectTypeRow.add(objectType);

    container.add(objectTypeRow);

    // ID
    var objectIdRow = new UI.Row();
    objectId = new UI.Input().setWidth('150px').setFontSize('12px').onChange(function () {
      handleEntityChange(editor.selected.el, 'id', null, objectId.getValue());
      editor.signals.sceneGraphChanged.dispatch();
    });

    objectIdRow.add(new UI.Text('ID').setWidth('90px'));
    objectIdRow.add(objectId);
    container.add(objectIdRow);

    // Add the parameter rows for the common components
    for (var i = 0; i < commonComponents.length; i++) {
      container.add(getPropertyRow(commonComponents[i], null, aframeCore.components[commonComponents[i]].schema));
    }

    return container;
  }

  /**
   * Add component to the entity
   * @param {Element} entity        Entity
   * @param {string} componentName Component name
   */
  function addComponentToEntity (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
  }

  /**
   * Generate a row including a combobox with the available components to add to
   * the current entity
   */
  function generateAddComponentRow () {
    var componentsRow = new UI.Row();
    var componentsOptions = {};
    for (var name in aframeCore.components) {
      if (commonComponents.indexOf(name) === -1) {
        componentsOptions[name] = name;
      }
    }

    componentsList = new UI.Select().setId('componentlist').setOptions(componentsOptions).setWidth('150px');
    componentsRow.add(new UI.Text('Add').setWidth('90px'));
    componentsRow.add(componentsList);
    var button = new UI.Button('+').onClick(function () {
      // Add the selected component from the combobox to the current active entity
      addComponentToEntity(editor.selected.el, componentsList.getValue());
    });
    componentsRow.add(button.setWidth('20px'));
    return componentsRow;
  }

  /**
   * Update the UI widgets based on the current entity & components values
   * @param  {Element} entity Entity currently selected
   */
  function updateUI (entity) {
    if (ignoreComponentsChange) {
      return;
    }

    objectType.setValue(entity.tagName);
    objectId.setValue(entity.id);

    // Disable the components already used form the list of available
    // components to add to this entity
    var availableComponents = componentsList.dom.querySelectorAll('option');
    for (var i = 0; i < availableComponents.length; i++) {
      availableComponents[i].disabled = entity.getAttribute(availableComponents[i].value);
    }

    // Set the common properties & components to default as they're not recreated
    // as the entity changed
    for (i = 0; i < commonComponents.length; i++) {
      var componentName = commonComponents[i];
      var component = aframeCore.components[componentName];
      if (component.schema.hasOwnProperty('default')) {
        WidgetsFactory.updateWidgetValue(componentName, component.schema.default);
      } else {
        for (var propertyName in component.schema) {
          WidgetsFactory.updateWidgetValue(componentName + '.' + propertyName, component.schema[propertyName].default);
        }
      }
    }

    var entityComponents = Array.prototype.slice.call(entity.attributes);
    entityComponents.forEach(function (component) {
      var properties = entity.getAttribute(component.name);
      if (typeof properties !== 'object') {
        WidgetsFactory.updateWidgetValue(component.name, properties);
      } else {
        for (var property in properties) {
          var id = component.name + '.' + property;
          WidgetsFactory.updateWidgetValue(id, properties[property]);
        }
      }
    });

    WidgetsFactory.updateWidgetVisibility(entity);
  }

  /**
   * Reset to default (clear) one entity's component
   * @param {Element} entity        Entity
   * @param {string} componentName Component name to clear
   */
  function setEmptyComponent (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  }

  /**
   * Generates a row containing the parameter label and its widget
   * @param {string} componentName   Component name
   * @param {string} propertyName   Property name
   * @param {object} propertySchema Property schema
   */
  function getPropertyRow (componentName, propertyName, propertySchema) {
    var propertyRow = new UI.Row();
    var panelName = propertyName || componentName;
    var label = new UI.Text(panelName);
    propertyRow.add(label);

    // If there's no propertyName it's considered a compound attribute.
    // eg: Position, Rotation & Scale are considered a compound attribute of type 'vector3'
    //    schema: {
    //        x: { default: 0 },
    //        y: { default: 0 },
    //        z: { default: 0 }
    //    }
    //
    // We should check also if the schema has a 'default' key in that case we're dealing
    // with a single property components like 'visible':
    //    schema: { default: true },
    if (!propertyName && !propertySchema.hasOwnProperty('default')) {
      // It's a compoundComponent like Position, Rotation or Scale
      label.setWidth('90px');
      var propertyWidgetSize = 150 / Object.keys(propertySchema).length;
      for (propertyName in propertySchema) {
        var propertyWidget = WidgetsFactory.getWidgetFromProperty(componentName, null, propertyName, updateEntityValue, propertySchema[propertyName]);
        propertyWidget.setWidth(propertyWidgetSize + 'px');
        propertyWidget.propertyRow = propertyRow;
        propertyRow.add(propertyWidget);
      }
    } else {
      label.setWidth('120px');
      var newWidget = WidgetsFactory.getWidgetFromProperty(componentName, null, propertyName, updateEntityValue, propertySchema);
      newWidget.propertyRow = propertyRow;
      propertyRow.add(newWidget);
    }

    return propertyRow;
  }

  /**
   * Generate an UI.CollapsiblePanel for each entity's component
   * @param  {Element} entity Current selected entity
   */
  function generateComponentsPanels (entity) {
    objectCustomRow.clear();

    for (var componentName in entity.components) {
      // Ignore the components that we've already included on the common attributes panel
      if (commonComponents.indexOf(componentName) !== -1) {
        continue;
      }

      var component = entity.components[componentName];

      // Add a context menu to delete or reset the component
      var objectActions = new UI.Select()
        .setId(componentName)
        .setPosition('absolute')
        .setRight('8px')
        .setFontSize('11px')
        .setOptions({
          'Actions': 'Actions',
          'Delete': 'Delete',
          'Clear': 'Clear'
        })
        .onClick(function (event) {
          event.stopPropagation(); // Avoid panel collapsing
        })
        .onChange(function (event, component) {
          var action = this.getValue();
          switch (action) {
            case 'Delete':
              entity.removeAttribute(this.getId());
              break;

            case 'Clear':
              setEmptyComponent(entity, this.getId());
              break;

            default:
              return;
          }
          this.setValue('Actions');
          generateComponentsPanels(entity);
          updateUI(entity);
          editor.signals.objectChanged.dispatch(entity.object3D);
        });

      // Collapsible panel with component name as title
      var container = new UI.CollapsiblePanel();
      container.addStatic(new UI.Text(componentName).setTextTransform('uppercase'), objectActions);
      container.add(new UI.Break());

      // Add a widget's row for each parameter on the component
      for (var propertyName in component.schema) {
        container.add(getPropertyRow(componentName, propertyName, component.schema[propertyName]));
      }

      container.add(new UI.Break());
      objectCustomRow.add(container);
    }
  }

  /**
   * Callback when a widget value is updated so we could update the entity attributes
   * @param  {EventTarget} event         Event generated by the onChange listener
   * @param  {string} componentName Component name being modified (eg: 'geometry')
   * @param  {string} attributeName Attribute name being modified (eg: 'primitive')
   * @param  {string} property      Property name, if any, being modified (eg: 'x')
   */
  function updateEntityValue (event, componentName, attributeName, property) {
    ignoreComponentsChange = true;
    var entity = editor.selected.el;

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
    var widget = WidgetsFactory.widgets[id];

    handleEntityChange(entity, componentName, property, widget.getValue());

    WidgetsFactory.updateWidgetVisibility(entity);

    editor.signals.objectChanged.dispatch(entity.object3D);
    ignoreComponentsChange = false;
  }

  // Generate main attributes panel
  var container = new UI.Panel();
  container.setBorderTop('0');
  container.setPaddingTop('20px');
  container.setDisplay('none');

  // Add common attributes panel (type, id, position, rotation, scale, visible)
  container.add(generateCommonComponentsPanel());

  // Append the components list that the user can add to the selected entity
  container.add(generateAddComponentRow());

  // Empty row used to append the panels from each component
  objectCustomRow = new UI.Row();
  container.add(objectCustomRow);

  // Signal dispatchers
  editor.signals.entitySelected.add(function (entity) {
    if (entity) {
      container.show();
      generateComponentsPanels(entity);
      updateUI(entity);
    } else {
      container.hide();
    }
  });
  editor.signals.componentChanged.add(function (evt) {
    var entity = evt.detail.target;
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  });

  return container;
}

module.exports = Attributes;

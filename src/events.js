var SIGNALS = require('signals');

module.exports = {
  // script

  editScript: new SIGNALS.Signal(),

  // player

  startPlayer: new SIGNALS.Signal(),
  stopPlayer: new SIGNALS.Signal(),

  // actions

  showModal: new SIGNALS.Signal(),

  // notifications

  editorCleared: new SIGNALS.Signal(),

  savingStarted: new SIGNALS.Signal(),
  savingFinished: new SIGNALS.Signal(),

  themeChanged: new SIGNALS.Signal(),

  transformModeChanged: new SIGNALS.Signal(),
  snapChanged: new SIGNALS.Signal(),
  spaceChanged: new SIGNALS.Signal(),
  rendererChanged: new SIGNALS.Signal(),

  sceneGraphChanged: new SIGNALS.Signal(),

  cameraChanged: new SIGNALS.Signal(),

  geometryChanged: new SIGNALS.Signal(),

  objectSelected: new SIGNALS.Signal(),
  objectFocused: new SIGNALS.Signal(),

  objectAdded: new SIGNALS.Signal(),
  objectChanged: new SIGNALS.Signal(),
  objectRemoved: new SIGNALS.Signal(),

  helperAdded: new SIGNALS.Signal(),
  helperRemoved: new SIGNALS.Signal(),

  materialChanged: new SIGNALS.Signal(),

  scriptAdded: new SIGNALS.Signal(),
  scriptChanged: new SIGNALS.Signal(),
  scriptRemoved: new SIGNALS.Signal(),

  fogTypeChanged: new SIGNALS.Signal(),
  fogColorChanged: new SIGNALS.Signal(),
  fogParametersChanged: new SIGNALS.Signal(),
  windowResize: new SIGNALS.Signal(),

  showGridChanged: new SIGNALS.Signal(),
  refreshSidebarObject3D: new SIGNALS.Signal(),
  historyChanged: new SIGNALS.Signal(),
  refreshScriptEditor: new SIGNALS.Signal(),

  // A-FRAME
  entitySelected: new SIGNALS.Signal(),
  componentChanged: new SIGNALS.Signal(),
  editorModeChanged: new SIGNALS.Signal()

};

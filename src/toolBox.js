var tools = require('./tools');

function ToolBox () {
  // current selected tool
  this.tool = null;
}

/*
Cycles through available tools
*/
ToolBox.prototype.toggle = function () {
  if (!this.tool) {
    this.tool = tools[0]; // select first tool (default)
  }

  // start tool
  if (!this.tool.started) {
    this.tool.start();
    this.tool.started = true;
    return;
  }

  // stop current tooll and select next
  this.tool.end();
  this.tool.started = false;

  var index = tools.indexOf(this.tool) + 1;
  this.tool = tools[index];

  if (this.tool) {
    this.toggle();
  }
};

module.exports = ToolBox;

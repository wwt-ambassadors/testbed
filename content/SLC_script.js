(function() {
  // The WWT ScriptInterface singleton.
  var wwt_si = null;

  // The WWT WWTControl singleton.
  var wwt_ctl = null;

  // The name of the most recent source whose tile has been clicked.
  var current_source = null;

  function initialize() {
    // This function call is
    // wwt-web-client/HTML5SDK/wwtlib/WWTControl.cs:WWTControl::InitControlParam.
    // It creates a singleton WWTControl object, accessible here as
    // `wwtlib.WWTControl.singleton`, and returns a singleton
    // ScriptInterface object, also accessible as
    // `wwtlib.WWTControl.scriptInterface`.
    wwt_si = wwtlib.WWTControl.initControlParam(
      "wwtcanvas", // id of the <div> to draw in
      true  // use WebGL!
    );
    wwt_si.add_ready(wwt_ready);

  // Load data from wtml file
   wwt_si.loadImageCollection("BUAC_StellarLifeCycles.wtml");

    setup_ui();
  }

  $(document).ready(initialize);

  function wwt_ready() {
    wwt_ctl = wwtlib.WWTControl.singleton;

    wwt_si.settings.set_showConstellationBoundries(false);
    wwt_si.settings.set_showConstellationFigures(false);
    wwt_si.settings.set_showConstellationSelection(false);
    wwt_si.settings.set_showCrosshairs(false);

    setup_controls();
  }

  // Setting up the web app user interface plumbing.

  function setup_ui() {
    // What to do when an image tile is clicked:
    $(".image").each(function (index) {
      const dom_element = $(this);
      $(this).find("a").click(function (event) { on_image_clicked(dom_element, event) });
      $(this).find("a").dblclick(function (event) { on_image_clicked(dom_element, event) });
    });
  }

  function on_image_dblclicked(dom_element, event) {
    if (wwt_si === null) {
      return; // can happen if widget isn't yet fully initialized.
    }

    const sourcename = dom_element.data("sourcename");

    wwt_si.setForegroundImageByName(sourcename)

    if (sourcename=="Hubble Probes the Great Orion Nebula"){
      wwt_si.gotoRaDecZoom(5.5883333333333276*15,-5.40555555555556,0.1, true)
    }

    if (sourcename=="The Ring Nebula (M57)"){
      wwt_si.gotoRaDecZoom(18.893055555555591*15,33.0283333333333,0.1, true)
    }
	  
	if (sourcename=="Peering into the Heart of the Crab Nebula") {
	  wwt_si.gotoRaDecZoom(5.57556*15,22.0148,0.1, true)
	}

    // TODO: do something interesting here
    console.log("clicked on: " + sourcename);
    current_source = sourcename;
  }

  function on_image_clicked(dom_element, event) {
    if (wwt_si === null) {
      return; // can happen if widget isn't yet fully initialized.
    }

    const sourcename = dom_element.data("sourcename");

    wwt_si.setForegroundImageByName(sourcename)

    if (sourcename=="Hubble Probes the Great Orion Nebula"){
      wwt_si.gotoRaDecZoom(5.5883333333333276*15,-5.40555555555556,0.1, false)
    }

    if (sourcename=="The Ring Nebula (M57)"){
      wwt_si.gotoRaDecZoom(18.893055555555591*15,33.0283333333333,0.1, false)
    }

	if (sourcename=="Peering into the Heart of the Crab Nebula") {
	  wwt_si.gotoRaDecZoom(05.57555556*15,22.01666667,0.1, false)
	}

    // TODO: do something interesting here
    console.log("clicked on: " + sourcename);
    current_source = sourcename;
  }

  // Backend details: auto-resizing the WWT canvas.

  function size_content() {
    var container = $("html");

    // Constants here must be synced with settings in style.css
    const new_width = (0.9 * container.width()) + "px";
    const new_height = (0.5 * container.height()) + "px";

    $("#wwtcanvas").css({
      "width": new_width,
      "height": new_height
    });
  }

  $(document).ready(size_content);
  $(window).resize(size_content);

  // Backend details: setting up keyboard controls.
  //
  // TODO: this code is from pywwt and was designed for use in Jupyter;
  // we might be able to do something simpler here.

  function setup_controls() {
    var canvas = document.getElementById("wwtcanvas");

    function new_event(action, attributes, deprecated) {
      if (!deprecated) {
        var event = new CustomEvent(action);
      } else {
        var event = document.createEvent("CustomEvent");
        event.initEvent(action, false, false);
      }

      if (attributes) {
        for (var attr in attributes)
          event[attr] = attributes[attr];
      }

      return event;
    }

    const wheel_up = new_event("wwt-zoom", {deltaY: 53, delta: 53}, true);
    const wheel_down = new_event("wwt-zoom", {deltaY: -53, delta: -53}, true);
    const mouse_left = new_event("wwt-move", {movementX: 53, movementY: 0}, true);
    const mouse_up = new_event("wwt-move", {movementX: 0, movementY: 53}, true);
    const mouse_right = new_event("wwt-move", {movementX: -53, movementY: 0}, true);
    const mouse_down = new_event("wwt-move", {movementX: 0, movementY: -53}, true);

    const zoomCodes = {
      "KeyZ": wheel_up,
      "KeyX": wheel_down,
      90: wheel_up,
      88: wheel_down
    };

    const moveCodes = {
      "KeyJ": mouse_left,
      "KeyI": mouse_up,
      "KeyL": mouse_right,
      "KeyK": mouse_down,
      74: mouse_left,
      73: mouse_up,
      76: mouse_right,
      75: mouse_down
    };

    window.addEventListener("keydown", function(event) {
      // "must check the deprecated keyCode property for Qt"
      if (zoomCodes.hasOwnProperty(event.code) || zoomCodes.hasOwnProperty(event.keyCode)) {
        var action = zoomCodes.hasOwnProperty(event.code) ? zoomCodes[event.code] : zoomCodes[event.keyCode];

        if (event.shiftKey)
          action.shiftKey = 1;
        else
          action.shiftKey = 0;

        canvas.dispatchEvent(action);
      }

      if (moveCodes.hasOwnProperty(event.code) || moveCodes.hasOwnProperty(event.keyCode)) {
        var action = moveCodes.hasOwnProperty(event.code) ? moveCodes[event.code] : moveCodes[event.keyCode];

        if (event.shiftKey)
          action.shiftKey = 1
        else
          action.shiftKey = 0;

        if (event.altKey)
          action.altKey = 1;
        else
          action.altKey = 0;

        canvas.dispatchEvent(action);
      }
    });

    canvas.addEventListener("wwt-move", (function(proceed) {
      return function(event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function() { proceed = true }, delay);

        if (event.altKey)
          wwt_ctl._tilt(event.movementX, event.movementY);
        else
          wwt_ctl.move(event.movementX, event.movementY);
      }
    })(true));

    canvas.addEventListener("wwt-zoom", (function(proceed) {
      return function(event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function() { proceed = true }, delay);

        if (event.deltaY < 0)
          wwt_ctl.zoom(1.43);
        else
          wwt_ctl.zoom(0.7);
      }
    })(true));
  }



})();

(function () {
  // The WWT ScriptInterface singleton.
  var wwt_si = null;

  // The WWT WWTControl singleton.
  var wwt_ctl = null;
    
  // track whether user has panned or zoomed yet.
  var click_counter = 0;
  var zoom_counter = 0;

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
  }

  $(document).ready(initialize);

  function wwt_ready() {
    wwt_ctl = wwtlib.WWTControl.singleton;

    wwt_si.settings.set_showConstellationBoundries(false);
    wwt_si.settings.set_showConstellationFigures(false);
    wwt_si.settings.set_showConstellationSelection(false);
    wwt_si.settings.set_showCrosshairs(false);
    setup_controls();

    //(variables defined inside a function are not known to other functions)
    loadWtml(function (folder, xml) {
      // store each of the Place objects from the WTML file in places
      var places = $(xml).find('Place');
      var thumbTemplate = $('<div class="col_thumb"><a href="javascript:void(0)" class="thumbnail border_white"><img src=""/></a></div>');
      var descTemplate = $('<div class="obj_desc container-fluid"><div class="row"><div class="what col-xs-12 col-md-12 col-lg-12">what</div><div class="process col-xs-12 col-md-12 col-lg-12">process</div><div class="properties col-xs-12 col-md-12 col-lg-12">properties</div><div class="elements col-xs-12 col-md-12 col-lg-12">elements</div></div></div>');

      
      places.each(function (i, pl) {
        var place = $(pl);
        
        // this is the pre-existing description text populator from Ron's code. Perhaps not relevant to ours
        var descText = '', desc;
        desc = place.find('Description').text().split('\n');

        $.each(desc, function (i, item) {
          if (item != undefined) {
            descText += '<p>' + item + '</p>';
          }
        });
        descText += '<hr><h4>Credits</h4>' + '<p><a href="' + place.find('CreditsUrl').text() + '" target=_blank >' + place.find('Credits').text() + '</p>';
        // end of Ron's description text code

        // create a temporary object of a thumbnail and of a description element from the templates above 
        var tmp = thumbTemplate.clone();
        var tmp2 = descTemplate.clone();

        tmp.find('img').attr({
          src: place.find('ThumbnailUrl').text(),
          class: 'border_black',
          alt: place.attr('Name'),
          'data-toggle': 'tooltip',
          'data-placement': 'top',
          'data-container': 'body',
          title: place.find('Description').attr('Title')
        });

        // grab the class = What/Process/Properties/Elements html content for each Plce from the WTML file
        var targetwhat = place.find('.What').html();
        console.log("This what is: ", targetwhat);
        tmp2.find('.what').html(targetwhat);
          
        var targetprocess = place.find('.Process').html();
        console.log("This process is: ", targetprocess);
        tmp2.find('.process').html(targetprocess);
          
        var targetproperties = place.find('.Properties').html();
        console.log("This properties is: ", targetproperties);
        tmp2.find('.properties').html(targetproperties);
          
        var targetelements = place.find('.Elements').html();
        console.log("This elements is: ", targetelements);
        tmp2.find('.elements').html(targetelements);
    
          
        // apply the unique target description class to the description template clone
        var desc_class = place.find('Target').text().toLowerCase() + "_description";
        console.log("desc_class: ", desc_class);
        tmp2.addClass(desc_class);


        // add event listener to every thumbnail element, which listens for single- vs. double-click
        function on_click(element, is_dblclick) {

          if (wwt_si === null) {
            return;
          };

          /* hide all descriptions, then show description specific to this target on sgl/dbl click */
          var toggle_class = "." + place.find('Target').text().toLowerCase() + "_description";
          $("#description_box").find(".obj_desc").hide();
          $('#begin_container').hide();
          $('#description_container').show();
            
          $(toggle_class).show();

          //	Change the border color of the selected thumbnail
          var element = element;
            
          $(".thumbnail img").removeClass("border_yellow").addClass("border_black");
          $(element).removeClass("border_black").addClass("border_yellow");
            
          //trying to make arrow appear only for overflow
          var desc_box = $('#description_container')[0];
          
          if(desc_box.scrollHeight > desc_box.clientHeight) {
            console.log("need arrow");
            $('.fa-arrow-down').show();
          }
          else {
            $('.fa-arrow-down').hide();
          }

          if (place.attr('Classification') == 'SolarSystem') {
            // This is a solar system object. In order to view it correctly,
            // we need to find its associated wwtlib "Place" object and seek
            // to it thusly. The get_camParams() function calculates its
            // current RA and Dec.
            wwt_si.setBackgroundImageByName('Digitized Sky Survey (Color)');

            $.each(folder.get_children(), function (i, wwtplace) {
              if (wwtplace.get_name() == place.attr('Name')) {
                wwt_ctl.gotoTarget3(wwtplace.get_camParams(), false, is_dblclick);
              }
            });

          } else {
            
            if (place.attr('Name') == 'Cosmic Microwave Background') {
              wwt_si.setBackgroundImageByName('Planck CMB');

              wwt_si.gotoRaDecZoom(
                parseFloat(place.attr('RA')) * 15,
                place.attr('Dec'),
                parseFloat(place.find('ImageSet').attr('FOV')),
                false
              );
            } else {

            if (place.attr('Classification') == 'Constellation'){
              wwt_si.setBackgroundImageByName('Digitized Sky Survey (Color)');
              wwt_si.settings.set_showConstellationFigures(true);
              wwt_si.settings.set_showConstellationLabels(true);

              wwt_si.gotoRaDecZoom(
                parseFloat(place.attr('RA')) * 15,
                place.attr('Dec'),
                parseFloat(place.find('ImageSet').attr('FOV')),
                false
              );
            } else {

              wwt_si.setBackgroundImageByName('Digitized Sky Survey (Color)');
              wwt_si.settings.set_showConstellationFigures(false);
              wwt_si.settings.set_showConstellationLabels(false);

              wwt_si.setForegroundImageByName(place.attr('Name'));

              wwt_si.gotoRaDecZoom(
                parseFloat(place.attr('RA')) * 15,
                place.attr('Dec'),
                parseFloat(place.find('ImageSet').attr('FOV')),
                is_dblclick
              );            
            }
          }
        }
      }

        tmp.find('a')
          .data('foreground-image', place.attr('Name'))
          //'click' - false; 'dblclick' - true.  on('click', function () { on_click(false) });

          .on('click', function(event){
            var element = event.target;
            on_click(element, false)
          })

          .on('dblclick', function(event){
            var element = event.target;
            on_click(element, true)
          });

        // we'll probably be able to remove this
        tmp.find('i').attr({
          'data-toggle': 'tooltip',
          'data-placement': 'top',
          title: 'Image Information'
        })
          .on('click', function(e) {
            bootbox.dialog({
              message: descText,
              title: place.find('Description').attr('Title')
            });

            e.preventDefault();
            e.stopPropagation();
          });

        $('#destinationThumbs').append(tmp);

        /* I don't think this code does anything, check with Peter
        var fsThumb = tmp.clone(true).find('a');
        fsThumb.find('label').remove();
        $('.player-controls .btn').first().before(tmp);
        */
          
        $("#description_container").append(tmp2);
          
    
      });
    });
  };

  // Load data from wtml file
  function loadWtml(callback) {
    var hasLoaded = false;

    //This is what Ron calls getXml
    function getWtml() {
      //console.log("in getWtml function");
      if (hasLoaded) { return; }
      hasLoaded = true;
      $.ajax({
        url: wtmlPath,
        crossDomain: false,
        dataType: 'xml',
        cache: false,
        success: function (xml) {
          callback(wwt_si._imageFolder, xml)
        },
        error: function (a, b, c) {
          console.log({ a: a, b: b, c: c });
        }
      });
      //console.log("ran ajax thing");
    }

    var wtmlPath = "BUACStellarLifeCycles.wtml";
    wwt_si.loadImageCollection(wtmlPath);
    console.log("Loaded Image Collection");
    getWtml();
    setTimeout(function () {
      getWtml();
    }, 1500);
    //trigger size_content function again after thumbnails have started loading
    setTimeout(function() {
        size_content();
    }, 500);
  };


  // Backend details: auto-resizing the WWT canvas.

  function size_content() {
    var container = $("html");
    var top_container = $(".top_container");
    var bottom_container = $(".bottom_container")
    var thumb_gutter = $(".thumb_gutter");

    // Constants here must be synced with settings in style.css
    const new_wwt_width = (top_container.width() - thumb_gutter.width());
      // subtract 52 to account for the margin and border in .css file
    const thumbs_height = thumb_gutter.outerHeight(true);
    // const new_wwt_height = ((0.5 * container.height()) - 52);
    const new_wwt_height = top_container.height() - 2;  //set wwt_canvas height to fill top_container, subtract 2 to account for border width
    const colophon_height = $("#colophon").height();
      // subtract 20 to account for the margin in .css file, and give a little wiggle room
    
    const bottom_height = container.height() - top_container.outerHeight() - 50;
    const description_height = bottom_height - colophon_height;
    // const new_desc_height = (bottom_container.height() - colophon_height - 40);
    // const new_desc_height = (0.35 * container.height());
    console.log("html: ", container.height())
    console.log("top: ", top_container.outerHeight())
    console.log("bottom: ", bottom_height)

    $("#wwtcanvas").css({
      "width": new_wwt_width + "px",
      "height": new_wwt_height + "px"
    });

    $(bottom_container).css({
      "height": bottom_height + "px"
    })

    $("#description_box").css({
      "height": description_height + "px"
      // "height": new_desc_height + "px"
    });

  }

  $(document).ready(size_content);
  $(window).resize(size_content);
  // also triggering size_content function in the load_wtml function, because thumbnails aren't loading immediately
    
    



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

    const wheel_up = new_event("wwt-zoom", { deltaY: 53, delta: 53 }, true);
    const wheel_down = new_event("wwt-zoom", { deltaY: -53, delta: -53 }, true);
    const mouse_left = new_event("wwt-move", { movementX: 53, movementY: 0 }, true);
    const mouse_up = new_event("wwt-move", { movementX: 0, movementY: 53 }, true);
    const mouse_right = new_event("wwt-move", { movementX: -53, movementY: 0 }, true);
    const mouse_down = new_event("wwt-move", { movementX: 0, movementY: -53 }, true);

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

    window.addEventListener("keydown", function (event) {
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

    canvas.addEventListener("wwt-move", (function (proceed) {
      return function (event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function () { proceed = true }, delay);

        if (event.altKey)
          wwt_ctl._tilt(event.movementX, event.movementY);
        else
          wwt_ctl.move(event.movementX, event.movementY);
      }
    })(true));

    canvas.addEventListener("wwt-zoom", (function (proceed) {
      return function (event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function () { proceed = true }, delay);

        if (event.deltaY < 0)
          wwt_ctl.zoom(1.43);
        else
          wwt_ctl.zoom(0.7);
      }
    })(true));
  }
  
  // when user scrolls to bottom of the description container, remove the down arrow icon. Add it back when scrolling back up.
  $('#description_container').on('scroll', function(event) {
      var element = event.target;
    
    if(element.scrollHeight - element.scrollTop === element.clientHeight) {
      console.log("reached bottom!");
      $('.fa-arrow-down').fadeOut(200);
    }
    else {
      $('.fa-arrow-down').show();
    }
  })
    
  // may use later, in order to identify when canvas has been interacted with
  $('#wwtcanvas').on('click', function() {
    console.log("canvas clicked");
    $("#zoom_pan_instrux").delay(5000).fadeOut(1000);
  })
    
    
})();

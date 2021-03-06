/* GENERAL
* Version 0.1.126
* Created 2014-10-27 17:10 */

/**
 * SVG component represents BarGraph.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.BarGraph} New SVG BarGraph component
 */
REX.UI.SVG.BarGraph = function(svgElem,args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem,args));
    // Store options for simple usage
    var $o = that.options || {};
    
    // Load options or default values
    var r_min = parseFloat($o.a_rangeMin) || 0;       //minimum rozsahu
    var r_max = parseFloat($o.b_rangeMax) || 100;     //maximum rozsahu
    var tick_step = $o.c_tickStep || 5;               //krok maleho tiku
    var main_tick_step = $o.d_mainTickStep || 10;     //krok hlavniho tiku s oznacenim
    var dig_precision = $o.e_digitalPrecision || 2;   //pocet desetinnych mist pro zaokrouhleni digitalni hodnoty
    var o_units = $o.f_units || " ";                  //jednotky
    var zoneStartValues = stringToArray($o.g_zoneStartValues) || null;
    var zoneEndValues = stringToArray($o.h_zoneEndValues) || null;
    var zoneColors = stringToArray($o.i_zoneColors) || null;
   
    // Get SVG elements for manipulation
    var bargraph_area = that.getChildByTag("bargraph_area"),             //cely objekt
        bargraph_level = that.getChildByTag("bargraph_level"),           //hladina bargrafu
        bargraph_capacity = that.getChildByTag("bargraph_capacity"),     //celkova velikost (kapacita) bargrafu
        border = that.getChildByTag("border"),                           //okraj (ramecek)
        digitalval = that.getChildByTag("digitalval"),                   //digitalni hodnota
        units = that.getChildByTag("units");                             //jednotky

    //Global variables
    var center_x = bargraph_area.getBBox().width / 2;       //x-ova souradnice stredu 
    var center_y = bargraph_area.getBBox().height / 2;      //y-ova souradnice stredu
    var font_size_units = 24;
    var font_size_digitalval = 24;
    var tick_counter = 0;
    var tick_height;
    var tick_width;
    var labels = new Array();
    var colorRanges = new Array();
    var zoneCounter = 0;

    //Set units
        units.textContent = o_units;
        units.setAttributeNS(null, "style", "font-size:" + font_size_units + "px; fill:#ffffff; font-family:Arial");
        units.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - units.parentNode.getBBox().width / 2) - units.parentNode.getBBox().x) + "," + 0 + ")");

    //Set digital value
        digitalval.setAttributeNS(null, "style", "font-size:" + font_size_digitalval + "px; font-family:Arial");

    // Draw ticks
        //tick_counter = (Math.abs(1000000 * r_max - 1000000 * r_min) / 1000000 / tick_step);
        tick_counter = (Math.abs(r_max - r_min) / tick_step);
        tick_height = 1.2;
        tick_width = 20;
        var i = 0;
        while (i <= tick_counter + 0.1) {
            createTick(i, tick_height, tick_width);
            i = i + 1;
        }

    //Draw main ticks
        //var tick_counter = (Math.abs(1000000 * r_max - 1000000 * r_min) / 1000000 / main_tick_step);
        //alert(Math.abs(1000000 * r_max - 1000000 * r_min) / 1000000 / main_tick_step);
        tick_counter = (Math.abs(r_max - r_min) / main_tick_step);
        tick_height = 1.6;
        tick_width = 40;
        var i = 0;
        while (i <= tick_counter + 0.1) {
            createTick(i, tick_height, tick_width);
            createLabel(i);
            i = i + 1;
        }
    //Draw color range
    for (var n = 0; n < zoneStartValues.length; n++) {
        drawColorRange(parseFloat(zoneStartValues[n]), parseFloat(zoneEndValues[n]), zoneColors[n]);
    }

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed    
        that.$c.VALUE.on('change', function (itm) {
            var level = itm.getValue();
            if (level >= r_min && level <= r_max) {
                bargraph_level.setAttributeNS(null, "height", (bargraph_capacity.getBBox().height) * (level - r_min) / Math.abs(r_max - r_min));
                border.style.fill = "#000000";
                digitalval.style.fill = "#00ffff";
            } else {
                if (level > r_max) {
                    /*
                    bargraph_level.setAttributeNS(null, "height", bargraph_capacity.getBBox().height);
                    digitalval.style.fill = "#ff0000";
                    border.setAttributeNS(null, "style", "fill:#ff0000");
                    */
                    while (r_max <= level) {
                        var tmp = r_min;
                        r_min = r_min + 0.5 * Math.abs(r_max - tmp);
                        r_max = r_max + 0.5 * Math.abs(r_max - tmp);
                    }
                    changeLabels();
                    changeColorRange();
                    bargraph_level.setAttributeNS(null, "height", (bargraph_capacity.getBBox().height) * (level - r_min) / Math.abs(r_max - r_min));
                    digitalval.style.fill = "#00ffff";
                    
                } else {
                    /*
                    bargraph_level.setAttributeNS(null, "height", 0.001);
                    digitalval.style.fill = "#ff0000";
                    border.setAttributeNS(null, "style", "fill:#ff0000");
                    */
                    while (r_min >= level) {
                        var tmp = r_min;
                        r_min = r_min - Math.abs(r_max - tmp);
                        r_max = r_max - Math.abs(r_max - tmp);
                    }
                    changeLabels();
                    changeColorRange();
                    bargraph_level.setAttributeNS(null, "height", (bargraph_capacity.getBBox().height) * (level - r_min) / Math.abs(r_max - r_min));
                    digitalval.style.fill = "#00ffff";
                    
                }   
            }
            digitalval.textContent = level.toFixed(dig_precision);
            digitalval.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - digitalval.parentNode.getBBox().width / 2) - digitalval.parentNode.getBBox().x) + "," + 0 + ")");
        });

    function createTick(i,tick_height,tick_width) {
        var x = bargraph_capacity.getBBox().x - tick_width;
        var y = (bargraph_capacity.getBBox().y + bargraph_capacity.getBBox().height) - i * bargraph_capacity.getBBox().height / tick_counter - tick_height/2;
        var elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        elem.setAttributeNS(null, "x", x);
        elem.setAttributeNS(null, "y", y);
        elem.setAttributeNS(null, "width", tick_width);
        elem.setAttributeNS(null, "height", tick_height);
        elem.setAttributeNS(null, "style", "fill:#ffffff");
        bargraph_area.appendChild(elem);
    }

    function createLabel(i) {
        var x = bargraph_capacity.getBBox().x - tick_width;
        var y = (bargraph_capacity.getBBox().y + bargraph_capacity.getBBox().height) - i * bargraph_capacity.getBBox().height / tick_counter - tick_height / 2;
        var font_size = 24;
        var translate_x;
        var translate_y;
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttributeNS(null, "x", x);
        text.setAttributeNS(null, "y", y);
        text.setAttributeNS(null, "fill", "#ffffff");
        text.setAttributeNS(null, "style", "font-size:" + font_size + "px; font-family:Arial");
        text.textContent = Math.round((parseFloat(r_min) + i * main_tick_step) * 100) / 100;
        bargraph_area.appendChild(text);
        translate_x = -text.getBBox().width - 3;
        translate_y = text.getBBox().height / 2 - 3;
        text.setAttributeNS(null, "transform", "translate(" + translate_x + "," + translate_y + ")")
        labels[i] = text;
    }

    function changeLabels() {
        var translate_x;
        var translate_y;
        for (var i = 0; i < labels.length; i++) {
            labels[i].textContent = Math.round((parseFloat(r_min) + i * parseFloat(main_tick_step)) * 100) / 100;
            translate_x = -labels[i].getBBox().width - 3;
            translate_y = labels[i].getBBox().height / 2 - 3;
            labels[i].setAttributeNS(null, "transform", "translate(" + translate_x + "," + translate_y + ")")
        }
    }

    function drawColorRange(startValue, endValue, color) {
        var start = startValue;
        var end = endValue;
        if (start < r_min) start = r_min;
        if (end > r_max) end = r_max;
        var startHeight = (bargraph_capacity.getBBox().height) * (start - r_min) / Math.abs(r_max - r_min);
        var endHeight = (bargraph_capacity.getBBox().height) * (end - r_min) / Math.abs(r_max - r_min);
        var x = bargraph_capacity.getBBox().x + bargraph_capacity.getBBox().width + 1;
        var y = bargraph_capacity.getBBox().y + bargraph_capacity.getBBox().height - endHeight;

        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttributeNS(null, "style", "fill:" + color + "; stroke:none");
            rect.setAttributeNS(null, "x", x);
            rect.setAttributeNS(null, "y", y);
            rect.setAttributeNS(null, "height", endHeight - startHeight);
            rect.setAttributeNS(null, "width", 8);
            bargraph_area.appendChild(rect);
            colorRanges[zoneCounter] = new colorRangeObject(rect, startValue, endValue, color);
            zoneCounter++;
    }

    function changeColorRange() {
        for (var j = 0; j < colorRanges.length; j++) {
            var start = colorRanges[j].start;
            var end = colorRanges[j].end;
            if (start < parseFloat(r_min)) start = parseFloat(r_min);
            if (end > r_max) end = r_max;
            var startHeight = (bargraph_capacity.getBBox().height) * (start - parseFloat(r_min)) / Math.abs(parseFloat(r_max) - parseFloat(r_min));
            var endHeight = (bargraph_capacity.getBBox().height) * (end - parseFloat(r_min)) / Math.abs(parseFloat(r_max) - parseFloat(r_min));
            var x = bargraph_capacity.getBBox().x + bargraph_capacity.getBBox().width + 1;
            var y = bargraph_capacity.getBBox().y + bargraph_capacity.getBBox().height - endHeight;
            colorRanges[j].cRObject.setAttributeNS(null, "x", x);
            colorRanges[j].cRObject.setAttributeNS(null, "y", y);
            colorRanges[j].cRObject.setAttributeNS(null, "height", endHeight - startHeight);
        }
    }

    function colorRangeObject(cRObject, start, end, color) {
        this.cRObject = cRObject;
        this.start = start;
        this.end = end;
        this.color = color;
    }

    function stringToArray(stringLine) {
        var splitChar = " ";
        var array = null;
        if (stringLine.indexOf(",") >= 0)
            splitChar = ",";
        else if (stringLine.indexOf(" ") >= 0)
            splitChar = " ";
        array = stringLine.split(splitChar);
        return array;
    }
    
    return that;
};



/**
 * SVG component represents Button.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.Fan} New SVG Button component
 */
REX.UI.SVG.Button = function(svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.HTMLComponent(svgElem, args));
    var $o = that.options || {};
    var CSScustomizable = REX.HELPERS.parseBoolean($o.CSS_customizable) || false;
    var onMouseDownValue = REX.HELPERS.parseBoolean($o.reverseMeaning) ? 0 : 1;
    var fontScale = parseFloat($o.fontScale) || 1;
    var elementTitle = $(that.element).find('title').text();

    //var textElems = that.element.getElementsByTagName('text');
    var button = $(document.createElement('button')).button();
    $(that.div).append(button);
    
    button.attr('style', 'width:100%; height:100%;');
    button.text($o.text);
    
    if (CSScustomizable) {
        that.$c.STYLE.on('change', function (i) {
            var intVal = parseInt(i.getValue());
            if (intVal === Number.NaN || intVal < 0)
                return;
            that.div.className = elementTitle + "-" + intVal.toString();
        });
    }

    // Init font autoresize
    function updateFontSize() {
        var ctm = that.element.getScreenCTM();
        // Scale according the width or height which is better
        button.css('font-size',Math.min(ctm.a,ctm.d) * fontScale + 'em');
    }
    updateFontSize();
    $(window).resize(function () {
        updateFontSize();
    });
    

    if (that.$c.BUTTON.type === 'R') {
        REX.LOG.error('Connection String: ' + that.$c.BUTTON.cstring + '(' + that.$c.BUTTON.alias + ') is read-only');
        return that;
    }
    
    button.bind('touchend touchcancel touchleave mouseup mouseout', function (evt) {
        if (evt.button && evt.button > 0) {
            return;
        } // Primary mouse button only            
        REX.LOG.debug($o.text + ' mouse up');
        if ($o.type === 'PushButton') {
            that.$c.BUTTON.setValue(1 - onMouseDownValue, true);
        }
        that.fireCallback('mouseup');
    }).bind('touchstart mousedown', function (evt) {
        if (evt.button && evt.button > 0) {
            return;
        } // Primary mouse button only            
        REX.LOG.debug($o.text + ' mouse down');
        that.$c.BUTTON.setValue(onMouseDownValue, true);
        that.fireCallback('mousedown');
    });
    
    return that;
};
/**
 * SVG component represents ComboBox.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.Fan} New SVG ComboBox component
 */
REX.UI.SVG.ComboBox = function(svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.HTMLComponent(svgElem, args));
    var $o = that.options || {};
    var items = $o.options.split("|");
    
    var selectorId='selector'+that.element.id;
    $(that.div).append('<select name="'+selectorId+'" id="'+selectorId+'">');
    for(var i = 0; i<items.length; i++){
       var tuple=items[i].split(":");
       $('#'+selectorId).append('<option value="'+tuple[0]+'">'+items[i]+'</option>');
    }
    
    $('#'+selectorId).selectmenu();
    $('#'+selectorId+'-button').width("100%");
    $('#'+selectorId+'-button').height("100%");
    
    $('#'+selectorId).change(function() {
        var active; var tuple;
        for(var i = 0; i<items.length; i++){
            tuple = items[i].split(":");
            if($(this).val() === tuple[0].toString()){
                active=tuple[0];
                break;
            }
        }
        that.$c.WRITE.setValue(parseInt(active), true);
    });
    
    if (that.$c.WRITE.type === 'R') {
        REX.LOG.error('Connection String: ' + that.$c.WRITE.cstring + '(' + that.$c.WRITE.alias + ') is read-only');
        return that;
    }
    
    that.$c.READ.on('change', function (itm) {
       var value = itm.getValue();
       $('#'+selectorId).val(value.toString());
       $('#'+selectorId).selectmenu();
    });

    return that;
};
/**
 * SVG component represents control led
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.ControlLed} New Control Led component
 */
REX.UI.SVG.ControlLed = function(svgElem,args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem,args));
    // Store options for simple usage
    var $o = that.options || {};    
    
    // Load options or default values
    var onColor = REX.HELPERS.parseBoolean($o.reverseMeaning)? "white" : $o.color;
    var offColor = REX.HELPERS.parseBoolean($o.reverseMeaning)? $o.color:"white";	    
    
    // Get SVG elements for manipulation
    var oled1 = that.getChildByTag('radialgradient-start');
    var oled2 = that.getChildByTag('radialgradient-stop');
    var radialGradientId = that.getChildByTag('radialgradient').id;
    var path = that.getChildByTag('path');
	    
    path.style.fill = "url(#"+radialGradientId+")";

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.LIGHT.on('change',function (i){
      if(i.getValue()){
        oled1.style.stopColor=onColor;
        oled2.style.stopColor=onColor;
      }else{
        oled1.style.stopColor=offColor;
        oled2.style.stopColor=offColor;
      }
      });
      
      return that;
      
};



/**
 * SVG component represents Display.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Fan} New SVG Display component
 */
REX.UI.SVG.Display = function(svgElem,args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem,args));
    // Store options for simple usage
    var $o = that.options || {};    
    
    // Load options or default values
    var range_min = $o.range_min || 0;
    var range_max = $o.range_max || 100;
    var color_max = $o.color_max || '#ff0000';
    var color_min = $o.color_min || '#ffff00';
    var color = $o.color || "black";
    var precision = $o.precision || 4;  //pocet cifer po zaukrouhleni
    
    // Get SVG elements for manipulation
    var number = that.getChildByTag("number");
        
    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed    
    that.$c.VALUE.on('change',function (i){
      if(i.getValue() < range_min){
        number.style.fill = color_min;
      } else if(i.getValue() > range_max){
        number.style.fill = color_max;
      } else {
        number.style.fill = color;
      }
      
      number.textContent = i.getValue().toFixed(precision);
      
      });
      
      return that;
};
/**
 * SVG component represents DisplayWithBox.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.DigitalValue} New SVG DigitalValue component
 */

REX.UI.SVG.DisplayWithBox = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get options or default values
    var o_precision = $o.precision || 2,
        o_units = $o.units || " ";

    // Get SVG elements for manipulation
    var digitalvalue_area = that.getChildByTag("digitalval_area"),
        digitalvalue = that.getChildByTag("digitalval"),
        units = that.getChildByTag("units");

    //Global variables
    var center_x = digitalvalue_area.getBBox().width / 2,
        center_y = digitalvalue_area.getBBox().height / 2;

    //Set units
    units.textContent = o_units;
    units.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - units.parentNode.getBBox().width / 2) - units.parentNode.getBBox().x) + "," + 0 + ")");

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.VALUE.on('change', function (itm) {
        digitalvalue.textContent = itm.getValue().toFixed(o_precision);
        digitalvalue.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - digitalvalue.parentNode.getBBox().width/2) - digitalvalue.parentNode.getBBox().x) + "," + 0 + ")");
    });

    return that;
};

/**
 * SVG component represents Gauge.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Gauge} New SVG Gauge component
 */
REX.UI.SVG.Gauge180 = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Load options or default values
    var r_min = parseFloat($o.a_rangeMin) || 0;       //minimum rozsahu
    var r_max = parseFloat($o.b_rangeMax) || 100;     //maximum rozsahu
    var tick_step = $o.c_tickStep || 5;               //krok maleho tiku
    var main_tick_step = $o.d_mainTickStep || 10;     //krok hlavniho tiku s oznacenim
    var dig_precision = $o.e_digitalPrecision || 2;   //pocet desetinnych mist pro zaokrouhleni digitalni hodnoty
    var o_units = $o.f_units || " ";                  //jednotky
    var zoneStartValues =  stringToArray($o.g_zoneStartValues) || null;
    var zoneEndValues =  stringToArray($o.h_zoneEndValues) || null;
    var zoneColors =  stringToArray($o.i_zonecolors) || null;

    // Get SVG elements for manipulation
    var gauge_area = that.getChildByTag("gauge_area");   //cely objekt
    var hand = that.getChildByTag("hand");               //rucicka
    var middle_circle = that.getChildByTag("middle");    //kruhovy stred
    var border = that.getChildByTag("border");           //okraj
    var tick_0 = that.getChildByTag("tick_0");           //maly tik v pocatku
    var main_tick_0 = that.getChildByTag("main_tick_0"); //hlavni oznaceny tik v pocatku
    var digitalval = that.getChildByTag("digitalval");   //digitalni hodnota
    var units = that.getChildByTag("units");             //jednotky

    //Global variables
    var center_x = gauge_area.getBBox().width / 2;     //x-ova souradnice stredu 
    var center_y = gauge_area.getBBox().height - middle_circle.getBBox().height / 2 - 1;     //y-ova souradnice stredu;
    var font_digitalval = 24;
    var main_tick_size = 5;
    var main_tick_color = "#ffffff";
    var tick_counter;               //pocet malych tiku
    var main_tick_counter;          //pocet hlavnich oznacenych tiku                          
    var tick_angle;                 //uhel mezi jednotlivymi tiky
    var labels = new Array();       //pole hodnot pro popis osy

    //Fill color, opacity, size
    tick_0.setAttributeNS(null, "style", "fill:#ffffff");
    main_tick_0.setAttributeNS(null, "style", "fill-opacity:0");
    tick_0.setAttributeNS(null, "height", tick_0.getBBox().height / 2);
    tick_0.setAttributeNS(null, "y", tick_0.getBBox().y + tick_0.getBBox().height * 2 / 2 - tick_0.getBBox().height / 2);
    hand.setAttributeNS(null, "style", "fill-opacity:1");

    //Set units
    units.textContent = o_units;
    units.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - units.parentNode.getBBox().width / 2) - units.parentNode.getBBox().x) + "," + 10 + ")");

    //Draw ticks
    tick_counter = (Math.abs(r_max - r_min)) / tick_step;
    tick_angle = 180 / tick_counter;
    var i = 0;
    while (i <= tick_counter) {
        createTick(i, "#"+ tick_0.id);
        i = i + 1;
    }
    //Draw main ticks
    main_tick_counter = (Math.abs(r_max - r_min)) / main_tick_step;
    tick_angle = 180 / main_tick_counter;
    i = 0;
    while (i <= main_tick_counter) {
        //createTick(i, "#main_tick_0");
        createLabel(i);
        createMainTick(i);
        i = i + 1;
    }

    //Draw color range
    for (var n = 0; n < zoneStartValues.length; n++){
        drawColorRange(parseFloat(zoneStartValues[n]), parseFloat(zoneEndValues[n]), zoneColors[n]);
    }

    // Change z-index on the top
    hand.parentNode.appendChild(hand);                   //posunuti rucicky v hierarchii uplne nahoru
    middle_circle.parentNode.appendChild(middle_circle); //posunuti kruhoveho stredu v hierarchii uplne nahoru
    digitalval.setAttributeNS(null, "style", "font-size:" + font_digitalval + "px");

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed    
    that.$c.VALUE.on('change', function (itm) {
        var value = itm.getValue();
        var angle = (value - r_min) * (180 / Math.abs(r_max - r_min)) - 90;
        if (value >= r_min && value <= r_max) {
            hand.setAttributeNS(null, "transform", "rotate(" + angle + "," + center_x + "," + center_y + ")");
            digitalval.setAttributeNS(null, "fill", "#00ffff");
            border.setAttributeNS(null, "style", "fill:#000000");
        }

        else {
            if (value > r_max) {

                hand.setAttributeNS(null, "transform", "rotate(" + 90 + "," + center_x + "," + center_y + ")");
                digitalval.setAttributeNS(null, "fill", "#ff0000");
                border.setAttributeNS(null, "style", "fill:#ff0000");
                /*
                var tmp = r_min;
                r_min = r_min + 0.5 * Math.abs(r_max - tmp);
                r_max = r_max + 0.5 * Math.abs(r_max - tmp);
                changeLabels();
                */
            } else {

                hand.setAttributeNS(null, "transform", "rotate(" + -90 + "," + center_x + "," + center_y + ")");
                digitalval.setAttributeNS(null, "fill", "#ff0000");
                border.setAttributeNS(null, "style", "fill:#ff0000");
                /*
                var tmp = r_min;
                r_min = r_min - 0.5 * Math.abs(r_max - tmp);
                r_max = r_max - 0.5 * Math.abs(r_max - tmp);
                changeLabels();
                */
            }
        }
        digitalval.innerHTML = value.toFixed(dig_precision);
        digitalval.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - digitalval.parentNode.getBBox().width / 2) - digitalval.parentNode.getBBox().x) + "," + 0 + ")");
    });

    function createTick(i, tick_type) {
        var mat_a = Math.cos((tick_angle * i) * Math.PI / 180);
        var mat_b = Math.sin((tick_angle * i) * Math.PI / 180);
        var mat_e = (-center_x) * Math.cos((tick_angle * i) * Math.PI / 180) + center_y * Math.sin((tick_angle * i) * Math.PI / 180) + center_x;
        var mat_f = (-center_x) * Math.sin((tick_angle * i) * Math.PI / 180) - center_y * Math.cos((tick_angle * i) * Math.PI / 180) + center_y;

        var elem = document.createElementNS("http://www.w3.org/2000/svg", "use");
        elem.setAttributeNS("http://www.w3.org/1999/xlink", "href", tick_type);
        elem.setAttributeNS(null, "transform", "matrix(" + mat_a + "," + mat_b + "," + -mat_b + "," + mat_a + "," + mat_e + "," + mat_f + ")");
        gauge_area.appendChild(elem);
    }

    function createMainTick(i) {
        var x = center_x + Math.sqrt(center_x / 1.888 * center_x / 1.888 + center_y / 1.888 * center_y / 1.888) * Math.cos((180 - tick_angle * i) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x / 1.888 * center_x / 1.888 + center_y / 1.888 * center_y / 1.888) * Math.sin((180 - tick_angle * i) * Math.PI / 180);

        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttributeNS(null, "cx", x);
        circle.setAttributeNS(null, "cy", y);
        circle.setAttributeNS(null, "r", main_tick_size);
        circle.setAttributeNS(null, "fill", main_tick_color);
        circle.setAttributeNS(null, "style", "stroke:none");
        gauge_area.appendChild(circle);
    }

    function createLabel(i) {
        var x = center_x + Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.cos((180 - tick_angle * i) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.sin((180 - tick_angle * i) * Math.PI / 180);

        var font_size = 22;
        if (i > 0 && i < main_tick_counter) {
            y = y + font_size / 2 + 1;
        }
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttributeNS(null, "x", x);
        text.setAttributeNS(null, "y", y);
        text.setAttributeNS(null, "fill", "#ffffff");
        text.setAttributeNS(null, "style", "font-size:" + font_size + "px; font-family:Arial");
        text.textContent = Math.round((parseFloat(r_min) + i * main_tick_step) * 100) / 100;
        gauge_area.appendChild(text);
        if (i > main_tick_counter / 2) {
            var translate_x = -text.getBBox().width - 1;
            text.setAttributeNS(null, "transform", "translate(" + translate_x + "," + 0 + ")");
        }
        if (i == main_tick_counter / 2) {
            var translate_x = -text.getBBox().width/2;
            var translate_y = text.getBBox().height /5;
            text.setAttributeNS(null, "transform", "translate(" + translate_x + "," + translate_y + ")");
        }
        labels[i] = text;
    }

    function changeLabels() {
        for (var i = 0; i < labels.length; i++) {
            labels[i].textContent = Math.round((r_min + i * main_tick_step) * 100) / 100;
        }
    }

    function drawColorRange(startValue, endValue, color) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var x = center_x + Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.cos((180) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.sin((180) * Math.PI / 180);
        path.setAttributeNS(null, "style", "fill:none; stroke:" + color + "; stroke-width:8; stroke-opacity:0.8");
        path.setAttributeNS(null, "d", "M " + x + " " + y);
        gauge_area.appendChild(path);

        if (startValue < r_min) startValue = r_min;
        if (endValue > r_max) endValue = r_max;

        var startAngle = (startValue - r_min) * (180 / Math.abs(r_max - r_min));
        var endAngle = (endValue - r_min) * (180 / Math.abs(r_max - r_min));
        var i = 0;
        while (startAngle <= endAngle) {
            var radians = ((180 - startAngle) / 180) * Math.PI;
            var px = center_x + Math.cos(radians) * Math.sqrt(center_x / 4 * center_x / 4 + center_y / 4 * center_y / 4);
            var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 4 * center_x / 4 + center_y / 4 * center_y / 4);
            //var px = center_x + Math.cos(radians) * Math.sqrt(center_x / 1.7 * center_x / 1.7 + center_y / 1.7 * center_y / 1.7);
            //var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 1.7 * center_x / 1.7 + center_y / 1.7 * center_y / 1.7);
            //var px = center_x + Math.cos(radians) * Math.sqrt(center_x / 1.46 * center_x / 1.46 + center_y / 1.46 * center_y / 1.46);
            //var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 1.46 * center_x / 1.46 + center_y / 1.46 * center_y / 1.46);
            var e = path.getAttribute("d");
            if (i == 0) {
                var d = e + " M " + px + " " + py;
            } else {
                var d = e + " L " + px + " " + py;
            }
            path.setAttributeNS(null, "d", d);
            startAngle += 0.5;
            i++;
        }
    }

    function stringToArray(stringLine) {
        var splitChar = " ";
        var array = null;
        if (stringLine.indexOf(",") >= 0)
            splitChar = ",";
        else if (stringLine.indexOf(" ") >= 0)
            splitChar = " ";
        array = stringLine.split(splitChar);
        return array;
    }

    return that;
};

/**
 * SVG component represents Gauge.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Gauge} New SVG Gauge component
 */
REX.UI.SVG.Gauge270 = function(svgElem,args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem,args));
    // Store options for simple usage
    var $o = that.options || {};
    
    // Load options or default values
    var r_min = parseFloat($o.a_rangeMin) || 0;       //minimum rozsahu
    var r_max = parseFloat($o.b_rangeMax) || 100;     //maximum rozsahu
    var tick_step = $o.c_tickStep || 5;               //krok maleho tiku
    var main_tick_step = $o.d_mainTickStep || 10;     //krok hlavniho tiku s oznacenim
    var dig_precision = $o.e_digitalPrecision || 2;   //pocet desetinnych mist pro zaokrouhleni digitalni hodnoty
    var o_units = $o.f_units || " ";                  //jednotky
    var zoneStartValues = stringToArray($o.g_zoneStartValues) || null;
    var zoneEndValues = stringToArray($o.h_zoneEndValues) || null;
    var zoneColors = stringToArray($o.i_zoneColors) || null;


    // Get SVG elements for manipulation
    var gauge_area = that.getChildByTag("gauge_area");   //cely objekt
    var hand = that.getChildByTag("hand");               //rucicka
    var hand1 = that.getChildByTag("hand1");             //1.cast rucicky
    var hand2 = that.getChildByTag("hand2");             //2.cast rucicky
    var middle_circle = that.getChildByTag("middle");    //kruhovy stred
    var border = that.getChildByTag("border");           //okraj
    var tick_0 = that.getChildByTag("tick_0");           //maly tik v pocatku
    var main_tick_0 = that.getChildByTag("main_tick_0"); //hlavni oznaceny tik v pocatku
    var digitalval = that.getChildByTag("digitalval");   //digitalni hodnota
    var units = that.getChildByTag("units");             //jednotky

    //Global variables
    var center_x = gauge_area.getBBox().width / 2;     //x-ova souradnice stredu 
    var center_y = gauge_area.getBBox().height / 2     //y-ova souradnice stredu 
    var tick_counter;               //pocet malych tiku
    var main_tick_counter;          //pocet hlavnich oznacenych tiku 
    var main_tick_size = 5;
    var main_tick_color = "#ffffff";
    var tick_angle;                 //uhel mezi jednotlivymi tiky
    var labels = new Array();       //pole hodnot pro popis osy

    //Fill color, opacity, size
    tick_0.setAttributeNS(null, "style", "fill:#ffffff");
    main_tick_0.setAttributeNS(null, "style", "fill-opacity:0");
    tick_0.setAttributeNS(null, "height", tick_0.getBBox().height / 2);
    tick_0.setAttributeNS(null, "y", tick_0.getBBox().y + tick_0.getBBox().height * 2 / 2 - tick_0.getBBox().height / 2);
    hand.setAttributeNS(null, "style", "fill-opacity:1");

    //Set units
    units.textContent = o_units;
    units.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - units.parentNode.getBBox().width / 2) - units.parentNode.getBBox().x) + "," + 0 + ")");

    //Draw ticks
    tick_counter = (Math.abs(r_max - r_min)) / tick_step;
    tick_angle = 270 / tick_counter;
    var i = 0;
    while (i <= tick_counter) {
        createTick(i, "#" + tick_0.id);
        i = i + 1;
    }
    //Draw main ticks
    main_tick_counter = (Math.abs(r_max - r_min)) / main_tick_step;
    tick_angle = 270 / main_tick_counter;
    i = 0;
    while (i <= main_tick_counter) {
        //createTick(i, "#main_tick_0");
        createMainTick(i);
        createLabel(i);
        i = i + 1;
    }

    //Draw color range
    for (var n = 0; n < zoneStartValues.length; n++) {
        drawColorRange(parseFloat(zoneStartValues[n]), parseFloat(zoneEndValues[n]), zoneColors[n]);
    }

    // Change z-index on the top
    hand.parentNode.appendChild(hand);                   //posunuti rucicky v hierarchii uplne nahoru
    middle_circle.parentNode.appendChild(middle_circle); //posunuti kruhoveho stredu v hierarchii uplne nahoru

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed    
    that.$c.VALUE.on('change', function(itm) {
        var value = itm.getValue();
        var angle = (value - r_min) * (270 / Math.abs(r_max - r_min));
        if (value >= r_min && value <= r_max) {
            hand1.setAttributeNS(null, "transform", "rotate(" + angle + "," + center_x + "," + center_y + ")");
            hand2.setAttributeNS(null, "transform", "rotate(" + angle + "," + center_x + "," + center_y + ")");
            digitalval.setAttributeNS(null, "fill", "#00ffff");
            border.setAttributeNS(null, "style", "fill:#000000");
        } else {
            if (value > r_max) {
                hand1.setAttributeNS(null, "transform", "rotate(" + 270 + "," + center_x + "," + center_y + ")");
                hand2.setAttributeNS(null, "transform", "rotate(" + 270 + "," + center_x + "," + center_y + ")");
                digitalval.setAttributeNS(null, "fill", "#ff0000");
                border.setAttributeNS(null, "style", "fill:#ff0000");
                /*
                var tmp = r_min;
                r_min = r_min + 0.5 * Math.abs(r_max - tmp);
                r_max = r_max + 0.5 * Math.abs(r_max - tmp);
                changeLabels();
                */
            } else {
                hand1.setAttributeNS(null, "transform", "rotate(" + 0 + "," + center_x + "," + center_y + ")");
                hand2.setAttributeNS(null, "transform", "rotate(" + 0 + "," + center_x + "," + center_y + ")");
                digitalval.setAttributeNS(null, "fill", "#ff0000");
                border.setAttributeNS(null, "style", "fill:#ff0000");
                /*
                var tmp = r_min;
                r_min = r_min - 0.5 * Math.abs(r_max - tmp);
                r_max = r_max - 0.5 * Math.abs(r_max - tmp);
                changeLabels();
                */
            }
        }
        digitalval.innerHTML = value.toFixed(dig_precision);
        digitalval.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((center_x - digitalval.parentNode.getBBox().width / 2) - digitalval.parentNode.getBBox().x) + "," + -9 + ")");
    });

    function createTick(i,tick_type) {
        var mat_a = Math.cos((tick_angle * i) * Math.PI / 180);
        var mat_b = Math.sin((tick_angle * i) * Math.PI / 180);
        var mat_e = (-center_x) * Math.cos((tick_angle * i) * Math.PI / 180) + center_y * Math.sin((tick_angle * i) * Math.PI / 180) + center_x;
        var mat_f = (-center_x) * Math.sin((tick_angle * i) * Math.PI / 180) - center_y * Math.cos((tick_angle * i) * Math.PI / 180) + center_y;

        var elem = document.createElementNS("http://www.w3.org/2000/svg", "use");
        elem.setAttributeNS("http://www.w3.org/1999/xlink", "href", tick_type);
        elem.setAttributeNS(null, "transform", "matrix(" + mat_a + "," + mat_b + "," + -mat_b + "," + mat_a + "," + mat_e + "," + mat_f + ")");
        gauge_area.appendChild(elem);
    }

    function createMainTick(i) {
        var x = center_x + Math.sqrt(center_x / 1.888 * center_x / 1.888 + center_y / 1.888 * center_y / 1.888) * Math.cos((225 - tick_angle * i) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x / 1.888 * center_x / 1.888 + center_y / 1.888 * center_y / 1.888) * Math.sin((225 - tick_angle * i) * Math.PI / 180);

        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttributeNS(null, "cx", x);
        circle.setAttributeNS(null, "cy", y);
        circle.setAttributeNS(null, "r", main_tick_size);
        circle.setAttributeNS(null, "fill", main_tick_color);
        circle.setAttributeNS(null, "style", "stroke:none");
        gauge_area.appendChild(circle);
    }

    function createLabel(i) {
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        var x = center_x + Math.sqrt(center_x/2 * center_x/2 + center_y/2 * center_y/2) * Math.cos((225 - tick_angle * i) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x/2 * center_x/2 + center_y/2 * center_y/2) * Math.sin((225 - tick_angle * i) * Math.PI / 180);
        var font_size = 28;
        if (i > 0 && i < main_tick_counter) {
            y = y + font_size/2;
        }
        if (i == main_tick_counter / 2) {
            x = x - font_size / 3;
            y = y + font_size / 4;
        }
        if (i > main_tick_counter / 2) {
            x = x - font_size*1.1;
        }
        text.setAttributeNS(null, "x", x);
        text.setAttributeNS(null, "y", y);
        text.setAttributeNS(null, "fill", "#ffffff");
        text.setAttributeNS(null, "style", "font-size:" + font_size + "px; font-family:Arial");
        text.textContent = Math.round((parseFloat(r_min) + i * main_tick_step) * 100) / 100;
        gauge_area.appendChild(text);
        labels[i] = text;

    }

    function changeLabels() {
        for (var i = 0; i < labels.length; i++) {
            labels[i].textContent = Math.round((parseFloat(r_min) + i * main_tick_step)*100)/ 100;
        }
    }

    function drawColorRange(startValue,endValue,color) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var x = center_x + Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.cos((225) * Math.PI / 180);
        var y = center_y - Math.sqrt(center_x / 2 * center_x / 2 + center_y / 2 * center_y / 2) * Math.sin((225) * Math.PI / 180);
        path.setAttributeNS(null, "style", "fill:none; stroke:" + color + "; stroke-width:10; stroke-opacity:0.7");
        path.setAttributeNS(null, "d", "M " + x + " " + y);
        gauge_area.appendChild(path);

        if (startValue < r_min) startValue = r_min;
        if (endValue > r_max) endValue = r_max;

        var startAngle = (startValue - r_min) * (270 / Math.abs(r_max - r_min));
        var endAngle = (endValue - r_min) * (270 / Math.abs(r_max - r_min));
        var i = 0;
        while (startAngle <= endAngle) {
            var radians = ((225 -startAngle) / 180) * Math.PI;
            //var px = center_x + Math.cos(radians) * Math.sqrt(center_x / 3 * center_x / 3 + center_y / 3 * center_y / 3);
            //var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 3 * center_x / 3 + center_y / 3 * center_y / 3);
            var px = center_x + Math.cos(radians) * Math.sqrt(center_x/1.558 * center_x/1.558 + center_y/1.558 * center_y/1.558);
            var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 1.558 * center_x / 1.558 + center_y / 1.558 * center_y / 1.558);
            //var px = center_x + Math.cos(radians) * Math.sqrt(center_x / 1.46 * center_x / 1.46 + center_y / 1.46 * center_y / 1.46);
            //var py = center_y - Math.sin(radians) * Math.sqrt(center_x / 1.46 * center_x / 1.46 + center_y / 1.46 * center_y / 1.46);
            var e = path.getAttribute("d");
            if (i == 0) {
                var d = e + " M " + px + " " + py;
            } else {
                var d = e + " L " + px + " " + py;
            }
            path.setAttributeNS(null, "d", d);
            startAngle += 0.5;
            i++;
        }
    }

    function stringToArray(stringLine) {
        var splitChar = " ";
        var array = null;
        if (stringLine.indexOf(",") >= 0)
            splitChar = ",";
        else if (stringLine.indexOf(" ") >= 0)
            splitChar = " ";
        array = stringLine.split(splitChar);
        return array;
    }

    return that;
};

/**
 * SVG component represents General Component with multiple transformation
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.GeneralComponent} New Genral Component component
 */
REX.UI.SVG.GeneralComponent = function(svgElem, args) {
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    var $o = that.options || {};

    var bbox = that.element.getBBox(),
            ocmi = $o.colorMin || ' ',
            ocma = $o.colorMax || ' ',
            R_min = hexToR(ocmi) || 0,
            G_min = hexToG(ocmi) || 0,
            B_min = hexToB(ocmi) || 0,
            R_max = hexToR(ocma) || 0,
            G_max = hexToG(ocma) || 0,
            B_max = hexToB(ocma) || 0,
            rotationR = $o.rotationRange || 0,
            rotationSMax = $o.rotationSignalMax || 0,
            rotationSMin = $o.rotationSignalMin || 0,
            rotOffsetX = parseFloat(that.element.getAttribute('inkscape:transform-center-x')) || 0,
            rotOffsetY = parseFloat(that.element.getAttribute('inkscape:transform-center-y')) || 0,
            elemCenterX = bbox.x + bbox.width / 2,
            elemCenterY = bbox.y + bbox.height / 2,
            scaleMax = $o.scaleMax || 0,
            scaleMin = $o.scaleMin || 0,
            scaleSMax = $o.scaleSignalMax || 0,
            scaleSMin = $o.scaleSignalMin || 0,
            scaleX = REX.HELPERS.parseBoolean($o.scaleX),
            scaleY = REX.HELPERS.parseBoolean($o.scaleY),
            opacityMax = $o.opacityMax || 0,
            opacityMin = $o.opacityMin || 0,
            opacityR = opacityMax - opacityMin || 0,
            opacitySMax = $o.opacitySignalMax || 0,
            opacitySMin = $o.opacitySignalMin || 0,
            txR = $o.xRange || 0,
            txSMax = $o.xSignalMax || 0,
            txSMin = $o.xSignalMin || 0,
            tyR = $o.yRange || 0,
            tySMax = $o.ySignalMax || 0,
            tySMin = $o.ySignalMin || 0;
    that.element.setAttribute('transform', '');

    that.changeColor = function(color) {
        if (REX.HELPERS.isNumber(color)) {
            var R, G, B, X;

            if (color > $o.colorSignalMin && color < $o.colorSignalMax) {
                R = Math.round(R_min + ((R_max - R_min) * (color - $o.colorSignalMin)) / ($o.colorSignalMax - $o.colorSignalMin));
                G = Math.round(G_min + ((G_max - G_min) * (color - $o.colorSignalMin)) / ($o.colorSignalMax - $o.colorSignalMin));
                B = Math.round(B_min + ((B_max - B_min) * (color - $o.colorSignalMin)) / ($o.colorSignalMax - $o.colorSignalMin));
                X = rgbToHex(R, G, B);
                that.element.style.fill = X;
            }
            else if (color <= $o.colorSignalMin) {
                that.element.style.fill = $o.colorMin;
            }
            else if (color >= $o.colorSignalMax) {
                that.element.style.fill = $o.colorMax;
            }
            else {
                that.element.style.fill = "grey";
            }
            return;
        } else if (typeof color === 'string') {
            that.element.style.fill = color;
        }
    };

    that.rotate = function(angle) {
        var oldVal, newVal;

        var angleR = rotationR * (angle - rotationSMin) / (rotationSMax - rotationSMin),
                str = that.element.getAttribute('transform');
        oldVal = getOldValue('rotate', str);
        newVal = 'rotate(' + angleR + ',' + (elemCenterX + rotOffsetX) + ',' + (elemCenterY - rotOffsetY) + ')';
        str = str.replace(oldVal, newVal);
        that.element.setAttribute('transform', str);
    };

    that.translate = function(val, axis) {
        var startI, endI, toReplace, newVal, oldVal;
        if (axis === 'x') {
            var tXa = txR * (val - txSMin) / (txSMax - txSMin),
                    str = that.element.getAttribute('transform'),
                    oldVal = getOldValue('translate', str);
            if (oldVal === '') {
                newVal = 'translate(' + tXa + ',0)';
            }
            else {
                startI = oldVal.search('\\(');
                endI = oldVal.search(',');
                toReplace = oldVal.slice(startI + 1, endI + 1);
                newVal = oldVal.replace(toReplace, tXa + ',');
            }
        }
        else {
            var tYa = tyR * (val - tySMin) / (tySMax - tySMin),
                    str = that.element.getAttribute('transform'),
                    oldVal = getOldValue('translate', str);
            if (oldVal === '') {
                newVal = 'translate(0,' + (-tYa) + ')';
            }
            else {
                startI = oldVal.search(',');
                endI = oldVal.search('\\\)');
                toReplace = oldVal.slice(startI, endI);
                newVal = oldVal.replace(toReplace, ',' + tYa);
            }
        }

        str = str.replace(oldVal, newVal);
        that.element.setAttribute('transform', str);
    };

    that.scale = function(scale) {
        if (scaleX || scaleY) {
            var oldVal, newVal;
            var scaleA = parseFloat(scaleMin) + (scaleMax - scaleMin) * (scale - scaleSMin) / (scaleSMax - scaleSMin),
                    str = that.element.getAttribute('transform');
            oldVal = getOldValue('matrix', str);
            if (scaleX && !scaleY) {
                newVal = 'matrix(' + scaleA + ',0,0,1,' + ((1 - scaleA) * (elemCenterX + rotOffsetX)) + ',0)';
            }
            if (!scaleX && scaleY) {
                newVal = 'matrix(1,0,0,' + scaleA + ',0,' + ((1 - scaleA) * (elemCenterY - rotOffsetY)) + ')';
            }
            if (scaleX && scaleY) {
                newVal = 'matrix(' + scaleA + ',0,0,' + scaleA + ',' + ((1 - scaleA) * (elemCenterX + rotOffsetX)) + ',' + ((1 - scaleA) * (elemCenterY - rotOffsetY)) + ')';
            }
            str = str.replace(oldVal, newVal);
            that.element.setAttribute('transform', str);
        }
    };

    that.opacity = function(opacity) {
        var opacityA = parseFloat(opacityMin) + opacityR * (opacity - opacitySMin) / (opacitySMax - opacitySMin);
        that.element.setAttribute('opacity', opacityA);
    };

    if (typeof that.$c.COLOR !== "undefined") {
        removeChildrenColor();
        that.element.style.fill = "grey";
        that.$c.COLOR.on('change', function(i) {
            that.changeColor(i.getValue());
            that.fireCallback('color');
        });
    }
    if (typeof that.$c.ROTATE !== "undefined") {
        that.$c.ROTATE.on('change', function(i) {
            that.rotate(i.getValue());
            that.fireCallback('rotate');
        });
    }
    if (typeof that.$c.TRANSLATE_X !== "undefined") {
        that.$c.TRANSLATE_X.on('change', function(i) {
            that.translate(i.getValue(), 'x');
            that.fireCallback('translate-x');
        });
    }
    if (typeof that.$c.TRANSLATE_Y !== "undefined") {
        that.$c.TRANSLATE_Y.on('change', function(i) {
            that.translate(i.getValue(), 'y');
            that.fireCallback('translate-y');
        });
    }
    if (typeof that.$c.SCALE !== "undefined") {
        that.$c.SCALE.on('change', function(i) {
            that.scale(i.getValue());
            that.fireCallback('scale');
        });
    }
    if (typeof that.$c.OPACITY !== "undefined") {
        that.$c.OPACITY.on('change', function(i) {
            that.opacity(i.getValue());
            that.fireCallback('opacity');
        });
    }
    function getOldValue(option, string) {
        var startVal = string.search(option + '\\(');
        if (startVal > -1) {
            string = string.slice(startVal);
            var endVal = string.search('\\\)');
            return string.slice(0, endVal + 1);
        }
        else
            return '';
    }

    function removeChildrenColor() {
        var childNodes = Array.prototype.slice.call(that.element.childNodes);

        for (var i = 0; i < childNodes.length; i++) {
            var item = childNodes[i];
            if (item.getAttribute) {
                item.style.fill = '';
            }
            childNodes = childNodes.concat(Array.prototype.slice.call(item.childNodes));
        }
    }
    function rgbToHex(R, G, B) {
        return '#' + toHex(R) + toHex(G) + toHex(B);
    }
    function toHex(n) {
        n = parseInt(n, 10);
        if (isNaN(n))
            return "00";
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
    }
    ;
    function hexToR(h) {
        return parseInt((cutHex(h)).substring(0, 2), 16);
    }
    ;
    function hexToG(h) {
        return parseInt((cutHex(h)).substring(2, 4), 16);
    }
    ;
    function hexToB(h) {
        return parseInt((cutHex(h)).substring(4, 6), 16);
    }
    ;
    function cutHex(h) {
        return (h.charAt(0) === "#") ? h.substring(1, 7) : h;
    }
    ;

    return that;
};
/**
 * SVG component represents HTMLComponent.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.HTMLComponent} New HTML component
 */
REX.UI.SVG.HTMLComponent = function(svgElem,args) {
    // Inherit from base component
    var that = {};
    that=Object.create(REX.UI.SVG.Component(svgElem, args));
    var $o = that.options || {};
    
    var div=document.createElement('div');
    
    div.style.position='absolute';
    
    $(div).addClass('ui-svg-div');
    $(div).attr('id',that.element.getAttributeNS(null,'id')+'-div');
    
    that.element.setAttributeNS(null,'visibility','hidden'); 
    
    $('#content').append(div);
  
    updatePosition();
    
    //Event listeners, call updatePosition function
    $( window ).resize(function() {
        updatePosition();
    });
    $(div).parent().scroll(function() {
         updatePosition();
    });
    
    function updatePosition(){
        var elemBc=that.element.getBoundingClientRect();
        var divPos=$('#content').offset();
        div.style.left=(elemBc.left-divPos.left+that.svg.parentNode.scrollLeft)+'px';
        div.style.top= (elemBc.top-divPos.top+that.svg.parentNode.scrollTop)+'px';
        var ctm=that.element.getScreenCTM();
        div.style.width =that.element.getBBox().width*ctm.a+'px';
        div.style.height=that.element.getBBox().height*ctm.d+'px';
    }
    that.div=div;
    return that;
};


/**
 * SVG component represents numeric input.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.Fan} New SVG numeric input component
 */
REX.UI.SVG.Input = function(svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.HTMLComponent(svgElem, args));
    var $o = that.options || {};

    that.div.setAttribute('class', 'ui-spinner ui-state-default ui-widget ui-widget-content ui-corner-all');

    var input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('value', 'NaN');
    input.setAttribute('name', 'value');
    input.setAttribute('class', 'ui-spinner-input');
    input.style.width = '100%';
    input.style.height = '100%';

    that.div.appendChild(input);
    updateFontSize();

    $(window).resize(function() {
        updateFontSize();
    });

    function updateFontSize() {
        input.style.fontSize = that.element.getScreenCTM().a * 1 + 'em';
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    that.$c.value.on('change', function(i) {
        input.value = i.getValue();
    });

    if (that.$c.value.type === 'R') {
        REX.LOG.error('Connection String: ' + that.$c.value.cstring + '(' + that.$c.value.alias + ') is read-only');
        return that;
    }

    input.addEventListener('keypress', function(evt) {
        if (!evt.keyCode || evt.keyCode === 13) {// keyCode 13 - ENTER                           
            var text = evt.target.value.replace(',', '.');
            if (isNumber(text)) {
                REX.HELPERS.removeClass(that.div, 'ui-state-error');
                that.$c.value.setValue(parseFloat(text), true);
            }
            else {
                REX.HELPERS.appendClass(that.div, 'ui-state-error');
            }
        }
    });

    return that;
};
/**
 * SVG component represents Led.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Led} New SVG Led component
 */

REX.UI.SVG.Led = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Load options or default values
    var colorRun = $o.colorRun || "#33ee00";
    var colorStop = $o.colorStop || "ff2200";
        
    // Get SVG elements for manipulation
    var led = that.getChildByTag("led");

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.POWER.on('change', function (itm) {
        if (itm.getValue()) {
            led.setAttributeNS(null, "style", "fill:" + colorRun + "; fill-opacity:1.0;fill-rule:nonzero;stroke:none)");
        } else {
            led.setAttributeNS(null, "style", "fill:" + colorStop + "; fill-opacity:1.0;fill-rule:nonzero;stroke:none)");
        }
    });

    return that;
};

/**
 * SVG component represents PushOnOff.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.PushOnOff} New SVG PushOnOff component
 */

REX.UI.SVG.PushOnOff = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get options or default values
    var initialPosition = $o.initialPosition || null;
 
    // Get SVG elements for manipulation
    var pushOnOffArea = that.getChildByTag("pushOnOff_area"),
        buttonP1 = that.getChildByTag("button_part1"),
        buttonP2 = that.getChildByTag("button_part2"),
        buttonP3 = that.getChildByTag("button_part3");

    //Global variables
    var centerX = pushOnOffArea.getBBox().width / 2,
        centerY = pushOnOffArea.getBBox().height / 2,
        init = false,
        currentPosition = 0;

    pushOnOffArea.addEventListener("click", switchValue, false);
    pushOnOffArea.addEventListener("mouseover", mOver, false);
    pushOnOffArea.addEventListener("mouseout", mOut, false);
    pushOnOffArea.addEventListener("mousedown", mOver, false);
    pushOnOffArea.addEventListener("mouseup", mOut, false);

    function switchValue(event) {
        if (currentPosition == 0) {
            buttonP1.style.fill = "#33ff00";
            buttonP3.style.fill = "#33aa22";
            that.$c.POWER_W.setValue(true, true);
            currentPosition = 1;
        } else {
            buttonP1.style.fill = "#b3b3b3";
            buttonP3.style.fill = "#808080";
            that.$c.POWER_W.setValue(false, true);
            currentPosition = 0;
        }
    }

    function mOver(event) {
        if(currentPosition == 0)
            buttonP1.style.fill = "#838383";
        else
            buttonP1.style.fill = "#33bb22";
    }

    function mOut(event) {
        if (currentPosition == 0)
            buttonP1.style.fill = "#b3b3b3";
        else
            buttonP1.style.fill = "#33ff00";
    }

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.POWER_R.on('change', function (itm) {
        if (!itm.getValue()) {
            buttonP1.style.fill = "#b3b3b3";
            buttonP3.style.fill = "#808080";
            currentPosition = 0;
        } else {
            buttonP1.style.fill = "#33ff00";
            buttonP3.style.fill = "#33ff22";
            currentPosition = 1;
        }

        if (!init & initialPosition !== null) {
            if (initialPosition.toLowerCase() === 'on') {
                that.$c.POWER_W.setValue(true, true);
            } else if (initialPosition.toLowerCase() === 'off') {
                that.$c.POWER_W.setValue(false, true);
            }
            init = true;
        }
    });

    return that;
};

/**
 * SVG component represents Slider.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Slider} New SVG Slider component
 */

REX.UI.SVG.SliderHorizontal = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get SVG elements for manipulation
    var sliderArea = that.getChildByTag("slider_area"),
        level = that.getChildByTag("slider_level"),
        capacity = that.getChildByTag("slider_capacity"),
        dragPoint = that.getChildByTag("drag_point"),
        digitalValue = that.getChildByTag("digitalval");

    //Load options or default values
    var minValue = parseFloat($o.a_minValue) || 0,
        maxValue = parseFloat($o.b_maxValue) || 100,
        initialValue = parseFloat($o.d_initialValue) || null,
        step = parseFloat($o.c_step) || 1,
        digitalPrecision = parseFloat($o.e_digitalPrecision) || 2,
        fSize = parseFloat($o.f_fontSize) || 18,
        label = $o.g_label || "";

    //Global variables
    var setPoint,
        setPointChanged = false,
        sliderActive = false,
        initialLevelWidth = level.getBBox().width,
        capacityOffset = $('#' + capacity.id).offset().left - $('#' + sliderArea.id).offset().left,
        capacityOffsetLeft = $('#' + capacity.id).offset().left,
        init = false;

    createLabel();
    sliderArea.addEventListener("mousedown", sliderDown,false);
    document.addEventListener("mouseup", sliderUp,false);
    document.addEventListener("mousemove", sliderMove, false);
    sliderArea.addEventListener("click", sliderClick, false);

    function sliderDown(event) {
        sliderActive = true;
    }

    function sliderUp(event) {
        sliderActive = false;
        if (setPointChanged)
        that.$c.VALUE_W.setValue(parseFloat(setPoint), true);
    }

    function sliderMove(event) {
        var position = event.pageX - $('#' + capacity.id).offset().left;
        if (sliderActive && position > 0 && position < capacity.getBBox().width -1) {
            dragPoint.setAttributeNS(null, "transform", "translate(" + parseFloat(position) + "," + 0 + ")");
            level.setAttributeNS(null, "width", position);
            setValue(position);
        }
    }

    function sliderClick(event) {
        var position = event.pageX - $('#' + capacity.id).offset().left - capacityOffset;
        if (sliderActive && position > 0 && position < capacity.getBBox().width-1) {
            dragPoint.setAttributeNS(null, "transform", "translate(" +parseFloat(position) + "," + 0 + ")");
            level.setAttributeNS(null, "width", position);
            setValue(position);
        }
    }

    function setValue(val) {
        var relativeStep = (capacity.getBBox().width - 2) / (Math.abs(maxValue - minValue) / step);
        if (val % relativeStep < relativeStep) {
            setPoint = minValue + Math.round(val / relativeStep) * step;
            if (setPoint < minValue) {
                setPoint = minValue;
            }
            else if (setPoint > maxValue) {
                setPoint = maxValue;
            }
            digitalValue.textContent = setPoint.toFixed(digitalPrecision);
            digitalValue.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((sliderArea.getBBox().width / 2 - digitalValue.parentNode.getBBox().width / 2) - digitalValue.parentNode.getBBox().x + 25) + "," + 0 + ")");
            setPointChanged = true;
        }
    }

    that.$c.VALUE_R.on('change', function (itm) {
        updateSlider(itm.getValue());
        if (!init && initialValue != null) {
            that.$c.VALUE_W.setValue(parseFloat(initialValue), true);
            init = true;
        }
    });

    function updateSlider(setPointValue) {
        var setP = setPointValue;
        var position;
        if (setP >= minValue && setP <= maxValue) {
            position = (setP - minValue) * (capacity.getBBox().width) / Math.abs(maxValue - minValue);
        } else {
            if (setP < minValue) {
                setP = minValue;
                position = 0;
            }
            else {
                setP = maxValue;
                position = capacity.getBBox().width;
            }
        }
        digitalValue.textContent = setP.toFixed(digitalPrecision);
        digitalValue.style.fontSize = fSize + "px";
        digitalValue.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((sliderArea.getBBox().width / 2 - digitalValue.parentNode.getBBox().width / 2) - digitalValue.parentNode.getBBox().x + 25) + "," + 0 + ")");
        dragPoint.setAttributeNS(null, "transform", "translate(" + parseFloat(position) + "," + 0 + ")");
        level.setAttributeNS(null, "width", position);
    }

    function createLabel() {
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttributeNS(null, "fill", "#ffffff");
        text.setAttributeNS(null, "style", "font-size:" + fSize + "px; font-family:Arial");
        text.textContent = label;
        sliderArea.appendChild(text);
        text.setAttributeNS(null, "x", sliderArea.getBBox().width / 2 - text.getBBox().width / 2 + 13);
        text.setAttributeNS(null, "y", (sliderArea.getBBox().height - text.getBBox().height * 1.1));
    }

   return that;
};

/**
 * SVG component represents Slider.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Slider} New SVG Slider component
 */

REX.UI.SVG.SliderVertical = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get SVG elements for manipulation
    var sliderArea = that.getChildByTag("slider_area"),
        level = that.getChildByTag("slider_level"),
        capacity = that.getChildByTag("slider_capacity"),
        dragPoint = that.getChildByTag("drag_point"),
        digitalValue = that.getChildByTag("digitalval");

    //Load options or default values
    var minValue = parseFloat($o.a_minValue) || 0,
        maxValue = parseFloat($o.b_maxValue) || 100,
        initialValue = parseFloat($o.d_initialValue) || null,
        step = parseFloat($o.c_step) || 1,
        digitalPrecision = parseFloat($o.e_digitalPrecision) || 2,
        fSize = parseFloat($o.f_fontSize) || 18,
        label = $o.g_label || "";

    //Global variables
    var setPoint,
        setPointChanged = false,
        sliderActive = false,
        initialLevelWidth = level.getBBox().width,
        init = false;

    level.setAttributeNS(null, "transform", "rotate(" + 180 + "," + (capacity.getBBox().x + capacity.getBBox().width / 2) + "," + (capacity.getBBox().y+ capacity.getBBox().height)+ ")");
    createLabel();
    sliderArea.addEventListener("mousedown", sliderDown,false);
    document.addEventListener("mouseup", sliderUp,false);
    document.addEventListener("mousemove", sliderMove, false);
    sliderArea.addEventListener("click", sliderClick, false);

    function sliderDown(event) {
        sliderActive = true;
    }

    function sliderUp(event) {
        sliderActive = false;
        if (setPointChanged)
        that.$c.VALUE_W.setValue(parseFloat(setPoint), true);
    }

    function sliderMove(event) {
        var position = $('#' + capacity.id).offset().top + capacity.getBBox().height - event.pageY;
        if (sliderActive && position >= -1 && position < capacity.getBBox().height + 0.3) {
            dragPoint.setAttributeNS(null, "transform", "translate(" + 0 + "," + -parseFloat(position) + ")");
            level.setAttributeNS(null, "height", position);
            setValue(position);
        }
    }

    function sliderClick(event) {
        var position = $('#' + capacity.id).offset().top + capacity.getBBox().height - event.pageY;
        if (sliderActive && position >= -1 && position < capacity.getBBox().width + 0.3) {
            dragPoint.setAttributeNS(null, "transform", "translate(" + 0 + "," + -parseFloat(position) + ")");
            level.setAttributeNS(null, "height", position);
            setValue(position);
        }
    }

    function setValue(val) {
        var relativeStep = (capacity.getBBox().height) / (Math.abs(maxValue - minValue) / step);
        if (val % relativeStep < relativeStep) {
            setPoint = minValue + Math.round(val / relativeStep) * step;
            if (setPoint < minValue) {
                setPoint = minValue;
            }
            else if (setPoint > maxValue){
                setPoint = maxValue;
            }
            digitalValue.textContent = setPoint.toFixed(digitalPrecision);
            digitalValue.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((sliderArea.getBBox().width / 2 - digitalValue.parentNode.getBBox().width / 2) - digitalValue.parentNode.getBBox().x) + "," + 0 + ")");
            setPointChanged = true;
        }
    }

    that.$c.VALUE_R.on('change', function (itm) {
        updateSlider(itm.getValue());
        if (!init && initialValue != null) {
            that.$c.VALUE_W.setValue(parseFloat(initialValue), true);
            init = true;
        }
    });

    function updateSlider(setPointValue) {
        var setP = setPointValue;
        var position;
        if (setP >= minValue && setP <= maxValue) {
            position = (setP - minValue) * (capacity.getBBox().height) / Math.abs(maxValue - minValue);
        } else {
            if (setP < minValue) {
                setP = minValue;
                position = 0;
            }
            else {
                setP = maxValue;
                position = capacity.getBBox().height;
            }
        }
        digitalValue.textContent = setP.toFixed(digitalPrecision);
        digitalValue.style.fontSize = fSize + "px";
        digitalValue.parentNode.setAttributeNS(null, "transform", "translate(" + parseInt((sliderArea.getBBox().width / 2 - digitalValue.parentNode.getBBox().width / 2) - digitalValue.parentNode.getBBox().x) + "," + 0 + ")");
        dragPoint.setAttributeNS(null, "transform", "translate(" + 0 + "," + -parseFloat(position) + ")");
        level.setAttributeNS(null, "height", position);
    }

    function createLabel() {
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttributeNS(null, "fill", "#ffffff");
        text.setAttributeNS(null, "style", "font-size:" + fSize + "px; font-family:Arial");
        text.textContent = label;
        sliderArea.appendChild(text);
        text.setAttributeNS(null, "x", sliderArea.getBBox().width/2 - text.getBBox().width/2);
        text.setAttributeNS(null, "y", (sliderArea.getBBox().height - text.getBBox().height * 1.1));
    }

   return that;
};

/**
 * SVG component represents Switch.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Switch} New SVG Switch component
 */

REX.UI.SVG.Switch = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get options or default values
    var initialPosition = $o.initialPosition || null,
        valuesOfPositions = stringToArray($o.valuesOfPositions) || null;
 
    // Get SVG elements for manipulation
    var switchArea = that.getChildByTag("switch_area"),
        hand = that.getChildByTag("hand");

    //Global variables
    var centerX = switchArea.getBBox().width / 2,
        centerY = switchArea.getBBox().height / 2 - 1,
        currentPosition,
        points = new Array(),
        init = false;

    var i = 0;
    var pointAngle = 360 / valuesOfPositions.length;
    while (i < valuesOfPositions.length) {
        createPoint(i);
        i++;
    }

    switchArea.addEventListener("click", switchValueLeft, false);
    switchArea.addEventListener("contextmenu", switchValueRight,false);

    function switchValueRight(event) {
            event.preventDefault();
            hand.setAttributeNS(null, "transform", "rotate(" + (-90 + currentPosition*pointAngle + pointAngle) + "," + centerX + "," + centerY + ")");
            that.$c.VALUE_W.setValue(parseFloat(valuesOfPositions[(currentPosition + 1) % valuesOfPositions.length]), true);
            points[currentPosition].style.fill = "#ffffff";
            points[currentPosition].setAttributeNS(null, "r", 1);
            currentPosition = (currentPosition + 1) % valuesOfPositions.length;
            points[currentPosition].style.fill = "#00ff00";
            points[currentPosition].setAttributeNS(null, "r", 2);
    }

    function switchValueLeft(event) {
        hand.setAttributeNS(null, "transform", "rotate(" + (-90 + currentPosition * pointAngle - pointAngle) + "," + centerX + "," + centerY + ")");
        points[currentPosition].style.fill = "#ffffff";
        points[currentPosition].setAttributeNS(null, "r", 1);
        currentPosition = currentPosition - 1 % valuesOfPositions.length;
        if (currentPosition < 0) currentPosition = valuesOfPositions.length - 1;
        that.$c.VALUE_W.setValue(parseFloat(valuesOfPositions[currentPosition]), true);
        points[currentPosition].style.fill = "#00ff00";
        points[currentPosition].setAttributeNS(null, "r", 2);
    }

    function createPoint(i) {
        var x = centerX + Math.sqrt(centerX / 1.6888 * centerX / 1.6888 + centerY / 1.6888 * centerY / 1.6888) * Math.cos((270 - pointAngle * i) * Math.PI / 180);
        var y = centerY - Math.sqrt(centerX / 1.6888 * centerX / 1.6888 + centerY / 1.6888 * centerY / 1.6888) * Math.sin((270 - pointAngle * i) * Math.PI / 180);

        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttributeNS(null, "cx", x);
        circle.setAttributeNS(null, "cy", y);
        circle.setAttributeNS(null, "r", 1);
        circle.setAttributeNS(null, "fill", "#ffffff");
        circle.setAttributeNS(null, "style", "stroke:none");
        switchArea.appendChild(circle);
        points[i] = circle;
    }

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.VALUE_R.on('change', function (itm) {
        if (valuesOfPositions.lastIndexOf(itm.getValue().toString()) >= 0) {
            currentAngle = -90 + pointAngle * valuesOfPositions.lastIndexOf(itm.getValue().toString());
            hand.setAttributeNS(null, "transform", "rotate(" + currentAngle + "," + centerX + "," + centerY + ")");
            currentPosition = valuesOfPositions.lastIndexOf(itm.getValue().toString());
            for (var i = 0; i < points.length; i++) {
                points[i].style.fill = "#ffffff";
                points[i].setAttributeNS(null, "r", 1);
            }
            points[currentPosition].style.fill = "#00ff00";
            points[currentPosition].setAttributeNS(null, "r", 2);
        } else {
            for (var i = 0; i < valuesOfPositions.length -1; i++) {
                if (itm.getValue() > parseFloat(valuesOfPositions[i]) && itm.getValue() < parseFloat(valuesOfPositions[i + 1])) {
                    currentAngle = -90 + pointAngle * i;
                    hand.setAttributeNS(null, "transform", "rotate(" + currentAngle + "," + centerX + "," + centerY + ")");
                    currentPosition = i;
                    for (var j = 0; j < points.length; j++) {
                        points[j].style.fill = "#ffffff";
                        points[j].setAttributeNS(null, "r", 1);
                    }
                    points[currentPosition].style.fill = "#00ff00";
                    points[currentPosition].setAttributeNS(null, "r", 2);
                }
            }
        }
        if (!init && initialPosition != null) {
            currentAngle = -90 + pointAngle * valuesOfPositions.lastIndexOf(initialPosition);
            hand.setAttributeNS(null, "transform", "rotate(" + currentAngle + "," + centerX + "," + centerY + ")");
            currentPosition = valuesOfPositions.lastIndexOf(initialPosition);
            points[currentPosition].style.fill = "#00ff00";
            points[currentPosition].setAttributeNS(null, "r", 2);
            that.$c.VALUE_W.setValue(parseFloat(valuesOfPositions[currentPosition]), true);
            init = true;
        }
    });

    function stringToArray(stringLine) {
        var splitChar = " ";
        var array = null;
        if (stringLine.indexOf(",") >= 0)
            splitChar = ",";
        else if (stringLine.indexOf(" ") >= 0)
            splitChar = " ";
        array = stringLine.split(splitChar);
        return array;
    }

    return that;
};

/**
 * SVG component represents Switch.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT}
 * @returns {REX.UI.SVG.Switch} New SVG Switch component
 */

REX.UI.SVG.SwitchOnOff = function (svgElem, args) {
    // Inherit from base component
    var that = Object.create(REX.UI.SVG.Component(svgElem, args));
    // Store options for simple usage
    var $o = that.options || {};

    // Get options or default values
    var initialPosition = parseInt($o.initialPosition) || null;
 
    // Get SVG elements for manipulation
    var switchArea = that.getChildByTag("switch_area"),
        hand = that.getChildByTag("hand"),
        numberOne = that.getChildByTag("number_one");

    //Global variables
    var centerX = switchArea.getBBox().width / 2,
        centerY = switchArea.getBBox().height / 2,
        currentPosition,
        init = false;

    switchArea.addEventListener("click", switchValue, false);

    function switchValue(event) {
        if (currentPosition == 0) {
            hand.setAttributeNS(null, "transform", "rotate(" + 90 + "," + centerX + "," + centerY + ")");
            that.$c.VALUE_W.setValue(true, true);
            numberOne.style.fill = "#00ff00";
            currentPosition = 1;
        } else {
            hand.setAttributeNS(null, "transform", "rotate(" + 0 + "," + centerX + "," + centerY + ")");
            that.$c.VALUE_W.setValue(false, true);
            numberOne.style.fill = "#ffffff";
            currentPosition = 0;
        }
    }

    // Add anonymous function as event listener. There are two events
    // 'read' - it is called every time when item is read
    // 'change' - called for the first time and every time item value is changed
    that.$c.VALUE_R.on('change', function (itm) {
        if (!itm.getValue()) {
            hand.setAttributeNS(null, "transform", "rotate(" + 0 + "," + centerX + "," + centerY + ")");
            numberOne.style.fill = "#ffffff";
            currentPosition = 0;
        } else {
            hand.setAttributeNS(null, "transform", "rotate(" + 90 + "," + centerX + "," + centerY + ")");
            numberOne.style.fill = "#00ff00";
            currentPosition = 1;
        }
       if (!init && initialPosition != null) {
            if (initialPosition == 0){ 
                that.$c.VALUE_W.setValue(false, true);
                currentPosition = 0;
            }
            else {
                that.$c.VALUE_W.setValue(true, true);
                hand.setAttributeNS(null, "transform", "rotate(" + 90 + "," + centerX + "," + centerY + ")");
                numberOne.style.fill = "#00ff00";
                currentPosition = 1;
            }
            init = true;
        }
    });

    return that;
};

/**
 * SVG component represents HTMLComponent.
 * @param {SVGElement} svgElem 
 * @param {Object} args It is possible to specify {type:"",svg:SVG_ELEMENT,defs:DEFS_ELEMENT} 
 * @returns {REX.UI.SVG.HTMLComponent} New HTML component
 */
REX.UI.SVG.Trend = function(svgElem,args) {
    // Inherit from base component
    var that = {};
    that=Object.create(REX.UI.SVG.Component(svgElem, args));
    var $o = that.options || {};
    
    var chartPanel = REX.UI.CHARTS.ChartPanel('ChartPanel', {drawToolbar:REX.HELPERS.parseBoolean($o.chart.drawDownToolbar),drawUpToolbar:REX.HELPERS.parseBoolean($o.chart.drawUpToolbar)});
    
    var eBB=that.element.getBBox();
    var axisPanelSetting = {
        type :  $o.chart.type.toLowerCase(),
        id : that.element.id,
        y :eBB.y,
        x :eBB.x,
        width : eBB.width,
        height : eBB.height,
        backColor : $o.chart.backgroundColor,
        backColorIntensity : 1-parseFloat($o.chart.backgroundOpacity),
        joinXAxis : ($o.chart.type.toLowerCase() === 'time'),
        margin: {l:.1,t:.1,b:.1,r:.1},
        x_axis: {name: $o.xAxis.name, orientation: 'horizontal', type: REX.HELPERS.parseBoolean($o.xAxis.axisRadial) ? 'radial' : 'linear' , drawtickline: false, drawlabel: true, sectick: 4, maintick: Math.floor(eBB.width/70), scale: REX.HELPERS.parseBoolean($o.xAxis.log10Scale) ? 'log' : 'dec', min: parseFloat($o.xAxis.min), max: parseFloat($o.xAxis.max), smart: true},
        y_axis: {name: $o.yAxis.name, orientation: 'vertical', type: REX.HELPERS.parseBoolean($o.yAxis.axisRadial) ? 'radial' : 'linear', drawtickline: false, drawlabel: true, sectick: 4, maintick: Math.floor(eBB.height/40), scale: REX.HELPERS.parseBoolean($o.yAxis.log10Scale) ? 'log' : 'dec', min: parseFloat($o.yAxis.min), max: parseFloat($o.yAxis.max), smart: true}
    };
    
    var axisPanel = REX.UI.CHARTS.AxesPanel('axisPanel-'+that.element.id,axisPanelSetting)
   
    for(var i=1;i<=parseInt($o.chart.numberOfSignals);i++){
        var signal = 'signal'+i;
        var penOptions={
            name:$o.signals[i].name,
            color:$o.signals[i].color,
            penwidth:parseFloat($o.signals[i].penWidth),
            buffercapacity:parseFloat($o.signals[i].bufferCapacity),
            deltaT:REX.WebVis.getRefreshRate()/1000
        };
        if($o.chart.type === 'Time'){
            pen = REX.UI.CHARTS.TrendPen(penOptions);
            axisPanel.addPen(pen);
            addTrendSignal(signal,pen);
        }
        else{
          pen = REX.UI.CHARTS.AxesPanelPen(penOptions);
          axisPanel.addPen(pen);
          addAxesPanelSignal(signal,pen);
        }
    }
    
    chartPanel.addAxesPanel(axisPanel);
    chartPanel.drawToolBar();
    chartPanel.drawUpToolBar();
    chartPanel.updateChartPanel();
    
    
    $(that.element).empty();
    that.element.appendChild(chartPanel.component);
    chartPanel.drawPensMarks();
    
    function addAxesPanelSignal(signal,pen){
        that.$c[signal+'_x'].on('read',function(){
           var x,y;
           x=that.$c[signal+'_x'].getValue();y=that.$c[signal+'_y'].getValue();
           pen.addPoint(x,y);
           chartPanel.updateChartPanel();
        });
        
    }
    
    function addTrendSignal(signal,pen){
        that.$c[signal].on('read',function(item){
            pen.addPoint(item.getValue());
            chartPanel.updateChartPanel();
        });
    }
    
    return that;
};


/* global cpdefine chilipeppr cprequire */
cprequire_test(["inline:com-chilipeppr-workspace-tinyg"], function(ws) {

    console.log("initting workspace");

    /**
     * The Root workspace (when you see the ChiliPeppr Header) auto Loads the Flash 
     * Widget so we can show the 3 second flash messages. However, in test mode we
     * like to see them as well, so just load it from the cprequire_test() method
     * so we have similar functionality when testing this workspace.
     */
    var loadFlashMsg = function() {
        chilipeppr.load("#com-chilipeppr-widget-flash-instance",
            "http://raw.githubusercontent.com/chilipeppr/element-flash/master/auto-generated-widget.html",
            function() {
                console.log("mycallback got called after loading flash msg module");
                cprequire(["inline:com-chilipeppr-elem-flashmsg"], function(fm) {
                    //console.log("inside require of " + fm.id);
                    fm.init();
                });
            }
        );
    };
    loadFlashMsg();

    // Init workspace
    ws.init();

    // Do some niceties for testing like margins on widget and title for browser
    $('title').html("Tinyg Workspace");
    $('body').css('padding', '10px');

} /*end_test*/ );

// This is the main definition of your widget. Give it a unique name.
cpdefine("inline:com-chilipeppr-workspace-tinyg", ["chilipeppr_ready"], function() {
    return {
        /**
         * The ID of the widget. You must define this and make it unique.
         */
        id: "com-chilipeppr-workspace-tinyg", // Make the id the same as the cpdefine id
        name: "Workspace / TinyG Tablet", // The descriptive name of your widget.
        desc: `This is a workspace for ChiliPeppr's Hardware Fiddle. It is geared towards CNC machines using TinyG.`,
        url: "(auto fill by runme.js)", // The final URL of the working widget as a single HTML file with CSS and Javascript inlined. You can let runme.js auto fill this if you are using Cloud9.
        fiddleurl: "(auto fill by runme.js)", // The edit URL. This can be auto-filled by runme.js in Cloud9 if you'd like, or just define it on your own to help people know where they can edit/fork your widget
        githuburl: "(auto fill by runme.js)", // The backing github repo
        testurl: "(auto fill by runme.js)", // The standalone working widget so can view it working by itself

        foreignSubscribe: {
            "/com-chilipeppr-elem-dragdrop/ondragover": "The Chilipeppr drag drop element will publish on channel /com-chilipeppr-elem-dragdrop/ondropped when a file is dropped so we subscribe to it so we can load a Gcode file when the user drags it onto the browser. It also adds a hover class to the bound DOM elem so we can add a CSS to hilite on hover",
            "/com-chilipeppr-elem-dragdrop/ondragleave": "We need to know when the drag is over to remove the CSS hilites.",
            "/com-chilipeppr-widget-gcode/resize": "We watch if the Gcode viewer resizes so that we can reposition or resize other elements in the workspace. Specifically we ask the Serial Port Console to resize. We also redraw the 3D Viewer so it fills the whole screen."
        },

        foreignPublish: {},

        /**
         * Contains reference to the Console widget object. Hang onto the reference
         * so we can resize it when the window resizes because we want it to manually
         * resize to fill the height of the browser so it looks clean.
         */
        widgetConsole: null,
        /**
         * Contains reference to the Serial Port JSON Server object.
         */
        widgetSpjs: null,
        /**
         * The workspace's init method. It loads the all the widgets contained in the workspace
         * and inits them.
         */
        init: function() {

            // Most workspaces will instantiate the Serial Port JSON Server widget
            this.loadSpjsWidget();
            
            // Most workspaces will instantiate the Serial Port Console widget
            // this.loadConsoleWidget();
            
            // This is a huge method that was built from the original jsfiddle workspace
            // we should technically put each widget in its own method for loading
            this.loadWidgets();

            // Create our workspace upper right corner triangle menu
            this.loadWorkspaceMenu();
            
            // Add our billboard to the menu (has name, url, picture of workspace)
            this.addBillboardToWorkspaceMenu();

            // Setup an event to react to window resize. This helps since
            // some of our widgets have a manual resize to cleanly fill
            // the height of the browser window. You could turn this off and
            // just set widget min-height in CSS instead
            this.setupResize();
            
            setTimeout(function() {
                $(window).trigger('resize');
            }, 3000);


        },
        /**
         * Returns the billboard HTML, CSS, and Javascript for this Workspace. The billboard
         * is used by the home page, the workspace picker, and the fork pulldown to show a
         * consistent name/image/description tag for the workspace throughout the ChiliPeppr ecosystem.
         */
        getBillboard: function() {
            var el = $('#' + this.id + '-billboard').clone();
            el.removeClass("hidden");
            el.find('.billboard-desc').text(this.desc);
            return el;
        },
        /**
         * Inject the billboard into the Workspace upper right corner pulldown which
         * follows the standard template for workspace pulldown menus.
         */
        addBillboardToWorkspaceMenu: function() {
            // get copy of billboard
            var billboardEl = this.getBillboard();
            $('#' + this.id + ' .com-chilipeppr-ws-billboard').append(billboardEl);
        },
        /**
         * Listen to window resize event.
         */
        setupResize: function() {
            $(window).on('resize', this.onResize.bind(this));
        },
        /**
         * When browser window resizes, forcibly resize the Console window
         */
        onResize: function() {
            if (this.widgetConsole) this.widgetConsole.resize();
        },
        /**
         * Load the Serial Port JSON Server widget via chilipeppr.load()
         */
        loadSpjsWidget: function(callback) {

            var that = this;

            chilipeppr.load(
                "#com-chilipeppr-widget-spjs-instance",
                "http://raw.githubusercontent.com/chilipeppr/widget-spjs/master/auto-generated-widget.html",
                function() {
                    console.log("mycallback got called after loading spjs module");
                    cprequire(["inline:com-chilipeppr-widget-serialport"], function(spjs) {
                        //console.log("inside require of " + fm.id);
                        spjs.setSingleSelectMode();
                        spjs.init({
                            isSingleSelectMode: true,
                            defaultBuffer: "tinyg",
                            defaultBaud: 115200,
                            bufferEncouragementMsg: 'For your device please choose the "tinyg" or "tinygg2" buffer in the pulldown and a 115200 baud rate before connecting.'
                        });
                        //spjs.showBody();
                        //spjs.consoleToggle();

                        that.widgetSpjs - spjs;

                        if (callback) callback(spjs);

                    });
                }
            );
        },
        /**
         * Load the Console widget via chilipeppr.load()
         */
        loadConsoleWidget: function(callback) {
            var that = this;
            chilipeppr.load(
                "#com-chilipeppr-widget-console-instance",
                "http://raw.githubusercontent.com/chilipeppr/widget-console/master/auto-generated-widget.html",
                function() {
                    // Callback after widget loaded into #com-chilipeppr-widget-spconsole-instance
                    cprequire(
                        ["inline:com-chilipeppr-widget-spconsole"], // the id you gave your widget
                        function(mywidget) {
                            // Callback that is passed reference to your newly loaded widget
                            console.log("My Console widget just got loaded.", mywidget);
                            that.widgetConsole = mywidget;

                            // init the serial port console
                            // 1st param tells the console to use "single port mode" which
                            // means it will only show data for the green selected serial port
                            // rather than for multiple serial ports
                            // 2nd param is a regexp filter where the console will filter out
                            // annoying messages you don't generally want to see back from your
                            // device, but that the user can toggle on/off with the funnel icon
                            that.widgetConsole.init(true, /^{/);
                            if (callback) callback(mywidget);
                        }
                    );
                }
            );
        },
        /**
         * Load the workspace menu and show the pubsubviewer and fork links using
         * our pubsubviewer widget that makes those links for us.
         */
        loadWorkspaceMenu: function(callback) {
            // Workspace Menu with Workspace Billboard
            var that = this;
            chilipeppr.load(
                "http://raw.githubusercontent.com/chilipeppr/widget-pubsubviewer/master/auto-generated-widget.html",
                function() {
                    require(['inline:com-chilipeppr-elem-pubsubviewer'], function(pubsubviewer) {

                        var el = $('#' + that.id + ' #com-chilipeppr-ws-menu .dropdown-menu-ws');
                        console.log("got callback for attachto menu for workspace. attaching to el:", el);

                        pubsubviewer.attachTo(
                            el,
                            that,
                            "Workspace"
                        );

                        if (callback) callback();
                    });
                }
            );
        },


        loadWidgets: function(callback) {
            
            // create a workspace object reference to this so inside the anonymous functions below
            // the workspace can be referred to
            var wsObj = this;


            // Zipwhip texting
            // com-chilipeppr-ws-zipwhip
            chilipeppr.load(
                "#com-chilipeppr-ws-zipwhip",
                "http://raw.githubusercontent.com/chilipeppr/widget-zipwhip/master/auto-generated-widget.html",
                function() {
                    require(["inline:com-chilipeppr-elem-zipwhip"], function(zipwhip) {
                        console.log("inside require for zipwhip. good.");
                        zipwhip.init();
                        // setup toggle button
                        var zwBtn = $('#com-chilipeppr-ws-menu .zipwhip-button');
                        var zwDiv = $('#com-chilipeppr-ws-zipwhip');
                        zwBtn.click(function() {
                            console.log("zwBtn got clicked");
                            if (zwDiv.hasClass("hidden")) {
                                // unhide
                                zwDiv.removeClass("hidden");
                                zwBtn.addClass("active");
                            }
                            else {
                                zwDiv.addClass("hidden");
                                zwBtn.removeClass("active");
                            }
                            $(window).trigger('resize');
                        });
                    });
                }); //End Zipwhip texting
            console.log("loaded zipwhip widget");

 

            // Macro
            // com-chilipeppr-ws-macro
            chilipeppr.load(
                "#com-chilipeppr-ws-macro",
                "http://raw.githubusercontent.com/chilipeppr/widget-macro/master/auto-generated-widget.html",
                function() {
                    //"http://fiddle.jshell.net/chilipeppr/ZJ5vV/show/light/", function () {
                    cprequire(["inline:com-chilipeppr-widget-macro"], function(macro) {
                        macro.init();
                        // setup toggle button
                        var alBtn = $('#com-chilipeppr-ws-menu .macro-button');
                        var alDiv = $('#com-chilipeppr-ws-macro');
                        alBtn.click(function() {
                            if (alDiv.hasClass("hidden")) {
                                // unhide
                                alDiv.removeClass("hidden");
                                alBtn.addClass("active");
                                //autolevel.onDisplay();
                            }
                            else {
                                alDiv.addClass("hidden");
                                alBtn.removeClass("active");
                                //autolevel.onUndisplay();
                            }
                            $(window).trigger('resize');

                        });
                    });
                }); //End Macro

            // JScut
            // com-chilipeppr-ws-jscut
            chilipeppr.load(
                "#com-chilipeppr-ws-jscut",
                "http://raw.githubusercontent.com/chilipeppr/widget-jscut/master/auto-generated-widget.html",
                function() {
                    require(["inline:org-jscut-gcode-widget"], function(jscut) {
                        jscut.init();
                        // setup toggle button
                        var alBtn = $('#com-chilipeppr-ws-menu .jscut-button');
                        var alDiv = $('#com-chilipeppr-ws-jscut');
                        alBtn.click(function() {
                            if (alDiv.hasClass("hidden")) {
                                // unhide
                                alDiv.removeClass("hidden");
                                alBtn.addClass("active");
                            }
                            else {
                                alDiv.addClass("hidden");
                                alBtn.removeClass("active");
                            }
                            $(window).trigger('resize');

                        });
                    });
                }); //End JSCut
                
 

            // SuttleXpress
            // Dynamically load the ShuttleXpress Widget. i.e. wait til user clicks on 
            // the button first time.
            // uses generic object so can cut/paste easier for others (or create actual object)
            // lordmundi/btyfqk7w
            this.shuttlexpressObj = function() {
                return {
                id: "shuttlexpress",
                //url: "http://fiddle.jshell.net/chilipeppr/27v59xLg/show/light/",
                url: "http://raw.githubusercontent.com/chilipeppr/widget-shuttlexpress/master/auto-generated-widget.html",
                requireName: "inline:com-chilipeppr-widget-shuttlexpress",
                btn: null,
                div: null,
                instance: null,
                init: function() {
                    this.btn = $('#com-chilipeppr-ws-menu .' + this.id + '-button');
                    this.div = $('#com-chilipeppr-ws-' + this.id + '');
                    this.setupBtn();
                    console.log('done instantiating ' + this.id + ' add-on widget');
                },
                setupBtn: function() {
                    this.btn.click(this.toggle.bind(this));
                },
                toggle: function() {
                    if (this.div.hasClass("hidden")) {
                        // unhide
                        this.show();
                    }
                    else {
                        this.hide();
                    }
                },
                show: function(callback) {
                    this.div.removeClass("hidden");
                    this.btn.addClass("active");

                    // see if instantiated already
                    // if so, just activate
                    if (this.instance != null) {
                        this.instance.activateWidget();
                        if (callback) callback();
                    }
                    else {
                        // otherwise, dynamic load
                        var that = this;
                        chilipeppr.load(
                            '#com-chilipeppr-ws-' + this.id + '',
                            this.url,
                            function() {
                                require([that.requireName], function(myinstance) {
                                    that.instance = myinstance;
                                    console.log(that.id + " instantiated. instance:", that.instance);
                                    that.instance.init();
                                    if (callback) callback();
                                });
                            }
                        );
                    }
                    $(window).trigger('resize');
                },
                hide: function() {
                    this.div.addClass("hidden");
                    this.btn.removeClass("active");
                    if (this.instance != null) {
                        this.instance.unactivateWidget();
                    }
                    $(window).trigger('resize');
                },
                }
            }();
            this.shuttlexpressObj.init();
            //End ShuttleXpress

            // Touch Plate
            // Dynamically load the Touch Plate widget, i.e. wait til user clicks on 
            // the button first time.
            this.touchPlateObj = function() {
                return {
                touchPlateBtn: null,
                touchPlateDiv: null,
                touchPlateInstance: null,
                init: function() {
                    this.touchPlateBtn = $('#com-chilipeppr-ws-menu .touchplate-button');
                    this.touchPlateDiv = $('#com-chilipeppr-ws-touchplate');
                    this.setupBtn();
                    console.log("done instantiating touchPlate add-on widget");
                },
                setupBtn: function() {
                    this.touchPlateBtn.click(this.toggletouchPlate.bind(this));
                },
                toggletouchPlate: function() {
                    if (this.touchPlateDiv.hasClass("hidden")) {
                        // unhide
                        this.showtouchPlate();
                    }
                    else {
                        this.hidetouchPlate();
                    }
                },
                showtouchPlate: function(callback) {
                    this.touchPlateDiv.removeClass("hidden");
                    this.touchPlateBtn.addClass("active");

                    // see if instantiated already
                    // if so, just activate
                    if (this.touchPlateInstance != null) {
                        this.touchPlateInstance.activateWidget();
                        if (callback) callback();
                    }
                    else {
                        // otherwise, dynamic load
                        var that = this;
                        chilipeppr.load(
                            "#com-chilipeppr-ws-touchplate",
                            "http://raw.githubusercontent.com/chilipeppr/widget-touchplate/master/auto-generated-widget.html",
                            function() {
                                require(["inline:com-chilipeppr-widget-touchplate"], function(touchPlate) {
                                    that.touchPlateInstance = touchPlate;
                                    console.log("touchPlate instantiated. touchPlateInstance:", that.touchPlateInstance);
                                    that.touchPlateInstance.init();
                                    //eagleInstance.activateWidget();
                                    if (callback) callback();
                                });
                            }
                        );
                    }
                    $(window).trigger('resize');
                },
                hidetouchPlate: function() {
                    this.touchPlateDiv.addClass("hidden");
                    this.touchPlateBtn.removeClass("active");
                    if (this.touchPlateInstance != null) {
                        this.touchPlateInstance.unactivateWidget();
                    }
                    $(window).trigger('resize');
                },
                }
            }();
            this.touchPlateObj.init();
            //End Touch Plate

            // Super Touch Plate
            // http://raw.githubusercontent.com/PyroAVR/widget-super-touchplate/master/auto-generated-widget.html
            // Dynamically load, i.e. wait til user clicks on the button first time.
            this.superTouchPlateObj = function() {
                return {
                superTouchPlateBtn: null,
                superTouchPlateDiv: null,
                superTouchPlateInstance: null,
                init: function() {
                    this.superTouchPlateBtn = $('#com-chilipeppr-ws-menu .superTouchplate-button');
                    this.superTouchPlateDiv = $('#com-chilipeppr-ws-superTouchplate');
                    this.setupBtn();
                    console.log("done instantiating superTouchPlate add-on widget");
                },
                setupBtn: function() {
                    this.superTouchPlateBtn.click(this.togglesuperTouchPlate.bind(this));
                },
                togglesuperTouchPlate: function() {
                    if (this.superTouchPlateDiv.hasClass("hidden")) {
                        // unhide
                        this.showsuperTouchPlate();
                    }
                    else {
                        this.hidesuperTouchPlate();
                    }
                },
                showsuperTouchPlate: function(callback) {
                    this.superTouchPlateDiv.removeClass("hidden");
                    this.superTouchPlateBtn.addClass("active");

                    // see if instantiated already
                    // if so, just activate
                    if (this.superTouchPlateInstance != null) {
                        this.superTouchPlateInstance.activateWidget();
                        if (callback) callback();
                    }
                    else {
                        // otherwise, dynamic load
                        var that = this;
                        chilipeppr.load(
                            "#com-chilipeppr-ws-superTouchplate",
                            "http://raw.githubusercontent.com/PyroAVR/widget-super-touchplate/master/auto-generated-widget.html",
                            // "http://raw.githubusercontent.com/PyroAVR/widget-super-touchplate/tabs/auto-generated-widget.html",
                            function() {
                                require(["inline:com-chilipeppr-widget-super-touchplate"], function(superTouchPlate) {
                                    that.superTouchPlateInstance = superTouchPlate;
                                    console.log("superTouchPlate instantiated. superTouchPlateInstance:", that.superTouchPlateInstance);
                                    that.superTouchPlateInstance.init();
                                    //eagleInstance.activateWidget();
                                    if (callback) callback();
                                });
                            }
                        );
                    }
                    $(window).trigger('resize');
                },
                hidesuperTouchPlate: function() {
                    this.superTouchPlateDiv.addClass("hidden");
                    this.superTouchPlateBtn.removeClass("active");
                    if (this.superTouchPlateInstance != null) {
                        this.superTouchPlateInstance.unactivateWidget();
                    }
                    $(window).trigger('resize');
                },
                }
            }();
            this.superTouchPlateObj.init();
            //End Super Touch Plate
            
            // Arduino / Atmel Firmware Programmer
            // FIDDLE http://jsfiddle.net/chilipeppr/qcduvhkh/11/
            chilipeppr.load(
                "com-chilipeppr-ws-programmer",
                "http://raw.githubusercontent.com/chilipeppr/widget-programmer/master/auto-generated-widget.html",
                require(["inline:com-chilipeppr-widget-programmer"], function (programmer) {
                    programmer.init();
                    // setup toggle button
                    var btn = $('#com-chilipeppr-ws-menu .programmer-button');
                    var div = $('#com-chilipeppr-ws-programmer');
                    btn.click(programmer.show.bind(programmer));
                })  
            );  //End Arduino / Atmel Firmware Programmer
    
            // Element / Drag Drop
            // Load the dragdrop element into workspace toolbar
            // http://jsfiddle.net/chilipeppr/Z9F6G/
            chilipeppr.load("#com-chilipeppr-ws-gcode-dragdrop",
                "http://raw.githubusercontent.com/chilipeppr/elem-dragdrop/master/auto-generated-widget.html",
                function() {
                    require(["inline:com-chilipeppr-elem-dragdrop"], function(dd) {
                        console.log("inside require of dragdrop");
                        $('.com-chilipeppr-elem-dragdrop').removeClass('well');
                        dd.init();
                        // The Chilipeppr drag drop element will publish
                        // on channel /com-chilipeppr-elem-dragdrop/ondropped
                        // when a file is dropped so subscribe to it
                        // It also adds a hover class to the bound DOM elem
                        // so you can add CSS to hilite on hover
                        dd.bind("#com-chilipeppr-ws-gcode-wrapper", null);
                        //$(".com-chilipeppr-elem-dragdrop").popover('show');
                        //dd.bind("#pnlWorkspace", null);
                        var ddoverlay = $('#com-chilipeppr-ws-gcode-dragdropoverlay');
                        chilipeppr.subscribe("/com-chilipeppr-elem-dragdrop/ondragover", function() {
                            //console.log("got dragdrop hover");
                            ddoverlay.removeClass("hidden");
                        });
                        chilipeppr.subscribe("/com-chilipeppr-elem-dragdrop/ondragleave", function() {
                            ddoverlay.addClass("hidden");
                            //console.log("got dragdrop leave");
                        });
                        console.log(dd);
                    });
                }
            ); //End Element / Drag Drop
            

            // Gcode List v3
            // OLD v2 http://jsfiddle.net/chilipeppr/F2Qn3/
            // NEW v3 with onQueue/onWrite/onComplete http://jsfiddle.net/chilipeppr/a4g5ds5n/
            chilipeppr.load("#com-chilipeppr-gcode-list",
                "http://raw.githubusercontent.com/chilipeppr/widget-gcodelist/master/auto-generated-widget.html",

                function() {
                    cprequire(
                        ["inline:com-chilipeppr-widget-gcode"],

                        function(gcodelist) {
                            gcodelist.init({
                                lineNumbersOnByDefault: true
                            });
                        }
                    );
                }
            ); //End Gcode List v3

            // Serial Port Console Log Window
            // http://jsfiddle.net/chilipeppr/JB2X7/
            // NEW VERSION http://jsfiddle.net/chilipeppr/rczajbx0/
            // The new version supports onQueue, onWrite, onComplete
            chilipeppr.load("#com-chilipeppr-serialport-log",
                "https://raw.githubusercontent.com/chilipeppr/widget-console/master/auto-generated-widget.html",

                function() {
                    cprequire(
                        ["inline:com-chilipeppr-widget-spconsole"],

                        function(spc) {
                            // pass in regular expression filter as 2nd parameter
                            // to enable filter button and clean up how much
                            // data is shown
                            spc.init(true, /^{/);

                            // resize this console on a browser resize
                            $(window).on('resize', function(evt) {
                                //console.log("serial-port-console. resize evt:", evt);
                                if ($.isWindow(evt.target)) {
                                    //console.log("resize was window. so resizing");
                                    spc.resize();
                                }
                                else {
                                    //console.log("resize was not window, so ignoring");
                                }
                            });
                            // resize this console if we get a publish
                            // from the gcode viewer widget
                            chilipeppr.subscribe("/com-chilipeppr-widget-gcode/resize", spc, spc.resize);

                        }
                    );
                }
            ); //End Serial Port Console Log Window


            // XYZ
            // http://jsfiddle.net/chilipeppr/gh45j/
            chilipeppr.load(
                "com-chilipeppr-xyz",
                // Lauer's new widget 8/16/15
                "http://raw.githubusercontent.com/chilipeppr/widget-axes/master/auto-generated-widget.html", 
                // Temporary widget from Danal
                //"http://fiddle.jshell.net/Danal/vktco1y6/show/light/", 
                // Lauer's original core widget
                //"http://fiddle.jshell.net/chilipeppr/gh45j/show/light/",
        
                function () {
                    cprequire(
                    ["inline:com-chilipeppr-widget-xyz"],
            
                    function (xyz) {
                        xyz.init();
                        xyz.toggleWcs();
                    });
                }
            ); //End XYZ
            
            // TinyG
            // http://jsfiddle.net/chilipeppr/XxEBZ/
            // com-chilipeppr-tinyg
            chilipeppr.load(
                "com-chilipeppr-tinyg",
                // Lauer's v2 (Jul 28th 2015) Fixed to {"sv":1}
                "http://raw.githubusercontent.com/chilipeppr/widget-tinyg/master/auto-generated-widget.html",
                // Danal's version
                //"http://fiddle.jshell.net/Danal/6rq2wx3o/show/light/",
                // Lauer's version
                //"http://fiddle.jshell.net/chilipeppr/XxEBZ/show/light/",
        
                function () {
                    cprequire(
                    ["inline:com-chilipeppr-widget-tinyg"],
            
                    function (tinyg) {
                        tinyg.init();
                    });
                }
            ); //End TinyG


        },
        //end loadWidgets

    }
});
//The main.js file is responsible to 
//1. Load all librarys.
//2. Read the configuration information.
//3. Start the engine.
if (typeof (TTT) == 'undefined')
{
    TTT = {};
    TTT.engine = {};
    TTT.Config = { PublisherId: null/*The current customer publisher id*/,
        TagType: null/*A unique name per publisher that identify the ads served*/,
        DivId: null/*The Div ID holding the location where the ad should be displayed.*/,
        EngineId: null/*The Engine ID*/,
        Width:0/*The HTML5 tag width*/,
        Height:0/*The HTML5 tag height*/
    };
    TTT.Config.GetConst = function(name) {
        var constMembers = { CONFIG_URL: 'pro.tictacti.com', COUNTER_URL: 'counter.tictacti.com', CLIENT_VER: '0.1' };
        return constMembers[name];
    };
    TTT.Config.Protocol = function () { return document.location.protocol };

    TTT.LoadScript = function loadScript(url, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        if (script.readyState) { //IE
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else { //Others
            script.onload = function() { callback(); };
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };
    TTT.Libraries = [{ URL: "https://t3cdn.tictacti.com/engine/js/jquery-1.7.1.js", IsLoaded: function () { return (typeof jQuery != 'undefined'); } },
                 { URL: "https://t3cdn.tictacti.com/engine/js/tttengine.js", IsLoaded: function () { return (typeof TTT.Engine != 'undefined'); } }
                ];
    TTT.LoadedLibraries = 0; //Count the number of loaded libraries
    TTT.IsLibrariesLoaded = function() { return TTT.LoadedLibraries == TTT.Libraries.length; };
    TTT.onLibraryLoaded = function() {
        TTT.LoadedLibraries += 1;
        if (TTT.IsLibrariesLoaded())
            TTT.InitConfigRequest();
    };
    TTT.InitRequestArray = []; //Hold list of init request.
    TTT.RunningEngines = [];
    //Main function.
    TTT.Init = function(config) {
        //Each engine in the page (we might have more then one) has its own config object.
        //Once all the JS files are loaded we will go over the InitRequestArray and start initializing the engine.
        TTT.InitRequestArray.push(config);
        //JS is single threaded so we can be sure that the following 2 lines will happen without onLibraryLoaded being called
        if (TTT.IsLibrariesLoaded())
            TTT.InitConfigRequest();
    };
    TTT.InitConfigRequest = function() {
        //Go over each of the config object and start the engine.
        while (TTT.InitRequestArray.length > 0) {
            var config = TTT.InitRequestArray.shift();
            var engine = new TTT.engine.Engine(config);
            engine.Start();
            TTT.RunningEngines.push(engine);
        }
    };
    //Load all externals librarys.
    for (i in TTT.Libraries)
    {
        var library = TTT.Libraries[i];
        if (!library.IsLoaded())
            TTT.LoadScript(library.URL, TTT.onLibraryLoaded);
    }
}
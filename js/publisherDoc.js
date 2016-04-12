TTT.engine.PubDocEvents = { ReadyToRun: "ReadyToRun" };
TTT.engine.PubDoc = Class.extend(
{
    pubDocJson: null,
    config:null,
    //Constructor.
    init: function (config)
    {
        this.config = config;
        TTT.Logs("PubDoc init");
    },

    //Functions
    //-----------
    //Load the publisher doc
    Load: function ()
    {
        $.getJSON(window.location.protocol + '//' + TTT.Config.GetConst('CONFIG_URL') + '/' + this.config.PublisherId + '/' +
         this.config.TagType + '.t3d?format=json&callback=?', (function (context) { return function (json) { context.OnPubDocRecieved(json); }; } (this)));
    },
    //Return the requested slot object. if slotId is null return the pre-roll slot if available.
    GetSlot: function (slotId)
    {
        try
        {
            return new TTT.engine.Slot(this.config,this.pubDocJson, slotId);
        } 
        catch (err) { return null; }
    },
    IsReadyToRun: function ()
    {
        return this.pubDocJson != null;
    },

    //Events
    //------

    //Called when the publisherDoc is received.
    OnPubDocRecieved: function (json)
    {
        TTT.Logs("OnPubDocRecieved");
        this.pubDocJson = json;
        IsReadyToRun = true;
        $(this).trigger(TTT.engine.PubDocEvents.ReadyToRun); //inform everyone else that the publisher doc is received
    }
});
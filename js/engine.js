TTT.engine.Engine = Class.extend(
{
    //Properties
    //----------
    processedSlotsArr: new Array(),
    self: this,
    lastDisplayTime: null,
    pubDoc: null,
    //Constructor that take only the config object.
    init: function (config)
    {
        TTT.Logs('Engine loaded');
        this.config = config;
        this.pubDoc = new TTT.engine.PubDoc(config);
        //$(this.pubDoc).on(TTT.engine.PubDocEvents.ReadyToRun, this.onPubDocReady);
        this.pubDoc.Load();
        lastDisplayTime = new Date();
    },

    //Functions
    //-----------

    //Star running the engine. 
    Start: function ()
    {
        TTT.Logs('Engine Started');
        if (!this.pubDoc.IsReadyToRun())
        {
            TTT.Logs('pubDoc is not ready');
            TTT.AddEventListener(this.pubDoc, TTT.engine.PubDocEvents.ReadyToRun, this, 'Start');
            return;
        }
        //check if pre-roll is defined if so display it if not wait untill someone will request to display a slot.
        var slotObj = this.pubDoc.GetSlot(null);
        if (slotObj == null)
            return; //we have no pre-roll.
        this.onNewSlotFound(slotObj);
    },
    //Load/Display the ads based on the timeline configuration.
    runTimeline: function (slotObj)
    {
        TTT.Logs('runTimeline for slot ' + slotObj.Name() + ' with status ' + slotObj.Status);
        switch (slotObj.Status)
        {
            case TTT.engine.AdStatusEnum.NONE:
                this.processedSlotsArr.push(slotObj);
            case TTT.engine.AdStatusEnum.CONTRACT_LOADED:
                var timeToDisplay = this.getAdTimeToDisplay(slotObj) - 50;
                if (timeToDisplay < 50)
                    this.displayAdNow(slotObj);
                else
                {
                    var timeToLoadInfo = slotObj.adsObj.GetAdTimeToLoadInfo(timeToDisplay);
                    if (timeToLoadInfo < 50)
                        requestAdsInfo(slotObj);
                    else
                        setTimeout(function () { self.reRunTimeline(); }, timeToLoadInfo);
                }
                break;
            case TTT.engine.AdStatusEnum.INFO: //The ad has loaded the ad information. it's time to load the ad itself.
                this.loadAd(slotObj);
                break;
            case TTT.engine.AdStatusEnum.READY:
                this.displayAd(slotObj);
                break;
            case TTT.engine.AdStatusEnum.INFO_FAILED:
            case TTT.engine.AdStatusEnum.CONTRACT_FAILED:
            case TTT.engine.AdStatusEnum.SWF_FAILED:
            case TTT.engine.AdStatusEnum.REJECTED:
                $(this).trigger(TTT.engine.EngineEventEnum.AD_FAILED); //inform everyone else that the publisher doc is received
                //clearAdSetEventListener(processedAdSet);
                break;
            case TTT.engine.AdStatusEnum.VISIBLE:
                //The current ad is displayed. Lets move and display the next ad.

                //TODO:
                //request the next ad node to display.
                //if null stop timeline.
                //otherwise run the timeline on the new ad node.
                break;
        }
    },
    reRunTimeline: function () { runTimeline(this.processedSlotsArr[this.processedSlotsArr.length - 1]); },
    //Close all currently running ads.
    //force - indicate if the ads should be closed event if they are marked as ExitOnEnd = 0,2
    closeRunningAds: function (force)
    {
        $.each(this.processedSlotsArr, function (index, slotObj)
        {
            if (slotObj.ExitOnEnd() == 1 || force)
                slotObj.CloseAd();
        });
    },
    //Display the slot.
    //slotObj - holding all the slot and it's ads information.
    displayAdNow: function (slotObj)
    {
        //TODO:
        //check if we have any constrainst that privent us from displaying this ad :
        //1. MinIntervalInSession
        //2. Max amount of ads in the current session
        //3. Check if multiple ads are allowed to be displayed.
        //4. Ad can be displayed even if timepass

        //register to an event to call the timelineFunc again once the ad is displayed.


        this.processedSlotsArr.push(slotObj);
        slotObj.DisplayAdNow(slotObj.NextTagSetNode());
    },
    //Calculate the time left before the passed slot should be displayed.
    getAdTimeToDisplay: function (slotObj)
    {
        //Only calculate BeginBegin/EndBegin functionality.
        var intervalTime = slotObj.NextAdInterval();
        return lastDisplayTime.getTime() + (intervalTime * 1000) - (new Date().getTime());
    },


    //Events
    //------
    //    onPubDocReady: function ()
    //    {
    //        TTT.Logs('pubDoc ready');
    //        $(this.pubDoc).off(TTT.engine.PubDocEvents.ReadyToRun);
    //    },
    //Called when a new slot is found by :API, Image recognition or any other way.
    onNewSlotFound: function (slotObj)
    {
        TTT.Logs('New Slot was found. ' + slotObj.Name());
        //if we are currently displaying a slot we should stop it (based on configuration)
        this.closeRunningAds(); //Close all currently running ads.

        if (slotObj != null)
            this.runTimeline(slotObj);

        //if we will support next slot functionality then we should load the next slot addon here.
    }
});

TTT.engine.slot = {};
TTT.engine.slot.TimelineTypeEnum = { BEGIN_BEGIN: 0, ENG_BEGIN: 1, FIXED_QUEUE_POINTS: 2, HIDDEN_QUEUE_POINTS: 3, VISIBLE_QUEUE_POINTS: 4 };
TTT.engine.Slot = Class.extend(
{
    slotPubDoc: null, //hold the json information of the slot node.
    adsPubDoc: null, //hold the json information of the ads node.
    displayedAd: 0,
    Status: TTT.engine.AdStatusEnum.NONE,
    config: null,
    selectedTagsetNode: null, //Pointer to the XML node holding the information to the currently active AdSet object.
    //Constructor.
    //pubDocJson - the publisher doc in json format.
    //slotId - the slot id.
    init: function (config, pubDocJson, slotId)
    {
        this.config = config;
        var slotArr = pubDocJson.ttt.slots.slot;
        var slotNode = null;
        if (slotId == null)
            slotNode = TTT.FindObjectInArr(slotArr, "@gameStatus", "downloading");
        else
            slotNode = TTT.FindObjectInArr(slotArr, "@id", slotId);
        if (slotNode == null)
        {
            TTT.Logs('Requested slot was not found, abort');
            throw TTT.engine.AdStatusEnum.REJECTED;
        }
        this.slotPubDoc = slotNode;
        TTT.Logs('Slot ' + this.Name() + ' Initialized');
        this.adsPubDoc = TTT.FindObjectInArr(pubDocJson.ttt.ads, "@id", slotNode["@adsId"]);
        //async load all contracts that are used by this slot.
        this.loadContracts();
    },

    //Public functions
    //----------------
    //Indicate if the ad should be closed once the slot exit.
    //0- don't exit , 1 - exit (default), 2 - finish ads cycle
    ExitOnEnd: function ()
    {
        return TTT.ParseNumber(slotPubDoc.exitOnEnd, 1);
    },
    Name: function ()
    {
        var name = this.slotPubDoc['@name'];
        if (TTT.IsNullOrEmpty(name))
            name = this.slotPubDoc['@id'];
        return name;
    },
    //Display the ad immediately.
    //tagsetObj - the tagset holding the ad nodes.
    DisplayAdNow: function (tagsetObj)
    {//TODO: add support for mulitple ads per tagset.
        TTT.Logs('Displaying slot ' + this.slotPubDoc['@id'] + ' ad now. current status ' + this.Status);
        var adObj = tagsetObj.ad;
        if (tagsetObj.type != undefined)//Check if the function was called due to an event.  
        {
            switch (tagsetObj.type)
            {//we don't assign this.Status = tagsetObj.type because in some cases it might not be true (in the future)
                case TTT.engine.AdStatusEnum.CONTRACT_LOADED:
                    this.Status = TTT.engine.AdStatusEnum.CONTRACT_LOADED;
                    break;
                case TTT.engine.AdStatusEnum.READY:
                    this.Status = TTT.engine.AdStatusEnum.READY;
                    break;
            }
            tagsetObj = this.currentProcessedTagSet;
            adObj = tagsetObj.ad;
        }
        else
        {
            this.currentProcessedTagSet = tagsetObj; //Hold the current tag set we should display.
            this.showBackground(adObj); //show Background
        }
        //if contract is not loaded wait for it.
        var contractName = tagsetObj.ad['@contract'];
        if (!this.IsContractLoaded(contractName))
        {
            TTT.Logs('Contract ' + contractName + ' is not loaded yet ---------ERROR---not implemented yet--------- ');
            //TODO: suport dynamic loaded contracts
            //$(this).on(TTT.engine.AdStatusEnum.CONTRACT_LOADED, this.DisplayAdNow,tagsetObj);
            return;
        }

        if (this.Status == TTT.engine.AdStatusEnum.CONTRACT_LOADED)
        {
            adObj.ContractObj = new TTT.engine.Slot.LoadedContracts[contractName](this.config, adObj); //create the contract.
            this.Status = TTT.engine.AdStatusEnum.INFO;
            if (!this.loadContractInfo(adObj))
            {//the contract information is not loaded it. we should wait untill it loaded.
                //TODO: suport async loaded contract info
                //$(this).on(TTT.engine.AdStatusEnum.INFO_LOADED, this.DisplayAdNow,tagsetObj);
                return;
            }
        }

        if (this.Status == TTT.engine.AdStatusEnum.INFO_LOADED && !this.loadContractAd(adObj))
        {//The ad is not ready for display at this time. we should wait untill its loaded.
            TTT.AddEventListener(adObj.ContractObj, TTT.engine.AdStatusEnum.READY, this, 'DisplayAdNow');
            return;
        }

        if (this.Status == TTT.engine.AdStatusEnum.READY)
        {
            this.showContractAd(adObj);
            TTT.AddEventListener(adObj.ContractObj, TTT.engine.AdStatusEnum.VISIBLE, this, 'onAdDisplayed');
        }
    },
    TimelineType: function ()
    {
        if (this.adsPubDoc == null) return null;
        switch (this.adsPubDoc['@type'].toLowerCase())
        {
            case 'visiblepoints':
                return TTT.engine.slot.TimelineTypeEnum.VISIBLE_QUEUE_POINTS;
            case 'queuepoints':
                return TTT.engine.slot.TimelineTypeEnum.HIDDEN_QUEUE_POINTS;
            case 'fixedqueuepoints':
                return TTT.engine.slot.TimelineTypeEnum.FIXED_QUEUE_POINTS;
            case 'endbegin':
                return TTT.engine.slot.TimelineTypeEnum.ENG_BEGIN;
            default:
                return TTT.engine.slot.TimelineTypeEnum.BEGIN_BEGIN;
        }
    },
    //Time from start until the first display(only used when ads type is beginbegin or endbegin). 
    FirstAdTimeline: function ()
    {
        if (this.adsPubDoc == null) return null;
        var timelineType = this.TimelineType();
        if (timelineType != TTT.engine.slot.TimelineTypeEnum.ENG_BEGIN && timelineType != TTT.engine.slot.TimelineTypeEnum.BEGIN_BEGIN)
            throw 'The function is implemented only for begin_begin and end_begin';
        var firstDisplayAttrib = this.adsPubDoc['@firstDisplay'];
        return TTT.ParseNumber(firstDisplayAttrib, this.GetDisplaySequenceArr()[0]);
    },
    GetDisplaySequenceArr: function ()
    {
        if (this.adsPubDoc == null) return null;
        return this.adsPubDoc['@displaysequence'].split(',');
    },
    //Calculate the interval between the current displayed ad and the next ad.
    //if no ad is displayed return the interval for the first ad.
    //NOTE: only work for BeginBegin and EndBegin
    NextAdInterval: function ()
    {
        var timelineType = this.TimelineType();
        if (timelineType != TTT.engine.slot.TimelineTypeEnum.ENG_BEGIN && timelineType != TTT.engine.slot.TimelineTypeEnum.BEGIN_BEGIN)
            throw 'The function is implemented only for begin_begin and end_begin';
        if (this.displayedAd == 0)
            return this.FirstAdTimeline();
        else
        {
            var displayArr = this.GetDisplaySequenceArr();
            var idx = (this.displayedAd - 1) % displayArr.length; //create a circle to the first ad time if needed.
            return displayArr[idx];
        }
    },
    // Return to the next tagset node sibling, and advance the selectedTagsetNode pointer.
    NextTagSetNode: function ()
    {
        var nextIdx = 0; //if no node was set to be the selected node we return the first node.
        var tagsetArr = this.adsPubDoc.tagset;
        if (this.selectedTagsetNode != null && tagsetArr.length != undefined)
        {//get the next sibiling
            var idx = this.selectedTagsetNode.idx;
            nextIdx = (idx + 1) % tagsetArr.length;
        }
        if (tagsetArr.length == undefined)
            this.selectedTagsetNode = tagsetArr;
        else
        {
            this.selectedTagsetNode = tagsetArr[nextIdx];
            this.selectedTagsetNode.idx = nextIdx; //hold the child index in the tagset list (used to reach the next sibiling quicklly)
        }
        return this.selectedTagsetNode;
    },


    //Private functions
    //-----------------
    //Load all contracts that are used by this slot and where not loaded before.
    loadContracts: function ()
    {
        //go over each of the contracts in the adsPubDoc and load them asynchronously.
        //TODO: support multiple tagset/ad nodes. at the moment the code take into assumption that only one tagset and one ad node are under each ads node.
        var contractName = this.adsPubDoc.tagset.ad['@contract'];
        if (this.IsContractLoaded(contractName)) //The contract was loaded.
        {
            this.Status = TTT.engine.AdStatusEnum.CONTRACT_LOADED;
            return;
        }
        //TODO: load missing contract js file dynamiclly.
    },
    //Check if the requested contract is loaded or not.
    IsContractLoaded: function (contractName)
    {
        return TTT.engine.Slot.LoadedContracts[contractName] != null;
    },
    //Show the ad background.
    showBackground: function (adObj)
    {
        var backgroundUrl = adObj['@background'];
        if (TTT.IsNullOrEmpty(backgroundUrl))
            return;
        //TODO: read the background color from the url
        var c1 = '12128E', c2 = '000033';
        //display the background
        var tag = $('#' + this.config.DivId);
        tag.width(this.config.Width);
        tag.height(this.config.Height);
        tag.css('background-color', '#' + c2); //fallback color
        //create a gradient
        tag.css('background', '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#' + c1 + '), to(#' + c2 + '))'); //Safari 4-5, Chrome 1-9
        tag.css('background', '-webkit-linear-gradient(top, #' + c1 + ', #' + c2 + ')'); //Safari 5.1, Chrome 10+ 
        tag.css('background', '-moz-linear-gradient(top, #' + c1 + ', #' + c2 + ')'); //Firefox 3.6+ 
        tag.css('filter', 'progid:DXImageTransform.Microsoft.gradient(startColorstr=#' + c1 + ', endColorstr=#' + c2 + ')'); //IE 6-9
        tag.css('background', '-ms-linear-gradient(top, #' + c1 + ', #' + c2 + ')'); //IE 10
        tag.css('background', '-o-linear-gradient(top, #' + c1 + ', #' + c2 + ');'); //Opera 11.10+
    },
    //Load the contract info.
    //Return true if the information was loaded. if we need to wait for async data return false.
    loadContractInfo: function (adObj)
    {
        var result = adObj.ContractObj.LoadInfo();
        if (result)
            this.Status = TTT.engine.AdStatusEnum.INFO_LOADED;
        return result;
    },
    loadContractAd: function (adObj)
    {
        var result = adObj.ContractObj.LoadAd();
        if (result)
            this.Status = TTT.engine.AdStatusEnum.READY;
        return result;
    },
    showContractAd: function (adObj)
    {
        return adObj.ContractObj.ShowAd();
    },
    onAdDisplayed: function ()
    {
        this.displayedAd++;
    }

});
TTT.engine.Slot.LoadedContracts = {}; //list of loaded contracts and a pointer to them.

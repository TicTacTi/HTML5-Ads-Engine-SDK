TTT.engine.Slot.LoadedContracts["DmContract"] = TTT.engine.Contract.extend(
{
    iframeObj: null,
    //Constructor.
    init: function (config, adObj) {
        this._super(config, adObj);
        TTT.Logs('DmContract Initialized');
    },
    LoadInfo: function () {
        this._super();
        //The ad url is available in the adObj.
        this.Status = TTT.engine.AdStatusEnum.INFO_LOADED;
        //We have all the information we need. so we don't need to lod the ad information.
        return true;
    },
    LoadAd: function () {
        this._super();
        //create div node and in it place the iframe

        this.iframeObj = document.createElement('iframe');
        this.iframeObj.id = 'tttAdIFrame_' + (Math.floor(Math.random() * 100) + 1);
        this.iframeObj.src = this.adObj['@url'].replace(/%26/g, '&');
        this.iframeObj.frameBorder = 0;
        this.iframeObj.scrolling = 'no';
        this.iframeObj.marginHeight = 0;
        this.iframeObj.marginWidth = 0;
        this.iframeObj.style.width = this.adObj.banner['@width'] + 'px';
        this.iframeObj.style.height = this.adObj.banner['@height'] + 'px';
        //this.iframeObj.onload = function (context) { return function () { context.FireAdLoadedEvent(); }; } (this);
        this.iframeObj.onerror = function (context) { return function () { context.FireAdFailedEvent(); }; } (this);
        $(this.containerDiv).append(this.iframeObj);
        return true; //we don't wait for the onload event to inform that the ad is loaded.
    }
    //    ShowAd: function ()
    //    {
    //        this._super();

    //    }
});
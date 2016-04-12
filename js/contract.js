TTT.engine.Contract = Class.extend(
{
    config: null,
    adObj: null,
    Status: TTT.engine.AdStatusEnum.NONE,
    containerDiv: null, //Div object that hold the ad.
    MotionObj: null,
    //Constructor.
    init: function (config, adObj)
    {
        this.config = config;
        this.adObj = adObj;
        this.Status = TTT.engine.AdStatusEnum.CONTRACT_LOADED;
    },
    //Load the current ad information.
    LoadInfo: function ()
    {
        this.Status = TTT.engine.AdStatusEnum.INFO;
        TTT.Logs('Contract loading ad information');
        return true;
    },
    //Load the current ad to the browser.
    LoadAd: function ()
    {
        this.Status = TTT.engine.AdStatusEnum.LOADING_AD;
        TTT.Logs('Contract loading ad');
        this.containerDiv = document.createElement('div');
        this.containerDiv.id = 'tttAdContainer_' + (Math.floor(Math.random() * 100) + 1);
        this.containerDiv.style.position = 'absolute';
        this.containerDiv.style.backgroundColor = '#FFFFFF';
        this.containerDiv.style.border = '0px';
        this.containerDiv.style.overflow = 'hidden';
        this.containerDiv.style.display = 'none';
        $('#' + this.config.DivId).append(this.containerDiv);        
        return true;
    },
    //Show the current ad
    ShowAd:function()
    {
        this.Status = TTT.engine.AdStatusEnum.DISPLAYING;
        TTT.Logs('Contract showing the ad');
        this.MotionObj = new TTT.engine.Motion(this.config,this.adObj.tween,this.adObj.banner, this.containerDiv);
        TTT.AddEventListener(this.MotionObj, TTT.engine.MotionStatusEnum.LOAD_POSITION, this, 'onAdVisible');
        TTT.AddEventListener(this.MotionObj, TTT.engine.MotionStatusEnum.UNLOAD_POSITION, this, 'onAdExit');
        this.MotionObj.StartTween();
    },
    //Close the current ad
    CloseAd:function ()
    {
        TTT.Logs('Contract is closing the ad ');
        if (this.Status != TTT.engine.AdStatusEnum.DISPLAYING && this.Status != TTT.engine.AdStatusEnum.VISIBLE)
            return; //we don't need to close the ad. it's not is display mode.
        this.Status = TTT.engine.AdStatusEnum.CLOSING;
        this.MotionObj.ExitTween();
    },
    FireAdLoadedEvent: function ()
    {
        this.Status = TTT.engine.AdStatusEnum.READY;
        $(this).trigger(TTT.engine.AdStatusEnum.READY);        
    },
    FireAdFailedEvent: function ()
    {debugger;
        this.Status = TTT.engine.AdStatusEnum.AD_FAILED;
        $(this).trigger(TTT.engine.AdStatusEnum.AD_FAILED);
    },
    onAdVisible: function ()
    {
        TTT.Logs('Ad Visible');
        this.Status = TTT.engine.AdStatusEnum.VISIBLE;
        $(this).trigger(TTT.engine.AdStatusEnum.VISIBLE);
        TTT.SetTimeout(this,'CloseAd',this.adObj['@lifespan']*1000);
    },
    onAdExit: function ()
    {
        TTT.Logs('Ad exit');
        this.Status = TTT.engine.AdStatusEnum.CLOSED;
        $(this).trigger(TTT.engine.AdStatusEnum.CLOSED);
    },
});
TTT.engine.Motion = Class.extend(
{
    config: null,
    containerjQueryObj: null,
    tweenNode: null,
    bannerNode: null,
    Status: TTT.engine.MotionStatusEnum.NONE,
    prevDivPositionType: null, //hold the value of the main div position type before we change it.
    //Constructor.
    init: function (config, tweenNode, bannerNode, containerDiv)
    {
        this.config = config;
        this.tweenNode = tweenNode;
        this.bannerNode = bannerNode;
        this.containerjQueryObj = $(containerDiv);
        this.calculatePositions();
        this.prePositionAd();
    },
    StartTween: function ()
    {
        this.Status = TTT.engine.MotionStatusEnum.MOVING_TO_LOAD;
        var loadNode = this.tweenNode.load;
        var mainDivjQueryObj = $('#' + this.config.DivId);
        this.prevDivPositionType = mainDivjQueryObj.css('position');
        mainDivjQueryObj.css('overflow', 'auto');
        mainDivjQueryObj.css('position', 'absolute');
        this.containerjQueryObj.show();
        this.containerjQueryObj.animate({ left: loadNode.left + 'px', top: loadNode.top + 'px' }, loadNode.time * 1000,
            (function (context) { return function () { context.onVisible(); }; } (this)));
    },
    ExitTween: function ()
    {
        this.Status = TTT.engine.MotionStatusEnum.MOVING_TO_UNLOAD;
        var unloadNode = this.tweenNode.unload;
        this.containerjQueryObj.animate({ left: unloadNode.left + 'px', top: unloadNode.top + 'px' }, unloadNode.time * 1000,
            (function (context) { return function () { context.onUnVisible(); }; } (this)));
    },
    //Move the contrainct to the preposition location.
    prePositionAd: function ()
    {
        var preposNode = this.tweenNode.prepos;
        this.containerjQueryObj.offset({ top: preposNode.top, left: preposNode.left });
        this.Status = TTT.engine.MotionStatusEnum.PRE_POSITION;
    },
    calculatePositions: function ()
    {
        //TODO: calculate the position also for none TL.
        var divPos = this.containerjQueryObj.offset();
        var preposNode = this.tweenNode.prepos;
        var divJQueryObj = $('#' + this.config.DivId);
        preposNode.left = this.convertPrecentageToPix(preposNode['@x'], divJQueryObj.width(), 0) + divPos.left;
        preposNode.top = this.convertPrecentageToPix(preposNode['@y'], divJQueryObj.height(), -divJQueryObj.height()) + divPos.top;
        this.setRegistrationPoint(preposNode, this.tweenNode['@registrationPoint']);
        var loadNode = this.tweenNode.load;
        loadNode.left = this.convertPrecentageToPix(loadNode['@x'], divJQueryObj.width(), 0) + divPos.left;
        loadNode.top = this.convertPrecentageToPix(loadNode['@y'], divJQueryObj.height(), 0) + divPos.top;
        loadNode.time = TTT.ParseNumber(loadNode['@time'], 1);
        this.setRegistrationPoint(loadNode, this.tweenNode['@registrationPoint']);
        var unloadNode = this.tweenNode.unload;
        unloadNode.left = this.convertPrecentageToPix(unloadNode['@x'], divJQueryObj.width(), 0) + divPos.left;
        unloadNode.top = this.convertPrecentageToPix(unloadNode['@y'], divJQueryObj.height(), -divJQueryObj.height()) + divPos.top;
        unloadNode.time = TTT.ParseNumber(unloadNode['@time'], 1);
        this.setRegistrationPoint(unloadNode, this.tweenNode['@registrationPoint']);
    },
    //Convert a presentage value to a pix value
    //percentage: the number that indicate a percentage from the baseValue.
    //baseValue: the 100% value.
    //defaultValue: if percentage is empty return the default value. 
    convertPrecentageToPix: function (percentage, baseValue, defaultValue)
    {
        return TTT.ParseNumber(baseValue * percentage / 100, defaultValue);
    },
    onVisible: function ()
    {
        this.Status = TTT.engine.MotionStatusEnum.LOAD_POSITION;
        $(this).trigger(TTT.engine.MotionStatusEnum.LOAD_POSITION);
    },
    onUnVisible: function ()
    {
        this.Status = TTT.engine.MotionStatusEnum.UNLOAD_POSITION;
        $('#' + this.config.DivId).css('position', this.prevDivPositionType);
        $(this).trigger(TTT.engine.MotionStatusEnum.UNLOAD_POSITION);
    },
    //Change the location of the position based on the registration point
    setRegistrationPoint: function (position, registrationPoint)
    {
        switch (registrationPoint)
        {
            case "TM":
                position.left -= this.containerjQueryObj.width() / 2;
                break;
            case "TR":
                position.left -= this.containerjQueryObj.width();
                break;
            case "ML":
                position.top -= this.containerjQueryObj.height() / 2;
                break;
            case "M":
                position.top -= this.containerjQueryObj.height() / 2;
                position.left -= this.containerjQueryObj.width() / 2;
                break;
            case "MR":
                position.top -= this.containerjQueryObj.height() / 2;
                position.left -= this.containerjQueryObj.width();
                break;
            case "BL":
                position.top -= this.containerjQueryObj.height();
                break;
            case "BM":
                position.top -= this.containerjQueryObj.height();
                position.left -= this.containerjQueryObj.width() / 2;
                break;
            case "BR":
                position.top -= this.containerjQueryObj.height();
                position.left -= this.containerjQueryObj.width();
                break;
        }
    }
});
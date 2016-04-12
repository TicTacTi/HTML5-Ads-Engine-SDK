TTT.Logs = function (message) { window.postMessage(message, "*"); };
//Find an object in the array that one of is members equal to a recevied value.
TTT.FindObjectInArr = function (objectsArr, member, value)
{
    if (typeof objectsArr.length == 'undefined' && objectsArr[member] == value) //if objectsArr is not any array but a single object.
        return objectsArr; 
    for (var i = 0; i < objectsArr.length; i++)
    {
        if (objectsArr[i][member] == value)
        {
            return objectsArr[i];
        }
    }
    return null;
};
//Parse the string to a number. if not a number return the default value.
TTT.ParseNumber = function (numStr, defaultValue)
{
    var num = parseFloat(numStr);
    if (isNaN(num))
        num = defaultValue;
    return num;
};
TTT.AddEventListener = function (trigerringObj, eventName, returnObj , returnFuncName)
{
    $(trigerringObj).on(eventName, (function (context) { return function (params) { context[returnFuncName](params); }; } (returnObj)));
};
//an extention to the window.setTimeout by not just running a stateless function but to a requested function in a object.
TTT.SetTimeout = function (returnObj, returnFuncName, delay)
{
    window.setTimeout( (function (context) { return function () { context[returnFuncName](); }; } (returnObj)),delay);
};
TTT.IsNullOrEmpty = function (str)
{
    return (str == null || str == undefined || str == '');
};
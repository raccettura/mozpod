var gTimerID;
var gTime;
function countDown()
{
    gTime = getCharPref("finishAlertTime", 15);
    var gTimerID = setInterval("updateTimer()", 1000);
}

function updateTimer()
{
    document.getElementById('counter').value = gTime;

    // when were done with it... we kill it!
    if(gTime == 0){
        gTimerID = null;
        window.close();
    }
    gTime--;
}
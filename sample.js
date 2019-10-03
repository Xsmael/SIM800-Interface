
var modemArray = require("sim800-interface");


modemArray.sendUSSD("*101#",3);
modemArray.sendSMS("scscsc",2);

modemArray.open({

});
modemArray.events.on("ready", function () {

    setInterval(() => {
        modemArray.scanSIM();
    }, 5000);

    modemArray.sendUSSD("*124*1234*200*");
});

modemArray.events.on("siminfo", function (siminfo) {
    console.log("siminfo");
    console.log(siminfo);
});

modemArray.events.on("SMSUpdate", function (data) {
    console.log(SMSUpdate);
    console.log(data);
});

modemArray.events.on("SMSReceived", function (sms) {
    console.log("SMSReceived");
    console.log(sms);
});

modemArray.events.on("USSDResponse", function (data) {
    console.log("USSDResponse");
    console.log(data);
});

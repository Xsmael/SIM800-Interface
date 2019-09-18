var log = require("noogger");
let serialportgsm = require('serialport-gsm');
let modem = serialportgsm.Modem();
const ussd = require('serialport-gsm/lib/functions/ussd');
ussd(modem);

let serialport = serialportgsm.serialport;
let options = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: ''
};

modem.open('COM16', options);

modem.on('open', data => {
    log.notice("Opened!");
    modem.initializeModem(function (initResult) {
        if (initResult.status != 'success') {
            log.error(initResult);
        } else {
            log.notice("Initialised!");
            modem.sendUSSD('*9999#').then(
                (success) => {
                    console.log(success)
                },
                (fail) => {
                    console.log(fail)
                }
            );
        }
    });

});
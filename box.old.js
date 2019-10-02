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

modem.open('COM15', options);

modem.on('open', data => {
    modem.initializeModem(function (initResult) {
        if (initResult.status != 'success') {
            console.log(initResult);
        } else {           
            // modem.sendUSSD('*101#').then(
            //     (success) => {
            //         console.log(success)
            //     },
            //     (fail) => {
            //         console.log(fail)
            //     }
            // );
            sendUSSD("*444#","COM15");
            sendUSSD("*160#","COM15");
            
            modem.on('onNewMessage', function (data) {

                log.warning("NEW MESSAGE");
                log.debug(data); 
                {
                    id: "NA",
                    port: data.GsmSpan,
                    sender: data.sender,
                    time: data.dateTimeSent,
                    index: data.index,
                    total: data.Total,
                    content: data.message
                    smsc: data.smsc
                }
            });
            
            modem.on('onMemoryFull', (result) => { 
                log.warning("MEM FULLL");
                log.debug(result); 
            });
            
            // modem.getSimInbox((result) => { 
            //     log.warning("SIM INBOX");
            //     log.debug(result); 
            // });
            
            
            modem.on('onSendingMessage', result => { 
                log.warning("SENDING MSG");
                log.debug(result); 
            });
            
            
            modem.sendSMS('+22652004896', 'Hello there Zab!', false, null, function(data) {
                log.debug(data); 
            
            });
        }
    });

});

function sendUSSD(USSD,port) {
    log.warning("sending USSD");
    // let modem= getModem(port);
    
    let commandParser = modem.executeCommand('AT+CUSD=1,"'+USSD+'"', (result, err) => {
        if (err) {
            console.log(`Error`, err);
        } else {
            console.log(result);
            if(result.status == 'success') {
                log.warning(commandParser.result);                        
            }
            else log.error(commandParser.result);
        }
    });
    
    commandParser.result = {};
    commandParser.logic = dataLine => {
        log.critical(dataLine);
        if (dataLine) {
            if (dataLine.startsWith("AT+CUSD=1")) {
                commandParser.result.command = dataLine.trim();
            } else if (dataLine.startsWith("+CUSD: 0,") ) {
                let startIdx= dataLine.indexOf('"')+1;
                let length= dataLine.indexOf('"', dataLine.length-5) - startIdx;
                log.notice("startIdx= "+startIdx +" length= "+ length);
                commandParser.result.content =      dataLine.substr(startIdx, length);
                commandParser.result.response = dataLine.trim();
            }
            
            if( dataLine.endsWith('+CUSD: 0, "MSISDN:') ) {
                commandParser.result.content = "--MSISDN:"
                commandParser.result.response = '+CUSD: 0, "MSISDN:';            
            }
            if( dataLine.endsWith('", 15') &&  commandParser.result.content ==  "--MSISDN:") {
                commandParser.result.content = "MSISDN: " + dataLine.replace('", 15','');
                commandParser.result.response = '+CUSD: 0, "MSISDN:'+ dataLine;
            
            }
        }
            if (dataLine.endsWith('15')) {
            return {
                resultData: {
                    status: 'success',
                    request: 'executeCommand',
                    data: commandParser.result
                },
                returnResult: true,
            };
        } else if (dataLine.includes('+CUSD: 2') || dataLine.includes('COMMAND NOT SUPPORT')) {
            return {
                resultData: {
                    status: 'failed',
                    request: 'executeCommand',
                    data: `Execute Command returned Error: ${dataLine}`,
                },
                returnResult: true,
            };
        }
    }; 
}

// modem.on('onNewMessage', function (data) {
//     log.debug(data); 
// });

// modem.on('onNewMessageIndicator', (data) => { 
//     log.debug(data);
// });

modem.on('close', data => { 
    log.warning(" Modem closed\nReason: "+data);
 });
modem.on('error', data => { 
    log.error(" ERROR: "+ data);
 });



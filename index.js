/**
 * FIXME: 
 * KNOWN ISSUES:
 * - The USB serial watcher to update modem list whenever a modem is plugged or unplugged fails when you disconnect a modem and reconnect it
 * 
 */
var fs= require('fs');
var log = require("noogger");
let serialportgsm = require('serialport-gsm');
const ussd = require('serialport-gsm/lib/functions/ussd');

var EventEmitter = require('events').EventEmitter;
var eventEmitter = new EventEmitter();

var modemArray={};
var modemArrayInfo={};
var CONFIG= {
    SERIAL_PORT_WATCH_TIMEOUT:5000
}
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
};

scanSerialPorts();
setInterval(() => {
    scanSerialPorts();
}, CONFIG.SERIAL_PORT_WATCH_TIMEOUT);
function scanSerialPorts() {
    serialportgsm.list((err, result) => {
        if(err) { log.error(" Failed to list serial ports: "+err); return;}
    
        // TODO: Add support ofor UNIX systems
        // result.forEach( port => {
        //     if(port.comName.startsWith('/dev/ttyUSB')) {
        //         SIMs.push(port);
        //         addModem(serialportgsm.Modem());
        //     }
        // });
     let occupiedPorts= Object.keys(modemArray);
        result.forEach( port => {
            if(occupiedPorts.includes(port.comName)){
                occupiedPorts.splice( occupiedPorts.indexOf(port.comName),1);
            }
            if(portHasGSMModule(port)) {
                if(!modemArray[port.comName])
                    addModem(port.comName);
                else
                    log.notice("modem at "+port.comName+" is already registered");
            }
        });

        if(occupiedPorts.length>0) { // these are ports were previously used but no more, gotta clean!
            occupiedPorts.forEach(port => {
                modemArray[port].close( (msg)=>{
                    log.notice("modem at "+port+" is disconnected closing... msg:"+msg);
                    delete modemArray[port];
                    delete modemArrayInfo[port];
                });
            });
        }
        // console.log(result);
        // log.warning(modemArrayInfo);
        log.warning(modemArray);
        eventEmitter.emit("siminfo",modemArray);
    });
}

function portHasGSMModule(comPort) {
    if(comPort.productId= '7523' && comPort.vendorId == '1A86') return true; else return false;   // GOTTA MAKE SOMETHING SERIOUS HERE C'MON!
}

function addModem(serialPort) {
    let modem = serialportgsm.Modem();
    modem.info={};
    ussd(modem);
    // modem.clo
    modem.on('close', data => { 
        log.warning( modem.info.serialPort + " Modem closed\nReason: "+data);
     })
    modem.on('error', data => { 
        log.error( modem.info.serialPort + " ERROR: "+ data);
     })
    modem.on('onNewMessage', function (data) {
        log.warning("NEW MESSAGE");
        // log.debug(data); 
        eventEmitter.emit("SMSReceived", {
            id: "NA",
            port: modem.info.serialPort,
            sender: data.sender,
            time: data.dateTimeSent,
            index: data.index,
            content: data.message,
            smsc: data.header.smsc
        });
    });
    
    modem.on('onMemoryFull', (result) => { 
        log.warning("MEM FULLL");
        log.debug(result); 
    });

    
    modem.open(serialPort, options);
    modem.on('open', data => {
        log.notice("Modem on "+serialPort+" Opened !");
        
        modem.initializeModem(function(initResult) {
            if (initResult.status != 'success') {
                log.error(initResult);
                log.warning("Failed to Initialise modem on "+serialPort);
            } else { 
                eventEmitter.emit("ready");
                log.notice("Modem on "+serialPort+" Initialised!");
                modem.info.serialPort= serialPort;
                
                modem.info.port= "NA"; // FIXME: when we make our own box with our own H/W then only this property will be used and hard wired

                modem.getNetworkSignal((result) => { modem.info.SignalQuality= result.data.signalQuality;});
                modem.getModemSerial(  (result) => { modem.info.modemSerial  = result.data.modemSerial; });
                
                // Name of manufacturer - AT+CGMI
                // Model number - AT+CGMM
                // IMEI number - AT+CGSN
                // Software version - AT+CGMR
                // IMSI number - AT+CIMI
                                
                let commandParser = modem.executeCommand('AT+CIMI', (result, err) => {
                    if (err) {
                        console.log(`Error`, err);
                    } else {
                        // console.log(`Result`, result);
                        if(result.status == 'success') {
                            modem.info.SIMIMSI=  commandParser.result.data;
                            modem.info= Object.assign(modem.info, getNMCDetailsFromIMSI( modem.info.SIMIMSI));                           
                        }
                    }
                });
                
                commandParser.result = {};
                commandParser.logic = dataLine => {
                    // log.warning(dataLine);
                    if (dataLine) {
                        if (dataLine.startsWith("AT")) {
                            commandParser.result.command = dataLine.trim();
                        } else if (dataLine.length>0 && !dataLine.startsWith("OK") ) {
                            commandParser.result.data = dataLine.trim();
                        } else {
                            commandParser.result.response = dataLine.trim();
                        }
                    }
                        if (dataLine.includes('OK')) {
                        return {
                            resultData: {
                                status: 'success',
                                request: 'executeCommand',
                                data: { result: commandParser.result },
                            },
                            returnResult: true,
                        };
                    } else if (dataLine.includes('ERROR') || dataLine.includes('COMMAND NOT SUPPORT')) {
                        return {
                            resultData: {
                                status: 'ERROR',
                                request: 'executeCommand',
                                data: `Execute Command returned Error: ${dataLine}`,
                            },
                            returnResult: true,
                        };
                    }
                }; 
                
                modemArrayInfo[modem.info.serialPort]=modem.info;                
                modemArray[modem.info.serialPort]=modem;                
            }
        });     
    }); 

    
}

function getNMCDetailsFromIMSI(IMSI) {
    let MNC_CODE= IMSI.substring(0,5);
    try {
        let MNC = JSON.parse(fs.readFileSync("mnc.json"));        
        return MNC.find(obj => { return obj.mnc == MNC_CODE });
    } catch (err) {
        log.error(err);
    }
}
function getModem(port) {
    return modemArray[port];
}
function sendUSSD(USSD,port, callb) {
    log.warning("sending USSD");
    let modem= getModem(port);
    
    let commandParser = modem.executeCommand('AT+CUSD=1,"'+USSD+'"', (result, err) => {
        if (err) {
            console.error(`Error`, err);
        } else {
            console.log(`Result`, result);
            if(result.status == 'success') {
                log.debug(commandParser.result);    
                callb(result.data, result.status, port);                    
            }
        }
    });
    
    commandParser.result = {};
    commandParser.logic = dataLine => {
        // log.critical(dataLine);
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

function sendSMS(sms,port) {
    log.warning("sending SMS");
    let smsId= generateToken();
    let modem= getModem(port);
    modem.sendSMS(sms.destinator,sms.content, true, smsId, function(info) {       
        if (info.data.response == "Message Successfully Sent") {
            log.debug(info);
            eventEmitter.emit("SMSUpdate",{ 
                id: info.data.messaegeId,
                sent: (info.status == 'success') ? 1 : 0,
                smsc: '' 
            });
        }            
    });
    return smsId;    
}


setTimeout(() => {
    sendUSSD("*99#","COM15", (result,status,port) => {
        log.debug(result.data);
        let success= (status == 'success') ? true : false;
        eventEmitter.emit("USSDResponse",{content: result.data, success:success , port: port});
    });
    let smsId= sendSMS({
        destinator:"52004896",
        content:"sms voX"
    }, "COM15");
}, 7000);

// {
//     "status": "success",
//     "request": "sendSMS",
//     "data": {
//        "messageId": "GscRjp9RNwBOP2CfKiTBNLGHZ",
//        "response": "Successfully Sent to Message Queue"
//     }
//  }
// {
//     "status": "success",
//     "request": "SendSMS",
//     "data": {
//        "messageId": "GscRjp9RNwBOP2CfKiTBNLGHZ",
//        "message": "TESTING",
//        "recipient": "52004896",
//        "response": "Message Successfully Sent"
//     }
//  }

// {
//     "status": "fail",
//     "request": "SendSMS",
//     "data": {
//        "messageId": "zmY1lxtetfy70Qq0lG5uVongX",
//        "message": "sms voX",
//        "recipient": "52004896",
//        "response": "Message Failed +CMS ERROR: 21"
//     }
//  }

function generateToken() { return Math.random().toString(36).substring(2, 15) + '#' + Math.random().toString(36).substring(2, 15) + '#' + Date.now().toString(36); }

/**Exports */

exports.events=eventEmitter;
exports.sendUSSD= sendUSSD;
exports.sendSMS= sendSMS;
// exports.scanSIM= scanSIM;
// exports.open= open;



// modem.on('onNewIncomingCall', (result) => { 
//     log.debug(result); 
//     modem.executeCommand('ATA',(result) => { log.debug(result); });
//     modem.executeCommand('AT+CMEDPLAY=1,\"C:\\stats\\tts2.amr\",0,100',(result) => { log.debug(result); });
//     modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });

// });
// modem.on('onMemoryFull', (result) => { log.debug(result); });


// modem.open('COM5', options);

// modem.on('open', data => {
//     log.notice("Opened!");
//     modem.initializeModem(function (initResult) {
//         if (initResult.status != 'success') {
//             log.error(initResult);
//         } else {



//             log.notice("Initialised!");
//             // modem.sendUSSD('*110#').then(
//             //     (success)=>{console.log(success)},
//             //     (fail)=>{console.log(fail)}
//             //     );

//             setInterval(() => {
//                 modem.getNetworkSignal(result => {
//                     console.log('Signal Strength = ' + JSON.stringify(result));
//                     connector.publish('/stats', result.data);
//                 });
//             }, 5000);

//             // modem.sendSMS('+22652004896', Hello there zab!, false, function (response) {
//             //     console.log('message status', response);
//             // });

//             modem.on('onNewIncomingUSSD', (data) => {
//                 // log.debug('onNewIncomingUSSD');
//                 console.log(data);
//             });


//             //     modem.sendUSSD("*444#", (res,err) => {
//             //         if(err) log.error(err);
//             //         log.debug(res);
//             //     },30000);
//             // }

//             // modem.executeCommand('AT+FSMKDIR=C:\\status\\',(result) => { log.debug(result); });

//             // fs.readFile('tts2.amr', function(err, amr_data) {
//             //     if(!err) {
//             //         let fsize= fs.statSync('tts2.amr').size;
//             //         log.debug(fsize);
//             //         modem.executeCommand('AT+FSCREATE=C:\\stats\\tts2.amr',(result) => { log.debug(result); });
//             //         modem.executeCommand('AT+FSWRITE=C:\\stats\\tts2.amr,0,'+fsize+',100',(result) => { 

//             //             modem.port.write(amr_data);
//             //             log.debug(amr_data); 
//             //         });
//             //         modem.executeCommand('AT+FSLS=C:\\stats',(result) => { log.debug(result); });
//             //     }
//             // });     
//         }
//     });

// });



// modem.on('onNewMessage', function (data) {
//     log.debug(data); 
// });

// modem.on('onNewMessageIndicator', (data) => { 
//     log.debug(data);
// });

// modem.on('onMemoryFull', (result) => { log.debug(result); });

// modem.sendSMS('+22652004896', 'Hello there Zab!', false, function(p) {

//     log.debug(p);
// });

// modem.getSimInbox((result) => { log.debug(result); });

// modem.on('onNewIncomingCall', (result) => { 
//     log.debug(result); 
//     modem.executeCommand('ATA',(result) => { log.debug(result); });
//     modem.executeCommand('AT+CMEDPLAY=1,\"C:\\stats\\tts2.amr\",0,100',(result) => { log.debug(result); });
//     modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });

// });


// modem.executeCommand('ATD71792604;',(result) => { 
//     log.debug(result); 
//     setTimeout(()=>{
//         modem.executeCommand('AT+CMEDPLAY=1,\"C:\\user\\tts.amr\",0,100',(result) => { log.debug(result); });
//         // modem.executeCommand('AT+CTTS=2,\"Hi there how are you doing\"',(result) => { log.debug(result); });
//     },15000);
// });
// modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });




/***
 * USEFUL COMMANDS
 */

/*

 You can read the list of files with an AT command: AT+FSLS=C:\User\

Delete a specific file by an AT-Command: AT+CREC=3,"C:\User\9.amr"

Play the file "in the phone" with a volume level of 90% can be an AT-Command: AT+CREC=4,"C:\User\9.amr",0,90

Play the file on an external speaker with a volume level of 95% can be an AT-Command: AT+CREC=4,"C:\User\9.amr",1,95
*/


/* USSD RESPONSES  - TELECEL */
/*

"Votre demande est entrain d'etre traitee, SVP patientez. Merci."

*/
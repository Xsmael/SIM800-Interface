
var log= require("noogger");
let serialportgsm  = require('serialport-gsm');
let modem = serialportgsm.Modem();
let serialport = serialportgsm.serialport;

serialportgsm.list((err, result) => {
    if(err) { log.error(" Failed to list serial ports: "+err); return;}

    // result.forEach( port => {
    //     if(port.comName.startsWith('/dev/ttyUSB')) {
    //         SIMs.push(port);
    //         addModem(serialportgsm.Modem());
    //     }
    // });
 
    result.forEach( port => {
        if(portHasGSMModule(port)) {
            addModem(port.comName);
        }
    });


    console.log(result);
});

function portHasGSMModule(comPort) {
    if(comPort.productId= '7523') return true;   // GOTTA MAKE SOMETHING SERIOUS HERE C'MON!
}

function addModem(serialPort) {
    let modem = serialportgsm.Modem();
    modem.open(serialPort, options);
    modem.on('open', data => {
        log.notice("Modem on "+serialPort+" Opened !");

        modem.initializeModem(function(initResult) {
            if (initResult.status != 'success') {
                log.error(initResult);
                log.warning("Failed to Initialise modem on "+serialPort);
            } else { 

                log.notice("Modem on "+serialPort+" Initialised!");
            }
    
            // modem.executeCommand('AT+FSMKDIR=C:\\status\\       ',(result) => { log.debug(result); });
            
            // fs.readFile('tts2.amr', function(err, amr_data) {
            //     if(!err) {
            //         let fsize= fs.statSync('tts2.amr').size;
            //         log.debug(fsize);
            //         modem.executeCommand('AT+FSCREATE=C:\\stats\\tts2.amr',(result) => { log.debug(result); });
            //         modem.executeCommand('AT+FSWRITE=C:\\stats\\tts2.amr,0,'+fsize+',100',(result) => { 
            
            //             modem.port.write(amr_data);
            //             log.debug(amr_data); 
            //         });
            //         modem.executeCommand('AT+FSLS=C:\\stats',(result) => { log.debug(result); });
            //     }
            // });     
        });
        
    });
    
    modem.getOwnNumber(function(num) {
        log.debug('NUMBER');
        log.debug(num);
    });
    
    // modem.hangupCall(callback)
    
    
    modem.on('onNewMessage', function (data) {
        log.debug(data); 
        if(data.message=='OK') 
            modem.executeCommand('ATD+22652004896',(result) => { log.debug(result); });
    });
    
    modem.on('onNewMessageIndicator', (data) => { 
        log.debug(data);
    });
    modem.on('onNewIncomingCall', (result) => { 
        log.debug(result); 
        modem.executeCommand('ATA',(result) => { log.debug(result); });
        modem.executeCommand('AT+CMEDPLAY=1,\"C:\\stats\\tts2.amr\",0,100',(result) => { log.debug(result); });
        modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });
    
    });
    modem.on('onMemoryFull', (result) => { log.debug(result); });
    
    
}
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

modem.open('COM5', options);

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



modem.on('onNewMessage', function (data) {
    log.debug(data); 
});

modem.on('onNewMessageIndicator', (data) => { 
    log.debug(data);
});

modem.on('onMemoryFull', (result) => { log.debug(result); });

// modem.sendSMS('+22652004896', 'Hello there Zab!', false, function(p) {

//     log.debug(p);
// });

// modem.getNetworkSignal((result) => { log.debug(result); });
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
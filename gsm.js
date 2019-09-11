
var os = require('os');
var log= require("noogger");
let serialportgsm  = require('serialport-gsm');
let modem = serialportgsm.Modem();
let serialport = serialportgsm.serialport;
var SYSINFO_UPDATE_INTERVAL= 1000;
var systemInfo;

var SIMs=[];
var modems=[];

function addModem(modem,serialPort) {
    modem.open(serialPort, options);
    modem.on('open', data => {
        modem.initializeModem(function(p) {
            log.notice("Opened!");
            // log.debug(p);
    
            modem.executeCommand('AT+FSMKDIR=C:\\status\\       ',(result) => { log.debug(result); });
            
            fs.readFile('tts2.amr', function(err, amr_data) {
                if(!err) {
                    let fsize= fs.statSync('tts2.amr').size;
                    log.debug(fsize);
                    modem.executeCommand('AT+FSCREATE=C:\\stats\\tts2.amr',(result) => { log.debug(result); });
                    modem.executeCommand('AT+FSWRITE=C:\\stats\\tts2.amr,0,'+fsize+',100',(result) => { 
            
                        modem.port.write(amr_data);
                        log.debug(amr_data); 
                    });
                    modem.executeCommand('AT+FSLS=C:\\stats',(result) => { log.debug(result); });
                }
            });     
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
/**

linux output
{ manufacturer: '1a86',
    serialNumber: undefined,
    pnpId: 'usb-1a86_USB2.0-Serial-if00-port0',
    locationId: undefined,
    vendorId: '1a86',
    productId: '7523',
    comName: '/dev/ttyUSB0' 
}

win32 output
{
    comName: 'COM8',
    manufacturer: 'wch.cn',
    serialNumber: '7&29197095&0&1',
    pnpId: 'USB\\VID_1A86&PID_7523\\7&29197095&0&1',
    locationId: 'Port_#0001.Hub_#0005',
    vendorId: '1A86',
    productId: '7523' 
}
*/

serialportgsm .list((err, result) => {
    result.forEach( port => {
        if(port.comName.startsWith('/dev/ttyUSB')) {
            SIMs.push(port);
            addModem(serialportgsm.Modem());
        }
    });
    console.log(result);
});

function updateSystemInfo() {
    systemInfo= {
        os: os.platform(),
        cpuArch: os.arch(),
        // release: os.release(),
        ifaces: os.networkInterfaces(),
        cpuCount: os.cpus().length,
        cpu: os.cpus()[0].model,
        totalMemory: (os.totalmem()/1073741824 ).toFixed(2) +' GB',
        memoryUsage: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2),
        hostname: os.hostname(),
        osName: os.type(),
        os_uptime: formatTime(os.uptime()),
        process_uptime: formatTime(process.uptime())
    };
    // console.log(systemInfo);
}

function formatTime(time){
    function pad(s){
      return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(time / (60*60));
    var minutes = Math.floor(time % (60*60) / 60);
    var seconds = Math.floor(time % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  }


setInterval(() => {
    updateSystemInfo();
}, SYSINFO_UPDATE_INTERVAL);


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
    customInitCommand: '',
    logger: console
};
 

/*
Try to understand the sequence of commands ran by modem.initializeModem()
Modem Write: ATZ
Modem Received: ATZ
Activate Message Processing for: ATZ
Modem Received:
Modem Received: OK
Call callback for: ATZ
Modem Write: ATE1
Modem Received: ATE1
Activate Message Processing for: ATE1
Modem Received:
Modem Received: OK
Call callback for: ATE1
Modem Write: AT+CPIN?
Modem Received: AT+CPIN?
Activate Message Processing for: AT+CPIN?
Modem Received:
Modem Received: +CPIN: READY
Call callback for: AT+CPIN?
Modem Received:
Modem Received: OK
Modem Write: AT+CMEE=1;+CREG=2
Modem Received: AT+CMEE=1;+CREG=2
Activate Message Processing for: AT+CMEE=1;+CREG=2
Modem Received:
Modem Received: OK
Call callback for: AT+CMEE=1;+CREG=2
Modem Write: AT+CLIP=1
Modem Received: AT+CLIP=1
Activate Message Processing for: AT+CLIP=1
Modem Received:
Modem Received: OK
Call callback for: AT+CLIP=1

*/
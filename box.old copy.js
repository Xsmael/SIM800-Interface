var os = require('os');
var fs = require('fs');
// const mysql = require('mysql2');
var log = require("noogger");
let serialportgsm = require('serialport-gsm');
let modem = serialportgsm.Modem();
const ussd = require('serialport-gsm/lib/functions/ussd');
ussd(modem);

let serialport = serialportgsm.serialport;
var CONFIG = {
    FAYE_PORT: 8888,
    SECRET: 'Async#70',
    DB_RECONNECTION_TIMEOUT: 2000,
    DB_CONFIG: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'smsbox'
    },
    FAILED_smsS_FILE: 'failed_smss'
}



// var faye = require('faye');
// var connector = new faye.Client('http://localhost:' + CONFIG.FAYE_PORT + '/faye');
// var db_connection;

// // Running the connector
// var http = require('http');
// faye = require('faye');

// var server = http.createServer(),
//     bayeux = new faye.NodeAdapter({
//         mount: '/'
//     });

// bayeux.on('subscribe', function (clientId, channel) {
//     // log.notice(clientId + " subscribed on channel " + channel);
// });
// bayeux.on('unsubscribe', function (clientId, channel) {
//     // log.warning(clientId + " unsubscribed on channel " + channel);
// });
// bayeux.on('publish', function (clientId, channel, data) {
//     // log.debug(clientId + " publish on channel " + channel);
// });
// bayeux.attach(server);
// server.listen(CONFIG.FAYE_PORT);
// log.info("Connector running on Port " + CONFIG.FAYE_PORT);

// function init() {
//     console.log()
//     log.info("SMSBOX v1.0.0  Starting up Sequence...")
//     // Creating the file responsible for keeping the data that failed to be sent for resending when possible. The file is initialisez with an empty array
//     log.info("Checking for FAILED_smsS_FILE...");
//     fs.exists(CONFIG.FAILED_smsS_FILE, function (yes) {
//         if (!yes)
//             fs.writeFile(CONFIG.FAILED_smsS_FILE, "[]", function (err) {
//                 if (err) log.warning("failed to create FAILED_smsS_FILE file at: " + CONFIG.FAILED_smsS_FILE);
//             });
//     });
//     log.info("Connecting to DB server...");
//     connectDB();

// }

// function connectDB() {
//     db_connection = mysql.createConnection(CONFIG.DB_CONFIG);
//     db_connection.on("error", function (err) {
//         log.error('DB ERROR: ' + err);
//         setTimeout(connectDB, CONFIG.DB_RECONNECTION_TIMEOUT); // AUTO RECONNECTION
//     });
//     db_connection.connect((err, res) => {
//         if (err) log.error(err);
//         else log.notice("DB connected");
//     });
// }

// init();

// function updateOnTableChange(table_name) {
//     // execute will internally call prepare and query
//     // If you execute same statement again, it will be picked from a LRU cache  which will save query preparation time and give better performance
//     db_connection.execute(
//         'SELECT * FROM '+table_name,
//         function (err, results, fields) {
//             if (err) log.error("DB: " + err);
//             else {
//                 connector.publish('/'+table_name+'/list', results);
//             }
//         }
//     );
// }

// connector.subscribe('/contact/*').withChannel(function (channel, contact) {
//     let ch= channel.replace("/contact/", "");
//     let data;
    
//     switch (ch) {
//         case 'save':
//             log.debug('saving contact');

//             // DB INSERTION
//             data = [null, contact.firstname, contact.lastname, contact.phone, contact.email]
//             db_connection.execute('INSERT INTO contact(id, firstname, lastname, phone, email) VALUES (?,?,?,?,?)',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("contact INSERTED");
//                         updateOnTableChange('contact');
//                     }
//                 });
//             break;

//         case 'update':
//             data = [contact.firstname, contact.lastname, contact.phone, contact.email, contact.id]
//             db_connection.execute('UPDATE contact SET firstname=?, lastname=?, phone=?, email=? WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("contact UPDATED");          
//                         updateOnTableChange('contact');
//                     }
//                 });
//             break;

//         case 'delete':
//             data = [contact.id]
//             db_connection.execute('DELETE from contact WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("contact DELETED");
//                         updateOnTableChange('contact');
//                     }
//                 });
//             break;

//         case 'onchange':
//             updateOnTableChange('contact');
//             break;

//         default:
//             break;
//     }
// });
// connector.subscribe('/group/*').withChannel(function (channel, group) {
//     log.debug(group);
//     let ch= channel.replace("/group/", "");
//     let data;
    
//     switch (ch) {
//         case 'save':
//             log.debug('saving group');  
//             // DB INSERTION
//             data = [null, group.name, group.description]
//             db_connection.execute('INSERT INTO contact_group(id, name, description) VALUES (?,?,?)',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("group INSERTED");
//                         updateOnTableChange('contact_group');
//                     }
//                 });
//             break;

//         case 'update':
//             data = [group.name, group.description, group.id]
//             db_connection.execute('UPDATE contact_group SET name=?, description=? WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("group UPDATED");          
//                         updateOnTableChange('contact_group');
//                     }
//                 });
//             break;

//         case 'delete':
//             data = [contact.id]
//             db_connection.execute('DELETE from contact_group WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("contact DELETED");
//                         updateOnTableChange('contact_group');
//                     }
//                 });
//             break;

//         case 'onchange':
//             updateOnTableChange('contact_group');
//             break;

//         default:
//             break;
//     }
// });
// connector.subscribe('/ussd/*').withChannel(function (channel, ussd) {
//     log.debug(ussd);
//     let ch= channel.replace("/ussd/", "");
//     let data;
    
//     switch (ch) {
//         case 'save':
//             log.debug('saving ussd');

//             // DB INSERTION
//             data = [null, ussd.title, ussd.description, ussd.code]
//             db_connection.execute('INSERT INTO ussd(id, title, description, code) VALUES (?,?,?,?)',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("ussd INSERTED");
//                         updateOnTableChange('ussd');
//                     }
//                 });
//             break;

//         case 'update':
//             data = [ussd.title, ussd.description, ussd.code, ussd.id]
//             db_connection.execute('UPDATE ussd SET title=?, description=?, code=? WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("ussd UPDATED");          
//                         updateOnTableChange('ussd');
//                     }
//                 });
//             break;

//         case 'delete':
//             data = [ussd.id]
//             db_connection.execute('DELETE from ussd WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("ussd DELETED");
//                         updateOnTableChange('ussd');
//                     }
//                 });
//             break;

//         case 'onchange':
//             updateOnTableChange('ussd');
//             break;

//         default:
//             break;
//     }
// });

// connector.subscribe('/config/*').withChannel(function (channel, config) {
//     log.debug(config);
//     let ch= channel.replace("/config/", "");
//     let data;
    
//     switch (ch) {
//         case 'save':
//             log.debug('saving config');

//             // DB INSERTION
//             data = [null, config.title, config.content, config.time_saved]
//             db_connection.execute('INSERT INTO config(id, title, content, time_saved) VALUES (?,?,?,NOW())',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("config INSERTED");
//                         updateOnTableChange('config');
//                     }
//                 });
//             break;

//         case 'update':
//             data =[config.title, config.content,config.id]
//             db_connection.execute('UPDATE ussd SET title=?, content=?, time_saved=NOW() WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("config UPDATED");          
//                         updateOnTableChange('config');
//                     }
//                 });
//             break;

//         case 'delete':
//             data = [config.id]
//             db_connection.execute('DELETE from config WHERE id=?',
//                 data,
//                 function (err, results, fields) {
//                     if (err) log.error("DB: " + err);
//                     else {
//                         log.info("ussd DELETED");
//                         updateOnTableChange('config');
//                     }
//                 });
//             break;

//         case 'onchange':
//             updateOnTableChange('ussd');
//             break;

//         default:
//             break;
//     }
// });

// connector.subscribe('/SMSSend', function (sms) {
//     modem.sendSMS(sms.destinator, sms.content, false, function (response) {
//         log.debug('sending SMS');
//         log.debug(sms);
//         log.debug(response);
//         // DB INSERTION
//         let data = [null, 'SCHEDULED', sms.content, ]
//         db_connection.execute('INSERT INTO sent(id, status, sms_content, created) VALUES (?,?,?,NOW())',
//         data,
//             function (err, result, fields) {
//                 if (err) log.error("DB: " + err);
//                 else {
//                     log.info("Job created:"+result.insertId);
//                     // DB INSERTION
//                     data = [null, "SIM", sms.operator, destinator, sms.content, sms.priority, sms.send_at, first, last, job_id ]
//                     db_connection.execute('INSERT INTO sms_queue(id, sender, destinator, content, priority, time_queued, send_at, first, last, job_id) VALUES (?,?,?,?,?,NOW(),?,?,?,?)',
//                     // db_connection.execute('INSERT INTO sms_sent(id, sms_id, sender, destinator, content, status) VALUES (?,?,?,?,?,?,?,?)',
//                         sms,
//                         function (err, results, fields) {
//                             if (err) log.error("DB: " + err);
//                             else {
//                                 log.info("sms recorded");
//                                 // connector.publish('/sms/update');
//                             }
//                         });
//                 }
//             });
//     });
// });


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
                (success)=>{console.log(success)},
                (fail)=>{console.log(fail)}
                );

            setInterval(() => {
                modem.getNetworkSignal(result => {
                    console.log('Signal Strength = ' + JSON.stringify(result));
                    connector.publish('/stats', result.data);
                });
            }, 5000);

            // modem.sendSMS('+22652004896', Hello there zab!, false, function (response) {
            //     console.log('message status', response);
            // });

            modem.on('onNewIncomingUSSD', (data) => {
                // log.debug('onNewIncomingUSSD');
                console.log(data);
            });


            //     modem.sendUSSD("*444#", (res,err) => {
            //         if(err) log.error(err);
            //         log.debug(res);
            //     },30000);
            // }

            // modem.executeCommand('AT+FSMKDIR=C:\\status\\',(result) => { log.debug(result); });

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
        }
    });

});




// // modem.hangupCall(callback)


// modem.on('onNewMessage', function (data) {
//     log.debug(data); 
//     if(data.message=='OK') 
//         modem.executeCommand('ATD+22652004896',(result) => { log.debug(result); });
// });

// modem.on('onNewMessageIndicator', (data) => { 
//     log.debug(data);
// });
// modem.on('onNewIncomingCall', (result) => { 
//     log.debug(result); 
//     modem.executeCommand('ATA',(result) => { log.debug(result); });
//     modem.executeCommand('AT+CMEDPLAY=1,\"C:\\stats\\tts2.amr\",0,100',(result) => { log.debug(result); });
//     modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });

// });
// modem.on('onMemoryFull', (result) => { log.debug(result); });



// modem.sendSMS('+22652004896', 'Hello there Zab!', false, function(p) {
//     log.notice("msg SENT: ");
//     log.debug(p);
// });
// modem.executeCommand('ATD71792604;',(result) => { 
//     log.debug(result); 
//     setTimeout(()=>{
//         modem.executeCommand('AT+CMEDPLAY=1,\"C:\\user\\tts.amr\",0,100',(result) => { log.debug(result); });
//         // modem.executeCommand('AT+CTTS=2,\"Hi there how are you doing\"',(result) => { log.debug(result); });
//     },15000);
// });
// modem.executeCommand('AT+DDET=1',(result) => { log.debug(result); });

// modem.getNetworkSignal((result) => { log.debug(result); });
// modem.getSimInbox((result) => { log.debug(result); });


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
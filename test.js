var a=[];
var r;
var date = new Date();
setTimeout(function(e) {
    var currentDate = new Date();
    r= currentDate-date;
    console.log(r);
}, 1000);
for( let i=1 ; i <= 100000 ; i++) a.push(i);

function waitAndDo(item, callb) {
    if(0) 
    setImmediate(() => {
        callb(item);
    });
    else
    callb(item);
}
console.log(r);

a.forEach(function(item) {
    waitAndDo(item, function (result) {
            console.log(result);            
    });
})
console.log('done!');

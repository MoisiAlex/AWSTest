 window.myCPP = window.myCPP || {};

    //replace with the CCP URL for the current Amazon Connect instance
    var ccpUrl = "https://demoinstance.awsapps.com/connect/ccp#/";

    connect.core.initCCP(containerDiv, {
        ccpUrl: ccpUrl,        
        loginPopup: true,         
        softphone: {
            allowFramedSoftphone: true
        }
    });

    connect.contact(subscribeToContactEvents);  
    

    function subscribeToContactEvents(contact) {
        window.myCPP.contact = contact;
        logInfoMsg("New contact offered. Subscribing to events for contact");
        if (contact.getActiveInitialConnection()
            && contact.getActiveInitialConnection().getEndpoint()) {
            logInfoMsg("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber);
        } else {
            logInfoMsg("This is an existing contact for this agent");
        }
        logInfoMsg("Contact is from queue " + contact.getQueue().name);    
        logInfoMsg("ContactID is " + contact.getContactId());   
        logInfoMsg("Contact attributes are " + JSON.stringify(contact.getAttributes()));
        
        
        updateQueue(contact.getQueue().name);
        updateContactAttribute(contact.getAttributes());    
        contact.onEnded(clearContactAttribute);
    }

    function updateQueue(msg){
         var tableRef = document.getElementById('attributesTable');
         var cell1 =  document.createElement('div');
         var cell2 =  document.createElement('div');
         tableRef.appendChild(cell1);
         tableRef.appendChild(cell2);
         cell1.innerHTML  = "<strong> Queue Name: </strong>";
         cell2.innerHTML = msg;

        
        
    }


    function updateContactAttribute(msg){
        var tableRef = document.getElementById('attributesTable');      
        for (var key in msg) {
            if (msg.hasOwnProperty(key)) {
                        var cell1 =  document.createElement('div');
                        var cell2 =  document.createElement('div');
                        tableRef.appendChild(cell1);
                        tableRef.appendChild(cell2);
                        cell1.innerHTML =  "<strong>"+key+"</strong>:";
                        cell2.innerHTML = msg[key]['value'];

            }
        }
        
    }


    function clearContactAttribute(){
        var old_tbody= document.getElementById('attributesTable');
        old_tbody.innerHTML= "<!-- Contact attributes will go here-->";
    }


    function logMsgToScreen(msg) {
        logMsgs.innerHTML =  new Date().toLocaleTimeString() + ' : ' + msg + '<br>' + logMsgs.innerHTML;
    }


    function logInfoMsg(msg) {
        connect.getLog().info(msg);
        logMsgToScreen(msg);
    }


// LogMessages section display controls

var showLogsBtn = document.getElementById('showAttributes');
var showLogsDiv = document.getElementById('hiddenAttributes');
var hideLogsBtn = document.getElementById('hideAttributes');
var hideLogsDiv = document.getElementById('visibleAttributes');


showLogsBtn.addEventListener('click',replaceDisplay);

hideLogsBtn.addEventListener('click',replaceDisplay);

    function replaceDisplay(){
            showLogsDiv.style.display = showLogsDiv.style.display === 'none' ? '' : 'none';
            hideLogsDiv.style.display = hideLogsDiv.style.display === 'none' ? '' : 'none';
    }


function resizePage(){
    var width = 600;
    var height = 400;
    window.resizeTo(width, height);
    
}

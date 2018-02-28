 window.myCPP = window.myCPP || {};

    //replace with the CCP URL for your Amazon Connect instance
    var ccpUrl = "https://demoinstance.awsapps.com/connect/ccp";

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
        logInfoMsg("Subscribing to events for contact");
        if (contact.getActiveInitialConnection()
            && contact.getActiveInitialConnection().getEndpoint()) {
            logInfoMsg("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber);
        } else {
            logInfoMsg("This is an existing contact for this agent");
        }
        logInfoMsg("Contact is from queue " + contact.getQueue().name);
        
        
        
        logInfoMsg("Contact attributes are " + JSON.stringify(contact.getAttributes()));
        
        updateContactAttribute(window.myCPP.contact.getAttributes());
        
        contact.onEnded(clearContactAttribute);

    }

    function updateContactAttribute(msg){
        
      

        const tableRef = document.getElementById('attributesTable').getElementsByTagName('tbody')[0];
        
        for (var key in msg) {
            if (msg.hasOwnProperty(key)) {
                        var row = tableRef.insertRow(tableRef.rows.length);
                        var cell1 = row.insertCell(0);
                        var cell2 = row.insertCell(1);
                        cell1.innerHTML = key;
                        cell2.innerHTML = msg[key]['value'];
            }
        }
        
    }


    function clearContactAttribute(){
        var old_tbody= document.getElementById('attributesTable').getElementsByTagName('tbody')[0];
        var new_tbody = document.createElement('tbody');
        
        old_tbody.parentNode.replaceChild(new_tbody, old_tbody)
        
    }


    function logMsgToScreen(msg) {
        logMsgs.innerHTML = '<div>' + new Date().toLocaleTimeString() + ' ' + msg + '</div>' + logMsgs.innerHTML;
    }



    function logInfoMsg(msg) {
        connect.getLog().info(msg);
        logMsgToScreen(msg);
    }


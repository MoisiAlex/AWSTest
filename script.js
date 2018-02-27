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
        contact.onIncoming(handleContactIncoming);
        contact.onAccepted(handleContactAccepted);
        contact.onConnected(handleContactConnected);
        contact.onEnded(handleContactEnded);
    }

    function updateContactAttribute(msg){
        let contactAttribute = msg[1]['value'];   
        
        document.getElementById('contactID').value=contactAttribute;
    }


    function logMsgToScreen(msg) {
        logMsgs.innerHTML = '<div>' + new Date().toLocaleTimeString() + ' ' + msg + '</div>' + logMsgs.innerHTML;
    }



    function logInfoMsg(msg) {
        connect.getLog().info(msg);
        logMsgToScreen(msg);
    }


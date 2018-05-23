window.onload = function() {
checkStatus();
}; 

window.myCPP = window.myCPP || {};

    //replace with the CCP URL for your Amazon Connect instance
    var ccpUrl = "https://perficientdemo.awsapps.com/connect/ccp#/";

    connect.core.initCCP(containerDiv, {
        ccpUrl: ccpUrl,        
        loginPopup: true,         
        softphone: {
            allowFramedSoftphone: true
        }
    });

    connect.contact(subscribeToContactEvents);
    connect.agent(subscribeToAgentEvents);

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

    function handleContactIncoming(contact) {
        if (contact) {
            logInfoEvent("[contact.onIncoming] Contact is incoming. Contact state is " + contact.getStatus().type);
        } else {
            logInfoEvent("[contact.onIncoming] Contact is incoming. Null contact passed to event handler");
        }
    }

    function handleContactAccepted(contact) {
        if (contact) {
            logInfoEvent("[contact.onAccepted] Contact accepted by agent. Contact state is " + contact.getStatus().type);
        } else {
            logInfoEvent("[contact.onAccepted] Contact accepted by agent. Null contact passed to event handler");
        }
    }

    function handleContactConnected(contact) {
        if (contact) {
            logInfoEvent("[contact.onConnected] Contact connected to agent. Contact state is " + contact.getStatus().type);
        } else {
            logInfoEvent("[contact.onConnected] Contact connected to agent. Null contact passed to event handler");
        }
    }

    function handleContactEnded(contact) {
        if (contact) {
            logInfoEvent("[contact.onEnded] Contact has ended. Contact state is " + contact.getStatus().type);
        } else {
            logInfoEvent("[contact.onEnded] Contact has ended. Null contact passed to event handler");
        }
    }

    function subscribeToAgentEvents(agent) {
        window.myCPP.agent = agent;
        agentGreetingDiv.innerHTML = '<h3>Hi ' + agent.getName() + '!</h3>';
        logInfoMsg("Subscribing to events for agent " + agent.getName());
        logInfoMsg("Agent is currently in status of " + agent.getStatus().name);
        displayAgentStatus(agent.getStatus().name);
        agent.onRefresh(handleAgentRefresh);
        agent.onRoutable(handleAgentRoutable);
        agent.onNotRoutable(handleAgentNotRoutable);
        agent.onOffline(handleAgentOffline);
        
    }

    function handleAgentRefresh(agent) {
        logInfoEvent("[agent.onRefresh] Agent data refreshed. Agent status is " + agent.getStatus().name);
        displayAgentStatus(agent.getStatus().name);
        checkStatus();
    }

    function handleAgentRoutable(agent) {
        logInfoEvent("[agent.onRoutable] Agent is routable. Agent status is " + agent.getStatus().name);
        displayAgentStatus(agent.getStatus().name);
    }

    function handleAgentNotRoutable(agent) {
        logInfoEvent("[agent.onNotRoutable] Agent is online, but not routable. Agent status is " + agent.getStatus().name);
        displayAgentStatus(agent.getStatus().name);
    }

    function handleAgentOffline(agent) {
        logInfoEvent("[agent.onOffline] Agent is offline. Agent status is " + agent.getStatus().name);
        displayAgentStatus(agent.getStatus().name);
    }

    function logMsgToScreen(msg) {
        logMsgs.innerHTML = '<div>' + new Date().toLocaleTimeString() + ' ' + msg + '</div>' + logMsgs.innerHTML;
    }

    function logEventToScreen(msg) {
        eventMsgs.innerHTML = '<div>' + new Date().toLocaleTimeString() + ' ' + msg + '</div>' + eventMsgs.innerHTML;
    }

    function logInfoMsg(msg) {
        connect.getLog().info(msg);
        logMsgToScreen(msg);
    }

    function logInfoEvent(eventMsg) {
        connect.getLog().info(eventMsg);
        logEventToScreen(eventMsg);
    }

    function displayAgentStatus(status) {
        agentStatusDiv.innerHTML = 'Status: <span style="font-weight: bold">' + status + '</span>';
  
    }

    function checkStatus(){
        
        var checkboxes = document.getElementById('statBox');
    
        if (window.myCPP.agent.getStatus().name === "Available") {
          
            checkboxes.checked = true;       
        }
        else {
            
            checkboxes.checked = false;
        }
        
        
        
    }

    function setStatus(){ 
        if (window.myCPP.agent.getStatus().name === "Available") {
            goOffline();
        }
        else {
            goAvailable();
        }       
        
    }


    function goAvailable() {
        var routableState = window.myCPP.agent.getAgentStates().filter(function (state) {
            return state.type === connect.AgentStateType.ROUTABLE;
        })[0];
        window.myCPP.agent.setState(routableState, {
            success: function () {
                logInfoMsg("Set agent status to Available (routable) via Streams")
            },
            failure: function () {
                logInfoMsg("Failed to set agent status to Available (routable) via Streams")
            }
        });
    }

    function goOffline() {
        var offlineState = window.myCPP.agent.getAgentStates().filter(function (state) {
            return state.type === connect.AgentStateType.OFFLINE;
        })[0];
        window.myCPP.agent.setState(offlineState, {
            success: function () {
                logInfoMsg("Set agent status to Offline via Streams")
            },
            failure: function () {
                logInfoMsg("Failed to set agent status to Offline via Streams")
            }
        });
    }

    function acceptContact() {
        window.myCPP.contact.accept({
            success: function () {
                logInfoMsg("Accepted contact via Streams");
            },
            failure: function () {
                logInfoMsg("Failed to accept contact via Streams");
            }
        });
    }

    function disconnectContact() {
        //cannot do contact.destroy(), can only destroy (hang-up) agent connection
        window.myCPP.contact.getAgentConnection().destroy({
            success: function () {
                logInfoMsg("Disconnected contact via Streams");
            },
            failure: function () {
                logInfoMsg("Failed to disconnect contact via Streams");
            }
        });
    }
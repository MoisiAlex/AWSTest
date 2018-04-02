    window.myCPP = window.myCPP || {};
    
    var activeCall = undefined;
    var agentStateCollection = {}
    var inbound = false;
    var spokes; // global Spokes object, initialised when this page is loaded (onload)
    var plugin_registered = false;
    var plugin_name = "Plantronics Amazon Connect ";
    var callid = 99;
    var deviceAttached = true;
    var pollRate = 2000;
    var previousPollRate = 2000;
        // start polling the API for device events or to reconnect to API (in the event of connection failure)...
    var run = setInterval(pollDeviceEventsOrReconnect, pollRate);

    //replace with the CCP URL for the current Amazon Connect instance
    var ccpUrl = "https://coachnet.awsapps.com/connect/ccp#/";

    connect.core.initCCP(containerDiv, {
        ccpUrl: ccpUrl,        
        loginPopup: true,         
        softphone: {
            allowFramedSoftphone: true
        }
    });


        connect.agent(function (agent) {
            agent.getAgentStates().filter(function(state) {
                if(state.name === "Available"){
                    agentStateCollection.Available = state;
                }
                else if(state.name === "Offline"){
                    agentStateCollection.Offline = state;	
                }
            });           
        });


    connect.contact(subscribeToContactEvents);  
    

    function subscribeToContactEvents(contact) {
        window.myCPP.contact = contact;
        activeCall = contact;
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
       
        
        contact.onEnded(function (contact) {
            appendAmazonLog("contact.onEnded, inbound = " + contact.isInbound());
                clearContactAttribute();
                activeCall = null;
                inbound = false;
                plantronicsOff();
            });        

         contact.onConnected(function (contact) {
             appendAmazonLog("contact.onConnected, inbound = " + contact.isInbound());
                inbound = contact.isInbound();
                if (inbound)
                {
                    plantronicsOn(); // incoming call was answered in GUI
                }
                else
                {
                    // no action, outgoing call audio already on at onConnecting
                }
            });
        contact.onConnecting(function (contact) {
             appendAmazonLog("contact.onConnecting, inbound = " + contact.isInbound());
                inbound = contact.isInbound();
                if (inbound)
                {
                    plantronicsRing(); // incoming call
                }
                else
                {
                    plantronicsOn(); // outgoing call
                }
            });
    }

        // New 27th Oct 2017 handle QD events to set agent availability
    function changeAgentState(nextState){
            connect.agent(function(agent) {
                agent.setState(nextState, {
                    success: function() { 
                        appendAmazonLog("changeAgentState success, nextState = " + nextState.name);
                    },
                    failure: function() { 
                        appendAmazonLog("changeAgentState fail, was trying to set nextState = " + nextState.name) 
                    }
                });
            });
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

// &  if (['program', 'IVR', 'Language','callback'].indexOf(key) >= 0)
    function updateContactAttribute(msg){
        var tableRef = document.getElementById('attributesTable');      
        for (var key in msg) {
            if (msg.hasOwnProperty(key) && (['program', 'IVR', 'Language','callback'].indexOf(key) >= 0)) {
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


//---------------------Plantronics-----------

        function plantronicsRing()
        {
            // set as incomingcall (done in onConnecting for inbound)
            appendLog("<font color=\"#00FF00\">Initiating make call command, call id = " + callid.toString() + "</font>");

            spokes.Plugin.incomingCall(plugin_name, getCallId(callid), getContact("Dummy Contact"), "Unknown", "ToHeadset", function (result) {
                showCallStatus(result);
            });
        }
        
        function plantronicsOn()
        {
            if (inbound)
            {
                // set as answered (done in onConnected for inbound)
                appendLog("<font color=\"#00FF00\">Answering call command, call id = " + callid.toString() + "</font>");

                spokes.Plugin.answerCall(plugin_name, getCallId(callid), function (result) {
                    showCallStatus(result);
                });                
            }
            else
            {
                // set as outgoingcall (done in onConnecting for outBound)
                appendLog("<font color=\"#00FF00\">Initiating make call command, call id = " + callid.toString() + "</font>");

                spokes.Plugin.outgoingCall(plugin_name, getCallId(callid), getContact("Dummy Contact"), "ToHeadset", function (result) {
                    showCallStatus(result);
                });
            }
        }
        
        function plantronicsOff()
        {
            appendLog("<font color=\"#00FF00\">Ending call, call id = " + callid.toString() + "</font>");
            spokes.Plugin.terminateCall(plugin_name, getCallId(callid), function (result) {
                showCallStatus(result);
            });
        }
        


        // Convenience functions to create call and contact structures used for IncomingCall/OutgoingCall functions
        function getCallId(callid) {
            return new SpokesCallId({ Id: '' + callid } );
        }

        function getContact(contactname) {
            return new SpokesContact({ Name: contactname });
        }        
        
        function getTime() {
            var d = new Date();
            var n = d.toLocaleTimeString();
            return n;
        }
        
        // displays status of call commands
        function showCallStatus(result, toJson) {
            if (result.isError) {
                appendLog("Error: " + result.Err.Description);
            } else {
                if (toJson) appendLog(JSON.stringify(result.Result))
                else appendLog("Success.");
            }
        };

        function appendLog(str) {
            console.log(getTime() + " " + str);
        }

        function appendAmazonLog(str) {
            console.log(getTime() + " " + str);
        }
        
        function connectToPlantronics() {
            // Connect to the Plantronics REST API
            spokes = new Spokes("https://127.0.0.1:32018/Spokes");

            // get info about attached device (if any)
            spokes.Device.deviceInfo(function (result) {
                if (!result.isError) {
                    if (result.Result /*[0]*/ != null) {
                        // Log Spokes active device found (first in list returned, index 0)
                        appendLog("Device found = " + result.Result /*[0]*/.ProductName + ", id = " + result.Result /*[0]*/.Uid);

                        deviceAttached = true;

                        // attach to the device, provide a callback function for the result
                        spokes.Device.attach(result.Result /*[0]*/.Uid, deviceAttachedCallback);
                    } else {
                        appendLog("Error: Device was null on connecting to Spokes. Is there a Plantronics device connected?");
                        deviceAttached = false;
                    }
                    pollRate = 2000; // waiting for device events now, force faster polling rate to start now (if applicable)
                    if (previousPollRate == 10000) {
                        var previousPollRate = 2000;
                        // start polling the device and call state events...
                        var run = setInterval(pollDeviceEventsOrReconnect, pollRate);
                    }
                } else {
                    if (result.Err.Description === "There are no supported devices") {
                        appendLog("Please attach a Plantronics headset to the PC.");
                    }
                    else
                    { 
                        appendLog("Error connecting to Plantronics Hub. (Have you installed and run Plantronics Hub from <a href=\"http://www.plantronics.com/software\" target=\"_new\">www.plantronics.com/software</a>, or " +
                            "are you Firefox user and getting \"Error connecting to Plantronics Hub.\"? If so visit this URL: <a href=\"https://127.0.0.1:32018/Spokes/DeviceServices/Info\" target=\"_new\">" +
                            "https://127.0.0.1:32018/Spokes/DeviceServices/Info</a> and click Advanced > Add Exception... to add a security exception to allow the connection.");
                        pollRate = 10000; // slow down polling rate while we are waiting for Hub to be running
                    }
                }
            });
        }

        //Callback to receive result of device attach. If successful register a plugin (Plantronics API application session)
        function deviceAttachedCallback(session) {
            if (session.isError || !spokes.Device.isAttached) {
                appendLog("Session Registration Error");
                deviceAttached = false;
                disconnectFromPlantronics();
            } else {
                appendLog("Session ID: " + session.Result);

                registerPlugin(); // register a plugin (Plantronics API application session)
            }
        }

        function setPluginActive()
        {
            //Set plugin active status to true
            spokes.Plugin.isActive(plugin_name, true, function (result) {
                if (!result.isError) {
                    // plugin registered and active. Show UI.
                    plugin_registered = true;
                    appendLog("Plugin \"" + plugin_name + "\" registered successfully.");
                } else {
                    appendLog("Error checking if plugin is active: " + result.Err.Description);
                }
            });
        }

        // Register a Spokes Plugin (Plantronics API application session) to get access to Call Services, Device and Call events
        function registerPlugin() {
            if (!plugin_registered) {
                spokes.Plugin.register(plugin_name, function (result) {
                    if (!result.isError) {
                        setPluginActive();
                    } else {
                        appendLog("Info: registering plugin: " + result.Err.Description);
                        if (result.Err.Description === "Plugin exists")
                        {
                            setPluginActive();
                        }
                        else
                        {
                            deviceAttached = false;
                            disconnectFromPlantronics();
                        }
                    }
                });
            }
        }

        // Unregister Spokes plugin (Plantronics API application session)
        function unregisterPlugin() {
            spokes.Plugin.unRegister(plugin_name);
            plugin_registered = false;
            appendLog("Plugin un-registered.");
        }

        // Cleanup the Plantronics REST API
        function disconnectFromPlantronics() {
            unregisterPlugin();
            spokes.Device.release(function (result) {
                if (!result.isError) {
                    appendLog("Released device");
                } else {
                    appendLog("Error releasing device");
                }
                appendLog("Disconnected from Spokes");
            });
        }

        // Function to perform device and call event polling if we are connected to Hub, or else attempt to reconnect to Hub
        function pollDeviceEventsOrReconnect() {
            // supports variable poll rate, 2000ms waiting for a device, 10000ms waiting for Hub to be running
            if (previousPollRate != pollRate) {
                clearInterval(run);
                previousPollRate = pollRate;
                run = setInterval(pollDeviceEventsOrReconnect, pollRate); 
            }
            if (spokes == null || !deviceAttached || !spokes.Device.isAttached) {
                appendLog("-- POLLING FOR HUB / DEVICE RE-ATTACH --");
                connectToPlantronics();
                return;
            }

            // Poll for device events
            // informs us of a variety of Plantronics device state changes
            spokes.Device.events(
                function (result) {
                    if (result.isError) {
                        appendLog("Error polling for device events: " + result.Err.Description);
                        if (result.Err.Description === "No response.  Server appears to be offline.") {
                            pollRate = 10000;
                            appendLog("changing POLL RATE to " + pollRate);
                        }
                        if (result.Err.Description === "Invalid session id" ||
                            result.Err.Description === "Empty session id" ||
                            result.Err.Description === "No response.  Server appears to be offline.") {
                            appendLog("-- ** DEVICE DETACHED / SESSION INVALID ** --");
                            deviceAttached = false;
                            disconnectFromPlantronics();
                        }
                    } else {
                        // display list of events collected from REST service
                        if (result.Result.length > 0) {
                            for (var i = 0; i < result.Result.length; i++) {
                                appendLog("<font color=\"#0000FF\">Device Event: " + result.Result[i].Event_Log_Type_Name + ", " + print_r(result.Result[i]) + "</font>");
                                
                                // New 27th Oct 2017 handle QD events to set agent availability
                                if (result.Result[i].Event_Id == 32)
                                {
                                    changeAgentState(agentStateCollection.Offline);
                                    appendLog("QD was disconnected");
                                }
                                else if (result.Result[i].Event_Id == 31)
                                {
                                    appendLog("QD was connected");
                                    changeAgentState(agentStateCollection.Available);
                                }
                            }
                        }
                    }
                });

            // Poll for call state events (call control events)
            // informs us the calling state has changed, for example user as answered/terminated a call
            // using headset buttons - this event should be used in my app to actually connect/terminate the call!
            spokes.Plugin.callEvents(plugin_name,
                function (result) {
                    if (result.isError) {
                        appendLog("Error polling for call events: " + result.Err.Description);
                        if (result.Err.Description === "No response.  Server appears to be offline.") {
                            pollRate = 10000;
                            appendLog("changing POLL RATE to " + pollRate);
                        }
                        if (result.Err.Description === "Invalid session id" ||
                            result.Err.Description === "Empty session id" ||
                            result.Err.Description === "No response.  Server appears to be offline.") {
                            appendLog("-- ** DEVICE DETACHED / SESSION INVALID ** --");
                            deviceAttached = false;
                            disconnectFromPlantronics();
                        }
                    } else {
                        // display list of events collected from REST service
                        if (result.Result.length > 0) {
                            for (var i = 0; i < result.Result.length; i++) {
                                appendLog("<font color=\"#0000FF\">Call Event: " + result.Result[i].Event_Log_Type_Name + ", " + print_r(result.Result[i]) + "</font>");
                                // Workout the actual call state and call id in question
                                var callState = SessionCallState.Lookup[result.Result[i]["Action"]];
                                var callId = result.Result[i]["CallId"]["Id"];
                                appendLog("CallState: " + callState + ", Call ID: " + callId);
                                
                                if (callId == callid)
                                {
                                    if (callState === "AcceptCall")
                                    {
                                        if (activeCall!=null)
                                        {
                                            activeCall.accept({
                                               success: function() { 
                                                    appendLog("Successfully answered Amazon Call");
                                               },
                                               failure: function() { 
                                                    appendLog("Failed to answer Amazon Call");
                                               }
                                            });                                    
                                        }
                                    }
                                    else if (callState === "TerminateCall")
                                    {
                                        if (activeCall!=null)
                                        {
                                            appendLog("Attempt to terminate Amazon Call...");
                                            activeCall.getInitialConnection().destroy();
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
        }

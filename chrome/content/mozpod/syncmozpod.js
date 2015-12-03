/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozPod.
 *
 * The Initial Developer of the Original Code is
 *     Robert Accettura <robert@accettura.com>.
 * Portions created by the Initial Developer are Copyright (C) 2004-2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     David Bienvenu
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const MOZPOD_ICON = "chrome://mozpod/skin/icons/icon.png";
const CONTROL_DIR = "iPod_Control";
const CONTACTS_DIR = "Contacts";
const CALENDARS_DIR = "Calendars";
const FILENAME_PREFIX = "moz-";
const VCARD_FILENAME_EXT = ".vcf";
const ICS_FILENAME_EXT = ".ics";

var mozpod = null;

// locale
var strBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]
                                 .getService(Components.interfaces.nsIStringBundleService);
var strbundle = strBundleService.createBundle("chrome://mozpod/locale/mozpod.properties");
var stringArray = Array(strbundle.GetStringFromName("iPodDetected"),
                        strbundle.GetStringFromName("performingSync"),
                        strbundle.GetStringFromName("iPodSyncSuccess"),
                        strbundle.GetStringFromName("iPodUpToDate")
);

// Events
window.addEventListener("load", startup, false);
window.addEventListener("unload", shutdown, false);


/**
 * Startup
 *
 * Creates a new mozPod object and opens wizard if necessary
 **/
function startup() {
    mozpod = new MozPod()
    mozpod.startup();

    // Check if we need to init a wizard
    if(!getBoolPref("hideWizard", false)){
        openWizard();
    }
}

/**
 * Shutdown
 *
 * Destroys mozPod object;
 **/
function shutdown() {
    mozpod.shutdown();
    mozpod = null;
}


/**
 * Open Wizard
 *
 * Launches the wizard/tutorial (normally on first run).
 **/
function openWizard() {
    window.openDialog("chrome://mozpod/content/wizard.xul", "",
                      "chrome,centerscreen,dialog,resizable=no,width=535,height=442",null);
}


///////////// mozPod Object /////////////////////
function MozPod() {}

MozPod.prototype = {

    // timeout for detecting and syncing iPod.
    _iPodScanner:                      null,

    // prevents infinate syncs by detecting iPod once.
    _iPodLock:                         false,

    // directory location for contacts
    _contactDir:                       null,

    // directory location for calendars
    _calendarDir:                      null,

    // Lets us know when we are done with sync.
    _syncDone:                         false,

    // Let us know if we are in the middle of a sync.
    _syncInProgress:                   false,

    // Lets us know if calsync is done
    _calendarSyncCount:                0,

    // Lets us know if calsync is done
    _calendarSyncBurstInterval:        4,

    // Is mozcal enabled?  Defaults to false until proven otherwise
    _hasMozCal:                        false,

    // Is mozAB enabled?  Defaults to false until proven otherwise
    _hasMozAB:                         false,

    // Sync for calendar is done?
    _calendarSyncDone:                 false,

    // Sync for contact is done?
    _contactSyncDone:                  false,


    /**
     *  Startup process to initiate iPod Scanning
     **/
    startup: function() {

        // We delay our first detection while the load process pegs
        // the CPU.  After that we monitor for an iPod at an interval.
        var startSyncDelay = getCharPref("startSyncDelay", 10) * 1000;
        var syncInterval = getCharPref("syncInterval", 2) * 1000;

        // Check if we have a calendar
        if(this._hasMozCal == false){
            this._checkForCalendar();
        }

        // Check if we have an address book
        if(this._hasMozAB == false){
            this._checkForAB();
        }

        // We load the few strings we use here, because we don't want
        // to do it in doDetectNSync where it will happen constantly.
        this._contactSyncBurstInverval = getCharPref("syncBurstInverval", 25);
        this._iPodScanner = setTimeout(function() { setInterval("mozpod._doDetectNSync()", syncInterval); }, startSyncDelay);
    },


    /**
     *  Shutdown process to terminate iPod Scanning
     **/
    shutdown: function() {
        clearInterval(this._iPodScanner);
        this._iPodScanner = null;
    },


    /**
     *  Detects for an iPod, and performs sync if one found.  Also
     *  manages alerts.
     **/
    _doDetectNSync : function() {
        if(!this._detectIpod()){

            // now set it to false so next time we connect, we sync.
            this._iPodLock = false;
            this._hasMozCal = false,
            this._hasMozAB = false;
            this._calendarSyncDone = false;
            this._contactSyncDone = false;
            this._syncDone = false;
            return true;
        }

        // Only attempt a sync if the lock is set to false.
        // this prevents infante sync loops.
        if(!this._iPodLock) {

            if(this._syncDone) {
                this._iPodLock = true;
            }

            // Note: the following code exec's sync() only 1x
            // but will keep checking to see if it's done so it can
            // clean up and let the user know it's done
            if(!this._syncDone && !this._syncInProgress) {
                // it's offically gunna happen
                this._syncInProgress = true;

                // let the user know we are doing a sync
                this._alert(stringArray[0], stringArray[1]);

                // clear mozCards unless user says otherwise
                if(getBoolPref('clearMozPod', true)) {
                    this._clearMozCards(this._contactDir);
                    this._clearMozCalendars(this._calendarDir);
                }

            }
            if(!this._syncDone) {
                // The actual sync
                this._sync();
            }
            if (this._syncDone && this._syncInProgress) {

                // Were done, so set this to false
                this._syncInProgress  = false;

                // delay putting this up for 2 seconds, so it's less likely to overlap the detection alert
                setTimeout(function () {mozpod._alert(stringArray[2], stringArray[3]); }, 3000);
            }
        }
        return true;
    },


    /**
     * Alert Panel
     * param title The title of the alert panel.
     * param message The message in the alert panel.
     **/
    _alert: function(title, message) {

        // XXX THIS NEEDS TO BE ADJUSTED TO USE title and message params!
        // Let user know it's done
//         if (navigator.platform.indexOf("Mac") != -1 ||
//             getBoolPref('showFinishAlert', true))
//         {
//             window.openDialog("chrome://mozpod/content/alert.xul", "",
//                    "chrome,centerscreen,dialog,resizable=no,width=350,height=120",
//                    null);
//
//         }

        //http://lxr.mozilla.org/mozilla/source/toolkit/components/alerts/public/nsIAlertsService.idl#44
        try {
            var alerts = Components.classes["@mozilla.org/alerts-service;1"]
                                   .getService(Components.interfaces.nsIAlertsService);
            alerts.showAlertNotification(MOZPOD_ICON, title, message, false, '', null);
        } catch(e) {};
        return;
    },


    /**
     * Clears all mozpod cards out of the iPod's contactDir
     * param contactDir Directory to clean out on remote device.
     **/
    _clearMozCalendars: function(calendarDir) {
        var volumesdir = Components.classes["@mozilla.org/file/local;1"]
                                   .createInstance(Components.interfaces.nsILocalFile);
        volumesdir.initWithPath(calendarDir);
        var entries = volumesdir.directoryEntries;
        while(entries.hasMoreElements()) {
            var entry = entries.getNext();
            if (entry.QueryInterface(Components.interfaces.nsIFile).leafName.substring(0,4) == FILENAME_PREFIX) {
                entry.remove(false);
            }
        }
        return;
    },


    /**
     * Clears all mozpod cards out of the iPod's contactDir
     * param contactDir Directory to clean out on remote device.
     **/
    _clearMozCards: function(contactDir) {
        var volumesdir = Components.classes["@mozilla.org/file/local;1"]
                                   .createInstance(Components.interfaces.nsILocalFile);
        volumesdir.initWithPath(contactDir);
        var entries = volumesdir.directoryEntries;
        while(entries.hasMoreElements()) {
            var entry = entries.getNext();
            if (entry.QueryInterface(Components.interfaces.nsIFile).leafName.substring(0,4) == FILENAME_PREFIX) {
                entry.remove(false);
            }
        }
        return;
    },


    /**
     * Detects for an iPod, and finds it's contact directory.
     **/
    _detectIpod: function() {
        var volumes = new Array();

        // Init foundIt to false
        var foundIt = false;

        // Windows Detection
        if(navigator.platform.indexOf("Win") != -1) {

            // iPod must appear after C, since C is the boot drive
            volumes = Array('D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P');
            var controlDir = ":\\" + CONTROL_DIR + "\\";
            var contactDir = ":\\" + CONTACTS_DIR + "\\";
            var calendarDir = ":\\" + CALENDARS_DIR + "\\";
        }

        // Macintosh Detection
        else if (navigator.platform.indexOf("Mac") != -1) {

            /* Mac Scheme is a little different.  We get the list of directories in /Volumes
             * And we enumerate through it.  This may be a bit slower due to the use of
             * nsILocalFile and nsIFile, but it's the best solution for now.
            */
            var volumesdir = Components.classes["@mozilla.org/file/local;1"]
                                       .createInstance(Components.interfaces.nsILocalFile);
            volumesdir.initWithPath("/Volumes");
            var entries = volumesdir.directoryEntries;
            while(entries.hasMoreElements()) {
                var entry = entries.getNext();
                entry.QueryInterface(Components.interfaces.nsIFile);
                volumes.push(entry.path);
            }
            var controlDir = "/" + CONTROL_DIR + "/";
            var contactDir = "/" + CONTACTS_DIR + "/";
            var calendarDir = "/" + CALENDARS_DIR + "/";
        }

        // Die if we don't support you
        else {
           volumesdir = null;
           return false;
        }

        for (var  i= 0; i < volumes.length; i++) {
            // First check if the control directory exists, if so it's likely an iPod
            var iPodControlDirCheck = Components.classes["@mozilla.org/file/local;1"].createInstance();
            if (iPodControlDirCheck instanceof Components.interfaces.nsILocalFile) {

                iPodControlDirCheck.initWithPath(volumes[i]+controlDir);
                if (iPodControlDirCheck.exists()) {

                    // So we know we have an iPod.  Now to see if it supports contacts:
                    var iPodHasContactsDir = Components.classes["@mozilla.org/file/local;1"].createInstance();
                    if (iPodHasContactsDir instanceof Components.interfaces.nsILocalFile){

                        iPodHasContactsDir.initWithPath(volumes[i]+contactDir);
                        if(iPodHasContactsDir.exists()){
                            this._contactDir = volumes[i]+contactDir;
                            foundIt = true;
                        }

                    }

                    // Now to see if it supports calendars:
                    var iPodHasCalendarsDir = Components.classes["@mozilla.org/file/local;1"].createInstance();
                    if (iPodHasCalendarsDir instanceof Components.interfaces.nsILocalFile){

                        iPodHasCalendarsDir.initWithPath(volumes[i]+calendarDir);
                        if(iPodHasCalendarsDir.exists()){
                            this._calendarDir = volumes[i]+calendarDir;
                            foundIt = true;
                        }

                        // Clear out this stuff
                        iPodControlDirCheck = null;
                        iPodHasContactsDir = null;
                        iPodHasCalendarsDir = null;
                        volumesdir = null;

                        // If we found either contacts or calendar, we can return true
                        if(foundIt){
                            return true;
                        }
                    }
                }
            }
        }

        // If we got here, we didn't find an iPod

        // Null these out so if they were previously detected they don't taint the future
        this._contactDir = null;
        this._calendarDir = null;
        return false;
    },


    /**
     * Perform Sync
     **/
    _sync: function(){

        // Try and sync calendar
        if(this._calendarDir != null // we have a calendar directory
           &&  this._hasMozCal == true // moz app has a calendar
           && this._calendarSyncDone == false) // and calendar sync is not completed already
        {
            this._calendarSync();
        } else {
            this._calendarSyncDone = true;
        }

        // Try and sync contacts
        if(this._contactDir != null // we have a contact directory
           && this._hasMozAB == true // moz app has a address book
           && this._contactSyncDone == false) // and contact sync is not completed already
        {
            this._contactSync();
        } else {
            this._contactSyncDone = true;
        }

        if(this._calendarSyncDone == true && this._contactSyncDone == true){
            this._syncDone = true;
        }

        return true;
    },


    /**
     * Perform Calendar Sync
     **/
    _calendarSync: function()
    {
        var aItems;
        var icssrv;
        var filename;
        var calComp;
        var calendarDir = this._calendarDir;

        const calendarManager = Components.classes["@mozilla.org/calendar/manager;1"]
                                          .getService(Components.interfaces.calICalendarManager);
        var calendars = calendarManager.getCalendars({});

        var calendarSyncBurstCounter = 1;
        for (this._calendarSyncCount; this._calendarSyncCount < (calendars.length); this._calendarSyncCount++){

            var itemArray = [];

            var getListener = {
                onOperationComplete: function(aCalendar, aStatus, aOperationType, aId, aDetail){
                    icssrv = Components.classes["@mozilla.org/calendar/ics-service;1"]
                                        .getService(Components.interfaces.calIICSService);
                    calComp = icssrv.createIcalComponent("VCALENDAR");
                    calComp.version = "2.0";
                    calComp.prodid = "-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN";

                    for each (item in itemArray) {
                        calComp.addSubcomponent(item.icalComponent);
                    }

                    filename = calendarDir + FILENAME_PREFIX + aCalendar.name + ICS_FILENAME_EXT;

                    _fileOutputStream(filename, calComp.serializeToICS());

                },
                onGetResult: function(aCalendar, aStatus, aItemType, aDetail, aCount, aItems){
                    if (!Components.isSuccessCode(aStatus)) {
                        aborted = true;
                        return;
                    }
                    if (aCount) {
                        for (var i=0; i<aCount; i++) {
                            var itemCopy = aItems[i].clone();
                            itemArray.push(itemCopy);
                        }
                    }
                }
            };

            // the getListner is right above ^^^
            calendars[this._calendarSyncCount].getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS,
                                    0, null, null, getListener);

            // add another to the burst counter
            calendarSyncBurstCounter++;

            // If we met the max we can do per burst, lets leave... I'll be back!
            if(calendarSyncBurstCounter > this._calendarSyncBurstInterval){

                // incr. by hand since to aknowledge the current iteration
                this._calendarSyncCount++;

                return false;
            }

        }

        // Done!
        this._calendarSyncDone = true;

        return true;
    },


    _checkForCalendar: function(){
        try {
          if ("@mozilla.org/calendar/ics-service;1" in Components.classes) {
              this._hasMozCal = true;
              return true;
          }
        } catch(ex){}
        // must not have calendar
        this._hasMozCal = false;
        return false;
    },


    _checkForAB: function(){
        if ("@mozilla.org/addressbook;1" in Components.classes) {
            this._hasMozAB = true;
            return true;

        }

        // must not have calendar
        this._hasMozAB = false;
        return false;
    },


    /**
     * Perform Contact Sync
     **/
    _contactSync: function(){
        // XXX FIX THIS
        var type = 'INTERVAL';

        // Find all AB's
        // Thanks to David Bienvenu for helping us walk through the address book.
        var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                   .getService(Components.interfaces.nsIRDFService);
        var directory = rdfService.GetResource("moz-abdirectory://")
                                  .QueryInterface(Components.interfaces.nsIAbDirectory);

        var targets = directory.childNodes;
        var books = [];
        while (targets.hasMoreElements()){
            var abook = targets.getNext();
            if (abook instanceof Components.interfaces.nsIRDFResource){

                // Only use the abook if it's a mab.  No LDAP!
                var selectedABDirectory = abook.QueryInterface(Components.interfaces.nsIAbDirectory);

                if(selectedABDirectory instanceof Components.interfaces.nsIAbLDAPDirectory){
                    //alert('ldap');
                } else {
                    this._saveToAb(selectedABDirectory.childCards);
                }
            }
        }
        this._contactSyncDone = true;
        return true;
    },


    _saveToAb: function (aCards){
        try {
            var done = false;
            aCards.first();
        } catch(ex){}

        while (!done) {
            try {
                var next = aCards.currentItem();
            } catch (ex){}

            if (next) {
                var nextCard = next.QueryInterface(Components.interfaces.nsIAbCard);
                if (nextCard) {
                    var filename = this._generateVCardName(nextCard, this._contactDir);

                   /**********
                    * Until bug 221911 is fixed, we can't use this (easy method) because we don't get addresses
                    **********/
                    //var buffer = unescape(nextCard.convertToEscapedVCard());
                    var buffer = this._generateVCardData(nextCard);

                    // For some reason, Apple decided not to support putting mutiple vcard's in 1 file.  So we have to write a file for each.
                    // Hopefully Apple will fix this.  I submitted a bug with Apple (Problem ID: 3888777).
                    _fileOutputStream(filename, buffer);
                }
            }

            try {
                // Go to next card
                aCards.next();
            } catch (ex) {
                done = true;
            }
        }
        return true;
    },


    /**
     * Generates a filename for the vCard
     * @param card Card resource
     * @param contactDir Directory for vCard output
     **/
    _generateVCardName: function(card, contactDir){
        if (card.lastName && card.firstName) {
            var filename = card.lastName+", "+card.firstName;
        }
        else if (card.displayName) {
            var filename = card.displayName;
        }
        else if (card.company) {
            var filename =  card.company;
        }
        else {
            var filename = card.primaryEmail;
        }
        filename = contactDir + FILENAME_PREFIX + filename + VCARD_FILENAME_EXT;

        return filename;
    },


    /**
     * Generates the vCard 3.0 format
     * @param card Card resource
     **/
    _generateVCardData: function(card){
        /**********
        * And so we begin outputting a vcard.  It should be noted this is "3.0", though it very "smart".
        * A few minutes looking at this, and you'll know why I give this warning.
        * note we _vCardEscape() all data, because we can't have , or ; in our strings!
        * http://www.ietf.org/rfc/rfc2426.txt
        **********/
        var buffer = "";
        buffer += "BEGIN:VCARD"+'\n';
        buffer += "VERSION:3.0"+'\n';

        // FN
        buffer += "FN:"

        if (card.displayName){
            buffer += this._vCardEscape(card.displayName)+'\n';
        }
        else if (card.firstName || card.lastName){
            buffer += this._vCardEscape(card.firstName)+" "+this._vCardEscape(card.lastName)+'\n';
        }
        else {
            buffer += this._vCardEscape(card.company)+'\n';
        }

        // Name
        if (card.firstName || card.lastName){
            buffer += "N:"+this._vCardEscape(card.lastName)+";"+this._vCardEscape(card.firstName)+'\n';
        }

        // NickName
        if(card.nickName){
            buffer += "NICKNAME:"+this._vCardEscape(card.nickName)+'\n';
        }

        // ORG
        if (card.company){
            buffer += "ORG:"+this._vCardEscape(card.company);

            // add dept if we have it.
            if(card.department){
                buffer += ";"+this._vCardEscape(card.department);
            }
            buffer += '\n';
        }
        // ADR
        if (card.workAddress2 || card.workAddress || card.workCity || card.workState || card.workZipCode || card.workCountry){
            buffer += "ADR;TYPE=WORK:"+this._vCardEscape(card.workAddress2)+";;"+this._vCardEscape(card.workAddress)+";"+this._vCardEscape(card.workCity)+";"+this._vCardEscape(card.workState)+";"+this._vCardEscape(card.workZipCode)+";"+this._vCardEscape(card.workCountry)+'\n';
        }

        if (card.homeAddress2 || card.homeAddress || card.homeCity || card.homeState || card.homeZipCode || card.homeCountry){
            buffer += "ADR;TYPE=HOME:"+this._vCardEscape(card.homeAddress2)+";;"+this._vCardEscape(card.homeAddress)+";"+this._vCardEscape(card.homeCity)+";"+this._vCardEscape(card.homeState)+";"+this._vCardEscape(card.homeZipCode)+";"+this._vCardEscape(card.homeCountry)+'\n';
        }

        // EMAIL
        if (card.primaryEmail){
            buffer += "EMAIL;TYPE=INTERNET,PREF:"+this._vCardEscape(card.primaryEmail)+'\n';
        }
        if (card.secondEmail){
            buffer += "EMAIL;TYPE=INTERNET:"+this._vCardEscape(card.secondEmail)+'\n';
        }

        // TITLE
        if (card.jobTitle){
            buffer += "TITLE:"+this._vCardEscape(card.jobTitle)+'\n';
        }

        // TEL TYPE=WORK
        if (card.workPhone){
            buffer += "TEL;TYPE=WORK:"+this._vCardEscape(card.workPhone)+'\n';
        }

        // TEL TYPE=FAX
        if (card.faxNumber){
            buffer += "TEL;TYPE=FAX:"+this._vCardEscape(card.faxNumber)+'\n';
        }

        // TEL TYPE=PAGER
        if (card.pagerNumber){
            buffer += "TEL;TYPE=PAGER:"+this._vCardEscape(card.pagerNumber)+'\n';
        }

        // TEL TYPE=HOME
        if (card.homePhone){
          buffer += "TEL;TYPE=HOME:"+this._vCardEscape(card.homePhone)+'\n';
        }

        // TEL TYPE=CELL
        if (card.cellularNumber){
          buffer += "TEL;TYPE=CELL:"+this._vCardEscape(card.cellularNumber)+'\n';
        }

        // NOTE
        if (card.notes){
          buffer += "NOTE:"+this._vCardEscape(card.notes)+'\n';
        }

        // URL
        if (card.webPage1){
            buffer += "URL:"+this._vCardEscape(card.webPage1)+'\n';
        }
        buffer += "END:VCARD";
        return buffer;
    },


    /**
     * Escapes str for vCard safe results
     * @param str string to escape
     **/
    _vCardEscape: function(str){
        str = str.replace(/\n/g, '\\n')
        str = str.replace('/,/gi', '\,');
        return str.replace('/;/gi', '\;');
    },


    /**
     * Just because!
     **/
    _dummy: function(){
        alert("Walker told me I have AIDS");
        return true;
    }
};

/**
 * Outputs a buffer to file
 * @param path Path to file to output.
 * @param buffer Buffer to output to file.
 **/
function _fileOutputStream(path, buffer){
//         try {
//             var charset = "UTF-8"; // Can be any character encoding name that Mozilla supports
//             var file = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
//                                  .createInstance(Components.interfaces.nsIConverterOutputStream);
//             file.init(this._nsLocalFile(path), charset, 0, 0x0000);
//             file.writeString(buffer);
//             file.close();
//         } catch(e){
        // file is nsIFile, data is a string
        var file = Components.classes["@mozilla.org/network/file-output-stream;1"]
                             .createInstance(Components.interfaces.nsIFileOutputStream);
        // use 0x02 | 0x10 to open file for appending.
        file.init(this._nsLocalFile(path), 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
        file.write(buffer, buffer.length);
        file.close();
//         }
    return true;
}


/**
 * Creates file pointer
 * @param path path to directory
 **/
// thanks to bz for the heads up here
function _nsLocalFile(path) {
    var file = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
    try {
        file.initWithPath(path);
        return file;
    } catch(e){};
    return false;
}

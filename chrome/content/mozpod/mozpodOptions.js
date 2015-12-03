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

const START_SYNC_DELAY_DEFAULT = 10;
const SYNC_INTERVAL_DEFAULT = 3;
const SYNC_BURST_INTERVAL_DEFAULT = 25;
const CLEAR_MOZ_POD_DEFAULT = true;
const IGNORE_COLLECTED_DEFAULT  = false;
const SHOW_FINISH_ALERT_DEFAULT  = false;

function loadPrefsDialog()
{
    // Load and fill based on prefs
    document.getElementById('startSyncDelay').value =     getCharPref("startSyncDelay", START_SYNC_DELAY_DEFAULT);
    document.getElementById('syncInterval').value =       getCharPref("syncInterval", SYNC_INTERVAL_DEFAULT);
    document.getElementById('syncBurstInverval').value =  getCharPref("syncBurstInverval", SYNC_BURST_INTERVAL_DEFAULT);
    document.getElementById('clearMozPod').checked =      getBoolPref("clearMozPod", CLEAR_MOZ_POD_DEFAULT);
    document.getElementById('ignoreCollected').checked =  getBoolPref("ignoreCollected", IGNORE_COLLECTED_DEFAULT);
    // For the Mac, this option is true by default, so don't let the user touch it.
    if (navigator.platform.indexOf("Mac") != -1)
    {
        document.getElementById('showFinishAlert').checked =  true;
        document.getElementById('showFinishAlert').disabled = true;
    }
    else {
        document.getElementById('showFinishAlert').checked =  getBoolPref("showFinishAlert", SHOW_FINISH_ALERT_DEFAULT);
    }
    return true;
}

function savePrefsDialog()
{
    // Load and fill based on prefs
    var startSyncDelay = document.getElementById('startSyncDelay').value;
    setCharPref('startSyncDelay', startSyncDelay);

    var syncInterval = document.getElementById('syncInterval').value;
    setCharPref('syncInterval', syncInterval);

    var syncBurstInverval = document.getElementById('syncBurstInverval').value;
    setCharPref('syncBurstInverval', syncBurstInverval);

    var clearMozPod = document.getElementById('clearMozPod').checked;
    setBoolPref('clearMozPod', clearMozPod);

    var ignoreCollected = document.getElementById('ignoreCollected').checked;
    setBoolPref('ignoreCollected', ignoreCollected);

    // For the Mac, this option is true by default, so don't let the user touch it.
    if (navigator.platform.indexOf("Mac") == -1)
    {
        var showFinishAlert = document.getElementById('showFinishAlert').checked;
        setBoolPref('showFinishAlert', showFinishAlert);
    }
    return true;
}

function defaults()
{
    document.getElementById('startSyncDelay').value =     START_SYNC_DELAY_DEFAULT;
    document.getElementById('syncInterval').value =       SYNC_INTERVAL_DEFAULT;
    document.getElementById('syncBurstInverval').value =  SYNC_BURST_INTERVAL_DEFAULT;
    document.getElementById('clearMozPod').checked =      CLEAR_MOZ_POD_DEFAULT;
    document.getElementById('ignoreCollected').checked =  IGNORE_COLLECTED_DEFAULT;
    // For the Mac, this option is true by default.
    if (navigator.platform.indexOf("Mac") != -1)
    {
        document.getElementById('showFinishAlert').checked =  true;
    }
    else {
        document.getElementById('showFinishAlert').checked =  SHOW_FINISH_ALERT_DEFAULT;
    }
    return true;
}
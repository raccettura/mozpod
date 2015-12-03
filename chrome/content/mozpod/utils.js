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

const MOZPOD_PREF_BRANCH = "extensions.mozpod.";

var gPrefBranch2;

/**
 * Pref code is from reporter extension thanks to mconnor
 **/

/**
 * Gets Preference Branch
 **/
function getPrefBranch()
{
    if(!gPrefBranch2)
    {
        gPrefBranch2 = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService)
                                .getBranch(MOZPOD_PREF_BRANCH);
    }
    return gPrefBranch2;
}

/**
 * Gets Bool Pref
 * @param prefname Gets value of this bool pref
 * @param aDefault What to return if we can't get the pref
 **/
function getBoolPref(prefname, aDefault)
{
    try
    {
        var prefs = getPrefBranch();
        return prefs.getBoolPref(prefname);
    }
    catch(ex)
    {
        return aDefault;
    }
}

/**
 * Gets Char Pref
 * @param prefname Gets value of this char pref
 * @param aDefault What to return if we can't get the pref
 **/
function getCharPref(prefname, aDefault)
{
    try {
        var prefs = getPrefBranch();
        return prefs.getCharPref(prefname);
    }
    catch(ex)
    {
        return aDefault;
    }
}

function setCharPref(prefname, aValue) {
  try {
    var prefs = getPrefBranch();
    prefs.setCharPref(prefname, aValue);
    return true;
  }
  catch(ex) {
    return false;
  }
}

function setBoolPref(prefname, aValue)
{
    try
    {
      var prefs = getPrefBranch();
      prefs.setBoolPref(prefname, aValue);
      return true;
    }
    catch(ex) {}
      return false;
}

function openURL(aURL)
{
    var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService(Components.interfaces
                                                    .nsIIOService);
    aURL = ioservice.newURI(aURL, null, null).spec;

    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService)
                        .newURI(aURL, null, null);

    var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                 .getService(Components.interfaces
                                                       .nsIExternalProtocolService);
    protocolSvc.loadUrl(uri);
    return;
}
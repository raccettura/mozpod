#!/bin/sh
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is mozPod.
#
# The Initial Developer of the Original Code is
#     Robert Accettura <robert@accettura.com>.
# Portions created by the Initial Developer are Copyright (C) 2005
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

#### CLEAN ####
rm -r ./dist

#### SETUP dist ####
mkdir ./dist
mkdir ./dist/build
mkdir ./dist/build/chrome

#### Make .jar ####
#cd into the directory for zip structure purposes (and being to lazy to read the zip manual)
cd chrome
zip -0 ./mozpod.jar \
-r ./content \
./locale \
./skin \
-x \*CVS\* \
-x Thumbs.db


# then move it into the build directory
mv mozpod.jar ../dist/build/chrome/mozpod.jar
# get back out into the root
cd ..

#### Make .xpi ####
# copy install rdf into build directory
cp -R defaults ./dist/build/defaults
cp install.rdf ./dist/build/install.rdf
cd ./dist/build/
zip -6 ./mozpod.xpi -r ./chrome/ ./install.rdf
mv mozpod.xpi ../
cd ../../

#### Clean build dir ####
rm -r ./dist/build
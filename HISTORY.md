# CrackleSDK history
This file will contain current and previous changes to Crackle. Make sure to update this almost every commit! Do changes at the front of the list, create a new `##` heading for each day, and make a `#` for each new version. Check previous versions

---

# In development

## 2025-11-29
 * docs: add hooking tip to API.md
 * feat: hooking for menus, see API.md
 * docs: added docs for menu hooking
 * feat: added `scriptsMenu` menu hook
 * feat: added `snapMenu` menu hook
 * feat: added `paletteMenu` menu hook
 * feat: added functionality for loading mods on startup,
   for now manually modify this list until mod installing
   exists

## 2025-11-25
 * combine all files into one index.js file
 * add license comment to index.js
 * get name from id if not provided
 * require ID
 * added some comments/documentation to index.js
 * added conventional commits message to README.md

## 2025-11-13
 * fix README logo
 * updated README with contributing instructions
 * updated README to provide links to HISTORY.MD and LICENSE
 * added LICENSE, same from original CrackleSDK repo (before I pushed this copy)

## 2025-11-10
 * `categoryCreated` event to match `categoryCreating`
 
## 2025-11-09
 * better API doc
 * events - only `projectCreating` for now
 * new events:
    * `projectCreated`
    * `categoryCreating`
 * change `attachEventHandlers` to have the ide be passed in

## 2025-11-08
 * create HISTORY.md file like Snap!
 * helpers file not really needed - move to index.js
 * initial commit. most stuff copied from Snap!Mods, modifed for Crackle
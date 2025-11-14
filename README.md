# CrackleSDK
![Crackle Logo](doc/logo.png)

[History](HISTORY.md) | [License](LICENSE)

A modding framework for Snap!, made by [@tethrarxitet](https://forum.snap.berkeley.edu/u/tethrarxitet) and 
[@codingisfun2831t](https://forum.snap.berkeley.edu/u/codingisfun2831t).

# Loading in browser
For now, CrackleSDK does not have any pages for it on common browser extension stores. I do not know the process for Chrome, but on Firefox go to `about:debugging`, go to `This Firefox`, click `Load Temporary Add-on...` and select the `manifest.json` file in this directory. Now, whenever you launch Snap! you should see the new addon button.

# How to use
When launching Snap! with Crackle open, you should see a new button being added to the title bar:

![Snap! Topbar buttons, but with the new Addon button](doc/Buttons.png)

If you were to click on the addon button, you'll see this menu popup:

![Crackle Menu](doc/Menu.png)

Here is what each of those options do:

* `About Crackle...` - Display a dialog containing info about Crackle
* `Load mod from code...` - Load mod from direct code
* `Load mod from file...` - Load mod from a file on your computer
* `Manage loaded mods...` - Display a menu allowing you to see info or delete mods currently loaded

For mod creators, check out [the API documentation](doc/API.md) so you can make your own mods.

# Contributing
Contributes are welcome! Make sure that whenever you do a change, update the HISTORY.md file for later! Make sure for any new files you create, to include the LICENSE comment at the start:

```js
/*
    [file name] - [description]
    
    CrackleSDK - A modding framework for Snap!
    Copyright (C) 2025 CrackleSDK Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
```
Adjust `[file name]` and `[description]` for your file. We dont have much style guides, just make sure to put that comment at the start of any new files. If theres anything style-related thing in your pull request that any of us want you to change, we will just tell you.
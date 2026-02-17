# CrackleSDK
![Crackle Logo](doc/logo.png)

[History](HISTORY.md) | [License](LICENSE)

A modding framework for Snap!, made by [@tethrarxitet](https://forum.snap.berkeley.edu/u/tethrarxitet), [@codingisfun2831t](https://forum.snap.berkeley.edu/u/codingisfun2831t), and [@e016](https://forum.snap.berkeley.edu/u/d016).

# Loading in browser
For now, CrackleSDK does not have any pages for it on common browser extension stores, so you will have to load it manually for your browser. I haven't put it on any stores as it isnt in a good enough state yet..

## Firefox
Go to `about:debugging`, go to `This Firefox`, click `Load Temporary Add-on...` and select the `manifest.json` file in this directory. Now, whenever you launch Snap! you should see the new addon button.

## Chrome
First, go to [chrome://extensions/](chrome://extensions/). There should be a "Developer mode" options. Simply press that, and then go to the "Manage Extensions" option/There should be a "Load unpacked" button at the top left. Import your CrackleSDK folder in there, and see the results.

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
Contributes are welcome! Make sure that whenever you do a change, update the HISTORY.md file for later! We dont have much style guides, just make sure to put that comment at the start of any new files. If theres anything style-related thing in your pull request that any of us want you to change, we will just tell you.

Also, try to use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) format for your commits messages. It doesn't have to be perfect, just please use it.
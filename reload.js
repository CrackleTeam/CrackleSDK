/* 
    CrackleSDK - A modding framework for Snap!
    Copyright (C) 2025, developed by CrackleTeam

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

// it is very stupid that we need this, but we must to avoid the class defs
// making the browser just skip over this (because itll be a redefintion),
// but it works

// if __crackle__ already exists, reload the page (to avoid duplicates)
if (window.__crackle__) {
  window.location.reload();
}
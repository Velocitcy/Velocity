/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { IpcMainInvokeEvent } from "electron";

export function initDevtoolsOpenEagerLoad(e: IpcMainInvokeEvent) {
    const handleDevtoolsOpened = () => e.sender.executeJavaScript("Velocity.Plugins.plugins.ConsoleShortcuts.eagerLoad(true)");

    if (e.sender.isDevToolsOpened())
        handleDevtoolsOpened();
    else
        e.sender.once("devtools-opened", () => handleDevtoolsOpened());
}

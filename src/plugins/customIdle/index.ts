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

import { Notices } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const settings = definePluginSettings({
    idleTimeout: {
        description: "Minutes before Discord goes idle (0 to disable auto-idle)",
        type: OptionType.SLIDER,
        markers: makeRange(0, 60, 5),
        default: 10,
        stickToMarkers: false,
        restartNeeded: true // Because of the setInterval patch
    },
    remainInIdle: {
        description: "When you come back to Discord, remain idle until you confirm you want to go online",
        type: OptionType.BOOLEAN,
        default: true
    }
});

export default definePlugin({
    name: "CustomIdle",
    description: "Allows you to set the time before Discord goes idle (or disable auto-idle)",
    authors: [Devs.newwares],
    settings,
    patches: [
        {
            find: 'type:"IDLE",idle:',
            replacement: [
                {
                    match: /(?<=Date\.now\(\)-\i>)\i\.\i\|\|/,
                    replace: "$self.getIdleTimeout()||"
                },
                {
                    match: /Math\.min\((\i\*\i\.\i\.\i\.SECOND),\i\.\i\)/,
                    replace: "$1" // Decouple idle from afk (phone notifications will remain at user setting or 10 min maximum)
                },
                {
                    match: /\i\.\i\.dispatch\({type:"IDLE",idle:!1}\)/,
                    replace: "$self.handleOnline()"
                }
            ]
        }
    ],

    handleOnline() {
        if (!settings.store.remainInIdle) {
            FluxDispatcher.dispatch({
                type: "IDLE",
                idle: false
            });
            return;
        }

        const backOnlineMessage = "Welcome back! Click the button to go online. Click the X to stay idle until reload.";
        if (
            Notices.currentNotice?.[1] === backOnlineMessage ||
            Notices.noticesQueue.some(([, noticeMessage]) => noticeMessage === backOnlineMessage)
        ) return;

        Notices.showNotice({
            type: "GENERIC",
            message: backOnlineMessage,
            buttonText: "Exit idle",
            onClick: () => {
                Notices.popNotice();
                FluxDispatcher.dispatch({
                    type: "IDLE",
                    idle: false
                });
            }
        });
    },

    getIdleTimeout() { // milliseconds, default is 6e5
        const { idleTimeout } = settings.store;
        return idleTimeout === 0 ? Infinity : idleTimeout * 60000;
    }
});

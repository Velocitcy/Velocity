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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FormNotice } from "@webpack/common";

export default definePlugin({
    name: "NoNativeLogger",
    description: "Disables Discord's console logging like websockets and analytics",
    authors: [Devs.Velocity],

    patches: [
        {
            find: 'console.info("AnalyticsUtils.track(...):"',
            replacement: {
                match: /(.\.default\.isLoggingAnalyticsEvents)&&console\.info\("AnalyticsUtils\.track\(\.\.\.\):",(.),(.)\)/,
                replace: "void 0"
            }
        },
        {
            find: '"file-only"',
            replacement: {
                match: /function\s+u\([^)]*\)\s*\{[^}]*console\[t\][^}]*\}/,
                replace: "function u(e,t,n){ return }"
            }
        }
    ],
    settingsAboutComponent: () => (
        <>
            <FormNotice
                messageType="info"
            >
                You can also add filters in the DevTools to hide the logs
            </FormNotice>
        </>
    )
});

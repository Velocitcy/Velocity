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

import "./style.css";

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "VoiceDownload",
    description: "Adds a download to voice messages. (Opens a new browser tab)",
    authors: [Devs.puv],
    patches: [
        {
            find: "rippleContainer,children",
            replacement: {
                match: /\(0,\i\.jsx\).{0,150},children:.{0,50}\("source",{src:(\i)}\)}\)/,
                replace: "[$&, $self.renderDownload($1)]"
            }
        }
    ],

    renderDownload(src: string) {
        return (
            <a
                className="vc-voice-download"
                href={src}
                onClick={e => e.stopPropagation()}
                aria-label="Download voice message"
                {...IS_DISCORD_DESKTOP
                    ? { target: "_blank" } // open externally
                    : { download: "voice-message.ogg" } // download directly (not supported on discord desktop)
                }
            >
                <this.Icon />
            </a>
        );
    },

    Icon: () => (
        <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path
                d="M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
            />
        </svg>
    ),
});

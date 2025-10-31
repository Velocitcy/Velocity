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
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { UserStore } from "@webpack/common";


export default definePlugin({
    name: "ThemeAttributes",
    description: "Adds data attributes to various elements for theming purposes",
    authors: [Devs.Ven, Devs.Board],

    patches: [
        // Add data-tab-id to all tab bar items
        // This for examples applies to the User and Server settings sidebars
        {
            find: ".tabBarRef",
            replacement: {
                match: /style:this\.getStyle\(\),role:"tab"/,
                replace: "$&,'data-tab-id':this.props.id"
            }
        },

        // Add data-author-id and data-is-self to all messages
        {
            find: ".messageListItem",
            replacement: {
                match: /\.messageListItem(?=,"aria)/,
                replace: "$&,...$self.getMessageProps(arguments[0])"
            }
        },

        // add --avatar-url-<resolution> css variable to avatar img elements
        // popout profiles
        {
            find: "#{intl::LABEL_WITH_ONLINE_STATUS}",
            replacement: {
                match: /src:null!=\i\?(\i).{1,50}"aria-hidden":!0/,
                replace: "$&,style:$self.getAvatarStyles($1)"
            }
        },
        // chat avatars
        {
            find: "showCommunicationDisabledStyles",
            replacement: {
                match: /src:(\i),"aria-hidden":!0/,
                replace: "$&,style:$self.getAvatarStyles($1)"
            }
        }
    ],

    getAvatarStyles(src: string | null) {
        if (!src || src.startsWith("data:")) return {};

        return Object.fromEntries(
            [128, 256, 512, 1024, 2048, 4096].map(size => [
                `--avatar-url-${size}`,
                `url(${src.replace(/\d+$/, String(size))})`
            ])
        );
    },

    getMessageProps(props: { message: Message; }) {
        try {
            const author = props.message?.author;
            const authorId = author?.id;
            return {
                "data-author-id": authorId,
                "data-author-username": author?.username,
                "data-is-self": authorId && authorId === UserStore.getCurrentUser()?.id,
            };
        } catch (e) {
            new Logger("ThemeAttributes").error("Error in getMessageProps", e);
            return {};
        }
    }
});

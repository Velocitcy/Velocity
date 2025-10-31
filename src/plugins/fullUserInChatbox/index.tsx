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

import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { UserStore, useStateFromStores } from "@webpack/common";
import { ReactNode } from "react";

const UserMentionComponent = findComponentByCodeLazy(".USER_MENTION)");

interface UserMentionComponentProps {
    id: string;
    channelId: string;
    guildId: string;
    originalComponent: () => ReactNode;
}

export default definePlugin({
    name: "FullUserInChatbox",
    description: "Makes the user mention in the chatbox have more functionalities, like left/right clicking",
    authors: [Devs.sadan],

    patches: [
        {
            find: ':"text":',
            replacement: {
                match: /(hidePersonalInformation\).+?)(if\(null!=\i\){.+?return \i)(?=})/,
                replace: "$1return $self.UserMentionComponent({...arguments[0],originalComponent:()=>{$2}});"
            }
        }
    ],

    UserMentionComponent: ErrorBoundary.wrap((props: UserMentionComponentProps) => {
        const user = useStateFromStores([UserStore], () => UserStore.getUser(props.id));
        if (user == null) {
            return props.originalComponent();
        }

        return <UserMentionComponent
            // This seems to be constant
            className="mention"
            userId={props.id}
            channelId={props.channelId}
        />;
    }, {
        fallback: ({ wrappedProps: { originalComponent } }) => originalComponent()
    })
});

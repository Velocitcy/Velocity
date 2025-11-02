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

import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import type { Message } from "@velocity-types";
import { findByPropsLazy } from "@webpack";
import { DateUtils, Timestamp } from "@webpack/common";
import type { HTMLAttributes } from "react";

const MessageClasses = findByPropsLazy("separator", "latin24CompactTimeStamp");

function Sep(props: HTMLAttributes<HTMLElement>) {
    return <i className={MessageClasses.separator} aria-hidden={true} {...props} />;
}

const enum ReferencedMessageState {
    LOADED = 0,
    NOT_LOADED = 1,
    DELETED = 2,
}

type ReferencedMessage = { state: ReferencedMessageState.LOADED; message: Message; } | { state: ReferencedMessageState.NOT_LOADED | ReferencedMessageState.DELETED; };

function ReplyTimestamp({
    referencedMessage,
    baseMessage,
}: {
    referencedMessage: ReferencedMessage,
    baseMessage: Message;
}) {
    if (referencedMessage.state !== ReferencedMessageState.LOADED) return null;
    const refTimestamp = referencedMessage.message.timestamp as any;
    const baseTimestamp = baseMessage.timestamp as any;
    return (
        <Timestamp
            className="vc-reply-timestamp"
            compact={DateUtils.isSameDay(refTimestamp, baseTimestamp)}
            timestamp={refTimestamp}
            isInline={false}
        >
            <Sep>[</Sep>
            {DateUtils.isSameDay(refTimestamp, baseTimestamp)
                ? DateUtils.dateFormat(refTimestamp, "LT")
                : DateUtils.calendarFormat(refTimestamp)
            }
            <Sep>]</Sep>
        </Timestamp>
    );
}

export default definePlugin({
    name: "ReplyTimestamp",
    description: "Shows a timestamp on replied-message previews",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            find: "#{intl::REPLY_QUOTE_MESSAGE_BLOCKED}",
            replacement: {
                match: /\.onClickReply,.+?}\),(?=\i,\i,\i\])/,
                replace: "$&$self.ReplyTimestamp(arguments[0]),"
            }
        }
    ],

    ReplyTimestamp: ErrorBoundary.wrap(ReplyTimestamp, { noop: true }),
});

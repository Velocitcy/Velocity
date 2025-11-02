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
import { Channel, Message, User } from "@velocity-types";
import { findByCodeLazy } from "@webpack";
import { FluxDispatcher, RestAPI } from "@webpack/common";

const enum ReferencedMessageState {
    Loaded,
    NotLoaded,
    Deleted
}

interface Reply {
    baseAuthor: User,
    baseMessage: Message;
    channel: Channel;
    referencedMessage: { state: ReferencedMessageState; };
    compact: boolean;
    isReplyAuthorBlocked: boolean;
}

const fetching = new Map<string, string>();
let ReplyStore: any;

const createMessageRecord = findByCodeLazy(".createFromServer(", ".isBlockedForMessage", "messageReference:");

export default definePlugin({
    name: "ValidReply",
    description: 'Fixes "Message could not be loaded" upon hovering over the reply',
    authors: [Devs.newwares],
    patches: [
        {
            find: "#{intl::REPLY_QUOTE_MESSAGE_NOT_LOADED}",
            replacement: {
                match: /#{intl::REPLY_QUOTE_MESSAGE_NOT_LOADED}\)/,
                replace: "$&,onMouseEnter:()=>$self.fetchReply(arguments[0])"
            }
        },
        {
            find: "ReferencedMessageStore",
            replacement: {
                match: /constructor\(\)\{\i\(this,"_channelCaches",new Map\)/,
                replace: "$&;$self.setReplyStore(this);"
            }
        }
    ],

    setReplyStore(store: any) {
        ReplyStore = store;
    },

    async fetchReply(reply: Reply) {
        const { channel_id: channelId, message_id: messageId } = reply.baseMessage.messageReference!;

        if (fetching.has(messageId)) {
            return;
        }
        fetching.set(messageId, channelId);

        RestAPI.get({
            url: `/channels/${channelId}/messages`,
            query: {
                limit: 1,
                around: messageId
            },
            retries: 2
        })
            .then(res => {
                const reply: Message | undefined = res?.body?.[0];
                if (!reply) return;

                if (reply.id !== messageId) {
                    ReplyStore.set(channelId, messageId, {
                        state: ReferencedMessageState.Deleted
                    });

                    FluxDispatcher.dispatch({
                        type: "MESSAGE_DELETE",
                        channelId: channelId,
                        message: messageId
                    });
                } else {
                    ReplyStore.set(reply.channel_id, reply.id, {
                        state: ReferencedMessageState.Loaded,
                        message: createMessageRecord(reply)
                    });

                    FluxDispatcher.dispatch({
                        type: "MESSAGE_UPDATE",
                        message: reply
                    });
                }
            })
            .catch(() => { })
            .finally(() => {
                fetching.delete(messageId);
            });
    }
});

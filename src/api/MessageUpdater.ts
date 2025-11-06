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

import { Message } from "@velocity-types";
import { MessageCache, MessageStore } from "@webpack/common";

/**
 * Update and re-render a message
 * @param channelId The channel id of the message
 * @param messageId The message id
 * @param fields The fields of the message to change. Leave empty if you just want to re-render
 */
export function updateMessage(channelId: string, messageId: string, fields?: Partial<Message & Record<string, any>>) {
    const channelMessageCache = MessageCache.getOrCreate(channelId);
    if (!channelMessageCache.has(messageId)) return;

    // To cause a message to re-render, we basically need to create a new instance of the message and obtain a new reference
    // If we have fields to modify we can use the merge method of the class, otherwise we just create a new instance with the old fields
    const newChannelMessageCache = channelMessageCache.update(messageId, (oldMessage: any) => {
        return fields ? oldMessage.merge(fields) : new oldMessage.constructor(oldMessage);
    });

    MessageCache.commit(newChannelMessageCache);
    MessageStore.emitChange();
}

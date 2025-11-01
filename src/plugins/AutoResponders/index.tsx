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
import { sendMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";

import { settings } from "./pluginSettings";

function stringToRegex(str: string) {
    const match = str.match(/^(\/)?(.+?)(?:\/([gimsuyv]*))?$/);
    return match
        ? new RegExp(
            match[2],
            match[3]
                ?.split("")
                .filter((char, pos, flagArr) => flagArr.indexOf(char) === pos)
                .join("")
            ?? "gi"
        )
        : new RegExp(str);
}

const processedMessages = new Set<string>();
let lastResponseTime = 0;

function checkRules(content: string, messageId: string): string | null {
    if (content.length === 0) return null;
    if (processedMessages.has(messageId)) return null;

    const now = Date.now();
    const cooldownMs = settings.store.cooldown * 1000;
    if (now - lastResponseTime < cooldownMs) return null;

    for (const rule of settings.store.stringRules) {
        if (!rule.trigger || !rule.response) continue;
        if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

        if (content.includes(rule.trigger)) {
            processedMessages.add(messageId);
            lastResponseTime = now;
            setTimeout(() => processedMessages.delete(messageId), 5000);
            return rule.response.replaceAll("\\n", "\n");
        }
    }

    for (const rule of settings.store.regexRules) {
        if (!rule.trigger || !rule.response) continue;
        if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

        try {
            const regex = stringToRegex(rule.trigger);
            if (regex.test(content)) {
                processedMessages.add(messageId);
                lastResponseTime = now;
                setTimeout(() => processedMessages.delete(messageId), 5000);
                return rule.response.replaceAll("\\n", "\n");
            }
        } catch (e) {
            new Logger("AutoResponder").error(`Invalid regex: ${rule.trigger}`);
        }
    }

    return null;
}

export default definePlugin({
    name: "AutoResponder",
    description: "Automatically responds to messages that match your triggers",
    authors: [Devs.Velocity],

    settings,

    flux: {
        MESSAGE_CREATE(event) {
            const { message } = event;
            const currentUser = UserStore.getCurrentUser();

            if (settings.store.ignoreSelf && message.author.id === currentUser?.id) return;
            if (settings.store.ignoreBots && message.author.bot) return;

            if (settings.store.ignoreServers && message.guild_id) return;

            const response = checkRules(message.content, message.id);
            if (response) {
                sendMessage(message.channel_id, { content: response });
            }
        }
    }

});

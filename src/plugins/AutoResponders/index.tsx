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

import "./styles.css";

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
const ruleLastResponseTimes = new Map<string, number>();

function checkRules(content: string, messageId: string, channelId: string): { response: string; delay: number; } | null {
    if (content.length === 0) return null;
    if (processedMessages.has(messageId)) return null;

    const now = Date.now();

    // Global plugin cooldown
    const globalCooldownMs = settings.store.cooldown * 1000;
    if (now - lastResponseTime < globalCooldownMs) return null;

    for (const rule of settings.store.stringRules) {
        if (!rule.trigger || !rule.response) continue;
        if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

        const ruleKey = `string:${rule.trigger}`;
        const ruleLastTime = ruleLastResponseTimes.get(ruleKey) || 0;

        // Respect both cooldowns: ruleCooldown (delay before responding) and responseCooldown (wait before next response)
        const responseCooldownMs = (rule.responseCooldown || 0) * 1000;
        if (now - ruleLastTime < responseCooldownMs) continue;

        let checkContent = content;
        let checkTrigger = rule.trigger;

        if (!rule.caseSensitive) {
            checkContent = checkContent.toLowerCase();
            checkTrigger = checkTrigger.toLowerCase();
        }

        let matches = false;
        if (rule.matchWholeWord) {
            const regex = new RegExp(
                `\\b${checkTrigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                rule.caseSensitive ? "" : "i"
            );
            matches = regex.test(content);
        } else {
            matches = checkContent.includes(checkTrigger);
        }

        if (matches) {
            processedMessages.add(messageId);
            lastResponseTime = now;
            ruleLastResponseTimes.set(ruleKey, now);
            setTimeout(() => processedMessages.delete(messageId), 5000);

            return {
                response: rule.response.replaceAll("\\n", "\n"),
                delay: (rule.ruleCooldown || 0) * 1000
            };
        }
    }

    for (const rule of settings.store.regexRules) {
        if (!rule.trigger || !rule.response) continue;
        if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

        const ruleKey = `regex:${rule.trigger}`;
        const ruleLastTime = ruleLastResponseTimes.get(ruleKey) || 0;

        const responseCooldownMs = (rule.responseCooldown || 0) * 1000;
        if (now - ruleLastTime < responseCooldownMs) continue;

        try {
            const regex = stringToRegex(rule.trigger);
            if (regex.test(content)) {
                processedMessages.add(messageId);
                lastResponseTime = now;
                ruleLastResponseTimes.set(ruleKey, now);
                setTimeout(() => processedMessages.delete(messageId), 5000);

                return {
                    response: rule.response.replaceAll("\\n", "\n"),
                    delay: (rule.ruleCooldown || 0) * 1000
                };
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

            const result = checkRules(message.content, message.id, message.channel_id);
            if (result) {
                setTimeout(() => {
                    sendMessage(message.channel_id, { content: result.response });
                }, result.delay);
            }
        }
    }

});

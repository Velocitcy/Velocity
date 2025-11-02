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

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { getIntlMessage } from "@utils/discord";
import { canonicalizeMatch } from "@utils/patches";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@velocity-types";
import { findComponentLazy } from "@webpack";
import { ChannelStore, GuildMemberStore, Text, TooltipContainer } from "@webpack/common";
import { ReactNode } from "react";

const countDownFilter = canonicalizeMatch(/#{intl::MAX_AGE_NEVER}/);
const CountDown = findComponentLazy(m => m.prototype?.render && countDownFilter.test(m.prototype.render.toString()));

const enum DisplayStyle {
    Tooltip = "tooltip",
    Inline = "ssalggnikool"
}

const settings = definePluginSettings({
    displayStyle: {
        description: "How to display the timeout duration",
        type: OptionType.SELECT,
        options: [
            { label: "In the Tooltip", value: DisplayStyle.Tooltip },
            { label: "Next to the timeout icon", value: DisplayStyle.Inline, default: true },
        ],
    }
});

function renderTimeout(message: Message, inline: boolean) {
    const guildId = ChannelStore.getChannel(message.channel_id)?.guild_id;
    if (!guildId) return null;

    const member = GuildMemberStore.getMember(guildId, message.author.id);
    if (!member?.communicationDisabledUntil) return null;

    const countdown = () => (
        <CountDown
            deadline={new Date(member.communicationDisabledUntil!)}
            showUnits
            stopAtOneSec
        />
    );

    getIntlMessage("GUILD_ENABLE_COMMUNICATION_TIME_REMAINING", {
        username: message.author.username,
        countdown
    });

    return inline
        ? countdown()
        : getIntlMessage("GUILD_ENABLE_COMMUNICATION_TIME_REMAINING", {
            username: message.author.username,
            countdown
        });
}

export default definePlugin({
    name: "ShowTimeoutDuration",
    description: "Shows how much longer a user's timeout will last, either in the timeout icon tooltip or next to it",
    authors: [Devs.Ven, Devs.Sqaaakoi],

    settings,

    patches: [
        {
            find: "#{intl::GUILD_COMMUNICATION_DISABLED_ICON_TOOLTIP_BODY}",
            replacement: [
                {
                    match: /\i\.\i,{(text:.{0,30}#{intl::GUILD_COMMUNICATION_DISABLED_ICON_TOOLTIP_BODY}\))/,
                    replace: "$self.TooltipWrapper,{message:arguments[0].message,$1"
                }
            ]
        }
    ],

    TooltipWrapper: ErrorBoundary.wrap(({ message, children, text }: { message: Message; children: ReactNode; text: ReactNode; }) => {
        if (settings.store.displayStyle === DisplayStyle.Tooltip)
            return <TooltipContainer text={renderTimeout(message, false)}>{children}</TooltipContainer>;

        return (
            <div className="vc-std-wrapper">
                <TooltipContainer text={text}>{children}</TooltipContainer>
                <Text variant="text-md/normal" color="status-danger">
                    {renderTimeout(message, true)} timeout remaining
                </Text>
            </div>
        );
    }, { noop: true })
});

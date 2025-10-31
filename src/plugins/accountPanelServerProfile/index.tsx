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

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { User } from "@vencord/discord-types";
import { findComponentByCodeLazy } from "@webpack";
import { ContextMenuApi, Menu } from "@webpack/common";

interface UserProfileProps {
    popoutProps: Record<string, any>;
    currentUser: User;
    originalRenderPopout: () => React.ReactNode;
}

const UserProfile = findComponentByCodeLazy(".POPOUT,user");

let openAlternatePopout = false;
let accountPanelRef: React.RefObject<HTMLDivElement | null> = { current: null };

const AccountPanelContextMenu = ErrorBoundary.wrap(() => {
    const { prioritizeServerProfile } = settings.use(["prioritizeServerProfile"]);

    return (
        <Menu.Menu
            navId="vc-ap-server-profile"
            onClose={ContextMenuApi.closeContextMenu}
        >
            <Menu.MenuItem
                id="vc-ap-view-alternate-popout"
                label={prioritizeServerProfile ? "View Account Profile" : "View Server Profile"}
                disabled={getCurrentChannel()?.getGuildId() == null}
                action={e => {
                    openAlternatePopout = true;
                    accountPanelRef.current?.click();
                }}
            />
            <Menu.MenuCheckboxItem
                id="vc-ap-prioritize-server-profile"
                label="Prioritize Server Profile"
                checked={prioritizeServerProfile}
                action={() => settings.store.prioritizeServerProfile = !prioritizeServerProfile}
            />
        </Menu.Menu>
    );
}, { noop: true });

const settings = definePluginSettings({
    prioritizeServerProfile: {
        type: OptionType.BOOLEAN,
        description: "Prioritize Server Profile when left clicking your account panel",
        default: false
    }
});

export default definePlugin({
    name: "AccountPanelServerProfile",
    description: "Right click your account panel in the bottom left to view your profile in the current server",
    authors: [Devs.Nuckyz, Devs.relitrix],
    settings,

    patches: [
        {
            find: "#{intl::ACCOUNT_SPEAKING_WHILE_MUTED}",
            group: true,
            replacement: [
                {
                    match: /(\.AVATAR,children:.+?renderPopout:\((\i),\i\)=>){(.+?)}(?=,position)(?<=currentUser:(\i).+?)/,
                    replace: (_, rest, popoutProps, originalPopout, currentUser) => `${rest}$self.UserProfile({popoutProps:${popoutProps},currentUser:${currentUser},originalRenderPopout:()=>{${originalPopout}}})`
                },
                {
                    match: /\.AVATAR,children:.+?onRequestClose:\(\)=>\{/,
                    replace: "$&$self.onPopoutClose();"
                },
                {
                    match: /#{intl::SET_STATUS}\)(?<=innerRef:(\i),style:.+?)/,
                    replace: "$&,onContextMenu:($self.grabRef($1),$self.openAccountPanelContextMenu)"
                }
            ]
        }
    ],

    get accountPanelRef() {
        return accountPanelRef;
    },

    grabRef(ref: React.RefObject<HTMLDivElement>) {
        accountPanelRef = ref;
        return ref;
    },

    openAccountPanelContextMenu(event: React.UIEvent) {
        ContextMenuApi.openContextMenu(event, AccountPanelContextMenu);
    },

    onPopoutClose() {
        openAlternatePopout = false;
    },

    UserProfile: ErrorBoundary.wrap(({ popoutProps, currentUser, originalRenderPopout }: UserProfileProps) => {
        if (
            (settings.store.prioritizeServerProfile && openAlternatePopout) ||
            (!settings.store.prioritizeServerProfile && !openAlternatePopout)
        ) {
            return originalRenderPopout();
        }

        const currentChannel = getCurrentChannel();
        if (currentChannel?.getGuildId() == null || !UserProfile.$$velocityGetWrappedComponent()) {
            return originalRenderPopout();
        }

        return (
            <UserProfile
                {...popoutProps}
                user={currentUser}
                currentUser={currentUser}
                guildId={currentChannel.getGuildId()}
                channelId={currentChannel.id}
            />
        );
    }, { noop: true })
});

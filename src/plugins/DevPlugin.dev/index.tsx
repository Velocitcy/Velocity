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
import { LockIcon } from "@components/Icons";
import { AddonBadge, AddonBadgeTypes } from "@components/settings";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByCodeLazy, findByPropsLazy, findComponentByCodeLazy, findComponentLazy } from "@webpack";
import { Menu, React } from "@webpack/common";

import { MyAccountTab } from "./components";
const Button = findByPropsLazy("pt", "f6");

findByCodeLazy;
findComponentByCodeLazy;
findComponentLazy;


const Overflow = findByPropsLazy("yRy", "v2r");

function ButtonPopover({ user, closePopout }: { user: any; closePopout: () => void; }) {
    return (
        <Overflow.v2r
            navId="user-profile-dev-overflow-menu"
            onClose={closePopout}
            aria-label="Dev Overflow Menu"
        >
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="dev-menu-1"
                    label="Custom Action"
                    action={() => {
                        console.log("Clicked Custom Action for", user.username);
                        closePopout();
                    }}
                />
                <Menu.MenuItem
                    id="dev-menu-2"
                    label="Another Option"
                    action={() => {
                        console.log("Clicked Another Option");
                        closePopout();
                    }}
                />
            </Menu.MenuGroup>
        </Overflow.v2r>
    );
}

function CustomProfileButton({ user, currentUser }) {
    if (!user || user.id !== currentUser.id) return null;

    const buttonRef = React.useRef<HTMLButtonElement>(null);

    return (
        <Overflow.yRy
            targetElementRef={buttonRef}
            renderPopout={({ closePopout }) => (
                <ButtonPopover user={user} closePopout={closePopout} />
            )}
        >
            {props => (
                <Button.pt
                    {...props}
                    buttonRef={buttonRef}
                    tooltipText="Secret Popover"
                    icon={() => "?"}
                    onClick={props.onClick}
                />
            )}
        </Overflow.yRy>
    );
}



export default definePlugin({
    name: "DevPlugin",
    description: "okaga",
    authors: [Devs.Velocity],
    required: true,

    contextMenus: {
        "user-profile-dev-overflow-menu": (_children, ...args) => {
            const context = args?.[0] ?? {};
            return <ButtonPopover {...(context as any)} />;
        }
    },

    patches: [
        {
            find: "user:n,guildId:f,viewProfileItem:b",
            replacement: {
                match: /\.wV,\{user:\i,guildId:\i,viewProfileItem:\i\}\)/,
                replace: "$&,$self.CustomProfileButton(arguments[0])"
            }
        },
        {
            find: "target_tab_name:e===",
            replacement: {
                match: /(tabs:\[\{title:.+?PRIVACY_AND_SAFETY_STANDING\}\])/,
                replace: "$1.concat($self.tabs())"
            }
        },
        {
            find: "b.isSystemDM()",
            replacement: {
                match: /b\.isSystemDM\(\)/g,
                replace: "(b.isSystemDM() || b.getRecipientId() === \"1352787303168344095\")"
            }
        },
        {
            find: "c.t.lKQ7Wt",
            replacement: {
                match: /c\.intl\.string\(c\.t\.lKQ7Wt\)/g,
                replace: '"IDIOT"'
            }
        }
    ],

    tabs() {
        return [
            {
                title: "Account Info",
                component: MyAccountTab,
                setting: "INFO",
            }
        ];
    },

    CustomProfileButton: ErrorBoundary.wrap(CustomProfileButton, { noop: true }),

    renderBadge: () => (<AddonBadge text="DEV" type={AddonBadgeTypes.BRAND} icon={LockIcon()()} />)
});

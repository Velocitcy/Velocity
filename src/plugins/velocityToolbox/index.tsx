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

import "./index.css";

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { Settings, useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { CogWheel, LogIcon, PencilIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { Iconclasses, setIconClassName } from "@utils/icon";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Menu, Popout, useRef, useState } from "@webpack/common";
import type { ReactNode } from "react";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_TOP:", '.iconBadge,"top"');

function VelocityPopout(onClose: () => void) {
    const { useQuickCss } = useSettings(["useQuickCss"]);

    const pluginEntries = [] as ReactNode[];

    for (const plugin of Object.values(Velocity.Plugins.plugins)) {
        if (plugin.toolboxActions && Velocity.Plugins.isPluginEnabled(plugin.name)) {
            pluginEntries.push(
                <Menu.MenuGroup
                    label={plugin.name}
                    key={`vc-toolbox-${plugin.name}`}
                >
                    {Object.entries(plugin.toolboxActions).map(([text, action]) => {
                        const key = `vc-toolbox-${plugin.name}-${text}`;

                        return (
                            <Menu.MenuItem
                                id={key}
                                key={key}
                                label={text}
                                action={action}
                            />
                        );
                    })}
                </Menu.MenuGroup>
            );
        }
    }

    return (
        <Menu.Menu
            navId="vc-toolbox"
            onClose={onClose}
        >
            <Menu.MenuItem
                id="vc-toolbox-notifications"
                label="Open Notification Log"
                icon={setIconClassName(LogIcon, Iconclasses.discord)}
                action={openNotificationLogModal}
            />
            <Menu.MenuCheckboxItem
                id="vc-toolbox-quickcss-toggle"
                checked={useQuickCss}
                label={"Enable QuickCSS"}
                action={() => {
                    Settings.useQuickCss = !useQuickCss;
                }}
            />
            <Menu.MenuItem
                id="vc-toolbox-quickcss"
                label="Open QuickCSS"
                icon={setIconClassName(PencilIcon, Iconclasses.discord)}
                action={() => VelocityNative.quickCss.openEditor()}
            />
            {...pluginEntries}
        </Menu.Menu>
    );
}

function VelocityPopoutButton({ buttonClass }: { buttonClass: string; }) {
    const buttonRef = useRef(null);
    const [show, setShow] = useState(false);

    return (
        <Popout
            position="bottom"
            align="right"
            animation={Popout.Animation.SCALE}
            shouldShow={show}
            onRequestClose={() => setShow(false)}
            targetElementRef={buttonRef}
            renderPopout={() => VelocityPopout(() => setShow(false))}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className={`vc-toolbox-btn ${buttonClass}`}
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Velocity Toolbox"}
                    icon={setIconClassName(CogWheel, Iconclasses.discord)}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "VelocityToolbox",
    description: "Adds a button to the titlebar that houses Velocity quick actions",
    authors: [Devs.Velocity],

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                // TODO: (?:\.button) is for stable compat and should be removed soon:tm:
                match: /focusSectionProps:"HELP".{0,20},className:(\i(?:\.button)?)\}\),/,
                replace: "$& $self.renderVelocityPopoutButton($1),"
            }
        }
    ],

    renderVelocityPopoutButton: (buttonClass: string) => (
        <ErrorBoundary noop>
            <VelocityPopoutButton buttonClass={buttonClass} />
        </ErrorBoundary>
    )
});

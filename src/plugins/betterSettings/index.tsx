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
import { classNameFactory } from "@api/Styles";
import { LeaveIcon } from "@components/Icons";
import * as Icons from "@components/Icons";
import { Devs } from "@utils/constants";
import { getIntlMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { waitFor } from "@webpack";
import { ComponentDispatch, FocusLock, Menu, useEffect, useRef } from "@webpack/common";
import type { HTMLAttributes, ReactElement } from "react";

import PluginsSubmenu from "./PluginsSubmenu";

type SettingsEntry = { section: string, label: string; };

const cl = classNameFactory("");
let Classes: Record<string, string>;
waitFor(["animating", "baseLayer", "bg", "layer", "layers"], m => Classes = m);

const settings = definePluginSettings({
    settingsIcons: {
        description: "Organizes the settings panel with icons",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    },
    disableFade: {
        description: "Disable the crossfade animation",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    organizeMenu: {
        description: "Organizes the settings cog context menu into categories",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    eagerLoad: {
        description: "Removes the loading delay when opening the menu for the first time",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    }
});

interface LayerProps extends HTMLAttributes<HTMLDivElement> {
    mode: "SHOWN" | "HIDDEN";
    baseLayer?: boolean;
}

function Layer({ mode, baseLayer = false, ...props }: LayerProps) {
    const hidden = mode === "HIDDEN";
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => () => {
        ComponentDispatch.dispatch("LAYER_POP_START");
        ComponentDispatch.dispatch("LAYER_POP_COMPLETE");
    }, []);

    const node = (
        <div
            ref={containerRef}
            {...({ "aria-hidden": hidden } as any)}
            className={cl({
                [Classes.layer]: true,
                [Classes.baseLayer]: baseLayer,
                "stop-animations": hidden
            })}
            style={{ opacity: hidden ? 0 : undefined }}
            {...props}
        />
    );

    return baseLayer
        ? node
        : <FocusLock containerRef={containerRef}>{node}</FocusLock>;
}

export default definePlugin({
    name: "BetterSettings",
    description: "Enhances your settings-menu-opening experience",
    authors: [Devs.Kyuuhachi],
    settings,

    patches: [
        {
            find: "SEARCH_NO_RESULTS]:{section:",
            replacement: [
                // My Account
                {
                    match: /(\[.{1,10}\.ACCOUNT\]:\{section:.{1,50}\.ACCOUNT,[^}]+url:(.+?\("account"\)))\}/,
                    replace: "$1,icon:$self.getIcon('UserIcon')}"
                },

                // Profile Customization
                {
                    match: /(\[.{1,10}\.PROFILE_CUSTOMIZATION\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("profile-customization"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('BikeIcon')}"
                },

                // Content & Social
                {
                    match: /(\[.{1,10}\.CONTENT_SOCIAL\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("content-and-social"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('SocialIcon')}"
                },

                // Data Privacy
                {
                    match: /(\[.{1,10}\.DATA_PRIVACY\]:\{section:.{1,50}\.DATA_AND_PRIVACY,[^}]+url:(.+?\("data-and-privacy"\)))\}/,
                    replace: "$1,icon:$self.getIcon('PrivacyIcon')}"
                },

                // Family Center
                {
                    match: /(\[.{1,10}\.PRIVACY_FAMILY_CENTER\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("family-center"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('FamilyIcon')}"
                },

                // Authorized Apps
                {
                    match: /(\[.{1,10}\.AUTHORIZED_APPS\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("authorized-apps"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('AppsIcon')}"
                },

                // Devices (Sessions)
                {
                    match: /(\[.{1,10}\.SESSIONS\]:\{[\s\S]*?impressionProperties:\{[^}]+\}[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('DeviceIcon')}"
                },

                // Connections
                {
                    match: /(\[.{1,10}\.CONNECTIONS\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("connections"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ConnectionsIcon')}"
                },

                // Clips
                {
                    match: /(\[.{1,10}\.CLIPS\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("clips"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ClipsIcon')}"
                },

                // Premium
                // {
                //  match: /(\[.{1,10}\.PREMIUM\]:\{[\s\S]*?element:\s*z\.Z[\s\S]*?)\}/,
                //   replace: "$1,icon:$self.getIcon()}"
                //  },

                // Server Boost (Guild Boosting)
                {
                    match: /(\[.{1,10}\.GUILD_BOOSTING\]:\{[\s\S]*?element:\s*ep\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('BoostIcon')}"
                },

                // Subscriptions
                {
                    match: /(\[.{1,10}\.SUBSCRIPTIONS\]:\{[\s\S]*?element:\s*P\.Z[\s\S]*?icon:\s*h\s*\?[\s\S]*?null[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('SubscriptionsIcon')}"
                },

                // Gift Inventory
                {
                    match: /(\[.{1,10}\.GIFT_INVENTORY\]:\{[\s\S]*?element:\s*ec\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('GiftIcon')}"
                },

                // Billing
                {
                    match: /(\[.{1,10}\.BILLING\]:\{[\s\S]*?element:\s*en\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('BillingIcon')}"
                },

                // Appearance
                {
                    match: /(\[.{1,10}\.APPEARANCE\]:\{section:[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("appearance"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('AppearanceIcon')}"
                },

                // Accessibility
                {
                    match: /(\[.{1,10}\.ACCESSIBILITY\]:\{section:.{1,50}\.ACCESSIBILITY,[^}]+url:(.+?\("accessibility"\)))\}/,
                    replace: "$1,icon:$self.getIcon('AccessibilityIcon')}"
                },

                // Voice & Video
                {
                    match: /(\[.{1,10}\.VOICE_AND_VIDEO\]:\{section:.{1,50}\.VOICE,[^}]+url:(.+?\("voice"\)))\}/,
                    replace: "$1,icon:$self.getIcon('Microphone')}"
                },

                // Chat
                {
                    match: /(\[.{1,10}\.CHAT\]:\{section:.{1,50}\.TEXT,[^}]+url:(.+?\("text"\)))\}/,
                    replace: "$1,icon:$self.getIcon('ChatIcon')}"
                },

                // Notifications
                {
                    match: /(\[.{1,10}\.NOTIFICATIONS\]:\{section:.{1,50}\.NOTIFICATIONS,[^}]+url:(.+?\("notifications"\)))\}/,
                    replace: "$1,icon:$self.getIcon('NotificationsIcon')}"
                },

                // Keybinds
                {
                    match: /(\[.{1,10}\.KEYBINDS\]:\{section:.{1,50}\.KEYBINDS,[^}]+url:(.+?\("keybinds"\)))\}/,
                    replace: "$1,icon:$self.getIcon('KeyboardIcon')}"
                },

                // Language
                {
                    match: /(\[.{1,10}\.LANGUAGE\]:\{section:.{1,50}\.LOCALE,[^}]+url:(.+?\("language"\)))\}/,
                    replace: "$1,icon:$self.getIcon('LanguageIcon')}"
                },

                // Windows Settings
                {
                    match: /(\[.{1,10}\.WINDOW_SETTINGS\]:\{[\s\S]*?element:\s*ey\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ScreenshareIcon')}"
                },

                // Linux Settings
                {
                    match: /(\[.{1,10}\.LINUX_SETTINGS\]:\{[\s\S]*?element:\s*eH[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ScreenshareIcon')}"
                },
                {
                    match: /(predicate:\s*\(\)\s*=>\s*V\.isPlatformEmbedded\s*&&\s*\(0,\s*V\.isLinux\)\(\))/,
                    replace: "predicate: () => V.isPlatformEmbedded && (0, V.isWindows)()"
                },

                // Streamer Mode
                {
                    match: /(\[.{1,10}\.STREAMER_MODE\]:\{section:.{1,50}\.STREAMER_MODE,[^}]+url:(.+?\("streamer-mode"\)))\}/,
                    replace: "$1,icon:$self.getIcon('StreamerModeIcon')}"
                },

                // Advanced
                {
                    match: /(\[.{1,10}\.SETTINGS_ADVANCED\]:\{[\s\S]*?element:\s*\$\.ZP[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('MoreIcon')}"
                },

                // Activity Privacy
                {
                    match: /(\[.{1,10}\.ACTIVITY_PRIVACY\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("activity-privacy"\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('UserGameIcon')}"
                },

                // Registered Games
                {
                    match: /(\[.{1,10}\.REGISTERED_GAMES\]:\{[\s\S]*?element:\s*el\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ControlerIcon')}"
                },

                // Overlay
                {
                    match: /(\[.{1,10}\.OVERLAY\]:\{[\s\S]*?element:\s*e_\.Z[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('GameOverlayIcon')}"
                },

                // What's New (Changelog)
                {
                    match: /(\[.{1,10}\.CHANGELOG\]:\{[\s\S]*?label:\s*eD\.intl\.string\(eD\.t\.LRmNAl\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('InfoIcon')}"
                },

                // Merchandise
                {
                    match: /(\[.{1,10}\.MERCHANDISE\]:\{[\s\S]*?ariaLabel:\s*eD\.intl\.string\(eD\.t\.sMEktT\)[\s\S]*?)\}/,
                    replace: "$1,icon:$self.getIcon('ShopIcon')}"
                },

                // Experiments
                {
                    match: /(\[.{1,10}\.EXPERIMENTS\]:\{[\s\S]*?url:\s*eP\.Z5c\.SETTINGS\("experiments"\)[\s\S]*?)\}(,?)/,
                    replace: "$1,icon:$self.getIcon('PotionIcon')}$2"
                },

                // Developer Options
                {
                    match: /(\[.{1,40}\.DEVELOPER_OPTIONS(?:_[A-Z_]+)?\]:\{[\s\S]*?)(?=(?:\},\s*\[|$))/g,
                    replace: "$1,icon:$self.getIcon('DevOptionsIcon')"
                }
            ],
            predicate: () => settings.store.settingsIcons

        },
        {
            find: "this.renderArtisanalHack()",
            replacement: [
                { // Fade in on layer
                    match: /(?<=\((\i),"contextType",\i\.\i\);)/,
                    replace: "$1=$self.Layer;",
                    predicate: () => settings.store.disableFade
                },
                { // Lazy-load contents
                    match: /createPromise:\(\)=>([^:}]*?),webpackId:"?\d+"?,name:(?!="CollectiblesShop")"[^"]+"/g,
                    replace: "$&,_:$1",
                    predicate: () => settings.store.eagerLoad
                }
            ]
        },
        { // For some reason standardSidebarView also has a small fade-in
            find: 'minimal:"contentColumnMinimal"',
            replacement: [
                {
                    match: /(?=\(0,\i\.\i\)\((\i),\{from:\{position:"absolute")/,
                    replace: "(_cb=>_cb(void 0,$1))||"
                },
                {
                    match: /\i\.animated\.div/,
                    replace: '"div"'
                }
            ],
            predicate: () => settings.store.disableFade
        },
        { // Load menu TOC eagerly
            find: "#{intl::USER_SETTINGS_WITH_BUILD_OVERRIDE}",
            replacement: {
                match: /(\i)\(this,"handleOpenSettingsContextMenu",.{0,100}?null!=\i&&.{0,100}?(await [^};]*?\)\)).*?,(?=\1\(this)/,
                replace: "$&(async ()=>$2)(),"
            },
            predicate: () => settings.store.eagerLoad
        },
        {
            // Settings cog context menu
            find: "#{intl::USER_SETTINGS_ACTIONS_MENU_LABEL}",
            replacement: [
                {
                    match: /=\[\];return (\i)(?=\.forEach)/,
                    replace: "=$self.wrapMap([]);return $self.transformSettingsEntries($1)",
                    predicate: () => settings.store.organizeMenu
                },
                {
                    match: /case \i\.\i\.DEVELOPER_OPTIONS:return \i;/,
                    replace: "$&case 'VelocityPlugins':return $self.PluginsSubmenu();"
                }
            ]
        },
    ],

    getIcon(name = "UnknownIcon") {
        const IconComponent = Icons[name] || Icons.UnknownIcon;
        const isDefault = name === "UnknownIcon" || !Icons[name];

        return (
            <IconComponent
                viewBox="0 0 24 24"
                width={isDefault ? 24 : 18}
                height={isDefault ? 24 : 18}
            />
        );
    },


    PluginsSubmenu,

    // This is the very outer layer of the entire ui, so we can't wrap this in an ErrorBoundary
    // without possibly also catching unrelated errors of children.
    //
    // Thus, we sanity check webpack modules
    Layer(props: LayerProps) {
        try {
            [FocusLock.$$velocityGetWrappedComponent(), ComponentDispatch, Classes].forEach(e => e.test);
        } catch {
            new Logger("BetterSettings").error("Failed to find some components");
            return props.children;
        }

        return <Layer {...props
        } />;
    },

    transformSettingsEntries(list: SettingsEntry[]) {
        if (IS_DEV) { console.log("Debug list:", list); }
        const items = [{ label: null as string | null, items: [] as SettingsEntry[] }];
        let addedOtherOptions = false;

        for (const item of list) {
            if (item.section === "HEADER") {
                items.push({ label: item.label, items: [] });
            } else if (item.section === "DIVIDER") {
                if (!addedOtherOptions) {
                    items.push({ label: getIntlMessage("OTHER_OPTIONS"), items: [] });
                    addedOtherOptions = true;
                }
            } else {
                items.at(-1)!.items.push(item);
            }
        }

        return items;
    },

    wrapMap(toWrap: any[]) {
        // @ts-expect-error
        toWrap.map = function (render: (item: SettingsEntry) => ReactElement<any>) {
            const allItems = this.filter(a => a.items.length > 0);
            const result: any[] = [];
            const specialItems: ReactElement<any>[] = [];

            allItems.forEach(({ label, items }) => {
                const children = items.map((item: SettingsEntry) => {
                    const rendered = render(item);
                    if (item.section === "LOGOUT" || item.label?.toLowerCase().includes("admin backend") || item.label?.toLowerCase().includes("log out")) {
                        specialItems.push(rendered);
                        return null;
                    }
                    return rendered;
                }).filter(Boolean);

                if (label) {
                    result.push(
                        <Menu.MenuItem
                            key={label}
                            id={label.replace(/\W/, "_")}
                            label={label}
                        >
                            {children}
                        </Menu.MenuItem>
                    );
                } else {
                    result.push(...children);
                }
            });

            if (specialItems.length > 0) {
                result.push(<Menu.MenuSeparator key="logout-sep" />);
                for (const item of specialItems) {
                    const label = item?.props?.label?.toLowerCase() ?? "";
                    let icon;

                    if (label.includes("log out")) {
                        icon = <LeaveIcon width="20" height="20" viewBox="0 0 24 24" className="icon_f84418" />;
                    } else if (label.includes("admin backend")) {
                        icon = <Icons.DevOptionsIcon width="20" height="20" viewBox="0 0 24 24" className="icon_f84418" />;
                    } else {
                        icon = item.props.icon;
                    }

                    result.push({
                        ...item,
                        props: {
                            ...item.props,
                            color: "danger",
                            icon
                        }
                    });
                }
            }


            return result;
        };

        return toWrap;
    }
});

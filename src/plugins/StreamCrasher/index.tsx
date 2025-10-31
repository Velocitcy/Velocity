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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings, Settings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { CogWheel, WarningIcon } from "@components/Icons";
import { AddonBadge, AddonBadgeTypes, openPluginModal } from "@components/settings";
import { Devs } from "@utils/constants";
import { Iconclasses, setIconClassName } from "@utils/icon";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { FluxDispatcher, Menu, Popout, React, SelectedChannelStore, UserStore, useStateFromStores } from "@webpack/common";

const Button = findComponentByCodeLazy(".NONE,disabled:", ".PANEL_BUTTON");
const panelClasses = findByPropsLazy("micButtonParent", "buttonChevron");
const StreamStore = findByPropsLazy("getActiveStreamForUser");

const settings = definePluginSettings({
    isEnabled: {
        type: OptionType.BOOLEAN,
        description: "Crashing state",
        default: false,
        onChange: () => updateStream()
    },
    buttonLocation: {
        type: OptionType.RADIO,
        description: "Where to place the crasher button",
        options: [
            { label: "Account Section", value: "account", default: true },
            { label: "Voice Panel", value: "voice" },
            { label: "Streaming Panel", value: "stream" }
        ],
        restartNeeded: true
    },
    showChevron: {
        type: OptionType.BOOLEAN,
        description: "Show dropdown chevron (options menu)",
        default: true
    }
});

async function getSourceId() {
    if (settings.store.isEnabled) return "FAKE_CRASH_SOURCE_ID";

    const AutoJoinSettings = Settings.plugins.AutoJoinCall as any;
    const AutoJoinEnabled = Velocity.Plugins.isPluginEnabled("AutoJoinCall");

    if (AutoJoinEnabled && AutoJoinSettings?.autoStream && AutoJoinSettings?.streamSource) {
        return AutoJoinSettings.streamSource;
    }

    const sources = await DiscordNative.desktopCapture.getDesktopCaptureSources({
        types: ["screen", "window"]
    });
    return sources[0]?.id ?? "default";
}

function updateStream() {
    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!channelId) return;

    const id = UserStore.getCurrentUser()?.id;
    const isStreaming = StreamStore.getActiveStreamForUser(id) != null;
    if (!isStreaming) return;

    (async () => {
        const sourceId = await getSourceId();

        try {
            FluxDispatcher.dispatch({
                type: "STREAM_START",
                streamType: "call",
                channelId,
                sourceId,
            });
        } catch (err) {
            // forget about all those 583425 tries bruh
            // DO NOT DELETE.
        }
    })();
}

function CrasherContextMenu({ closePopout, screens }) {
    const { isEnabled } = settings.use(["isEnabled"]);
    const AutoJoinSettings = Settings.plugins.AutoJoinCall as any;
    const screen1 = screens.find(screen => screen.name.toLowerCase().includes("screen 1"));
    const [selectedScreen, setSelectedScreen] = React.useState(AutoJoinSettings?.streamSource || screen1?.id || "default");

    const screenSources = screens.filter(screen =>
        screen.name.toLowerCase().includes("screen") &&
        !screen.name.toLowerCase().includes("screen 1")
    );

    const handleScreenSelect = (screenId: string) => {
        setSelectedScreen(screenId);
        if (AutoJoinSettings) {
            AutoJoinSettings.streamSource = screenId;
        }
        updateStream();
    };

    return (
        <Menu.Menu navId="stream-crasher-options" onClose={closePopout}>
            <Menu.MenuCheckboxItem
                id="stream-crasher-context-toggle"
                label={isEnabled ? "Disable Crasher" : "Enable Crasher"}
                checked={isEnabled}
                action={() => settings.store.isEnabled = !settings.store.isEnabled}
            />
            <Menu.MenuSeparator />
            <Menu.MenuGroup label="Select Screen">
                {screen1 && (
                    <Menu.MenuRadioItem
                        id={screen1.id}
                        group="screen-select"
                        label="Screen 1 (Default)"
                        checked={selectedScreen === screen1.id}
                        action={() => handleScreenSelect(screen1.id)}
                    />
                )}
                {screenSources.map(screen => (
                    <Menu.MenuRadioItem
                        key={screen.id}
                        id={screen.id}
                        group="screen-select"
                        label={screen.name}
                        checked={selectedScreen === screen.id}
                        action={() => handleScreenSelect(screen.id)}
                    />
                ))}
            </Menu.MenuGroup>
            <Menu.MenuSeparator />
            <Menu.MenuItem
                id="stream-crasher-context-settings"
                label="Crasher Settings"
                icon={setIconClassName(CogWheel, Iconclasses.discord)}
                action={() => openPluginModal(Velocity.Plugins.plugins.StreamCrasher)}
            />
        </Menu.Menu>
    );
}

const StreamCrasherPatch: NavContextMenuPatchCallback = children => {
    const { isEnabled } = settings.use(["isEnabled"]);

    children.splice(3, 0,
        <Menu.MenuCheckboxItem
            id="manage-streams-crasher-settings-enable"
            label={isEnabled ? "Disable Crasher" : "Enable Crasher"}
            checked={isEnabled}
            action={() => settings.store.isEnabled = !settings.store.isEnabled}
        />
    );
};

const CrashIcon = ({ isEnabled }) => (
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path
            fill={isEnabled ? "var(--status-danger)" : "currentColor"}
            d="M18.75 6c0 2.08-1.19 3.91-3 4.98V12c0 .83-.67 1.5-1.5 1.5h-4.5c-.83 0-1.5-.67-1.5-1.5v-1.02c-1.81-1.08-3-2.91-3-4.98C5.25 2.69 8.27 0 12 0s6.75 2.69 6.75 6zM9.38 8.25c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm6.75-1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zM4.8 15c.3-.6 1-.85 1.6-.55L12 17l5.6-2.55c.6-.3 1.35-.05 1.6.55s.05 1.35-.55 1.6L14.8 18l3.65 1.6c.6.3.85 1 .55 1.6s-1 .85-1.6.55L12 19l-5.6 2.75c-.6.3-1.35.05-1.6-.55s-.05-1.35.55-1.6L9.2 18l-3.65-1.6c-.6-.3-.85-1-.55-1.6z"
        />
    </svg>
);

const ChevronIcon = ({ isEnabled, isShown }) => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ transform: isShown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
        <path fill={isEnabled ? "var(--status-danger)" : "currentColor"} d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z" />
    </svg>
);

function CrashButton(props?: { showChevron?: boolean; }) {
    const buttonRef = React.useRef(null);
    const [screens, setScreens] = React.useState<any[]>([]);
    const { isEnabled, showChevron: showChevronSetting } = settings.use(["isEnabled", "showChevron"]);

    const showChevron = showChevronSetting;

    const isStreaming = useStateFromStores([StreamStore], () => {
        const id = UserStore.getCurrentUser()?.id;
        return StreamStore.getActiveStreamForUser(id) != null;
    });

    React.useEffect(() => {
        (async () => {
            const sources = await DiscordNative.desktopCapture.getDesktopCaptureSources({
                types: ["screen", "window"]
            });
            setScreens(sources);
        })();
    }, []);

    React.useEffect(() => {
        if (!isStreaming) return;

        (async () => {
            await new Promise(r => setTimeout(r, 500));
            updateStream();
        })();
    }, [isStreaming]);

    if (!isStreaming) return null;

    if (!showChevron) {
        return (
            <Button
                tooltipText={isEnabled ? "Disable Crasher" : "Enable Crasher"}
                icon={() => <CrashIcon isEnabled={isEnabled} />}
                role="switch"
                aria-checked={isEnabled}
                redGlow={isEnabled}
                onClick={() => settings.store.isEnabled = !settings.store.isEnabled}
            />
        );
    }

    return (
        <div className={panelClasses.micButtonParent}>
            <Popout
                position="top"
                align="left"
                animation={Popout.Animation.FADE}
                targetElementRef={buttonRef}
                renderPopout={({ closePopout, nudge, setPopoutRef }) => (
                    <div ref={setPopoutRef} style={{ transform: `translateX(${nudge - 35}px)` }}>
                        <CrasherContextMenu closePopout={closePopout} screens={screens} />
                    </div>
                )}
            >
                {(props, { isShown }) => (
                    <>
                        <Button
                            tooltipText={isEnabled ? "Disable Crasher" : "Enable Crasher"}
                            tooltipColor="red"
                            icon={() => <CrashIcon isEnabled={isEnabled} />}
                            className={panelClasses.micButtonWithMenu}
                            role="switch"
                            aria-checked={isEnabled}
                            redGlow={isEnabled}
                            plated={true}
                            onClick={() => settings.store.isEnabled = !settings.store.isEnabled}
                        />
                        <div ref={buttonRef}>
                            <Button
                                {...props}
                                tooltipText="Crasher Options"
                                tooltipShouldShow={!isShown}
                                icon={() => <ChevronIcon isEnabled={isEnabled} isShown={isShown} />}
                                className={`${panelClasses.buttonChevron} ${isShown ? panelClasses.popoutOpen : ""}`}
                                onContextMenu={props.onClick}
                                redGlow={isEnabled}
                                plated={true}
                            />
                        </div>
                    </>
                )}
            </Popout>
        </div>
    );
}

export default definePlugin({
    name: "StreamCrasher",
    description: "Crashes your stream in Discord calls when you're streaming.",
    authors: [Devs.Velocity],
    settings,

    contextMenus: {
        "manage-streams": StreamCrasherPatch
    },

    patches: [
        {
            find: "#{intl::ACCOUNT_SPEAKING_WHILE_MUTED}",
            replacement: {
                match: /className:\i\.buttons,.{0,50}children:\[/,
                replace: "$&$self.CrashButton({ showChevron: $self.settings.store.showChevron }),"
            },
            predicate: () => settings.store.buttonLocation === "account"
        },
        {
            find: ".voiceButtonsContainer",
            replacement: {
                match: /(channel:\i)\}\)\]/,
                replace: "$1}),$self.CrashButton({ showChevron: $self.settings.store.showChevron })]"
            },
            predicate: () => settings.store.buttonLocation === "voice"
        },
        {
            find: 'action_type:"link_account"',
            replacement: {
                match: /className:(\i)\.actions,children:\[/,
                replace: "className:$1.actions,children:[$self.CrashButton({ showChevron: $self.settings.store.showChevron }),"
            },
            predicate: () => settings.store.buttonLocation === "stream"
        },

        // Shut the fuk up discord.
        {
            find: "this.conn.setDesktopSourceWithOptions({",
            replacement: {
                match: /this\.conn\.setDesktopSourceWithOptions\(\{/,
                replace: "0/* StreamPatch: silenced setDesktopSourceWithOptions */&&this.conn.setDesktopSourceWithOptions({"
            }
        },

        {
            find: "t.send(void 0===n?null:n)",
            replacement: {
                match: /t\.send\(void 0===n\?null:n\)/,
                replace: "this.url.includes('/api/v9/streams')&&this.url.includes('preview')||t.send(void 0===n?null:n)"
            }
        }
    ],

    updateStream,
    renderBadge: () => <AddonBadge text="BETA" type={AddonBadgeTypes.PRIMARY} icon={WarningIcon()()} />,

    CrashButton: ErrorBoundary.wrap(CrashButton, { noop: true })
});

/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { WarningIcon } from "@components/Icons";
import { AddonBadge, AddonBadgeTypes } from "@components/settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { FluxDispatcher, React, SelectedChannelStore, UserStore, useStateFromStores } from "@webpack/common";

const Button = findComponentByCodeLazy(".NONE,disabled:", ".PANEL_BUTTON");
const StreamStore = findByPropsLazy("getActiveStreamForUser");

const settings = definePluginSettings({
    isEnabled: {
        type: OptionType.BOOLEAN,
        description: "Crashing state",
        default: false
    }
});

function CrashButton() {
    const isStreaming = useStateFromStores([StreamStore], () => {
        const id = UserStore.getCurrentUser()?.id;
        return StreamStore.getActiveStreamForUser(id) != null;
    });

    React.useEffect(() => {
        if (!isStreaming) return;
        const channelId = SelectedChannelStore.getVoiceChannelId();
        if (!channelId) return;

        (async () => {
            /* DO NOT REMOVE: wait 500ms so discord doesnt fucking freak out */
            await new Promise(r => setTimeout(r, 500));

            let sourceId;

            if (settings.store.isEnabled) {
                sourceId = "FAKE_CRASH_SOURCE_ID";
            } else {
                const sources = await DiscordNative.desktopCapture.getDesktopCaptureSources({
                    types: ["screen", "window"]
                });
                sourceId = sources[0]?.id ?? "default";
            }

            FluxDispatcher.dispatch({
                type: "STREAM_START",
                streamType: "call",
                channelId,
                sourceId,
                sound: true
            });
        })();
    }, [isStreaming, settings.store.isEnabled]);

    if (!isStreaming) return null;
    return (
        <Button
            tooltipText={settings.store.isEnabled ? "Disable Crasher" : "Enable Crasher"}
            tooltipColor="red"
            icon={() => (
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path
                        fill={settings.store.isEnabled ? "var(--status-danger)" : "currentColor"}
                        d="M18.75 6c0 2.08-1.19 3.91-3 4.98V12c0 .83-.67 1.5-1.5 1.5h-4.5c-.83 0-1.5-.67-1.5-1.5v-1.02c-1.81-1.08-3-2.91-3-4.98C5.25 2.69 8.27 0 12 0s6.75 2.69 6.75 6zM9.38 8.25c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm6.75-1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zM4.8 15c.3-.6 1-.85 1.6-.55L12 17l5.6-2.55c.6-.3 1.35-.05 1.6.55s.05 1.35-.55 1.6L14.8 18l3.65 1.6c.6.3.85 1 .55 1.6s-1 .85-1.6.55L12 19l-5.6 2.75c-.6.3-1.35.05-1.6-.55s-.05-1.35.55-1.6L9.2 18l-3.65-1.6c-.6-.3-.85-1-.55-1.6z"
                    />
                </svg>
            )}
            role="switch"
            aria-checked={settings.store.isEnabled}
            redGlow={settings.store.isEnabled}
            onClick={() => (settings.store.isEnabled = !settings.store.isEnabled)}
        />
    );
}

export default definePlugin({
    name: "StreamCrasher",
    description: "Crashes your stream in Discord calls.",
    authors: [Devs.Velocity],
    settings,
    patches: [
        {
            find: "#{intl::ACCOUNT_SPEAKING_WHILE_MUTED}",
            replacement: {
                match: /className:\i\.buttons,.{0,50}children:\[/,
                replace: "$&$self.CrashButton(),"
            }
        }
    ],
    renderBadge: () => <AddonBadge text="BETA" type={AddonBadgeTypes.PRIMARY} icon={WarningIcon()()} />,
    CrashButton: ErrorBoundary.wrap(CrashButton, { noop: true })
});


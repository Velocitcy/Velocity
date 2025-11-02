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

import { showNotice } from "@api/Notices";
import { Emoji } from "@components/Emoji";
import { CogWheel, InfoIcon } from "@components/Icons";
import { AddonCard } from "@components/settings/AddonCard";
import { proxyLazy } from "@utils/lazy";
import { isObjectEmpty } from "@utils/misc";
import { Plugin } from "@utils/types";
import { React, showToast, Toasts } from "@webpack/common";
import { Settings } from "Velocity";

import { cl, logger } from ".";
import { openPluginModal } from "./PluginModal";

// Avoid circular dependency
const { startDependenciesRecursive, startPlugin, stopPlugin, isPluginEnabled } = proxyLazy(() => require("plugins") as typeof import("plugins"));

interface PluginCardProps extends React.HTMLProps<HTMLDivElement> {
    plugin: Plugin;
    disabled: boolean;
    onRestartNeeded(name: string, key: string): void;
    isNew?: boolean;
}

function renderDescription(description: string) {
    const parts: (string | React.JSX.Element)[] = [];
    const comboRegex = /((?:Keybind\("[^"]+"\)\s*\+\s*)+Keybind\("[^"]+"\))/g;
    const emojiRegex = /Emoji\("([^"]+)"\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = comboRegex.exec(description)) !== null) {
        if (match.index > lastIndex)
            parts.push(description.substring(lastIndex, match.index));

        const keys = match[1]
            .match(/Keybind\("([^"]+)"\)/g)!
            .map(k => k.match(/Keybind\("([^"]+)"\)/)![1]);

        parts.push(
            <div key={match.index} className="vc-keycombo" style={{ display: "inline-flex" }}>
                {keys.map((key, i) => (
                    <React.Fragment key={i}>
                        <kbd style={{
                            padding: "2px 4px",
                            borderRadius: "4px",
                            background: "var(--background-tertiary)",
                            fontWeight: "bold"
                        }}>{key.toUpperCase()}</kbd>
                        {i < keys.length - 1 && " + "}
                    </React.Fragment>
                ))}
            </div>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < description.length) {
        const remaining = description.substring(lastIndex);
        let eMatch: RegExpExecArray | null;
        let eLast = 0;
        emojiRegex.lastIndex = 0;
        while ((eMatch = emojiRegex.exec(remaining)) !== null) {
            if (eMatch.index > eLast)
                parts.push(remaining.substring(eLast, eMatch.index));
            parts.push(<Emoji key={`e${eMatch.index}`} name={eMatch[1]} />);
            eLast = eMatch.index + eMatch[0].length;
        }
        if (eLast < remaining.length)
            parts.push(remaining.substring(eLast));
    }

    return parts.length ? parts : [description];
}


export function PluginCard({ plugin, disabled, onRestartNeeded, onMouseEnter, onMouseLeave, isNew }: PluginCardProps) {
    const settings = Settings.plugins[plugin.name];

    const isEnabled = () => isPluginEnabled(plugin.name);

    function toggleEnabled() {
        const wasEnabled = isEnabled();

        // If we're enabling a plugin, make sure all deps are enabled recursively.
        if (!wasEnabled) {
            const { restartNeeded, failures } = startDependenciesRecursive(plugin);

            if (failures.length) {
                logger.error(`Failed to start dependencies for ${plugin.name}: ${failures.join(", ")}`);
                const msg = "Failed to start dependencies: " + failures.join(", ");
                showNotice({ type: "GENERIC", message: msg, buttonText: "Close", onClick: () => null });
                return;
            }

            if (restartNeeded) {
                // If any dependencies have patches, don't start the plugin yet.
                settings.enabled = true;
                onRestartNeeded(plugin.name, "enabled");
                return;
            }
        }

        // if the plugin has patches, dont use stopPlugin/startPlugin. Wait for restart to apply changes.
        if (plugin.patches?.length) {
            settings.enabled = !wasEnabled;
            onRestartNeeded(plugin.name, "enabled");
            return;
        }

        // If the plugin is enabled, but hasn't been started, then we can just toggle it off.
        if (wasEnabled && !plugin.started) {
            settings.enabled = !wasEnabled;
            return;
        }

        const result = wasEnabled ? stopPlugin(plugin) : startPlugin(plugin);

        if (!result) {
            settings.enabled = false;

            const msg = `Error while ${wasEnabled ? "stopping" : "starting"} plugin ${plugin.name}`;
            showToast(msg, Toasts.Type.FAILURE, {
                position: Toasts.Position.BOTTOM,
            });

            return;
        }

        settings.enabled = !wasEnabled;
    }

    return (
        <AddonCard
            name={plugin.name}
            description={renderDescription(plugin.description)}
            isNew={isNew}
            enabled={isEnabled()}
            setEnabled={toggleEnabled}
            disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            badge={plugin.renderBadge?.()}
            infoButton={
                <button
                    role="switch"
                    aria-checked="false"
                    onClick={() => openPluginModal(plugin, onRestartNeeded)}
                    className={cl("info-button")}
                    disabled={plugin.unavailable}
                    style={plugin.unavailable ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                >
                    {plugin.options && !isObjectEmpty(plugin.options)
                        ? <CogWheel className={cl("settings-button")} viewBox="0 0 24 24" width="24" height="24" />
                        : <InfoIcon className={cl("info-icon")} viewBox="0 0 24 24" width="24" height="24" />}

                </button>
            } />
    );
}

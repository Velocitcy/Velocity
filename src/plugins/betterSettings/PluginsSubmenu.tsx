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

import { openPluginModal } from "@components/settings/tabs";
import { getIntlMessage } from "@utils/discord";
import { isObjectEmpty } from "@utils/misc";
import { Alerts, Menu, useMemo, useState } from "@webpack/common";

import Plugins from "~plugins";

function onRestartNeeded() {
    Alerts.show({
        title: "Restart required",
        body: <p>You have changed settings that require a restart.</p>,
        confirmText: "Restart now",
        cancelText: "Later!",
        onConfirm: () => location.reload()
    });
}

export default function PluginsSubmenu() {
    const sortedPlugins = useMemo(() => Object.values(Plugins)
        .sort((a, b) => a.name.localeCompare(b.name)), []);
    const [query, setQuery] = useState("");

    const search = query.toLowerCase();
    const include = (p: typeof Plugins[keyof typeof Plugins]) => (
        Velocity.Plugins.isPluginEnabled(p.name)
        && p.options && !isObjectEmpty(p.options)
        && (
            p.name.toLowerCase().includes(search)
            || p.description.toLowerCase().includes(search)
            || p.tags?.some(t => t.toLowerCase().includes(search))
        )
    );

    const plugins = sortedPlugins.filter(include);

    return (
        <>
            <Menu.MenuControlItem
                id="vc-plugins-search"
                control={(props, ref) => (
                    <Menu.MenuSearchControl
                        {...props}
                        query={query}
                        onChange={setQuery}
                        ref={ref}
                        placeholder={getIntlMessage("SEARCH")}
                    />
                )}
            />

            {!!plugins.length && <Menu.MenuSeparator />}

            {plugins.map(p => (
                <Menu.MenuItem
                    key={p.name}
                    id={p.name}
                    label={p.name}
                    action={() => openPluginModal(p, onRestartNeeded)}
                />
            ))}
        </>
    );
}

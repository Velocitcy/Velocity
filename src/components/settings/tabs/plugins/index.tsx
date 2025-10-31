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

import * as DataStore from "@api/DataStore";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { HeadingTertiary } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { ChangeList } from "@utils/ChangeList";
import { Logger } from "@utils/Logger";
import { classes, isPluginDev } from "@utils/misc";
import { useAwaiter, useCleanupEffect } from "@utils/react";
import { Alerts, Button, Card, FormNotice, lodash, Parser, React, SearchBar, Select, Tooltip, useMemo, UserStore, useState } from "@webpack/common";
import { JSX } from "react";

import Plugins, { ExcludedPlugins } from "~plugins";

import { openContributorModal } from "./ContributorModal";
import { PluginCard } from "./PluginCard";

export const cl = classNameFactory("vc-plugins-");
export const logger = new Logger("PluginSettings", "#a6d189");

function ReloadRequiredCard({ required }: { required: boolean; }) {
    const user = UserStore?.getCurrentUser();
    const isDev = isPluginDev(user?.id);

    return (
        <>
            <Card className={classes(cl("info-card"), required && "vc-warning-card")}>
                {required ? (
                    <>
                        <HeadingTertiary>Restart required!</HeadingTertiary>
                        <Paragraph className={cl("dep-text")}>
                            Restart now to apply new plugins and their settings
                        </Paragraph>
                        <Button onClick={() => location.reload()} className={cl("restart-button")}>
                            Restart
                        </Button>
                    </>
                ) : (
                    <>
                        <HeadingTertiary>Plugin Management</HeadingTertiary>
                        <Paragraph>Press the cog wheel or info icon to get more info on a plugin</Paragraph>
                        <Paragraph>Plugins with a cog wheel have settings you can modify!</Paragraph>
                        <Paragraph
                            style={{
                                color: "var(--text-feedback-positive)",
                                fontWeight: 500,
                            }}
                        >
                            <b>TIP:</b> Use # to reveal search filters!
                        </Paragraph>
                    </>
                )}
            </Card>

            {!required && isDev && (
                <FormNotice
                    messageType="info"
                    className="vc-reload-notice"
                >
                    See what plugins you've contributed to{" "}
                    <a
                        onClick={() => openContributorModal(user)}
                        style={{
                            color: "var(--text-link)",
                            textDecoration: "underline",
                            cursor: "pointer",
                        }}
                    >
                        here
                    </a>.
                </FormNotice>
            )}
        </>
    );
}



const enum SearchStatus {
    ALL,
    ENABLED,
    DISABLED,
    NEW
}

function ExcludedPluginsList({ search }: { search: string; }) {
    const normalized = search.trim().toLowerCase();
    const isFilter = normalized.startsWith("#");

    const FILTER_KEYS: Record<string, string[]> = {
        type: ["setting", "info"],
        badge: ["true", "false"],
        patches: ["true", "false"],
        author: ["authorname"],
    };

    const incompleteMatch = normalized.match(/^#(\w+)\s*([^\s#]*)$/);
    const hasClosingHash = normalized.endsWith("#") && normalized.indexOf("#") !== normalized.lastIndexOf("#");
    const isIncomplete = !!incompleteMatch && !hasClosingHash;

    if (isFilter && isIncomplete) {
        return (
            <Paragraph className={Margins.top16}>
                <Paragraph style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    Woah, you have came across a secret filter system. Check it out!
                </Paragraph>

                <ul style={{ listStyle: "disc", marginLeft: "20px" }}>
                    {Object.entries(FILTER_KEYS).map(([key, values]) => (
                        <li key={key} style={{ marginBottom: "8px" }}>
                            <code
                                style={{
                                    background: "var(--background-secondary)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                }}
                            >
                                #{key}
                            </code>
                            {"  "}
                            →{" "}
                            {values.map((v, i) => (
                                <React.Fragment key={v}>
                                    <code
                                        style={{
                                            background: "var(--background-tertiary)",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {v}
                                    </code>
                                    {i < values.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                        </li>
                    ))}
                </ul>

                <Paragraph style={{ marginTop: "10px", fontSize: "13px", color: "var(--text-normal)" }}>
                    Start a filter with <code>#</code>, add a key and value, then close it with another <code>#</code>.<br />
                    Example: <code>#type setting#</code><br />
                    You can chain multiple filters like <code>#type setting# #badge true#</code>.<br />
                </Paragraph>
            </Paragraph>
        );
    }

    if (isFilter && hasClosingHash) {
        return (
            <Paragraph className={Margins.top16}>
                No plugins meet the search criteria.
            </Paragraph>
        );
    }

    const matchingExcludedPlugins = Object.entries(ExcludedPlugins).filter(([name]) =>
        name.toLowerCase().includes(search)
    );
    const ExcludedReasons: Record<
        "web" | "discordDesktop" | "vesktop" | "desktop" | "dev",
        string
    > = {
        desktop: "Discord Desktop app or Vesktop",
        discordDesktop: "Discord Desktop app",
        vesktop: "Vesktop app",
        web: "Vesktop app and the Web version of Discord",
        dev: "Developer version of Velocity",
    };

    return (
        <Paragraph className={Margins.top16}>
            {matchingExcludedPlugins.length ? (
                <>
                    <Paragraph>Are you looking for:</Paragraph>
                    <ul>
                        {matchingExcludedPlugins.map(([name, reason]) => (
                            <li key={name}>
                                <b>{name}</b>: Only available on the {ExcludedReasons[reason]}
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                "No plugins meet the search criteria."
            )}
        </Paragraph>
    );
}


function PluginSettings() {
    const settings = useSettings();
    const changes = useMemo(() => new ChangeList<string>(), []);

    useCleanupEffect(() => {
        if (changes.hasChanges)
            Alerts.show({
                title: "Restart required",
                body: (
                    <>
                        <p>The following plugins require a restart:</p>
                        <div>{changes.map((s, i) => (
                            <>
                                {i > 0 && ", "}
                                {Parser.parse("`" + s.split(".")[0] + "`")}
                            </>
                        ))}</div>
                    </>
                ),
                confirmText: "Restart now",
                cancelText: "Later!",
                onConfirm: () => location.reload()
            });
    }, []);

    const depMap = useMemo(() => {
        const o = {} as Record<string, string[]>;
        for (const plugin in Plugins) {
            const deps = Plugins[plugin].dependencies;
            if (deps) {
                for (const dep of deps) {
                    o[dep] ??= [];
                    o[dep].push(plugin);
                }
            }
        }
        return o;
    }, []);

    const sortedPlugins = useMemo(() =>
        Object.values(Plugins).sort((a, b) => a.name.localeCompare(b.name)),
        []
    );

    const [searchValue, setSearchValue] = useState({ value: "", status: SearchStatus.ALL });

    const search = searchValue.value.toLowerCase();
    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));
    const onStatusChange = (status: SearchStatus) => setSearchValue(prev => ({ ...prev, status }));

    const pluginFilter = (plugin: typeof Plugins[keyof typeof Plugins]) => {
        const { status } = searchValue;
        const enabled = Velocity.Plugins.isPluginEnabled(plugin.name);

        // status filter
        switch (status) {
            case SearchStatus.DISABLED: if (enabled) return false; break;
            case SearchStatus.ENABLED: if (!enabled) return false; break;
            case SearchStatus.NEW: if (!newPlugins?.includes(plugin.name)) return false; break;
        }

        let query = search.trim().toLowerCase();
        if (!query.length) return true;

        // ---- parse inline filters:  #key value#
        const inlineFilters: Array<{ key: string; value: string; }> = [];
        const inlineRegex = /#([a-z]+)\s+([^#]+)#/g;
        let m;
        while ((m = inlineRegex.exec(query)) !== null) {
            inlineFilters.push({ key: m[1].toLowerCase(), value: m[2].trim().toLowerCase() });
        }
        const remainingSearch = query.replace(inlineRegex, "").trim();

        // apply inline filters
        if (inlineFilters.length) {
            for (const { key, value } of inlineFilters) {
                let ok = false;
                switch (key) {
                    case "type": {
                        switch (value) {
                            case "setting":
                            case "settings":
                                ok = !!plugin.options && Object.keys(plugin.options).length > 0;
                                break;
                            case "info":
                            case "information":
                                ok = !plugin.options || Object.keys(plugin.options).length === 0;
                                break;
                        }
                        break;
                    }
                    case "badge": {
                        const wants = ["true", "1", "yes"].includes(value);
                        const has =
                            typeof plugin.renderBadge === "function" ||
                            Boolean((plugin as any).badge) ||
                            Boolean((plugin as any).badges?.length);
                        ok = wants ? has : !has;
                        break;
                    }
                    case "patches": {
                        const wants = ["true", "1", "yes"].includes(value);
                        const has = Array.isArray(plugin.patches) && plugin.patches.length > 0;
                        ok = wants ? has : !has;
                        break;
                    }
                    case "author": {
                        const authors = (plugin as any).authors as Array<{ name?: string; } | string> | undefined;
                        ok =
                            authors?.some(a =>
                                typeof a === "string"
                                    ? a.toLowerCase().includes(value)
                                    : typeof a?.name === "string" && a.name.toLowerCase().includes(value)
                            ) ?? false;
                        break;
                    }
                    default:
                        ok = true;
                        break;
                }
                if (!ok) return false;
            }
            // ✔ if all inline filters matched and there is NO free text, accept
            if (!remainingSearch) return true;
            // otherwise continue and match remaining free text below
            query = remainingSearch;
        }

        // ---- legacy single-filter syntax (tolerate trailing #)
        switch (true) {
            case query.startsWith("#author "): {
                const args = query.replace(/^#author\s+/, "").replace(/#$/, "").trim().split(/\s+/);
                const authorQuery = args[0]?.toLowerCase();
                const pluginQuery = args[1]?.toLowerCase();

                const authors = (plugin as any).authors as Array<{ name?: string; } | string> | undefined;
                const authorMatches =
                    authors?.some(a =>
                        typeof a === "string"
                            ? a.toLowerCase().includes(authorQuery)
                            : typeof a?.name === "string" && a.name.toLowerCase().includes(authorQuery)
                    ) ?? false;

                const pluginMatches =
                    !pluginQuery ||
                    plugin.name.toLowerCase().includes(pluginQuery) ||
                    (typeof plugin.description === "string" && plugin.description.toLowerCase().includes(pluginQuery));

                return authorMatches && pluginMatches;
            }

            case query.startsWith("#badge "): {
                const raw = query.replace(/^#badge\s+/, "").replace(/#$/, "").trim();
                const wants = ["true", "1", "yes"].includes(raw);
                const has =
                    typeof plugin.renderBadge === "function" ||
                    Boolean((plugin as any).badge) ||
                    Boolean((plugin as any).badges?.length);
                return wants ? has : !has;
            }

            case query.startsWith("#patches "): {
                const raw = query.replace(/^#patches\s+/, "").replace(/#$/, "").trim();
                const wants = ["true", "1", "yes"].includes(raw);
                const has = Array.isArray(plugin.patches) && plugin.patches.length > 0;
                return wants ? has : !has;
            }

            case query.startsWith("#type "): {
                const raw = query.replace(/^#type\s+/, "").replace(/#$/, "").trim();
                switch (raw) {
                    case "setting":
                    case "settings":
                        return !!plugin.options && Object.keys(plugin.options).length > 0;
                    case "info":
                    case "information":
                        return !plugin.options || Object.keys(plugin.options).length === 0;
                    default:
                        return false;
                }
            }
        }

        // ---- plain text search (either after inline remainder, or normal)
        switch (true) {
            case plugin.name.toLowerCase().includes(query):
            case typeof plugin.description === "string" && plugin.description.toLowerCase().includes(query):
            case plugin.tags?.some(t => t.toLowerCase().includes(query)):
                return true;
            default:
                return false;
        }
    };








    const [newPlugins] = useAwaiter(() => DataStore.get("Velocity_existingPlugins").then((cachedPlugins: Record<string, number> | undefined) => {
        const now = Date.now() / 1000;
        const existingTimestamps: Record<string, number> = {};
        const sortedPluginNames = Object.values(sortedPlugins).map(plugin => plugin.name);

        const newPlugins: string[] = [];
        for (const { name: p } of sortedPlugins) {
            const time = existingTimestamps[p] = cachedPlugins?.[p] ?? now;
            if ((time + 60 * 60 * 24 * 2) > now) {
                newPlugins.push(p);
            }
        }
        DataStore.set("Velocity_existingPlugins", existingTimestamps);

        return lodash.isEqual(newPlugins, sortedPluginNames) ? [] : newPlugins;
    }));

    const plugins = [] as JSX.Element[];
    const requiredPlugins = [] as JSX.Element[];

    const showApi = searchValue.value.includes("API");
    for (const p of sortedPlugins) {
        if (p.hidden || (!p.options && p.name.endsWith("API") && !showApi))
            continue;

        if (!pluginFilter(p)) continue;

        const isRequired = p.required || p.isDependency || depMap[p.name]?.some(d => settings.plugins[d].enabled);
        const isUnavailable = p.unavailable;

        if (isUnavailable) {
            plugins.push(
                <Tooltip text="This plugin is currently unavailable" key={p.name}>
                    {({ onMouseLeave, onMouseEnter }) => (
                        <PluginCard
                            onMouseLeave={onMouseLeave}
                            onMouseEnter={onMouseEnter}
                            onRestartNeeded={() => { }}
                            disabled={true}
                            plugin={p}
                            key={p.name}
                            style={{ pointerEvents: "none", opacity: 0.5 }}
                        />
                    )}
                </Tooltip>
            );
        } else if (isRequired) {
            const tooltipText = p.required || !depMap[p.name]
                ? "This plugin is required for Velocity to function."
                : makeDependencyList(depMap[p.name]?.filter(d => settings.plugins[d].enabled));

            requiredPlugins.push(
                <Tooltip text={tooltipText} key={p.name}>
                    {({ onMouseLeave, onMouseEnter }) => (
                        <PluginCard
                            onMouseLeave={onMouseLeave}
                            onMouseEnter={onMouseEnter}
                            onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                            disabled={true}
                            plugin={p}
                            key={p.name}
                        />
                    )}
                </Tooltip>
            );
        } else {
            plugins.push(
                <PluginCard
                    onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                    disabled={false}
                    plugin={p}
                    isNew={newPlugins?.includes(p.name)}
                    key={p.name}
                />
            );
        }
    }

    return (
        <SettingsTab title="Plugins">
            <ReloadRequiredCard required={changes.hasChanges} />

            <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                Filters
            </HeadingTertiary>

            <div className={classes(Margins.bottom20, cl("filter-controls"))}>
                <ErrorBoundary noop>
                    <SearchBar
                        autoFocus
                        query={searchValue.value}
                        placeholder="Search for a plugin..."
                        onChange={onSearch}
                        onClear={() => setSearchValue(prev => ({ ...prev, value: "" }))}
                        className={cl("search-input")}
                    />
                </ErrorBoundary>
                <div>
                    <ErrorBoundary noop>
                        <Select
                            options={[
                                { label: "Show All", value: SearchStatus.ALL, default: true },
                                { label: "Show Enabled", value: SearchStatus.ENABLED },
                                { label: "Show Disabled", value: SearchStatus.DISABLED },
                                { label: "Show New", value: SearchStatus.NEW }
                            ]}
                            serialize={String}
                            select={onStatusChange}
                            isSelected={v => v === searchValue.status}
                            closeOnSelect={true}
                        />
                    </ErrorBoundary>
                </div>
            </div>

            <HeadingTertiary className={Margins.top20}>Plugins</HeadingTertiary>

            {plugins.length || requiredPlugins.length
                ? (
                    <div className={cl("grid")}>
                        {plugins.length
                            ? plugins
                            : <Paragraph>No plugins meet the search criteria.</Paragraph>
                        }
                    </div>
                )
                : <ExcludedPluginsList search={search} />
            }


            <Divider className={Margins.top20} />

            <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                Required Plugins
            </HeadingTertiary>
            <div className={cl("grid")}>
                {requiredPlugins.length
                    ? requiredPlugins
                    : <Paragraph>No plugins meet the search criteria.</Paragraph>
                }
            </div>
        </SettingsTab >
    );
}

function makeDependencyList(deps: string[]) {
    return (
        <>
            <Paragraph>This plugin is required by:</Paragraph>
            {deps.map((dep: string) => <Paragraph key={dep} className={cl("dep-text")}>{dep}</Paragraph>)}
        </>
    );
}

export default wrapTab(PluginSettings, "Plugins");

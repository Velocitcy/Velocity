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

import { get, set } from "@api/DataStore";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { HeadingTertiary } from "@components/Heading";
import { DeleteIcon, ErrorIcon, InfoIcon, LogIcon, PlusIcon } from "@components/Icons";
import { Margins } from "@components/margins";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { debounce } from "@shared/debounce";
import { copyWithToast } from "@utils/misc";
import { filters, search } from "@webpack";
import { Button, Forms, React, Select, TextInput, useState } from "@webpack/common";

const searchTypes = [
    { label: "findByCode", value: "code" },
    { label: "findByProps", value: "props" },
    { label: "findComponentByCode", value: "componentByCode" },
    { label: "findModuleId", value: "moduleId" }
];

const findModule = debounce(function ({
    queries,
    searchType,
    useLazy,
    setModule,
    setError
}: {
    queries: string[];
    searchType: string;
    useLazy: boolean;
    setModule: (value: [string, Function] | null) => void;
    setError: (value: string | undefined) => void;
}) {
    try {
        if (queries.length === 0) {
            setError("You need at least one filter");
            setModule(null);
            return;
        }

        if (queries.some(q => !q.trim())) {
            setError("All filters must be filled");
            setModule(null);
            return;
        }

        const cleanQueries = queries.filter(q => q.trim());
        let moduleId: string | null = null;
        const filterFns: ((mod: any) => boolean)[] = [];

        if (searchType === "code") {
            cleanQueries.forEach(q => filterFns.push(filters.byCode(q)));
        } else if (searchType === "props") {
            cleanQueries.forEach(q => {
                const props = q.split(",").map(p => p.trim()).filter(Boolean);
                filterFns.push(filters.byProps(...props));
            });
        } else if (searchType === "componentByCode") {
            cleanQueries.forEach(q => filterFns.push(filters.componentByCode(q)));
        } else if (searchType === "moduleId") {
            moduleId = cleanQueries[0];
        }

        const candidates: Record<string, Function> = search(/.*/);
        const matches: [string, Function][] = [];

        if (moduleId) {
            if (candidates[moduleId]) {
                setModule([moduleId, candidates[moduleId]]);
                setError(undefined);
            } else {
                setError("Module ID not found");
                setModule(null);
            }
            return;
        }

        for (const id in candidates) {
            const func = candidates[id];
            try {
                const passesAll = filterFns.every(fn => fn(func));
                if (passesAll) matches.push([id, func]);
            } catch {
                /* ignore bad modules */
            }
        }

        if (matches.length === 0) {
            setError("No modules found");
            setModule(null);
        } else if (matches.length > 1) {
            setError(`${matches.length} modules were found, Please be more specific.`);
            setModule(null);
        } else {
            setError(undefined);
            setModule(matches[0]);
        }
    } catch (e) {
        setError((e as Error).message);
        setModule(null);
        console.error("[SearchHelper] Error while searching:", e);
    }
});

function SearchHelper() {
    const [queries, setQueries] = useState<string[]>([]);
    const [searchType, setSearchType] = useState("code");
    const [useLazy, setUseLazy] = useState(false);
    const [error, setError] = useState<string>();
    const [module, setModule] = useState<[string, Function] | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load filters before rendering
    React.useEffect(() => {
        (async () => {
            const saved = (await get("SearchHelper")) ?? { filters: [""] };
            setQueries(saved.filters ?? [""]);
            setLoaded(true);
        })();
    }, []);

    // Save filters automatically
    React.useEffect(() => {
        if (loaded) set("SearchHelper", { filters: queries });
    }, [queries, loaded]);

    function onQueryChange(index: number, value: string) {
        const newQueries = [...queries];
        newQueries[index] = value;
        setQueries(newQueries);
        findModule({ queries: newQueries, searchType, useLazy, setModule, setError });
    }

    function addFilter() {
        const newQueries = [...queries, ""];
        setQueries(newQueries);
        findModule({ queries: newQueries, searchType, useLazy, setModule, setError });
    }

    function removeFilter(index: number) {
        const newQueries = queries.filter((_, i) => i !== index);
        setQueries(newQueries);
        findModule({ queries: newQueries, searchType, useLazy, setModule, setError });
    }

    function onSearchTypeChange(v: string) {
        setSearchType(v);
        findModule({ queries, searchType: v, useLazy, setModule, setError });
    }

    function printModules() {
        const candidates: Record<string, Function> = search(/.*/);
        const results: [string, Function][] = [];

        try {
            const cleanQueries = queries.filter(q => q.trim());
            const filterFns: ((mod: any) => boolean)[] = [];

            if (searchType === "code") {
                cleanQueries.forEach(q => filterFns.push(filters.byCode(q)));
            } else if (searchType === "props") {
                cleanQueries.forEach(q => {
                    const props = q.split(",").map(p => p.trim()).filter(Boolean);
                    filterFns.push(filters.byProps(...props));
                });
            } else if (searchType === "componentByCode") {
                cleanQueries.forEach(q => filterFns.push(filters.componentByCode(q)));
            }

            for (const id in candidates) {
                const func = candidates[id];
                try {
                    const passesAll = filterFns.every(fn => fn(func));
                    if (passesAll) results.push([id, func]);
                } catch { }
            }

            if (results.length === 0) {
                console.warn("No modules found to print");
            } else {
                console.log(`Found ${results.length} module(s):`, results.map(m => m[1]));
            }
        } catch (e) {
            console.error("Error printing modules:", e);
        }
    }

    if (!loaded) {
        return (
            <SettingsTab title="Search Helper"></SettingsTab>
        );
    }

    return (
        <SettingsTab title="Search Helper">
            <HeadingTertiary className={Margins.top8}>Search by</HeadingTertiary>
            <Select
                options={searchTypes}
                isSelected={v => v === searchType}
                select={onSearchTypeChange}
                serialize={v => v}
                clearable={searchType !== "code"}
                clear={() => setSearchType("code")}
            />

            <Divider style={{ margin: "20px 0" }} />

            <FormSwitch
                className={Margins.top16}
                value={useLazy}
                onChange={setUseLazy}
                title="Is Lazy"
                description="Is the module lazy loaded?"
                hideBorder={false}
            />

            <HeadingTertiary className={Margins.top8}>Filters</HeadingTertiary>
            <Forms.FormText className={Margins.bottom8}>
                Put your filters to search as
            </Forms.FormText>

            {queries.map((query, index) => (
                <Flex key={index} style={{ gap: 8, marginBottom: 10 }}>
                    <TextInput
                        type="text"
                        value={query}
                        onChange={v => onQueryChange(index, v)}
                        placeholder="Filter"
                    />
                    {index > 0 && (
                        <Button
                            size={Button.Sizes.MIN}
                            onClick={() => removeFilter(index)}
                            style={{
                                background: "none",
                                color: "var(--status-danger)"
                            }}
                        >
                            <DeleteIcon width="24" height="24" viewBox="0 0 24 24" />
                        </Button>
                    )}
                </Flex>
            ))}

            <Flex style={{ gap: 8, marginBottom: 10 }} className={Margins.top8}>
                <Button
                    onClick={addFilter}
                    icon={() => <PlusIcon width="20" height="20" viewBox="0 0 24 24" />}
                    size="small"
                    color="brand"
                >
                    Add Filter
                </Button>

                {queries.some(q => q.trim()) && (
                    <Button
                        size="small"
                        color="GREEN"
                        icon={() => <LogIcon width="20" height="20" viewBox="0 0 24 24" />}
                        onClick={printModules}
                    >
                        Print
                    </Button>
                )}
            </Flex>

            {(error || module) && (
                <>
                    {(error ? (
                        <ErrorIcon width="18" height="18" viewBox="0 0 24 24" style={{ color: "var(--status-danger)", verticalAlign: "middle", marginRight: 6 }} />
                    ) : (
                        <InfoIcon width="18" height="18" viewBox="0 0 24 24" style={{ color: "var(--info-help-foreground)", verticalAlign: "middle", marginRight: 6 }} />
                    ))}

                    <Forms.FormText
                        style={{
                            color: error ? "var(--status-danger)" : "var(--text-feedback-info)",
                            display: "inline"
                        }}
                    >
                        {error || "Find: OK"}
                    </Forms.FormText>
                </>
            )}

            {module && (
                <>
                    <Divider className={Margins.top16} />
                    <HeadingTertiary className={Margins.top16}>Module {module[0]}</HeadingTertiary>
                    <CodeBlock lang="js" content={module[1].toString()} />
                    <Flex className={Margins.top8}>
                        <Button onClick={() => copyWithToast(module[1].toString())}>
                            Copy Module Code
                        </Button>
                        <Button onClick={() => copyWithToast(module[0])}>
                            Copy Module ID
                        </Button>
                    </Flex>
                </>
            )}
        </SettingsTab>
    );
}

export default (IS_DEV ? wrapTab(SearchHelper, "SearchHelper") : null) as any;

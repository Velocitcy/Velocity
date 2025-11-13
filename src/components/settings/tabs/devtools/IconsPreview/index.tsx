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

import { Flex } from "@components/Flex";
import * as Icons from "@components/Icons";
import { ContextMenuApi, SearchBar, useState } from "@webpack/common";

import { IconContextMenu } from "./iconContextMenu";

export function IconsTab() {
    const [search, setSearch] = useState("");

    const iconEntries = Object.entries(Icons).filter(([name]) => name !== "Icon" && name !== "IconProps");

    const filteredIcons = iconEntries.filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    const browserIcons = ["ChromeIcon", "EdgeIcon", "FirefoxIcon", "IEIcon", "OperaIcon", "SafariIcon"];

    const handleContextMenu = (e: React.MouseEvent, iconName: string, iconProps: Record<string, any>) => {
        ContextMenuApi.openContextMenu(e, () => (
            <IconContextMenu iconName={iconName} iconProps={iconProps} onClose={() => ContextMenuApi.closeContextMenu()} />
        ));
    };

    return (
        <>
            <Flex flexDirection="column" style={{ gap: 5 }}>
                <SearchBar
                    autoFocus={true}
                    placeholder="Search icons..."
                    query={search}
                    onClear={() => setSearch("")}
                    onChange={setSearch}
                />
            </Flex>

            <div className="vc-icon-preview-grid">
                {filteredIcons.map(([name, IconComponent]) => {
                    const iconProps = {
                        className: "vc-icon",
                        height: 24,
                        width: 24,
                        viewBox: browserIcons.includes(name) ? "0 0 512 512" : "0 0 24 24",
                        fill: "currentColor"
                    };

                    return (
                        <div
                            key={name}
                            className="vc-icon-preview"
                            onContextMenu={e => handleContextMenu(e, name, iconProps)}
                        >
                            <IconComponent {...iconProps} />
                            <span className="vc-icon-preview-name">{name.replace(/([A-Z])/g, " $1").trim()}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

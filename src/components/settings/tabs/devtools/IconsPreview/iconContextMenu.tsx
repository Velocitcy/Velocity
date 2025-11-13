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

import { copyWithToast } from "@utils/misc";
import { Menu } from "@webpack/common";

interface IconContextMenuProps {
    iconName: string;
    iconProps: Record<string, any>;
    onClose: () => void;
}

export function IconContextMenu({ iconName, iconProps, onClose }: IconContextMenuProps) {
    const formatProps = (props: Record<string, any>) =>
        Object.entries(props)
            .map(([key, val]) => {
                const strVal = typeof val === "string" ? `"${val}"` : val;
                return `${key}=${strVal}`;
            })
            .join(" ");

    const propsStr = formatProps(iconProps);

    const copyImport = () => {
        copyWithToast(`import { ${iconName} } from "@components/Icons";`, "Copied import!");
        onClose();
    };

    const copyComponent = () => {
        copyWithToast(`<${iconName} ${propsStr} />`, "Copied component!");
        onClose();
    };

    const copyProps = () => {
        copyWithToast(propsStr, "Copied props!");
        onClose();
    };

    const copyName = () => {
        copyWithToast(iconName, "Copied name!");
        onClose();
    };

    return (
        <Menu.Menu navId="icon-context" onClose={onClose}>
            <Menu.MenuItem id="copy-import" label="Copy Import" action={copyImport} />
            <Menu.MenuItem id="copy-component" label="Copy Component" action={copyComponent} />
            <Menu.MenuItem id="copy-props" label="Copy Props" action={copyProps} />
            <Menu.MenuSeparator />
            <Menu.MenuItem id="copy-name" label="Copy Name" action={copyName} />
        </Menu.Menu>
    );
}

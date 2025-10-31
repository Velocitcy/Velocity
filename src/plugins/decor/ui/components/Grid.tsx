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

import { React } from "@webpack/common";
import { JSX } from "react";

import { cl } from "../";

export interface GridProps<ItemT> {
    renderItem: (item: ItemT) => JSX.Element;
    getItemKey: (item: ItemT) => string;
    itemKeyPrefix?: string;
    items: Array<ItemT>;
}

export default function Grid<ItemT,>({ renderItem, getItemKey, itemKeyPrefix: ikp, items }: GridProps<ItemT>) {
    return <div className={cl("sectioned-grid-list-grid")}>
        {items.map(item =>
            <React.Fragment
                key={`${ikp ? `${ikp}-` : ""}${getItemKey(item)}`}
            >
                {renderItem(item)}
            </React.Fragment>
        )}
    </div>;
}

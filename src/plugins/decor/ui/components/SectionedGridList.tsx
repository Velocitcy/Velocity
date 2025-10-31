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

import { classes } from "@utils/misc";
import { findByPropsLazy } from "@webpack";
import { React } from "@webpack/common";
import { JSX } from "react";

import { cl } from "../";
import Grid, { GridProps } from "./Grid";

const ScrollerClasses = findByPropsLazy("managedReactiveScroller");

type Section<SectionT, ItemT> = SectionT & {
    items: Array<ItemT>;
};

interface SectionedGridListProps<ItemT, SectionT, SectionU = Section<SectionT, ItemT>> extends Omit<GridProps<ItemT>, "items"> {
    renderSectionHeader: (section: SectionU) => JSX.Element;
    getSectionKey: (section: SectionU) => string;
    sections: SectionU[];
}

export default function SectionedGridList<ItemT, SectionU,>(props: SectionedGridListProps<ItemT, SectionU>) {
    return <div className={classes(cl("sectioned-grid-list-container"), ScrollerClasses.thin)}>
        {props.sections.map(section => <div key={props.getSectionKey(section)} className={cl("sectioned-grid-list-section")}>
            {props.renderSectionHeader(section)}
            <Grid
                renderItem={props.renderItem}
                getItemKey={props.getItemKey}
                itemKeyPrefix={props.getSectionKey(section)}
                items={section.items}
            />
        </div>)}
    </div>;
}

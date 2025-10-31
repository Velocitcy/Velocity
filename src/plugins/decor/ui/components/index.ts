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

import { findComponentByCode, LazyComponentWebpack } from "@webpack";
import { React } from "@webpack/common";
import type { ComponentType, HTMLProps, PropsWithChildren } from "react";

import { AvatarDecoration } from "../..";

type DecorationGridItemComponent = ComponentType<PropsWithChildren<HTMLProps<HTMLDivElement>> & {
    onSelect: () => void,
    isSelected: boolean,
}>;

export let DecorationGridItem: DecorationGridItemComponent;
export const setDecorationGridItem = v => DecorationGridItem = v;

export const AvatarDecorationModalPreview = LazyComponentWebpack(() => {
    const component = findComponentByCode(".shopPreviewBanner");
    return React.memo(component);
});

type DecorationGridDecorationComponent = React.ComponentType<HTMLProps<HTMLDivElement> & {
    avatarDecoration: AvatarDecoration;
    onSelect: () => void,
    isSelected: boolean,
}>;

export let DecorationGridDecoration: DecorationGridDecorationComponent;
export const setDecorationGridDecoration = v => DecorationGridDecoration = v;

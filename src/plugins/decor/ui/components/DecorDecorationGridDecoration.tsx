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

import { ContextMenuApi } from "@webpack/common";
import type { HTMLProps } from "react";

import { Decoration } from "../../lib/api";
import { decorationToAvatarDecoration } from "../../lib/utils/decoration";
import { DecorationGridDecoration } from ".";
import DecorationContextMenu from "./DecorationContextMenu";

interface DecorDecorationGridDecorationProps extends HTMLProps<HTMLDivElement> {
    decoration: Decoration;
    isSelected: boolean;
    onSelect: () => void;
}

export default function DecorDecorationGridDecoration(props: DecorDecorationGridDecorationProps) {
    const { decoration } = props;

    return <DecorationGridDecoration
        {...props}
        onContextMenu={e => {
            ContextMenuApi.openContextMenu(e, () => (
                <DecorationContextMenu
                    decoration={decoration}
                />
            ));
        }}
        avatarDecoration={decorationToAvatarDecoration(decoration)}
    />;
}

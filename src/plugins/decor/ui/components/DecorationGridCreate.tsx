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

import { PlusIcon } from "@components/Icons";
import { getIntlMessage } from "@utils/discord";
import { Text } from "@webpack/common";
import { HTMLProps } from "react";

import { DecorationGridItem } from ".";

type DecorationGridCreateProps = HTMLProps<HTMLDivElement> & {
    onSelect: () => void;
};

export default function DecorationGridCreate(props: DecorationGridCreateProps) {
    return <DecorationGridItem
        {...props}
        isSelected={false}
    >
        <PlusIcon />
        <Text
            variant="text-xs/normal"
            color="header-primary"
        >
            {getIntlMessage("CREATE")}
        </Text>
    </DecorationGridItem >;
}

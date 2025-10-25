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

import { findByPropsLazy } from "@webpack";
import { Parser } from "@webpack/common";

const CodeContainerClasses = findByPropsLazy("markup", "codeContainer");

/**
 * Renders code in a Discord codeblock
 */
export function CodeBlock(props: { content?: string, lang?: string; }) {
    return (
        <div className={CodeContainerClasses.markup}>
            {Parser.defaultRules.codeBlock.react(props, null, {})}
        </div>
    );
}

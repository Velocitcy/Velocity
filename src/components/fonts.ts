/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { classNameFactory } from "@api/Styles";

const fontCls = classNameFactory("vc-text-");

const Sizes = ["xs", "sm", "base", "md", "lg", "xl", "2xl"] as const;
const Weights = ["normal", "medium", "semibold", "bold"] as const;

export type FontSize = (typeof Sizes)[number];
export type FontWeight = (typeof Weights)[number];

export const Fonts: Record<`${FontSize}${Capitalize<FontWeight>}`, string> = {} as any;

export function generateFontCss() {
    let css = "";

    for (const size of Sizes) {
        for (const weight of Weights) {
            const cl = fontCls(`${size}-${weight}`);
            const key = `${size}${weight.charAt(0).toUpperCase() + weight.slice(1)}` as `${FontSize}${Capitalize<FontWeight>}`;
            Fonts[key] = cl;
            css += `.${cl}{font-size:var(--font-size-${size});font-weight:var(--font-weight-${weight});}`;
        }
    }

    return css;
}

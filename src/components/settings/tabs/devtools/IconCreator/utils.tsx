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

import { SvgElement } from "./types";

export function renderElement(svg: SvgElement, index: number) {
    const props: any = { key: index };

    if (svg.fill) props.fill = svg.fill;
    if (svg.fillRule) props.fillRule = svg.fillRule;
    if (svg.clipRule) props.clipRule = svg.clipRule;

    switch (svg.type) {
        case "path":
            if (svg.d) props.d = svg.d;
            return <path {...props} />;
        case "circle":
            if (svg.cx) props.cx = svg.cx;
            if (svg.cy) props.cy = svg.cy;
            if (svg.r) props.r = svg.r;
            return <circle {...props} />;
        case "polygon":
            if (svg.points) props.points = svg.points;
            return <polygon {...props} />;
        default:
            return null;
    }
}

export function generateCode(svgs: SvgElement[], width: string, height: string, viewBox: string): string {
    const elements = svgs.map(p => {
        let attrs = "";
        const fillValue = p.fill || "currentColor";
        attrs += ` fill="${fillValue}"`;
        if (p.fillRule) attrs += ` fillRule="${p.fillRule}"`;
        if (p.clipRule) attrs += ` clipRule="${p.clipRule}"`;

        switch (p.type) {
            case "path":
                return `<path d="${p.d}"${attrs} />`;
            case "circle":
                return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"${attrs} />`;
            case "polygon":
                return `<polygon points="${p.points}"${attrs} />`;
            default:
                return "";
        }
    }).join("\n            ");

    const finalWidth = width || "24";
    const finalHeight = height || "24";
    const finalViewBox = viewBox || "0 0 24 24";

    let iconProps = "";
    if (finalWidth !== "24") iconProps += `\n            width="${finalWidth}"`;
    if (finalHeight !== "24") iconProps += `\n            height="${finalHeight}"`;
    if (finalViewBox !== "0 0 24 24") iconProps += `\n            viewBox="${finalViewBox}"`;

    return `export function CustomIcon(props: IconProps) {
    return (
        <Icon
            {...props}${iconProps}
        >
            ${elements}
        </Icon>
    );
}`;
}
export const makeEmptySvg = (): SvgElement => ({
    type: "path",
    d: "",
    fill: ""
});

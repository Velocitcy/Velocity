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

import "./BaseText.css";

import { classNameFactory } from "@api/Styles";
import { classes } from "@utils/misc";
import type { Text as DiscordText } from "@velocity-types";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

const textCls = classNameFactory("vc-text-");

const Sizes = {
    xxs: "0.625rem",
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
    xxl: "2rem"
} as const;

const Weights = {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
} as const;

export function generateTextCss() {
    let css = "";

    for (const [size, value] of Object.entries(Sizes)) {
        css += `.${textCls(size)}{font-size:${value};}`;
    }

    for (const [weight, value] of Object.entries(Weights)) {
        css += `.${textCls(weight)}{font-weight:${value};}`;
    }

    return css;
}

export type TextSize = keyof typeof Sizes;
export type TextWeight = keyof typeof Weights;
export type TextTag = "div" | "span" | "p" | `h${1 | 2 | 3 | 4 | 5 | 6}`;

export type BaseTextProps<Tag extends TextTag = "div"> = ComponentPropsWithoutRef<Tag> & {
    size?: TextSize;
    weight?: TextWeight;
    tag?: Tag;
};

export function BaseText<T extends TextTag = "div">(props: BaseTextProps<T>): ReactNode {
    const {
        size = "md",
        weight = "normal",
        tag: Tag = "div",
        children,
        className,
        ...restProps
    } = props;

    return (
        <Tag className={classes(textCls("base", size, weight), className)} {...restProps}>
            {children}
        </Tag>
    );
}

// #region Old compability

export const TextCompat: DiscordText = function TextCompat({ color, variant, ...restProps }) {
    const newBaseTextProps = restProps as BaseTextProps;

    if (variant) {
        const [left, right] = variant.split("/");
        if (left && right) {
            const size = left.split("-").pop();
            newBaseTextProps.size = size as TextSize;
            newBaseTextProps.weight = right as TextWeight;
        }
    }

    if (color) {
        newBaseTextProps.style ??= {};
        newBaseTextProps.style.color = `var(--${color}, var(--text-default))`;
    }

    return <BaseText {...newBaseTextProps} />;
};

// #endregion

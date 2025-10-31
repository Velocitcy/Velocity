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

import "./Heading.css";

import { classes } from "@utils/misc";
import type { ComponentPropsWithoutRef } from "react";

export type HeadingTag = `h${1 | 2 | 3 | 4 | 5 | 6}`;

export type HeadingProps<Tag extends HeadingTag> = ComponentPropsWithoutRef<Tag> & {
    tag?: Tag;
};

/**
 * A simple heading component that automatically sizes according to the tag used.
 *
 * If you need more control, use the BaseText component instead.
 */
export function Heading<T extends HeadingTag>(props: HeadingProps<T>) {
    const {
        tag: Tag = "h5",
        children,
        className,
        ...restProps
    } = props;

    return (
        <Tag className={classes(`vc-${Tag}`, !className && `vc-${Tag}-defaultMargin`, className)} {...restProps}>
            {children}
        </Tag>
    );
}

export function HeadingPrimary({ children, ...restProps }: HeadingProps<"h2">) {
    return (
        <Heading tag="h2" {...restProps}>
            {children}
        </Heading>
    );
}

export function HeadingSecondary({ children, ...restProps }: HeadingProps<"h3">) {
    return (
        <Heading tag="h3" {...restProps}>
            {children}
        </Heading>
    );
}

export function HeadingTertiary({ children, ...restProps }: HeadingProps<"h4">) {
    return (
        <Heading tag="h4" {...restProps}>
            {children}
        </Heading>
    );
}

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

import "./Button.css";

import { classNameFactory } from "@api/Styles";
import { classes } from "@utils/misc";
import type { Button as DiscordButton } from "@vencord/discord-types";
import type { ComponentPropsWithRef, ComponentType } from "react";

import { OpenExternalIcon } from "./Icons";

const btnCls = classNameFactory("vc-btn-");
const textBtnCls = classNameFactory("vc-text-btn-");

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "dangerPrimary"
    | "dangerSecondary"
    | "overlayPrimary"
    | "positive"
    | "link"
    | "none";

export type ButtonSize = "min" | "xs" | "small" | "medium";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ComponentType<any>;
};
export function Button({
    variant = "primary",
    size = "medium",
    children,
    className,
    icon: Icon,
    ...restProps
}: ButtonProps) {
    return (
        <button
            data-mana-component="button"
            className={classes(btnCls("base", variant, size), className)}
            {...restProps}
        >
            {Icon && (
                <span
                    className={btnCls("icon")}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginRight: "6px",
                        marginLeft: "-4px",
                    }}
                >
                    <Icon />
                </span>
            )}
            {children}
            {variant === "link" && !Icon && (
                <span className={btnCls("link-icon")}>
                    {OpenExternalIcon()()}
                </span>
            )}
        </button>
    );
}

// text button
export type TextButtonVariant = "primary" | "secondary" | "danger" | "link";

export type TextButtonProps = ComponentPropsWithRef<"button"> & {
    variant?: TextButtonVariant;
};

export function TextButton({
    variant = "primary",
    className,
    ...restProps
}: TextButtonProps) {
    return (
        <button
            className={classes(textBtnCls("base", variant), className)}
            {...restProps}
        />
    );
}

// #region Old compatibility
export const ButtonCompat: DiscordButton = function ButtonCompat({
    look,
    color = "BRAND",
    size = "medium",
    icon,
    ...restProps
}) {
    return look === "LINK" ? (
        <TextButton
            variant={TextButtonPropsColorMapping[color]}
            {...(restProps as TextButtonProps)}
        />
    ) : (
        <Button
            variant={ButtonColorMapping[color]}
            size={size as ButtonSize}
            icon={icon}
            {...(restProps as ButtonProps)}
        />
    );
};

ButtonCompat.Looks = {
    FILLED: "",
    LINK: "LINK",
} as const;

ButtonCompat.Colors = {
    BRAND: "BRAND",
    PRIMARY: "PRIMARY",
    RED: "RED",
    TRANSPARENT: "TRANSPARENT",
    CUSTOM: "CUSTOM",
    GREEN: "GREEN",
    LINK: "LINK",
    WHITE: "WHITE",
} as const;

const ButtonColorMapping: Record<
    keyof typeof ButtonCompat["Colors"],
    ButtonProps["variant"]
> = {
    BRAND: "primary",
    PRIMARY: "secondary",
    RED: "dangerPrimary",
    TRANSPARENT: "secondary",
    CUSTOM: "none",
    GREEN: "positive",
    LINK: "link",
    WHITE: "overlayPrimary",
};

const TextButtonPropsColorMapping: Record<
    keyof typeof ButtonCompat["Colors"],
    TextButtonProps["variant"]
> = {
    BRAND: "primary",
    PRIMARY: "primary",
    RED: "danger",
    TRANSPARENT: "secondary",
    CUSTOM: "secondary",
    GREEN: "primary",
    LINK: "link",
    WHITE: "secondary",
};

ButtonCompat.Sizes = {
    SMALL: "small",
    MEDIUM: "medium",
    LARGE: "medium",
    XLARGE: "medium",
    NONE: "min",
    MIN: "min",
} as const;
// #endregion

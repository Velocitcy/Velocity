/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./Button.css";

import { classNameFactory } from "@api/Styles";
import type { Button as DiscordButton } from "@discord-types";
import { classes } from "@utils/misc";
import type { ComponentPropsWithRef, ComponentType } from "react";

import { IconTypes, OpenExternalIcon } from "./Icons";

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
                    <Icon {...IconTypes.SMALL} />
                </span>
            )}
            {children}
            {variant === "link" && !Icon && (
                <OpenExternalIcon className={btnCls("link-icon")} {...IconTypes.SMALL} />
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

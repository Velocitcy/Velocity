/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./AddonBadge.css";

import { React } from "@webpack/common";

export const AddonBadgeTypes = {
    BRAND: "BRAND",
    PRIMARY: "PRIMARY",
    DANGER: "DANGER",
    CUSTOM: "CUSTOM"
} as const;

type AddonBadgeType = typeof AddonBadgeTypes[keyof typeof AddonBadgeTypes];

interface AddonBadgeProps {
    text: string;
    color?: string;
    backgroundColor?: string;
    icon?: React.ReactNode;
    type?: AddonBadgeType;
    onClick?: () => void;
}

const AddonBadgeStyles = {
    BRAND: { backgroundColor: "var(--background-mod-strong)", color: "var(--text-secondary)" },
    PRIMARY: { backgroundColor: "var(--brand-500)", color: "var(--white-500)" },
    DANGER: { backgroundColor: "rgba(237, 66, 69, 0.25)", color: "var(--status-danger)" },
    CUSTOM: {} as any
};

export function AddonBadge({ text, color, backgroundColor, icon, type = "CUSTOM", onClick }: AddonBadgeProps) {
    const styles = type !== "CUSTOM" ? AddonBadgeStyles[type] : { backgroundColor, color };

    return (
        <div
            className="vc-addon-badge"
            onClick={onClick}
            style={{
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                alignItems: "center",
                borderRadius: "var(--radius-md)",
                display: "flex",
                marginLeft: "auto",
                padding: "0 6px",
                fontWeight: "bold",
                textTransform: "uppercase",
                cursor: onClick ? "pointer" : "default"
            }}>
            {icon && React.cloneElement(icon as React.ReactElement<any>, { className: "vc-addon-badge-icon" })}
            {text}
        </div>
    );
}

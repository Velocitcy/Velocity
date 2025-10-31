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

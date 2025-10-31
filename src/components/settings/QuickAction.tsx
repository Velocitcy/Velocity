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

import "./QuickAction.css";

import { classNameFactory } from "@api/Styles";
import { Card } from "@webpack/common";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";

const cl = classNameFactory("vc-settings-quickActions-");

export interface QuickActionProps {
    Icon: ComponentType<{ className?: string; }>;
    text: ReactNode;
    action?: () => void;
    disabled?: boolean;
}

export function QuickAction(props: QuickActionProps) {
    const { Icon, action, text, disabled } = props;

    return (
        <button className={cl("pill")} onClick={action} disabled={disabled}>
            <Icon className={cl("img")} />
            {text}
        </button>
    );
}

export function QuickActionCard(props: PropsWithChildren) {
    return (
        <Card className={cl("card")}>
            {props.children}
        </Card>
    );
}

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

import "./FormSwitch.css";

import { classes } from "@utils/misc";
import type { PropsWithChildren, ReactNode } from "react";

import { Divider } from "./Divider";
import { Span } from "./Span";
import { Switch } from "./Switch";

export interface FormSwitchProps {
    title: ReactNode;
    description?: ReactNode;
    value: boolean;
    onChange(value: boolean): void;

    className?: string;
    disabled?: boolean;
    hideBorder?: boolean;
}

export function FormSwitch({ onChange, title, value, description, disabled, className, hideBorder }: FormSwitchProps) {
    return (
        <div className="vc-form-switch-wrapper">
            <div className={classes("vc-form-switch", className, disabled && "vc-form-switch-disabled")}>
                <div className={"vc-form-switch-text"}>
                    <Span size="md" weight="medium">{title}</Span>
                    {description && <Span size="sm" weight="normal">{description}</Span>}
                </div>

                <Switch checked={value} onChange={onChange} disabled={disabled} />
            </div>
            {!hideBorder && <Divider className="vc-form-switch-border" />}
        </div>
    );
}

// #region Old compatibility

export function FormSwitchCompat({ note, children, ...restProps }: PropsWithChildren<any>) {
    return <FormSwitch title={children ?? ""} description={note} {...restProps} />;
}

// #endregion

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

import { BaseText } from "@components/BaseText";
import ErrorBoundary from "@components/ErrorBoundary";
import { handleComponentFailed } from "@components/handleComponentFailed";
import { Margins } from "@components/margins";
import { onlyOnce } from "@utils/onlyOnce";
import { findComponentByCodeLazy } from "@webpack";
import { React } from "@webpack/common";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";

const Spinner = findComponentByCodeLazy("wanderingCubes", "aria-label");

export function SettingsTab({ title, icon, children }: PropsWithChildren<{ title?: string; icon?: ReactNode; }>) {
    if (!children) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px"
            }}>
                <Spinner type="wanderingCubes" />
            </div>
        );
    }

    return (
        <section>
            {title && (
                <BaseText tag="h2" size="xl" weight="semibold" className={Margins.bottom16}>
                    <div className="vc-settings-tab-title">
                        {icon && <span className="vc-settings-tab-icon">{icon}</span>}
                        <span>{title}</span>
                    </div>
                </BaseText>
            )}
            {children}
        </section>
    );
}

export const handleSettingsTabError = onlyOnce(handleComponentFailed);

export function wrapTab(component: ComponentType<any>, tab: string) {
    return ErrorBoundary.wrap(component, {
        message: `Failed to render the ${tab} tab. If this issue persists, try using the installer to reinstall!`,
        onError: handleSettingsTabError,
    });
}

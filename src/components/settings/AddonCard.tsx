/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Velocities and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./AddonCard.css";

import { classNameFactory } from "@api/Styles";
import { AddonBadge } from "@components/settings/AddonBadge";
import { Switch } from "@components/Switch";
import { Text, useRef } from "@webpack/common";
import type { MouseEventHandler, ReactNode } from "react";

const cl = classNameFactory("vc-addon-");

interface Props {
    name: ReactNode;
    description: ReactNode;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    disabled?: boolean;
    isNew?: boolean;
    badge?: ReactNode;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;

    infoButton?: ReactNode;
    footer?: ReactNode;
    author?: ReactNode;
}

export function AddonCard({ disabled, isNew, badge, name, infoButton, footer, author, enabled, setEnabled, description, onMouseEnter, onMouseLeave }: Props) {
    const titleRef = useRef<HTMLDivElement>(null);
    const titleContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className={cl("card", { "card-disabled": disabled })}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={cl("header")}>
                <div className={cl("name-author")}>
                    <Text variant="text-md/bold" className={cl("name")}>
                        <div ref={titleContainerRef} className={cl("title-container")}>
                            <div
                                ref={titleRef}
                                className={cl("title")}
                                onMouseOver={() => {
                                    const title = titleRef.current!;
                                    const titleContainer = titleContainerRef.current!;

                                    title.style.setProperty("--offset", `${titleContainer.clientWidth - title.scrollWidth}px`);
                                    title.style.setProperty("--duration", `${Math.max(0.5, (title.scrollWidth - titleContainer.clientWidth) / 7)}s`);
                                }}
                            >
                                {name}
                            </div>
                        </div>
                        {isNew && <AddonBadge text="NEW" backgroundColor="#ED4245" />}
                        {badge}
                    </Text>

                    {!!author && (
                        <Text variant="text-md/normal" className={cl("author")}>
                            {author}
                        </Text>
                    )}
                </div>

                {infoButton}

                <Switch
                    checked={enabled}
                    onChange={setEnabled}
                    disabled={disabled}
                />
            </div>

            <Text className={cl("note")} variant="text-sm/normal">{description}</Text>

            {footer}
        </div>
    );
}

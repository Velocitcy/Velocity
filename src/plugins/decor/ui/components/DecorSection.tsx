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

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { findComponentByCodeLazy } from "@webpack";
import { useEffect } from "@webpack/common";

import { useAuthorizationStore } from "../../lib/stores/AuthorizationStore";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import { cl } from "../";
import { openChangeDecorationModal } from "../modals/ChangeDecorationModal";

const CustomizationSection = findComponentByCodeLazy(".customizationSectionBackground");

export interface DecorSectionProps {
    hideTitle?: boolean;
    hideDivider?: boolean;
    noMargin?: boolean;
}

export default function DecorSection({ hideTitle = false, hideDivider = false, noMargin = false }: DecorSectionProps) {
    const authorization = useAuthorizationStore();
    const { selectedDecoration, select: selectDecoration, fetch: fetchDecorations } = useCurrentUserDecorationsStore();

    useEffect(() => {
        if (authorization.isAuthorized()) fetchDecorations();
    }, [authorization.token]);

    return <CustomizationSection
        title={!hideTitle && "Decor"}
        hasBackground={true}
        hideDivider={hideDivider}
        className={noMargin && cl("section-remove-margin")}
    >
        <Flex style={{ gap: "4px " }}>
            <Button
                onClick={() => {
                    if (!authorization.isAuthorized()) {
                        authorization.authorize().then(openChangeDecorationModal).catch(() => { });
                    } else openChangeDecorationModal();
                }}
                variant="primary"
                size="small"
            >
                Change Decoration
            </Button>
            {selectedDecoration && authorization.isAuthorized() && <Button
                onClick={() => selectDecoration(null)}
                variant="secondary"
                size={"small"}
            >
                Remove Decoration
            </Button>}
        </Flex>
    </CustomizationSection>;
}

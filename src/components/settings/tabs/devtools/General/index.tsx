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

import { Flex } from "@components/Flex";
import { classes } from "@utils/misc";
import { Card, FormNotice } from "@webpack/common";

export function GeneralTab() {
    return (
        <>
            <Card className={classes("vc-card", "vc-warning-card")}>
                <Flex flexDirection="column">
                    <strong>Warning</strong>
                    <span>
                        DevTools are test components from Discord. Some of them may not work or crash your client.
                    </span>
                </Flex>
            </Card>

            <FormNotice messageType="info" textColor="text-feedback-info">
                Only use this page if you know what you're doing.
            </FormNotice>
        </>
    );
}

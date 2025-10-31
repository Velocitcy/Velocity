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
import { Card, FormNotice, RadioGroup, useState } from "@webpack/common";

export function GeneralTab() {
    const [selectedValue, setSelectedValue] = useState("option1");

    return (
        <>
            <Card className={classes("vc-card", "vc-warning-card")}>
                <Flex flexDirection="column">
                    <strong>Warning</strong>
                    <span>DevTools are test components from discord. Some of them may not work or crash your discord client.</span>
                </Flex>
            </Card>

            <FormNotice messageType="danger" textColor="text-feedback-danger">
                Only use this page if you know what you're doing.
            </FormNotice>

            <RadioGroup.Gu
                value={selectedValue}
                options={[
                    { name: "Option 1", value: "option1" },
                    { name: "Option 2", value: "option2" },
                    { name: "Option 3", value: "option3" }
                ]}
                onChange={option => {
                    console.log("onChange received:", option);
                    setSelectedValue(option.value);
                }}
            />
        </>
    );
}

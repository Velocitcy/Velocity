/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createAndAppendStyle } from "@utils/css";

import { generateTextCss } from "./BaseText";
import { generateMarginCss } from "./margins";

export function addVelocityUiStyles() {
    createAndAppendStyle("velocity-text", document.body).textContent = generateTextCss();
    createAndAppendStyle("velocity-margins").textContent = generateMarginCss();
}
